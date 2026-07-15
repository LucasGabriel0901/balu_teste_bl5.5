// ==============================
// BALU FOOD - VENDAS DO MÊS
// Substitui o antigo módulo CMV Real visual. O CMV real vem do Inventário.
// ==============================

var vendasMensaisCache = [];
var receitasVendasCache = [];
var BALU_VENDAS_MENSAIS_KEY = "balu_vendas_mensais";

document.addEventListener("DOMContentLoaded", function () {
  vendasMensaisCache = carregarListaVendasMes(BALU_VENDAS_MENSAIS_KEY);
  receitasVendasCache = carregarReceitasVendasMes();
  initVendasMes();
  renderVendasMes();
});

function initVendasMes() {
  var btn = document.getElementById("btnNovoFechamentoVendas");
  var form = document.getElementById("formVendasMes");
  var container = document.getElementById("vendasReceitasContainer");
  if (btn) btn.addEventListener("click", function () { abrirFechamentoVendas(); });
  if (form) form.addEventListener("submit", function (event) { event.preventDefault(); salvarFechamentoVendas(); });
  if (container) container.addEventListener("input", function (event) { if (event.target.classList.contains("venda-qtd")) atualizarPreviewVendasMes(); });
}

function abrirFechamentoVendas(item) {
  receitasVendasCache = carregarReceitasVendasMes();
  setVendasMes("vendasId", item ? item.id : "");
  setVendasMes("vendasCompetencia", item ? item.competencia : competenciaAtualVendasMes());
  setVendasMes("vendasData", item ? (item.data || hojeVendasMes()) : hojeVendasMes());
  setVendasMes("vendasResponsavel", item ? (item.responsavel || obterUsuarioVendasMes()) : obterUsuarioVendasMes());
  setVendasMes("vendasObservacoes", item ? (item.observacoes || "") : "");
  setTextoVendasMes("drawerVendasTitle", item ? "Editar Fechamento de Vendas" : "Novo Fechamento de Vendas");
  renderReceitasVendasMes(item ? item.itens : null);
  atualizarPreviewVendasMes();
  openDrawer("drawerVendasMes");
}

function renderReceitasVendasMes(itensSalvos) {
  var container = document.getElementById("vendasReceitasContainer");
  if (!container) return;
  var mapa = {};
  if (Array.isArray(itensSalvos)) itensSalvos.forEach(function (item) { mapa[item.receitaId || item.id] = numeroVendasMes(item.quantidadeVendida || item.quantidade); });
  if (!receitasVendasCache.length) {
    container.innerHTML = "<div class='empty-state-alert'><strong>Nenhuma ficha técnica encontrada.</strong><p>Cadastre fichas técnicas para registrar as vendas do mês.</p></div>";
    return;
  }
  var grupos = {};
  receitasVendasCache.forEach(function (r) { var cat = r.categoria || "Sem categoria"; if (!grupos[cat]) grupos[cat] = []; grupos[cat].push(r); });
  container.innerHTML = Object.keys(grupos).sort().map(function (cat) {
    var linhas = grupos[cat].map(function (r) {
      var qtd = mapa[r.id] || "";
      return "<tr data-id='" + escapeAttrVendasMes(r.id) + "' data-custo='" + r.custoUnitario + "' data-tipo='" + escapeAttrVendasMes(r.tipoReceita) + "'><td><strong>" + escapeVendasMes(r.nome) + "</strong><span class='table-subtext'>" + escapeVendasMes(r.tipoReceita) + "</span></td><td>" + moedaVendasMes(r.custoUnitario) + "</td><td><input type='number' min='0' step='1' class='venda-qtd' value='" + (qtd === "" ? "" : qtd) + "' placeholder='0'></td><td><strong class='venda-total-linha'>R$ 0,00</strong></td></tr>";
    }).join("");
    return "<div class='table-card nested-table'><h3 class='form-section-title'>" + escapeVendasMes(cat) + "</h3><table class='data-table compact-table'><thead><tr><th>Receita</th><th>Custo unitário</th><th>Quantidade vendida</th><th>CMV teórico</th></tr></thead><tbody>" + linhas + "</tbody></table></div>";
  }).join("");
  document.querySelectorAll(".venda-qtd").forEach(function (input) { atualizarLinhaVendaMes(input); });
}

function atualizarLinhaVendaMes(input) {
  var tr = input.closest("tr");
  if (!tr) return;
  var qtd = numeroVendasMes(input.value);
  var custo = numeroVendasMes(tr.getAttribute("data-custo"));
  var el = tr.querySelector(".venda-total-linha");
  if (el) el.textContent = moedaVendasMes(qtd * custo);
}

function atualizarPreviewVendasMes() {
  document.querySelectorAll(".venda-qtd").forEach(function (input) { atualizarLinhaVendaMes(input); });
  var resumo = coletarItensVendasMes();
  setTextoVendasMes("previewPratosVendidos", resumo.qtdProducao.toLocaleString("pt-BR"));
  setTextoVendasMes("previewRevendasVendidas", resumo.qtdRevenda.toLocaleString("pt-BR"));
  setTextoVendasMes("previewCmvTeoricoTotal", moedaVendasMes(resumo.total));
}

function salvarFechamentoVendas() {
  var id = getVendasMes("vendasId");
  var competencia = getVendasMes("vendasCompetencia");
  var resumo = coletarItensVendasMes();
  if (!competencia) { msgVendasMes("Informe a competência.", "warning"); return; }
  if (resumo.total <= 0) { msgVendasMes("Preencha pelo menos uma quantidade vendida.", "warning"); return; }
  var cmvReal = calcularCmvRealVendasMes(competencia);
  var perdas = cmvReal - resumo.total;
  var percentual = cmvReal > 0 ? (perdas / cmvReal) * 100 : 0;
  var registro = {
    id: id || gerarIdVendasMes(),
    competencia: competencia,
    data: getVendasMes("vendasData") || hojeVendasMes(),
    responsavel: getVendasMes("vendasResponsavel") || obterUsuarioVendasMes(),
    observacoes: getVendasMes("vendasObservacoes"),
    itens: resumo.itens,
    quantidadeProducao: resumo.qtdProducao,
    quantidadeRevenda: resumo.qtdRevenda,
    quantidadeTotal: resumo.qtdTotal,
    cmvTeoricoProducao: resumo.producao,
    cmvTeoricoRevenda: resumo.revenda,
    cmvTeoricoTotal: resumo.total,
    cmvReal: cmvReal,
    diferencaPerdas: perdas,
    percentualPerdas: percentual,
    status: statusVendasMes(perdas, percentual),
    atualizadoEm: new Date().toISOString()
  };
  vendasMensaisCache = vendasMensaisCache.filter(function (item) { return item.id !== id && item.competencia !== competencia; });
  vendasMensaisCache.push(registro);
  localStorage.setItem(BALU_VENDAS_MENSAIS_KEY, JSON.stringify(vendasMensaisCache));
  closeDrawer();
  renderVendasMes();
  msgVendasMes("Fechamento de vendas salvo com sucesso.", "success");
}

function coletarItensVendasMes() {
  var linhas = document.querySelectorAll("#vendasReceitasContainer tr[data-id]");
  var resumo = { itens: [], producao: 0, revenda: 0, total: 0, qtdProducao: 0, qtdRevenda: 0, qtdTotal: 0 };
  linhas.forEach(function (tr) {
    var id = tr.getAttribute("data-id");
    var receita = receitasVendasCache.find(function (r) { return r.id === id; }) || {};
    var qtd = numeroVendasMes((tr.querySelector(".venda-qtd") || {}).value);
    if (qtd <= 0) return;
    var custo = numeroVendasMes(tr.getAttribute("data-custo"));
    var total = qtd * custo;
    var tipo = receita.tipoReceita || tr.getAttribute("data-tipo") || "Produção";
    resumo.itens.push({ receitaId: id, nome: receita.nome, categoria: receita.categoria, tipoReceita: tipo, custoUnitario: custo, quantidadeVendida: qtd, cmvTeorico: total });
    resumo.total += total;
    resumo.qtdTotal += qtd;
    if (normalizarVendasMes(tipo).indexOf("revenda") >= 0) { resumo.revenda += total; resumo.qtdRevenda += qtd; }
    else { resumo.producao += total; resumo.qtdProducao += qtd; }
  });
  return resumo;
}

function renderVendasMes() {
  renderResumoVendasMes();
  renderTabelaVendasMes();
  if (typeof window.BALU_RENDER_ICONS === "function") window.BALU_RENDER_ICONS();
}

function renderResumoVendasMes() {
  var comp = competenciaAtualVendasMes();
  var atual = vendasMensaisCache.find(function (item) { return item.competencia === comp; }) || vendasMensaisCache.slice().sort(function (a, b) { return String(b.competencia).localeCompare(String(a.competencia)); })[0];
  var teorico = numeroVendasMes(atual && atual.cmvTeoricoTotal);
  var real = atual ? numeroVendasMes(atual.cmvReal) : calcularCmvRealVendasMes(comp);
  var perdas = atual ? numeroVendasMes(atual.diferencaPerdas) : real - teorico;
  var perc = real > 0 ? perdas / real * 100 : 0;
  setTextoVendasMes("vendasCmvTeorico", moedaVendasMes(teorico));
  setTextoVendasMes("vendasCmvReal", moedaVendasMes(real));
  setTextoVendasMes("vendasPerdas", moedaVendasMes(perdas));
  setTextoVendasMes("vendasPercentualPerdas", percentualVendasMes(perc));
  setTextoVendasMes("vendasCmvProducao", moedaVendasMes(atual && atual.cmvTeoricoProducao));
  setTextoVendasMes("vendasCmvRevenda", moedaVendasMes(atual && atual.cmvTeoricoRevenda));
  var s = statusVendasMes(perdas, perc);
  setTextoVendasMes("vendasStatusOperacao", s.titulo);
  setTextoVendasMes("vendasDiagnostico", s.texto);
}

function renderTabelaVendasMes() {
  var tbody = document.getElementById("vendasMensaisTable");
  if (!tbody) return;
  var lista = vendasMensaisCache.slice().sort(function (a, b) { return String(b.competencia).localeCompare(String(a.competencia)); });
  if (!lista.length) { tbody.innerHTML = "<tr><td colspan='7' class='text-muted'>Nenhum fechamento de vendas registrado ainda.</td></tr>"; return; }
  tbody.innerHTML = lista.map(function (item) {
    var status = statusVendasMes(item.diferencaPerdas, item.percentualPerdas);
    return "<tr><td>" + escapeVendasMes(item.competencia) + "</td><td>" + numeroVendasMes(item.quantidadeTotal).toLocaleString("pt-BR") + "</td><td><strong>" + moedaVendasMes(item.cmvTeoricoTotal) + "</strong></td><td>" + moedaVendasMes(item.cmvReal) + "</td><td>" + moedaVendasMes(item.diferencaPerdas) + "</td><td><span class='badge " + status.classe + "'>" + escapeVendasMes(status.titulo) + "</span></td><td><div class='table-actions'><button class='btn-icon' title='Editar' onclick='editarFechamentoVendas(\"" + escapeAttrVendasMes(item.id) + "\")'><i data-lucide='edit-3'></i></button><button class='btn-icon danger' title='Excluir' onclick='excluirFechamentoVendas(\"" + escapeAttrVendasMes(item.id) + "\")'><i data-lucide='trash-2'></i></button></div></td></tr>";
  }).join("");
}

function editarFechamentoVendas(id) { var item = vendasMensaisCache.find(function (r) { return r.id === id; }); if (item) abrirFechamentoVendas(item); }
function excluirFechamentoVendas(id) { if (!confirm("Deseja excluir este fechamento?")) return; vendasMensaisCache = vendasMensaisCache.filter(function (r) { return r.id !== id; }); localStorage.setItem(BALU_VENDAS_MENSAIS_KEY, JSON.stringify(vendasMensaisCache)); renderVendasMes(); }

function carregarReceitasVendasMes() {
  var fichas = carregarListaVendasMes("balu_fichas_tecnicas");
  if (!fichas.length) fichas = carregarListaVendasMes("balu_fichas_tecnicas_v2");
  return fichas.map(function (f) {
    var rendimento = Math.max(1, numeroVendasMes(f.rendimento || f.porcoes || f.quantidadeProduzida || 1));
    var custoTotal = numeroVendasMes(f.custoTotal || f.custoReceita || f.custoTotalReceita || f.custo);
    var custoUnit = numeroVendasMes(f.custoUnitario || f.custoPorUnidade || f.custoPorPorcao || (custoTotal / rendimento));
    return { id: f.id || f.codigo || f.nome, nome: f.nome || f.receita || "Receita", categoria: f.categoria || f.grupo || "Receitas", tipoReceita: f.tipoReceita || f.classificacao || f.tipo || "Produção", custoUnitario: custoUnit };
  }).filter(function (r) { return r.id && r.custoUnitario >= 0; });
}

function calcularCmvRealVendasMes(comp) {
  var inventarios = carregarListaVendasMes("balu_inventarios");
  var inicial = obterEstoqueInicialVendasMes(inventarios, comp);
  var final = obterEstoqueFinalVendasMes(inventarios, comp);
  var compras = carregarListaVendasMes("balu_compras_realizadas").filter(function (item) { return (item.competencia || String(item.data || item.dataCompra || "").slice(0, 7)) === comp; }).reduce(function (s, item) { return s + numeroVendasMes(item.valorDestinadoEstoque || item.valorCmv || item.valor || item.total || item.valorTotal); }, 0);
  return Math.max(0, inicial + compras - final);
}

function obterEstoqueInicialVendasMes(inventarios, comp) {
  var atual = inventarios.find(function (i) { return i.competencia === comp && i.tipo === "Estoque Inicial"; });
  if (atual) return numeroVendasMes(atual.total || atual.totalEstoque);
  var anterior = competenciaAnteriorVendasMes(comp);
  var ant = inventarios.find(function (i) { return i.competencia === anterior && i.tipo === "Fechamento de Estoque"; });
  return ant ? numeroVendasMes(ant.total || ant.totalEstoque) : 0;
}
function obterEstoqueFinalVendasMes(inventarios, comp) { var f = inventarios.find(function (i) { return i.competencia === comp && i.tipo === "Fechamento de Estoque"; }); return f ? numeroVendasMes(f.total || f.totalEstoque) : 0; }

function statusVendasMes(perdas, percentual) {
  perdas = numeroVendasMes(perdas); percentual = numeroVendasMes(percentual);
  if (perdas <= 0.01) return { titulo: "Excelente", texto: "O consumo real ficou igual ou abaixo do consumo esperado pelas fichas técnicas.", classe: "success" };
  if (percentual <= 5) return { titulo: "Atenção", texto: "O CMV real ficou levemente acima do teórico. Verifique perdas ou fichas desatualizadas.", classe: "warning" };
  return { titulo: "Perda alta", texto: "O CMV real ficou bem acima do teórico. Revise processos, pesagem, compras e fichas técnicas.", classe: "danger" };
}

function carregarListaVendasMes(key) { try { var raw = localStorage.getItem(key); var arr = raw ? JSON.parse(raw) : []; return Array.isArray(arr) ? arr : []; } catch (e) { return []; } }
function getVendasMes(id) { var el = document.getElementById(id); return el ? el.value : ""; }
function setVendasMes(id, valor) { var el = document.getElementById(id); if (el) el.value = valor == null ? "" : valor; }
function setTextoVendasMes(id, valor) { var el = document.getElementById(id); if (el) el.textContent = valor == null ? "" : valor; }
function numeroVendasMes(v) { if (typeof v === "number") return isFinite(v) ? v : 0; var s = String(v || "").replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, ""); var n = parseFloat(s); return isNaN(n) ? 0 : n; }
function moedaVendasMes(v) { return numeroVendasMes(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function percentualVendasMes(v) { return numeroVendasMes(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%"; }
function hojeVendasMes() { return new Date().toISOString().slice(0, 10); }
function competenciaAtualVendasMes() { return new Date().toISOString().slice(0, 7); }
function competenciaAnteriorVendasMes(comp) { var d = new Date(String(comp) + "-01T00:00:00"); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); }
function obterUsuarioVendasMes() { try { var s = JSON.parse(localStorage.getItem("balu_session") || "{}"); return s.nome || s.usuario || "Administrador"; } catch (e) { return "Administrador"; } }
function normalizarVendasMes(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function escapeVendasMes(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function escapeAttrVendasMes(s) { return escapeVendasMes(s).replace(/'/g, "&#39;"); }
function gerarIdVendasMes() { return "VDM-" + Date.now() + "-" + Math.random().toString(16).slice(2); }
function msgVendasMes(msg, tipo) { if (typeof showToast === "function") showToast(msg, tipo || "info"); else alert(msg); }
