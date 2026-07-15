// ==============================
// BALU FOOD - CUSTOS FIXOS E VARIÁVEIS
// Plano gerencial + fechamento mensal Despesa × Valor.
// ==============================

var custosFechamentosCache = [];
var planoDespesasCache = [];

var BALU_CUSTOS_FECHAMENTOS_KEY = "balu_custos_operacionais_fechamentos";
var BALU_CUSTOS_LEGADO_KEY = "balu_custos_operacionais";
var BALU_PLANO_DESPESAS_KEY = "balu_plano_gerencial_despesas";

var DESPESAS_PADRAO = [
  { nome: "Aluguel", natureza: "Fixo", grupo: "Imóvel" },
  { nome: "Energia", natureza: "Variável", grupo: "Utilidades" },
  { nome: "Água", natureza: "Variável", grupo: "Utilidades" },
  { nome: "Gás", natureza: "Variável", grupo: "Operacional" },
  { nome: "Internet", natureza: "Fixo", grupo: "Tecnologia" },
  { nome: "Sistema", natureza: "Fixo", grupo: "Tecnologia" },
  { nome: "Marketing", natureza: "Variável", grupo: "Marketing" },
  { nome: "Contabilidade", natureza: "Fixo", grupo: "Administrativo" },
  { nome: "Material de Limpeza", natureza: "Variável", grupo: "Operacional" }
];

document.addEventListener("DOMContentLoaded", function () {
  planoDespesasCache = carregarPlanoDespesas();
  custosFechamentosCache = carregarFechamentosCustos();
  initCustosOperacionais();
  renderCustosOperacionais();
});

function initCustosOperacionais() {
  var btnPlano = document.getElementById("btnPlanoDespesas");
  var btnRegistrar = document.getElementById("btnRegistrarCustosMes");
  var btnAdicionarDespesa = document.getElementById("btnAdicionarDespesaPlano");
  var btnSalvarPlano = document.getElementById("btnSalvarPlanoDespesas");
  var form = document.getElementById("formCustosMes");
  var search = document.getElementById("searchCustos");
  var custosContainer = document.getElementById("custosMesContainer");

  if (btnPlano) btnPlano.addEventListener("click", abrirPlanoDespesas);
  if (btnRegistrar) btnRegistrar.addEventListener("click", function () { abrirFechamentoCustos(); });
  if (btnAdicionarDespesa) btnAdicionarDespesa.addEventListener("click", adicionarDespesaPlanoLinha);
  if (btnSalvarPlano) btnSalvarPlano.addEventListener("click", salvarPlanoDespesas);
  if (search) search.addEventListener("input", renderTabelaCustos);

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      salvarFechamentoCustos();
    });
  }

  if (custosContainer) {
    custosContainer.addEventListener("input", function (event) {
      if (event.target.classList.contains("custo-mes-valor")) {
        atualizarPreviewCustosMes();
      }
    });
  }
}

function abrirPlanoDespesas() {
  renderPlanoDespesasEditor();
  openDrawer("drawerPlanoDespesas");
}

function renderPlanoDespesasEditor() {
  var container = document.getElementById("planoDespesasContainer");
  if (!container) return;

  container.innerHTML = planoDespesasCache.map(criarLinhaPlanoDespesa).join("");
  if (typeof window.BALU_RENDER_ICONS === "function") window.BALU_RENDER_ICONS();
}

function criarLinhaPlanoDespesa(item) {
  return "<div class='simple-entry-row plano-despesa-row' data-id='" + escapeAttrCusto(item.id) + "'>" +
    "<div class='form-field simple-entry-grow'>" +
      "<label>Despesa</label>" +
      "<input type='text' class='plano-despesa-nome' value='" + escapeAttrCusto(item.nome) + "' placeholder='Ex.: Aluguel'>" +
    "</div>" +
    "<div class='form-field'>" +
      "<label>Natureza</label>" +
      "<select class='plano-despesa-natureza'>" +
        optionCusto("Fixo", item.natureza) +
        optionCusto("Variável", item.natureza) +
      "</select>" +
    "</div>" +
    "<div class='form-field'>" +
      "<label>Grupo</label>" +
      "<input type='text' class='plano-despesa-grupo' value='" + escapeAttrCusto(item.grupo) + "' placeholder='Ex.: Imóvel'>" +
    "</div>" +
    "<button type='button' class='btn-icon danger' title='Remover' onclick='removerDespesaPlanoLinha(this)'><i data-lucide='trash-2'></i></button>" +
  "</div>";
}

function adicionarDespesaPlanoLinha() {
  var container = document.getElementById("planoDespesasContainer");
  if (!container) return;

  container.insertAdjacentHTML("beforeend", criarLinhaPlanoDespesa({
    id: gerarIdCusto("DESP"),
    nome: "",
    natureza: "Fixo",
    grupo: "Operacional"
  }));

  if (typeof window.BALU_RENDER_ICONS === "function") window.BALU_RENDER_ICONS();
}

function removerDespesaPlanoLinha(botao) {
  var linha = botao.closest(".plano-despesa-row");
  if (linha) linha.remove();
}

function salvarPlanoDespesas() {
  var linhas = document.querySelectorAll(".plano-despesa-row");
  var lista = [];

  linhas.forEach(function (linha) {
    var nome = getCampoLinha(linha, ".plano-despesa-nome");
    if (!nome) return;

    lista.push({
      id: linha.getAttribute("data-id") || gerarIdCusto("DESP"),
      nome: nome,
      natureza: getCampoLinha(linha, ".plano-despesa-natureza") || "Fixo",
      grupo: getCampoLinha(linha, ".plano-despesa-grupo") || "Operacional",
      ativo: true
    });
  });

  if (!lista.length) {
    mostrarMensagemCusto("Cadastre pelo menos uma despesa.", "warning");
    return;
  }

  planoDespesasCache = lista;
  localStorage.setItem(BALU_PLANO_DESPESAS_KEY, JSON.stringify(planoDespesasCache));
  closeDrawer();
  renderCustosOperacionais();
  mostrarMensagemCusto("Plano gerencial salvo com sucesso.", "success");
}

function abrirFechamentoCustos(item) {
  setValorCusto("custoFechamentoId", item ? item.id : "");
  setValorCusto("custoCompetencia", item ? item.competencia : competenciaAtualCusto());
  setValorCusto("custoRegistradoPor", item ? item.registradoPor : obterUsuarioCusto());
  setValorCusto("custoObservacoes", item ? item.observacoes : "");
  setTextoCusto("drawerCustosTitle", item ? "Editar Custos do Mês" : "Registrar Custos do Mês");

  renderTabelaPreenchimentoCustos(item ? item.itens : null);
  atualizarPreviewCustosMes();
  openDrawer("drawerCustosMes");
}

function renderTabelaPreenchimentoCustos(itensSalvos) {
  var container = document.getElementById("custosMesContainer");
  if (!container) return;

  var mapa = {};
  if (Array.isArray(itensSalvos)) {
    itensSalvos.forEach(function (item) { mapa[item.despesaId || item.nome] = numeroCusto(item.valor); });
  }

  container.innerHTML = planoDespesasCache.map(function (despesa) {
    var valor = mapa[despesa.id] || mapa[despesa.nome] || "";
    return "<div class='simple-entry-row custo-mes-row'>" +
      "<div class='simple-entry-name'>" +
        "<strong>" + escapeCusto(despesa.nome) + "</strong>" +
        "<small>" + escapeCusto(despesa.natureza) + " • " + escapeCusto(despesa.grupo) + "</small>" +
      "</div>" +
      "<div class='simple-entry-value'>" +
        "<input type='number' min='0' step='0.01' class='custo-mes-valor' data-id='" + escapeAttrCusto(despesa.id) + "' data-nome='" + escapeAttrCusto(despesa.nome) + "' value='" + (valor ? numeroCusto(valor) : "") + "' placeholder='R$ 0,00'>" +
      "</div>" +
    "</div>";
  }).join("");
}

function salvarFechamentoCustos() {
  var id = valorCusto("custoFechamentoId");
  var competencia = valorCusto("custoCompetencia");
  var itens = coletarItensCustosMes();
  var totais = calcularTotaisItensCustos(itens);
  var faturamentoMedio = obterFaturamentoMedioCustos();
  var percentual = faturamentoMedio > 0 ? totais.total / faturamentoMedio * 100 : 0;

  if (!competencia) {
    mostrarMensagemCusto("Informe o mês de referência.", "warning");
    return;
  }

  var fechamento = {
    id: id || gerarIdCusto("CUSTO"),
    competencia: competencia,
    registradoPor: valorCusto("custoRegistradoPor") || obterUsuarioCusto(),
    itens: itens,
    total: totais.total,
    totalFixos: totais.fixos,
    totalVariaveis: totais.variaveis,
    faturamentoMedio: faturamentoMedio,
    percentualOperacional: percentual,
    observacoes: valorCusto("custoObservacoes"),
    status: "Confirmado",
    atualizadoEm: new Date().toISOString()
  };

  var existeMes = custosFechamentosCache.some(function (item) {
    return item.competencia === competencia && item.id !== id;
  });

  if (existeMes && !confirm("Já existe fechamento para esse mês. Deseja substituir mantendo apenas o novo registro?")) {
    return;
  }

  custosFechamentosCache = custosFechamentosCache.filter(function (item) {
    return item.id !== id && item.competencia !== competencia;
  });

  custosFechamentosCache.push(fechamento);
  salvarFechamentosCustos();
  closeDrawer();
  renderCustosOperacionais();
  mostrarMensagemCusto("Fechamento de custos salvo com sucesso.", "success");
}

function coletarItensCustosMes() {
  var campos = document.querySelectorAll(".custo-mes-valor");
  var lista = [];

  campos.forEach(function (campo) {
    var despesaId = campo.getAttribute("data-id");
    var despesa = planoDespesasCache.find(function (item) { return item.id === despesaId; }) || {};
    var valor = numeroCusto(campo.value);

    lista.push({
      despesaId: despesaId,
      nome: despesa.nome || campo.getAttribute("data-nome") || "Despesa",
      natureza: despesa.natureza || "Fixo",
      grupo: despesa.grupo || "Operacional",
      valor: valor
    });
  });

  return lista;
}

function atualizarPreviewCustosMes() {
  var total = calcularTotaisItensCustos(coletarItensCustosMes()).total;
  setTextoCusto("custosTotalPreview", moedaCusto(total));
}

function editarCustoOperacional(id) {
  var item = custosFechamentosCache.find(function (registro) { return registro.id === id; });
  if (item) abrirFechamentoCustos(item);
}

function excluirCustoOperacional(id) {
  if (!confirm("Deseja excluir este fechamento de custos?")) return;
  custosFechamentosCache = custosFechamentosCache.filter(function (item) { return item.id !== id; });
  salvarFechamentosCustos();
  renderCustosOperacionais();
}

function renderCustosOperacionais() {
  renderResumoCustos();
  renderTabelaCustos();
  renderGraficoCustos();
  renderizarIconesCustos();
}

function renderResumoCustos() {
  var competencia = competenciaAtualCusto();
  var fechamento = obterFechamentoPorCompetencia(competencia) || obterUltimoFechamentoCusto();
  var mediaCustos = calcularMediaCustos();
  var faturamentoMedio = obterFaturamentoMedioCustos();
  var total = fechamento ? numeroCusto(fechamento.total) : 0;
  var percentual = faturamentoMedio > 0 ? total / faturamentoMedio * 100 : 0;

  setTextoCusto("custosTotalMes", moedaCusto(total));
  setTextoCusto("custosPercentualMes", percentualCusto(percentual));
  setTextoCusto("custosMediaOperacional", moedaCusto(mediaCustos));
  setTextoCusto("custosUltimoFechamento", fechamento ? formatarCompetenciaCusto(fechamento.competencia) : "-");
  setTextoCusto("custosFixosMes", moedaCusto(fechamento ? fechamento.totalFixos : 0));
  setTextoCusto("custosVariaveisMes", moedaCusto(fechamento ? fechamento.totalVariaveis : 0));
  setTextoCusto("custosFaturamentoBase", moedaCusto(faturamentoMedio));
}

function renderTabelaCustos() {
  var tabela = document.getElementById("custosTable");
  if (!tabela) return;

  var busca = normalizarCusto(valorCusto("searchCustos"));
  var lista = custosFechamentosCache.filter(function (item) {
    var texto = normalizarCusto([item.competencia, item.observacoes, item.total, itensTextoCusto(item)].join(" "));
    return !busca || texto.indexOf(busca) >= 0;
  });

  if (!lista.length) {
    tabela.innerHTML = "<tr><td colspan='7' class='text-muted'>Nenhum fechamento de custos registrado ainda.</td></tr>";
    return;
  }

  tabela.innerHTML = lista.sort(function (a, b) { return String(b.competencia).localeCompare(String(a.competencia)); }).map(function (item) {
    return "<tr>" +
      "<td>" + formatarCompetenciaCusto(item.competencia) + "</td>" +
      "<td><strong>" + moedaCusto(item.total) + "</strong></td>" +
      "<td>" + moedaCusto(item.totalFixos) + "</td>" +
      "<td>" + moedaCusto(item.totalVariaveis) + "</td>" +
      "<td><strong>" + percentualCusto(item.percentualOperacional) + "</strong></td>" +
      "<td>" + escapeCusto(item.observacoes || "-") + "</td>" +
      "<td><div class='table-actions'>" +
        "<button type='button' class='btn-icon' title='Editar' onclick='editarCustoOperacional(\"" + escapeAttrCusto(item.id) + "\")'><i data-lucide='edit-3'></i></button>" +
        "<button type='button' class='btn-icon danger' title='Excluir' onclick='excluirCustoOperacional(\"" + escapeAttrCusto(item.id) + "\")'><i data-lucide='trash-2'></i></button>" +
      "</div></td>" +
    "</tr>";
  }).join("");
}

function renderGraficoCustos() {
  var container = document.getElementById("custosGraficoMensal");
  if (!container) return;

  var lista = custosFechamentosCache.slice().sort(function (a, b) { return String(a.competencia).localeCompare(String(b.competencia)); }).slice(-6);
  var maior = lista.reduce(function (max, item) { return Math.max(max, numeroCusto(item.total)); }, 0);

  if (!lista.length || maior <= 0) {
    container.innerHTML = "<div class='empty-state-alert compact'><strong>Nenhum histórico de custos.</strong><p>Registre os custos do mês para visualizar a evolução.</p></div>";
    return;
  }

  container.innerHTML = lista.map(function (item) {
    var percentual = maior > 0 ? numeroCusto(item.total) / maior * 100 : 0;
    return "<div class='simple-bar-row'>" +
      "<span>" + formatarCompetenciaCusto(item.competencia) + "</span>" +
      "<div class='simple-bar-track'><i style='width:" + Math.max(4, percentual).toFixed(2) + "%'></i></div>" +
      "<strong>" + moedaCusto(item.total) + "</strong>" +
    "</div>";
  }).join("");
}

function carregarPlanoDespesas() {
  var lista = carregarListaCusto(BALU_PLANO_DESPESAS_KEY);
  if (lista.length) return lista;

  lista = DESPESAS_PADRAO.map(function (item, index) {
    return {
      id: "DESP-PADRAO-" + index,
      nome: item.nome,
      natureza: item.natureza,
      grupo: item.grupo,
      ativo: true
    };
  });

  localStorage.setItem(BALU_PLANO_DESPESAS_KEY, JSON.stringify(lista));
  return lista;
}

function carregarFechamentosCustos() {
  var lista = carregarListaCusto(BALU_CUSTOS_FECHAMENTOS_KEY);
  if (lista.length) return lista;

  var legado = carregarListaCusto(BALU_CUSTOS_LEGADO_KEY);
  return normalizarCustosLegados(legado);
}

function normalizarCustosLegados(lista) {
  if (!Array.isArray(lista)) return [];

  var mapa = {};

  lista.forEach(function (item) {
    var data = item.data || item.custoData || item.criadoEm || new Date().toISOString().slice(0, 10);
    var competencia = item.competencia || String(data).slice(0, 7);
    var chave = competencia;

    if (!mapa[chave]) {
      mapa[chave] = {
        id: gerarIdCusto("CUSTO"),
        competencia: competencia,
        registradoPor: obterUsuarioCusto(),
        itens: [],
        total: 0,
        totalFixos: 0,
        totalVariaveis: 0,
        faturamentoMedio: obterFaturamentoMedioCustos(),
        percentualOperacional: 0,
        observacoes: "",
        status: "Confirmado"
      };
    }

    var valor = numeroCusto(item.valor || item.total);
    var natureza = item.tipo || item.natureza || "Fixo";

    mapa[chave].itens.push({
      despesaId: item.id || gerarIdCusto("DESP"),
      nome: item.categoria || item.descricao || "Despesa",
      natureza: natureza,
      grupo: item.grupo || "Operacional",
      valor: valor
    });

    mapa[chave].total += valor;
    if (natureza === "Variável") mapa[chave].totalVariaveis += valor;
    else mapa[chave].totalFixos += valor;
  });

  return Object.keys(mapa).map(function (chave) {
    var item = mapa[chave];
    item.percentualOperacional = item.faturamentoMedio > 0 ? item.total / item.faturamentoMedio * 100 : 0;
    return item;
  });
}

function salvarFechamentosCustos() {
  localStorage.setItem(BALU_CUSTOS_FECHAMENTOS_KEY, JSON.stringify(custosFechamentosCache));
  localStorage.setItem(BALU_CUSTOS_LEGADO_KEY, JSON.stringify(custosFechamentosCache));
}

function carregarListaCusto(chave) {
  try {
    var texto = localStorage.getItem(chave);
    var lista = texto ? JSON.parse(texto) : [];
    return Array.isArray(lista) ? lista : [];
  } catch (erro) {
    return [];
  }
}

function calcularTotaisItensCustos(itens) {
  return (itens || []).reduce(function (totais, item) {
    var valor = numeroCusto(item.valor);
    totais.total += valor;
    if (item.natureza === "Variável") totais.variaveis += valor;
    else totais.fixos += valor;
    return totais;
  }, { total: 0, fixos: 0, variaveis: 0 });
}

function obterFechamentoPorCompetencia(competencia) {
  return custosFechamentosCache.find(function (item) { return item.competencia === competencia; });
}

function obterUltimoFechamentoCusto() {
  return custosFechamentosCache.slice().sort(function (a, b) { return String(b.competencia).localeCompare(String(a.competencia)); })[0];
}

function calcularMediaCustos() {
  var meses = Number(localStorage.getItem("balu_faturamento_media_meses")) || 6;
  var lista = custosFechamentosCache
    .filter(function (item) { return numeroCusto(item.total) > 0; })
    .sort(function (a, b) { return String(b.competencia).localeCompare(String(a.competencia)); })
    .slice(0, meses);
  var total = lista.reduce(function (soma, item) { return soma + numeroCusto(item.total); }, 0);
  return lista.length ? total / lista.length : 0;
}

function obterFaturamentoMedioCustos() {
  if (typeof window.BALU_GET_FATURAMENTO_MEDIO === "function") {
    return numeroCusto(window.BALU_GET_FATURAMENTO_MEDIO());
  }

  var registros = carregarListaCusto("balu_faturamento");
  var meses = Number(localStorage.getItem("balu_faturamento_media_meses")) || 6;
  var mapa = {};

  registros.forEach(function (item) {
    var status = String(item.status || "Confirmado").toLowerCase();
    var competencia = item.competencia || String(item.data || "").slice(0, 7);
    if (["cancelado", "cancelada", "rascunho"].indexOf(status) >= 0 || !competencia) return;
    var totalItem = Array.isArray(item.canais)
      ? item.canais.reduce(function (soma, canal) { return soma + numeroCusto(canal.valor || canal.total); }, 0)
      : numeroCusto(item.total || item.valor || item.faturamento);
    mapa[competencia] = (mapa[competencia] || 0) + totalItem;
  });

  var mesesComRegistro = Object.keys(mapa)
    .filter(function (chave) { return mapa[chave] > 0; })
    .sort(function (a, b) { return String(b).localeCompare(String(a)); })
    .slice(0, meses);
  var total = mesesComRegistro.reduce(function (soma, chave) { return soma + mapa[chave]; }, 0);
  return mesesComRegistro.length ? total / mesesComRegistro.length : 0;
}

function ultimasCompetenciasCusto(qtd) {
  var lista = [];
  var data = new Date();
  data.setDate(1);

  for (var i = 0; i < qtd; i++) {
    lista.push(data.getFullYear() + "-" + String(data.getMonth() + 1).padStart(2, "0"));
    data.setMonth(data.getMonth() - 1);
  }

  return lista;
}

function itensTextoCusto(item) {
  return (item.itens || []).map(function (linha) { return linha.nome; }).join(" ");
}

function getCampoLinha(linha, seletor) {
  var campo = linha.querySelector(seletor);
  return campo ? campo.value.trim() : "";
}

function optionCusto(valor, selecionado) {
  return "<option value='" + escapeAttrCusto(valor) + "'" + (valor === selecionado ? " selected" : "") + ">" + escapeCusto(valor) + "</option>";
}

function valorCusto(id) {
  var campo = document.getElementById(id);
  return campo ? campo.value || "" : "";
}

function setValorCusto(id, valor) {
  var campo = document.getElementById(id);
  if (campo) campo.value = valor || "";
}

function setTextoCusto(id, valor) {
  var campo = document.getElementById(id);
  if (campo) campo.textContent = valor;
}

function numeroCusto(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  return Number(String(valor || "0").replace(/\./g, "").replace(",", ".")) || 0;
}

function moedaCusto(valor) {
  return numeroCusto(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function percentualCusto(valor) {
  return numeroCusto(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
}

function competenciaAtualCusto() {
  var hoje = new Date();
  return hoje.getFullYear() + "-" + String(hoje.getMonth() + 1).padStart(2, "0");
}

function formatarCompetenciaCusto(competencia) {
  if (!competencia || competencia.length < 7) return "-";
  var partes = competencia.split("-");
  return partes[1] + "/" + partes[0];
}

function obterUsuarioCusto() {
  try {
    var sessao = JSON.parse(localStorage.getItem("balu_auth_session") || "{}");
    return sessao.nome || sessao.email || "Usuário logado";
  } catch (erro) {
    return "Usuário logado";
  }
}

function mostrarMensagemCusto(mensagem, tipo) {
  if (typeof showToast === "function") showToast(mensagem, tipo || "success");
  else console.log(mensagem);
}

function renderizarIconesCustos() {
  if (typeof window.BALU_RENDER_ICONS === "function") window.BALU_RENDER_ICONS();
  else if (window.lucide) window.lucide.createIcons();
}

function normalizarCusto(valor) {
  return String(valor || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function gerarIdCusto(prefixo) {
  return (prefixo || "CUSTO") + "-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

function escapeCusto(valor) {
  return String(valor === undefined || valor === null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttrCusto(valor) {
  return escapeCusto(valor).replace(/`/g, "&#096;");
}

window.editarCustoOperacional = editarCustoOperacional;
window.excluirCustoOperacional = excluirCustoOperacional;
window.removerDespesaPlanoLinha = removerDespesaPlanoLinha;
window.BALU_GET_CUSTOS_PERCENTUAL = function () {
  var fechamento = obterFechamentoPorCompetencia(competenciaAtualCusto()) || obterUltimoFechamentoCusto();
  return fechamento ? numeroCusto(fechamento.percentualOperacional) : 0;
};
