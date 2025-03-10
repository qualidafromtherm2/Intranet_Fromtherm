$(document).ready(function () {
    $('input.currency, input[name="VALOR PI"], input[name="PAGAMENTO 1"], input[name="PAGAMENTO 2"], input[name="PAGAMENTO 3"], input[name="SALDO PAGAR"]').inputmask({
      alias: "numeric",
      prefix: "$",
      groupSeparator: ",",
      radixPoint: ".",
      digits: 2,
      digitsOptional: false,
      autoGroup: true,
      rightAlign: false
    });
  
    // Aqui você deverá substituir a chamada abaixo por uma requisição AJAX
    // Exemplo: $.get('/api/spreadsheetData', loadData);
    // loadData(data) deverá processar os dados retornados do backend.
  });
  
  function enterSystem(tabName) {
    document.getElementById('homeTab').style.display = 'none';
    document.querySelector('main').style.display = 'block';
    showTab(tabName);
  }
  
  function closeTab() {
    document.querySelector('main').style.display = 'none';
    document.getElementById('homeTab').style.display = 'flex';
  }
  
  function parseDateStringJS(dateString) {
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  
  let allData = [];
  let currentIndex = 0;
  let headers = [];
  let isNewRecord = false;
  
  let productsData = null;
  let currentProductIndex = 0;
  let currentPi = "";
  
  let contratosData = [];
  let currentContratoIndex = 0;
  const contratosHeadersList = [
    "DATA FECHAMENTO",
    "TIPO FECHAMENTO",
    "CONTRATO",
    "VALOR $",
    "VALOR R$",
    "% PAGO",
    "FORNECEDOR",
    "LOTE",
    "INVOCE",
    "TAXA MOEDA",
    "BANCO/CORRETORA",
    "NOTA NACIONALIZAÇÃO",
    "DI",
    "PROTOCOLO DI",
    "APRESENTAÇÃO BANCO",
    "CONTABILIDADE"
  ];
  
  // A partir daqui, as funções abaixo mantêm a lógica de interface.
  // Você precisará adaptar as funções que antes chamavam google.script.run para requisições AJAX ao seu backend.
  
  function showTab(tabName) {
    if(tabName === 'importacao'){
      document.getElementById('importacaoTab').style.display = 'block';
      document.getElementById('andamentoTab').style.display = 'none';
      document.getElementById('contratosTab').style.display = 'none';
    } else if(tabName === 'andamento'){
      document.getElementById('importacaoTab').style.display = 'none';
      document.getElementById('andamentoTab').style.display = 'block';
      document.getElementById('contratosTab').style.display = 'none';
      loadAndamentoData();
    } else if(tabName === 'contratos'){
      document.getElementById('importacaoTab').style.display = 'none';
      document.getElementById('andamentoTab').style.display = 'none';
      document.getElementById('contratosTab').style.display = 'block';
    }
  }
  
  function loadData(data) {
    // Esta função deverá ser chamada com os dados obtidos do backend via AJAX
    allData = data.rows || [];
    headers = data.headers || [];
    renderForm(headers);
    if (allData.length > 0) {
      populateForm(allData[0]);
      updateRecordCounter();
    } else {
      displayError('Nenhum registro encontrado.');
    }
  }
  
  function renderForm(headers) {
    const form = document.getElementById('importForm');
    form.innerHTML = '';
    headers.forEach(header => {
      const wrapper = document.createElement('div');
      const label = document.createElement('label');
      label.textContent = header;
      wrapper.appendChild(label);
      let input;
      if (header === 'STATUS PROCESSO') {
        input = document.createElement('select');
        ['ANDAMENTO', 'CONCLUÍDO'].forEach(option => {
          const opt = document.createElement('option');
          opt.value = option;
          opt.textContent = option;
          input.appendChild(opt);
        });
      } else {
        input = document.createElement('input');
        input.type = 'text';
        if (['DATA ABERTURA', 'DATA PAGAMENTO 1', 'DATA PAGAMENTO 2', 'DATA PAGAMENTO 3', 'PREVISÃO CHEGADA', 'EMBARQUE', 'PREVI PRONTIDÃO'].includes(header)) {
          input.type = 'text';
        }
        if (['VALOR PI', 'PAGAMENTO 1', 'PAGAMENTO 2', 'PAGAMENTO 3'].includes(header)) {
          input.classList.add('currency');
        }
      }
      input.name = header;
      if(header === "SALDO PAGAR"){
        input.readOnly = true;
      }
      wrapper.appendChild(input);
      if (header === 'Nº PI') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = "✎";
        btn.style.marginLeft = "5px";
        btn.onclick = openProdutosFormCard;
        wrapper.appendChild(btn);
      }
      form.appendChild(wrapper);
    });
    attachEventListeners();
    $('input[name="DATA ABERTURA"], input[name="DATA PAGAMENTO 1"], input[name="DATA PAGAMENTO 2"], input[name="DATA PAGAMENTO 3"], input[name="PREVISÃO CHEGADA"], input[name="EMBARQUE"], input[name="PREVI PRONTIDÃO"]').inputmask('dd/mm/yyyy', { placeholder: 'DD/MM/AAAA' });
  }
  
  function attachEventListeners() {
    const valorPIInput = document.querySelector('input[name="VALOR PI"]');
    const pagamento1Input = document.querySelector('input[name="PAGAMENTO 1"]');
    const pagamento2Input = document.querySelector('input[name="PAGAMENTO 2"]');
    const pagamento3Input = document.querySelector('input[name="PAGAMENTO 3"]');
    const saldoPagarInput = document.querySelector('input[name="SALDO PAGAR"]');
    function updateSaldoPagar() {
      const valorPI = parseFloat(valorPIInput.value.replace(/[^\d.-]/g, '')) || 0;
      const pagamento1 = parseFloat(pagamento1Input.value.replace(/[^\d.-]/g, '')) || 0;
      const pagamento2 = parseFloat(pagamento2Input.value.replace(/[^\d.-]/g, '')) || 0;
      const pagamento3 = parseFloat(pagamento3Input.value.replace(/[^\d.-]/g, '')) || 0;
      const saldo = valorPI - (pagamento1 + pagamento2 + pagamento3);
      saldoPagarInput.value = formatCurrency(saldo.toString());
      saldoPagarInput.style.backgroundColor = saldo > 0 ? '#ffcccc' : '#f8f9fb';
    }
    [valorPIInput, pagamento1Input, pagamento2Input, pagamento3Input].forEach(input => {
      input.addEventListener('input', updateSaldoPagar);
    });
    const piInput = document.querySelector('input[name="Nº PI"]');
    if (piInput) {
      piInput.addEventListener('change', function() {
        currentPi = piInput.value.trim();
        updateProductsCard();
        updateMarineTraffic();
      });
      piInput.addEventListener('keyup', function() {
        currentPi = piInput.value.trim();
        updateProductsCard();
        updateMarineTraffic();
      });
    }
    const statusInput = document.querySelector('select[name="STATUS PROCESSO"]');
    if (statusInput) {
      statusInput.addEventListener('change', updateMarineTraffic);
    }
  }
  
  function populateForm(record) {
    const inputs = document.querySelectorAll('#importForm input, #importForm select');
    inputs.forEach((input, index) => {
      let value = record[index] || "";
      if (['DATA ABERTURA', 'DATA PAGAMENTO 1', 'DATA PAGAMENTO 2', 'DATA PAGAMENTO 3', 'PREVISÃO CHEGADA', 'EMBARQUE', 'PREVI PRONTIDÃO'].includes(input.name) && value) {
        if (value.indexOf("GMT") > -1) {
          let d = new Date(value);
          if (!isNaN(d.getTime())) {
            value = ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth()+1)).slice(-2) + "/" + d.getFullYear();
          }
        } else {
          let d = parseDateStringJS(value);
          if (d && !isNaN(d.getTime())) {
            value = ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth()+1)).slice(-2) + "/" + d.getFullYear();
          }
        }
      }
      if (['VALOR PI', 'SALDO PAGAR', 'PAGAMENTO 1', 'PAGAMENTO 2', 'PAGAMENTO 3'].includes(input.name) && value) {
        value = formatCurrency(value);
      }
      input.value = value;
      if (input.name === 'SALDO PAGAR') {
        input.style.backgroundColor = value && parseFloat(value.replace(/[^\d.-]/g, '')) > 0 ? '#ffcccc' : '#f8f9fb';
      }
    });
    isNewRecord = false;
    updateProductsCard();
    updateMarineTraffic();
    renderTimeline();
    updateRecordCounter();
  }
  
  function clearForm() {
    document.querySelectorAll('#importForm input, #importForm select').forEach(input => {
      input.value = "";
      if (input.name === 'SALDO PAGAR') input.style.backgroundColor = '#f8f9fb';
    });
    currentIndex = allData.length;
    isNewRecord = true;
    updateProductsCard();
    updateMarineTraffic();
    renderTimeline();
  }
  
  function saveData() {
    if (!confirm("Tem certeza que deseja salvar os dados?")) return;
    const formData = {};
    document.querySelectorAll("#importForm input, #importForm select").forEach(input => {
      formData[input.name] = input.value;
    });
    const piIndex = headers.indexOf("Nº PI");
    if (piIndex === -1) {
      displayError('O campo "Nº PI" não foi encontrado.');
      return;
    }
    const existingIndex = allData.findIndex(row => row[piIndex] === formData["Nº PI"]);
    if (existingIndex >= 0 && !isNewRecord) {
      allData[existingIndex] = headers.map(h => formData[h] || "");
      // Aqui você deverá substituir pela chamada AJAX para atualizar os dados no backend.
      displaySuccessMessage("Salvo!!!");
      updateRecordCounter();
    } else if (isNewRecord) {
      // Substitua por chamada AJAX para salvar os dados.
      displaySuccessMessage("Salvo!!!");
      updateRecordCounter();
    } else {
      alert('Clique em "Adicionar Novo Registro" para criar um novo cadastro.');
    }
  }
  
  function displaySuccessMessage(message) {
    if (!document.getElementById("successMessage")) {
      const msg = document.createElement("div");
      msg.id = "successMessage";
      msg.style.position = "fixed";
      msg.style.bottom = "20px";
      msg.style.right = "20px";
      msg.style.padding = "10px 20px";
      msg.style.backgroundColor = "#28a745";
      msg.style.color = "white";
      msg.style.borderRadius = "5px";
      msg.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
      msg.style.fontSize = "16px";
      msg.style.zIndex = "1000";
      msg.textContent = message;
      document.body.appendChild(msg);
      setTimeout(() => { msg.remove(); }, 3000);
    }
  }
  
  function navigateRecord(direction) {
    if (allData.length === 0) {
      displayError("Nenhum registro disponível.");
      return;
    }
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex >= allData.length) currentIndex = allData.length - 1;
    populateForm(allData[currentIndex]);
    updateRecordCounter();
  }
  
  function goToFirstRecord() {
    if (allData.length > 0) {
      currentIndex = 0;
      populateForm(allData[0]);
      updateRecordCounter();
    }
  }
  
  function goToLastRecord() {
    if (allData.length > 0) {
      currentIndex = allData.length - 1;
      populateForm(allData[currentIndex]);
      updateRecordCounter();
    }
  }
  
  function updateRecordCounter() {
    document.getElementById("recordCounter").textContent = `Registro ${currentIndex + 1} de ${allData.length}`;
  }
  
  function deleteRecord(piNumber) {
    const piNumberVal = document.querySelector('input[name="Nº PI"]').value;
    if (!piNumberVal) {
      displayError("Nenhum registro selecionado para exclusão.");
      return;
    }
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    // Substitua a chamada abaixo por uma requisição AJAX para excluir o registro no backend.
    allData = allData.filter(row => row[headers.indexOf("Nº PI")] !== piNumberVal);
    if (allData.length > 0) {
      currentIndex = Math.min(currentIndex, allData.length - 1);
      populateForm(allData[currentIndex]);
    } else {
      clearForm();
    }
    updateRecordCounter();
    displaySuccessMessage("Registro excluído com sucesso!");
  }
  
  function openProdutosFormCard() {
    const piInput = document.querySelector('input[name="Nº PI"]');
    if (!piInput) return;
    const piValue = piInput.value.trim();
    if (!piValue) {
      alert("Preencha o Nº PI antes.");
      return;
    }
    currentPi = piValue;
    // Aqui você deverá substituir as chamadas google.script.run por requisições AJAX para obter os dados dos produtos.
    document.getElementById("produtosFormCard").style.display = "block";
  }
  
  function buildProdutosForm(produtosHeaders) {
    const form = document.getElementById("produtosForm");
    form.innerHTML = "";
    produtosHeaders.forEach(function(header) {
      const div = document.createElement("div");
      const label = document.createElement("label");
      label.textContent = header;
      const input = document.createElement("input");
      input.name = header;
      if (header === "Nº PI" || header === "VALOR TOTAL") {
        input.readOnly = true;
      }
      if (header === "VALOR UNITÁRIO" || header === "VALOR TOTAL") {
        input.classList.add("currency");
      }
      div.appendChild(label);
      div.appendChild(input);
      form.appendChild(div);
    });
    if (!document.getElementById("produtosFormCounter")) {
      const counter = document.createElement("span");
      counter.id = "produtosFormCounter";
      document.getElementById("produtosFormNav").appendChild(counter);
    }
  }
  
  function populateProductsForm(index) {
    const form = document.getElementById("produtosForm");
    if (productsData && productsData.rows && productsData.rows.length > index) {
      const record = productsData.rows[index];
      productsData.headers.forEach((header, i) => {
        if (form.elements[header]) {
          form.elements[header].value = record[i];
        }
      });
      currentProductIndex = index;
      updateProductsFormCounter();
    }
  }
  
  function updateProductsFormCounter() {
    const counterElem = document.getElementById("produtosFormCounter");
    if (productsData && productsData.rows) {
      counterElem.textContent = `Produto ${currentProductIndex + 1} de ${productsData.rows.length}`;
    }
  }
  
  function nextProduct() {
    if (productsData && productsData.rows && currentProductIndex < productsData.rows.length - 1) {
      populateProductsForm(currentProductIndex + 1);
    }
  }
  
  function prevProduct() {
    if (productsData && productsData.rows && currentProductIndex > 0) {
      populateProductsForm(currentProductIndex - 1);
    }
  }
  
  function newProduct() {
    clearProdutosForm();
    document.getElementById("produtosFormCounter").textContent = "Novo Produto";
    currentProductIndex = -1;
    const productPiInput = document.querySelector('#produtosForm input[name="Nº PI"]');
    if (productPiInput) {
      productPiInput.value = currentPi;
    }
  }
  
  function clearProdutosForm() {
    const form = document.getElementById("produtosForm");
    Array.from(form.elements).forEach(el => {
      if (el.name) el.value = "";
    });
  }
  
  function deleteProduct() {
    const form = document.getElementById("produtosForm");
    const formData = {};
    Array.from(form.elements).forEach(el => {
      if (el.name) formData[el.name] = el.value;
    });
    if (!confirm("Confirma a exclusão deste produto?")) return;
    // Substitua por chamada AJAX para excluir o produto
    alert("Produto excluído com sucesso!");
    openProdutosFormCard();
  }
  
  function addProdutosCalcListeners() {
    const form = document.getElementById("produtosForm");
    if (!form) return;
    const quantidadeInput = form.elements["QUANTIDADE"];
    const valorUnitarioInput = form.elements["VALOR UNITÁRIO"];
    const valorTotalInput = form.elements["VALOR TOTAL"];
    if (quantidadeInput && valorUnitarioInput && valorTotalInput) {
      function updateValorTotal() {
        let quantidade = parseFloat(quantidadeInput.value.replace(/[^0-9.-]+/g, "")) || 0;
        let valorUnitario = parseFloat(valorUnitarioInput.value.replace(/[^0-9.-]+/g, "")) || 0;
        let total = quantidade * valorUnitario;
        valorTotalInput.value = formatCurrency(total.toString());
      }
      quantidadeInput.addEventListener("input", updateValorTotal);
      valorUnitarioInput.addEventListener("input", updateValorTotal);
    }
  }
  
  function closeProdutosFormCard() {
    document.getElementById("produtosFormCard").style.display = "none";
  }
  
  function saveProdutosForm() {
    const produtosForm = document.getElementById("produtosForm");
    const formData = {};
    Array.from(produtosForm.elements).forEach(el => {
      if (el.name) formData[el.name] = el.value;
    });
    // Substitua por chamada AJAX para salvar os dados do produto
    alert("Produto salvo com sucesso!");
    closeProdutosFormCard();
  }
  
  function loadAndamentoData() {
    // Esta função deve buscar os dados de importação em andamento do backend via AJAX.
    // Abaixo, um exemplo fictício de ordenação e renderização:
    const requiredColumns = ["DATA ABERTURA", "LOTES", "FORNECEDOR", "PRODUTOS", "Nº PI", "VALOR PI", "SALDO PAGAR", "PREVI PRONTIDÃO", "EMBARQUE", "PREVISÃO CHEGADA", "STATUS PROCESSO"];
    let colIndexes = [];
    let visHeaders = [];
    requiredColumns.forEach(function(col) {
      let idx = headers.indexOf(col);
      if (idx !== -1) {
        colIndexes.push(idx);
        visHeaders.push(col);
      }
    });
    const statusPos = visHeaders.indexOf("STATUS PROCESSO");
    let inProgData = allData.filter(row => row[colIndexes[statusPos]] === "ANDAMENTO");
    const previsaoPos = visHeaders.indexOf("PREVISÃO CHEGADA");
    inProgData.sort(function(a, b) {
      let dateA = a[colIndexes[previsaoPos]] ? parseDateStringJS(a[colIndexes[previsaoPos]]) : null;
      let dateB = b[colIndexes[previsaoPos]] ? parseDateStringJS(b[colIndexes[previsaoPos]]) : null;
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA - dateB;
    });
    let headersHtml = visHeaders.map(h => `<th>${h}</th>`).join('');
    document.getElementById("cardHeaders").innerHTML = headersHtml;
    let rowsHtml = "";
    let totalSaldo = 0;
    if (inProgData.length === 0) {
      rowsHtml = `<tr><td colspan="${visHeaders.length}">Nenhuma importação em andamento.</td></tr>`;
      document.getElementById("cardFooter").textContent = "Saldo a Pagar Total: $0.00";
    } else {
      inProgData.forEach(row => {
        let rowHtml = "<tr>";
        colIndexes.forEach(idx => {
          let cell = row[idx];
          let headerName = headers[idx];
          if (headerName === "VALOR PI" || headerName === "SALDO PAGAR") {
            cell = formatCurrency(cell);
            if (headerName === "SALDO PAGAR") {
              totalSaldo += parseFloat(cell.replace(/[^\d.-]/g, "")) || 0;
            }
          }
          rowHtml += `<td>${cell}</td>`;
        });
        rowHtml += "</tr>";
        rowsHtml += rowHtml;
      });
      document.getElementById("cardFooter").textContent = `Saldo a Pagar Total: ${formatCurrency(totalSaldo.toString())}`;
    }
    document.getElementById("cardRows").innerHTML = rowsHtml;
  }
  
  function updateProductsCard() {
    const piInput = document.querySelector('input[name="Nº PI"]');
    if (!piInput) return;
    const piValue = piInput.value.trim();
    // Substitua por chamada AJAX para obter dados de produtos
    // Exemplo fictício:
    const result = { headers: ["COL1", "COL2", "COL3"], rows: [["Produto1", "Valor1", "Valor2"]] };
    const filteredHeaders = result.headers.filter(h => h !== "VALOR UNITÁRIO" && h !== "VALOR TOTAL");
    let headerHtml = "";
    filteredHeaders.forEach(header => { headerHtml += `<th>${header}</th>`; });
    document.getElementById("productsTableHeaders").innerHTML = headerHtml;
    let bodyHtml = "";
    if (result.rows && result.rows.length > 0) {
      result.rows.forEach(row => {
        let filteredRow = [];
        result.headers.forEach((header, i) => {
          if (header !== "VALOR UNITÁRIO" && header !== "VALOR TOTAL") {
            filteredRow.push(row[i]);
          }
        });
        bodyHtml += "<tr>";
        filteredRow.forEach(cell => { bodyHtml += `<td>${cell}</td>`; });
        bodyHtml += "</tr>";
      });
    } else {
      bodyHtml = `<tr><td colspan="${filteredHeaders.length}">Nenhum produto encontrado para este Nº PI.</td></tr>`;
    }
    document.getElementById("productsTableHeaders").innerHTML = headerHtml;
    document.getElementById("productsCardRows").innerHTML = bodyHtml;
  }
  
  function updateMarineTraffic() {
    const statusInput = document.querySelector('select[name="STATUS PROCESSO"]');
    const mtContainer = document.getElementById("marineTrafficContainer");
    const localNavioInput = document.querySelector('input[name="LOCAL NAVIO"]');
    if (!statusInput || !mtContainer || !localNavioInput) return;
    if (statusInput.value === "ANDAMENTO") {
      const localNavio = localNavioInput.value.trim();
      if (localNavio) {
        mtContainer.innerHTML = `<iframe src="${localNavio}"></iframe>`;
        mtContainer.style.display = "block";
      } else {
        mtContainer.style.display = "none";
      }
    } else {
      mtContainer.style.display = "none";
    }
  }
  
  function hideProductsCard() {
    document.getElementById("productsCardRows").innerHTML = `<tr><td colspan="6">Nenhum produto encontrado para este Nº PI.</td></tr>`;
  }
  
  function formatCurrency(value) {
    const num = parseFloat(String(value).replace(/[^\d.-]/g, ""));
    return isNaN(num) ? "" : "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  
  function handleError(error) {
    displayError(`Erro: ${error.message}`);
  }
  
  function displayError(message) {
    const el = document.getElementById("errorMessage");
    el.textContent = message;
    el.style.display = "block";
  }
  
  function loadContratosData() {
    // Substitua por chamada AJAX para obter os dados de contratos do backend.
    // Exemplo fictício:
    const data = { rows: [], headers: [] };
    contratosData = data.rows || [];
    renderContratoForm();
    if (contratosData.length > 0) {
      populateContratoForm(contratosData[0]);
      updateContratoCounter();
    } else {
      clearContratoForm();
    }
  }
  
  function renderContratoForm() {
    const form = document.getElementById("contratosForm");
    form.innerHTML = "";
    contratosHeadersList.forEach(header => {
      const wrapper = document.createElement("div");
      const label = document.createElement("label");
      label.textContent = header;
      wrapper.appendChild(label);
      let input;
      if (header === "BANCO/CORRETORA") {
        input = document.createElement("select");
        input.name = header;
        ["ADVANCE", "ITAÚ", "BB"].forEach(optVal => {
          let opt = document.createElement("option");
          opt.value = optVal;
          opt.textContent = optVal;
          input.appendChild(opt);
        });
      } else if (header === "APRESENTAÇÃO BANCO" || header === "CONTABILIDADE") {
        input = document.createElement("select");
        input.name = header;
        ["OK", "EM ABERTO"].forEach(optVal => {
          let opt = document.createElement("option");
          opt.value = optVal;
          opt.textContent = optVal;
          input.appendChild(opt);
        });
      } else if (header === "TIPO FECHAMENTO") {
        input = document.createElement("select");
        input.name = header;
        ["", "FINIMP", "CAIXA"].forEach(optVal => {
          let opt = document.createElement("option");
          opt.value = optVal;
          opt.textContent = optVal;
          input.appendChild(opt);
        });
      } else {
        input = document.createElement("input");
        input.type = "text";
        input.name = header;
        input.addEventListener("input", function() {
          this.value = this.value.toUpperCase();
        });
      }
      wrapper.appendChild(input);
      form.appendChild(wrapper);
    });
  }
  
  function populateContratoForm(record) {
    const inputs = document.querySelectorAll("#contratosForm input, #contratosForm select");
    inputs.forEach((input, index) => {
      input.value = record[index] || "";
    });
  }
  
  function clearContratoForm() {
    const inputs = document.querySelectorAll("#contratosForm input, #contratosForm select");
    inputs.forEach(input => {
      input.value = "";
    });
    currentContratoIndex = contratosData.length;
  }
  
  function navigateContrato(direction) {
    if (contratosData.length === 0) {
      displayError("Nenhum registro de contrato disponível.");
      return;
    }
    currentContratoIndex += direction;
    if (currentContratoIndex < 0) currentContratoIndex = 0;
    if (currentContratoIndex >= contratosData.length) currentContratoIndex = contratosData.length - 1;
    populateContratoForm(contratosData[currentContratoIndex]);
    updateContratoCounter();
  }
  
  function goToFirstContrato() {
    if (contratosData.length > 0) {
      currentContratoIndex = 0;
      populateContratoForm(contratosData[0]);
      updateContratoCounter();
    }
  }
  
  function goToLastContrato() {
    if (contratosData.length > 0) {
      currentContratoIndex = contratosData.length - 1;
      populateContratoForm(contratosData[currentContratoIndex]);
      updateContratoCounter();
    }
  }
  
  function updateContratoCounter() {
    document.getElementById("contratoCounter").textContent = `Contrato ${currentContratoIndex + 1} de ${contratosData.length}`;
  }
  
  function saveContrato() {
    const formData = {};
    document.querySelectorAll("#contratosForm input, #contratosForm select").forEach(input => {
      formData[input.name] = input.value;
    });
    // Substitua por chamada AJAX para salvar o contrato no backend.
    displaySuccessMessage("Contrato salvo com sucesso!");
    loadContratosData();
  }
  
  function deleteContrato() {
    const contratoValue = document.querySelector('input[name="CONTRATO"]').value;
    if (!contratoValue) {
      displayError("Nenhum contrato selecionado para exclusão.");
      return;
    }
    if (!confirm("Tem certeza que deseja excluir este contrato?")) return;
    // Substitua por chamada AJAX para excluir o contrato.
    displaySuccessMessage("Contrato excluído com sucesso!");
    loadContratosData();
  }
  
  function handlePIFolder() {
    const piInput = document.querySelector('input[name="Nº PI"]');
    const nPi = piInput ? piInput.value.trim() : "";
    if (!nPi) {
      alert("O campo Nº PI está vazio. Preencha-o para criar a pasta.");
      return;
    }
    // Aqui você deverá implementar a lógica de criação/abertura de pasta via backend.
    alert("Função handlePIFolder chamada. Implemente a integração com o backend.");
  }
  
  function handleCIFolder() {
    const piInput = document.querySelector('input[name="Nº PI"]');
    const nPi = piInput ? piInput.value.trim() : "";
    if (!nPi) {
      alert("O campo Nº PI está vazio. Preencha-o para criar a pasta.");
      return;
    }
    // Implemente a lógica para CI.
    alert("Função handleCIFolder chamada. Implemente a integração com o backend.");
  }
  
  function uploadFile(files) {
    if (files.length === 0) return;
    // Implemente a lógica de upload via backend.
    alert("Função uploadFile chamada. Implemente a integração com o backend.");
  }
  
  function renderTimeline() {
    const timelineFields = ["DATA ABERTURA", "DATA PAGAMENTO 1", "DATA PAGAMENTO 2", "DATA PAGAMENTO 3", "PREVISÃO CHEGADA", "EMBARQUE", "PREVI PRONTIDÃO"];
    let markerObjects = [];
    
    timelineFields.forEach(field => {
      const input = document.querySelector(`input[name="${field}"]`);
      if (input && input.value.trim() !== "") {
        const date = parseDateStringJS(input.value.trim());
        if (date) {
          markerObjects.push({
            field: field,
            date: date,
            value: input.value.trim()
          });
        }
      }
    });
    
    markerObjects.sort((a, b) => a.date - b.date);
    
    const now = new Date();
    let closestPastMarkerIndex = -1;
    for (let i = 0; i < markerObjects.length; i++) {
      if (markerObjects[i].date <= now) {
        closestPastMarkerIndex = i;
      } else {
        break;
      }
    }
    
    const markersHTML = markerObjects.map((marker, index) => {
      let ballStyle = "";
      if (index === closestPastMarkerIndex) {
        ballStyle = 'style="background-color: red;"';
      }
      return `<div class="timeline-marker">
                <div class="timeline-ball" ${ballStyle}></div>
                <div class="timeline-label">${marker.field}: ${marker.value}</div>
              </div>`;
    }).join("");
    
    let timelineHtml = "";
    if (markersHTML) {
      timelineHtml = `<div id="timelineContainerInner">
                        <div id="timeline"></div>
                        <div class="timeline-markers">${markersHTML}</div>
                      </div>`;
    }
    document.getElementById("timelineContainer").innerHTML = timelineHtml;
  }
  