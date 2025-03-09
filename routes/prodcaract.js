// routes/prodcaract.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { OMIE_APP_KEY, OMIE_APP_SECRET } = require('../config.js');

// Endpoint proxy para IncluirCaractProduto na Omie
router.post('/', async (req, res) => {
  const payload = {
    call: "IncluirCaractProduto",
    param: req.body.param, // Espera que o client envie os dados dentro de "param"
    app_key: OMIE_APP_KEY,
    app_secret: OMIE_APP_SECRET
  };

  console.log("Payload enviado para Omie:", JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(
      'https://app.omie.com.br/api/v1/geral/prodcaract/',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log("Resposta da Omie:", response.data);
    res.json(response.data);
  } catch (error) {
    console.error("Erro ao incluir característica:", error.message);
    if (error.response && error.response.data) {
      console.error("Detalhes do erro:", error.response.data);
    }
    res.status(500).json({ error: 'Erro ao incluir característica na Omie' });
  }
});

module.exports = router;
