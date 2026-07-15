// ==============================
// BALU FOOD - PRECIFICAÇÃO POR CANAL
// ==============================

var precCanais = [];
var precHistorico = [];
var precFichas = [];
var BALU_PREC_CANAIS_KEY = "balu_canais_precificacao";
var BALU_PREC_HIST_KEY = "balu_precificacoes";

var CANAIS_PREC_PADRAO = [
  { nome: "Salão Débito", tipo: "Cartão", taxa: 2, imposto: 6, usaEmbalagem: false, kitCusto: 0, status: "Ativo" },
  { nome: "Salão Crédito", tipo: "Cartão", taxa: 3.2, imposto: 6, usaEmbalagem: false, kitCusto: 0, status: "Ativo" },
  { nome: "PIX", tipo: "PIX", taxa: 0, imposto: 6, usaEmbalagem: false, kitCusto: 0, status: "Ativo" },
  { nome: "Delivery Próprio", tipo: "Delivery", taxa: 3.5, imposto: 6, usaEmbalagem: true, kitCusto: 2.1, status: "Ativo" },
  { nome: "iFood", tipo: "Marketplace", taxa: 27, imposto: 6, usaEmbalagem: true, kitCusto: 2.5, status: "Ativo" },
  { nome: "99Food", tipo: "Marketplace", taxa: 25, imposto: 6, usaEmbalagem: true, kitCusto: 2.5, status: "Ativo" }
];

document.addEventListener("DOMContentLoaded", function () {
  precCanais = carregarCanaisPrec();
  precHistorico = carregarListaPrec(BALU_PREC_HIST_KEY);
  precFichas = carregarFichasPrec();
  initPrecificacao();
  renderPrecificacao();
});

function initPrecificacao() {
  var btnCanais = document.getElementById("btnCanaisPrecificacao");
  var btnAddCanal = document.getElementById("btnAdicionarCanalPrec");
  var btnSalvarCanais = document.getElementById("btnSalvarCanaisPrec");
  var btnSalvarPrec = document.getElementById("btnSalvarPrecificacao");
  ["precFicha", "precMargem", "precCustoManual"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("input", renderResultadoPrecificacao);
  });
  if (btnCanais) btnCanais.addEventListener("click", abrirCanaisPrecificacao);
  if (btnAddCanal) btnAddCanal.addEventListener("click", adicionarCanalPrecificacao);
  if (btnSalvarCanais) btnSalvarCanais.addEventListener("click", salvarCanaisPrecificacao);
  if (btnSalvarPrec) btnSalvarPrec.addEventListener("click", salvarPrecificacaoAtual);
}

function renderPrecificacao() {
  preencherSelectFichasPrec();
  renderCardsPrec();
  renderResultadoPrecificacao();
  renderHistoricoPrec();
  renderIconesPrec();
}

function preencherSelectFichasPrec() {
  var select = document.getElementById("precFicha");
  if (!select) return;
  var atual = select.value;
  select.innerHTML = "<option value=''>Selecione uma ficha</option>" + precFichas.map(function (f) {
    return "<option value='" + escapeAttrPrec(f.id) + "'>" + escapePrec(f.nome) + "</option>";
  }).join("");
  select.value = atual;
}

function abrirCanaisPrecificacao() {
  renderEditorCanaisPrec();
  openDrawer("drawerCanaisPrecificacao");
}

function renderEditorCanaisPrec() {
  var container = document.getElementById("precCanaisContainer");
  if (!container) return;
  container.innerHTML = precCanais.map(criarLinhaCanalPrec).join("");
  renderIconesPrec();
}

function criarLinhaCanalPrec(canal) {
  return "<div class='simple-entry-row prec-canal-row' data-id='" + escapeAttrPrec(canal.id || gerarIdPrec("CANAL")) + "'>" +
    "<div class='form-field simple-entry-grow'><label>Canal</label><input class='prec-canal-nome' value='" + escapeAttrPrec(canal.nome) + "'></div>" +
    "<div class='form-field'><label>Tipo</label><input class='prec-canal-tipo' value='" + escapeAttrPrec(canal.tipo || "Canal") + "'></div>" +
    "<div class='form-field'><label>Taxa %</label><input type='number' step='0.01' class='prec-canal-taxa' value='" + numeroPrec(canal.taxa) + "'></div>" +
    "<div class='form-field'><label>Imposto %</label><input type='number' step='0.01' class='prec-canal-imposto' value='" + numeroPrec(canal.imposto) + "'></div>" +
    "<div class='form-field'><label>Embalagem</label><select class='prec-canal-embalagem'><option value='Não'" + (!canal.usaEmbalagem ? " selected" : "") + ">Não</option><option value='Sim'" + (canal.usaEmbalagem ? " selected" : "") + ">Sim</option></select></div>" +
    "<div class='form-field'><label>Custo emb.</label><input type='number' step='0.01' class='prec-canal-kit' value='" + numeroPrec(canal.kitCusto || canal.custoEmbalagem) + "'></div>" +
    "<button type='button' class='btn-icon danger' title='Remover' onclick='removerCanalPrecificacao(this)'><i data-lucide='trash-2'></i></button>" +
  "</div>";
}

function adicionarCanalPrecificacao() {
  var container = document.getElementById("precCanaisContainer");
  if (!container) return;
  container.insertAdjacentHTML("beforeend", criarLinhaCanalPrec({ id: gerarIdPrec("CANAL"), nome: "Novo Canal", tipo: "Canal", taxa: 0, imposto: 6, usaEmbalagem: false, kitCusto: 0, status: "Ativo" }));
  renderIconesPrec();
}

function removerCanalPrecificacao(btn) {
  var linha = btn.closest(".prec-canal-row");
  if (linha) linha.remove();
}

function salvarCanaisPrecificacao() {
  var linhas = document.querySelectorAll(".prec-canal-row");
  var canais = [];
  linhas.forEach(function (linha) {
    var nome = campoLinhaPrec(linha, ".prec-canal-nome");
    if (!nome) return;
    canais.push({
      id: linha.getAttribute("data-id") || gerarIdPrec("CANAL"),
      nome: nome,
      tipo: campoLinhaPrec(linha, ".prec-canal-tipo") || "Canal",
      taxa: numeroPrec(campoLinhaPrec(linha, ".prec-canal-taxa")),
      imposto: numeroPrec(campoLinhaPrec(linha, ".prec-canal-imposto")),
      usaEmbalagem: campoLinhaPrec(linha, ".prec-canal-embalagem") === "Sim",
      kitCusto: numeroPrec(campoLinhaPrec(linha, ".prec-canal-kit")),
      status: "Ativo"
    });
  });
  if (!canais.length) {
    msgPrec("Cadastre pelo menos um canal.", "warning");
    return;
  }
  precCanais = canais;
  localStorage.setItem(BALU_PREC_CANAIS_KEY, JSON.stringify(precCanais));
  closeDrawer();
  renderPrecificacao();
  msgPrec("Canais salvos com sucesso.", "success");
}

function renderCardsPrec() {
  setTextoPrec("precMaoObraPct", pctPrec(obterMaoObraPctPrec()));
  setTextoPrec("precCustosPct", pctPrec(obterCustosPctPrec()));
  setTextoPrec("precCanaisAtivos", precCanais.filter(function (c) { return c.status !== "Inativo"; }).length);
  setTextoPrec("precHistoricoQtd", precHistorico.length);
  setTextoPrec("precFaturamentoMedio", moedaPrec(obterFaturamentoMedioPrec()));
}

function renderResultadoPrecificacao() {
  var tbody = document.getElementById("precResultadoTable");
  if (!tbody) return;
  var base = obterBasePrecificacao();
  var margemDesejada = numeroPrec(getPrec("precMargem"));
  setTextoPrec("precCustoReceitaPreview", moedaPrec(base.custoReceita));
  setTextoPrec("precMargemPreview", pctPrec(margemDesejada));
  if (!base.nome && base.custoReceita <= 0) {
    tbody.innerHTML = "<tr><td colspan='10' class='text-muted'>Selecione uma ficha técnica ou informe um custo manual.</td></tr>";
    return;
  }
  var mao = obterMaoObraPctPrec();
  var custos = obterCustosPctPrec();
  var canaisAtivos = precCanais.filter(function (c) { return c.status !== "Inativo"; });
  tbody.innerHTML = canaisAtivos.map(function (canal) {
    var calc = calcularPrecoCanalPrec(base.custoReceita, canal, margemDesejada, mao, custos, 0);
    var status = statusPrec(calc.margemReal, margemDesejada, calc.lucroLiquido);
    return "<tr data-canal='" + escapeAttrPrec(canal.id || canal.nome) + "' data-canal-nome='" + escapeAttrPrec(canal.nome) + "' data-sugerido='" + calc.precoSugerido + "' data-custo='" + base.custoReceita + "'>" +
      "<td><strong>" + escapePrec(canal.nome) + "</strong><span class='table-subtext'>" + escapePrec(canal.tipo) + "</span></td>" +
      "<td>" + moedaPrec(base.custoReceita) + "</td>" +
      "<td>" + moedaPrec(calc.embalagem) + "</td>" +
      "<td><strong>" + moedaPrec(calc.precoSugerido) + "</strong></td>" +
      "<td><input type='number' step='0.01' class='prec-meu-preco' value='" + calc.precoSugerido.toFixed(2) + "' oninput='atualizarLinhaMeuPrecoPrec(this)'></td>" +
      "<td class='prec-receita-liquida'>" + moedaPrec(calc.receitaLiquida) + "</td>" +
      "<td class='prec-cmv-pct'>" + pctPrec(calc.cmvPct) + "</td>" +
      "<td class='prec-lucro-liquido'>" + moedaPrec(calc.lucroLiquido) + "</td>" +
      "<td class='prec-margem-real'>" + pctPrec(calc.margemReal) + "</td>" +
      "<td class='prec-status'><span class='badge " + status.classe + "'>" + escapePrec(status.texto) + "</span></td>" +
    "</tr>";
  }).join("");
}

function atualizarLinhaMeuPrecoPrec(input) {
  var tr = input.closest("tr");
  if (!tr) return;
  var canalId = tr.getAttribute("data-canal");
  var canal = precCanais.find(function (c) { return (c.id || c.nome) === canalId; }) || {};
  var base = obterBasePrecificacao();
  var margemDesejada = numeroPrec(getPrec("precMargem"));
  var calc = calcularPrecoCanalPrec(base.custoReceita, canal, margemDesejada, obterMaoObraPctPrec(), obterCustosPctPrec(), numeroPrec(input.value));
  setCelulaPrec(tr, ".prec-receita-liquida", moedaPrec(calc.receitaLiquida));
  setCelulaPrec(tr, ".prec-cmv-pct", pctPrec(calc.cmvPct));
  setCelulaPrec(tr, ".prec-lucro-liquido", moedaPrec(calc.lucroLiquido));
  setCelulaPrec(tr, ".prec-margem-real", pctPrec(calc.margemReal));
  var status = statusPrec(calc.margemReal, margemDesejada, calc.lucroLiquido);
  setCelulaPrec(tr, ".prec-status", "<span class='badge " + status.classe + "'>" + escapePrec(status.texto) + "</span>");
}

function calcularPrecoCanalPrec(custoReceita, canal, margem, mao, custos, precoEscolhido) {
  var embalagem = canal.usaEmbalagem ? numeroPrec(canal.kitCusto || canal.custoEmbalagem) : 0;
  var custoBase = numeroPrec(custoReceita) + embalagem;
  var somaPct = numeroPrec(margem) + numeroPrec(mao) + numeroPrec(custos) + numeroPrec(canal.taxa) + numeroPrec(canal.imposto);
  var divisor = Math.max(0.05, 1 - (somaPct / 100));
  var sugerido = custoBase / divisor;
  var preco = precoEscolhido > 0 ? precoEscolhido : sugerido;
  var taxaValor = preco * numeroPrec(canal.taxa) / 100;
  var impostoValor = preco * numeroPrec(canal.imposto) / 100;
  var maoValor = preco * numeroPrec(mao) / 100;
  var custosValor = preco * numeroPrec(custos) / 100;
  var receitaLiquida = preco - taxaValor - impostoValor;
  var lucroLiquido = preco - custoBase - taxaValor - impostoValor - maoValor - custosValor;
  var margemReal = preco > 0 ? lucroLiquido / preco * 100 : 0;
  var cmvPct = preco > 0 ? custoBase / preco * 100 : 0;
  return { precoSugerido: sugerido, precoEscolhido: preco, embalagem: embalagem, receitaLiquida: receitaLiquida, lucroLiquido: lucroLiquido, margemReal: margemReal, cmvPct: cmvPct };
}

function salvarPrecificacaoAtual() {
  var base = obterBasePrecificacao();
  if (!base.nome || base.custoReceita <= 0) {
    msgPrec("Selecione uma ficha ou informe um custo manual.", "warning");
    return;
  }
  var margemDesejada = numeroPrec(getPrec("precMargem"));
  var linhas = document.querySelectorAll("#precResultadoTable tr[data-canal]");
  var agora = new Date().toISOString();
  linhas.forEach(function (tr) {
    var input = tr.querySelector(".prec-meu-preco");
    var preco = numeroPrec(input && input.value);
    var margemReal = numeroPrec((tr.querySelector(".prec-margem-real") || {}).textContent);
    var canalNome = tr.getAttribute("data-canal-nome") || "Canal";
    var status = statusPrec(margemReal, margemDesejada, preco - base.custoReceita);
    precHistorico.push({
      id: gerarIdPrec("PREC"),
      fichaId: base.id,
      receita: base.nome,
      canal: canalNome,
      preco: preco,
      precoSugerido: numeroPrec(tr.getAttribute("data-sugerido")),
      custoReceita: base.custoReceita,
      margemDesejada: margemDesejada,
      margemReal: margemReal,
      status: status.texto,
      data: agora.slice(0, 10),
      responsavel: "Administrador",
      criadoEm: agora
    });
  });
  localStorage.setItem(BALU_PREC_HIST_KEY, JSON.stringify(precHistorico));
  renderPrecificacao();
  msgPrec("Precificação salva no histórico.", "success");
}

function renderHistoricoPrec() {
  var tbody = document.getElementById("precHistoricoTable");
  if (!tbody) return;
  if (!precHistorico.length) {
    tbody.innerHTML = "<tr><td colspan='7' class='text-muted'>Nenhuma precificação salva ainda.</td></tr>";
    return;
  }
  tbody.innerHTML = precHistorico.slice().reverse().slice(0, 80).map(function (item) {
    return "<tr><td>" + escapePrec(item.receita) + "</td><td>" + escapePrec(item.canal) + "</td><td><strong>" + moedaPrec(item.preco) + "</strong></td><td>" + pctPrec(item.margemReal) + "</td><td>" + dataBRPrec(item.data) + "</td><td><span class='badge neutral'>" + escapePrec(item.status || "Salvo") + "</span></td><td><button class='btn-icon danger' onclick='excluirHistoricoPrec(\"" + escapeAttrPrec(item.id) + "\")'><i data-lucide='trash-2'></i></button></td></tr>";
  }).join("");
}

function excluirHistoricoPrec(id) {
  if (!confirm("Deseja excluir este registro?")) return;
  precHistorico = precHistorico.filter(function (item) { return item.id !== id; });
  localStorage.setItem(BALU_PREC_HIST_KEY, JSON.stringify(precHistorico));
  renderHistoricoPrec();
}

function obterBasePrecificacao() {
  var fichaId = getPrec("precFicha");
  var ficha = precFichas.find(function (f) { return f.id === fichaId; });
  var custoManual = numeroPrec(getPrec("precCustoManual"));
  if (ficha) return { id: ficha.id, nome: ficha.nome, custoReceita: custoManual > 0 ? custoManual : ficha.custoUnitario };
  if (custoManual > 0) return { id: "manual", nome: "Produto manual", custoReceita: custoManual };
  return { id: "", nome: "", custoReceita: 0 };
}

function carregarFichasPrec() {
  var fichas = carregarListaPrec("balu_fichas_tecnicas");
  if (!fichas.length) fichas = carregarListaPrec("balu_fichas_tecnicas_v2");
  return fichas.map(function (f) {
    var rendimento = Math.max(1, numeroPrec(f.rendimento || f.porcoes || 1));
    var custoTotal = numeroPrec(f.custoTotal || f.custoReceita || f.custoTotalReceita || f.custo);
    var custoUnit = numeroPrec(f.custoUnitario || f.custoPorUnidade || f.custoPorPorcao || (custoTotal / rendimento));
    return { id: f.id || f.codigo || f.nome, nome: f.nome || f.receita || "Ficha", custoUnitario: custoUnit };
  }).filter(function (f) { return f.id; });
}

function carregarCanaisPrec() {
  var canais = carregarListaPrec(BALU_PREC_CANAIS_KEY);
  if (!canais.length) {
    canais = CANAIS_PREC_PADRAO.map(function (c) { return Object.assign({ id: gerarIdPrec("CANAL") }, c); });
    localStorage.setItem(BALU_PREC_CANAIS_KEY, JSON.stringify(canais));
  }
  return canais;
}

function obterFaturamentoMedioPrec() {
  var mediaMeses = numeroPrec(localStorage.getItem("balu_faturamento_media_meses") || 6) || 6;
  var registros = carregarListaPrec("balu_faturamento").filter(function (r) { return (r.status || "Confirmado") !== "Cancelado"; });
  var mapa = {};
  registros.forEach(function (r) { var comp = r.competencia || String(r.data || "").slice(0, 7); if (comp) mapa[comp] = (mapa[comp] || 0) + numeroPrec(r.total || r.valor || r.faturamento); });
  var keys = Object.keys(mapa).sort().slice(-mediaMeses);
  if (!keys.length) return 0;
  return keys.reduce(function (s, k) { return s + mapa[k]; }, 0) / keys.length;
}

function obterMaoObraPctPrec() {
  var funcionarios = carregarListaPrec("balu_funcionarios");
  var custo = funcionarios.reduce(function (s, f) { return s + numeroPrec(f.custoTotal || f.custoMensal || f.salarioTotal || f.salario || f.valor); }, 0);
  var fat = obterFaturamentoMedioPrec();
  return fat > 0 ? custo / fat * 100 : 0;
}

function obterCustosPctPrec() {
  var fechamentos = carregarListaPrec("balu_custos_operacionais_fechamentos");
  if (!fechamentos.length) fechamentos = carregarListaPrec("balu_custos_operacionais");
  var ultimo = fechamentos.slice().sort(function (a, b) { return String(b.competencia).localeCompare(String(a.competencia)); })[0];
  if (ultimo && ultimo.percentualOperacional != null) return numeroPrec(ultimo.percentualOperacional);
  var fat = obterFaturamentoMedioPrec();
  return fat > 0 && ultimo ? numeroPrec(ultimo.total) / fat * 100 : 0;
}

function statusPrec(margemReal, margemDesejada, lucro) {
  margemReal = numeroPrec(margemReal); margemDesejada = numeroPrec(margemDesejada); lucro = numeroPrec(lucro);
  if (lucro < 0) return { texto: "Prejuízo", classe: "danger" };
  if (margemReal + 0.01 < margemDesejada) return { texto: "Abaixo da margem", classe: "warning" };
  return { texto: "Margem saudável", classe: "success" };
}

function setCelulaPrec(tr, selector, html) { var el = tr.querySelector(selector); if (el) el.innerHTML = html; }
function campoLinhaPrec(linha, selector) { var el = linha.querySelector(selector); return el ? el.value : ""; }
function carregarListaPrec(key) { try { var raw = localStorage.getItem(key); var arr = raw ? JSON.parse(raw) : []; return Array.isArray(arr) ? arr : []; } catch (e) { return []; } }
function getPrec(id) { var el = document.getElementById(id); return el ? el.value : ""; }
function setTextoPrec(id, valor) { var el = document.getElementById(id); if (el) el.textContent = valor == null ? "" : valor; }
function numeroPrec(v) { if (typeof v === "number") return isFinite(v) ? v : 0; var s = String(v || "").replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, ""); var n = parseFloat(s); return isNaN(n) ? 0 : n; }
function moedaPrec(v) { return numeroPrec(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function pctPrec(v) { return numeroPrec(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%"; }
function dataBRPrec(v) { if (!v) return "-"; var p = String(v).slice(0, 10).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : v; }
function escapePrec(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function escapeAttrPrec(s) { return escapePrec(s).replace(/'/g, "&#39;"); }
function gerarIdPrec(prefixo) { return (prefixo || "PREC") + "-" + Date.now() + "-" + Math.random().toString(16).slice(2); }
function msgPrec(msg, tipo) { if (typeof showToast === "function") showToast(msg, tipo || "info"); else alert(msg); }
function renderIconesPrec() { if (typeof window.BALU_RENDER_ICONS === "function") window.BALU_RENDER_ICONS(); else if (window.lucide) window.lucide.createIcons(); }
