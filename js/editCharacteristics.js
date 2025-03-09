// editCharacteristics.js
import { fetchCaracteristicas } from './utils.js';

async function populateDatalist() {
  try {
    const list = await fetchCaracteristicas();
    return list;
  } catch (error) {
    console.error("Erro ao buscar características:", error);
    return [];
  }
}

export async function enableSelectCaracteristica(cell) {
  const currentValue = cell.textContent.trim();
  cell.innerHTML = "";
  const select = document.createElement("select");

  // Se houver um valor atual, adiciona-o como opção (caso não exista na lista)
  if (currentValue !== "") {
    const optionCurrent = document.createElement("option");
    optionCurrent.value = currentValue;
    optionCurrent.text = currentValue;
    select.appendChild(optionCurrent);
  }
  
  const list = await populateDatalist();
  list.forEach(item => {
    // Exemplo: se quiser filtrar só itens com "*", adapte aqui
    if (/* seu filtro */ item.cNomeCaract !== currentValue) {
      const option = document.createElement("option");
      option.value = item.cNomeCaract;
      option.text = item.cNomeCaract;
      select.appendChild(option);
    }
  });

  if (select.options.length > 0) {
    if ([...select.options].some(opt => opt.value === currentValue)) {
      select.value = currentValue;
    } else {
      select.value = select.options[0].value;
    }
  }

  select.style.backgroundColor = 'rgba(255, 255, 0, 0.2)';
  select.style.outline = '1px dashed #ccc';
  cell.appendChild(select);
}

export function disableSelectCaracteristica(cell) {
  const select = cell.querySelector("select");
  if (select) {
    const value = select.value;
    cell.innerHTML = value;
  }
  cell.style.backgroundColor = '';
  cell.style.outline = '';
}

/**
 * Agora, em vez de "detectar" se está editando por meio de <select>,
 * nós FORÇAMOS o estado de edição usando cardClone.dataset.characteristicsEditing.
 */
export async function toggleCharacteristicsTableEdit(cardClone) {
    const table = cardClone.querySelector('.card-info table');
    if (!table) return;
    
    // Use exclusivamente a flag para determinar o modo de edição
    const editing = (cardClone.dataset.characteristicsEditing === "true");
  
    const tbodyRows = table.querySelectorAll('tbody tr');
    tbodyRows.forEach(row => {
      const cells = row.querySelectorAll('td');
      for (let index = 0; index < cells.length; index++) {
        const cell = cells[index];
        if (editing) {
          // Se estiver em modo edição:
          if (index === 0) {
            // Coluna "Característica": só permite edição se for uma nova linha
            if (row.dataset.new === "true") {
              // Se não houver select, cria-o
              if (!cell.querySelector('select')) {
                enableSelectCaracteristica(cell);
              }
            } else {
              // Para linhas existentes, mantém o texto fixo
              disableSelectCaracteristica(cell);
            }
          } else if (index === 1) {
            // Segunda coluna: torna o conteúdo editável
            cell.contentEditable = "true";
            cell.style.backgroundColor = 'rgba(255, 255, 0, 0.2)';
            cell.style.outline = '1px dashed #ccc';
          } else {
            // Colunas 3 a 5: se não tiver select, cria-o; caso contrário, mantém
            if (!cell.querySelector('select')) {
              const currentValue = cell.textContent.trim() || "N";
              cell.innerHTML = "";
              const select = document.createElement("select");
              const optionS = document.createElement("option");
              optionS.value = "S";
              optionS.text = "S";
              const optionN = document.createElement("option");
              optionN.value = "N";
              optionN.text = "N";
              select.appendChild(optionS);
              select.appendChild(optionN);
              select.value = (currentValue === "S" ? "S" : "N");
              select.style.backgroundColor = 'rgba(255, 255, 0, 0.2)';
              select.style.outline = '1px dashed #ccc';
              cell.appendChild(select);
            }
          }
        } else {
          // Modo não edição: desabilita a edição, remove os selects e limpa os estilos
          cell.contentEditable = "false";
          cell.style.backgroundColor = "";
          cell.style.outline = "";
          const select = cell.querySelector("select");
          if (select) {
            // Substitui o conteúdo do cell pelo valor do select
            cell.innerHTML = select.value;
          }
        }
      }
    });
  }
  

export function collectCharacteristicsEdits(cardClone) {
  let caracteristicas = [];
  const caractTable = cardClone.querySelector('.card-info table');
  if (caractTable) {
    const rows = caractTable.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 5) {
        const cNomeCaract = cells[0].querySelector('select')
          ? cells[0].querySelector('select').value
          : cells[0].innerText.trim();
        const cConteudo = cells[1].innerText.trim();
        const cExibirItemNF = cells[2].querySelector('select')
          ? cells[2].querySelector('select').value
          : cells[2].innerText.trim();
        const cExibirItemPedido = cells[3].querySelector('select')
          ? cells[3].querySelector('select').value
          : cells[3].innerText.trim();
        const cExibirOrdemProd = cells[4].querySelector('select')
          ? cells[4].querySelector('select').value
          : cells[4].innerText.trim();
        caracteristicas.push({ cNomeCaract, cConteudo, cExibirItemNF, cExibirItemPedido, cExibirOrdemProd });
      }
    });
  }
  return caracteristicas;
}
