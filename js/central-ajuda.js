// ==============================
// BALU FOOD - CENTRAL DE AJUDA
// Conteudo visual de orientacao e feedback local
// ==============================

var BALU_FEEDBACK_KEY = "balu_feedbacks";
var BALU_FEEDBACK_LEGACY_KEY = "balu_feedback_ajuda";

document.addEventListener("DOMContentLoaded", function () {
initCentralAjuda();
});

function initCentralAjuda() {
initCardsAjuda();
initFeedbackAjuda();

if (typeof window.BALU_RENDER_ICONS === "function") {
window.BALU_RENDER_ICONS();
} else if (window.lucide) {
lucide.createIcons();
}
}

function initCardsAjuda() {
document.querySelectorAll("[data-help-card]").forEach(function (card) {
var button = card.querySelector("button");
var text = card.querySelector("p");

if (!button || !text) {
return;
}

button.addEventListener("click", function () {
var aberto = card.classList.toggle("is-open");
text.style.display = aberto ? "block" : "none";
button.textContent = aberto ? "Ocultar" : "Ver";
});

text.style.display = "block";
});
}

function initFeedbackAjuda() {
var form = document.getElementById("formFeedbackAjuda");

renderFeedbackAjuda();

if (!form) {
return;
}

form.addEventListener("submit", function (event) {
event.preventDefault();

var mensagem = getValueAjuda("feedbackMensagem");

if (!mensagem) {
if (typeof showToast === "function") {
showToast("Informe o feedback antes de registrar.", "warning");
}
return;
}

var lista = carregarFeedbackAjuda();

lista.unshift({
id: "FDB-" + Date.now(),
nome: getValueAjuda("feedbackNome") || "Visitante",
empresa: getValueAjuda("feedbackEmpresa") || "Não informado",
tipo: getValueAjuda("feedbackTipo") || "Sugestão",
modulo: getValueAjuda("feedbackModulo") || "Geral",
prioridade: getValueAjuda("feedbackPrioridade") || "Média",
mensagem: mensagem,
status: "Aberto",
criadoEm: new Date().toISOString()
});

localStorage.setItem(BALU_FEEDBACK_KEY, JSON.stringify(lista.slice(0, 50)));
form.reset();
renderFeedbackAjuda();

if (typeof showToast === "function") {
showToast("Feedback registrado.", "success");
}
});
}

function renderFeedbackAjuda() {
var container = document.getElementById("feedbackAjudaLista");

if (!container) {
return;
}

var lista = carregarFeedbackAjuda();

if (!lista.length) {
container.innerHTML =
"<div class='empty-state-alert'>" +
"<strong>Nenhum feedback enviado ainda.</strong>" +
"<p class='text-muted'>Os registros salvos neste navegador aparecerão aqui.</p>" +
"</div>";
return;
}

container.innerHTML = lista.map(function (item) {
return "<article class='feedback-item'>" +
"<div class='feedback-item-header'>" +
"<div>" +
"<strong>" + escapeHtmlAjuda(item.tipo || "Sugestão") + " • " + escapeHtmlAjuda(item.modulo || "Geral") + "</strong>" +
"<span>" + escapeHtmlAjuda(item.nome || "Visitante") + " - " + escapeHtmlAjuda(item.empresa || "Não informado") + " - " + formatarDataAjuda(item.criadoEm) + "</span>" +
"</div>" +
"<div class='feedback-item-actions'>" +
"<span class='badge neutral'>" + escapeHtmlAjuda(item.prioridade || "Média") + "</span>" +
"<span class='badge green'>" + escapeHtmlAjuda(item.status || "Aberto") + "</span>" +
"<button type='button' class='btn-icon danger' title='Excluir' onclick='excluirFeedbackAjuda(\"" + escapeAttrAjuda(item.id) + "\")'><i data-lucide='trash-2'></i></button>" +
"</div>" +
"</div>" +
"<p>" + escapeHtmlAjuda(item.mensagem || "") + "</p>" +
"</article>";
}).join("");

if (typeof window.BALU_RENDER_ICONS === "function") {
window.BALU_RENDER_ICONS();
}
}

function carregarFeedbackAjuda() {
try {
var texto = localStorage.getItem(BALU_FEEDBACK_KEY);
var lista = texto ? JSON.parse(texto) : [];

if (!Array.isArray(lista) || !lista.length) {
var legado = localStorage.getItem(BALU_FEEDBACK_LEGACY_KEY);
lista = legado ? JSON.parse(legado) : [];
}

return Array.isArray(lista) ? lista : [];
} catch (erro) {
return [];
}
}

function excluirFeedbackAjuda(id) {
var lista = carregarFeedbackAjuda().filter(function (item) {
return item.id !== id;
});

localStorage.setItem(BALU_FEEDBACK_KEY, JSON.stringify(lista));
renderFeedbackAjuda();
}

function getValueAjuda(id) {
var element = document.getElementById(id);
return element ? String(element.value || "").trim() : "";
}

function formatarDataAjuda(valor) {
if (!valor) {
return "agora";
}

var data = new Date(valor);

if (isNaN(data.getTime())) {
return "agora";
}

return data.toLocaleDateString("pt-BR");
}

function escapeHtmlAjuda(value) {
return String(value === null || value === undefined ? "" : value)
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#039;");
}

function escapeAttrAjuda(value) {
return escapeHtmlAjuda(value).replace(/`/g, "&#096;");
}

window.excluirFeedbackAjuda = excluirFeedbackAjuda;
