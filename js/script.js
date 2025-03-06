document.getElementById('btnAtualizarCSV').addEventListener('click', async () => {
  try {
    // Verifica o hostname atual e define o endpoint correspondente.
    const hostname = window.location.hostname;
    const endpoint = (hostname === 'localhost' || hostname === '127.0.0.1')
      ? 'http://localhost:5001/api/produtos/generate-csv'
      : 'https://intranet-fromtherm.onrender.com/api/produtos/generate-csv';
      
    const response = await fetch(endpoint);
    const result = await response.json();
    if (result.success) {
      window.location.reload();
    } else {
      alert('Erro ao atualizar CSV.');
    }
  } catch (error) {
    console.error(error);
    alert('Erro ao atualizar CSV. Verifique o console.');
  }
});

let produtosData = [];

async function loadCSV() {
  try {
    const response = await fetch('./produtos.csv');
    const csvText = await response.text();
    const parsed = Papa.parse(csvText, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      trim: true
    });
    if (parsed.errors.length) return [];
    return parsed.data;
  } catch (error) {
    return [];
  }
}

// Função searchInCSV:
// Esta função realiza a busca de um termo (term) nos dados do CSV contidos no array "produtos".
// Ela compara o termo com alguns campos específicos de cada objeto produto (como codigo, codigo_produto, descr_detalhada e descricao)
// e retorna apenas aqueles produtos que contêm todos os tokens do termo em ao menos um dos campos.
function searchInCSV(produtos, term) {
  // Converte o termo de busca para letras minúsculas e divide em tokens (palavras) utilizando espaços como separadores.
  const tokens = term.toLowerCase().split(/\s+/);
  
  // Filtra o array de produtos:
  // Para cada produto, verifica se TODOS os tokens da busca estão presentes em pelo menos um dos campos definidos.
  return produtos.filter(produto => {
    // Define os campos que serão pesquisados. Caso o campo não exista (undefined ou null), utiliza uma string vazia.
    // Em seguida, converte cada campo para letras minúsculas para uma comparação "case insensitive".
    const campos = [
      produto.codigo || "",
      produto.codigo_produto || "",
      produto.descr_detalhada || "",
      produto.descricao || ""
    ].map(campo => campo.toLowerCase());
    
    // Para o produto atual, verifica se cada token está presente em pelo menos um dos campos.
    // tokens.every: retorna true somente se todos os tokens satisfazem a condição.
    // campos.some: verifica se algum dos campos contém (includes) o token.
    return tokens.every(token => campos.some(campo => campo.includes(token)));
  });
}

// Função para exibir o card expandido (modal) – permanece para exibição do card ao clicar
function showCardModal(cardElement, omieData) {
  const modal = document.getElementById('cardModal');
  const modalBody = document.getElementById('cardModalBody');

  // Limpa o conteúdo anterior do modal
  modalBody.innerHTML = "";

  // Cria container para o card expandido
  const container = document.createElement('div');
  container.className = 'expanded-card-container';

  // Clona o card original (se quiser manter a parte visual inicial)
  const clone = cardElement.cloneNode(true);

  // Localiza a div.card-info dentro do clone
  const clonedCardInfo = clone.querySelector('.card-info');

  if (clonedCardInfo && omieData) {
    // Extraia os campos da resposta Omie:
    const {
      unidade,
      ncm,
      ean,
      valor_unitario,
      tipoItem,
      descr_detalhada,
      descricao_familia,
      quantidade_estoque,
      bloqueado,
      inativo
    } = omieData;

    // A data de inclusão e última alteração vêm de omieData.info (omieData.info.dInc / omieData.info.dAlt):
    const dataInclusao = omieData?.info?.dInc || '';
    const dataUltimaAlteracao = omieData?.info?.dAlt || '';

    // "caracteristicas" é array: [{ cNomeCaract, cConteudo }, ...]
    let caracteristicaTexto = '';
    let conteudoTexto = '';
    if (Array.isArray(omieData.caracteristicas) && omieData.caracteristicas.length > 0) {
      // Exemplo: pegar a primeira
      caracteristicaTexto = omieData.caracteristicas[0].cNomeCaract || '';
      conteudoTexto       = omieData.caracteristicas[0].cConteudo   || '';
      
      // Ou, se você quiser concatenar todos, algo tipo:
      // caracteristicaTexto = omieData.caracteristicas.map(c => c.cNomeCaract).join(', ');
      // conteudoTexto       = omieData.caracteristicas.map(c => c.cConteudo).join(', ');
    }

    // Cria os elementos <p> e preenche
    const unidadeEl = document.createElement('p');
    unidadeEl.innerHTML = `<strong>Unidade:</strong> ${unidade || ''}`;

    const ncmEl = document.createElement('p');
    ncmEl.innerHTML = `<strong>NCM:</strong> ${ncm || ''}`;

    const eanEl = document.createElement('p');
    eanEl.innerHTML = `<strong>EAN:</strong> ${ean || ''}`;

    const valorUnitarioEl = document.createElement('p');
    valorUnitarioEl.innerHTML = `<strong>Valor Unitário:</strong> ${valor_unitario || ''}`;

    const tipoItemEl = document.createElement('p');
    tipoItemEl.innerHTML = `<strong>Tipo Item:</strong> ${tipoItem || ''}`;

    const caracteristicaEl = document.createElement('p');
    caracteristicaEl.innerHTML = `<strong>Característica:</strong> ${caracteristicaTexto}`;

    const conteudoEl = document.createElement('p');
    conteudoEl.innerHTML = `<strong>Conteúdo:</strong> ${conteudoTexto}`;

    const dataInclusaoEl = document.createElement('p');
    dataInclusaoEl.innerHTML = `<strong>Data de inclusão:</strong> ${dataInclusao}`;

    const dataUltAltEl = document.createElement('p');
    dataUltAltEl.innerHTML = `<strong>Data da última alteração:</strong> ${dataUltimaAlteracao}`;

    const descFamiliaEl = document.createElement('p');
    descFamiliaEl.innerHTML = `<strong>Descrição da família:</strong> ${descricao_familia || ''}`;

    const qtdEstoqueEl = document.createElement('p');
    qtdEstoqueEl.innerHTML = `<strong>Quantidade no estoque:</strong> ${quantidade_estoque || ''}`;

    const bloqueadoEl = document.createElement('p');
    bloqueadoEl.innerHTML = `<strong>Bloqueado:</strong> ${bloqueado || ''}`;

    const inativoEl = document.createElement('p');
    inativoEl.innerHTML = `<strong>Inativo:</strong> ${inativo || ''}`;

    // Anexa tudo ao .card-info do clone (ou no container)
    clonedCardInfo.appendChild(unidadeEl);
    clonedCardInfo.appendChild(ncmEl);
    clonedCardInfo.appendChild(eanEl);
    clonedCardInfo.appendChild(valorUnitarioEl);
    clonedCardInfo.appendChild(tipoItemEl);
    clonedCardInfo.appendChild(caracteristicaEl);
    clonedCardInfo.appendChild(conteudoEl);
    clonedCardInfo.appendChild(dataInclusaoEl);
    clonedCardInfo.appendChild(dataUltAltEl);
    clonedCardInfo.appendChild(descFamiliaEl);
    clonedCardInfo.appendChild(qtdEstoqueEl);
    clonedCardInfo.appendChild(bloqueadoEl);
    clonedCardInfo.appendChild(inativoEl);
  }

  // Adiciona o clone no container
  container.appendChild(clone);

  // (Opcional) Se você quiser o menu flutuante:
  const floatingMenu = createFloatingButtonMenu();
  container.appendChild(floatingMenu);

  // Adiciona o container ao corpo do modal
  modalBody.appendChild(container);

  // Exibe o modal
  modal.style.display = "flex";
}


document.querySelector('.card-modal-close').addEventListener('click', function() {
  document.getElementById('cardModal').style.display = "none";
});
document.getElementById('cardModal').addEventListener('click', function(e) {
  if (e.target === this) this.style.display = "none";
});



/**
 * Display search results on the webpage by creating and appending card elements for each result.
 * @param {Array} results - An array of objects representing search results to display.
 * @returns None
 */
function displayResults(results) {
  const resultsContainer = document.getElementById('searchResults');
  resultsContainer.innerHTML = '';
  if (results.length === 0) {
    resultsContainer.innerHTML = '<p>Nenhum resultado encontrado</p>';
    return;
  }

  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'cards grid-row';

  results.forEach(result => {
    const card = document.createElement('div');
    card.className = 'card';

    // Topo do Card (imagem)
    const cardTop = document.createElement('div');
    cardTop.className = 'card-top';
    const img = document.createElement('img');
    img.src = result.url_imagem || 'img/logo.png';
    img.onerror = function() {
      this.src = 'img/logo.png';
    };
    img.alt = 'Produto';
    cardTop.appendChild(img);

    // Informações do Card (somente campos que você quer ver no modo fechado)
    const cardInfo = document.createElement('div');
    cardInfo.className = 'card-info';

    const title = document.createElement('h2');
    title.style.fontWeight = 'bold';
    title.textContent = result.codigo || 'Sem código';

    const subtitle = document.createElement('p');
    subtitle.className = 'subtitle';
    subtitle.textContent = result.descricao || 'Sem descrição';

    const detalhado = document.createElement('p');
    detalhado.textContent = result.descr_detalhada || 'Sem descrição detalhada';

    cardInfo.appendChild(title);
    cardInfo.appendChild(subtitle);
    cardInfo.appendChild(detalhado);

    card.appendChild(cardTop);
    card.appendChild(cardInfo);

    // === GUARDA OS DADOS EXTRAS EM data-* (não aparecem no card fechado)
    card.dataset.unidade = result.unidade || '';
    card.dataset.ncm = result.ncm || '';
    card.dataset.ean = result.ean || '';
    card.dataset.valorUnitario = result.valor_unitario || '';
    card.dataset.tipoItem = result.tipo_item || '';
    card.dataset.caracteristica = result.caracteristica || '';
    card.dataset.conteudo = result.conteudo || '';
    card.dataset.dataInclusao = result.data_inclusao || '';
    card.dataset.dataUltimaAlteracao = result.data_ultima_alteracao || '';
    card.dataset.descricaoFamilia = result.descricao_familia || '';
    card.dataset.quantidadeEstoque = result.quantidade_estoque || '';
    card.dataset.bloqueado = result.bloqueado || '';
    card.dataset.inativo = result.inativo || '';

    // Evento para exibir o modal ao clicar
    card.addEventListener('click', async function() {
      const codigoProduto = result.codigo; // Exemplo: "04.MP.N.61016"
      // Busque dados detalhados da Omie
      const omieData = await fetchDetalhes(codigoProduto);
      // Agora sim, abra o modal com esses dados
      showCardModal(card, omieData);
    });

    cardsContainer.appendChild(card);
  });

  resultsContainer.appendChild(cardsContainer);
}


async function fetchDetalhes(codigo) {
  try {
    const response = await fetch(`/api/produtos/detalhes/${encodeURIComponent(codigo)}`);
    if (!response.ok) {
      throw new Error('Erro ao consultar detalhes do produto');
    }
    const data = await response.json();
    return data; // Retorna o objeto que veio da Omie
  } catch (err) {
    console.error(err);
    return null;
  }
}

document.getElementById('inpt_search').addEventListener('input', function() {
  const term = this.value.trim();
  if (term.length === 0) {
    document.getElementById('searchResults').innerHTML = '';
    return;
  }
  const results = searchInCSV(produtosData, term);
  displayResults(results);
});

document.getElementById('inpt_search').addEventListener('focus', function() {
  this.parentElement.classList.add('active');
});
/**
* Adiciona um ouvinte de evento ao campo de entrada com o id 'inpt_search' que dispara
* quando o campo de entrada perde o foco. Se o campo de entrada estiver vazio, ele remove a classe 'active'
* de seu elemento pai.
*/
document.getElementById('inpt_search').addEventListener('blur', function() {
  if (this.value.length === 0) {
    this.parentElement.classList.remove('active');
  }
});



function createFloatingButtonMenu() {
  // Cria o container principal
  const navDiv = document.createElement('div');
  navDiv.className = 'nav';

  // Adicione o HTML interno com os ícones
  // Pode remover ou adicionar mais <a> conforme sua preferência
  navDiv.innerHTML = `
    <a href="#profile" class="nav-item nav-count-1">
      <i class="ion-ios-person-outline"></i>
    </a>
    <a href="#compose" class="nav-item nav-count-2">
      <i class="ion-ios-compose-outline"></i>
    </a>
    <a href="#chats" class="nav-item nav-count-3">
      <i class="ion-ios-chatboxes-outline"></i>
    </a>
    <a href="#alarm" class="nav-item nav-count-4">
      <i class="ion-ios-alarm-outline"></i>
    </a>
    <a href="#toggle" class="mask">
      <i class="ion-ios-plus-empty"></i>
    </a>
  `;

  // Adiciona o listener para abrir/fechar o menu quando clicar no “+”
  const maskBtn = navDiv.querySelector('.mask');
  maskBtn.addEventListener('click', (e) => {
    e.preventDefault();
    navDiv.classList.toggle('active');
  });

  return navDiv;
}

const mainMenu = document.querySelector('.main-menu');
const searchResults = document.getElementById('searchResults');

// Função que atualiza o left com base no estado do menu
function updateSearchResultsLeft() {
  if (mainMenu.classList.contains('expanded')) {
    // Quando o menu está aberto (expandido), desloca os cards para a direita
    searchResults.style.left = '270px';
  } else {
    // Quando o menu está fechado, o left fica 75px
    searchResults.style.left = '150px';
  }
}

// Se o menu abre com hover, por exemplo:
mainMenu.addEventListener('mouseenter', () => {
  mainMenu.classList.add('expanded');
  updateSearchResultsLeft();
});
mainMenu.addEventListener('mouseleave', () => {
  mainMenu.classList.remove('expanded');
  updateSearchResultsLeft();
});
window.addEventListener('resize', updateSearchResultsLeft);

// Atualiza uma vez ao carregar a página
updateSearchResultsLeft();

// Carrega o CSV e popula a variável produtosData ao carregar a página
(async function initialize() {
  produtosData = await loadCSV();
  console.log("produtosData carregados:", produtosData);
})();
