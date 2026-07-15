// ==============================n// BALU FOOD - COMPRAS DE INSUMOS E EMBALAGENSn// Lançamento simples para alimentar o CMV real.n// ==============================

var comprasCache = [];
var BALU_COMPRAS_STORAGE_KEY = "balu_compras_realizadas";

document.addEventListener("DOMContentLoaded", function () {
  comprasCache = normalizarCompras(carregarListaCompra(BALU_COMPRAS_STORAGE_KEY).concat(carregarListaCompra("balu_compras")));
  comprasCache = removerDuplicadasCompras(comprasCache);
  initComprasRealizadas();
  renderCompras();
});

function initComprasRealizadas() {
  var form = document.getElementById("formCompra");
  var btnNova = document.getElementById("btnNovaCompra");
  var btnExportar = document.getElementById("btnExportarCompras");
  var search = document.getElementById("searchCompras");
  var valorNota = document.getElementById("compraValorNota");
  var valorFora = document.getElementById("compraValorForaEstoque");
  var inputImagem = document.getElementById("compraImagemInput");

  if (btnNova) btnNova.addEventListener("click", function () { abrirCompra(); });
  if (btnExportar) btnExportar.addEventListener("click", exportarComprasCsv);
  if (search) search.addEventListener("input", renderTabelaCompras);
  if (valorNota) valorNota.addEventListener("input", atualizarPreviewCompra);
  if (valorFora) valorFora.addEventListener("input", atualizarPreviewCompra);
  if (form) form.addEventListener("submit", function (event) { event.preventDefault(); salvarCompra(); });

  if (inputImagem) {
    inputImagem.addEventListener("change", function () {
      var file = inputImagem.files && inputImagem.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (event) {
        inputImagem.dataset.imageBase64 = event.target.result;
        var preview = document.getElementById("compraImagemPreview");
        var placeholder = document.getElementById("compraImagemPlaceholder");
        if (preview && String(event.target.result).indexOf("data:image") === 0) {
          preview.src = event.target.result;
          preview.style.display = "block";
          if (placeholder) placeholder.style.display = "none";
        } else if (placeholder) {
          placeholder.innerHTML = "<i data-lucide='file-check'></i><strong>Arquivo anexado</strong><small>" + escaparCompra(file.name || "comprovante") + "</small>";
          if (typeof window.BALU_RENDER_ICONS === "function") window.BALU_RENDER_ICONS();
        }
      };
      reader.readAsDataURL(file);
    });
  }
}

function abrirCompra(item) {
  resetarFormularioCompra();
  document.getElementById("drawerCompraTitle").textContent = item ? "Editar Compra" : "Registrar Compra";
  setCompra("compraId", item ? item.id : "");
  setCompra("compraData", item ? (item.data || item.dataCompra) : hojeCompra());
  setCompra("compraLocal", item ? (item.localCompra || item.fornecedor || "") : "");
  setCompra("compraPagamento", item ? (item.formaPagamento || item.pagamento || "PIX") : "PIX");
  setCompra("compraValorNota", item ? numeroCompra(item.valorTotalNota || item.valorTotal || item.valorNota || item.totalNota || item.total || item.valor) : "");
  setCompra("compraValorForaEstoque", item ? numeroCompra(item.valorForaEstoque || item.foraEstoque || item.valorNaoEstoque || 0) : "");
  setCompra("compraObservacoes", item ? (item.observacoes || "") : "");

  var inputImagem = document.getElementById("compraImagemInput");
  var preview = document.getElementById("compraImagemPreview");
  var placeholder = document.getElementById("compraImagemPlaceholder");
  if (item && inputImagem) inputImagem.dataset.imageBase64 = item.imagem || item.anexo || "";
  if (item && item.imagem && preview && String(item.imagem).indexOf("data:image") === 0) {
    preview.src = item.imagem;
    preview.style.display = "block";
    if (placeholder) placeholder.style.display = "none";
  }
  atualizarPreviewCompra();
  openDrawer("drawerCompra");
}

function resetarFormularioCompra() {
  var form = document.getElementById("formCompra");
  var inputImagem = document.getElementById("compraImagemInput");
  var preview = document.getElementById("compraImagemPreview");
  var placeholder = document.getElementById("compraImagemPlaceholder");
  if (form) form.reset();
  if (inputImagem) { inputImagem.value = ""; inputImagem.dataset.imageBase64 = ""; }
  if (preview) { preview.src = ""; preview.style.display = "none"; }
  if (placeholder) {
    placeholder.style.display = "block";
    placeholder.innerHTML = "<i data-lucide='receipt'></i><strong>Adicionar foto da notinha</strong><small>Cupom fiscal, foto, PDF ou comprovante.</small>";
  }
  if (typeof window.BALU_RENDER_ICONS === "function") window.BALU_RENDER_ICONS();
}

function salvarCompra() {
  var id = getCompra("compraId");
  var data = getCompra("compraData");
  var local = getCompra("compraLocal");
  var valorNota = numeroCompra(getCompra("compraValorNota"));
  var valorFora = numeroCompra(getCompra("compraValorForaEstoque"));
  var valorEstoque = Math.max(0, valorNota - valorFora);

  if (!data || !local || valorNota <= 0) {
    msgCompra("Informe data, local da compra e valor total da nota.", "warning");
    return;
  }
  if (valorFora > valorNota) {
    msgCompra("O valor fora do estoque não pode ser maior que o valor da nota.", "warning");
    return;
  }

  var antigo = id ? comprasCache.find(function (item) { return item.id === id; }) : null;
  var anexo = getAnexoCompra() || (antigo ? (antigo.imagem || antigo.anexo || "") : "");
  var agora = new Date().toISOString();
  var compra = {
    id: id || gerarIdCompra(),
    data: data,
    dataCompra: data,
    competencia: data.slice(0, 7),
    localCompra: local,
    fornecedor: local,
    formaPagamento: getCompra("compraPagamento") || "PIX",
    pagamento: getCompra("compraPagamento") || "PIX",
    valorTotalNota: valorNota,
    valorNota: valorNota,
    valorForaEstoque: valorFora,
    valorNaoEstoque: valorFora,
    valorDestinadoEstoque: valorEstoque,
    valorCmv: valorEstoque,
    valor: valorEstoque,
    total: valorEstoque,
    valorTotal: valorEstoque,
    status: "Confirmada",
    observacoes: getCompra("compraObservacoes"),
    imagem: anexo,
    anexo: anexo,
    comprovante: anexo ? "Sim" : "Não",
    criadoEm: antigo ? antigo.criadoEm : agora,
    atualizadoEm: agora
  };

  if (id) comprasCache = comprasCache.map(function (item) { return item.id === id ? compra : item; });
  else comprasCache.push(compra);

  salvarComprasLocal();
  closeDrawer();
  renderCompras();
  msgCompra("Compra salva com sucesso.", "success");
}

function editarCompra(id) {
  var item = comprasCache.find(function (compra) { return compra.id === id; });
  if (item) abrirCompra(item);
}

function excluirCompra(id) {
  if (!confirm("Deseja excluir esta compra?")) return;
  comprasCache = comprasCache.filter(function (item) { return item.id !== id; });
  salvarComprasLocal();
  renderCompras();
}

function atualizarPreviewCompra() {
  var valorNota = numeroCompra(getCompra("compraValorNota"));
  var valorFora = numeroCompra(getCompra("compraValorForaEstoque"));
  setTextoCompra("compraValorEstoquePreview", moedaCompra(Math.max(0, valorNota - valorFora)));
}

function renderCompras() {
  renderResumoCompras();
  renderGraficoCompras();
  renderTabelaCompras();
  if (typeof window.BALU_RENDER_ICONS === "function") window.BALU_RENDER_ICONS();
}

function renderResumoCompras() {
  var comp = competenciaAtualCompra();
  var lista = comprasCache.filter(function (item) { return (item.competencia || String(item.data || "").slice(0, 7)) === comp; });
  var totalEstoque = somaCompra(lista, valorDestinadoEstoqueCompra);
  var totalFora = somaCompra(lista, function (item) { return numeroCompra(item.valorForaEstoque || item.valorNaoEstoque || 0); });
  setTextoCompra("comprasValorEstoqueMes", moedaCompra(totalEstoque));
  setTextoCompra("comprasQuantidadeMes", lista.length);
  setTextoCompra("comprasTicketMedio", moedaCompra(lista.length ? totalEstoque / lista.length : 0));
  setTextoCompra("comprasForaEstoqueMes", moedaCompra(totalFora));
}

function renderGraficoCompras() {
  var el = document.getElementById("comprasGraficoMensal");
  if (!el) return;
  var meses = agruparComprasPorMes();
  var keys = Object.keys(meses).sort().slice(-12);
  if (!keys.length) {
    el.innerHTML = "<div class='empty-state-alert compact'><strong>Sem histórico.</strong><p>Registre compras para visualizar a evolução mensal.</p></div>";
    return;
  }
  var maior = Math.max.apply(null, keys.map(function (k) { return meses[k]; })) || 1;
  el.innerHTML = keys.map(function (k) {
    var perc = Math.max(5, (meses[k] / maior) * 100);
    return "<div class='bar-row'><span>" + mesCurtoCompra(k) + "</span><div class='bar-track'><div class='bar-fill' style='width:" + perc + "%'></div></div><strong>" + moedaCompra(meses[k]) + "</strong></div>";
  }).join("");
}

function renderTabelaCompras() {
  var tbody = document.getElementById("comprasTable");
  if (!tbody) return;
  var busca = normalizarCompra(getCompra("searchCompras"));
  var lista = comprasCache.filter(function (item) {
    var texto = normalizarCompra([item.data, item.localCompra, item.fornecedor, item.formaPagamento, item.observacoes].join(" "));
    return !busca || texto.indexOf(busca) >= 0;
  }).sort(function (a, b) { return dataTsCompra(b.data) - dataTsCompra(a.data); });
  if (!lista.length) {
    tbody.innerHTML = "<tr><td colspan='8' class='text-muted'>Nenhuma compra encontrada.</td></tr>";
    return;
  }
  tbody.innerHTML = lista.map(function (item) {
    return "<tr>" +
      "<td>" + dataBRCompra(item.data) + "</td>" +
      "<td><strong>" + escaparCompra(item.localCompra || item.fornecedor || "-") + "</strong><span class='table-subtext'>" + escaparCompra(item.observacoes || "") + "</span></td>" +
      "<td>" + escaparCompra(item.formaPagamento || item.pagamento || "-") + "</td>" +
      "<td>" + moedaCompra(numeroCompra(item.valorTotalNota || item.valorNota || item.valorTotal || item.total || item.valor)) + "</td>" +
      "<td>" + moedaCompra(numeroCompra(item.valorForaEstoque || item.valorNaoEstoque || 0)) + "</td>" +
      "<td><strong>" + moedaCompra(valorDestinadoEstoqueCompra(item)) + "</strong></td>" +
      "<td>" + (item.imagem || item.anexo ? "<span class='badge success'>Anexado</span>" : "<span class='badge neutral'>Sem anexo</span>") + "</td>" +
      "<td><div class='table-actions'><button type='button' class='btn-icon' title='Editar' onclick='editarCompra(\"" + escaparAttrCompra(item.id) + "\")'><i data-lucide='edit-3'></i><span class='sr-only'>Editar</span></button><button type='button' class='btn-icon danger' title='Excluir' onclick='excluirCompra(\"" + escaparAttrCompra(item.id) + "\")'><i data-lucide='trash-2'></i><span class='sr-only'>Excluir</span></button></div></td>" +
    "</tr>";
  }).join("");
}

function valorDestinadoEstoqueCompra(item) {
  if (item.valorDestinadoEstoque != null) return numeroCompra(item.valorDestinadoEstoque);
  if (item.valorCmv != null) return numeroCompra(item.valorCmv);
  var nota = numeroCompra(item.valorTotalNota || item.valorNota || item.valorTotal || item.total || item.valor);
  var fora = numeroCompra(item.valorForaEstoque || item.valorNaoEstoque || 0);
  return Math.max(0, nota - fora);
}

function normalizarCompras(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.map(function (item) {
    var data = item.data || item.dataCompra || item.criadoEm || hojeCompra();
    return Object.assign({}, item, {
      id: item.id || gerarIdCompra(),
      data: String(data).slice(0, 10),
      competencia: item.competencia || String(data).slice(0, 7),
      localCompra: item.localCompra || item.fornecedor || item.local || "Compra",
      formaPagamento: item.formaPagamento || item.pagamento || "PIX",
      valorTotalNota: numeroCompra(item.valorTotalNota || item.valorNota || item.valorOriginal || item.valorTotal || item.total || item.valor),
      valorForaEstoque: numeroCompra(item.valorForaEstoque || item.valorNaoEstoque || 0),
      valorDestinadoEstoque: valorDestinadoEstoqueCompra(item)
    });
  }).filter(function (item) { return item.valorTotalNota > 0 || item.valorDestinadoEstoque > 0; });
}

function removerDuplicadasCompras(lista) {
  var vistos = {};
  return lista.filter(function (item) {
    if (vistos[item.id]) return false;
    vistos[item.id] = true;
    return true;
  });
}

function agruparComprasPorMes() {
  var mapa = {};
  comprasCache.forEach(function (item) {
    var comp = item.competencia || String(item.data || "").slice(0, 7);
    if (!comp) return;
    mapa[comp] = (mapa[comp] || 0) + valorDestinadoEstoqueCompra(item);
  });
  return mapa;
}

function exportarComprasCsv() {
  var linhas = [["Data", "Local", "Pagamento", "ValorNota", "ValorForaEstoque", "ValorDestinadoEstoque", "Observacoes"]];
  comprasCache.forEach(function (item) {
    linhas.push([item.data, item.localCompra, item.formaPagamento, numeroCsvCompra(item.valorTotalNota), numeroCsvCompra(item.valorForaEstoque), numeroCsvCompra(valorDestinadoEstoqueCompra(item)), item.observacoes || ""]);
  });
  baixarCsvCompra("compras-insumos-embalagens.csv", linhas);
}

function carregarListaCompra(key) { try { var raw = localStorage.getItem(key); var arr = raw ? JSON.parse(raw) : []; return Array.isArray(arr) ? arr : []; } catch (e) { return []; } }
function salvarComprasLocal() { localStorage.setItem(BALU_COMPRAS_STORAGE_KEY, JSON.stringify(comprasCache)); }
function getCompra(id) { var el = document.getElementById(id); return el ? el.value : ""; }
function setCompra(id, valor) { var el = document.getElementById(id); if (el) el.value = valor == null ? "" : valor; }
function setTextoCompra(id, valor) { var el = document.getElementById(id); if (el) el.textContent = valor == null ? "" : valor; }
function numeroCompra(v) { if (typeof v === "number") return isFinite(v) ? v : 0; var s = String(v || "").replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, ""); var n = parseFloat(s); return isNaN(n) ? 0 : n; }
function somaCompra(lista, fn) { return lista.reduce(function (s, item) { return s + numeroCompra(fn(item)); }, 0); }
function moedaCompra(v) { return numeroCompra(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function dataBRCompra(v) { if (!v) return "-"; var p = String(v).slice(0, 10).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : v; }
function dataTsCompra(v) { var t = new Date(v || 0).getTime(); return isNaN(t) ? 0 : t; }
function hojeCompra() { return new Date().toISOString().slice(0, 10); }
function competenciaAtualCompra() { return new Date().toISOString().slice(0, 7); }
function mesCurtoCompra(comp) { var nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]; var m = parseInt(String(comp).slice(5, 7), 10) - 1; return (nomes[m] || comp) + "/" + String(comp).slice(2, 4); }
function normalizarCompra(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function escaparCompra(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function escaparAttrCompra(s) { return escaparCompra(s).replace(/'/g, "&#39;"); }
function gerarIdCompra() { return "COMP-" + Date.now() + "-" + Math.random().toString(16).slice(2); }
function getAnexoCompra() { var input = document.getElementById("compraImagemInput"); return input ? (input.dataset.imageBase64 || "") : ""; }
function msgCompra(msg, tipo) { if (typeof showToast === "function") showToast(msg, tipo || "info"); else alert(msg); }
function numeroCsvCompra(v) { return String(numeroCompra(v).toFixed(2)).replace(".", ","); }
function baixarCsvCompra(nome, linhas) { var csv = linhas.map(function (linha) { return linha.map(function (c) { return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"'; }).join(";"); }).join("\n"); var blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }); var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nome; a.click(); URL.revokeObjectURL(a.href); }
