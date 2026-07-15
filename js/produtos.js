// ==============================
// BALU FOOD - PRODUTOS / CARDÁPIO
// Catálogo simples com vínculo de ficha técnica
// ==============================

var produtosCache = [];
var fichasProdutosCache = [];
var BALU_PRODUTOS_KEY = "balu_produtos";

document.addEventListener("DOMContentLoaded", function () {
produtosCache = carregarListaProdutos(BALU_PRODUTOS_KEY);
fichasProdutosCache = carregarListaProdutos("balu_fichas_tecnicas");
initProdutos();
renderProdutos();
});

function initProdutos() {
popularFichasProdutos();

var btnNovo = document.getElementById("btnNovoProduto");
var form = document.getElementById("formProduto");

if (btnNovo) {
btnNovo.addEventListener("click", function () {
prepararProduto();
});
}

if (form) {
form.addEventListener("submit", function (event) {
event.preventDefault();
salvarProduto();
});
}
}

function popularFichasProdutos() {
var select = document.getElementById("produtoFicha");
if (!select) return;

select.innerHTML = "<option value=''>Sem ficha vinculada</option>" + fichasProdutosCache.map(function (ficha) {
return "<option value='" + escapeAttrProduto(ficha.id || "") + "'>" + escapeHtmlProduto(ficha.nome || "Ficha sem nome") + "</option>";
}).join("");
}

function prepararProduto(item) {
popularFichasProdutos();
setValueProduto("produtoId", item ? item.id : "");
setValueProduto("produtoNome", item ? item.nome : "");
setValueProduto("produtoCategoria", item ? item.categoria : "");
setValueProduto("produtoFicha", item ? item.fichaId : "");
setValueProduto("produtoPreco", item ? item.preco : "");
setValueProduto("produtoStatus", item ? item.status : "Ativo");
setValueProduto("produtoObservacoes", item ? item.observacoes : "");
setTextProduto("drawerProdutoTitle", item ? "Editar Produto" : "Novo Produto");
openDrawer("drawerProduto");
}

function salvarProduto() {
var id = getValueProduto("produtoId");
var nome = getValueProduto("produtoNome");

if (!nome) {
showToast("Informe o nome do produto.", "warning");
return;
}

var fichaId = getValueProduto("produtoFicha");
var ficha = obterFichaProduto(fichaId);
var item = {
id: id || gerarIdProduto(),
nome: nome,
categoria: getValueProduto("produtoCategoria"),
fichaId: fichaId,
fichaNome: ficha ? ficha.nome : "",
preco: numeroProduto(getValueProduto("produtoPreco")),
status: getValueProduto("produtoStatus"),
observacoes: getValueProduto("produtoObservacoes"),
atualizadoEm: new Date().toISOString()
};

if (id) {
produtosCache = produtosCache.map(function (produto) {
return produto.id === id ? item : produto;
});
} else {
produtosCache.push(item);
}

localStorage.setItem(BALU_PRODUTOS_KEY, JSON.stringify(produtosCache));
closeDrawer();
renderProdutos();
showToast("Produto salvo com sucesso.", "success");
}

function editarProduto(id) {
var item = produtosCache.find(function (produto) {
return produto.id === id;
});

if (item) prepararProduto(item);
}

function excluirProduto(id) {
if (!confirmAction("Deseja excluir este produto?")) return;

produtosCache = produtosCache.filter(function (item) {
return item.id !== id;
});
localStorage.setItem(BALU_PRODUTOS_KEY, JSON.stringify(produtosCache));
renderProdutos();
}

function renderProdutos() {
var table = document.getElementById("produtosTable");
var ativos = produtosCache.filter(function (item) { return item.status === "Ativo"; }).length;
var semFicha = produtosCache.filter(function (item) { return !item.fichaId; }).length;
var precoMedio = produtosCache.length ? produtosCache.reduce(function (total, item) {
return total + numeroProduto(item.preco);
}, 0) / produtosCache.length : 0;

setTextProduto("produtosTotal", produtosCache.length);
setTextProduto("produtosAtivos", ativos);
setTextProduto("produtosSemFicha", semFicha);
setTextProduto("produtosPrecoMedio", moedaProduto(precoMedio));

if (!table) return;

if (!produtosCache.length) {
table.innerHTML = "<tr><td colspan='6' class='text-muted'>Nenhum produto cadastrado ainda.</td></tr>";
return;
}

table.innerHTML = produtosCache.map(function (item) {
return "<tr>" +
"<td><strong>" + escapeHtmlProduto(item.nome || "-") + "</strong></td>" +
"<td>" + escapeHtmlProduto(item.categoria || "-") + "</td>" +
"<td>" + escapeHtmlProduto(item.fichaNome || "Sem ficha") + "</td>" +
"<td><strong>" + moedaProduto(item.preco) + "</strong></td>" +
"<td>" + getStatusBadge(item.status || "Ativo") + "</td>" +
"<td><div class='table-actions'>" +
"<button type='button' class='btn-icon' onclick='editarProduto(\"" + escapeAttrProduto(item.id) + "\")'><i data-lucide='edit-3'></i></button>" +
"<button type='button' class='btn-icon danger' onclick='excluirProduto(\"" + escapeAttrProduto(item.id) + "\")'><i data-lucide='trash-2'></i></button>" +
"</div></td>" +
"</tr>";
}).join("");

if (typeof baluRefreshIcons === "function") baluRefreshIcons();
}

function obterFichaProduto(id) {
return fichasProdutosCache.find(function (ficha) {
return String(ficha.id || "") === String(id || "");
});
}

function carregarListaProdutos(chave) {
try {
var dados = localStorage.getItem(chave);
var lista = dados ? JSON.parse(dados) : [];
return Array.isArray(lista) ? lista : [];
} catch (erro) {
return [];
}
}

function getValueProduto(id) {
var element = document.getElementById(id);
return element ? element.value || "" : "";
}

function setValueProduto(id, value) {
var element = document.getElementById(id);
if (element) element.value = value || "";
}

function setTextProduto(id, value) {
var element = document.getElementById(id);
if (element) element.textContent = value || "";
}

function numeroProduto(value) {
return typeof safeNumber === "function" ? safeNumber(value) : Number(value || 0) || 0;
}

function moedaProduto(value) {
return numeroProduto(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function escapeHtmlProduto(value) {
return String(value === null || value === undefined ? "" : value)
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#039;");
}

function escapeAttrProduto(value) {
return escapeHtmlProduto(value);
}

function gerarIdProduto() {
return "PRD-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

window.editarProduto = editarProduto;
window.excluirProduto = excluirProduto;
