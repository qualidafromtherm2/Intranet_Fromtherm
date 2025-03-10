// backend/server.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware para interpretar JSON e servir arquivos estáticos
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Exemplo de armazenamento dummy (em memória)
// Em um projeto real, você substituiria isso por um banco de dados ou integração com APIs.
let spreadsheetData = {
  headers: ["Nº PI", "VALOR PI", "SALDO PAGAR"],
  rows: [
    ["PI001", "$1,000.00", "$1,000.00"],
    // Outros registros podem ser adicionados aqui.
  ]
};

// Rota para obter os dados (equivalente a getSpreadsheetData)
app.get('/api/spreadsheetData', (req, res) => {
  res.json(spreadsheetData);
});

// Rota para salvar os dados (equivalente a saveFormData)
// Essa rota recebe um JSON com os dados do formulário e atualiza o armazenamento dummy.
app.post('/api/saveData', (req, res) => {
  const formData = req.body;
  console.log("Recebendo dados:", formData);
  
  // Exemplo simples: adiciona um novo registro (na prática, você validaria e atualizaria registros existentes)
  const newRow = spreadsheetData.headers.map(header => formData[header] || "");
  spreadsheetData.rows.push(newRow);
  
  res.json({ message: "Dados salvos com sucesso!" });
});

// Outras rotas (update, delete, etc.) podem ser criadas conforme a necessidade.

// Rota para servir a página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
