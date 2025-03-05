document.getElementById('btnAtualizarCSV').addEventListener('click', async () => {
  try {
    const response = await fetch('http://localhost:5001/api/produtos/generate-csv');
    const result = await response.json();
    if (result.success) {
      window.location.reload();
    } else {
      alert('Erro ao atualizar CSV.');
    }
  } catch (error) {
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

function searchInCSV(produtos, term) {
  const tokens = term.toLowerCase().split(/\s+/);
  return produtos.filter(produto => {
    const campos = [
      produto.codigo || "",
      produto.codigo_produto || "",
      produto.descr_detalhada || "",
      produto.descricao || ""
    ].map(campo => campo.toLowerCase());
    return tokens.every(token => campos.some(campo => campo.includes(token)));
  });
}

// Função para exibir o card expandido (modal) – permanece para exibição do card ao clicar
function showCardModal(cardElement) {
  const modal = document.getElementById('cardModal');
  const modalBody = document.getElementById('cardModalBody');
  modalBody.innerHTML = "";

  // Cria um container para o card expandido
  const container = document.createElement('div');
  container.className = 'expanded-card-container';

  // Clona o card original e adiciona ao container
  const clone = cardElement.cloneNode(true);
  container.appendChild(clone);

  // Insere o botão flutuante (se ainda desejar) no container
  const floatingMenu = createFloatingButtonMenu();
  container.appendChild(floatingMenu);

  // Adiciona o container ao corpo do modal e exibe-o
  modalBody.appendChild(container);
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
    
    const cardTop = document.createElement('div');
    cardTop.className = 'card-top';
    const img = document.createElement('img');
    img.src = result.url_imagem ? result.url_imagem : 'img/logo.png';
    img.onerror = function() {
      this.src = 'img/logo.png';
    }
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

    // Removida a criação do menu flutuante (botões de Editar, PIR e Estrutura de Produto)

    card.addEventListener('click', function(e) {
      showCardModal(card);
    });
    
    cardsContainer.appendChild(card);
  });
  resultsContainer.appendChild(cardsContainer);
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

/**
* Adiciona um ouvinte de evento ao elemento com o id 'btnAtualizarCSV' para manipular um evento de clique.
* Quando o botão é clicado, ele envia uma solicitação de busca para uma URL especificada para atualizar um arquivo CSV.
* Se a solicitação for bem-sucedida, ele recarrega a página. Se houver um erro, ele exibe uma mensagem de alerta.
* @returns Nenhum
 */
document.getElementById('btnAtualizarCSV').addEventListener('click', async () => {
  try {
    const response = await fetch('https://intranet-fromtherm.onrender.com/api/produtos/generate-csv'); // Substitua pelo seu domínio no Render
    const result = await response.json();
    if (result.success) {
      window.location.reload();
    } else {
      alert('Erro ao atualizar CSV.');
    }
  } catch (error) {
    alert('Erro ao atualizar CSV. Verifique o console.');
  }
});

window.onload = async function() {
  produtosData = await loadCSV();
};

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