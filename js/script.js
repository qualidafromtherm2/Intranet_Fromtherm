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

  // Limpa o conteúdo anterior do modal
  modalBody.innerHTML = "";

  // Cria container para o card expandido
  const container = document.createElement('div');
  container.className = 'expanded-card-container';

  // Clona o card original
  const clone = cardElement.cloneNode(true);

  // Localiza a div.card-info dentro do clone
  const clonedCardInfo = clone.querySelector('.card-info');
  if (clonedCardInfo) {
    // Cria os campos adicionais logo abaixo do texto detalhado
    const unidade = document.createElement('p');
    unidade.innerHTML = `<strong>Unidade:</strong> ${cardElement.dataset.unidade}`;

    const ncm = document.createElement('p');
    ncm.innerHTML = `<strong>NCM:</strong> ${cardElement.dataset.ncm}`;

    const ean = document.createElement('p');
    ean.innerHTML = `<strong>EAN:</strong> ${cardElement.dataset.ean}`;

    const valorUnitario = document.createElement('p');
    valorUnitario.innerHTML = `<strong>Valor Unitário:</strong> ${cardElement.dataset.valorUnitario}`;

    const tipoItem = document.createElement('p');
    tipoItem.innerHTML = `<strong>Tipo Item:</strong> ${cardElement.dataset.tipoItem}`;

    const caracteristica = document.createElement('p');
    caracteristica.innerHTML = `<strong>Característica:</strong> ${cardElement.dataset.caracteristica}`;

    const conteudo = document.createElement('p');
    conteudo.innerHTML = `<strong>Conteúdo:</strong> ${cardElement.dataset.conteudo}`;

    const dataInclusao = document.createElement('p');
    dataInclusao.innerHTML = `<strong>Data de inclusão:</strong> ${cardElement.dataset.dataInclusao}`;

    const dataUltimaAlteracao = document.createElement('p');
    dataUltimaAlteracao.innerHTML = `<strong>Data da última alteração:</strong> ${cardElement.dataset.dataUltimaAlteracao}`;

    const descricaoFamilia = document.createElement('p');
    descricaoFamilia.innerHTML = `<strong>Descrição da família:</strong> ${cardElement.dataset.descricaoFamilia}`;

    const quantidadeEstoque = document.createElement('p');
    quantidadeEstoque.innerHTML = `<strong>Quantidade no estoque:</strong> ${cardElement.dataset.quantidadeEstoque}`;

    const bloqueado = document.createElement('p');
    bloqueado.innerHTML = `<strong>Bloqueado:</strong> ${cardElement.dataset.bloqueado}`;

    const inativo = document.createElement('p');
    inativo.innerHTML = `<strong>Inativo:</strong> ${cardElement.dataset.inativo}`;

    // Anexa tudo ao .card-info do clone
    clonedCardInfo.appendChild(unidade);
    clonedCardInfo.appendChild(ncm);
    clonedCardInfo.appendChild(ean);
    clonedCardInfo.appendChild(valorUnitario);
    clonedCardInfo.appendChild(tipoItem);
    clonedCardInfo.appendChild(caracteristica);
    clonedCardInfo.appendChild(conteudo);
    clonedCardInfo.appendChild(dataInclusao);
    clonedCardInfo.appendChild(dataUltimaAlteracao);
    clonedCardInfo.appendChild(descricaoFamilia);
    clonedCardInfo.appendChild(quantidadeEstoque);
    clonedCardInfo.appendChild(bloqueado);
    clonedCardInfo.appendChild(inativo);
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
    card.addEventListener('click', function() {
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