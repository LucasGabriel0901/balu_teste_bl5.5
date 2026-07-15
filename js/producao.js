// ==============================
// BALU FOOD - PRODUÇÃO PLANEJADA
// Planejamento sem baixa de estoque
// ==============================

var producaoCache = [];
var BALU_PRODUCAO_KEY = "balu_producao_planejada";

document.addEventListener("DOMContentLoaded", function () {
producaoCache = carregarProducao();
initProducao();
renderProducao();
});

function initProducao() {
var btnNovo = document.getElementById("btnNovaProducao");
var form = document.getElementById("formProducao");

if (btnNovo) {
btnNovo.addEventListener("click", function () {
prepararProducao();
});
}

if (form) {
form.addEventListener("submit", function (event) {
event.preventDefault();
salvarProducao();
});
}
}

function prepararProducao(item) {
setValueProducao("producaoId", item ? item.id : "");
setValueProducao("producaoData", item ? item.data : dataAtualProducao());
setValueProducao("producaoProduto", item ? item.produto : "");
setValueProducao("producaoQuantidade", item ? item.quantidade : "");
setValueProducao("producaoStatus", item ? item.status : "Planejada");
setValueProducao("producaoObservacoes", item ? item.observacoes : "");
setTextProducao("drawerProducaoTitle", item ? "Editar Produção" : "Nova Produção");
openDrawer("drawerProducao");
}

function salvarProducao() {
var id = getValueProducao("producaoId");
var produto = getValueProducao("producaoProduto");

if (!produto) {
showToast("Informe o produto planejado.", "warning");
return;
}

var item = {
id: id || gerarIdProducao(),
data: getValueProducao("producaoData") || dataAtualProducao(),
produto: produto,
quantidade: numeroProducao(getValueProducao("producaoQuantidade")),
status: getValueProducao("producaoStatus"),
observacoes: getValueProducao("producaoObservacoes"),
atualizadoEm: new Date().toISOString()
};

if (id) {
producaoCache = producaoCache.map(function (registro) {
return registro.id === id ? item : registro;
});
} else {
producaoCache.push(item);
}

salvarProducaoLocal();
closeDrawer();
renderProducao();
showToast("Produção salva com sucesso.", "success");
}

function editarProducao(id) {
var item = producaoCache.find(function (registro) {
return registro.id === id;
});

if (item) prepararProducao(item);
}

function excluirProducao(id) {
if (!confirmAction("Deseja excluir esta produção planejada?")) return;

producaoCache = producaoCache.filter(function (item) {
return item.id !== id;
});

salvarProducaoLocal();
renderProducao();
}

function renderProducao() {
var table = document.getElementById("producaoTable");
var planejadas = producaoCache.filter(function (item) { return item.status === "Planejada"; }).length;
var concluidas = producaoCache.filter(function (item) { return item.status === "Concluída"; }).length;
var emPreparo = producaoCache.filter(function (item) { return item.status === "Em produção"; }).length;
var proxima = producaoCache.filter(function (item) { return item.status !== "Cancelada"; }).sort(function (a, b) {
return String(a.data || "").localeCompare(String(b.data || ""));
})[0];

setTextProducao("prodPlanejadas", planejadas);
setTextProducao("prodConcluidas", concluidas);
setTextProducao("prodEmPreparo", emPreparo);
setTextProducao("prodProxima", proxima ? formatarDataProducao(proxima.data) : "Nenhuma");

if (!table) return;

if (!producaoCache.length) {
table.innerHTML = "<tr><td colspan='6' class='text-muted'>Nenhuma produção planejada ainda.</td></tr>";
return;
}

table.innerHTML = producaoCache.map(function (item) {
return "<tr>" +
"<td>" + formatarDataProducao(item.data) + "</td>" +
"<td><strong>" + escapeHtmlProducao(item.produto || "-") + "</strong></td>" +
"<td>" + numeroProducao(item.quantidade).toLocaleString("pt-BR") + "</td>" +
"<td>" + getStatusBadge(item.status || "Planejada") + "</td>" +
"<td>" + escapeHtmlProducao(item.observacoes || "-") + "</td>" +
"<td><div class='table-actions'>" +
"<button type='button' class='btn-icon' onclick='editarProducao(\"" + escapeAttrProducao(item.id) + "\")'><i data-lucide='edit-3'></i></button>" +
"<button type='button' class='btn-icon danger' onclick='excluirProducao(\"" + escapeAttrProducao(item.id) + "\")'><i data-lucide='trash-2'></i></button>" +
"</div></td>" +
"</tr>";
}).join("");

if (typeof baluRefreshIcons === "function") baluRefreshIcons();
}

function carregarProducao() {
try {
var dados = localStorage.getItem(BALU_PRODUCAO_KEY);
var lista = dados ? JSON.parse(dados) : [];
return Array.isArray(lista) ? lista : [];
} catch (erro) {
return [];
}
}

function salvarProducaoLocal() {
localStorage.setItem(BALU_PRODUCAO_KEY, JSON.stringify(producaoCache));
}

function getValueProducao(id) {
var element = document.getElementById(id);
return element ? element.value || "" : "";
}

function setValueProducao(id, value) {
var element = document.getElementById(id);
if (element) element.value = value || "";
}

function setTextProducao(id, value) {
var element = document.getElementById(id);
if (element) element.textContent = value || "";
}

function numeroProducao(value) {
return typeof safeNumber === "function" ? safeNumber(value) : Number(value || 0) || 0;
}

function formatarDataProducao(data) {
return typeof formatDateBR === "function" ? formatDateBR(data) : data || "-";
}

function dataAtualProducao() {
var hoje = new Date();
return hoje.getFullYear() + "-" + String(hoje.getMonth() + 1).padStart(2, "0") + "-" + String(hoje.getDate()).padStart(2, "0");
}

function escapeHtmlProducao(value) {
return String(value === null || value === undefined ? "" : value)
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#039;");
}

function escapeAttrProducao(value) {
return escapeHtmlProducao(value);
}

function gerarIdProducao() {
return "PROD-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

window.editarProducao = editarProducao;
window.excluirProducao = excluirProducao;
