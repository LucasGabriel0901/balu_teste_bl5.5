// ==============================
// BALU FOOD - APP GLOBAL
// Funções reutilizáveis do sistema
// ==============================

(function aplicarTemaBaluAntesDoLayout() {
function aplicarClasseTema(tema) {
var temaFinal = tema === "light" ? "light" : "dark";
var root = document.documentElement;

root.setAttribute("data-theme", temaFinal);
root.classList.remove("theme-light", "theme-dark");
root.classList.add("theme-" + temaFinal);
root.style.colorScheme = temaFinal;

if (document.body) {
document.body.classList.remove("theme-light", "theme-dark");
document.body.classList.add("theme-" + temaFinal);
}
}

try {
var temaSalvo = localStorage.getItem("balu_theme") || "dark";
aplicarClasseTema(temaSalvo);
} catch (erro) {
aplicarClasseTema("dark");
}

if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", function () {
aplicarClasseTema(document.documentElement.getAttribute("data-theme") || "dark");
});
}
})();

// Importante:
// Nesta fase, alguns cálculos estão no JS apenas para protótipo visual.
// Na versão real, os cálculos oficiais devem ficar no PHP/backend.

const BALU_KEYS = {
clientLogo: "balu_client_logo",
insumos: "balu_insumos",
embalagens: "balu_embalagens",
kitsEmbalagens: "balu_kits_embalagens",
funcionarios: "balu_funcionarios",
custosOperacionais: "balu_custos_operacionais",
compras: "balu_compras_realizadas",
inventarios: "balu_inventarios",
cmv: "balu_cmv_mensal",
fichasTecnicas: "balu_fichas_tecnicas",
fichas_tecnicas: "balu_fichas_tecnicas",
vendasProducao: "balu_vendas_producao",
fornecedores: "balu_fornecedores",
faturamento: "balu_faturamento",
faturamentoMensal: "balu_faturamento_mensal",
precificacoes: "balu_precificacoes",
produtos: "balu_produtos",
producaoPlanejada: "balu_producao_planejada",
banners: "balu_publicidade_banners",
configuracoes: "balu_configuracoes_empresa"
};

const BALU_KEY_ALIASES = {
compras: ["balu_compras"],
cmv: ["balu_cmv"],
fichasTecnicas: ["balu_fichas_tecnicas_v2", "balu_fichas_tecnicas"],
vendasProducao: ["balu_vendas_manuais"],
faturamento: ["balu_faturamento_mensal"]
};

window.BALU_KEYS = BALU_KEYS;
window.BALU_KEY_ALIASES = BALU_KEY_ALIASES;

const BALU_ICON_FALLBACKS = {
"alert-triangle": "!",
"bar-chart-3": "GR",
"book-open": "BD",
box: "CX",
calculator: "=",
coins: "R$",
calendar: "CAL",
"calendar-days": "CAL",
"check-circle": "OK",
"chef-hat": "CH",
"chevron-down": "⌄",
"circle-help": "?",
"clipboard-list": "CL",
cloche: "CL",
"cooking-pot": "PT",
"credit-card": "CC",
download: "↓",
"edit-3": "ED",
"eye-off": "👁",
"file-bar-chart": "RP",
"file-down": "↓",
image: "IMG",
"image-plus": "+",
"layout-dashboard": "DB",
"log-out": "SAIR",
mail: "@",
menu: "☰",
moon: "☾",
package: "PK",
"panel-left-close": "⇤",
"panel-left-open": "⇥",
plus: "+",
power: "⏻",
"receipt-text": "RC",
"refresh-cw": "↻",
"rotate-ccw": "↺",
save: "SV",
send: "→",
settings: "⚙",
"shield-alert": "!",
"shield-check": "✓",
"shopping-cart": "CP",
sun: "☀",
trash: "EX",
"trash-2": "EX",
truck: "TR",
users: "US",
utensils: "UT",
upload: "↑",
wallet: "R$"
};

function baluGetTheme() {
return document.documentElement.getAttribute("data-theme") || "dark";
}

function baluSetTheme(theme) {
var tema = theme === "light" ? "light" : "dark";
var root = document.documentElement;

root.setAttribute("data-theme", tema);
root.classList.remove("theme-light", "theme-dark");
root.classList.add("theme-" + tema);
root.style.colorScheme = tema;

if (document.body) {
document.body.classList.remove("theme-light", "theme-dark");
document.body.classList.add("theme-" + tema);
}

try {
localStorage.setItem("balu_theme", tema);
} catch (erro) {
console.warn("Não foi possível salvar o tema:", erro);
}

if (typeof baluRefreshIcons === "function") {
baluRefreshIcons();
}

return tema;
}

function baluToggleTheme() {
return baluSetTheme(baluGetTheme() === "dark" ? "light" : "dark");
}

window.baluGetTheme = baluGetTheme;
window.baluSetTheme = baluSetTheme;
window.baluToggleTheme = baluToggleTheme;

function baluRefreshIcons(root) {
var scope = root && root.querySelectorAll ? root : document;

try {
if (window.lucide && typeof window.lucide.createIcons === "function") {
  window.lucide.createIcons();
}
} catch (erro) {
console.warn("Não foi possível renderizar os ícones Lucide:", erro);
}

baluApplyIconFallbacks(scope);
}

function baluApplyIconFallbacks(root) {
var scope = root && root.querySelectorAll ? root : document;

scope.querySelectorAll("[data-lucide]").forEach(function (icon) {
var tagName = String(icon.tagName || "").toLowerCase();

// Quando o Lucide funciona, o elemento vira um SVG.
// Não podemos escrever texto dentro do SVG, senão o ícone parece piscar e sumir.
if (tagName === "svg") {
  icon.classList.add("balu-icon-ready");
  return;
}

if (icon.querySelector("svg") || icon.children.length || icon.textContent.trim()) {
  return;
}

var name = icon.getAttribute("data-lucide") || "";
icon.classList.add("icon-fallback");
icon.setAttribute("aria-hidden", "true");
icon.textContent = BALU_ICON_FALLBACKS[name] || name.slice(0, 2).toUpperCase() || "?";
});

baluApplyButtonFallbacks(scope);
}

function baluApplyButtonFallbacks(root) {
var scope = root && root.querySelectorAll ? root : document;

scope.querySelectorAll("button, .btn, .btn-icon, .topbar-icon-btn").forEach(function (button) {
var texto = String(button.textContent || "").trim();
var temIcone = button.querySelector("svg, .icon-fallback");

if (texto || temIcone) {
  return;
}

var label = button.getAttribute("aria-label") || button.getAttribute("title") || "Ação";
var fallback = document.createElement("span");
fallback.className = "icon-fallback button-icon-fallback";
fallback.textContent = label.length <= 3 ? label : label.slice(0, 2).toUpperCase();
button.appendChild(fallback);
});
}

if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", function () {
baluRefreshIcons();
baluWatchIconFallbacks();
});
} else {
baluRefreshIcons();
baluWatchIconFallbacks();
}

function baluWatchIconFallbacks() {
if (!window.MutationObserver || window.__baluIconObserverStarted) {
return;
}

window.__baluIconObserverStarted = true;

var timeoutId = null;
var observer = new MutationObserver(function (mutations) {
var precisaAtualizar = mutations.some(function (mutation) {
  return Array.prototype.some.call(mutation.addedNodes || [], function (node) {
    return node.nodeType === 1 && (
      node.matches && node.matches("[data-lucide], button, .btn-icon") ||
      node.querySelector && node.querySelector("[data-lucide], button, .btn-icon")
    );
  });
});

if (!precisaAtualizar) {
  return;
}

clearTimeout(timeoutId);
timeoutId = setTimeout(function () {
  baluRefreshIcons();
}, 80);
});

observer.observe(document.body, {
childList: true,
subtree: true
});
}

window.baluRefreshIcons = baluRefreshIcons;
window.BALU_RENDER_ICONS = baluRefreshIcons;

// ==============================
// Números e formatação BR
// ==============================

function safeNumber(value) {
if (typeof value === "number") {
return Number.isFinite(value) ? value : 0;
}

let cleanValue = String(value ?? "")
.trim()
.replace(/\s/g, "")
.replace("R$", "")
.replace("%", "")
.replace("x", "");

if (!cleanValue) {
return 0;
}

if (cleanValue.indexOf(",") >= 0) {
cleanValue = cleanValue.replace(/\./g, "").replace(",", ".");
} else {
const partes = cleanValue.split(".");

if (partes.length > 2) {
  cleanValue = partes.join("");
} else if (partes.length === 2 && partes[1].length === 3 && partes[0].length <= 3) {
  cleanValue = cleanValue.replace(/\./g, "");
}
}

cleanValue = cleanValue.replace(/[^\d.-]/g, "");

const number = Number(cleanValue);

return Number.isFinite(number) ? number : 0;
}

function safeDivide(numerator, denominator) {
const a = safeNumber(numerator);
const b = safeNumber(denominator);

if (b === 0) return 0;

return a / b;
}

function formatCurrency(value) {
return safeNumber(value).toLocaleString("pt-BR", {
style: "currency",
currency: "BRL",
minimumFractionDigits: 2,
maximumFractionDigits: 2
});
}

function formatNumber(value, decimals = 2) {
return safeNumber(value).toLocaleString("pt-BR", {
minimumFractionDigits: decimals,
maximumFractionDigits: decimals
});
}

function formatPercent(value) {
return `${formatNumber(value, 2)}%`;
}



// ==============================
// Indicadores globais BALU
// Fonte única para faturamento médio mensal
// ==============================

function baluGetMediaMesesConfigurada() {
  return safeNumber(localStorage.getItem("balu_faturamento_media_meses")) || 6;
}

function baluLoadArrayFromStorageKeys(keys) {
  for (let i = 0; i < keys.length; i++) {
    try {
      const raw = localStorage.getItem(keys[i]);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch (error) {
      console.warn("Não foi possível ler", keys[i], error);
    }
  }
  return [];
}

function baluGetCompetenciaRegistro(registro) {
  const dataBase = registro && (registro.competencia || registro.mesReferencia || registro.mes || registro.data || registro.dataRegistro || registro.data_fechamento);
  const texto = String(dataBase || "");
  if (/^\d{4}-\d{2}/.test(texto)) return texto.slice(0, 7);
  return "";
}

function baluRegistroConfirmado(registro) {
  const status = String((registro && registro.status) || "Confirmado").toLowerCase();
  return ["cancelado", "cancelada", "excluido", "excluído", "rascunho"].indexOf(status) < 0;
}

function baluGetTotalFaturamentoRegistro(registro) {
  if (!registro) return 0;
  if (Array.isArray(registro.canais)) {
    const totalCanais = registro.canais.reduce(function (soma, canal) {
      return soma + safeNumber(canal.valor || canal.total || canal.faturamento);
    }, 0);
    if (totalCanais > 0) return totalCanais;
  }
  return safeNumber(registro.total || registro.valor || registro.faturamento || registro.valorTotal || registro.receita);
}

function baluGetFaturamentoMensalAgrupado() {
  const registros = baluLoadArrayFromStorageKeys(["balu_faturamento", "balu_faturamento_mensal"]);
  const mapa = {};

  registros.forEach(function (registro) {
    if (!baluRegistroConfirmado(registro)) return;
    const competencia = baluGetCompetenciaRegistro(registro);
    const total = baluGetTotalFaturamentoRegistro(registro);
    if (!competencia || total <= 0) return;
    mapa[competencia] = (mapa[competencia] || 0) + total;
  });

  return Object.keys(mapa).sort().map(function (competencia) {
    return { competencia: competencia, total: mapa[competencia] };
  });
}

function baluGetFaturamentoMedioMensal(qtdMeses) {
  const meses = safeNumber(qtdMeses) || baluGetMediaMesesConfigurada();
  const mesesComRegistro = baluGetFaturamentoMensalAgrupado()
    .filter(function (item) { return safeNumber(item.total) > 0; })
    .sort(function (a, b) { return String(b.competencia).localeCompare(String(a.competencia)); })
    .slice(0, meses);

  if (!mesesComRegistro.length) return 0;

  const total = mesesComRegistro.reduce(function (soma, item) {
    return soma + safeNumber(item.total);
  }, 0);

  // Regra de negócio: média dos totais mensais registrados.
  // Não divide por canais e não divide por meses vazios.
  return total / mesesComRegistro.length;
}

function baluGetFaturamentoDaCompetencia(competencia) {
  const comp = competencia || new Date().toISOString().slice(0, 7);
  const encontrado = baluGetFaturamentoMensalAgrupado().find(function (item) {
    return item.competencia === comp;
  });
  return encontrado ? safeNumber(encontrado.total) : 0;
}

window.BALU_GET_FATURAMENTO_MEDIO = baluGetFaturamentoMedioMensal;
window.BALU_GET_FATURAMENTO_MENSAL = baluGetFaturamentoDaCompetencia;
window.BALU_GET_FATURAMENTO_MENSAL_AGRUPADO = baluGetFaturamentoMensalAgrupado;

function formatDateBR(date) {
if (!date) return "Não informado";

const parsedDate = new Date(date);

if (Number.isNaN(parsedDate.getTime())) {
return "Não informado";
}

return parsedDate.toLocaleDateString("pt-BR");
}

function parseBRL(value) {
return safeNumber(value);
}

function sanitizeText(value, fallback = "Não informado") {
if (value === null || value === undefined || value === "") {
return fallback;
}

return String(value);
}

function displayValue(value, fallback = "Não calculado") {
if (
value === null ||
value === undefined ||
value === "" ||
value === "NaN" ||
value === "Infinity"
) {
return fallback;
}

return value;
}

// ==============================
// LocalStorage
// ==============================

function saveData(key, data) {
try {
const storageKey = getOfficialStorageKey(key);
localStorage.setItem(storageKey, JSON.stringify(data));
return true;
} catch (error) {
console.error("Erro ao salvar dados:", error);
showToast("Erro ao salvar os dados.", "danger");
return false;
}
}

function loadData(key, fallback = []) {
try {
const storageKeys = getStorageKeysWithAliases(key);

for (let i = 0; i < storageKeys.length; i++) {
  const storageKey = storageKeys[i];
  const data = localStorage.getItem(storageKey);

  if (!data) continue;

  const parsed = JSON.parse(data);

  if (i === 0 && isEmptyStorageValue(data) && storageKeys.length > 1) {
    continue;
  }

  if (i > 0 && isEmptyStorageValue(localStorage.getItem(storageKeys[0]))) {
    localStorage.setItem(storageKeys[0], JSON.stringify(parsed));
  }

  return parsed;
}

return fallback;


} catch (error) {
console.error("Erro ao carregar dados:", error);
return fallback;
}
}

function removeData(key) {
localStorage.removeItem(getOfficialStorageKey(key));
}

function getOfficialStorageKey(key) {
if (!key) {
return "";
}

if (BALU_KEYS[key]) {
return BALU_KEYS[key];
}

return String(key);
}

function getStorageKeysWithAliases(key) {
const officialKey = getOfficialStorageKey(key);
const aliasGroup = Object.keys(BALU_KEYS).find(function (name) {
return BALU_KEYS[name] === officialKey || name === key;
});

const keys = [officialKey];

if (aliasGroup && Array.isArray(BALU_KEY_ALIASES[aliasGroup])) {
BALU_KEY_ALIASES[aliasGroup].forEach(function (alias) {
  if (alias && keys.indexOf(alias) < 0) {
    keys.push(alias);
  }
});
}

return keys;
}

function isEmptyStorageValue(value) {
if (value === null || value === undefined || value === "") {
return true;
}

try {
const parsed = JSON.parse(value);

if (Array.isArray(parsed)) {
  return parsed.length === 0;
}

return parsed === null || parsed === undefined;
} catch (error) {
return false;
}
}

function generateId(prefix = "ID") {
const timestamp = Date.now();
const random = Math.floor(Math.random() * 9999);

return `${prefix}-${timestamp}-${random}`;
}

function generateCode(prefix = "BALU") {
const number = Math.floor(Math.random() * 999999)
.toString()
.padStart(6, "0");

return `${prefix}-${number}`;
}

// ==============================
// Imagens e upload
// ==============================

function imageToBase64(file) {
return new Promise((resolve, reject) => {
if (!file) {
resolve("");
return;
}


const reader = new FileReader();

reader.onload = () => resolve(reader.result);
reader.onerror = () => reject("Erro ao converter imagem.");

reader.readAsDataURL(file);


});
}

function initImagePreview(inputId, previewId, placeholderSelector) {
const input = document.getElementById(inputId);
const preview = document.getElementById(previewId);
const placeholder = placeholderSelector
? document.querySelector(placeholderSelector)
: null;

if (!input || !preview) return;

input.addEventListener("change", async () => {
const file = input.files[0];


if (!file) return;

const imageBase64 = await imageToBase64(file);

preview.src = imageBase64;
preview.style.display = "block";

if (placeholder) {
  placeholder.style.display = "none";
}

input.dataset.imageBase64 = imageBase64;


});
}

function renderThumb(image, alt = "Imagem") {
if (!image) {
return `       <div class="item-thumb placeholder">         <i data-lucide="image"></i>       </div>
    `;
}

return `     <img src="${image}" alt="${alt}" class="item-thumb">
  `;
}

// ==============================
// Drawers laterais
// ==============================

function getDrawerOverlay() {
let overlay = document.querySelector(".drawer-overlay");

if (!overlay) {
overlay = document.createElement("div");
overlay.className = "drawer-overlay";
document.body.appendChild(overlay);


overlay.addEventListener("click", () => {
  closeDrawer();
});


}

return overlay;
}

function openDrawer(drawerId) {
closeDrawer();

const drawer = document.getElementById(drawerId);
const overlay = getDrawerOverlay();

if (!drawer) return;

drawer.classList.add("is-open");
overlay.classList.add("is-open");

document.body.style.overflow = "hidden";
}

function closeDrawer() {
document.querySelectorAll(".drawer").forEach((drawer) => {
drawer.classList.remove("is-open");
});

const overlay = document.querySelector(".drawer-overlay");

if (overlay) {
overlay.classList.remove("is-open");
}

document.body.style.overflow = "";
}

function resetForm(formId) {
const form = document.getElementById(formId);

if (!form) return;

form.reset();

form.querySelectorAll("img.image-preview").forEach((img) => {
img.src = "";
img.style.display = "none";
});

form.querySelectorAll("[data-image-base64]").forEach((input) => {
input.dataset.imageBase64 = "";
});

form.querySelectorAll(".image-placeholder").forEach((placeholder) => {
placeholder.style.display = "block";
});
}

// ==============================
// Toast simples
// ==============================

function showToast(message, type = "success") {
let toastContainer = document.querySelector(".toast-container");

if (!toastContainer) {
toastContainer = document.createElement("div");
toastContainer.className = "toast-container";
toastContainer.style.position = "fixed";
toastContainer.style.right = "20px";
toastContainer.style.bottom = "20px";
toastContainer.style.zIndex = "999";
toastContainer.style.display = "flex";
toastContainer.style.flexDirection = "column";
toastContainer.style.gap = "10px";
document.body.appendChild(toastContainer);
}

const toast = document.createElement("div");

const colors = {
success: {
bg: "#E9FBEF",
text: "#008C3A",
border: "#B7EFC5"
},
warning: {
bg: "#FFF4E5",
text: "#D66A00",
border: "#FFD8A8"
},
danger: {
bg: "#FFE8EA",
text: "#C9141B",
border: "#FFC2C7"
},
purple: {
bg: "#F1EAFE",
text: "#5B21B6",
border: "#D8C7FF"
}
};

const color = colors[type] || colors.success;

toast.textContent = message;
toast.style.background = color.bg;
toast.style.color = color.text;
toast.style.border = `1px solid ${color.border}`;
toast.style.padding = "12px 14px";
toast.style.borderRadius = "12px";
toast.style.fontWeight = "800";
toast.style.fontSize = "13px";
toast.style.boxShadow = "0 12px 28px rgba(13, 27, 42, 0.10)";
toast.style.opacity = "0";
toast.style.transform = "translateY(8px)";
toast.style.transition = "0.25s ease";

toastContainer.appendChild(toast);

requestAnimationFrame(() => {
toast.style.opacity = "1";
toast.style.transform = "translateY(0)";
});

setTimeout(() => {
toast.style.opacity = "0";
toast.style.transform = "translateY(8px)";


setTimeout(() => {
  toast.remove();
}, 250);


}, 3200);
}

// ==============================
// Confirmação simples
// ==============================

function confirmAction(message = "Deseja continuar?") {
return window.confirm(message);
}

// ==============================
// Badges
// ==============================

function getStatusBadge(status) {
const normalized = sanitizeText(status, "Não informado").toLowerCase();

if (
normalized.includes("ativo") ||
normalized.includes("pago") ||
normalized.includes("finalizado") ||
normalized.includes("excelente") ||
normalized.includes("em dia")
) {
return `<span class="badge success">${status}</span>`;
}

if (
normalized.includes("atenção") ||
normalized.includes("pendente") ||
normalized.includes("aberto") ||
normalized.includes("parcial") ||
normalized.includes("esperado")
) {
return `<span class="badge warning">${status}</span>`;
}

if (
normalized.includes("crítico") ||
normalized.includes("critico") ||
normalized.includes("cancelado") ||
normalized.includes("bloqueado") ||
normalized.includes("atrasado")
) {
return `<span class="badge danger">${status}</span>`;
}

return `<span class="badge purple">${status}</span>`;
}

// ==============================
// Classificações de CMV e margem
// ==============================

function classifyCMV(cmvPercentual) {
const cmv = safeNumber(cmvPercentual);

if (cmv <= 25) return "Excelente";
if (cmv <= 35) return "Dentro do esperado";
if (cmv <= 45) return "Atenção";

return "Crítico";
}

function classifyMargin(margemPercentual) {
const margem = safeNumber(margemPercentual);

if (margem >= 50) return "Saudável";
if (margem >= 30) return "Revisar preço";

return "Margem baixa";
}

// ==============================
// Eventos globais
// ==============================

document.addEventListener("DOMContentLoaded", () => {
closeDrawer();

document.addEventListener("keydown", (event) => {
if (event.key === "Escape") {
closeDrawer();
}
});
});


// ============================================================
// BALU V7 — Motor único de cálculo gerencial
// Fonte de verdade para Dashboard, Precificação, CMV e Relatórios
// ============================================================
function baluV7Lista(key) {
  try {
    var raw = localStorage.getItem(key);
    var arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function baluV7CompetenciaAtual() {
  return new Date().toISOString().slice(0, 7);
}

function baluV7CompetenciaAnterior(comp) {
  var d = new Date(String(comp || baluV7CompetenciaAtual()) + "-01T00:00:00");
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
}

function baluV7ValorCompraEstoque(compra) {
  var nota = safeNumber(compra && (compra.valorTotalNota || compra.valorNota || compra.valorTotal || compra.total || compra.valor));
  var fora = safeNumber(compra && (compra.valorForaEstoque || compra.valorNaoEstoque || compra.valorFora || 0));
  var direto = safeNumber(compra && (compra.valorDestinadoEstoque || compra.valorCmv || compra.valorEstoque));
  if (direto > 0) return direto;
  return Math.max(0, nota - fora);
}

function baluV7TotalComprasEstoque(competencia) {
  var comp = competencia || baluV7CompetenciaAtual();
  return baluV7Lista("balu_compras_realizadas").filter(function (item) {
    var c = item.competencia || String(item.data || item.dataCompra || "").slice(0, 7);
    var status = String(item.status || "Confirmado").toLowerCase();
    return c === comp && status.indexOf("cancel") < 0;
  }).reduce(function (soma, item) { return soma + baluV7ValorCompraEstoque(item); }, 0);
}

function baluV7TotalEstoqueInicial(competencia) {
  var comp = competencia || baluV7CompetenciaAtual();
  var inventarios = baluV7Lista("balu_inventarios");
  var atual = inventarios.find(function (item) {
    return item.competencia === comp && String(item.tipo || "").toLowerCase().indexOf("inicial") >= 0;
  });
  if (atual) return safeNumber(atual.total || atual.totalEstoque || atual.valorTotal || atual.valorEstoque);

  var anterior = baluV7CompetenciaAnterior(comp);
  var fechamentoAnterior = inventarios.find(function (item) {
    return item.competencia === anterior && String(item.tipo || "").toLowerCase().indexOf("fechamento") >= 0;
  });
  return fechamentoAnterior ? safeNumber(fechamentoAnterior.total || fechamentoAnterior.totalEstoque || fechamentoAnterior.valorTotal || fechamentoAnterior.valorEstoque) : 0;
}

function baluV7TotalEstoqueFinal(competencia) {
  var comp = competencia || baluV7CompetenciaAtual();
  var fechamento = baluV7Lista("balu_inventarios").find(function (item) {
    return item.competencia === comp && String(item.tipo || "").toLowerCase().indexOf("fechamento") >= 0;
  });
  return fechamento ? safeNumber(fechamento.total || fechamento.totalEstoque || fechamento.valorTotal || fechamento.valorEstoque) : 0;
}

function baluV7CmvReal(competencia) {
  var comp = competencia || baluV7CompetenciaAtual();
  var estoqueInicial = baluV7TotalEstoqueInicial(comp);
  var compras = baluV7TotalComprasEstoque(comp);
  var estoqueFinal = baluV7TotalEstoqueFinal(comp);
  return Math.max(0, estoqueInicial + compras - estoqueFinal);
}

function baluV7VendaMes(competencia) {
  var comp = competencia || baluV7CompetenciaAtual();
  return baluV7Lista("balu_vendas_mensais").find(function (item) { return item.competencia === comp; }) || null;
}

function baluV7CmvTeorico(competencia) {
  var venda = baluV7VendaMes(competencia);
  return safeNumber(venda && venda.cmvTeoricoTotal);
}

function baluV7CustosOperacionais(competencia) {
  var comp = competencia || baluV7CompetenciaAtual();
  var fechamento = baluV7Lista("balu_custos_operacionais_fechamentos").find(function (item) { return item.competencia === comp; });
  if (fechamento) return safeNumber(fechamento.total || fechamento.totalGeral || fechamento.custoTotal);
  return baluV7Lista("balu_custos_operacionais").filter(function (item) {
    var c = item.competencia || item.mesReferencia || String(item.data || "").slice(0, 7);
    return c === comp;
  }).reduce(function (soma, item) { return soma + safeNumber(item.valor || item.total || item.custo); }, 0);
}

function baluV7MaoDeObraTotal() {
  return baluV7Lista("balu_funcionarios").filter(function (item) {
    return String(item.status || "Ativo").toLowerCase() !== "inativo";
  }).reduce(function (soma, item) {
    return soma + safeNumber(item.custoTotal || item.custoMensal || item.salarioTotal || item.salario || item.valor || item.proLabore || item.valorMensal);
  }, 0);
}

function baluV7ResumoExecutivo(competencia) {
  var comp = competencia || baluV7CompetenciaAtual();
  var faturamento = typeof baluGetFaturamentoDaCompetencia === "function" ? baluGetFaturamentoDaCompetencia(comp) : 0;
  var faturamentoMedio = typeof baluGetFaturamentoMedioMensal === "function" ? baluGetFaturamentoMedioMensal() : faturamento;
  var compras = baluV7TotalComprasEstoque(comp);
  var estoqueInicial = baluV7TotalEstoqueInicial(comp);
  var estoqueFinal = baluV7TotalEstoqueFinal(comp);
  var cmvReal = baluV7CmvReal(comp);
  var cmvTeorico = baluV7CmvTeorico(comp);
  var perdas = cmvReal - cmvTeorico;
  var custosOperacionais = baluV7CustosOperacionais(comp);
  var maoDeObra = baluV7MaoDeObraTotal();
  var lucroBruto = faturamento - cmvReal;
  var lucroEstimado = faturamento - cmvReal - custosOperacionais - maoDeObra;
  return {
    competencia: comp,
    faturamento: faturamento,
    faturamentoMedio: faturamentoMedio,
    comprasEstoque: compras,
    estoqueInicial: estoqueInicial,
    estoqueFinal: estoqueFinal,
    cmvReal: cmvReal,
    cmvRealPercentual: faturamento > 0 ? cmvReal / faturamento * 100 : 0,
    cmvTeorico: cmvTeorico,
    diferencaPerdas: perdas,
    percentualPerdas: cmvReal > 0 ? perdas / cmvReal * 100 : 0,
    custosOperacionais: custosOperacionais,
    custosOperacionaisPercentual: faturamentoMedio > 0 ? custosOperacionais / faturamentoMedio * 100 : 0,
    maoDeObra: maoDeObra,
    maoDeObraPercentual: faturamentoMedio > 0 ? maoDeObra / faturamentoMedio * 100 : 0,
    lucroBruto: lucroBruto,
    margemBruta: faturamento > 0 ? lucroBruto / faturamento * 100 : 0,
    lucroEstimado: lucroEstimado
  };
}

function baluV7CalcularPrecoCanal(opcoes) {
  opcoes = opcoes || {};
  var custoReceita = safeNumber(opcoes.custoReceita);
  var custoEmbalagem = safeNumber(opcoes.custoEmbalagem);
  var base = custoReceita + custoEmbalagem;
  var percentuais = safeNumber(opcoes.maoObraPct) + safeNumber(opcoes.custosOperacionaisPct) + safeNumber(opcoes.taxaPct) + safeNumber(opcoes.impostoPct) + safeNumber(opcoes.margemPct);
  var divisor = 1 - (percentuais / 100);
  if (divisor <= 0) return 0;
  return base / divisor;
}

window.BALU_V7_RESUMO_EXECUTIVO = baluV7ResumoExecutivo;
window.BALU_V7_CMV_REAL = baluV7CmvReal;
window.BALU_V7_TOTAL_COMPRAS_ESTOQUE = baluV7TotalComprasEstoque;
window.BALU_V7_CALCULAR_PRECO_CANAL = baluV7CalcularPrecoCanal;
