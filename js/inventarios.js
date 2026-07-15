// ==============================
// BALU FOOD - INVENTÁRIO ENXUTO
// Quantidade física -> valor financeiro do estoque -> CMV real.
// ==============================

var inventariosCache = [];
var inventarioItensBase = [];
var BALU_INVENTARIOS_KEY = "balu_inventarios";
var BALU_LISTA_COMPRAS_KEY = "balu_lista_compras_sugerida";

document.addEventListener("DOMContentLoaded", function () {
  inventariosCache = carregarListaInventario(BALU_INVENTARIOS_KEY);
  inventarioItensBase = carregarItensInventarioBase();
  initInventario();
  renderInventarios();
});

function initInventario() {
  var btnFechamento = document.getElementById("btnFechamentoEstoque");
  var btnConferencia = document.getElementById("btnConferenciaEstoque");
  var form = document.getElementById("formInventario");
  var search = document.getElementById("searchInventarios");
  var tipo = document.getElementById("inventarioTipo");
  var tbody = document.getElementById("inventarioItensTable");

  if (btnFechamento) btnFechamento.addEventListener("click", function () { abrirInventario(null, "Fechamento de Estoque"); });
  if (btnConferencia) btnConferencia.addEventListener("click", function () { abrirInventario(null, "Conferência de Estoque"); });
  if (search) search.addEventListener("input", renderTabelaInventarios);
  if (tipo) tipo.addEventListener("change", function () { renderItensInventario(); atualizarPreviewInventario(); });
  if (form) form.addEventListener("submit", function (event) { event.preventDefault(); salvarInventario(); });
  if (tbody) tbody.addEventListener("input", function (event) { if (event.target.classList.contains("inventario-qtd")) atualizarLinhaInventario(event.target); });
}

function abrirInventario(item, tipo) {
  inventarioItensBase = carregarItensInventarioBase();
  setInv("inventarioId", item ? item.id : "");
  setInv("inventarioCompetencia", item ? item.competencia : competenciaAtualInv());
  setInv("inventarioTipo", item ? item.tipo : tipo || "Fechamento de Estoque");
  setInv("inventarioData", item ? (item.data || item.dataInventario || hojeInv()) : hojeInv());
  setInv("inventarioObservacoes", item ? (item.observacoes || "") : "");
  setTextoInv("drawerInventarioTitle", item ? "Editar " + item.tipo : tipo || "Fechamento de Estoque");
  renderItensInventario(item ? item.itens : null);
  atualizarPreviewInventario();
  openDrawer("drawerInventario");
}

function renderItensInventario(itensSalvos) {
  var tbody = document.getElementById("inventarioItensTable");
  if (!tbody) return;
  var mapa = {};
  if (Array.isArray(itensSalvos)) {
    itensSalvos.forEach(function (item) { mapa[item.itemKey || item.id || item.itemId] = numeroInv(item.quantidadeFisica || item.quantidade || item.estoqueFisico); });
  }
  var tipo = getInv("inventarioTipo") || "Fechamento de Estoque";
  var agrupados = inventarioItensBase.slice().sort(function (a, b) {
    return (a.grupoOrdem - b.grupoOrdem) || normalizarInv(a.nome).localeCompare(normalizarInv(b.nome));
  });
  if (!agrupados.length) {
    tbody.innerHTML = "<tr><td colspan='7' class='text-muted'>Cadastre insumos, embalagens ou produtos de revenda para montar a tabela automaticamente.</td></tr>";
    return;
  }
  tbody.innerHTML = agrupados.map(function (item) {
    var qtd = mapa[item.itemKey] || "";
    var obrigatorio = tipo === "Conferência de Estoque" ? "" : "required";
    return "<tr data-key='" + escaparAttrInv(item.itemKey) + "' data-custo='" + item.custoUnitario + "' data-tipo='" + escaparAttrInv(item.tipo) + "' data-ideal='" + item.estoqueIdeal + "'>" +
      "<td><strong>" + escaparInv(item.nome) + "</strong><span class='table-subtext'>" + escaparInv(item.origem) + "</span></td>" +
      "<td>" + escaparInv(item.categoria) + "</td>" +
      "<td>" + escaparInv(item.unidade) + "</td>" +
      "<td>" + moedaInv(item.custoUnitario) + "</td>" +
      "<td>" + formatarNumeroInv(item.estoqueIdeal) + "</td>" +
      "<td><input type='number' min='0' step='0.001' class='inventario-qtd' value='" + (qtd === "" ? "" : qtd) + "' " + obrigatorio + "></td>" +
      "<td><strong class='inventario-total-linha'>R$ 0,00</strong></td>" +
    "</tr>";
  }).join("");
  document.querySelectorAll(".inventario-qtd").forEach(atualizarLinhaInventario);
}

function atualizarLinhaInventario(input) {
  var tr = input.closest("tr");
  if (!tr) return;
  var qtd = numeroInv(input.value);
  var custo = numeroInv(tr.getAttribute("data-custo"));
  var total = qtd * custo;
  var totalEl = tr.querySelector(".inventario-total-linha");
  if (totalEl) totalEl.textContent = moedaInv(total);
  atualizarPreviewInventario();
}

function atualizarPreviewInventario() {
  var total = coletarItensInventario().total;
  setTextoInv("inventarioTotalPreview", moedaInv(total));
}

function salvarInventario() {
  var id = getInv("inventarioId");
  var competencia = getInv("inventarioCompetencia");
  var tipo = getInv("inventarioTipo");
  var coletado = coletarItensInventario();

  if (!competencia || !tipo) {
    msgInv("Informe competência e tipo do inventário.", "warning");
    return;
  }
  if (coletado.total <= 0 && tipo !== "Conferência de Estoque") {
    msgInv("Preencha pelo menos uma quantidade física.", "warning");
    return;
  }

  var registro = {
    id: id || gerarIdInv(),
    competencia: competencia,
    data: getInv("inventarioData") || hojeInv(),
    tipo: tipo,
    itens: coletado.itens,
    total: coletado.total,
    totalEstoque: coletado.total,
    totalProducao: coletado.producao,
    totalRevenda: coletado.revenda,
    totalEmbalagens: coletado.embalagens,
    observacoes: getInv("inventarioObservacoes"),
    atualizadoEm: new Date().toISOString()
  };

  inventariosCache = inventariosCache.filter(function (item) { return item.id !== id; });
  if (tipo !== "Conferência de Estoque") {
    inventariosCache = inventariosCache.filter(function (item) { return !(item.competencia === competencia && item.tipo === tipo); });
  }
  inventariosCache.push(registro);
  localStorage.setItem(BALU_INVENTARIOS_KEY, JSON.stringify(inventariosCache));

  if (tipo === "Conferência de Estoque") atualizarListaComprasSugerida(coletado.itens, competencia);

  closeDrawer();
  renderInventarios();
  msgInv("Inventário salvo com sucesso.", "success");
}

function coletarItensInventario() {
  var tipoInventario = getInv("inventarioTipo") || "Fechamento de Estoque";
  var linhas = document.querySelectorAll("#inventarioItensTable tr[data-key]");
  var itens = [];
  var totais = { total: 0, producao: 0, revenda: 0, embalagens: 0, itens: itens };
  linhas.forEach(function (tr) {
    var input = tr.querySelector(".inventario-qtd");
    var raw = input ? input.value : "";
    if (tipoInventario === "Conferência de Estoque" && String(raw).trim() === "") return;
    var base = inventarioItensBase.find(function (item) { return item.itemKey === tr.getAttribute("data-key"); }) || {};
    var qtd = numeroInv(raw);
    var custo = numeroInv(tr.getAttribute("data-custo"));
    var valor = qtd * custo;
    var item = {
      itemKey: base.itemKey,
      itemId: base.id,
      itemTipo: base.itemTipo,
      nome: base.nome,
      categoria: base.categoria,
      grupo: base.tipo,
      unidade: base.unidade,
      quantidadeFisica: qtd,
      custoUnitario: custo,
      estoqueIdeal: base.estoqueIdeal,
      valorTotal: valor
    };
    itens.push(item);
    totais.total += valor;
    if (base.tipo === "Embalagens") totais.embalagens += valor;
    else if (base.tipo === "Revendas") totais.revenda += valor;
    else totais.producao += valor;
  });
  return totais;
}

function carregarItensInventarioBase() {
  var insumos = carregarListaInventario("balu_insumos").map(function (item) {
    var unidade = item.unidadeConsumo || item.unidadeCompra || "unidade";
    return {
      itemKey: "insumo-" + (item.id || item.codigo || item.nome),
      id: item.id || item.codigo || item.nome,
      itemTipo: "insumo",
      origem: "Cadastro de Insumos",
      nome: item.nome || item.descricao || "Insumo",
      categoria: item.grupo || item.categoria || "Produção",
      tipo: "Produção",
      grupoOrdem: 1,
      unidade: unidade,
      custoUnitario: custoUnitarioInsumoInv(item, unidade),
      estoqueIdeal: numeroInv(item.estoqueIdeal || 0)
    };
  });
  var produtos = carregarListaInventario("balu_produtos").filter(function (item) {
    return normalizarInv(item.tipo || item.classificacao || item.categoria).indexOf("revenda") >= 0;
  }).map(function (item) {
    return {
      itemKey: "revenda-" + (item.id || item.codigo || item.nome),
      id: item.id || item.codigo || item.nome,
      itemTipo: "revenda",
      origem: "Produtos / Revendas",
      nome: item.nome || "Produto de Revenda",
      categoria: item.categoria || "Revendas",
      tipo: "Revendas",
      grupoOrdem: 2,
      unidade: item.unidade || "unidade",
      custoUnitario: numeroInv(item.custoUnitario || item.custo || item.precoCusto || 0),
      estoqueIdeal: numeroInv(item.estoqueIdeal || 0)
    };
  });
  var embalagens = carregarListaInventario("balu_embalagens").map(function (item) {
    return {
      itemKey: "embalagem-" + (item.id || item.codigo || item.nome),
      id: item.id || item.codigo || item.nome,
      itemTipo: "embalagem",
      origem: "Cadastro de Embalagens",
      nome: item.nome || "Embalagem",
      categoria: item.grupo || item.categoria || "Embalagens",
      tipo: "Embalagens",
      grupoOrdem: 3,
      unidade: item.unidadeConsumo || item.unidade || "unidade",
      custoUnitario: numeroInv(item.precoUnitario || item.custoUnitario || 0),
      estoqueIdeal: numeroInv(item.estoqueIdeal || 0)
    };
  });
  return insumos.concat(produtos).concat(embalagens).filter(function (item) { return item.custoUnitario > 0 || item.estoqueIdeal > 0 || item.nome; });
}

function custoUnitarioInsumoInv(item, unidade) {
  var u = normalizarInv(unidade);
  var precoKg = numeroInv(item.precoMedioKg || item.custoKg || 0);
  var custoUnit = numeroInv(item.custoUnitario || item.precoUnitario || 0);
  if (u === "g" || u === "gramas" || u === "grama") return precoKg > 0 ? precoKg / 1000 : custoUnit;
  if (u === "kg" || u === "quilo" || u === "quilograma") return precoKg || custoUnit;
  return custoUnit || numeroInv(item.precoMedio || 0);
}

function atualizarListaComprasSugerida(itens, competencia) {
  var sugestoes = itens.filter(function (item) { return numeroInv(item.estoqueIdeal) > 0 && numeroInv(item.quantidadeFisica) < numeroInv(item.estoqueIdeal); }).map(function (item) {
    return {
      id: gerarIdInv("SUG"),
      competencia: competencia,
      itemKey: item.itemKey,
      nome: item.nome,
      unidade: item.unidade,
      quantidadeFisica: item.quantidadeFisica,
      estoqueIdeal: item.estoqueIdeal,
      quantidadeSugerida: Math.max(0, numeroInv(item.estoqueIdeal) - numeroInv(item.quantidadeFisica)),
      criadoEm: new Date().toISOString()
    };
  });
  localStorage.setItem(BALU_LISTA_COMPRAS_KEY, JSON.stringify(sugestoes));
}

function renderInventarios() {
  renderResumoInventario();
  renderTabelaInventarios();
  if (typeof window.BALU_RENDER_ICONS === "function") window.BALU_RENDER_ICONS();
}

function renderResumoInventario() {
  var comp = competenciaAtualInv();
  var inicial = obterEstoqueInicialInv(comp);
  var final = obterEstoqueFinalInv(comp);
  var compras = obterComprasMesInv(comp);
  var cmv = Math.max(0, inicial + compras - final.total);
  setTextoInv("invEstoqueInicial", moedaInv(inicial));
  setTextoInv("invComprasMes", moedaInv(compras));
  setTextoInv("invEstoqueFinal", moedaInv(final.total));
  setTextoInv("invCmvReal", moedaInv(cmv));
  setTextoInv("invResumoProducao", moedaInv(final.producao));
  setTextoInv("invResumoRevenda", moedaInv(final.revenda));
  setTextoInv("invResumoEmbalagens", moedaInv(final.embalagens));
}

function renderTabelaInventarios() {
  var tbody = document.getElementById("inventariosTable");
  if (!tbody) return;
  var busca = normalizarInv(getInv("searchInventarios"));
  var lista = inventariosCache.filter(function (item) {
    var texto = normalizarInv([item.competencia, item.tipo, item.observacoes].join(" "));
    return !busca || texto.indexOf(busca) >= 0;
  }).sort(function (a, b) { return String(b.competencia).localeCompare(String(a.competencia)); });
  if (!lista.length) {
    tbody.innerHTML = "<tr><td colspan='8' class='text-muted'>Nenhum inventário registrado ainda.</td></tr>";
    return;
  }
  tbody.innerHTML = lista.map(function (item) {
    return "<tr><td>" + escaparInv(item.competencia || "-") + "</td><td><span class='badge neutral'>" + escaparInv(item.tipo || "-") + "</span></td><td><strong>" + moedaInv(item.total || item.totalEstoque) + "</strong></td><td>" + moedaInv(item.totalProducao) + "</td><td>" + moedaInv(item.totalRevenda) + "</td><td>" + moedaInv(item.totalEmbalagens) + "</td><td>" + escaparInv(item.observacoes || "-") + "</td><td><div class='table-actions'><button class='btn-icon' title='Editar' onclick='editarInventario(\"" + escaparAttrInv(item.id) + "\")'><i data-lucide='edit-3'></i></button><button class='btn-icon danger' title='Excluir' onclick='excluirInventario(\"" + escaparAttrInv(item.id) + "\")'><i data-lucide='trash-2'></i></button></div></td></tr>";
  }).join("");
}

function editarInventario(id) { var item = inventariosCache.find(function (r) { return r.id === id; }); if (item) abrirInventario(item, item.tipo); }
function excluirInventario(id) { if (!confirm("Deseja excluir este inventário?")) return; inventariosCache = inventariosCache.filter(function (r) { return r.id !== id; }); localStorage.setItem(BALU_INVENTARIOS_KEY, JSON.stringify(inventariosCache)); renderInventarios(); }

function obterEstoqueInicialInv(comp) {
  var atual = inventariosCache.find(function (item) { return item.competencia === comp && item.tipo === "Estoque Inicial"; });
  if (atual) return numeroInv(atual.total || atual.totalEstoque);
  var anterior = competenciaAnteriorInv(comp);
  var fechamentoAnterior = inventariosCache.find(function (item) { return item.competencia === anterior && item.tipo === "Fechamento de Estoque"; });
  return fechamentoAnterior ? numeroInv(fechamentoAnterior.total || fechamentoAnterior.totalEstoque) : 0;
}

function obterEstoqueFinalInv(comp) {
  var final = inventariosCache.find(function (item) { return item.competencia === comp && item.tipo === "Fechamento de Estoque"; });
  return { total: numeroInv(final && (final.total || final.totalEstoque)), producao: numeroInv(final && final.totalProducao), revenda: numeroInv(final && final.totalRevenda), embalagens: numeroInv(final && final.totalEmbalagens) };
}

function obterComprasMesInv(comp) {
  return carregarListaInventario("balu_compras_realizadas").filter(function (item) { return (item.competencia || String(item.data || item.dataCompra || "").slice(0, 7)) === comp; }).reduce(function (soma, item) {
    return soma + numeroInv(item.valorDestinadoEstoque || item.valorCmv || item.valor || item.total || item.valorTotal);
  }, 0);
}

function carregarListaInventario(key) { try { var raw = localStorage.getItem(key); var arr = raw ? JSON.parse(raw) : []; return Array.isArray(arr) ? arr : []; } catch (e) { return []; } }
function getInv(id) { var el = document.getElementById(id); return el ? el.value : ""; }
function setInv(id, valor) { var el = document.getElementById(id); if (el) el.value = valor == null ? "" : valor; }
function setTextoInv(id, valor) { var el = document.getElementById(id); if (el) el.textContent = valor == null ? "" : valor; }
function numeroInv(v) { if (typeof v === "number") return isFinite(v) ? v : 0; var s = String(v || "").replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, ""); var n = parseFloat(s); return isNaN(n) ? 0 : n; }
function moedaInv(v) { return numeroInv(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function formatarNumeroInv(v) { return numeroInv(v).toLocaleString("pt-BR", { maximumFractionDigits: 3 }); }
function hojeInv() { return new Date().toISOString().slice(0, 10); }
function competenciaAtualInv() { return new Date().toISOString().slice(0, 7); }
function competenciaAnteriorInv(comp) { var d = new Date(String(comp) + "-01T00:00:00"); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); }
function normalizarInv(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function escaparInv(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function escaparAttrInv(s) { return escaparInv(s).replace(/'/g, "&#39;"); }
function gerarIdInv(prefixo) { return (prefixo || "INV") + "-" + Date.now() + "-" + Math.random().toString(16).slice(2); }
function msgInv(msg, tipo) { if (typeof showToast === "function") showToast(msg, tipo || "info"); else alert(msg); }
