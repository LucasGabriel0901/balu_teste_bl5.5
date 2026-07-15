// ==============================
// BALU FOOD - FATURAMENTO ENXUTO
// Fechamento diário por canais, sem virar PDV.
// ==============================

var faturamentoCache = [];
var canaisFaturamentoCache = [];

var BALU_FATURAMENTO_KEY = "balu_faturamento";
var BALU_CANAIS_FATURAMENTO_KEY = "balu_faturamento_canais";
var BALU_MEDIA_FATURAMENTO_KEY = "balu_faturamento_media_meses";

var CANAIS_PADRAO_FAT = [
  "Salão",
  "Delivery próprio",
  "iFood",
  "WhatsApp",
  "Eventos",
  "Outros"
];

var GRUPOS_CANAIS_FAT = {
  "Salão": "Presencial",
  "Balcão": "Presencial",
  "Delivery próprio": "Delivery",
  "iFood": "Marketplace",
  "99Food": "Marketplace",
  "WhatsApp": "Delivery",
  "Eventos": "Eventos",
  "Eventos / Buffet": "Eventos",
  "Outros": "Outros",
  "Outros canais": "Outros"
};

document.addEventListener("DOMContentLoaded", function () {
  canaisFaturamentoCache = carregarCanaisFaturamento();
  faturamentoCache = carregarFaturamento();
  initFaturamento();
  renderFaturamento();
});

function initFaturamento() {
  var btnNovo = document.getElementById("btnNovoFaturamento");
  var form = document.getElementById("formFaturamento");
  var container = document.getElementById("fatCanaisContainer");
  var search = document.getElementById("searchFaturamento");
  var filterStatus = document.getElementById("filterStatusFat");
  var btnAdicionarCanal = document.getElementById("btnAdicionarCanalFat");
  var btnConfigMedia = document.getElementById("btnConfigMediaFat");
  var btnFecharMedia = document.getElementById("btnFecharMediaFat");
  var btnCancelarMedia = document.getElementById("btnCancelarMediaFat");
  var btnSalvarMedia = document.getElementById("btnSalvarMediaFat");

  if (btnNovo) {
    btnNovo.addEventListener("click", function () {
      prepararFechamento();
    });
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      salvarFechamento();
    });
  }

  if (container) {
    container.addEventListener("input", function (event) {
      if (event.target.classList.contains("fat-canal-valor")) {
        atualizarTotalFechamentoPreview();
      }
    });

    container.addEventListener("click", function (event) {
      var botao = event.target.closest("button");
      if (!botao) return;

      if (botao.classList.contains("btn-remover-canal-fat")) {
        var linha = botao.closest(".simple-entry-row");
        if (linha) linha.remove();
        atualizarTotalFechamentoPreview();
      }
    });
  }

  if (btnAdicionarCanal) {
    btnAdicionarCanal.addEventListener("click", adicionarNovoCanalNoFechamento);
  }

  if (search) search.addEventListener("input", renderFaturamento);
  if (filterStatus) filterStatus.addEventListener("change", renderFaturamento);

  if (btnConfigMedia) {
    btnConfigMedia.addEventListener("click", abrirModalMediaFaturamento);
  }

  [btnFecharMedia, btnCancelarMedia].forEach(function (botao) {
    if (botao) botao.addEventListener("click", fecharModalMediaFaturamento);
  });

  if (btnSalvarMedia) {
    btnSalvarMedia.addEventListener("click", salvarConfigMediaFaturamento);
  }
}

function prepararFechamento(item) {
  setValueFat("fatId", item ? item.id : "");
  setValueFat("fatData", item ? item.data : dataAtualFat());
  setValueFat("fatUsuario", item ? item.usuario : obterUsuarioFaturamento());
  setValueFat("fatStatus", item ? item.status : "Confirmado");
  setValueFat("fatObservacoes", item ? item.observacoes : "");
  setTextFat("drawerFaturamentoTitle", item ? "Editar Fechamento" : "Novo Fechamento");

  renderLinhasCanaisFechamento(item ? item.canais : null);
  atualizarTotalFechamentoPreview();
  openDrawer("drawerFaturamento");
}

function renderLinhasCanaisFechamento(canaisSalvos) {
  var container = document.getElementById("fatCanaisContainer");
  if (!container) return;

  var mapaSalvo = {};
  if (Array.isArray(canaisSalvos)) {
    canaisSalvos.forEach(function (item) {
      mapaSalvo[item.canal] = numeroFat(item.valor);
    });
  }

  var canaisBase = canaisFaturamentoCache.length ? canaisFaturamentoCache : criarCanaisPadraoFat();

  container.innerHTML = canaisBase.map(function (canal) {
    return criarLinhaCanalFechamento(canal.nome, mapaSalvo[canal.nome] || "");
  }).join("");

  if (typeof window.BALU_RENDER_ICONS === "function") window.BALU_RENDER_ICONS();
}

function criarLinhaCanalFechamento(nome, valor) {
  return "<div class='simple-entry-row fat-canal-row'>" +
    "<div class='simple-entry-name'>" +
      "<strong>" + escapeHtmlFat(nome) + "</strong>" +
      "<small>" + escapeHtmlFat(GRUPOS_CANAIS_FAT[nome] || "Canal de venda") + "</small>" +
    "</div>" +
    "<div class='simple-entry-value'>" +
      "<input type='number' min='0' step='0.01' class='fat-canal-valor' data-canal='" + escapeAttrFat(nome) + "' value='" + (valor ? numeroFat(valor) : "") + "' placeholder='R$ 0,00'>" +
    "</div>" +
  "</div>";
}

function adicionarNovoCanalNoFechamento() {
  var nome = prompt("Nome do novo canal de faturamento:");
  nome = String(nome || "").trim();

  if (!nome) return;

  var existe = canaisFaturamentoCache.some(function (canal) {
    return normalizarFat(canal.nome) === normalizarFat(nome);
  });

  if (existe) {
    showToast("Esse canal já existe no fechamento.", "warning");
    return;
  }

  canaisFaturamentoCache.push({
    id: gerarIdFat("CANAL"),
    nome: nome,
    grupo: GRUPOS_CANAIS_FAT[nome] || "Personalizado",
    ativo: true,
    criadoEm: new Date().toISOString()
  });

  salvarCanaisFaturamento();

  var container = document.getElementById("fatCanaisContainer");
  if (container) {
    container.insertAdjacentHTML("beforeend", criarLinhaCanalFechamento(nome, ""));
  }

  atualizarTotalFechamentoPreview();
}

function salvarFechamento() {
  var id = getValueFat("fatId");
  var data = getValueFat("fatData");
  var status = getValueFat("fatStatus") || "Confirmado";
  var canais = coletarCanaisDoFechamento();
  var total = canais.reduce(function (soma, item) { return soma + numeroFat(item.valor); }, 0);

  if (!data) {
    showToast("Informe a data do fechamento.", "warning");
    return;
  }

  if (total <= 0 && status === "Confirmado") {
    showToast("Informe pelo menos um canal com valor maior que zero.", "warning");
    return;
  }

  var fechamento = {
    id: id || gerarIdFat("FAT"),
    data: data,
    competencia: String(data).slice(0, 7),
    usuario: getValueFat("fatUsuario") || obterUsuarioFaturamento(),
    canais: canais,
    total: total,
    valor: total,
    faturamento: total,
    status: status,
    observacoes: getValueFat("fatObservacoes"),
    atualizadoEm: new Date().toISOString()
  };

  if (id) {
    faturamentoCache = faturamentoCache.map(function (item) {
      return item.id === id ? fechamento : item;
    });
  } else {
    faturamentoCache.push(fechamento);
  }

  salvarFaturamentoLocal();
  closeDrawer();
  renderFaturamento();
  showToast("Fechamento salvo com sucesso.", "success");
}

function coletarCanaisDoFechamento() {
  var campos = document.querySelectorAll(".fat-canal-valor");
  var lista = [];

  campos.forEach(function (campo) {
    var valor = numeroFat(campo.value);
    var canal = campo.getAttribute("data-canal") || "Outros";

    if (valor > 0) {
      lista.push({
        canal: canal,
        grupo: GRUPOS_CANAIS_FAT[canal] || "Personalizado",
        valor: valor
      });
    }
  });

  return lista;
}

function atualizarTotalFechamentoPreview() {
  var total = coletarCanaisDoFechamento().reduce(function (soma, item) {
    return soma + numeroFat(item.valor);
  }, 0);

  setTextFat("fatTotalPreview", moedaFat(total));
}

function editarFaturamento(id) {
  var item = faturamentoCache.find(function (registro) {
    return registro.id === id;
  });

  if (item) prepararFechamento(item);
}

function excluirFaturamento(id) {
  if (!confirmAction("Deseja excluir este fechamento?")) return;

  faturamentoCache = faturamentoCache.filter(function (item) {
    return item.id !== id;
  });

  salvarFaturamentoLocal();
  renderFaturamento();
}

function renderFaturamento() {
  var competencia = competenciaAtualFat();
  var confirmados = faturamentoCache.filter(function (item) {
    return getStatusFat(item) === "Confirmado";
  });
  var doMes = confirmados.filter(function (item) {
    return String(item.data || item.competencia || "").slice(0, 7) === competencia;
  });

  var totalMes = doMes.reduce(function (soma, item) { return soma + getTotalFechamentoFat(item); }, 0);
  var mediaMensal = calcularFaturamentoMedioFat(confirmados);
  var resumoPeriodo = agruparPorCanalFat(filtrarPeriodoMediaFat(confirmados));
  var principal = resumoPeriodo.filter(function (item) { return item.valor > 0; }).sort(function (a, b) { return b.valor - a.valor; })[0];
  var ultimo = confirmados.slice().sort(function (a, b) { return dataTimestampFat(b.data) - dataTimestampFat(a.data); })[0];

  setTextFat("fatMes", moedaFat(totalMes));
  setTextFat("fatMediaMensal", moedaFat(mediaMensal));
  setTextFat("fatCanalPrincipal", principal ? principal.canal : "-");
  setTextFat("fatUltimoFechamento", ultimo ? formatarDataFat(ultimo.data) : "-");
  setTextFat("fatMediaBotao", getMesesMediaFat() + " meses");

  renderResumoCanaisFat(resumoPeriodo);
  renderGraficoMensalFat(confirmados);
  renderTabelaFaturamentoFat();

  if (typeof window.BALU_RENDER_ICONS === "function") window.BALU_RENDER_ICONS();
}

function renderTabelaFaturamentoFat() {
  var table = document.getElementById("faturamentoTable");
  if (!table) return;

  var search = normalizarFat(getValueFat("searchFaturamento"));
  var status = getValueFat("filterStatusFat");

  var lista = faturamentoCache.filter(function (item) {
    var texto = normalizarFat([item.data, item.observacoes, getStatusFat(item), canaisResumoTextoFat(item)].join(" "));
    var passaBusca = !search || texto.indexOf(search) >= 0;
    var passaStatus = !status || getStatusFat(item) === status;
    return passaBusca && passaStatus;
  });

  if (!lista.length) {
    table.innerHTML = "<tr><td colspan='6' class='text-muted'>Nenhum fechamento encontrado.</td></tr>";
    return;
  }

  table.innerHTML = lista.slice().sort(function (a, b) { return dataTimestampFat(b.data) - dataTimestampFat(a.data); }).map(function (item) {
    return "<tr>" +
      "<td>" + formatarDataFat(item.data) + "</td>" +
      "<td><strong>" + moedaFat(getTotalFechamentoFat(item)) + "</strong></td>" +
      "<td>" + escapeHtmlFat(canaisResumoTextoFat(item)) + "</td>" +
      "<td>" + escapeHtmlFat(item.observacoes || "-") + "</td>" +
      "<td>" + getStatusBadge(getStatusFat(item)) + "</td>" +
      "<td><div class='table-actions'>" +
        "<button type='button' class='btn-icon' title='Editar' aria-label='Editar' onclick='editarFaturamento(\"" + escapeAttrFat(item.id) + "\")'><i data-lucide='edit-3'></i></button>" +
        "<button type='button' class='btn-icon danger' title='Excluir' aria-label='Excluir' onclick='excluirFaturamento(\"" + escapeAttrFat(item.id) + "\")'><i data-lucide='trash-2'></i></button>" +
      "</div></td>" +
    "</tr>";
  }).join("");
}

function renderResumoCanaisFat(resumoCanais) {
  var container = document.getElementById("fatCanaisResumo");
  if (!container) return;

  var total = resumoCanais.reduce(function (soma, item) { return soma + numeroFat(item.valor); }, 0);
  var comValor = resumoCanais.filter(function (item) { return item.valor > 0; }).sort(function (a, b) { return b.valor - a.valor; });

  if (!comValor.length) {
    container.innerHTML = "<div class='empty-state-alert compact'><strong>Nenhum fechamento confirmado ainda.</strong><p>Preencha o primeiro fechamento para analisar participação por canal.</p></div>";
    return;
  }

  container.innerHTML = comValor.map(function (item) {
    var percentual = total > 0 ? item.valor / total * 100 : 0;
    return "<div class='channel-card'>" +
      "<span>" + escapeHtmlFat(item.canal) + "</span>" +
      "<strong>" + moedaFat(item.valor) + "</strong>" +
      "<small>" + percentual.toFixed(1).replace('.', ',') + "% do período</small>" +
      "<div class='channel-progress'><i style='width:" + Math.min(100, percentual).toFixed(2) + "%'></i></div>" +
    "</div>";
  }).join("");
}

function renderGraficoMensalFat(lista) {
  var container = document.getElementById("fatGraficoMensal");
  if (!container) return;

  var meses = agruparPorMesFat(lista).slice(-6);
  var maior = meses.reduce(function (max, item) { return Math.max(max, item.total); }, 0);

  if (!meses.length || maior <= 0) {
    container.innerHTML = "<div class='empty-state-alert compact'><strong>Sem histórico suficiente.</strong><p>Registre fechamentos para visualizar a evolução mensal.</p></div>";
    return;
  }

  container.innerHTML = meses.map(function (item) {
    var percentual = maior > 0 ? item.total / maior * 100 : 0;
    return "<div class='simple-bar-row'>" +
      "<span>" + escapeHtmlFat(formatarCompetenciaFat(item.competencia)) + "</span>" +
      "<div class='simple-bar-track'><i style='width:" + Math.max(4, percentual).toFixed(2) + "%'></i></div>" +
      "<strong>" + moedaFat(item.total) + "</strong>" +
    "</div>";
  }).join("");
}

function abrirModalMediaFaturamento() {
  var modal = document.getElementById("modalMediaFaturamento");
  var select = document.getElementById("fatMesesMedia");
  if (select) select.value = String(getMesesMediaFat());
  if (modal) {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }
}

function fecharModalMediaFaturamento() {
  var modal = document.getElementById("modalMediaFaturamento");
  if (modal) {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }
}

function salvarConfigMediaFaturamento() {
  var meses = Number(getValueFat("fatMesesMedia")) || 6;
  localStorage.setItem(BALU_MEDIA_FATURAMENTO_KEY, String(meses));
  fecharModalMediaFaturamento();
  renderFaturamento();
  showToast("Período da média atualizado.", "success");
}

function carregarCanaisFaturamento() {
  var lista = carregarListaFat(BALU_CANAIS_FATURAMENTO_KEY);
  if (lista.length) return lista;
  lista = criarCanaisPadraoFat();
  localStorage.setItem(BALU_CANAIS_FATURAMENTO_KEY, JSON.stringify(lista));
  return lista;
}

function criarCanaisPadraoFat() {
  return CANAIS_PADRAO_FAT.map(function (nome, index) {
    return {
      id: "CANAL-PADRAO-" + index,
      nome: nome,
      grupo: GRUPOS_CANAIS_FAT[nome] || "Outros",
      ativo: true
    };
  });
}

function carregarFaturamento() {
  var lista = carregarListaFat(BALU_FATURAMENTO_KEY);
  if (!lista.length) {
    lista = carregarListaFat("balu_faturamento_mensal");
  }

  return normalizarRegistrosFaturamento(lista);
}

function normalizarRegistrosFaturamento(lista) {
  if (!Array.isArray(lista)) return [];

  var gruposAntigos = {};
  var normalizados = [];

  lista.forEach(function (item) {
    if (Array.isArray(item.canais)) {
      normalizados.push({
        id: item.id || gerarIdFat("FAT"),
        data: item.data || item.dataRegistro || dataAtualFat(),
        competencia: item.competencia || String(item.data || item.dataRegistro || dataAtualFat()).slice(0, 7),
        usuario: item.usuario || item.registradoPor || obterUsuarioFaturamento(),
        canais: item.canais.map(function (canal) {
          return {
            canal: canal.canal || canal.nome || "Outros",
            grupo: canal.grupo || GRUPOS_CANAIS_FAT[canal.canal] || "Outros",
            valor: numeroFat(canal.valor || canal.total)
          };
        }),
        total: numeroFat(item.total || item.valor || item.faturamento),
        valor: numeroFat(item.total || item.valor || item.faturamento),
        faturamento: numeroFat(item.total || item.valor || item.faturamento),
        status: item.status || "Confirmado",
        observacoes: item.observacoes || "",
        atualizadoEm: item.atualizadoEm || item.criadoEm || new Date().toISOString()
      });
      return;
    }

    var data = item.data || item.dataRegistro || item.fatData || dataAtualFat();
    var chave = data + "|" + (item.status || "Confirmado") + "|" + (item.observacoes || "");

    if (!gruposAntigos[chave]) {
      gruposAntigos[chave] = {
        id: gerarIdFat("FAT"),
        data: data,
        competencia: String(data).slice(0, 7),
        usuario: item.usuario || obterUsuarioFaturamento(),
        canais: [],
        total: 0,
        valor: 0,
        faturamento: 0,
        status: item.status || "Confirmado",
        observacoes: item.observacoes || "",
        atualizadoEm: item.atualizadoEm || item.criadoEm || new Date().toISOString()
      };
    }

    var valor = numeroFat(item.valor || item.total || item.faturamento);
    gruposAntigos[chave].canais.push({
      canal: item.canal || "Outros",
      grupo: GRUPOS_CANAIS_FAT[item.canal] || "Outros",
      valor: valor
    });
    gruposAntigos[chave].total += valor;
    gruposAntigos[chave].valor += valor;
    gruposAntigos[chave].faturamento += valor;
  });

  Object.keys(gruposAntigos).forEach(function (chave) {
    normalizados.push(gruposAntigos[chave]);
  });

  return normalizados;
}

function salvarFaturamentoLocal() {
  localStorage.setItem(BALU_FATURAMENTO_KEY, JSON.stringify(faturamentoCache));
}

function salvarCanaisFaturamento() {
  localStorage.setItem(BALU_CANAIS_FATURAMENTO_KEY, JSON.stringify(canaisFaturamentoCache));
}

function carregarListaFat(chave) {
  try {
    var texto = localStorage.getItem(chave);
    var lista = texto ? JSON.parse(texto) : [];
    return Array.isArray(lista) ? lista : [];
  } catch (erro) {
    return [];
  }
}

function agruparPorCanalFat(lista) {
  var mapa = {};

  canaisFaturamentoCache.forEach(function (canal) { mapa[canal.nome] = 0; });

  lista.forEach(function (fechamento) {
    (fechamento.canais || []).forEach(function (item) {
      var canal = item.canal || "Outros";
      if (!mapa.hasOwnProperty(canal)) mapa[canal] = 0;
      mapa[canal] += numeroFat(item.valor);
    });
  });

  return Object.keys(mapa).map(function (canal) {
    return { canal: canal, valor: mapa[canal] };
  });
}

function agruparPorMesFat(lista) {
  var mapa = {};

  lista.forEach(function (item) {
    if (getStatusFat(item) !== "Confirmado") return;
    var competencia = String(item.data || item.competencia || "").slice(0, 7);
    if (!competencia) return;
    mapa[competencia] = (mapa[competencia] || 0) + getTotalFechamentoFat(item);
  });

  return Object.keys(mapa).sort().map(function (competencia) {
    return { competencia: competencia, total: mapa[competencia] };
  });
}

function filtrarPeriodoMediaFat(lista) {
  var meses = getMesesMediaFat();
  var competencias = obterUltimasCompetenciasFat(meses);
  return lista.filter(function (item) {
    return competencias.indexOf(String(item.data || item.competencia || "").slice(0, 7)) >= 0 && getStatusFat(item) === "Confirmado";
  });
}

function calcularFaturamentoMedioFat(lista) {
  // Regra correta: média dos totais mensais registrados.
  // Não é média entre canais e não divide por meses sem registro.
  // Ex.: Jan 85k + Fev 90k + Mar 95k / 3 = 90k.
  // Se só existir Julho, a média é o próprio total de Julho.
  var meses = getMesesMediaFat();
  var agrupado = agruparPorMesFat(lista || [])
    .filter(function (item) { return numeroFat(item.total) > 0; })
    .sort(function (a, b) { return String(b.competencia).localeCompare(String(a.competencia)); })
    .slice(0, meses);
  var total = agrupado.reduce(function (soma, item) { return soma + numeroFat(item.total); }, 0);

  if (!agrupado.length) {
    return 0;
  }

  return total / agrupado.length;
}

function getMesesMediaFat() {
  return Number(localStorage.getItem(BALU_MEDIA_FATURAMENTO_KEY)) || 6;
}

function obterUltimasCompetenciasFat(qtd) {
  var lista = [];
  var data = new Date();
  data.setDate(1);

  for (var i = 0; i < qtd; i++) {
    lista.push(data.getFullYear() + "-" + String(data.getMonth() + 1).padStart(2, "0"));
    data.setMonth(data.getMonth() - 1);
  }

  return lista;
}

function canaisResumoTextoFat(item) {
  if (!Array.isArray(item.canais) || !item.canais.length) return "Nenhum canal";
  return item.canais.map(function (canal) { return canal.canal; }).join(", ");
}

function getTotalFechamentoFat(item) {
  if (Number(item.total) > 0) return numeroFat(item.total);
  if (Number(item.valor) > 0) return numeroFat(item.valor);
  if (!Array.isArray(item.canais)) return 0;
  return item.canais.reduce(function (soma, canal) { return soma + numeroFat(canal.valor); }, 0);
}

function getStatusFat(item) {
  return item.status || "Confirmado";
}

function obterUsuarioFaturamento() {
  try {
    var sessao = JSON.parse(localStorage.getItem("balu_auth_session") || "{}");
    return sessao.nome || sessao.email || "Usuário logado";
  } catch (erro) {
    return "Usuário logado";
  }
}

function getValueFat(id) {
  var element = document.getElementById(id);
  return element ? element.value || "" : "";
}

function setValueFat(id, value) {
  var element = document.getElementById(id);
  if (element) element.value = value || "";
}

function setTextFat(id, value) {
  var element = document.getElementById(id);
  if (element) element.textContent = value || "";
}

function numeroFat(value) {
  if (typeof safeNumber === "function") return safeNumber(value);
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  return Number(String(value || "0").replace(/\./g, "").replace(",", ".")) || 0;
}

function moedaFat(value) {
  return numeroFat(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarDataFat(data) {
  return typeof formatDateBR === "function" ? formatDateBR(data) : data || "-";
}

function formatarCompetenciaFat(competencia) {
  if (!competencia || competencia.length < 7) return "-";
  var partes = competencia.split("-");
  return partes[1] + "/" + partes[0];
}

function dataAtualFat() {
  var hoje = new Date();
  return hoje.getFullYear() + "-" + String(hoje.getMonth() + 1).padStart(2, "0") + "-" + String(hoje.getDate()).padStart(2, "0");
}

function competenciaAtualFat() {
  return dataAtualFat().slice(0, 7);
}

function dataTimestampFat(valor) {
  var data = new Date(valor || "");
  return isNaN(data.getTime()) ? 0 : data.getTime();
}

function normalizarFat(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function escapeHtmlFat(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttrFat(value) {
  return escapeHtmlFat(value);
}

function gerarIdFat(prefixo) {
  return (prefixo || "FAT") + "-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

window.editarFaturamento = editarFaturamento;
window.excluirFaturamento = excluirFaturamento;
window.BALU_GET_FATURAMENTO_MEDIO = function () {
  return calcularFaturamentoMedioFat(carregarFaturamento().filter(function (item) { return getStatusFat(item) === "Confirmado"; }));
};
window.BALU_GET_FATURAMENTO_MENSAL_AGRUPADO = function () {
  return agruparPorMesFat(carregarFaturamento().filter(function (item) { return getStatusFat(item) === "Confirmado"; }));
};
window.BALU_GET_FATURAMENTO_MENSAL = function (competencia) {
  var comp = competencia || competenciaAtualFat();
  var item = agruparPorMesFat(carregarFaturamento()).find(function (linha) { return linha.competencia === comp; });
  return item ? numeroFat(item.total) : 0;
};
