// ==============================
// BALU FOOD - VENDAS / PRODUÇÃO
// Registro manual com baixa de estoque por ficha técnica
// ==============================

var vendasProducaoCache = [];
var vendasFichasCache = [];
var vendasInsumosCache = [];
var vendasEmbalagensCache = [];

var BALU_VENDAS_PRODUCAO_KEY =
typeof BALU_KEYS !== "undefined" && BALU_KEYS.vendasProducao
? BALU_KEYS.vendasProducao
: "balu_vendas_producao";

var BALU_VENDAS_MANUAIS_KEY = "balu_vendas_manuais";

var BALU_VENDAS_FICHAS_KEY =
typeof BALU_KEYS !== "undefined" && BALU_KEYS.fichasTecnicas
? BALU_KEYS.fichasTecnicas
: "balu_fichas_tecnicas";

var BALU_VENDAS_INSUMOS_KEY =
typeof BALU_KEYS !== "undefined" && BALU_KEYS.insumos
? BALU_KEYS.insumos
: "balu_insumos";

var BALU_VENDAS_EMBALAGENS_KEY =
typeof BALU_KEYS !== "undefined" && BALU_KEYS.embalagens
? BALU_KEYS.embalagens
: "balu_embalagens";

document.addEventListener("DOMContentLoaded", function () {
initVendasProducao();
});

function initVendasProducao() {
vendasProducaoCache = carregarVendasProducaoLocal();
recarregarBasesVendaProducao();

popularSelectFichasVendaProducao();
initEventosVendasProducao();
prepararNovaVendaProducao(false);
renderVendasProducao();
criarIconesVendaProducao();
}

function initEventosVendasProducao() {
var form = document.getElementById("formVendaProducao");
var btnNovo = document.getElementById("btnNovaVendaProducao");
var btnExportar = document.getElementById("btnExportarVendasProducao");
var search = document.getElementById("searchVendasProducao");
var filtroCanal = document.getElementById("filterCanalVendaProducao");
var filtroStatus = document.getElementById("filterStatusVendaProducao");

if (btnNovo) {
btnNovo.addEventListener("click", function () {
prepararNovaVendaProducao(true);
});
}

if (btnExportar) {
btnExportar.addEventListener("click", exportarVendasProducao);
}

if (form) {
form.addEventListener("submit", function (event) {
event.preventDefault();
salvarVendaProducao();
});
}

["vendaFicha", "vendaQuantidade", "vendaStatus", "vendaData", "vendaCanal"].forEach(function (id) {
var campo = document.getElementById(id);

if (campo) {
campo.addEventListener("input", atualizarPreviewVendaProducao);
campo.addEventListener("change", atualizarPreviewVendaProducao);
}
});

if (search) {
search.addEventListener("input", renderVendasProducao);
}

if (filtroCanal) {
filtroCanal.addEventListener("change", renderVendasProducao);
}

if (filtroStatus) {
filtroStatus.addEventListener("change", renderVendasProducao);
}
}

function recarregarBasesVendaProducao() {
vendasFichasCache = carregarListaVendaProducao("fichasTecnicas", BALU_VENDAS_FICHAS_KEY, ["balu_fichas_tecnicas_v2"]);
vendasInsumosCache = carregarListaVendaProducao("insumos", BALU_VENDAS_INSUMOS_KEY, []);
vendasEmbalagensCache = carregarListaVendaProducao("embalagens", BALU_VENDAS_EMBALAGENS_KEY, []);
}

function prepararNovaVendaProducao(abrir) {
recarregarBasesVendaProducao();
popularSelectFichasVendaProducao();
resetarFormularioVendaProducao();

setValueVendaProducao("vendaData", dataAtualVendaProducao());
setValueVendaProducao("vendaQuantidade", "1");
setValueVendaProducao("vendaCanal", "Balcão");
setValueVendaProducao("vendaStatus", "Confirmada");

var title = document.getElementById("drawerVendaProducaoTitle");

if (title) {
title.textContent = "Nova Venda/Produção";
}

atualizarPreviewVendaProducao();

if (abrir && typeof openDrawer === "function") {
openDrawer("drawerVendaProducao");
}
}

function resetarFormularioVendaProducao() {
var form = document.getElementById("formVendaProducao");

if (form) {
form.reset();
}

setValueVendaProducao("vendaProducaoId", "");
}

function popularSelectFichasVendaProducao(selectedId) {
var select = document.getElementById("vendaFicha");

if (!select) {
return;
}

var fichasAtivas = vendasFichasCache.filter(function (ficha) {
return String(ficha.status || "Ativa").toLowerCase() !== "inativa";
});

var html = "<option value=''>Selecione uma ficha técnica</option>";

fichasAtivas.forEach(function (ficha) {
var label = (ficha.nome || "Produto sem nome") + " | " + (ficha.categoria || ficha.tipo || "Ficha técnica");

html += "<option value='" + escapeAttrVendaProducao(ficha.id || "") + "'>" +
escapeHtmlVendaProducao(label) +
"</option>";
});

select.innerHTML = html;

if (selectedId) {
select.value = selectedId;
}
}

function salvarVendaProducao() {
recarregarBasesVendaProducao();

var id = getValueVendaProducao("vendaProducaoId");
var registroExistente = id ? buscarVendaProducaoPorId(id) : null;
var data = getValueVendaProducao("vendaData");
var fichaId = getValueVendaProducao("vendaFicha");
var quantidade = numeroVendaProducao(getValueVendaProducao("vendaQuantidade"));
var ficha = buscarFichaVendaProducao(fichaId);

if (!data) {
mensagemVendaProducao("Informe a data da venda ou produção.", "warning");
return;
}

if (!ficha) {
mensagemVendaProducao("Selecione uma ficha técnica cadastrada.", "warning");
return;
}

if (quantidade <= 0) {
mensagemVendaProducao("Informe uma quantidade maior que zero.", "warning");
return;
}

var resultado = calcularVendaProducao();

if (!resultado.ficha) {
mensagemVendaProducao("Não foi possível calcular a ficha selecionada.", "warning");
return;
}

var agora = new Date().toISOString();
var status = getValueVendaProducao("vendaStatus") || "Confirmada";

var registro = {
id: id || gerarIdVendaProducao(),
data: data,
competencia: String(data).substring(0, 7),
fichaId: ficha.id || "",
fichaNome: ficha.nome || "",
produto: ficha.nome || "",
quantidade: quantidade,
canal: getValueVendaProducao("vendaCanal") || "Outro",
status: status,
observacoes: getValueVendaProducao("vendaObservacoes"),
rendimentoFicha: numeroVendaProducao(ficha.rendimento || ficha.rendimentoInformado),
unidadeRendimento: ficha.unidadeRendimento || "unidades",
custoUnitario: obterCustoUnitarioFichaVenda(ficha),
custoEstimado: resultado.custoEstimado,
custoEstoqueBaixado: resultado.custoEstoqueBaixado,
itensBaixa: resultado.itensBaixa,
estoqueSincronizado: false,
movimentacoesEstoque: [],
criadoEm: registroExistente ? registroExistente.criadoEm : agora,
atualizadoEm: agora
};

sincronizarEstoqueVendaProducao(registroExistente, registro);

if (id) {
vendasProducaoCache = vendasProducaoCache.map(function (item) {
return item.id === id ? registro : item;
});
mensagemVendaProducao("Registro atualizado com sucesso.", "success");
} else {
vendasProducaoCache.push(registro);
mensagemVendaProducao("Registro salvo com sucesso.", "success");
}

salvarVendasProducaoLocal();

if (typeof closeDrawer === "function") {
closeDrawer();
}

resetarFormularioVendaProducao();
renderVendasProducao();
}

function editarVendaProducao(id) {
var registro = buscarVendaProducaoPorId(id);

if (!registro) {
mensagemVendaProducao("Registro não encontrado.", "danger");
return;
}

recarregarBasesVendaProducao();
popularSelectFichasVendaProducao(registro.fichaId);
resetarFormularioVendaProducao();

setValueVendaProducao("vendaProducaoId", registro.id);
setValueVendaProducao("vendaFicha", registro.fichaId);
setValueVendaProducao("vendaData", registro.data);
setValueVendaProducao("vendaQuantidade", registro.quantidade);
setValueVendaProducao("vendaCanal", registro.canal || "Outro");
setValueVendaProducao("vendaStatus", registro.status || "Pendente");
setValueVendaProducao("vendaObservacoes", registro.observacoes);

var title = document.getElementById("drawerVendaProducaoTitle");

if (title) {
title.textContent = "Editar Venda/Produção";
}

atualizarPreviewVendaProducao();

if (typeof openDrawer === "function") {
openDrawer("drawerVendaProducao");
}
}

function excluirVendaProducao(id) {
var registro = buscarVendaProducaoPorId(id);

if (!registro) {
return;
}

var confirmar = typeof confirmAction === "function"
? confirmAction("Deseja excluir este registro?")
: confirm("Deseja excluir este registro?");

if (!confirmar) {
return;
}

reverterMovimentoEstoqueVendaProducao(registro);

vendasProducaoCache = vendasProducaoCache.filter(function (item) {
return item.id !== id;
});

salvarVendasProducaoLocal();
renderVendasProducao();
mensagemVendaProducao("Registro excluído com sucesso.", "success");
}

function calcularVendaProducao() {
var ficha = buscarFichaVendaProducao(getValueVendaProducao("vendaFicha"));
var quantidadeVenda = numeroVendaProducao(getValueVendaProducao("vendaQuantidade"));
var itensBaixa = [];
var custoEstoqueBaixado = 0;

if (!ficha || quantidadeVenda <= 0) {
return {
  ficha: ficha,
  quantidade: quantidadeVenda,
  custoEstimado: 0,
  custoEstoqueBaixado: 0,
  itensBaixa: []
};
}

if (Array.isArray(ficha.itens)) {
ficha.itens.forEach(function (itemFicha) {
  if (!itemFicha || !deveBaixarEstoqueVenda(itemFicha.tipo)) {
    return;
  }

  var movimento = montarMovimentoFichaVenda(itemFicha, quantidadeVenda);

  itensBaixa.push(movimento);
  custoEstoqueBaixado += numeroVendaProducao(movimento.custoEstimado);
});
}

return {
ficha: ficha,
quantidade: quantidadeVenda,
custoEstimado: obterCustoUnitarioFichaVenda(ficha) * quantidadeVenda,
custoEstoqueBaixado: custoEstoqueBaixado,
itensBaixa: itensBaixa
};
}

function montarMovimentoFichaVenda(itemFicha, quantidadeVenda) {
var tipo = itemFicha.tipo || "Insumo";
var cadastro = buscarCadastroEstoqueVenda(tipo, itemFicha);
var unidadeFicha = itemFicha.unidade || "unidade";
var unidadeEstoque = cadastro ? obterUnidadeEstoqueVenda(tipo, cadastro) : unidadeFicha;
var quantidadeFicha = numeroVendaProducao(itemFicha.quantidade);
var quantidadeOriginal = quantidadeFicha * quantidadeVenda;
var quantidadeBaixa = converterQuantidadeVendaProducao(quantidadeOriginal, unidadeFicha, unidadeEstoque);
var estoqueAtual = cadastro ? numeroVendaProducao(cadastro.estoqueAtual) : 0;
var estoqueDepois = Math.max(0, estoqueAtual - quantidadeBaixa);
var custoEstimado = calcularCustoMovimentoVenda(tipo, itemFicha, cadastro, quantidadeOriginal, unidadeFicha, quantidadeVenda);

return {
tipo: tipo,
itemId: itemFicha.itemId || "",
codigo: itemFicha.codigo || (cadastro ? cadastro.codigo || "" : ""),
nome: itemFicha.nome || "",
quantidadeFicha: quantidadeFicha,
quantidadeOriginal: quantidadeOriginal,
unidadeFicha: unidadeFicha,
quantidadeBaixa: quantidadeBaixa,
unidadeEstoque: unidadeEstoque,
estoqueAtual: estoqueAtual,
estoqueDepois: estoqueDepois,
custoEstimado: custoEstimado,
encontrado: !!cadastro
};
}

function sincronizarEstoqueVendaProducao(registroAntigo, registroNovo) {
if (registroAntigo && registroAntigo.estoqueSincronizado === true) {
reverterMovimentoEstoqueVendaProducao(registroAntigo);
}

if (registroNovo && registroNovo.status === "Confirmada") {
var movimentacoes = aplicarMovimentoEstoqueVendaProducao(registroNovo);

registroNovo.movimentacoesEstoque = movimentacoes;
registroNovo.estoqueSincronizado = movimentacoes.length > 0;
} else if (registroNovo) {
registroNovo.movimentacoesEstoque = [];
registroNovo.estoqueSincronizado = false;
}
}

function aplicarMovimentoEstoqueVendaProducao(registro) {
var movimentacoes = [];

if (!registro || !Array.isArray(registro.itensBaixa)) {
return movimentacoes;
}

registro.itensBaixa.forEach(function (movimento) {
var aplicado = movimentarEstoqueVendaProducao(movimento, -1);

if (aplicado) {
  movimentacoes.push(aplicado);
}
});

recarregarBasesVendaProducao();

return movimentacoes;
}

function reverterMovimentoEstoqueVendaProducao(registro) {
if (!registro || registro.estoqueSincronizado !== true) {
return;
}

var movimentos = Array.isArray(registro.movimentacoesEstoque) && registro.movimentacoesEstoque.length
? registro.movimentacoesEstoque
: registro.itensBaixa;

if (!Array.isArray(movimentos)) {
return;
}

movimentos.forEach(function (movimento) {
movimentarEstoqueVendaProducao(movimento, 1);
});

recarregarBasesVendaProducao();
}

function movimentarEstoqueVendaProducao(movimento, direcao) {
if (!movimento || !deveBaixarEstoqueVenda(movimento.tipo)) {
return null;
}

var chave = movimento.tipo === "Insumo" ? BALU_VENDAS_INSUMOS_KEY : BALU_VENDAS_EMBALAGENS_KEY;
var lista = carregarListaStorageVendaProducao(chave);
var cadastro = buscarCadastroEstoqueVendaEmLista(lista, movimento);

if (!cadastro) {
console.warn("Item não encontrado para movimentação de estoque:", movimento.nome);
return null;
}

var estoqueAntes = numeroVendaProducao(cadastro.estoqueAtual);
var quantidadeBase = movimento.quantidadeBaixada !== undefined && movimento.quantidadeBaixada !== null
? movimento.quantidadeBaixada
: movimento.quantidadeBaixa;
var quantidadeSolicitada = numeroVendaProducao(quantidadeBase);
var quantidadeMovida = quantidadeSolicitada;

if (direcao < 0 && estoqueAntes - quantidadeSolicitada < 0) {
quantidadeMovida = estoqueAntes;
console.warn("Baixa maior que o estoque atual. O estoque foi zerado:", movimento.nome);
}

var estoqueDepois = direcao < 0
? Math.max(0, estoqueAntes - quantidadeMovida)
: estoqueAntes + quantidadeMovida;

cadastro.estoqueAtual = estoqueDepois;

if (movimento.tipo === "Insumo") {
recalcularInsumoVendaProducao(cadastro);
} else {
recalcularEmbalagemVendaProducao(cadastro);
}

cadastro.atualizadoEm = new Date().toISOString();
salvarListaStorageVendaProducao(chave, lista);

return {
tipo: movimento.tipo,
itemId: movimento.itemId || "",
codigo: movimento.codigo || cadastro.codigo || "",
nome: movimento.nome || cadastro.nome || "",
quantidadeSolicitada: quantidadeSolicitada,
quantidadeBaixada: quantidadeMovida,
unidadeEstoque: movimento.unidadeEstoque || obterUnidadeEstoqueVenda(movimento.tipo, cadastro),
estoqueAntes: estoqueAntes,
estoqueDepois: estoqueDepois,
custoEstimado: numeroVendaProducao(movimento.custoEstimado)
};
}

function recalcularInsumoVendaProducao(insumo) {
var estoqueAtual = numeroVendaProducao(insumo.estoqueAtual);
var estoqueMinimo = numeroVendaProducao(insumo.estoqueMinimo);
var estoqueIdeal = numeroVendaProducao(insumo.estoqueIdeal);
var unidade = normalizarUnidadeVendaProducao(insumo.unidadeConsumo || insumo.unidadeCompra || "");
var precoMedioKg = numeroVendaProducao(insumo.precoMedioKg);
var custoUnitario = numeroVendaProducao(insumo.custoUnitario || insumo.precoUnitario);
var precoMedio = numeroVendaProducao(insumo.precoMedio);

if (unidade === "g" && precoMedioKg > 0) {
insumo.valorEstoque = (estoqueAtual / 1000) * precoMedioKg;
} else if (unidade === "kg" && precoMedioKg > 0) {
insumo.valorEstoque = estoqueAtual * precoMedioKg;
} else if (unidade === "ml" && precoMedio > 0) {
insumo.valorEstoque = estoqueAtual * (custoUnitario || precoMedio);
} else {
insumo.valorEstoque = estoqueAtual * (custoUnitario || precoMedio || precoMedioKg);
}

insumo.statusEstoque = calcularStatusEstoqueVendaProducao(estoqueAtual, estoqueMinimo, estoqueIdeal, insumo.status || "Ativo");
}

function recalcularEmbalagemVendaProducao(embalagem) {
var estoqueAtual = numeroVendaProducao(embalagem.estoqueAtual);
var estoqueMinimo = numeroVendaProducao(embalagem.estoqueMinimo);
var estoqueIdeal = numeroVendaProducao(embalagem.estoqueIdeal);
var quantidadePacote = numeroVendaProducao(embalagem.quantidadePacote);
var precoUnitario = numeroVendaProducao(embalagem.precoUnitario);
var precoMedioPacote = numeroVendaProducao(embalagem.precoMedioPacote);

if (precoUnitario <= 0 && quantidadePacote > 0 && precoMedioPacote > 0) {
precoUnitario = precoMedioPacote / quantidadePacote;
embalagem.precoUnitario = precoUnitario;
}

embalagem.valorEstoque = estoqueAtual * precoUnitario;
embalagem.statusEstoque = calcularStatusEstoqueVendaProducao(estoqueAtual, estoqueMinimo, estoqueIdeal, embalagem.status || "Ativo");
}

function calcularStatusEstoqueVendaProducao(estoqueAtual, estoqueMinimo, estoqueIdeal, statusCadastro) {
if (statusCadastro === "Inativo") {
return "Inativo";
}

if (estoqueAtual <= 0 || (estoqueMinimo > 0 && estoqueAtual <= estoqueMinimo)) {
return "Critico";
}

if (estoqueIdeal > 0 && estoqueAtual < estoqueIdeal) {
return "Atencao";
}

return "Estoque ok";
}

function atualizarPreviewVendaProducao() {
var resultado = calcularVendaProducao();
var ficha = resultado.ficha;

if (!ficha) {
setTextVendaProducao("vendaFichaNomePreview", "Selecione");
setTextVendaProducao("vendaFichaCategoriaPreview", "Nenhuma ficha selecionada.");
setTextVendaProducao("vendaFichaRendimentoPreview", "0");
setTextVendaProducao("vendaFichaUnidadePreview", "Porções ou unidades.");
setTextVendaProducao("vendaFichaCustoPreview", formatarMoedaVendaProducao(0));
setTextVendaProducao("vendaFichaPrecoPreview", formatarMoedaVendaProducao(0));
renderPreviewBaixaVendaProducao([]);
return;
}

setTextVendaProducao("vendaFichaNomePreview", ficha.nome || "Produto");
setTextVendaProducao("vendaFichaCategoriaPreview", ficha.categoria || ficha.tipo || "Ficha técnica");
setTextVendaProducao("vendaFichaRendimentoPreview", formatarNumeroVendaProducao(ficha.rendimento || ficha.rendimentoInformado || 0, 2));
setTextVendaProducao("vendaFichaUnidadePreview", ficha.unidadeRendimento || "unidades");
setTextVendaProducao("vendaFichaCustoPreview", formatarMoedaVendaProducao(obterCustoUnitarioFichaVenda(ficha)));
setTextVendaProducao("vendaFichaPrecoPreview", formatarMoedaVendaProducao(ficha.precoVenda || ficha.precoSugeridoCmv || 0));

renderPreviewBaixaVendaProducao(resultado.itensBaixa);
}

function renderPreviewBaixaVendaProducao(itens) {
var table = document.getElementById("vendaPreviewTable");

if (!table) {
return;
}

if (!Array.isArray(itens) || itens.length === 0) {
table.innerHTML =
"<tr>" +
"<td colspan='6' class='text-muted'>Selecione uma ficha técnica para visualizar a baixa.</td>" +
"</tr>";
return;
}

table.innerHTML = itens.map(function (item) {
var nome = (item.tipo || "Item") + ": " + (item.nome || "-");
var status = item.encontrado ? "" : " <span class='text-muted'>(não encontrado no estoque)</span>";

return (
"<tr>" +
"<td><strong>" + escapeHtmlVendaProducao(nome) + "</strong>" + status + "</td>" +
"<td>" + escapeHtmlVendaProducao(item.codigo || "-") + "</td>" +
"<td>" + formatarNumeroVendaProducao(item.estoqueAtual, 2) + " " + escapeHtmlVendaProducao(item.unidadeEstoque || "") + "</td>" +
"<td>" + formatarNumeroVendaProducao(item.quantidadeBaixa, 2) + " " + escapeHtmlVendaProducao(item.unidadeEstoque || "") + "</td>" +
"<td>" + formatarNumeroVendaProducao(item.estoqueDepois, 2) + " " + escapeHtmlVendaProducao(item.unidadeEstoque || "") + "</td>" +
"<td><strong>" + formatarMoedaVendaProducao(item.custoEstimado) + "</strong></td>" +
"</tr>"
);
}).join("");
}

function renderVendasProducao() {
var table = document.getElementById("vendasProducaoTable");

if (!table) {
return;
}

var lista = filtrarVendasProducao();
renderResumoVendasProducao();

if (lista.length === 0) {
table.innerHTML =
"<tr>" +
"<td colspan='7' class='text-muted'>Nenhuma venda ou produção encontrada.</td>" +
"</tr>";
return;
}

table.innerHTML = lista.map(function (registro) {
return (
"<tr>" +
"<td>" + formatarDataVendaProducao(registro.data) + "</td>" +
"<td><strong>" + escapeHtmlVendaProducao(registro.fichaNome || registro.produto || "-") + "</strong></td>" +
"<td>" + formatarNumeroVendaProducao(registro.quantidade, 2) + "</td>" +
"<td>" + escapeHtmlVendaProducao(registro.canal || "-") + "</td>" +
"<td><strong>" + formatarMoedaVendaProducao(registro.custoEstimado) + "</strong></td>" +
"<td>" + badgeStatusVendaProducao(registro.status || "Pendente") + "</td>" +
"<td><div class='table-actions'>" +
"<button type='button' class='btn-icon' title='Editar' data-venda-producao-action='edit' data-venda-producao-id='" + escapeAttrVendaProducao(registro.id) + "'><i data-lucide='edit-3'></i></button>" +
"<button type='button' class='btn-icon danger' title='Excluir' data-venda-producao-action='delete' data-venda-producao-id='" + escapeAttrVendaProducao(registro.id) + "'><i data-lucide='trash-2'></i></button>" +
"</div></td>" +
"</tr>"
);
}).join("");

vincularAcoesTabelaVendasProducao();
criarIconesVendaProducao();
}

function vincularAcoesTabelaVendasProducao() {
document.querySelectorAll("[data-venda-producao-action]").forEach(function (botao) {
botao.addEventListener("click", function () {
var acao = botao.getAttribute("data-venda-producao-action");
var id = botao.getAttribute("data-venda-producao-id");

if (!id) {
  return;
}

if (acao === "edit") {
  editarVendaProducao(id);
}

if (acao === "delete") {
  excluirVendaProducao(id);
}
});
});
}

function filtrarVendasProducao() {
var search = getValueVendaProducao("searchVendasProducao").toLowerCase();
var canal = getValueVendaProducao("filterCanalVendaProducao");
var status = getValueVendaProducao("filterStatusVendaProducao");

return vendasProducaoCache
.filter(function (registro) {
var texto = [
registro.data,
registro.fichaNome,
registro.produto,
registro.canal,
registro.status,
registro.observacoes
].join(" ").toLowerCase();

return (!search || texto.indexOf(search) >= 0) &&
(!canal || registro.canal === canal) &&
(!status || registro.status === status);
})
.sort(function (a, b) {
return String(b.data || "").localeCompare(String(a.data || ""));
});
}

function renderResumoVendasProducao() {
var competencia = competenciaAtualVendaProducao();
var registrosMes = vendasProducaoCache.filter(function (registro) {
return registro.status === "Confirmada" &&
String(registro.competencia || registro.data || "").substring(0, 7) === competencia;
});

var quantidadeTotal = registrosMes.reduce(function (total, registro) {
return total + numeroVendaProducao(registro.quantidade);
}, 0);

var custoEstoque = registrosMes.reduce(function (total, registro) {
return total + numeroVendaProducao(registro.custoEstoqueBaixado || registro.custoEstimado);
}, 0);

var ultimo = vendasProducaoCache.slice().sort(function (a, b) {
return dataTimestampVendaProducao(b.data || b.criadoEm) - dataTimestampVendaProducao(a.data || a.criadoEm);
})[0];

setTextVendaProducao("vendasMesTotal", registrosMes.length);
setTextVendaProducao("vendasQuantidadeTotal", formatarNumeroVendaProducao(quantidadeTotal, 2));
setTextVendaProducao("vendasEstoqueBaixado", formatarMoedaVendaProducao(custoEstoque));
setTextVendaProducao("vendasUltimoRegistro", ultimo ? formatarDataVendaProducao(ultimo.data) : "Nenhum");
}

function exportarVendasProducao() {
if (!vendasProducaoCache.length) {
mensagemVendaProducao("Não há registros para exportar.", "warning");
return;
}

var linhas = [];

linhas.push("Data;Produto;Quantidade;Canal;Status;Custo estimado;Estoque baixado;Observacoes");

vendasProducaoCache.forEach(function (registro) {
linhas.push([
limparCsvVendaProducao(registro.data || ""),
limparCsvVendaProducao(registro.fichaNome || registro.produto || ""),
numeroExportVendaProducao(registro.quantidade),
limparCsvVendaProducao(registro.canal || ""),
limparCsvVendaProducao(registro.status || ""),
numeroExportVendaProducao(registro.custoEstimado),
numeroExportVendaProducao(registro.custoEstoqueBaixado),
limparCsvVendaProducao(registro.observacoes || "")
].join(";"));
});

baixarArquivoTextoVendaProducao("balu-vendas-producao.csv", "\ufeff" + linhas.join("\n"), "text/csv;charset=utf-8;");
mensagemVendaProducao("Arquivo de vendas/produção exportado.", "success");
}

function carregarVendasProducaoLocal() {
if (typeof loadData === "function") {
var dados = loadData("vendasProducao", []);

if (Array.isArray(dados)) {
  return dados;
}
}

var oficial = carregarListaStorageVendaProducao(BALU_VENDAS_PRODUCAO_KEY);

if (oficial.length) {
return oficial;
}

return carregarListaStorageVendaProducao(BALU_VENDAS_MANUAIS_KEY);
}

function salvarVendasProducaoLocal() {
if (typeof saveData === "function") {
saveData("vendasProducao", vendasProducaoCache);
return;
}

localStorage.setItem(BALU_VENDAS_PRODUCAO_KEY, JSON.stringify(vendasProducaoCache));
}

function carregarListaVendaProducao(nomeChave, chavePadrao, aliases) {
if (typeof loadData === "function") {
var dados = loadData(nomeChave, []);

if (Array.isArray(dados)) {
  return dados;
}
}

var chaves = [chavePadrao].concat(aliases || []);

for (var i = 0; i < chaves.length; i++) {
var lista = carregarListaStorageVendaProducao(chaves[i]);

if (lista.length) {
  return lista;
}
}

return [];
}

function carregarListaStorageVendaProducao(chave) {
try {
var texto = localStorage.getItem(chave);
var dados = texto ? JSON.parse(texto) : [];
return Array.isArray(dados) ? dados : [];
} catch (erro) {
console.warn("Erro ao carregar storage:", chave, erro);
return [];
}
}

function salvarListaStorageVendaProducao(chave, lista) {
localStorage.setItem(chave, JSON.stringify(lista || []));
}

function buscarVendaProducaoPorId(id) {
return vendasProducaoCache.find(function (registro) {
return registro.id === id;
});
}

function buscarFichaVendaProducao(id) {
return vendasFichasCache.find(function (ficha) {
return String(ficha.id || "") === String(id || "");
});
}

function buscarCadastroEstoqueVenda(tipo, itemFicha) {
var lista = tipo === "Insumo" ? vendasInsumosCache : vendasEmbalagensCache;
return buscarCadastroEstoqueVendaEmLista(lista, itemFicha);
}

function buscarCadastroEstoqueVendaEmLista(lista, itemFicha) {
if (!Array.isArray(lista)) {
return null;
}

var itemId = String(itemFicha.itemId || itemFicha.id || "");
var codigo = normalizarTextoVendaProducao(itemFicha.codigo || "");
var nome = normalizarTextoVendaProducao(itemFicha.nome || "");

return lista.find(function (item) {
var mesmoId = itemId && String(item.id || "") === itemId;
var mesmoCodigo = codigo && normalizarTextoVendaProducao(item.codigo || "") === codigo;
var mesmoNome = nome && normalizarTextoVendaProducao(item.nome || "") === nome;

return mesmoId || mesmoCodigo || mesmoNome;
});
}

function deveBaixarEstoqueVenda(tipo) {
return tipo === "Insumo" || tipo === "Embalagem";
}

function obterUnidadeEstoqueVenda(tipo, item) {
if (!item) {
return "unidade";
}

if (tipo === "Insumo") {
return item.unidadeConsumo || item.unidadeCompra || "unidade";
}

return item.unidade || "unidade";
}

function obterCustoUnitarioFichaVenda(ficha) {
return numeroVendaProducao(
ficha.custoPorPorcao ||
ficha.custoPorcao ||
ficha.custoUnitario ||
ficha.custoTotal ||
0
);
}

function calcularCustoMovimentoVenda(tipo, itemFicha, cadastro, quantidadeOriginal, unidadeFicha, quantidadeVenda) {
var totalFicha = numeroVendaProducao(itemFicha.total);

if (totalFicha > 0) {
return totalFicha * quantidadeVenda;
}

if (tipo === "Insumo" && cadastro) {
var unidade = normalizarUnidadeVendaProducao(unidadeFicha);
var precoMedioKg = numeroVendaProducao(cadastro.precoMedioKg);

if (precoMedioKg > 0 && unidade === "g") {
  return (quantidadeOriginal / 1000) * precoMedioKg;
}

if (precoMedioKg > 0 && unidade === "kg") {
  return quantidadeOriginal * precoMedioKg;
}
}

if (tipo === "Embalagem" && cadastro) {
var precoUnitario = numeroVendaProducao(cadastro.precoUnitario);

if (precoUnitario > 0) {
  return quantidadeOriginal * precoUnitario;
}
}

return quantidadeOriginal * numeroVendaProducao(itemFicha.custoUnitario);
}

function converterQuantidadeVendaProducao(quantidade, unidadeOrigem, unidadeDestino) {
var origem = normalizarUnidadeVendaProducao(unidadeOrigem);
var destino = normalizarUnidadeVendaProducao(unidadeDestino);
var valor = numeroVendaProducao(quantidade);

if (origem === destino) {
return valor;
}

if (origem === "g" && destino === "kg") {
return valor / 1000;
}

if (origem === "kg" && destino === "g") {
return valor * 1000;
}

if (origem === "ml" && destino === "litro") {
return valor / 1000;
}

if (origem === "litro" && destino === "ml") {
return valor * 1000;
}

if (origem === "unidade" && destino === "un") {
return valor;
}

if (origem === "un" && destino === "unidade") {
return valor;
}

return valor;
}

function normalizarUnidadeVendaProducao(unidade) {
var texto = normalizarTextoVendaProducao(unidade);

if (["g", "gr", "grama", "gramas"].indexOf(texto) >= 0) {
return "g";
}

if (["kg", "quilo", "quilos", "kilograma", "kilogramas"].indexOf(texto) >= 0) {
return "kg";
}

if (["ml", "mililitro", "mililitros"].indexOf(texto) >= 0) {
return "ml";
}

if (["l", "lt", "litro", "litros"].indexOf(texto) >= 0) {
return "litro";
}

if (["un", "und", "unid", "unidade", "unidades"].indexOf(texto) >= 0) {
return "unidade";
}

return texto || "unidade";
}

function getValueVendaProducao(id) {
var element = document.getElementById(id);
return element ? element.value || "" : "";
}

function setValueVendaProducao(id, value) {
var element = document.getElementById(id);

if (element) {
element.value = value === undefined || value === null ? "" : value;
}
}

function setTextVendaProducao(id, value) {
var element = document.getElementById(id);

if (element) {
element.textContent = value === undefined || value === null ? "" : value;
}
}

function numeroVendaProducao(valor) {
if (typeof safeNumber === "function") {
return safeNumber(valor);
}

if (valor === null || valor === undefined || valor === "") {
return 0;
}

if (typeof valor === "number") {
return isNaN(valor) ? 0 : valor;
}

var texto = String(valor)
.replace("R$", "")
.replace("%", "")
.replace("x", "")
.replace(/\s/g, "")
.trim();

if (texto.indexOf(",") >= 0) {
texto = texto.replace(/\./g, "").replace(",", ".");
}

var numero = Number(texto);
return isNaN(numero) ? 0 : numero;
}

function formatarMoedaVendaProducao(valor) {
return numeroVendaProducao(valor).toLocaleString("pt-BR", {
style: "currency",
currency: "BRL"
});
}

function formatarNumeroVendaProducao(valor, casas) {
return numeroVendaProducao(valor).toLocaleString("pt-BR", {
minimumFractionDigits: casas,
maximumFractionDigits: casas
});
}

function formatarDataVendaProducao(data) {
if (typeof formatDateBR === "function") {
return formatDateBR(data);
}

if (!data) {
return "-";
}

var partes = String(data).substring(0, 10).split("-");
return partes.length === 3 ? partes[2] + "/" + partes[1] + "/" + partes[0] : String(data);
}

function dataAtualVendaProducao() {
var hoje = new Date();
return hoje.getFullYear() + "-" + String(hoje.getMonth() + 1).padStart(2, "0") + "-" + String(hoje.getDate()).padStart(2, "0");
}

function competenciaAtualVendaProducao() {
var hoje = new Date();
return hoje.getFullYear() + "-" + String(hoje.getMonth() + 1).padStart(2, "0");
}

function dataTimestampVendaProducao(valor) {
var data = valor ? new Date(valor) : null;
return data && !isNaN(data.getTime()) ? data.getTime() : 0;
}

function badgeStatusVendaProducao(status) {
var classe = "badge";

if (status === "Confirmada") {
classe += " success";
} else if (status === "Pendente") {
classe += " warning";
} else if (status === "Cancelada") {
classe += " danger";
}

return "<span class='" + classe + "'>" + escapeHtmlVendaProducao(status) + "</span>";
}

function normalizarTextoVendaProducao(valor) {
return String(valor || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.replace(/\s+/g, " ")
.trim();
}

function escapeHtmlVendaProducao(valor) {
return String(valor === null || valor === undefined ? "" : valor)
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#039;");
}

function escapeAttrVendaProducao(valor) {
return escapeHtmlVendaProducao(valor);
}

function limparCsvVendaProducao(valor) {
return String(valor || "").replace(/;/g, ",").replace(/\n/g, " ").replace(/\r/g, " ").trim();
}

function numeroExportVendaProducao(valor) {
return numeroVendaProducao(valor).toFixed(2).replace(".", ",");
}

function baixarArquivoTextoVendaProducao(nome, conteudo, tipo) {
var blob = new Blob([conteudo], { type: tipo || "text/plain;charset=utf-8;" });
var url = URL.createObjectURL(blob);
var link = document.createElement("a");

link.href = url;
link.download = nome;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);
}

function gerarIdVendaProducao() {
if (typeof generateId === "function") {
return generateId("VND");
}

return "VND-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

function mensagemVendaProducao(mensagem, tipo) {
if (typeof showToast === "function") {
showToast(mensagem, tipo || "success");
return;
}

alert(mensagem);
}

function criarIconesVendaProducao() {
if (typeof baluRefreshIcons === "function") {
baluRefreshIcons();
return;
}

if (window.lucide) {
lucide.createIcons();
}
}

window.editarVendaProducao = editarVendaProducao;
window.excluirVendaProducao = excluirVendaProducao;
window.atualizarPreviewVendaProducao = atualizarPreviewVendaProducao;
