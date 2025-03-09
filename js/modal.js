// modal.js
import { OMIE_APP_KEY, OMIE_APP_SECRET } from '../config.js';
import { toggleEditMode } from './editFields.js';
import { toggleCharacteristicsTableEdit, enableSelectCaracteristica } from './editCharacteristics.js';
import { fetchPosicaoEstoque, getTextOfField } from './utils.js';
import { collectEditsFromCard } from './editCard.js';

export function createFloatingButtonMenu() {
  const navDiv = document.createElement('div');
  navDiv.className = 'nav';
  navDiv.innerHTML = `
    <a href="#profile" class="nav-item nav-count-1" title="Perfil">
      <i class="ion-ios-person-outline"></i>
    </a>
    <a href="#edit" class="nav-item nav-count-2" id="editBtn" title="Editar produto">
      <i class="fa fa-edit"></i>
    </a>
    <a href="#chats" class="nav-item nav-count-3" title="Editar característica">
      <i class="fa fa-tags"></i>
    </a>
    <a href="#alarm" class="nav-item nav-count-4" title="Alarme">
      <i class="ion-ios-alarm-outline"></i>
    </a>
    <a href="#toggle" class="mask" title="Mais opções">
      <i class="ion-ios-plus-empty"></i>
    </a>
  `;
  const maskBtn = navDiv.querySelector('.mask');
  maskBtn.addEventListener('click', (e) => {
    e.preventDefault();
    navDiv.classList.toggle('active');
  });
  
  // Fecha o menu ao clicar em qualquer ícone, exceto o mask.
  const navItems = navDiv.querySelectorAll('a.nav-item:not(.mask)');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navDiv.classList.remove('active');
    });
  });
  
  return navDiv;
}

/**
 * Função auxiliar para atualizar (ou remover) as células de exclusão (ícone de lixeira)
 * em cada linha do corpo da tabela, conforme o parâmetro "enable".
 */
// REMOVA a duplicata abaixo!
// import { toggleCharacteristicsTableEdit } from './editCharacteristics.js';

function updateDeleteIcons(table, enable) {
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    const hasDeleteCell = (cells.length === 6);
    if (enable && !hasDeleteCell) {
      const tdExcluir = document.createElement('td');
      tdExcluir.innerHTML = `<i class="fa fa-trash" title="Excluir característica" style="cursor: pointer; color: red;"></i>`;
      tdExcluir.style.border = '1px solid #ccc';
      tdExcluir.style.padding = '5px';

      tdExcluir.addEventListener('click', async () => {
        if (confirm("Deseja realmente excluir esta característica?")) {
          const cCodIntCaract = cells[0].querySelector('select')
            ? cells[0].querySelector('select').value
            : cells[0].innerText.trim();
          const container = row.closest('.expanded-card-container');
          const cardClone = container?.firstElementChild;
          const prodCodigo = container?.querySelector('.card-info h2')?.innerText.trim();

          if (!prodCodigo) {
            alert("Não foi possível obter o código do produto.");
            return;
          }

          const payload = {
            cCodIntProd: prodCodigo,
            cCodIntCaract: cCodIntCaract
          };

          try {
            const response = await fetch('/api/excluir-caracteristica', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!data.error) {
              alert("Característica excluída com sucesso!");
              // Remove a linha da tabela
              row.remove();

              // FORÇA SAIR DO MODO EDIÇÃO APÓS A EXCLUSÃO
// Dentro do listener de clique do ícone de exclusão, após remover a linha:
if (cardClone) {
    // Força a saída do modo edição:
    cardClone.dataset.characteristicsEditing = "false";
    
    // Remove o container dos botões de nova característica (se existir)
    const addRowContainer = cardClone.querySelector('.add-row-container');
    if (addRowContainer) {
      addRowContainer.remove();
    }
    
    // Limpa o estilo dos campos editáveis (opcional)
    const editableCells = cardClone.querySelectorAll('.card-info td');
    editableCells.forEach(cell => {
      cell.style.backgroundColor = "";
      cell.style.outline = "";
      cell.contentEditable = "false";
    });
    
    // Força a atualização da tabela para o modo não edição
    await toggleCharacteristicsTableEdit(cardClone);
    
    // Remove os ícones de exclusão chamando updateDeleteIcons com enable = false
    updateDeleteIcons(table, false);
  }
  
            } else {
              let errorMsg = "Erro ao excluir característica.";
              if (data.cDesStatus)  errorMsg += " " + data.cDesStatus;
              if (data.faultcode)   errorMsg += " Fault Code: " + data.faultcode;
              if (data.faultstring) errorMsg += " Fault String: " + data.faultstring;
              alert(errorMsg);
            }
          } catch (err) {
            console.error("Erro ao enviar requisição de exclusão:", err);
            alert("Erro ao excluir característica.");
          }
        }
      });

      row.appendChild(tdExcluir);
    } else if (!enable && hasDeleteCell) {
      // Se o modo edição não estiver ativo, mas ainda há célula de exclusão, remove a última célula.
      row.lastElementChild.remove();
    }
  });
}

export { updateDeleteIcons };

export async function showCardModal(cardElement, omieData) {
  const modal = document.getElementById('cardModal');
  const modalBody = document.getElementById('cardModalBody');
  modalBody.innerHTML = "";

  const container = document.createElement('div');
  container.className = 'expanded-card-container';

  // Clona o card original e inicializa o modo de edição de características como desligado.
  const clone = cardElement.cloneNode(true);
  clone.dataset.characteristicsEditing = "false";

  // Localiza a área .card-info e o <h2> (código)
  const clonedCardInfo = clone.querySelector('.card-info');
  if (!clonedCardInfo) {
    container.appendChild(clone);
    modalBody.appendChild(container);
    modal.style.display = "flex";
    return;
  }
  const h2title = clonedCardInfo.querySelector('h2');

  // Remove todos os elementos, deixando apenas o <h2>
  const children = [...clonedCardInfo.children];
  for (const child of children) {
    if (child !== h2title) {
      child.remove();
    }
  }

  // Preenche com os dados do produto obtidos da Omie
  if (omieData) {
    const descEl = document.createElement('p');
    descEl.innerHTML = `<strong>Descrição:</strong> ${omieData.descricao || ''}`;
    clonedCardInfo.appendChild(descEl);

    const detalhadaEl = document.createElement('p');
    detalhadaEl.innerHTML = `<strong>Descrição detalhada:</strong> ${omieData.descr_detalhada || ''}`;
    clonedCardInfo.appendChild(detalhadaEl);

    const columnsContainer = document.createElement('div');
    columnsContainer.className = 'modal-columns';
    columnsContainer.style.display = 'flex';
    columnsContainer.style.gap = '20px';
    columnsContainer.style.marginTop = '10px';

    const leftCol = document.createElement('div');
    leftCol.className = 'modal-column left';
    leftCol.style.flex = '1';
    const ncmEl = document.createElement('p');
    ncmEl.innerHTML = `<strong>NCM:</strong> ${omieData.ncm || ''}`;
    leftCol.appendChild(ncmEl);
    const eanEl = document.createElement('p');
    eanEl.innerHTML = `<strong>EAN:</strong> ${omieData.ean || ''}`;
    leftCol.appendChild(eanEl);
    const tipoItemEl = document.createElement('p');
    tipoItemEl.innerHTML = `<strong>Tipo Item:</strong> ${omieData.tipoItem || ''}`;
    leftCol.appendChild(tipoItemEl);
    const familiaEl = document.createElement('p');
    familiaEl.innerHTML = `<strong>Descrição da família:</strong> ${omieData.descricao_familia || ''}`;
    leftCol.appendChild(familiaEl);
    const unidadeEl = document.createElement('p');
    unidadeEl.dataset.field = 'unidade';
    unidadeEl.innerHTML = `<strong>Unidade:</strong> ${omieData.unidade || ''}`;
    leftCol.appendChild(unidadeEl);
    const bloqueadoEl = document.createElement('p');
    bloqueadoEl.dataset.field = 'bloqueado';
    bloqueadoEl.innerHTML = `<strong>Bloqueado:</strong> ${omieData.bloqueado || ''}`;
    leftCol.appendChild(bloqueadoEl);
    const inativoEl = document.createElement('p');
    inativoEl.dataset.field = 'inativo';
    inativoEl.innerHTML = `<strong>Inativo:</strong> ${omieData.inativo || ''}`;
    leftCol.appendChild(inativoEl);

    const rightCol = document.createElement('div');
    rightCol.className = 'modal-column right';
    rightCol.style.flex = '1';
    try {
      const hoje = new Date();
      const dia = String(hoje.getDate()).padStart(2, '0');
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const ano = hoje.getFullYear();
      const dataFormato = `${dia}/${mes}/${ano}`;
      const codigoProd = omieData.codigo;
      const estoqueData = await fetchPosicaoEstoque(codigoProd, dataFormato);
      if (estoqueData && estoqueData.codigo_status === '0') {
        const { cmc, saldo, reservado, fisico } = estoqueData;
        const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cmc ?? 0);
        const valorEstoqueEl = document.createElement('p');
        valorEstoqueEl.innerHTML = `<strong>Valor Unitário:</strong> ${valorFormatado}`;
        rightCol.appendChild(valorEstoqueEl);
        const saldoEl = document.createElement('p');
        saldoEl.innerHTML = `<strong>Saldo:</strong> ${saldo ?? 0}`;
        rightCol.appendChild(saldoEl);
        const reservadoEl = document.createElement('p');
        reservadoEl.innerHTML = `<strong>Reservado:</strong> ${reservado ?? 0}`;
        rightCol.appendChild(reservadoEl);
        const fisicoEl = document.createElement('p');
        fisicoEl.innerHTML = `<strong>Físico:</strong> ${fisico ?? 0}`;
        rightCol.appendChild(fisicoEl);
      } else {
        const valorEstoqueEl = document.createElement('p');
        valorEstoqueEl.innerHTML = `<strong>Valor Unitário:</strong> (não encontrado)`;
        rightCol.appendChild(valorEstoqueEl);
      }
      const dataInclEl = document.createElement('p');
      dataInclEl.innerHTML = `<strong>Data de inclusão:</strong> ${omieData?.info?.dInc || ''}`;
      rightCol.appendChild(dataInclEl);
      const dataAltEl = document.createElement('p');
      dataAltEl.innerHTML = `<strong>Data da última alteração:</strong> ${omieData?.info?.dAlt || ''}`;
      rightCol.appendChild(dataAltEl);
    } catch (err) {
      console.error("Erro ao buscar posição de estoque:", err);
      const valorEstoqueEl = document.createElement('p');
      valorEstoqueEl.innerHTML = `<strong>Valor Unitário:</strong> (erro ao buscar)`;
      rightCol.appendChild(valorEstoqueEl);
    }
    columnsContainer.appendChild(leftCol);
    columnsContainer.appendChild(rightCol);
    clonedCardInfo.appendChild(columnsContainer);

    // Cria a tabela de características
    let caractTable;
    if (Array.isArray(omieData.caracteristicas) && omieData.caracteristicas.length > 0) {
      caractTable = document.createElement('table');
      caractTable.style.borderCollapse = 'collapse';
      caractTable.style.marginTop = '10px';
      const thead = document.createElement('thead');
      const headRow = document.createElement('tr');
      const headers = ['Característica', 'Conteúdo', 'Exibir Item NF', 'Exibir Item Pedido', 'Exibir Ordem Prod'];
      headers.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        th.style.border = '1px solid #ccc';
        th.style.padding = '5px';
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      caractTable.appendChild(thead);
  
      const tbody = document.createElement('tbody');
      omieData.caracteristicas.forEach(c => {
        const row = createCharacteristicRow(c);
        tbody.appendChild(row);
      });
      caractTable.appendChild(tbody);
      clonedCardInfo.appendChild(caractTable);
    }
  
    // Ícone para salvar produto
    if (h2title) {
      const saveIcon = document.createElement('span');
      saveIcon.id = 'saveIcon';
      saveIcon.style.cursor = 'pointer';
      saveIcon.style.marginLeft = '10px';
      saveIcon.innerHTML = `<i class="fa fa-save"></i>`;
      saveIcon.style.display = 'none';
      h2title.appendChild(saveIcon);
  
      saveIcon.addEventListener('click', async () => {
        const camposEdicao = collectEditsFromCard(clone);
      
        try {
          // 1) Primeiro, chama a rota que atualiza no Omie (se for o caso)
          const omieResponse = await fetch('/api/produtos/alterar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(camposEdicao)
          });
          const omieData = await omieResponse.json();
      
          if (omieData.success) {
            alert("Produto atualizado na OMIE com sucesso!");
          } else {
            alert("Erro ao atualizar na OMIE: " + omieData.error);
          }
      
          // 2) Agora chama a rota para atualizar no CSV local
          //    Mande apenas os campos relevantes para o CSV
          const csvResponse = await fetch('/api/produtos/alterarNoCSV', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              codigo: camposEdicao.codigo,
              descr_detalhada: camposEdicao.descr_detalhada,
              descricao: camposEdicao.descricao
              // ... e outros campos que existam no CSV
            })
          });
          const csvData = await csvResponse.json();
      
          if (csvData.success) {
            console.log('CSV atualizado com sucesso!');
          } else {
            console.error('Erro ao atualizar CSV:', csvData.error);
            alert('Erro ao atualizar CSV: ' + csvData.error);
          }
      
          // Se quiser sair do modo edição, etc.
          if (clone.querySelector('.card-info p[contentEditable="true"]')) {
            toggleEditMode(clone);
          }
          clone.dataset.characteristicsEditing = "false";
          // ... e qualquer outra limpeza/atualização do DOM
      
        } catch (error) {
          console.error("Erro geral ao salvar:", error);
          alert("Erro ao salvar alterações");
        }
      });
      
    }
  
    const floatingMenu = createFloatingButtonMenu();
    container.appendChild(floatingMenu);
  
    const editButton = floatingMenu.querySelector('#editBtn');
    if (editButton) {
      editButton.addEventListener('click', (e) => {
        e.preventDefault();
        toggleEditMode(clone);
      });
    }
  
    // Event listener para o botão de editar característica
    const chatsButton = floatingMenu.querySelector('.nav-item.nav-count-3');
    if (chatsButton) {
      chatsButton.addEventListener('click', async (e) => {
        e.preventDefault();
        // Alterna o estado de edição de características
        const isEditing = clone.dataset.characteristicsEditing === "true";
        const editing = !isEditing;
        clone.dataset.characteristicsEditing = editing.toString();
  
        await toggleCharacteristicsTableEdit(clone);
  
        let caractTable = clone.querySelector('.card-info table');
        if (caractTable) {
          updateDeleteIcons(caractTable, editing);
        }
  
        const existingIconContainer = clone.querySelector('.add-row-container');
        if (editing) {
          if (!existingIconContainer) {
            // Ícone para adicionar nova linha
            const addRowIcon = document.createElement('span');
            addRowIcon.style.cursor = 'pointer';
            addRowIcon.style.marginTop = '10px';
            addRowIcon.style.textAlign = 'left';
            addRowIcon.innerHTML = `<i class="fa fa-plus-circle fa-2x" title="Adicionar nova característica"></i>`;
            addRowIcon.addEventListener('click', async () => {
              let caractTable = clone.querySelector('.card-info table');
              if (!caractTable) {
                caractTable = document.createElement('table');
                caractTable.style.borderCollapse = 'collapse';
                caractTable.style.marginTop = '10px';
                const thead = document.createElement('thead');
                const headRow = document.createElement('tr');
                const headers = ['Característica', 'Conteúdo', 'Exibir Item NF', 'Exibir Item Pedido', 'Exibir Ordem Prod'];
                headers.forEach(text => {
                  const th = document.createElement('th');
                  th.textContent = text;
                  th.style.border = '1px solid #ccc';
                  th.style.padding = '5px';
                  headRow.appendChild(th);
                });
                thead.appendChild(headRow);
                caractTable.appendChild(thead);
                const tbody = document.createElement('tbody');
                caractTable.appendChild(tbody);
                clonedCardInfo.appendChild(caractTable);
              }
              const tbody = caractTable.querySelector('tbody');
              const newRow = document.createElement('tr');
              newRow.dataset.new = "true"; // Marca a linha como nova
  
              // Primeira célula: cria um <select> para a característica (valor inicial vazio)
              const newCell1 = document.createElement('td');
              await enableSelectCaracteristica(newCell1);
  
              // Segunda célula: campo de texto editável
              const newCell2 = document.createElement('td');
              newCell2.textContent = "";
              newCell2.contentEditable = "true";
              newCell2.style.backgroundColor = 'rgba(255, 255, 0, 0.2)';
              newCell2.style.outline = '1px dashed #ccc';
  
              // Células 3 a 5: selects com opções "S" e "N"
              const createSelectCell = (defaultValue = "N") => {
                const cell = document.createElement('td');
                cell.innerHTML = "";
                const select = document.createElement('select');
                const optionS = document.createElement('option');
                optionS.value = 'S';
                optionS.text = 'S';
                const optionN = document.createElement('option');
                optionN.value = 'N';
                optionN.text = 'N';
                select.appendChild(optionS);
                select.appendChild(optionN);
                select.value = defaultValue;
                select.style.backgroundColor = 'rgba(255, 255, 0, 0.2)';
                select.style.outline = '1px dashed #ccc';
                cell.appendChild(select);
                return cell;
              };
  
              const newCell3 = createSelectCell();
              const newCell4 = createSelectCell();
              const newCell5 = createSelectCell();
  
              newRow.appendChild(newCell1);
              newRow.appendChild(newCell2);
              newRow.appendChild(newCell3);
              newRow.appendChild(newCell4);
              newRow.appendChild(newCell5);
              tbody.appendChild(newRow);
            });
  
            // Ícone de salvar nova característica
            const saveNewIcon = document.createElement('span');
            saveNewIcon.classList.add('save-new-icon');
            saveNewIcon.style.cursor = 'pointer';
            saveNewIcon.style.marginTop = '10px';
            saveNewIcon.style.marginLeft = '10px';
            saveNewIcon.innerHTML = `<i class="fa fa-check-circle fa-2x" title="Salvar nova característica"></i>`;
            saveNewIcon.addEventListener('click', async () => {
              let caractTable = clone.querySelector('.card-info table');
              if (caractTable) {
                const tbody = caractTable.querySelector('tbody');
                const newRow = tbody.lastElementChild;
                if (newRow) {
                  const cells = newRow.querySelectorAll('td');
                  const cCodIntCaract = cells[0].querySelector('select')
                    ? cells[0].querySelector('select').value
                    : cells[0].innerText.trim();
                  const cConteudo = cells[1].textContent.trim();
                  const cExibirItemNF = cells[2].querySelector('select')
                    ? cells[2].querySelector('select').value
                    : cells[2].innerText.trim();
                  const cExibirItemPedido = cells[3].querySelector('select')
                    ? cells[3].querySelector('select').value
                    : cells[3].innerText.trim();
                  const cExibirOrdemProd = cells[4].querySelector('select')
                    ? cells[4].querySelector('select').value
                    : cells[4].innerText.trim();
  
                  const payload = {
                    param: [{
                      cCodIntProd: omieData.codigo,
                      cCodIntCaract: cCodIntCaract,
                      cConteudo: cConteudo,
                      cExibirItemNF: cExibirItemNF,
                      cExibirItemPedido: cExibirItemPedido,
                      cExibirOrdemProd: cExibirOrdemProd
                    }]
                  };
  
                  console.log("Payload enviado para IncluirCaractProduto:", JSON.stringify(payload, null, 2));
  
                  try {
                    const response = await fetch('/api/prodcaract', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                    });
                    const data = await response.json();
                    console.log("Resposta da API:", data);
                    if (!data.error) {
                      alert('Característica incluída com sucesso!');
                      // Sai do modo edição de características após salvar nova característica.
                      clone.dataset.characteristicsEditing = "false";
                      const addRowContainer = clone.querySelector('.add-row-container');
                      if (addRowContainer) {
                        addRowContainer.remove();
                      }
                      await toggleCharacteristicsTableEdit(clone);
                    } else {
                      alert('Erro ao incluir característica: ' + JSON.stringify(data));
                    }
                  } catch (err) {
                    console.error("Erro ao enviar requisição:", err);
                    alert('Erro ao incluir característica.');
                  }
                }
              }
            });
  
            const iconContainer = document.createElement('div');
            iconContainer.classList.add('add-row-container');
            iconContainer.style.display = 'flex';
            iconContainer.style.alignItems = 'center';
            iconContainer.style.marginTop = '10px';
            iconContainer.appendChild(addRowIcon);
            iconContainer.appendChild(saveNewIcon);
  
            const clonedCardInfo = clone.querySelector('.card-info');
            const table = clonedCardInfo.querySelector('table');
            if (table) {
              table.parentNode.insertBefore(iconContainer, table.nextSibling);
            } else {
              clonedCardInfo.appendChild(iconContainer);
            }
          }
        } else {
          if (existingIconContainer) {
            existingIconContainer.remove();
          }
        }
      });
    }
  
    container.appendChild(clone);
    modalBody.appendChild(container);
    modal.style.display = "flex";
  }
  
  document.querySelector('.card-modal-close').addEventListener('click', () => {
    document.getElementById('cardModal').style.display = "none";
  });
  document.getElementById('cardModal').addEventListener('click', function(e) {
    if (e.target === this) this.style.display = "none";
  });
}

/**
 * Função auxiliar para criar uma linha da tabela de características.
 */
function createCharacteristicRow(c) {
  const row = document.createElement('tr');
  
  // Célula para "Característica"
  const tdCaract = document.createElement('td');
  tdCaract.textContent = c.cNomeCaract || '';
  tdCaract.style.border = '1px solid #ccc';
  tdCaract.style.padding = '5px';
  row.appendChild(tdCaract);
  
  // Célula para "Conteúdo"
  const tdConteudo = document.createElement('td');
  tdConteudo.textContent = c.cConteudo || '';
  tdConteudo.style.border = '1px solid #ccc';
  tdConteudo.style.padding = '5px';
  row.appendChild(tdConteudo);
  
  // Célula para "Exibir Item NF"
  const tdExibirItemNF = document.createElement('td');
  tdExibirItemNF.textContent = c.cExibirItemNF || 'N';
  tdExibirItemNF.style.border = '1px solid #ccc';
  tdExibirItemNF.style.padding = '5px';
  row.appendChild(tdExibirItemNF);
  
  // Célula para "Exibir Item Pedido"
  const tdExibirItemPedido = document.createElement('td');
  tdExibirItemPedido.textContent = c.cExibirItemPedido || 'N';
  tdExibirItemPedido.style.border = '1px solid #ccc';
  tdExibirItemPedido.style.padding = '5px';
  row.appendChild(tdExibirItemPedido);
  
  // Célula para "Exibir Ordem Prod"
  const tdExibirOrdemProd = document.createElement('td');
  tdExibirOrdemProd.textContent = c.cExibirOrdemProd || 'N';
  tdExibirOrdemProd.style.border = '1px solid #ccc';
  tdExibirOrdemProd.style.padding = '5px';
  row.appendChild(tdExibirOrdemProd);
  
  return row;
}
