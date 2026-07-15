// ==============================
// BALU FOOD - DASHBOARD EXECUTIVO
// Responde: estou ganhando dinheiro, onde estou perdendo e o que fazer este mês?
// ==============================

document.addEventListener("DOMContentLoaded", function () {
  renderDashboardBalu();
});

function renderDashboardBalu() {
  var comp = competenciaAtualDash();
  var resumo = typeof window.BALU_V7_RESUMO_EXECUTIVO === "function" ? window.BALU_V7_RESUMO_EXECUTIVO(comp) : null;

  var fat = resumo ? resumo.faturamento : faturamentoMesDash(comp);
  var compras = resumo ? resumo.comprasEstoque : comprasMesDash(comp);
  var estoqueInicial = resumo ? resumo.estoqueInicial : estoqueInicialDash(comp);
  var estoqueFinalValor = resumo ? resumo.estoqueFinal : estoqueFinalDash(comp).total;
  var cmvReal = resumo ? resumo.cmvReal : Math.max(0, estoqueInicial + compras - estoqueFinalValor);
  var cmvPct = resumo ? resumo.cmvRealPercentual : (fat > 0 ? cmvReal / fat * 100 : 0);
  var cmvTeorico = resumo ? resumo.cmvTeorico : numeroDash(vendaMensalDash(comp) && vendaMensalDash(comp).cmvTeoricoTotal);
  var diferenca = resumo ? resumo.diferencaPerdas : cmvReal - cmvTeorico;
  var custos = resumo ? { total: resumo.custosOperacionais, percentualOperacional: resumo.custosOperacionaisPercentual } : custosMesDash(comp);
  var mao = resumo ? { custo: resumo.maoDeObra, percentual: resumo.maoDeObraPercentual } : maoObraDash();
  var lucroBruto = resumo ? resumo.lucroBruto : fat - cmvReal;
  var lucroEstimado = resumo ? resumo.lucroEstimado : fat - cmvReal - numeroDash(custos.total) - mao.custo;
  var margemBruta = resumo ? resumo.margemBruta : (fat > 0 ? lucroBruto / fat * 100 : 0);

  setDash("kpiFaturamento", moedaDash(fat));
  setDash("kpiCompras", moedaDash(compras));
  setDash("kpiCmv", moedaDash(cmvReal));
  setDash("kpiCmvPercent", pctDash(cmvPct));
  setDash("cmvHighlightValue", moedaDash(cmvReal));
  setDash("cmvMeterPercent", Math.round(cmvPct) + "%");
  setDash("dashEstoqueInicial", moedaDash(estoqueInicial));
  setDash("dashComprasMes", moedaDash(compras));
  setDash("dashEstoqueFinal", moedaDash(estoqueFinalValor));
  setDash("kpiCmvStatus", statusCmvDash(cmvPct));

  setDash("dashLucroBruto", moedaDash(lucroBruto));
  setDash("dashMargemBruta", pctDash(margemBruta));
  setDash("dashLucroEstimado", moedaDash(lucroEstimado));

  renderAnaliseDash({ fat: fat, compras: compras, estoqueInicial: estoqueInicial, estoqueFinal: estoqueFinalValor, cmvReal: cmvReal, cmvPct: cmvPct, cmvTeorico: cmvTeorico, diferenca: diferenca, custos: custos, mao: mao, lucroEstimado: lucroEstimado });
  renderCmvChartDash();
  renderUltimasComprasDash();
  renderIconesDash();
}

function renderAnaliseDash(d) {
  var el = document.getElementById("dashboardAnaliseInteligente");
  if (!el) return;
  var cards = [];
  if (d.fat <= 0) cards.push(cardAnaliseDash("warning", "Faturamento pendente", "Registre os fechamentos do dia para calcular todos os indicadores."));
  if (d.estoqueFinal <= 0) cards.push(cardAnaliseDash("warning", "Inventário pendente", "Faça o fechamento de estoque para calcular o CMV real."));
  if (d.compras <= 0) cards.push(cardAnaliseDash("warning", "Compras não registradas", "Registre as compras de insumos e embalagens do período."));
  if (d.fat > 0 && d.cmvPct <= 30) cards.push(cardAnaliseDash("success", "CMV dentro da meta", "O CMV real está abaixo de 30% do faturamento."));
  if (d.fat > 0 && d.cmvPct > 30 && d.cmvPct <= 38) cards.push(cardAnaliseDash("warning", "CMV em atenção", "O CMV está acima do ideal. Revise compras, estoque e fichas técnicas."));
  if (d.fat > 0 && d.cmvPct > 38) cards.push(cardAnaliseDash("danger", "CMV crítico", "O custo consumido está comprometendo a margem da operação."));
  if (d.cmvTeorico > 0 && d.diferenca > 0) cards.push(cardAnaliseDash("warning", "Perda operacional", "O CMV real está " + moedaDash(d.diferenca) + " acima do teórico das vendas do mês."));
  if (d.lucroEstimado < 0 && d.fat > 0) cards.push(cardAnaliseDash("danger", "Possível prejuízo", "Após CMV, custos e mão de obra, o mês pode estar negativo."));
  if (!cards.length) cards.push(cardAnaliseDash("success", "Aguardando dados", "Preencha faturamento, compras, estoque, custos e vendas do mês para gerar diagnósticos."));
  el.innerHTML = cards.join("");
}

function cardAnaliseDash(tipo, titulo, texto) {
  var icon = tipo === "success" ? "check-circle" : tipo === "danger" ? "alert-triangle" : "alert-circle";
  return "<div class='analysis-card " + tipo + "'><i data-lucide='" + icon + "'></i><div><strong>" + escapeDash(titulo) + "</strong><p>" + escapeDash(texto) + "</p></div></div>";
}

function renderCmvChartDash() {
  var el = document.getElementById("cmvChartPlaceholder");
  if (!el) return;
  var meses = ultimosMesesDash(6);
  var dados = meses.map(function (comp) {
    var fat = faturamentoMesDash(comp);
    var cmv = Math.max(0, estoqueInicialDash(comp) + comprasMesDash(comp) - estoqueFinalDash(comp).total);
    return { comp: comp, pct: fat > 0 ? cmv / fat * 100 : 0 };
  });
  if (!dados.some(function (d) { return d.pct > 0; })) {
    el.textContent = "Nenhum histórico de CMV salvo ainda.";
    return;
  }
  var max = Math.max.apply(null, dados.map(function (d) { return d.pct; })) || 1;
  el.innerHTML = dados.map(function (d) {
    return "<div class='bar-row'><span>" + mesCurtoDash(d.comp) + "</span><div class='bar-track'><div class='bar-fill' style='width:" + Math.max(4, d.pct / max * 100) + "%'></div></div><strong>" + pctDash(d.pct) + "</strong></div>";
  }).join("");
}

function renderUltimasComprasDash() {
  var table = document.getElementById("dashboardComprasTable") || document.getElementById("ultimasComprasTable");
  if (!table) return;
  var compras = listaDash("balu_compras_realizadas").slice().sort(function (a, b) { return String(b.data || b.dataCompra).localeCompare(String(a.data || a.dataCompra)); }).slice(0, 5);
  if (!compras.length) { table.innerHTML = "<tr><td colspan='4' class='text-muted'>Nenhuma compra registrada.</td></tr>"; return; }
  table.innerHTML = compras.map(function (c) { return "<tr><td>" + dataBRDash(c.data || c.dataCompra) + "</td><td>" + escapeDash(c.localCompra || c.fornecedor || "-") + "</td><td>" + moedaDash(c.valorDestinadoEstoque || c.valorCmv || c.valor || c.total || c.valorTotal) + "</td><td><span class='badge success'>CMV</span></td></tr>"; }).join("");
}

function faturamentoMesDash(comp) {
  if (typeof window.BALU_GET_FATURAMENTO_MENSAL === "function") return window.BALU_GET_FATURAMENTO_MENSAL(comp);
  return listaDash("balu_faturamento").filter(function (r) { return (r.status || "Confirmado") !== "Cancelado" && (r.competencia || String(r.data || "").slice(0, 7)) === comp; }).reduce(function (s, r) {
    if (Array.isArray(r.canais)) return s + r.canais.reduce(function (acc, c) { return acc + numeroDash(c.valor || c.total || c.faturamento); }, 0);
    return s + numeroDash(r.total || r.valor || r.faturamento);
  }, 0);
}
function comprasMesDash(comp) { if (typeof window.BALU_V7_TOTAL_COMPRAS_ESTOQUE === "function") return window.BALU_V7_TOTAL_COMPRAS_ESTOQUE(comp); return listaDash("balu_compras_realizadas").filter(function (r) { return (r.competencia || String(r.data || r.dataCompra || "").slice(0, 7)) === comp; }).reduce(function (s, r) { return s + numeroDash(r.valorDestinadoEstoque || r.valorCmv || r.valor || r.total || r.valorTotal); }, 0); }
function estoqueInicialDash(comp) { if (typeof window.BALU_V7_RESUMO_EXECUTIVO === "function") return window.BALU_V7_RESUMO_EXECUTIVO(comp).estoqueInicial; var inv = listaDash("balu_inventarios"); var atual = inv.find(function (i) { return i.competencia === comp && i.tipo === "Estoque Inicial"; }); if (atual) return numeroDash(atual.total || atual.totalEstoque); var ant = inv.find(function (i) { return i.competencia === competenciaAnteriorDash(comp) && i.tipo === "Fechamento de Estoque"; }); return ant ? numeroDash(ant.total || ant.totalEstoque) : 0; }
function estoqueFinalDash(comp) { if (typeof window.BALU_V7_RESUMO_EXECUTIVO === "function") { var r = window.BALU_V7_RESUMO_EXECUTIVO(comp); return { total: r.estoqueFinal, producao: 0, revenda: 0, embalagens: 0 }; } var i = listaDash("balu_inventarios").find(function (r) { return r.competencia === comp && r.tipo === "Fechamento de Estoque"; }); return { total: numeroDash(i && (i.total || i.totalEstoque)), producao: numeroDash(i && i.totalProducao), revenda: numeroDash(i && i.totalRevenda), embalagens: numeroDash(i && i.totalEmbalagens) }; }
function vendaMensalDash(comp) { return listaDash("balu_vendas_mensais").find(function (v) { return v.competencia === comp; }) || null; }
function custosMesDash(comp) { var c = listaDash("balu_custos_operacionais_fechamentos").find(function (x) { return x.competencia === comp; }); return c || { total: 0, percentualOperacional: 0 }; }
function maoObraDash() { var custo = listaDash("balu_funcionarios").reduce(function (s, f) { return s + numeroDash(f.custoTotal || f.custoMensal || f.salarioTotal || f.salario || f.valor); }, 0); return { custo: custo }; }

function statusCmvDash(pct) { pct = numeroDash(pct); if (pct <= 0) return "Aguardando cálculo"; if (pct <= 30) return "Saudável"; if (pct <= 38) return "Atenção"; return "Crítico"; }
function listaDash(key) { try { var raw = localStorage.getItem(key); var arr = raw ? JSON.parse(raw) : []; return Array.isArray(arr) ? arr : []; } catch (e) { return []; } }
function setDash(id, valor) { var el = document.getElementById(id); if (el) el.textContent = valor == null ? "" : valor; }
function numeroDash(v) { if (typeof v === "number") return isFinite(v) ? v : 0; var s = String(v || "").replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, ""); var n = parseFloat(s); return isNaN(n) ? 0 : n; }
function moedaDash(v) { return numeroDash(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function pctDash(v) { return numeroDash(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%"; }
function competenciaAtualDash() { return new Date().toISOString().slice(0, 7); }
function competenciaAnteriorDash(comp) { var d = new Date(comp + "-01T00:00:00"); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); }
function ultimosMesesDash(qtd) { var lista = []; var d = new Date(competenciaAtualDash() + "-01T00:00:00"); for (var i = qtd - 1; i >= 0; i--) { var c = new Date(d); c.setMonth(c.getMonth() - i); lista.push(c.toISOString().slice(0, 7)); } return lista; }
function mesCurtoDash(comp) { var nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]; var m = parseInt(String(comp).slice(5, 7), 10) - 1; return (nomes[m] || comp) + "/" + String(comp).slice(2, 4); }
function dataBRDash(v) { if (!v) return "-"; var p = String(v).slice(0, 10).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : v; }
function escapeDash(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function renderIconesDash() { if (typeof window.BALU_RENDER_ICONS === "function") window.BALU_RENDER_ICONS(); else if (window.lucide) window.lucide.createIcons(); }
