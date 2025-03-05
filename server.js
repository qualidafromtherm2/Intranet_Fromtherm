const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Importa o módulo CORS

const app = express();
const PORT = process.env.PORT || 5001;

// Chaves da API da Omie
const OMIE_APP_KEY = '3917057082939';
const OMIE_APP_SECRET = '11e503358e3ae0bee91053faa1323629';

// Habilita o CORS para todas as origens
app.use(cors());

// Função para aguardar um tempo em milissegundos
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função para fazer uma requisição com retry
async function axiosPostWithRetry(url, payload, options, retries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await axios.post(url, payload, options);
    } catch (error) {
      if (error.code === 'ECONNRESET' || error.code === 'ERR_NETWORK') {
        console.error(`Tentativa ${attempt} falhou com ECONNRESET. Retentando em ${delayMs} ms...`);
        await delay(delayMs);
      } else {
        throw error;
      }
    }
  }
  throw new Error('Número máximo de tentativas excedido');
}

// Função para achatar (flatten) um objeto aninhado e garantir que as chaves estejam limpas
function flattenObject(obj, prefix = '') {
  let flattened = {};
  for (let key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      let trimmedKey = key.trim();
      let value = obj[key];
      let newKey = prefix ? `${prefix}_${trimmedKey}` : trimmedKey;
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          // Converte arrays para string JSON
          flattened[newKey] = JSON.stringify(value);
        } else {
          Object.assign(flattened, flattenObject(value, newKey));
        }
      } else {
        flattened[newKey] = value;
      }
    }
  }
  return flattened;
}

// Defina apenas os cabeçalhos desejados, incluindo "url_imagem"
const fixedHeaders = [
  "codigo",
  "codigo_produto",
  "descr_detalhada",
  "descricao",
  "url_imagem"
];

function convertToCSV(data) {
  // Achata cada registro para transformar objetos aninhados em chaves planas
  const flattenedData = data.map(item => {
    const flat = flattenObject(item);
    // Extrai "url_imagem" a partir do campo "imagens", se existir
    if (flat.imagens) {
      try {
        let arr = JSON.parse(flat.imagens);
        if (Array.isArray(arr) && arr.length > 0 && arr[0].url_imagem) {
          flat.url_imagem = arr[0].url_imagem;
        } else {
          flat.url_imagem = '';
        }
      } catch (e) {
        console.error("Erro ao parsear o campo imagens:", e);
        flat.url_imagem = '';
      }
    } else {
      flat.url_imagem = '';
    }
    return flat;
  });
  
  // Gera as linhas do CSV usando apenas os cabeçalhos definidos
  const rows = flattenedData.map(item => {
    return fixedHeaders.map(header => {
      let val = item[header] !== undefined ? item[header] : '';
      // Encapsula em aspas se o valor contiver vírgulas
      if (typeof val === 'string' && val.includes(',')) {
        val = `"${val}"`;
      }
      return val;
    }).join(',');
  });
  
  return fixedHeaders.join(',') + '\n' + rows.join('\n');
}

// Endpoint para gerar o CSV com todos os dados
app.get('/api/produtos/generate-csv', async (req, res) => {
  try {
    const createPayload = (page) => ({
      call: "ListarProdutos",
      param: [
        {
          pagina: page,
          registros_por_pagina: 50,
          apenas_importado_api: "N",
          filtrar_apenas_omiepdv: "N",
          exibir_obs: "S", // Solicita observações, que pode incluir descr_detalhada
          inativo: "N"
        }
      ],
      app_key: OMIE_APP_KEY,
      app_secret: OMIE_APP_SECRET
    });

    // Requisição para a primeira página
    const response1 = await axiosPostWithRetry(
      'https://app.omie.com.br/api/v1/geral/produtos/',
      createPayload(1),
      { headers: { 'Content-type': 'application/json' } }
    );

    const dados1 = response1.data;
    let totalPages = dados1.total_de_paginas;
    let produtosAll = dados1.produto_servico_cadastro || [];

    console.log(`Total de páginas: ${totalPages}`);
    console.log(`Total de produtos na primeira página: ${produtosAll.length}`);

    // Lista com as páginas restantes
    const pages = [];
    for (let page = 2; page <= totalPages; page++) {
      pages.push(page);
    }

    // Processa as requisições em lotes de 3 páginas para respeitar o rate limit
    const processPagesInChunks = async (pages, chunkSize = 3) => {
      for (let i = 0; i < pages.length; i += chunkSize) {
        const chunk = pages.slice(i, i + chunkSize);
        const requests = chunk.map(page =>
          axiosPostWithRetry(
            'https://app.omie.com.br/api/v1/geral/produtos/',
            createPayload(page),
            { headers: { 'Content-type': 'application/json' } },
            3,
            1500
          )
        );
        const results = await Promise.allSettled(requests);
        results.forEach(result => {
          if (result.status === 'fulfilled') {
            const dados = result.value.data;
            if (dados.produto_servico_cadastro) {
              produtosAll = produtosAll.concat(dados.produto_servico_cadastro);
            }
          } else {
            console.error('Erro em uma requisição:', result.reason);
          }
        });
        console.log(`Lote de páginas ${chunk[0]} a ${chunk[chunk.length - 1]} processado.`);
        await delay(1000);
      }
    };

    await processPagesInChunks(pages);

    console.log('Total de produtos carregados:', produtosAll.length);

    // Converte os dados para CSV utilizando a ordem fixa dos cabeçalhos
    const csvData = convertToCSV(produtosAll);

    // Salva o CSV no arquivo "produtos.csv"
    const csvFilePath = path.join(__dirname, 'produtos.csv');
    fs.writeFileSync(csvFilePath, csvData, 'utf8');

    console.log('Arquivo CSV salvo com sucesso:', csvFilePath);
    res.json({ success: true, message: 'CSV gerado com sucesso!' });
  } catch (error) {
    console.error("Erro ao gerar o CSV:", error.message);
    res.status(500).json({ success: false, error: 'Erro ao gerar o CSV' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
