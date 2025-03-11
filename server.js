require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const produtosRouter = require('./routes/produtos');
const caracteristicasRouter = require('./routes/caracteristicas');
const prodcaractRouter = require('./routes/prodcaract');
const excluirCaracteristicaRouter = require('./routes/excluirCaracteristica'); // Importa a rota de exclusão
const uploadImageRouter = require('./routes/uploadImage'); // Importa a rota de upload de imagem

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use(express.static(path.join(__dirname)));

app.use('/api/produtos', produtosRouter);
app.use('/api/caracteristicas', caracteristicasRouter);
app.use('/api/prodcaract', prodcaractRouter);
app.use('/api/excluir-caracteristica', excluirCaracteristicaRouter); // Registra o endpoint
app.use('/api/uploadImage', uploadImageRouter); // Registra o endpoint de upload de imagem

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
