// ==============================
// BALU FOOD - FORNECEDORES
// Estrutura visual com localStorage
// ==============================

var fornecedoresCache = [];
var BALU_FORNECEDORES_KEY = "balu_fornecedores";

document.addEventListener("DOMContentLoaded", function () {
fornecedoresCache = carregarFornecedores();
initFornecedores();
renderFornecedores();
});

function initFornecedores() {
var btnNovo = document.getElementById("btnNovoFornecedor");
var form = document.getElementById("formFornecedor");

if (btnNovo) {
btnNovo.addEventListener("click", function () {
prepararFornecedor();
});
}

if (form) {
form.addEventListener("submit", function (event) {
event.preventDefault();
salvarFornecedor();
});
}
}

function prepararFornecedor(item) {
setValueFornecedor("fornecedorId", item ? item.id : "");
setValueFornecedor("fornecedorNome", item ? item.nome : "");
setValueFornecedor("fornecedorDocumento", item ? item.documento : "");
setValueFornecedor("fornecedorTelefone", item ? item.telefone : "");
setValueFornecedor("fornecedorEmail", item ? item.email : "");
setValueFornecedor("fornecedorCategoria", item ? item.categoria : "Insumos");
setValueFornecedor("fornecedorStatus", item ? item.status : "Ativo");
setTextFornecedor("drawerFornecedorTitle", item ? "Editar Fornecedor" : "Novo Fornecedor");
openDrawer("drawerFornecedor");
}

function salvarFornecedor() {
var id = getValueFornecedor("fornecedorId");
var nome = getValueFornecedor("fornecedorNome");

if (!nome) {
showToast("Informe o nome do fornecedor.", "warning");
return;
}

var fornecedor = {
id: id || gerarIdFornecedor(),
nome: nome,
documento: getValueFornecedor("fornecedorDocumento"),
telefone: getValueFornecedor("fornecedorTelefone"),
email: getValueFornecedor("fornecedorEmail"),
categoria: getValueFornecedor("fornecedorCategoria"),
status: getValueFornecedor("fornecedorStatus"),
atualizadoEm: new Date().toISOString()
};

if (id) {
fornecedoresCache = fornecedoresCache.map(function (item) {
return item.id === id ? fornecedor : item;
});
} else {
fornecedoresCache.push(fornecedor);
}

salvarFornecedores();
closeDrawer();
renderFornecedores();
showToast("Fornecedor salvo com sucesso.", "success");
}

function editarFornecedor(id) {
var item = fornecedoresCache.find(function (fornecedor) {
return fornecedor.id === id;
});

if (item) {
prepararFornecedor(item);
}
}

function excluirFornecedor(id) {
if (!confirmAction("Deseja excluir este fornecedor?")) {
return;
}

fornecedoresCache = fornecedoresCache.filter(function (item) {
return item.id !== id;
});

salvarFornecedores();
renderFornecedores();
}

function renderFornecedores() {
var table = document.getElementById("fornecedoresTable");

setTextFornecedor("fornecedoresTotal", fornecedoresCache.length);
setTextFornecedor("fornecedoresAtivos", fornecedoresCache.filter(function (item) { return item.status === "Ativo"; }).length);
setTextFornecedor("fornecedoresCompras", "0");
setTextFornecedor("fornecedoresUltimo", fornecedoresCache.length ? fornecedoresCache[fornecedoresCache.length - 1].nome : "Nenhum");

if (!table) {
return;
}

if (!fornecedoresCache.length) {
table.innerHTML = "<tr><td colspan='7' class='text-muted'>Nenhum fornecedor cadastrado ainda.</td></tr>";
return;
}

table.innerHTML = fornecedoresCache.map(function (item) {
return "<tr>" +
"<td><strong>" + escapeHtmlFornecedor(item.nome) + "</strong></td>" +
"<td>" + escapeHtmlFornecedor(item.documento || "-") + "</td>" +
"<td>" + escapeHtmlFornecedor(item.telefone || "-") + "</td>" +
"<td>" + escapeHtmlFornecedor(item.email || "-") + "</td>" +
"<td>" + escapeHtmlFornecedor(item.categoria || "-") + "</td>" +
"<td>" + getStatusBadge(item.status || "Ativo") + "</td>" +
"<td><div class='table-actions'>" +
"<button type='button' class='btn-icon' onclick='editarFornecedor(\"" + escapeAttrFornecedor(item.id) + "\")'><i data-lucide='edit-3'></i></button>" +
"<button type='button' class='btn-icon danger' onclick='excluirFornecedor(\"" + escapeAttrFornecedor(item.id) + "\")'><i data-lucide='trash-2'></i></button>" +
"</div></td>" +
"</tr>";
}).join("");

if (typeof baluRefreshIcons === "function") {
baluRefreshIcons();
} else if (window.lucide) {
lucide.createIcons();
}
}

function carregarFornecedores() {
return carregarListaFornecedor(BALU_FORNECEDORES_KEY);
}

function salvarFornecedores() {
localStorage.setItem(BALU_FORNECEDORES_KEY, JSON.stringify(fornecedoresCache));
}

function carregarListaFornecedor(chave) {
try {
var dados = localStorage.getItem(chave);
var lista = dados ? JSON.parse(dados) : [];
return Array.isArray(lista) ? lista : [];
} catch (erro) {
return [];
}
}

function getValueFornecedor(id) {
var element = document.getElementById(id);
return element ? element.value || "" : "";
}

function setValueFornecedor(id, value) {
var element = document.getElementById(id);
if (element) element.value = value || "";
}

function setTextFornecedor(id, value) {
var element = document.getElementById(id);
if (element) element.textContent = value || "";
}

function escapeHtmlFornecedor(value) {
return String(value === null || value === undefined ? "" : value)
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#039;");
}

function escapeAttrFornecedor(value) {
return escapeHtmlFornecedor(value);
}

function gerarIdFornecedor() {
return "FOR-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

window.editarFornecedor = editarFornecedor;
window.excluirFornecedor = excluirFornecedor;
