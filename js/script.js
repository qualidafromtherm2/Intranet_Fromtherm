/********************************
 * js/script.js
 ********************************/

document.getElementById('btnAtualizarCSV').addEventListener('click', async () => {
  try {
    // Verifica o hostname para decidir o endpoint
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

/** Lê o produtos.csv local e retorna array de objetos */
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
    console.error('Erro ao carregar CSV:', error);
    return [];
  }
}

/** Filtra produtos do CSV com base num termo (busca em codigo, codigo_produto, descr_detalhada, descricao) */
function searchInCSV(produtos, term) {
  const tokens = term.toLowerCase().split(/\s+/);
  return produtos.filter(produto => {
    const campos = [
      produto.codigo || "",
      produto.codigo_produto || "",
      produto.descr_detalhada || "",
      produto.descricao || ""
    ].map(c => c.toLowerCase());
    return tokens.every(token => campos.some(campo => campo.includes(token)));
  });
}

/** Mostra o modal com detalhes do produto (dados Omie) */
/** 
 * Exibe o modal com os dados do produto vindos da Omie (omieData).
 * Ao clonar o cardElement, preserva apenas a imagem (.card-top) e o <h2> (código).
 * Remove quaisquer <p> já existentes em .card-info (descrições antigas).
 * Cria novos <p> para cada campo do omieData.
 */
function showCardModal(cardElement, omieData) {
  const modal = document.getElementById('cardModal');
  const modalBody = document.getElementById('cardModalBody');
  modalBody.innerHTML = "";

  // Cria um container principal para o modal
  const container = document.createElement('div');
  container.className = 'expanded-card-container';

  // Clona o card original
  const clone = cardElement.cloneNode(true);

  // Localiza .card-info e <h2>
  const clonedCardInfo = clone.querySelector('.card-info');
  const h2title = clonedCardInfo ? clonedCardInfo.querySelector('h2') : null;

  // Se por alguma razão não encontrou .card-info, apenas anexa o clone e sai
  if (!clonedCardInfo || !h2title) {
    container.appendChild(clone);
    modalBody.appendChild(container);
    modal.style.display = "flex";
    return;
  }

  // Remove todos os filhos de .card-info EXCETO o <h2> (que contém o código)
  const children = [...clonedCardInfo.children];
  for (const child of children) {
    if (child !== h2title) {
      child.remove();
    }
  }

  // Agora, .card-info só tem o <h2> (código) e .card-top (imagem) segue no clone

  // Se temos dados da Omie, cria novos <p> com base em omieData
  if (omieData) {
    const {
      descricao,
      descr_detalhada,
      unidade,
      ncm,
      ean,
      valor_unitario,
      tipoItem,
      descricao_familia,
      quantidade_estoque,
      bloqueado,
      inativo
    } = omieData;

    const dataInclusao = omieData?.info?.dInc || '';
    const dataUltAlt   = omieData?.info?.dAlt || '';

    // ========== Descrição ==========
    const descricaoEl = document.createElement('p');
    descricaoEl.innerHTML = `<strong>Descrição:</strong> ${descricao || ''}`;
    clonedCardInfo.appendChild(descricaoEl);

    // ========== Descrição Detalhada ==========
    const detalhadaEl = document.createElement('p');
    detalhadaEl.innerHTML = `<strong>Descrição detalhada:</strong> ${descr_detalhada || ''}`;
    clonedCardInfo.appendChild(detalhadaEl);

    // ========== Unidade ==========
    const unidadeEl = document.createElement('p');
    unidadeEl.innerHTML = `<strong>Unidade:</strong> ${unidade || ''}`;
    clonedCardInfo.appendChild(unidadeEl);

    // ========== NCM ==========
    const ncmEl = document.createElement('p');
    ncmEl.innerHTML = `<strong>NCM:</strong> ${ncm || ''}`;
    clonedCardInfo.appendChild(ncmEl);

    // ========== EAN ==========
    const eanEl = document.createElement('p');
    eanEl.innerHTML = `<strong>EAN:</strong> ${ean || ''}`;
    clonedCardInfo.appendChild(eanEl);

    // ========== Valor Unitário ==========
    const valorEl = document.createElement('p');
    valorEl.innerHTML = `<strong>Valor Unitário:</strong> ${valor_unitario || ''}`;
    clonedCardInfo.appendChild(valorEl);

    // ========== Tipo Item ==========
    const tipoItemEl = document.createElement('p');
    tipoItemEl.innerHTML = `<strong>Tipo Item:</strong> ${tipoItem || ''}`;
    clonedCardInfo.appendChild(tipoItemEl);

    // ========== Data de inclusão ==========
    const dataInclEl = document.createElement('p');
    dataInclEl.innerHTML = `<strong>Data de inclusão:</strong> ${dataInclusao}`;
    clonedCardInfo.appendChild(dataInclEl);

    // ========== Data da última alteração ==========
    const dataAltEl = document.createElement('p');
    dataAltEl.innerHTML = `<strong>Data da última alteração:</strong> ${dataUltAlt}`;
    clonedCardInfo.appendChild(dataAltEl);

    // ========== Descrição da família ==========
    const familiaEl = document.createElement('p');
    familiaEl.innerHTML = `<strong>Descrição da família:</strong> ${descricao_familia || ''}`;
    clonedCardInfo.appendChild(familiaEl);

    // ========== Quantidade no estoque ==========
    const estoqueEl = document.createElement('p');
    estoqueEl.innerHTML = `<strong>Quantidade no estoque:</strong> ${quantidade_estoque || ''}`;
    clonedCardInfo.appendChild(estoqueEl);

    // ========== Bloqueado (campo especial) ==========
    const bloqueadoEl = document.createElement('p');
    bloqueadoEl.dataset.field = 'bloqueado';
    bloqueadoEl.innerHTML = `<strong>Bloqueado:</strong> ${bloqueado || ''}`;
    clonedCardInfo.appendChild(bloqueadoEl);

    // ========== Inativo (campo especial) ==========
    const inativoEl = document.createElement('p');
    inativoEl.dataset.field = 'inativo';
    inativoEl.innerHTML = `<strong>Inativo:</strong> ${inativo || ''}`;
    clonedCardInfo.appendChild(inativoEl);

    // ========== Características (tabela) ==========
    if (Array.isArray(omieData.caracteristicas) && omieData.caracteristicas.length > 0) {
      const caractTable = document.createElement('table');
      caractTable.style.borderCollapse = 'collapse';
      caractTable.style.marginTop = '10px';

      const thead = document.createElement('thead');
      const headRow = document.createElement('tr');

      const thCaract = document.createElement('th');
      thCaract.textContent = 'Característica';
      thCaract.style.border = '1px solid #ccc';
      thCaract.style.padding = '5px';

      const thConteudo = document.createElement('th');
      thConteudo.textContent = 'Conteúdo';
      thConteudo.style.border = '1px solid #ccc';
      thConteudo.style.padding = '5px';

      headRow.appendChild(thCaract);
      headRow.appendChild(thConteudo);
      thead.appendChild(headRow);
      caractTable.appendChild(thead);

      const tbody = document.createElement('tbody');
      omieData.caracteristicas.forEach(c => {
        const row = document.createElement('tr');

        const tdCaract = document.createElement('td');
        tdCaract.textContent = c.cNomeCaract || '';
        tdCaract.style.border = '1px solid #ccc';
        tdCaract.style.padding = '5px';

        const tdConteudo = document.createElement('td');
        tdConteudo.textContent = c.cConteudo || '';
        tdConteudo.style.border = '1px solid #ccc';
        tdConteudo.style.padding = '5px';

        row.appendChild(tdCaract);
        row.appendChild(tdConteudo);
        tbody.appendChild(row);
      });

      caractTable.appendChild(tbody);
      clonedCardInfo.appendChild(caractTable);
    }
  }

  // ========== ÍCONE DE SALVAR AO LADO DO H2 (CÓDIGO) ==========
  if (h2title) {
    const saveIcon = document.createElement('span');
    saveIcon.id = 'saveIcon';
    saveIcon.style.cursor = 'pointer';
    saveIcon.style.marginLeft = '10px';
    saveIcon.innerHTML = `<i class="fa fa-save"></i>`;
    saveIcon.style.display = 'none';
    h2title.appendChild(saveIcon);

    // Clique do "Salvar"
    saveIcon.addEventListener('click', async () => {
      // Coleta campos do clone
      const camposEdicao = collectEditsFromCard(clone);
      try {
        const response = await fetch('/api/produtos/alterar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(camposEdicao)
        });
        const data = await response.json();
        if (data.success) {
          alert("Produto atualizado com sucesso!");
        } else {
          alert("Erro: " + data.error);
        }
      } catch (error) {
        console.error("Erro ao salvar alterações:", error);
        alert("Erro ao salvar alterações");
      }
    });
  }

  // ========== MENU FLUTUANTE COM BOTÃO EDITAR ==========
  const floatingMenu = createFloatingButtonMenu();
  container.appendChild(floatingMenu);

  // Botão editar
  const editButton = floatingMenu.querySelector('#editBtn');
  if (editButton) {
    editButton.addEventListener('click', (e) => {
      e.preventDefault();
      toggleEditMode(clone);
    });
  }

  // Anexa o clone e exibe modal
  container.appendChild(clone);
  modalBody.appendChild(container);
  modal.style.display = "flex";
}



// Fechar modal
document.querySelector('.card-modal-close').addEventListener('click', () => {
  document.getElementById('cardModal').style.display = "none";
});
document.getElementById('cardModal').addEventListener('click', function(e) {
  if (e.target === this) this.style.display = "none";
});

/** Exibe resultados da busca (cards) */
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

    // card-top (imagem)
    const cardTop = document.createElement('div');
    cardTop.className = 'card-top';
    const img = document.createElement('img');
    img.src = result.url_imagem || 'img/logo.png';
    img.onerror = () => { img.src = 'img/logo.png'; };
    img.alt = 'Produto';
    cardTop.appendChild(img);

    // card-info
    const cardInfo = document.createElement('div');
    cardInfo.className = 'card-info';

    // h2 -> código
    const title = document.createElement('h2');
    title.style.fontWeight = 'bold';
    title.textContent = result.codigo || 'Sem código';

    // p subtitle -> descrição
    const subtitle = document.createElement('p');
    subtitle.className = 'subtitle';
    subtitle.textContent = result.descricao || 'Sem descrição';

    // p detalhado -> descr_detalhada
    const detalhado = document.createElement('p');
    detalhado.textContent = result.descr_detalhada || 'Sem descrição detalhada';

    cardInfo.appendChild(title);
    cardInfo.appendChild(subtitle);
    cardInfo.appendChild(detalhado);

    card.appendChild(cardTop);
    card.appendChild(cardInfo);

    // dataset extras
    card.dataset.unidade = result.unidade || '';
    // ... e assim por diante (ncm, ean, etc.)

    // Ao clicar, consulta Omie e exibe modal
    card.addEventListener('click', async () => {
      const codigoProduto = result.codigo;
      const omieData = await fetchDetalhes(codigoProduto);
      showCardModal(card, omieData);
    });

    cardsContainer.appendChild(card);
  });

  resultsContainer.appendChild(cardsContainer);
}

/** Chama /api/produtos/detalhes/... e retorna JSON */
async function fetchDetalhes(codigo) {
  try {
    const response = await fetch(`/api/produtos/detalhes/${encodeURIComponent(codigo)}`);
    if (!response.ok) {
      throw new Error('Erro ao consultar detalhes do produto');
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Evento de busca (input)
document.getElementById('inpt_search').addEventListener('input', function() {
  const term = this.value.trim();
  if (!term) {
    document.getElementById('searchResults').innerHTML = '';
    return;
  }
  const results = searchInCSV(produtosData, term);
  displayResults(results);
});

// Ajusta estilo do placeholder e ativação
document.getElementById('inpt_search').addEventListener('focus', function() {
  this.parentElement.classList.add('active');
});
document.getElementById('inpt_search').addEventListener('blur', function() {
  if (!this.value) {
    this.parentElement.classList.remove('active');
  }
});

/** Cria o menu flutuante (botão + etc.) */
function createFloatingButtonMenu() {
  const navDiv = document.createElement('div');
  navDiv.className = 'nav';

  navDiv.innerHTML = `
    <a href="#profile" class="nav-item nav-count-1">
      <i class="ion-ios-person-outline"></i>
    </a>
    <a href="#edit" class="nav-item nav-count-2" id="editBtn">
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

  const maskBtn = navDiv.querySelector('.mask');
  maskBtn.addEventListener('click', (e) => {
    e.preventDefault();
    navDiv.classList.toggle('active');
  });

  return navDiv;
}

// Ajuste do layout
const mainMenu = document.querySelector('.main-menu');
const searchResults = document.getElementById('searchResults');
function updateSearchResultsLeft() {
  if (mainMenu.classList.contains('expanded')) {
    searchResults.style.left = '270px';
  } else {
    searchResults.style.left = '150px';
  }
}
mainMenu.addEventListener('mouseenter', () => {
  mainMenu.classList.add('expanded');
  updateSearchResultsLeft();
});
mainMenu.addEventListener('mouseleave', () => {
  mainMenu.classList.remove('expanded');
  updateSearchResultsLeft();
});
window.addEventListener('resize', updateSearchResultsLeft);
updateSearchResultsLeft();

// Carrega CSV ao iniciar
(async function initialize() {
  produtosData = await loadCSV();
  console.log("produtosData carregados:", produtosData);
})();

// =========== Toggle Edit Mode ===========
function toggleEditMode(cardClone) {
  const isCurrentlyEditing = (cardClone.querySelector('.card-info p[contentEditable="true"]') !== null);
  const willEdit = !isCurrentlyEditing;

  // Mostra/esconde o ícone "Salvar"
  const saveIcon = cardClone.querySelector('#saveIcon');
  if (saveIcon) {
    saveIcon.style.display = willEdit ? 'inline-block' : 'none';
  }

  const paragraphs = cardClone.querySelectorAll('.card-info p');
  paragraphs.forEach((p) => {
    // Se está dentro da tabela, não editamos
    if (p.closest('table')) return;

    const isBloqueado = (p.dataset.field === 'bloqueado');
    const isInativo   = (p.dataset.field === 'inativo');

    if (isBloqueado || isInativo) {
      if (willEdit) {
        enableSelectSN(p);
      } else {
        disableSelectSN(p);
      }
    } else {
      p.contentEditable = willEdit ? 'true' : 'false';
      if (p.contentEditable === 'true') {
        p.style.backgroundColor = 'rgba(255, 255, 0, 0.2)';
        p.style.outline = '1px dashed #ccc';
      } else {
        p.style.backgroundColor = '';
        p.style.outline = '';
      }
    }
  });
}

/** Coleta os campos editados e retorna objeto para AlterarProduto */
function collectEditsFromCard(cardClone) {
  const codigoH2 = cardClone.querySelector('.card-info h2');
  const codigo = codigoH2 ? codigoH2.innerText.trim() : '';

  const descricao        = getTextOfField(cardClone, 'Descrição:');
  const descrDetalhada   = getTextOfField(cardClone, 'Descrição detalhada:');
  const unidade          = getTextOfField(cardClone, 'Unidade:');
  const ncm              = getTextOfField(cardClone, 'NCM:');
  const ean              = getTextOfField(cardClone, 'EAN:');
  const valor            = getTextOfField(cardClone, 'Valor Unitário:');
  const tipoItem         = getTextOfField(cardClone, 'Tipo Item:');
  const familia          = getTextOfField(cardClone, 'Descrição da família:');
  const estoque          = getTextOfField(cardClone, 'Quantidade no estoque:');
  const bloqueado        = getTextOfField(cardClone, 'Bloqueado:');
  const inativo          = getTextOfField(cardClone, 'Inativo:');

  return {
    codigo,
    descricao,
    descr_detalhada: descrDetalhada,
    unidade,
    ncm,
    ean,
    valor_unitario: parseFloat(valor) || 0,
    tipoItem,
    descricao_familia: familia,
    quantidade_estoque: parseFloat(estoque) || 0,
    bloqueado: (bloqueado === 'S' ? 'S' : 'N'),
    inativo:   (inativo === 'S'   ? 'S' : 'N')
  };
}

/** Lê o texto após 'label:' */
function getTextOfField(cardClone, label) {
  const allPs = cardClone.querySelectorAll('.card-info p');
  for (const p of allPs) {
    const text = p.innerText.trim();
    if (text.startsWith(label)) {
      return text.slice(label.length).trim();
    }
  }
  return '';
}

/** Habilita <select> (S/N) em "Bloqueado" e "Inativo" */
function enableSelectSN(p) {
  const textContent = p.innerText;
  let currentValue = textContent.split(':')[1]?.trim() || '';
  if (currentValue !== 'S' && currentValue !== 'N') {
    currentValue = '';
  }

  p.innerHTML = '';
  const strongLabel = document.createElement('strong');
  strongLabel.textContent = textContent.split(':')[0] + ':';
  p.appendChild(strongLabel);
  p.appendChild(document.createTextNode(' '));

  const select = document.createElement('select');
  const optionS = document.createElement('option');
  optionS.value = 'S';
  optionS.text = 'S';

  const optionN = document.createElement('option');
  optionN.value = 'N';
  optionN.text = 'N';

  select.appendChild(optionS);
  select.appendChild(optionN);

  if (currentValue === 'S') select.value = 'S';
  else if (currentValue === 'N') select.value = 'N';

  select.style.backgroundColor = 'rgba(255, 255, 0, 0.2)';
  select.style.outline = '1px dashed #ccc';
  p.appendChild(select);
}

/** Desabilita <select>, volta texto ex: "<strong>Bloqueado:</strong> S" */
function disableSelectSN(p) {
  const strong = p.querySelector('strong');
  const select = p.querySelector('select');
  if (!strong || !select) return;

  const finalValue = select.value;
  p.innerHTML = `${strong.outerHTML} ${finalValue}`;
}
