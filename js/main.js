// main.js
import { showCardModal } from './modal.js';
import { toggleEditMode } from './editFields.js';
import { loadCSV, searchInCSV, fetchDetalhes } from './utils.js';

let produtosData = [];

document.getElementById('btnAtualizarCSV').addEventListener('click', async () => {
  try {
    const hostname = window.location.hostname;
    const endpoint =
      (hostname === 'localhost' || hostname === '127.0.0.1')
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

    const cardTop = document.createElement('div');
    cardTop.className = 'card-top';
    const img = document.createElement('img');
    img.src = result.url_imagem || 'img/logo.png';
    img.onerror = () => { img.src = 'img/logo.png'; };
    img.alt = 'Produto';
    cardTop.appendChild(img);

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
    card.dataset.unidade = result.unidade || '';

    card.addEventListener('click', async () => {
      const codigoProduto = result.codigo;
      const omieData = await fetchDetalhes(codigoProduto);
      showCardModal(card, omieData);
    });

    cardsContainer.appendChild(card);
  });
  resultsContainer.appendChild(cardsContainer);
}

document.getElementById('inpt_search').addEventListener('input', function() {
  const term = this.value.trim();
  if (!term) {
    document.getElementById('searchResults').innerHTML = '';
    return;
  }
  const results = searchInCSV(produtosData, term);
  displayResults(results);
});

document.getElementById('inpt_search').addEventListener('focus', function() {
  this.parentElement.classList.add('active');
});
document.getElementById('inpt_search').addEventListener('blur', function() {
  if (!this.value) {
    this.parentElement.classList.remove('active');
  }
});

(async function initialize() {
  produtosData = await loadCSV();
  console.log("produtosData carregados:", produtosData);
})();
