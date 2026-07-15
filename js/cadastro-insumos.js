// =====================================================
// BALU FOOD - CADASTRO DE INSUMOS
// Versão refeita para funcionar 100% no front-end
// CRUD + cálculos + localStorage + CSV + prévia editável
// =====================================================

var BALU_INSUMOS_KEY = "balu_insumos";

var insumosCache = [];
var insumosImportacaoCache = [];
var insumoDetalheAtualId = null;

var BALU_INSUMOS_HEADERS = [
"Codigo",
"Nome",
"Grupo",
"UnidadeCompra",
"UnidadeConsumo",
"QuantidadePorEmbalagem",
"PesoEmbalagemGramas",
"PesoBruto",
"PesoLiquido",
"Fornecedor1",
"PrecoFornecedor1",
"Fornecedor2",
"PrecoFornecedor2",
"Fornecedor3",
"PrecoFornecedor3",
"EstoqueAtual",
"EstoqueMinimo",
"EstoqueIdeal",
"TipoArmazenamento",
"LocalArmazenamento",
"PosicaoArmazenamento",
"Validade",
"Lote",
"MarcaPreferida",
"ObservacaoArmazenamento",
"Status",
"Observacoes"
];

document.addEventListener("DOMContentLoaded", function () {
garantirDrawerBasico();
iniciarCadastroInsumos();
});

function iniciarCadastroInsumos() {
insumosCache = carregarInsumosLocal();

iniciarEventosInsumos();
iniciarImagemInsumo();

renderizarInsumos();
atualizarPreviewFormularioInsumo();
criarIconesInsumo();

console.log("BALU Food: Cadastro de Insumos carregado com sucesso.");
}

function iniciarEventosInsumos() {
var form = document.getElementById("formInsumo");
var btnNovo = document.getElementById("btnNovoInsumo");
var btnExportar = document.getElementById("btnExportarInsumos");
var btnConfirmarImportacao = document.getElementById("btnConfirmarImportacaoInsumos");
var btnLimparImportacao = document.getElementById("btnLimparImportacaoInsumos");
var btnEditarDetalhe = document.getElementById("btnEditarInsumoDetalhe");
var inputCsv = document.getElementById("importInsumosCsvFile");
var search = document.getElementById("searchInsumos");
var filterGrupo = document.getElementById("filterGrupoInsumo");
var filterStatus = document.getElementById("filterStatusInsumo");
var previewTable = document.getElementById("importInsumosPreviewTable");

if (form) {
form.addEventListener("submit", function (event) {
event.preventDefault();
salvarInsumo();
});
}

if (btnNovo) {
btnNovo.addEventListener("click", function () {
prepararNovoInsumo();
});
}

document.querySelectorAll(".btnModeloCsvInsumos").forEach(function (botao) {
botao.addEventListener("click", baixarModeloCsvInsumos);
});

if (btnExportar) {
btnExportar.addEventListener("click", exportarInsumosCsv);
}

if (btnConfirmarImportacao) {
btnConfirmarImportacao.addEventListener("click", confirmarImportacaoInsumos);
}

if (btnLimparImportacao) {
btnLimparImportacao.addEventListener("click", limparImportacaoInsumos);
}

if (btnEditarDetalhe) {
btnEditarDetalhe.addEventListener("click", function () {
if (insumoDetalheAtualId) {
editarInsumo(insumoDetalheAtualId);
}
});
}

if (inputCsv) {
inputCsv.addEventListener("change", function () {
lerArquivoCsvInsumos(inputCsv.files && inputCsv.files[0]);
});
}

if (search) {
search.addEventListener("input", renderizarInsumos);
}

if (filterGrupo) {
filterGrupo.addEventListener("change", renderizarInsumos);
}

if (filterStatus) {
filterStatus.addEventListener("change", renderizarInsumos);
}

if (previewTable) {
previewTable.addEventListener("input", function (event) {
atualizarCampoPreviewImportacao(event, false);
});


previewTable.addEventListener("change", function (event) {
  atualizarCampoPreviewImportacao(event, true);
});

previewTable.addEventListener("click", function (event) {
  var botao = event.target.closest("[data-remove-import-index]");

  if (botao) {
    var index = Number(botao.getAttribute("data-remove-import-index"));
    removerLinhaImportacaoInsumos(index);
  }
});


}

[
"insumoUnidadeCompra",
"insumoUnidadeConsumo",
"quantidadePorEmbalagem",
"pesoEmbalagemGramas",
"pesoBruto",
"pesoLiquido",
"precoFornecedor1",
"precoFornecedor2",
"precoFornecedor3",
"estoqueAtual",
"estoqueMinimo",
"estoqueIdeal"
].forEach(function (id) {
var campo = document.getElementById(id);


if (campo) {
  campo.addEventListener("input", atualizarPreviewFormularioInsumo);
  campo.addEventListener("change", atualizarPreviewFormularioInsumo);
  campo.addEventListener("keyup", atualizarPreviewFormularioInsumo);
}


});
}

function iniciarImagemInsumo() {
var input = document.getElementById("insumoImagemInput");
var preview = document.getElementById("insumoImagemPreview");
var placeholder = document.getElementById("insumoImagemPlaceholder");

if (!input || !preview) {
return;
}

input.addEventListener("change", function () {
var file = input.files && input.files[0];


if (!file) {
  return;
}

converterImagemParaBase64(file).then(function (base64) {
  input.dataset.imageBase64 = base64;
  preview.src = base64;
  preview.style.display = "block";

  if (placeholder) {
    placeholder.style.display = "none";
  }
});


});
}

function prepararNovoInsumo() {
limparFormularioInsumo();

setText("drawerInsumoTitle", "Novo Insumo");
setValue("insumoCodigo", gerarCodigoInsumo());

atualizarPreviewFormularioInsumo();

if (typeof openDrawer === "function") {
openDrawer("drawerInsumo");
}
}

function limparFormularioInsumo() {
var form = document.getElementById("formInsumo");
var inputImagem = document.getElementById("insumoImagemInput");
var preview = document.getElementById("insumoImagemPreview");
var placeholder = document.getElementById("insumoImagemPlaceholder");

if (form) {
form.reset();
}

setValue("insumoId", "");

if (inputImagem) {
inputImagem.value = "";
inputImagem.dataset.imageBase64 = "";
}

if (preview) {
preview.src = "";
preview.style.display = "none";
}

if (placeholder) {
placeholder.style.display = "block";
}
}

function salvarInsumo() {
var id = getValue("insumoId");
var nome = getValue("insumoNome");
var grupo = getValue("insumoGrupo");

if (!nome) {
mostrarMensagemInsumo("Informe o nome do insumo.", "warning");
return;
}

if (!grupo) {
mostrarMensagemInsumo("Selecione o grupo do insumo.", "warning");
return;
}

var existente = id ? buscarInsumoPorId(id) : null;

var calculos = calcularInsumo({
unidadeCompra: getValue("insumoUnidadeCompra"),
unidadeConsumo: getValue("insumoUnidadeConsumo"),
quantidadePorEmbalagem: getValue("quantidadePorEmbalagem"),
pesoEmbalagemGramas: getValue("pesoEmbalagemGramas"),
pesoBruto: getValue("pesoBruto"),
pesoLiquido: getValue("pesoLiquido"),
precoFornecedor1: getValue("precoFornecedor1"),
precoFornecedor2: getValue("precoFornecedor2"),
precoFornecedor3: getValue("precoFornecedor3"),
estoqueAtual: getValue("estoqueAtual"),
estoqueMinimo: getValue("estoqueMinimo"),
estoqueIdeal: getValue("estoqueIdeal")
});

var inputImagem = document.getElementById("insumoImagemInput");
var imagemNova = inputImagem && inputImagem.dataset.imageBase64 ? inputImagem.dataset.imageBase64 : "";
var agora = new Date().toISOString();

var insumo = {
id: id || gerarIdInsumo(),
imagem: imagemNova || (existente && existente.imagem ? existente.imagem : ""),
codigo: getValue("insumoCodigo") || gerarCodigoInsumo(),
nome: nome,
grupo: grupo,
categoria: "",
unidadeCompra: calculos.unidadeCompra,
unidadeConsumo: calculos.unidadeConsumo,
quantidadePorEmbalagem: calculos.quantidadePorEmbalagem,
descricao: getValue("insumoDescricao"),
pesoEmbalagemGramas: calculos.pesoEmbalagemGramas,
pesoBruto: calculos.pesoBruto,
pesoLiquido: calculos.pesoLiquido,
fatorCorrecao: calculos.fatorCorrecao,
perdaPercentual: calculos.perdaPercentual,
fornecedor1: getValue("fornecedor1"),
precoFornecedor1: calculos.precoFornecedor1,
fornecedor2: getValue("fornecedor2"),
precoFornecedor2: calculos.precoFornecedor2,
fornecedor3: getValue("fornecedor3"),
precoFornecedor3: calculos.precoFornecedor3,
precoMedio: calculos.precoMedio,
precoMedioKg: calculos.precoMedioKg,
custoUnitario: calculos.custoUnitario,
estoqueAtual: calculos.estoqueAtual,
estoqueMinimo: calculos.estoqueMinimo,
estoqueIdeal: calculos.estoqueIdeal,
valorEstoque: calculos.valorEstoque,
tipoArmazenamento: getValue("insumoTipoArmazenamento"),
localArmazenamento: getValue("insumoLocalArmazenamento"),
posicaoArmazenamento: getValue("insumoPosicaoArmazenamento"),
validade: getValue("insumoValidade"),
lote: getValue("insumoLote"),
marcaPreferida: getValue("insumoMarcaPreferida"),
observacaoArmazenamento: getValue("insumoObservacaoArmazenamento"),
status: getValue("insumoStatus") || "Ativo",
statusEstoque: calculos.statusEstoque,
observacoes: getValue("insumoObservacoes"),
criadoEm: existente && existente.criadoEm ? existente.criadoEm : agora,
atualizadoEm: agora
};

if (id) {
insumosCache = insumosCache.map(function (item) {
return item.id === id ? insumo : item;
});


mostrarMensagemInsumo("Insumo atualizado com sucesso.", "success");


} else {
insumosCache.push(insumo);
mostrarMensagemInsumo("Insumo cadastrado com sucesso.", "success");
}

salvarInsumosLocal();
limparFormularioInsumo();
renderizarInsumos();

if (typeof closeDrawer === "function") {
closeDrawer();
}
}

function editarInsumo(id) {
var insumo = buscarInsumoPorId(id);

if (!insumo) {
mostrarMensagemInsumo("Insumo não encontrado.", "danger");
return;
}

insumo = normalizarInsumoSalvo(insumo);

limparFormularioInsumo();

setValue("insumoId", insumo.id);
setValue("insumoCodigo", insumo.codigo);
setValue("insumoNome", insumo.nome);
setValue("insumoGrupo", insumo.grupo);
setValue("insumoUnidadeCompra", insumo.unidadeCompra);
setValue("insumoUnidadeConsumo", insumo.unidadeConsumo);
setValue("quantidadePorEmbalagem", numeroParaInputInsumo(insumo.quantidadePorEmbalagem));
setValue("insumoDescricao", insumo.descricao);
setValue("pesoEmbalagemGramas", numeroParaInputInsumo(insumo.pesoEmbalagemGramas));
setValue("pesoBruto", numeroParaInputInsumo(insumo.pesoBruto));
setValue("pesoLiquido", numeroParaInputInsumo(insumo.pesoLiquido));
setValue("fornecedor1", insumo.fornecedor1);
setValue("precoFornecedor1", numeroParaInputInsumo(insumo.precoFornecedor1));
setValue("fornecedor2", insumo.fornecedor2);
setValue("precoFornecedor2", numeroParaInputInsumo(insumo.precoFornecedor2));
setValue("fornecedor3", insumo.fornecedor3);
setValue("precoFornecedor3", numeroParaInputInsumo(insumo.precoFornecedor3));
setValue("estoqueAtual", numeroParaInputInsumo(insumo.estoqueAtual));
setValue("estoqueMinimo", numeroParaInputInsumo(insumo.estoqueMinimo));
setValue("estoqueIdeal", numeroParaInputInsumo(insumo.estoqueIdeal));
setValue("insumoTipoArmazenamento", insumo.tipoArmazenamento);
setValue("insumoLocalArmazenamento", insumo.localArmazenamento);
setValue("insumoPosicaoArmazenamento", insumo.posicaoArmazenamento);
setValue("insumoValidade", normalizarDataInsumo(insumo.validade));
setValue("insumoLote", insumo.lote);
setValue("insumoMarcaPreferida", insumo.marcaPreferida);
setValue("insumoObservacaoArmazenamento", insumo.observacaoArmazenamento);
setValue("insumoStatus", insumo.status || "Ativo");
setValue("insumoObservacoes", insumo.observacoes);

setText("drawerInsumoTitle", "Editar Insumo");

var inputImagem = document.getElementById("insumoImagemInput");
var preview = document.getElementById("insumoImagemPreview");
var placeholder = document.getElementById("insumoImagemPlaceholder");

if (inputImagem) {
inputImagem.dataset.imageBase64 = insumo.imagem || "";
}

if (preview && insumo.imagem) {
preview.src = insumo.imagem;
preview.style.display = "block";


if (placeholder) {
  placeholder.style.display = "none";
}


}

atualizarPreviewFormularioInsumo();

if (typeof openDrawer === "function") {
openDrawer("drawerInsumo");
}
}

function excluirInsumo(id) {
var insumo = buscarInsumoPorId(id);

if (!insumo) {
return;
}

var confirmar = confirm("Deseja excluir o insumo " + insumo.nome + "?");

if (!confirmar) {
return;
}

insumosCache = insumosCache.filter(function (item) {
return item.id !== id;
});

salvarInsumosLocal();
renderizarInsumos();
mostrarMensagemInsumo("Insumo excluído com sucesso.", "success");
}

function buscarInsumoPorId(id) {
return insumosCache.find(function (item) {
return item.id === id;
});
}

function atualizarPreviewFormularioInsumo() {
var calculos = calcularInsumo({
unidadeCompra: getValue("insumoUnidadeCompra"),
unidadeConsumo: getValue("insumoUnidadeConsumo"),
quantidadePorEmbalagem: getValue("quantidadePorEmbalagem"),
pesoEmbalagemGramas: getValue("pesoEmbalagemGramas"),
pesoBruto: getValue("pesoBruto"),
pesoLiquido: getValue("pesoLiquido"),
precoFornecedor1: getValue("precoFornecedor1"),
precoFornecedor2: getValue("precoFornecedor2"),
precoFornecedor3: getValue("precoFornecedor3"),
estoqueAtual: getValue("estoqueAtual"),
estoqueMinimo: getValue("estoqueMinimo"),
estoqueIdeal: getValue("estoqueIdeal")
});

setText("fatorCorrecao", calculos.fatorCorrecao > 0 ? formatarNumeroBRInsumo(calculos.fatorCorrecao, 4) : "Não calculado");
setText("perdaPercentual", formatarPercentualInsumo(calculos.perdaPercentual));
setText("precoMedioPreview", formatarMoedaInsumo(calculos.precoMedio));
setText("precoMedioKgPreview", formatarMoedaInsumo(calculos.precoMedioKg));
setText("custoUnitarioPreview", formatarMoedaInsumo(calculos.custoUnitario));
setText("valorEstoquePreview", formatarMoedaInsumo(calculos.valorEstoque));
setText("statusEstoquePreview", calculos.statusEstoque);
}

function calcularInsumo(dados) {
var unidadeCompra = normalizarUnidadeInsumo(dados.unidadeCompra);
var unidadeConsumo = normalizarUnidadeInsumo(dados.unidadeConsumo || dados.unidadeCompra);

var quantidadePorEmbalagem = numeroInsumo(dados.quantidadePorEmbalagem);
var pesoEmbalagemGramas = numeroInsumo(dados.pesoEmbalagemGramas);
var pesoBruto = numeroInsumo(dados.pesoBruto);
var pesoLiquido = numeroInsumo(dados.pesoLiquido);

var precoFornecedor1 = numeroInsumo(dados.precoFornecedor1);
var precoFornecedor2 = numeroInsumo(dados.precoFornecedor2);
var precoFornecedor3 = numeroInsumo(dados.precoFornecedor3);

var estoqueAtual = numeroInsumo(dados.estoqueAtual);
var estoqueMinimo = numeroInsumo(dados.estoqueMinimo);
var estoqueIdeal = numeroInsumo(dados.estoqueIdeal);

if (pesoEmbalagemGramas <= 0) {
if (pesoLiquido > 0) {
pesoEmbalagemGramas = pesoLiquido;
} else if (pesoBruto > 0) {
pesoEmbalagemGramas = pesoBruto;
}
}

var precos = [];

if (precoFornecedor1 > 0) {
precos.push(precoFornecedor1);
}

if (precoFornecedor2 > 0) {
precos.push(precoFornecedor2);
}

if (precoFornecedor3 > 0) {
precos.push(precoFornecedor3);
}

var precoMedio = 0;

if (precos.length > 0) {
precoMedio = precos.reduce(function (soma, preco) {
return soma + preco;
}, 0) / precos.length;
}

var precoMedioKg = 0;

if (pesoEmbalagemGramas > 0 && precoMedio > 0) {
precoMedioKg = (precoMedio / pesoEmbalagemGramas) * 1000;
}

var custoUnitario = 0;

if (quantidadePorEmbalagem > 0 && precoMedio > 0) {
custoUnitario = precoMedio / quantidadePorEmbalagem;
}

var fatorCorrecao = 0;

if (pesoBruto > 0 && pesoLiquido > 0) {
fatorCorrecao = pesoBruto / pesoLiquido;
}

var perdaPercentual = 0;

if (pesoBruto > 0 && pesoLiquido > 0) {
perdaPercentual = ((pesoBruto - pesoLiquido) / pesoBruto) * 100;


if (perdaPercentual < 0) {
  perdaPercentual = 0;
}


}

var valorEstoque = 0;

valorEstoque = calcularValorEstoqueInsumoQuantidade(
estoqueAtual,
unidadeConsumo,
precoMedioKg,
custoUnitario,
precoMedio
);

var statusEstoque = "Estoque ok";

if (estoqueAtual <= 0) {
statusEstoque = "Crítico";
} else if (estoqueMinimo > 0 && estoqueAtual <= estoqueMinimo) {
statusEstoque = "Crítico";
} else if (estoqueIdeal > 0 && estoqueAtual < estoqueIdeal) {
statusEstoque = "Atenção";
} else {
statusEstoque = "Estoque ok";
}

return {
unidadeCompra: unidadeCompra,
unidadeConsumo: unidadeConsumo,
quantidadePorEmbalagem: quantidadePorEmbalagem,
pesoEmbalagemGramas: pesoEmbalagemGramas,
pesoBruto: pesoBruto,
pesoLiquido: pesoLiquido,
precoFornecedor1: precoFornecedor1,
precoFornecedor2: precoFornecedor2,
precoFornecedor3: precoFornecedor3,
estoqueAtual: estoqueAtual,
estoqueMinimo: estoqueMinimo,
estoqueIdeal: estoqueIdeal,
precoMedio: precoMedio,
precoMedioKg: precoMedioKg,
custoUnitario: custoUnitario,
fatorCorrecao: fatorCorrecao,
perdaPercentual: perdaPercentual,
valorEstoque: valorEstoque,
statusEstoque: statusEstoque
};
}

function calcularValorEstoqueInsumoQuantidade(quantidade, unidade, precoMedioKg, custoUnitario, precoMedio) {
var quantidadeNumero = numeroInsumo(quantidade);
var unidadeNormalizada = normalizarUnidadeInsumo(unidade);
var precoKg = numeroInsumo(precoMedioKg);
var custoUnit = numeroInsumo(custoUnitario);
var precoMedioNumero = numeroInsumo(precoMedio);

if (unidadeNormalizada === "g" && precoKg > 0) {
return (quantidadeNumero / 1000) * precoKg;
}

if (unidadeNormalizada === "kg" && precoKg > 0) {
return quantidadeNumero * precoKg;
}

return quantidadeNumero * (custoUnit || precoMedioNumero || precoKg);
}

function renderizarInsumos() {
var table = document.getElementById("insumosTable");

if (!table) {
return;
}

insumosCache = insumosCache.map(normalizarInsumoSalvo);

var lista = filtrarInsumos();
renderizarResumoInsumos();

if (!lista.length) {
table.innerHTML = "<tr><td colspan='11' class='text-muted'>Nenhum insumo encontrado.</td></tr>";
return;
}

table.innerHTML = lista.map(function (insumo) {
var statusFinal = getStatusFinalInsumo(insumo);
var localizacao = [insumo.tipoArmazenamento, insumo.localArmazenamento, insumo.posicaoArmazenamento].filter(Boolean).join(" / ");
var unidade = insumo.unidadeConsumo || insumo.unidadeCompra || "-";

return "<tr class='clickable-row' onclick='abrirDetalheInsumo(\"" + escapeAttr(insumo.id) + "\")'>" +
  "<td><div class='product-cell'>" + renderThumbInsumo(insumo.imagem, insumo.nome) + "<div><strong>" + escapeHtml(insumo.nome || "-") + "</strong><span>" + escapeHtml(insumo.descricao || "Sem descrição") + "</span></div></div></td>" +
  "<td>" + escapeHtml(insumo.codigo || "-") + "</td>" +
  "<td>" + escapeHtml(insumo.grupo || "-") + "</td>" +
  "<td>" + escapeHtml(unidade) + "</td>" +
  "<td><strong>" + formatarMoedaInsumo(insumo.precoMedio) + "</strong></td>" +
  "<td><strong>" + formatarMoedaInsumo(insumo.precoMedioKg) + "</strong></td>" +
  "<td>" + formatarNumeroBRInsumo(insumo.estoqueAtual, 2) + "</td>" +
  "<td>" + escapeHtml(localizacao || "-") + "</td>" +
  "<td><strong>" + formatarMoedaInsumo(insumo.valorEstoque) + "</strong></td>" +
  "<td>" + badgeStatusInsumo(statusFinal) + "</td>" +
  "<td onclick='event.stopPropagation()'><div class='table-actions'>" +
  "<button type='button' class='btn-icon' title='Editar' onclick='editarInsumo(\"" + escapeAttr(insumo.id) + "\")'><i data-lucide='edit-3'></i></button>" +
  "<button type='button' class='btn-icon danger' title='Excluir' onclick='excluirInsumo(\"" + escapeAttr(insumo.id) + "\")'><i data-lucide='trash-2'></i></button>" +
  "</div></td>" +
  "</tr>";


}).join("");

criarIconesInsumo();
}

function filtrarInsumos() {
var search = getValue("searchInsumos").toLowerCase();
var grupo = getValue("filterGrupoInsumo");
var status = getValue("filterStatusInsumo");

return insumosCache.filter(function (insumo) {
var statusFinal = getStatusFinalInsumo(insumo);

var texto = [
  insumo.nome,
  insumo.codigo,
  insumo.grupo,
  insumo.descricao,
  insumo.tipoArmazenamento,
  insumo.localArmazenamento,
  insumo.posicaoArmazenamento,
  insumo.lote,
  insumo.marcaPreferida
].join(" ").toLowerCase();

var passaBusca = !search || texto.indexOf(search) >= 0;
var passaGrupo = !grupo || insumo.grupo === grupo;
var passaStatus = !status || insumo.status === status || statusFinal === status;

return passaBusca && passaGrupo && passaStatus;

});
}

function renderizarResumoInsumos() {
var total = insumosCache.length;

var semFornecedor = insumosCache.filter(function (item) {
return !String(item.fornecedor1 || "").trim();
}).length;

var cadastroIncompleto = insumosCache.filter(function (item) {
var semPreco = numeroInsumo(item.precoMedio) <= 0 && numeroInsumo(item.precoMedioKg) <= 0 && numeroInsumo(item.custoUnitario) <= 0;
var semConversao = !item.unidadeCompra || !item.unidadeConsumo;
return semPreco || semConversao;
}).length;

var ativos = insumosCache.filter(function (item) {
return String(item.status || "Ativo") !== "Inativo";
}).length;

setText("totalInsumos", total);
setText("valorEstoqueInsumos", semFornecedor);
setText("insumosEstoqueBaixo", cadastroIncompleto);
setText("precoMedioGeral", ativos);
}

function abrirDetalheInsumo(id) {
var insumo = buscarInsumoPorId(id);

if (!insumo) {
mostrarMensagemInsumo("Insumo não encontrado.", "warning");
return;
}

insumo = normalizarInsumoSalvo(insumo);

insumoDetalheAtualId = id;

setText("detalheInsumoTitulo", insumo.nome || "Resumo do Insumo");
setText("detalheInsumoSubtitulo", (insumo.codigo || "Sem código") + " • " + (insumo.grupo || "Sem grupo") + " • " + getStatusFinalInsumo(insumo));

var conteudo = document.getElementById("detalheInsumoConteudo");

if (conteudo) {
conteudo.innerHTML = montarHtmlDetalheInsumo(insumo);
}

if (typeof openDrawer === "function") {
openDrawer("drawerDetalheInsumo");
}

criarIconesInsumo();
}

function montarHtmlDetalheInsumo(insumo) {
return "<div class='form-section'><div class='product-cell'>" + renderThumbInsumo(insumo.imagem, insumo.nome) + "<div><strong>" + escapeHtml(insumo.nome || "-") + "</strong><span>" + escapeHtml(insumo.descricao || "Sem descrição cadastrada.") + "</span></div></div></div>" +
"<div class='calculated-box'><h4 class='calculated-box-title'>Resumo financeiro e estoque</h4><div class='calculated-grid'>" +
detalheItemInsumo("Preço médio da embalagem", formatarMoedaInsumo(insumo.precoMedio)) +
detalheItemInsumo("Preço médio por kg", formatarMoedaInsumo(insumo.precoMedioKg)) +
detalheItemInsumo("Custo por unidade", formatarMoedaInsumo(insumo.custoUnitario)) +
detalheItemInsumo("Peso da embalagem", formatarNumeroBRInsumo(insumo.pesoEmbalagemGramas, 2) + "g") +
detalheItemInsumo("Quantidade por embalagem", formatarNumeroBRInsumo(insumo.quantidadePorEmbalagem, 2)) +
detalheItemInsumo("Estoque atual", formatarNumeroBRInsumo(insumo.estoqueAtual, 2) + " " + escapeHtml(insumo.unidadeConsumo || "")) +
detalheItemInsumo("Valor em estoque", formatarMoedaInsumo(insumo.valorEstoque)) +
detalheItemInsumo("Status do estoque", getStatusFinalInsumo(insumo)) +
detalheItemInsumo("Status cadastro", insumo.status || "-") +
"</div></div>" +
"<div class='calculated-box'><h4 class='calculated-box-title'>Rendimento</h4><div class='calculated-grid'>" +
detalheItemInsumo("Peso bruto", formatarNumeroBRInsumo(insumo.pesoBruto, 2) + "g") +
detalheItemInsumo("Peso líquido", formatarNumeroBRInsumo(insumo.pesoLiquido, 2) + "g") +
detalheItemInsumo("Fator de correção", formatarNumeroBRInsumo(insumo.fatorCorrecao, 4)) +
detalheItemInsumo("Perda", formatarPercentualInsumo(insumo.perdaPercentual)) +
"</div></div>" +
"<div class='calculated-box'><h4 class='calculated-box-title'>Armazenamento e localização</h4><div class='calculated-grid'>" +
detalheItemInsumo("Tipo", insumo.tipoArmazenamento || "-") +
detalheItemInsumo("Local", insumo.localArmazenamento || "-") +
detalheItemInsumo("Posição", insumo.posicaoArmazenamento || "-") +
detalheItemInsumo("Validade", formatarDataInsumo(insumo.validade)) +
detalheItemInsumo("Lote", insumo.lote || "-") +
detalheItemInsumo("Marca preferida", insumo.marcaPreferida || "-") +
"</div><p class='text-muted' style='margin:14px 0 0;'>" + escapeHtml(insumo.observacaoArmazenamento || "Sem observação de armazenamento.") + "</p></div>" +
"<div class='calculated-box'><h4 class='calculated-box-title'>Fornecedores</h4>" + montarFornecedoresDetalheInsumo(insumo) + "</div>" +
"<div class='form-section'><h3 class='form-section-title'>Observações internas</h3><p class='text-muted'>" + escapeHtml(insumo.observacoes || "Nenhuma observação cadastrada.") + "</p></div>";
}

function detalheItemInsumo(label, valor) {
return "<div class='calculated-item'><span>" + escapeHtml(label) + "</span><strong>" + escapeHtml(valor || "-") + "</strong></div>";
}

function montarFornecedoresDetalheInsumo(insumo) {
var fornecedores = [
{ nome: insumo.fornecedor1, preco: insumo.precoFornecedor1 },
{ nome: insumo.fornecedor2, preco: insumo.precoFornecedor2 },
{ nome: insumo.fornecedor3, preco: insumo.precoFornecedor3 }
].filter(function (item) {
return item.nome || numeroInsumo(item.preco) > 0;
});

if (!fornecedores.length) {
return "<p class='text-muted'>Nenhum fornecedor cadastrado.</p>";
}

return fornecedores.map(function (item, index) {
return "<div class='supplier-card supplier-readonly'><div class='supplier-card-header'><strong>Fornecedor " + (index + 1) + "</strong></div><div class='supplier-grid'><div class='form-field'><label>Nome</label><input type='text' readonly value='" + escapeAttr(item.nome || "-") + "'></div><div class='form-field'><label>Preço</label><input type='text' readonly value='" + formatarMoedaInsumo(item.preco) + "'></div></div></div>";
}).join("");
}

function baixarModeloCsvInsumos() {
var linhas = [];

linhas.push(BALU_INSUMOS_HEADERS.join(";"));

linhas.push(csvLinhaInsumo([
"INS-0001",
"Farinha de trigo",
"Secos",
"pacote",
"g",
"",
"5000",
"5000",
"5000",
"Atacado Exemplo",
"25,00",
"",
"",
"",
"",
"7000",
"2000",
"12000",
"Seco",
"Estoque principal",
"Prateleira 1",
"",
"LOTE-001",
"Marca Exemplo",
"Manter em local seco",
"Ativo",
"Pacote de 5kg. Estoque informado em gramas."
]));

linhas.push(csvLinhaInsumo([
"INS-0002",
"Ovos",
"Secos",
"caixa",
"unidade",
"30",
"",
"",
"",
"Distribuidora Exemplo",
"28,00",
"",
"",
"",
"",
"90",
"30",
"150",
"Refrigerado",
"Geladeira",
"Prateleira 2",
"2026-12-31",
"LOTE-002",
"Marca Exemplo",
"Conferir validade",
"Ativo",
"Caixa com 30 unidades. Estoque informado em unidades."
]));

baixarArquivoTexto("modelo-insumos-balu.csv", "\ufeff" + linhas.join("\n"), "text/csv;charset=utf-8;");
mostrarMensagemInsumo("Modelo CSV baixado.", "success");
}

function lerArquivoCsvInsumos(file) {
if (!file) {
return;
}

var nome = String(file.name || "").toLowerCase();

if (!nome.endsWith(".csv")) {
mostrarMensagemInsumo("Envie apenas arquivo CSV.", "warning");
return;
}

var reader = new FileReader();

reader.onload = function (event) {
try {
processarCsvInsumos(String(event.target.result || ""));
} catch (erro) {
console.error(erro);
mostrarMensagemInsumo("Erro ao ler o CSV. Baixe o modelo oficial e tente novamente.", "danger");
}
};

reader.readAsText(file, "UTF-8");
}

function processarCsvInsumos(texto) {
texto = texto.replace(/^\uFEFF/, "");

var linhas = parseCsvTexto(texto);

if (!linhas.length) {
limparImportacaoInsumos();
mostrarMensagemInsumo("CSV vazio.", "warning");
return;
}

var headers = linhas[0].map(function (header) {
return limparTextoInsumo(header);
});

var validacao = validarCabecalhoCsv(headers);

if (!validacao.ok) {
limparImportacaoInsumos();
setText("importInsumosStatus", "Modelo inválido. Coluna ausente: " + validacao.coluna);
mostrarMensagemInsumo("Modelo inválido. Baixe o modelo CSV oficial do BALU.", "danger");
return;
}

var objetos = [];

for (var i = 1; i < linhas.length; i++) {
var linha = linhas[i];


var vazio = linha.every(function (valor) {
  return !limparTextoInsumo(valor);
});

if (vazio) {
  continue;
}

var obj = {};

headers.forEach(function (header, index) {
  obj[header] = linha[index] || "";
});

objetos.push(montarInsumoDoCsv(obj));


}

insumosImportacaoCache = objetos;

renderizarPreviewImportacaoInsumos();
atualizarStatusImportacaoInsumos();

mostrarMensagemInsumo("CSV carregado. Confira e edite a prévia antes de importar.", "success");
}

function validarCabecalhoCsv(headers) {
var obrigatorias = ["Nome", "Grupo"];

for (var i = 0; i < obrigatorias.length; i++) {
if (headers.indexOf(obrigatorias[i]) < 0) {
return { ok: false, coluna: obrigatorias[i] };
}
}

return { ok: true, coluna: "" };
}

function montarInsumoDoCsv(obj) {
var insumo = {
id: "",
imagem: "",
codigo: limparTextoInsumo(obj.Codigo),
nome: limparTextoInsumo(obj.Nome),
grupo: limparTextoInsumo(obj.Grupo),
categoria: "",
unidadeCompra: normalizarUnidadeInsumo(obj.UnidadeCompra),
unidadeConsumo: normalizarUnidadeInsumo(obj.UnidadeConsumo || obj.UnidadeCompra),
quantidadePorEmbalagem: numeroInsumo(obj.QuantidadePorEmbalagem),
descricao: "",
pesoEmbalagemGramas: numeroInsumo(obj.PesoEmbalagemGramas || obj.PesoLiquido || obj.PesoBruto),
pesoBruto: numeroInsumo(obj.PesoBruto),
pesoLiquido: numeroInsumo(obj.PesoLiquido),
fornecedor1: limparTextoInsumo(obj.Fornecedor1),
precoFornecedor1: numeroInsumo(obj.PrecoFornecedor1),
fornecedor2: limparTextoInsumo(obj.Fornecedor2),
precoFornecedor2: numeroInsumo(obj.PrecoFornecedor2),
fornecedor3: limparTextoInsumo(obj.Fornecedor3),
precoFornecedor3: numeroInsumo(obj.PrecoFornecedor3),
estoqueAtual: numeroInsumo(obj.EstoqueAtual),
estoqueMinimo: numeroInsumo(obj.EstoqueMinimo),
estoqueIdeal: numeroInsumo(obj.EstoqueIdeal),
tipoArmazenamento: limparTextoInsumo(obj.TipoArmazenamento),
localArmazenamento: limparTextoInsumo(obj.LocalArmazenamento),
posicaoArmazenamento: limparTextoInsumo(obj.PosicaoArmazenamento),
validade: normalizarDataInsumo(obj.Validade),
lote: limparTextoInsumo(obj.Lote),
marcaPreferida: limparTextoInsumo(obj.MarcaPreferida),
observacaoArmazenamento: limparTextoInsumo(obj.ObservacaoArmazenamento),
status: limparTextoInsumo(obj.Status) || "Ativo",
observacoes: limparTextoInsumo(obj.Observacoes)
};

return normalizarInsumoSalvo(insumo);
}

function renderizarPreviewImportacaoInsumos() {
var table = document.getElementById("importInsumosPreviewTable");

if (!table) {
return;
}

if (!insumosImportacaoCache.length) {
table.innerHTML = "<tr><td colspan='11' class='text-muted'>Carregue o modelo CSV preenchido para visualizar a prévia.</td></tr>";
return;
}

table.innerHTML = insumosImportacaoCache.map(function (item, index) {
item = normalizarInsumoSalvo(item);


var validacao = validarLinhaImportacaoInsumo(item);

return "<tr>" +
  "<td><strong>" + (index + 1) + "</strong></td>" +
  "<td>" + inputPreviewImportacao(index, "codigo", item.codigo, "text", "INS-0001") + "</td>" +
  "<td>" + inputPreviewImportacao(index, "nome", item.nome, "text", "Nome") + "</td>" +
  "<td>" + selectGrupoPreviewImportacao(index, item.grupo) + "</td>" +
  "<td>" + selectUnidadePreviewImportacao(index, item.unidadeConsumo || item.unidadeCompra) + "</td>" +
  "<td>" + inputPreviewImportacao(index, "pesoEmbalagemGramas", numeroParaInputInsumo(item.pesoEmbalagemGramas), "number", "5000") + "</td>" +
  "<td>" + inputPreviewImportacao(index, "precoFornecedor1", numeroParaInputInsumo(item.precoFornecedor1), "number", "25.00") + "</td>" +
  "<td>" + inputPreviewImportacao(index, "estoqueAtual", numeroParaInputInsumo(item.estoqueAtual), "number", "7000") + "</td>" +
  "<td>" + inputPreviewImportacao(index, "validade", normalizarDataInsumo(item.validade), "date", "") + "</td>" +
  "<td>" + badgeStatusLinhaImportacao(validacao.status, validacao.mensagem) + "</td>" +
  "<td><button type='button' class='btn-icon danger' data-remove-import-index='" + index + "' title='Remover linha'><i data-lucide='trash-2'></i></button></td>" +
  "</tr>";


}).join("");

criarIconesInsumo();
}

function inputPreviewImportacao(index, campo, valor, tipo, placeholder) {
var step = tipo === "number" ? " step='0.01' min='0'" : "";

return "<input class='import-edit-input' data-import-index='" + index + "' data-import-field='" + escapeAttr(campo) + "' type='" + escapeAttr(tipo) + "'" + step + " value='" + escapeAttr(valor) + "' placeholder='" + escapeAttr(placeholder || "") + "'>";
}

function selectGrupoPreviewImportacao(index, valorAtual) {
var grupos = ["Carnes", "Hortifruti", "Secos", "Laticínios", "Bebidas", "Outros"];

var html = "<select class='import-edit-input' data-import-index='" + index + "' data-import-field='grupo'>";
html += "<option value=''>Selecione</option>";

grupos.forEach(function (grupo) {
var selected = grupo === valorAtual ? " selected" : "";
html += "<option value='" + escapeAttr(grupo) + "'" + selected + ">" + escapeHtml(grupo) + "</option>";
});

html += "</select>";

return html;
}

function selectUnidadePreviewImportacao(index, valorAtual) {
var unidades = [
{ valor: "kg", texto: "Kg" },
{ valor: "g", texto: "Gramas" },
{ valor: "litro", texto: "Litro" },
{ valor: "ml", texto: "ML" },
{ valor: "unidade", texto: "Unidade" }
];

var html = "<select class='import-edit-input' data-import-index='" + index + "' data-import-field='unidadeConsumo'>";
html += "<option value=''>Selecione</option>";

unidades.forEach(function (unidade) {
var selected = unidade.valor === valorAtual ? " selected" : "";
html += "<option value='" + escapeAttr(unidade.valor) + "'" + selected + ">" + escapeHtml(unidade.texto) + "</option>";
});

html += "</select>";

return html;
}

function atualizarCampoPreviewImportacao(event, deveRenderizar) {
var campo = event.target;

if (!campo || !campo.hasAttribute("data-import-index")) {
return;
}

var index = Number(campo.getAttribute("data-import-index"));
var field = campo.getAttribute("data-import-field");
var valor = campo.value;

if (!insumosImportacaoCache[index]) {
return;
}

var camposNumericos = [
"quantidadePorEmbalagem",
"pesoEmbalagemGramas",
"pesoBruto",
"pesoLiquido",
"precoFornecedor1",
"precoFornecedor2",
"precoFornecedor3",
"estoqueAtual",
"estoqueMinimo",
"estoqueIdeal"
];

if (camposNumericos.indexOf(field) >= 0) {
insumosImportacaoCache[index][field] = numeroInsumo(valor);
} else {
insumosImportacaoCache[index][field] = valor;
}

insumosImportacaoCache[index] = normalizarInsumoSalvo(insumosImportacaoCache[index]);

atualizarStatusImportacaoInsumos();

if (deveRenderizar) {
renderizarPreviewImportacaoInsumos();
}
}

function removerLinhaImportacaoInsumos(index) {
insumosImportacaoCache.splice(index, 1);
renderizarPreviewImportacaoInsumos();
atualizarStatusImportacaoInsumos();
}

function validarLinhaImportacaoInsumo(item) {
if (!limparTextoInsumo(item.nome)) {
return {
status: "Erro",
mensagem: "Nome obrigatório"
};
}

if (!limparTextoInsumo(item.grupo)) {
return {
status: "Erro",
mensagem: "Grupo obrigatório"
};
}

if (numeroInsumo(item.precoFornecedor1) <= 0 && numeroInsumo(item.precoFornecedor2) <= 0 && numeroInsumo(item.precoFornecedor3) <= 0) {
return {
status: "Atenção",
mensagem: "Sem preço"
};
}

var unidade = normalizarUnidadeInsumo(item.unidadeConsumo || item.unidadeCompra);

if ((unidade === "g" || unidade === "kg" || unidade === "ml" || unidade === "litro") && numeroInsumo(item.pesoEmbalagemGramas) <= 0) {
return {
status: "Atenção",
mensagem: "Sem peso"
};
}

return {
status: "Pronto",
mensagem: "Pronto para importar"
};
}

function badgeStatusLinhaImportacao(status, mensagem) {
var classe = "success";

if (status === "Atenção") {
classe = "warning";
}

if (status === "Erro") {
classe = "danger";
}

return "<span class='badge " + classe + "'>" + escapeHtml(status) + "</span><br><small class='text-muted'>" + escapeHtml(mensagem || "") + "</small>";
}

function atualizarStatusImportacaoInsumos() {
if (!insumosImportacaoCache.length) {
setText("importInsumosStatus", "Nenhum arquivo carregado.");
return;
}

var total = insumosImportacaoCache.length;
var prontos = 0;
var atencoes = 0;
var erros = 0;

insumosImportacaoCache.forEach(function (item) {
var validacao = validarLinhaImportacaoInsumo(item);


if (validacao.status === "Pronto") {
  prontos++;
}

if (validacao.status === "Atenção") {
  atencoes++;
}

if (validacao.status === "Erro") {
  erros++;
}


});

var texto = total + " linha(s) carregada(s). " + prontos + " pronta(s), " + atencoes + " com atenção, " + erros + " com erro.";

if (erros > 0) {
texto += " Corrija as linhas com erro antes de importar.";
}

setText("importInsumosStatus", texto);
}

function confirmarImportacaoInsumos() {
if (!insumosImportacaoCache.length) {
mostrarMensagemInsumo("Carregue um CSV antes de importar.", "warning");
return;
}

insumosImportacaoCache = insumosImportacaoCache.map(normalizarInsumoSalvo);

var erros = insumosImportacaoCache.filter(function (item) {
return validarLinhaImportacaoInsumo(item).status === "Erro";
});

if (erros.length > 0) {
renderizarPreviewImportacaoInsumos();
atualizarStatusImportacaoInsumos();
mostrarMensagemInsumo("Existem linhas com erro. Corrija antes de importar.", "danger");
return;
}

var novos = 0;
var atualizados = 0;
var agora = new Date().toISOString();

insumosImportacaoCache.forEach(function (item) {
var existente = encontrarInsumoExistente(item);


if (existente) {
  var atualizado = Object.assign({}, existente, item, {
    id: existente.id,
    imagem: existente.imagem || "",
    criadoEm: existente.criadoEm || agora,
    atualizadoEm: agora
  });

  insumosCache = insumosCache.map(function (insumo) {
    return insumo.id === existente.id ? atualizado : insumo;
  });

  atualizados++;
} else {
  item.id = gerarIdInsumo();
  item.codigo = item.codigo || gerarCodigoInsumo();
  item.criadoEm = agora;
  item.atualizadoEm = agora;

  insumosCache.push(item);
  novos++;
}


});

salvarInsumosLocal();
renderizarInsumos();
limparImportacaoInsumos();

if (typeof closeDrawer === "function") {
closeDrawer();
}

mostrarMensagemInsumo("Importação concluída: " + novos + " novo(s), " + atualizados + " atualizado(s).", "success");
}

function limparImportacaoInsumos() {
insumosImportacaoCache = [];

var input = document.getElementById("importInsumosCsvFile");

if (input) {
input.value = "";
}

setText("importInsumosStatus", "Nenhum arquivo carregado.");
renderizarPreviewImportacaoInsumos();
}

function encontrarInsumoExistente(item) {
return insumosCache.find(function (insumo) {
var mesmoCodigo = item.codigo && insumo.codigo && normalizarTextoInsumo(item.codigo) === normalizarTextoInsumo(insumo.codigo);
var mesmoNome = item.nome && insumo.nome && normalizarTextoInsumo(item.nome) === normalizarTextoInsumo(insumo.nome);


return mesmoCodigo || mesmoNome;


});
}

function exportarInsumosCsv() {
if (!insumosCache.length) {
mostrarMensagemInsumo("Não há insumos para exportar.", "warning");
return;
}

var linhas = [];

linhas.push(BALU_INSUMOS_HEADERS.join(";"));

insumosCache.map(normalizarInsumoSalvo).forEach(function (item) {
linhas.push(csvLinhaInsumo([
item.codigo || "",
item.nome || "",
item.grupo || "",
item.unidadeCompra || "",
item.unidadeConsumo || "",
numeroExportInsumo(item.quantidadePorEmbalagem),
numeroExportInsumo(item.pesoEmbalagemGramas),
numeroExportInsumo(item.pesoBruto),
numeroExportInsumo(item.pesoLiquido),
item.fornecedor1 || "",
numeroExportInsumo(item.precoFornecedor1),
item.fornecedor2 || "",
numeroExportInsumo(item.precoFornecedor2),
item.fornecedor3 || "",
numeroExportInsumo(item.precoFornecedor3),
numeroExportInsumo(item.estoqueAtual),
numeroExportInsumo(item.estoqueMinimo),
numeroExportInsumo(item.estoqueIdeal),
item.tipoArmazenamento || "",
item.localArmazenamento || "",
item.posicaoArmazenamento || "",
item.validade || "",
item.lote || "",
item.marcaPreferida || "",
item.observacaoArmazenamento || "",
item.status || "Ativo",
item.observacoes || ""
]));
});

baixarArquivoTexto("balu-insumos-exportados.csv", "\ufeff" + linhas.join("\n"), "text/csv;charset=utf-8;");
mostrarMensagemInsumo("Dados exportados em CSV.", "success");
}

function parseCsvTexto(texto) {
var primeiraLinha = texto.split(/\r?\n/)[0] || "";
var qtdPontoVirgula = (primeiraLinha.match(/;/g) || []).length;
var qtdVirgula = (primeiraLinha.match(/,/g) || []).length;
var delimitador = qtdPontoVirgula >= qtdVirgula ? ";" : ",";

var linhas = [];
var linha = [];
var campo = "";
var dentroAspas = false;

for (var i = 0; i < texto.length; i++) {
var char = texto[i];
var proximo = texto[i + 1];


if (char === '"') {
  if (dentroAspas && proximo === '"') {
    campo = campo + '"';
    i++;
  } else {
    dentroAspas = !dentroAspas;
  }
} else if (char === delimitador && !dentroAspas) {
  linha.push(campo);
  campo = "";
} else if ((char === "\n" || char === "\r") && !dentroAspas) {
  if (char === "\r" && proximo === "\n") {
    i++;
  }

  linha.push(campo);
  campo = "";

  if (linha.some(function (valor) {
    return String(valor).trim() !== "";
  })) {
    linhas.push(linha);
  }

  linha = [];
} else {
  campo = campo + char;
}


}

if (campo !== "" || linha.length) {
linha.push(campo);


if (linha.some(function (valor) {
  return String(valor).trim() !== "";
})) {
  linhas.push(linha);
}


}

return linhas;
}

function csvLinhaInsumo(valores) {
return valores.map(function (valor) {
var texto = valor === null || valor === undefined ? "" : String(valor);


if (texto.indexOf('"') >= 0) {
  texto = texto.replace(/"/g, '""');
}

if (texto.indexOf(";") >= 0 || texto.indexOf("\n") >= 0 || texto.indexOf("\r") >= 0 || texto.indexOf('"') >= 0) {
  texto = '"' + texto + '"';
}

return texto;


}).join(";");
}

function baixarArquivoTexto(nomeArquivo, conteudo, tipo) {
var blob = new Blob([conteudo], { type: tipo || "text/plain;charset=utf-8;" });
var url = URL.createObjectURL(blob);
var link = document.createElement("a");

link.href = url;
link.download = nomeArquivo;

document.body.appendChild(link);
link.click();
document.body.removeChild(link);

URL.revokeObjectURL(url);
}

function getStatusFinalInsumo(insumo) {
if (insumo.status === "Inativo") {
return "Inativo";
}

return insumo.statusEstoque || insumo.status || "Ativo";
}

function normalizarInsumoSalvo(item) {
item = item || {};

var calculos = calcularInsumo({
unidadeCompra: item.unidadeCompra,
unidadeConsumo: item.unidadeConsumo || item.unidadeCompra,
quantidadePorEmbalagem: item.quantidadePorEmbalagem,
pesoEmbalagemGramas: item.pesoEmbalagemGramas || item.pesoLiquido || item.pesoBruto,
pesoBruto: item.pesoBruto,
pesoLiquido: item.pesoLiquido,
precoFornecedor1: item.precoFornecedor1,
precoFornecedor2: item.precoFornecedor2,
precoFornecedor3: item.precoFornecedor3,
estoqueAtual: item.estoqueAtual,
estoqueMinimo: item.estoqueMinimo,
estoqueIdeal: item.estoqueIdeal
});

return Object.assign({}, item, {
unidadeCompra: calculos.unidadeCompra || item.unidadeCompra || "",
unidadeConsumo: calculos.unidadeConsumo || item.unidadeConsumo || item.unidadeCompra || "",
quantidadePorEmbalagem: calculos.quantidadePorEmbalagem,
pesoEmbalagemGramas: calculos.pesoEmbalagemGramas,
pesoBruto: calculos.pesoBruto,
pesoLiquido: calculos.pesoLiquido,
precoFornecedor1: calculos.precoFornecedor1,
precoFornecedor2: calculos.precoFornecedor2,
precoFornecedor3: calculos.precoFornecedor3,
precoMedio: calculos.precoMedio,
precoMedioKg: calculos.precoMedioKg,
custoUnitario: calculos.custoUnitario,
estoqueAtual: calculos.estoqueAtual,
estoqueMinimo: calculos.estoqueMinimo,
estoqueIdeal: calculos.estoqueIdeal,
valorEstoque: calculos.valorEstoque,
statusEstoque: calculos.statusEstoque
});
}

function carregarInsumosLocal() {
try {
var texto = localStorage.getItem(BALU_INSUMOS_KEY);
var dados = texto ? JSON.parse(texto) : [];


if (!Array.isArray(dados)) {
  return [];
}

return dados.map(normalizarInsumoSalvo);


} catch (erro) {
console.error(erro);
return [];
}
}

function salvarInsumosLocal() {
localStorage.setItem(BALU_INSUMOS_KEY, JSON.stringify(insumosCache));
}

function getValue(id) {
var element = document.getElementById(id);

if (!element) {
return "";
}

return String(element.value || "").trim();
}

function setValue(id, valor) {
var element = document.getElementById(id);

if (!element) {
return;
}

element.value = valor === null || valor === undefined ? "" : valor;
}

function setText(id, valor) {
var element = document.getElementById(id);

if (!element) {
return;
}

if (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.tagName === "SELECT") {
element.value = valor === null || valor === undefined ? "" : valor;
} else {
element.textContent = valor === null || valor === undefined ? "" : valor;
}
}

function numeroInsumo(valor) {
if (valor === null || valor === undefined || valor === "") {
return 0;
}

if (typeof valor === "number") {
return isNaN(valor) ? 0 : valor;
}

var texto = String(valor)
.replace("R$", "")
.replace("%", "")
.replace(/\s/g, "")
.trim();

if (texto.indexOf(",") >= 0) {
texto = texto.replace(/\./g, "").replace(",", ".");
}

var numero = Number(texto);

return isNaN(numero) ? 0 : numero;
}

function numeroParaInputInsumo(valor) {
var numero = numeroInsumo(valor);

if (numero === 0) {
return "";
}

return String(numero).replace(",", ".");
}

function numeroExportInsumo(valor) {
return numeroInsumo(valor).toFixed(2).replace(".", ",");
}

function formatarMoedaInsumo(valor) {
return numeroInsumo(valor).toLocaleString("pt-BR", {
style: "currency",
currency: "BRL"
});
}

function formatarNumeroBRInsumo(valor, casas) {
return numeroInsumo(valor).toLocaleString("pt-BR", {
minimumFractionDigits: casas,
maximumFractionDigits: casas
});
}

function formatarPercentualInsumo(valor) {
return formatarNumeroBRInsumo(valor, 2) + "%";
}

function normalizarDataInsumo(valor) {
if (!valor) {
return "";
}

var texto = String(valor).trim();

if (texto.length === 10 && texto.charAt(4) === "-" && texto.charAt(7) === "-") {
return texto;
}

if (texto.length === 10 && texto.charAt(2) === "/" && texto.charAt(5) === "/") {
var partes = texto.split("/");
return partes[2] + "-" + partes[1] + "-" + partes[0];
}

return texto;
}

function formatarDataInsumo(valor) {
if (!valor) {
return "-";
}

var data = normalizarDataInsumo(valor);
var partes = String(data).substring(0, 10).split("-");

if (partes.length === 3) {
return partes[2] + "/" + partes[1] + "/" + partes[0];
}

return valor;
}

function limparTextoInsumo(valor) {
if (valor === null || valor === undefined) {
return "";
}

return String(valor).trim();
}

function normalizarTextoInsumo(valor) {
return limparTextoInsumo(valor)
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.replace(/[^a-z0-9]+/g, " ")
.trim();
}

function normalizarUnidadeInsumo(valor) {
var textoOriginal = limparTextoInsumo(valor);
var texto = normalizarTextoInsumo(valor);

if (!texto) {
return "";
}

if (["kg", "quilo", "quilos", "quilograma", "quilogramas"].indexOf(texto) >= 0) {
return "kg";
}

if (["g", "gr", "grama", "gramas"].indexOf(texto) >= 0) {
return "g";
}

if (["l", "lt", "litro", "litros"].indexOf(texto) >= 0) {
return "litro";
}

if (["ml", "mililitro", "mililitros"].indexOf(texto) >= 0) {
return "ml";
}

if (["un", "und", "unidade", "unidades"].indexOf(texto) >= 0) {
return "unidade";
}

if (["pct", "pacote", "pacotes"].indexOf(texto) >= 0) {
return "pacote";
}

if (["cx", "caixa", "caixas"].indexOf(texto) >= 0) {
return "caixa";
}

return textoOriginal;
}

function gerarIdInsumo() {
return "INS-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

function gerarCodigoInsumo() {
var numero = insumosCache.length + 1;
return "INS-" + String(numero).padStart(4, "0");
}

function mostrarMensagemInsumo(mensagem, tipo) {
if (typeof showToast === "function") {
showToast(mensagem, tipo || "info");
return;
}

alert(mensagem);
}

function converterImagemParaBase64(file) {
return new Promise(function (resolve, reject) {
var reader = new FileReader();


reader.onload = function (event) {
  resolve(event.target.result);
};

reader.onerror = function () {
  reject(new Error("Erro ao converter imagem."));
};

reader.readAsDataURL(file);


});
}

function renderThumbInsumo(imagem, nome) {
var inicial = String(nome || "I").charAt(0).toUpperCase();

if (imagem) {
return "<img class='product-thumb' src='" + imagem + "' alt='" + escapeAttr(nome) + "'>";
}

return "<div class='product-thumb placeholder'>" + escapeHtml(inicial) + "</div>";
}

function badgeStatusInsumo(status) {
var texto = String(status || "Ativo");
var classe = "neutral";
var lower = texto.toLowerCase();

if (lower.indexOf("ok") >= 0 || lower.indexOf("ativo") >= 0 || lower.indexOf("pronto") >= 0) {
classe = "success";
}

if (lower.indexOf("atenção") >= 0 || lower.indexOf("atencao") >= 0 || lower.indexOf("baixo") >= 0) {
classe = "warning";
}

if (lower.indexOf("crítico") >= 0 || lower.indexOf("critico") >= 0 || lower.indexOf("inativo") >= 0 || lower.indexOf("erro") >= 0) {
classe = "danger";
}

return "<span class='badge " + classe + "'>" + escapeHtml(texto) + "</span>";
}

function escapeHtml(valor) {
if (valor === null || valor === undefined) {
return "";
}

return String(valor)
.replace(/&/g, String.fromCharCode(38) + "amp;")
.replace(/</g, String.fromCharCode(38) + "lt;")
.replace(/>/g, String.fromCharCode(38) + "gt;")
.replace(/"/g, String.fromCharCode(38) + "quot;")
.replace(/'/g, String.fromCharCode(38) + "#039;");
}

function escapeAttr(valor) {
return escapeHtml(valor).replace(/`/g, String.fromCharCode(38) + "#096;");
}

function criarIconesInsumo() {
if (window.lucide) {
lucide.createIcons();
}
}

function garantirDrawerBasico() {
if (typeof window.openDrawer !== "function") {
window.openDrawer = function (id) {
document.querySelectorAll(".drawer").forEach(function (drawer) {
drawer.classList.remove("is-open", "open", "active");
});


  var drawerAtual = document.getElementById(id);

  if (drawerAtual) {
    drawerAtual.classList.add("is-open");
  }
};


}

if (typeof window.closeDrawer !== "function") {
window.closeDrawer = function () {
document.querySelectorAll(".drawer").forEach(function (drawer) {
drawer.classList.remove("is-open", "open", "active");
});
};
}
}

// =====================================================
// BALU FOOD - ALERTA DE ESTOQUE BAIXO DOS INSUMOS
// Card amarelo + drawer lateral com itens em atenção
// =====================================================

document.addEventListener("DOMContentLoaded", function () {
setTimeout(function () {
iniciarAlertaEstoqueInsumos();
}, 600);
});

function iniciarAlertaEstoqueInsumos() {
garantirDrawerAlertaEstoqueInsumos();
prepararCardAlertaEstoqueInsumos();
conectarAlertaComRenderInsumos();
atualizarAlertaCardInsumos();
}

function prepararCardAlertaEstoqueInsumos() {
var numeroCard = document.getElementById("insumosEstoqueBaixo");

if (!numeroCard) {
return;
}

var card = numeroCard.closest(".cadastro-summary-card");

if (!card) {
return;
}

card.classList.add("summary-clickable");
card.setAttribute("role", "button");
card.setAttribute("tabindex", "0");
card.setAttribute("title", "Clique para ver os insumos que precisam de reposição");

if (!card.querySelector(".summary-alert-hint")) {
var hint = document.createElement("small");
hint.className = "summary-alert-hint";
hint.textContent = "Tudo certo no estoque";
card.appendChild(hint);
}

if (card.dataset.alertaEstoqueBind === "true") {
return;
}

card.dataset.alertaEstoqueBind = "true";

card.addEventListener("click", function () {
abrirDrawerAlertaEstoqueInsumos();
});

card.addEventListener("keydown", function (event) {
if (event.key === "Enter" || event.key === " ") {
event.preventDefault();
abrirDrawerAlertaEstoqueInsumos();
}
});
}

function conectarAlertaComRenderInsumos() {
var funcoes = [
"renderResumoInsumos",
"renderizarResumoInsumos",
"renderInsumos",
"renderizarInsumos"
];

funcoes.forEach(function (nomeFuncao) {
var original = window[nomeFuncao];


if (typeof original !== "function") {
  return;
}

if (original.__alertaEstoqueInsumosAtivo === true) {
  return;
}

var novaFuncao = function () {
  var retorno = original.apply(this, arguments);

  setTimeout(function () {
    atualizarAlertaCardInsumos();
  }, 50);

  return retorno;
};

novaFuncao.__alertaEstoqueInsumosAtivo = true;

window[nomeFuncao] = novaFuncao;

});
}

function atualizarAlertaCardInsumos() {
var numeroCard = document.getElementById("insumosEstoqueBaixo");
var textoCard = document.getElementById("textoInsumosEstoqueBaixo");
var card = document.getElementById("cardInsumosEstoqueBaixo");

if (!numeroCard) {
return;
}

if (!card) {
card = numeroCard.closest(".cadastro-summary-card");
}

if (!card) {
return;
}

var lista = obterInsumosComAlertaEstoque();

var criticos = lista.filter(function (item) {
var status = normalizarTextoAlertaInsumo(item.statusAlerta || "");
return status.indexOf("critico") >= 0;
}).length;

var atencao = lista.filter(function (item) {
var status = normalizarTextoAlertaInsumo(item.statusAlerta || "");
return status.indexOf("atencao") >= 0 || status.indexOf("estoque baixo") >= 0;
}).length;

var total = lista.length;

numeroCard.textContent = total;

card.classList.remove(
"summary-alert-warning",
"summary-alert-danger",
"summary-alert-critical",
"summary-stock-ok",
"insumos-stock-ok",
"insumos-stock-warning",
"insumos-stock-danger"
);

card.classList.add("summary-clickable");
card.classList.add("insumos-stock-card");

if (criticos > 0) {
card.classList.add("insumos-stock-danger");


if (textoCard) {
  textoCard.textContent = criticos + " item(ns) crítico(s)" + (atencao > 0 ? " e " + atencao + " em atenção" : "");
}

return;


}

if (atencao > 0) {
card.classList.add("insumos-stock-warning");


if (textoCard) {
  textoCard.textContent = atencao + " item(ns) precisam de reposição";
}

return;


}

card.classList.add("insumos-stock-ok");

if (textoCard) {
textoCard.textContent = "Nenhum item em atenção";
}
}


function obterInsumosComAlertaEstoque() {
var lista = obterListaInsumosAlerta();

return lista.filter(function (item) {
if (!item) {
return false;
}


if (item.status === "Inativo") {
  return false;
}

var status = obterStatusAlertaInsumo(item);
var statusNormalizado = normalizarTextoAlertaInsumo(status);

return (
  statusNormalizado.indexOf("atencao") >= 0 ||
  statusNormalizado.indexOf("critico") >= 0 ||
  statusNormalizado.indexOf("estoque baixo") >= 0
);


}).map(function (item) {
return normalizarItemAlertaEstoque(item);
});
}

function obterListaInsumosAlerta() {
if (Array.isArray(window.insumosCache)) {
return window.insumosCache;
}

try {
var texto = localStorage.getItem("balu_insumos");
var dados = texto ? JSON.parse(texto) : [];


return Array.isArray(dados) ? dados : [];


} catch (erro) {
return [];
}
}

function normalizarItemAlertaEstoque(item) {
var estoqueAtual = numeroAlertaInsumo(item.estoqueAtual);
var estoqueMinimo = numeroAlertaInsumo(item.estoqueMinimo);
var estoqueIdeal = numeroAlertaInsumo(item.estoqueIdeal);
var precoMedioKg = numeroAlertaInsumo(item.precoMedioKg);
var custoUnitario = numeroAlertaInsumo(item.custoUnitario);
var precoMedio = numeroAlertaInsumo(item.precoMedio);
var unidade = normalizarUnidadeInsumo(item.unidadeConsumo || item.unidadeCompra || "");

var faltaParaIdeal = 0;

if (estoqueIdeal > estoqueAtual) {
faltaParaIdeal = estoqueIdeal - estoqueAtual;
} else if (estoqueMinimo > estoqueAtual) {
faltaParaIdeal = estoqueMinimo - estoqueAtual;
}

var valorReposicao = 0;

if (unidade === "g" && precoMedioKg > 0) {
valorReposicao = (faltaParaIdeal / 1000) * precoMedioKg;
} else if (unidade === "kg" && precoMedioKg > 0) {
valorReposicao = faltaParaIdeal * precoMedioKg;
} else if (unidade === "unidade") {
valorReposicao = faltaParaIdeal * (custoUnitario || precoMedio);
} else {
valorReposicao = faltaParaIdeal * (custoUnitario || precoMedio || precoMedioKg);
}

return Object.assign({}, item, {
estoqueAtualAlerta: estoqueAtual,
estoqueMinimoAlerta: estoqueMinimo,
estoqueIdealAlerta: estoqueIdeal,
faltaParaIdealAlerta: faltaParaIdeal,
valorReposicaoAlerta: valorReposicao,
statusAlerta: obterStatusAlertaInsumo(item),
unidadeAlerta: unidade
});
}

function obterStatusAlertaInsumo(item) {
if (item.status === "Inativo") {
return "Inativo";
}

if (item.statusEstoque) {
return item.statusEstoque;
}

var estoqueAtual = numeroAlertaInsumo(item.estoqueAtual);
var estoqueMinimo = numeroAlertaInsumo(item.estoqueMinimo);
var estoqueIdeal = numeroAlertaInsumo(item.estoqueIdeal);

if (estoqueAtual <= 0) {
return "Crítico";
}

if (estoqueMinimo > 0 && estoqueAtual <= estoqueMinimo) {
return "Crítico";
}

if (estoqueIdeal > 0 && estoqueAtual < estoqueIdeal) {
return "Atenção";
}

return "Estoque ok";
}

function garantirDrawerAlertaEstoqueInsumos() {
if (document.getElementById("drawerAlertaEstoqueInsumos")) {
return;
}

var drawer = document.createElement("aside");
drawer.className = "drawer drawer-wide";
drawer.id = "drawerAlertaEstoqueInsumos";

drawer.innerHTML =
"<div class='drawer-header'>" +
"<div>" +
"<h2>Alerta de estoque baixo</h2>" +
"<p>Itens que estão em atenção, críticos ou abaixo do estoque ideal.</p>" +
"</div>" +
"<button type='button' class='drawer-close' onclick='closeDrawer()'>&times;</button>" +
"</div>" +
"<div class='drawer-body'>" +
"<div id='alertaEstoqueInsumosConteudo'>" +
"<p class='text-muted'>Nenhum alerta carregado.</p>" +
"</div>" +
"</div>" +
"<div class='drawer-footer'>" +
"<button type='button' class='btn btn-outline' onclick='closeDrawer()'>Fechar</button>" +
"</div>";

document.body.appendChild(drawer);
}

function abrirDrawerAlertaEstoqueInsumos() {
renderizarDrawerAlertaEstoqueInsumos();

if (typeof openDrawer === "function") {
openDrawer("drawerAlertaEstoqueInsumos");
}
}

function renderizarDrawerAlertaEstoqueInsumos() {
var conteudo = document.getElementById("alertaEstoqueInsumosConteudo");

if (!conteudo) {
return;
}

var lista = obterInsumosComAlertaEstoque();

if (!lista.length) {
conteudo.innerHTML =
"<div class='empty-state-alert'>" +
"<strong>Nenhum insumo com estoque baixo.</strong>" +
"<p class='text-muted'>Todos os itens estão dentro do estoque ideal no momento.</p>" +
"</div>";


return;


}

var criticos = lista.filter(function (item) {
return normalizarTextoAlertaInsumo(item.statusAlerta).indexOf("critico") >= 0;
}).length;

var atencao = lista.length - criticos;

conteudo.innerHTML =
"<div class='alert-stock-summary'>" +
"<div>" +
"<span>Total em alerta</span>" +
"<strong>" + lista.length + "</strong>" +
"</div>" +
"<div>" +
"<span>Críticos</span>" +
"<strong>" + criticos + "</strong>" +
"</div>" +
"<div>" +
"<span>Em atenção</span>" +
"<strong>" + atencao + "</strong>" +
"</div>" +
"</div>" +
"<div class='alert-stock-list'>" +
lista.map(function (item) {
return montarCardAlertaEstoqueInsumo(item);
}).join("") +
"</div>";

document.querySelectorAll(".btn-editar-alerta-insumo").forEach(function (botao) {
botao.addEventListener("click", function () {
var id = botao.getAttribute("data-insumo-id");


  if (!id) {
    return;
  }

  if (typeof closeDrawer === "function") {
    closeDrawer();
  }

  setTimeout(function () {
    if (typeof editarInsumo === "function") {
      editarInsumo(id);
    }
  }, 150);
});


});

criarIconesAlertaInsumos();
}

function montarCardAlertaEstoqueInsumo(item) {
var unidade = item.unidadeAlerta || "";
var falta = item.faltaParaIdealAlerta || 0;
var status = item.statusAlerta || "Atenção";

return "<div class='alert-stock-item'>" +
"<div class='alert-stock-item-main'>" +
"<div>" +
"<strong>" + escapeHtmlAlertaInsumo(item.nome || "-") + "</strong>" +
"<span>" + escapeHtmlAlertaInsumo(item.grupo || "Sem grupo") + " • " + escapeHtmlAlertaInsumo(item.codigo || "Sem código") + "</span>" +
"</div>" +
badgeAlertaStatusInsumo(status) +
"</div>" +


"<div class='alert-stock-grid'>" +
  itemAlertaInfo("Estoque atual", formatarNumeroAlertaInsumo(item.estoqueAtualAlerta, 2) + " " + unidade) +
  itemAlertaInfo("Estoque mínimo", formatarNumeroAlertaInsumo(item.estoqueMinimoAlerta, 2) + " " + unidade) +
  itemAlertaInfo("Estoque ideal", formatarNumeroAlertaInsumo(item.estoqueIdealAlerta, 2) + " " + unidade) +
  itemAlertaInfo("Falta repor", formatarNumeroAlertaInsumo(falta, 2) + " " + unidade) +
  itemAlertaInfo("Preço/kg", formatarMoedaAlertaInsumo(item.precoMedioKg)) +
  itemAlertaInfo("Valor estimado", item.valorReposicaoAlerta > 0 ? formatarMoedaAlertaInsumo(item.valorReposicaoAlerta) : "Não calculado") +
"</div>" +

"<div class='alert-stock-actions'>" +
  "<button type='button' class='btn btn-outline btn-editar-alerta-insumo' data-insumo-id='" + escapeAttrAlertaInsumo(item.id || "") + "'>" +
    "<i data-lucide='edit-3'></i>" +
    "Editar insumo" +
  "</button>" +
"</div>" +


"</div>";
}

function itemAlertaInfo(label, valor) {
return "<div class='alert-stock-info'>" +
"<span>" + escapeHtmlAlertaInsumo(label) + "</span>" +
"<strong>" + escapeHtmlAlertaInsumo(valor) + "</strong>" +
"</div>";
}

function badgeAlertaStatusInsumo(status) {
var texto = String(status || "Atenção");
var normalizado = normalizarTextoAlertaInsumo(texto);
var classe = "warning";

if (normalizado.indexOf("critico") >= 0) {
classe = "danger";
}

return "<span class='badge " + classe + "'>" + escapeHtmlAlertaInsumo(texto) + "</span>";
}

function numeroAlertaInsumo(valor) {
if (typeof numeroInsumo === "function") {
return numeroInsumo(valor);
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
.replace(/\s/g, "")
.trim();

if (texto.indexOf(",") >= 0) {
texto = texto.replace(/\./g, "").replace(",", ".");
}

var numero = Number(texto);

return isNaN(numero) ? 0 : numero;
}

function formatarMoedaAlertaInsumo(valor) {
return numeroAlertaInsumo(valor).toLocaleString("pt-BR", {
style: "currency",
currency: "BRL"
});
}

function formatarNumeroAlertaInsumo(valor, casas) {
return numeroAlertaInsumo(valor).toLocaleString("pt-BR", {
minimumFractionDigits: casas,
maximumFractionDigits: casas
});
}

function normalizarTextoAlertaInsumo(valor) {
return String(valor || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();
}

function escapeHtmlAlertaInsumo(valor) {
if (typeof escapeHtml === "function") {
return escapeHtml(valor);
}

if (valor === null || valor === undefined) {
return "";
}

return String(valor)
.replace(/&/g, String.fromCharCode(38) + "amp;")
.replace(/</g, String.fromCharCode(38) + "lt;")
.replace(/>/g, String.fromCharCode(38) + "gt;")
.replace(/"/g, String.fromCharCode(38) + "quot;")
.replace(/'/g, String.fromCharCode(38) + "#039;");
}

function escapeAttrAlertaInsumo(valor) {
return escapeHtmlAlertaInsumo(valor).replace(/`/g, String.fromCharCode(38) + "#096;");
}

function criarIconesAlertaInsumos() {
if (window.lucide) {
lucide.createIcons();
}
}

// =====================================================
// BALU FOOD - ALERTA DE ESTOQUE EM TABELA + EXPORTAR CSV
// Substitui a lista do drawer por tabela exportável
// =====================================================

function renderizarDrawerAlertaEstoqueInsumos() {
var conteudo = document.getElementById("alertaEstoqueInsumosConteudo");

if (!conteudo) {
return;
}

var lista = obterInsumosComAlertaEstoque();

if (!lista.length) {
conteudo.innerHTML =
"<div class='alert-stock-topbar'>" +
"<div>" +
"<h3>Lista de reposição</h3>" +
"<p>Nenhum insumo precisa de reposição no momento.</p>" +
"</div>" +
"<button type='button' class='btn btn-outline' disabled>" +
"<i data-lucide='download'></i>" +
"Exportar CSV" +
"</button>" +
"</div>" +
"<div class='empty-state-alert'>" +
"<strong>Nenhum insumo com estoque baixo.</strong>" +
"<p class='text-muted'>Todos os itens estão dentro do estoque ideal no momento.</p>" +
"</div>";


criarIconesAlertaInsumos();
return;


}

var criticos = lista.filter(function (item) {
return normalizarTextoAlertaInsumo(item.statusAlerta).indexOf("critico") >= 0;
}).length;

var atencao = lista.length - criticos;

conteudo.innerHTML =
"<div class='alert-stock-topbar'>" +
"<div>" +
"<h3>Lista de reposição</h3>" +
"<p>Confira os insumos em atenção e exporte a planilha para compra ou conferência.</p>" +
"</div>" +
"<button type='button' class='btn btn-primary' id='btnExportarCsvAlertaInsumos'>" +
"<i data-lucide='download'></i>" +
"Exportar CSV" +
"</button>" +
"</div>" +


"<div class='alert-stock-summary'>" +
  "<div>" +
    "<span>Total em alerta</span>" +
    "<strong>" + lista.length + "</strong>" +
  "</div>" +
  "<div>" +
    "<span>Críticos</span>" +
    "<strong>" + criticos + "</strong>" +
  "</div>" +
  "<div>" +
    "<span>Em atenção</span>" +
    "<strong>" + atencao + "</strong>" +
  "</div>" +
"</div>" +

"<div class='alert-stock-table-wrap'>" +
  "<table class='data-table alert-stock-table'>" +
    "<thead>" +
      "<tr>" +
        "<th>Código</th>" +
        "<th>Insumo</th>" +
        "<th>Grupo</th>" +
        "<th>Unidade</th>" +
        "<th>Estoque atual</th>" +
        "<th>Mínimo</th>" +
        "<th>Ideal</th>" +
        "<th>Falta repor</th>" +
        "<th>Preço/kg</th>" +
        "<th>Valor estimado</th>" +
        "<th>Status</th>" +
        "<th>Ação</th>" +
      "</tr>" +
    "</thead>" +
    "<tbody>" +
      lista.map(function (item) {
        return montarLinhaTabelaAlertaEstoqueInsumo(item);
      }).join("") +
    "</tbody>" +
  "</table>" +
"</div>";


var btnExportar = document.getElementById("btnExportarCsvAlertaInsumos");

if (btnExportar) {
btnExportar.addEventListener("click", function () {
exportarCsvAlertaEstoqueInsumos();
});
}

document.querySelectorAll(".btn-editar-alerta-insumo").forEach(function (botao) {
botao.addEventListener("click", function () {
var id = botao.getAttribute("data-insumo-id");


  if (!id) {
    return;
  }

  if (typeof closeDrawer === "function") {
    closeDrawer();
  }

  setTimeout(function () {
    if (typeof editarInsumo === "function") {
      editarInsumo(id);
    }
  }, 150);
});


});

criarIconesAlertaInsumos();
}

function montarLinhaTabelaAlertaEstoqueInsumo(item) {
var unidade = item.unidadeAlerta || "";
var falta = item.faltaParaIdealAlerta || 0;
var status = item.statusAlerta || "Atenção";
var valorEstimado = item.valorReposicaoAlerta > 0 ? formatarMoedaAlertaInsumo(item.valorReposicaoAlerta) : "Não calculado";

return "<tr>" +
"<td>" + escapeHtmlAlertaInsumo(item.codigo || "-") + "</td>" +
"<td><strong>" + escapeHtmlAlertaInsumo(item.nome || "-") + "</strong></td>" +
"<td>" + escapeHtmlAlertaInsumo(item.grupo || "-") + "</td>" +
"<td>" + escapeHtmlAlertaInsumo(unidade || "-") + "</td>" +
"<td>" + formatarNumeroAlertaInsumo(item.estoqueAtualAlerta, 2) + "</td>" +
"<td>" + formatarNumeroAlertaInsumo(item.estoqueMinimoAlerta, 2) + "</td>" +
"<td>" + formatarNumeroAlertaInsumo(item.estoqueIdealAlerta, 2) + "</td>" +
"<td><strong>" + formatarNumeroAlertaInsumo(falta, 2) + "</strong></td>" +
"<td>" + formatarMoedaAlertaInsumo(item.precoMedioKg) + "</td>" +
"<td><strong>" + escapeHtmlAlertaInsumo(valorEstimado) + "</strong></td>" +
"<td>" + badgeAlertaStatusInsumo(status) + "</td>" +
"<td>" +
"<button type='button' class='btn-icon btn-editar-alerta-insumo' title='Editar insumo' data-insumo-id='" + escapeAttrAlertaInsumo(item.id || "") + "'>" +
"<i data-lucide='edit-3'></i>" +
"</button>" +
"</td>" +
"</tr>";
}

function exportarCsvAlertaEstoqueInsumos() {
var lista = obterInsumosComAlertaEstoque();

if (!lista.length) {
mostrarMensagemAlertaInsumos("Nenhum insumo em alerta para exportar.", "warning");
return;
}

var linhas = [];

linhas.push([
"Codigo",
"Nome",
"Grupo",
"Unidade",
"EstoqueAtual",
"EstoqueMinimo",
"EstoqueIdeal",
"FaltaRepor",
"PrecoMedioKg",
"CustoUnitario",
"ValorEstimadoReposicao",
"Status",
"Fornecedor1",
"PrecoFornecedor1",
"Fornecedor2",
"PrecoFornecedor2",
"Fornecedor3",
"PrecoFornecedor3",
"LocalArmazenamento",
"PosicaoArmazenamento",
"Validade",
"Lote"
].join(";"));

lista.forEach(function (item) {
linhas.push(csvLinhaAlertaEstoqueInsumos([
item.codigo || "",
item.nome || "",
item.grupo || "",
item.unidadeAlerta || "",
numeroExportAlertaInsumo(item.estoqueAtualAlerta),
numeroExportAlertaInsumo(item.estoqueMinimoAlerta),
numeroExportAlertaInsumo(item.estoqueIdealAlerta),
numeroExportAlertaInsumo(item.faltaParaIdealAlerta),
numeroExportAlertaInsumo(item.precoMedioKg),
numeroExportAlertaInsumo(item.custoUnitario),
numeroExportAlertaInsumo(item.valorReposicaoAlerta),
item.statusAlerta || "",
item.fornecedor1 || "",
numeroExportAlertaInsumo(item.precoFornecedor1),
item.fornecedor2 || "",
numeroExportAlertaInsumo(item.precoFornecedor2),
item.fornecedor3 || "",
numeroExportAlertaInsumo(item.precoFornecedor3),
item.localArmazenamento || "",
item.posicaoArmazenamento || "",
item.validade || "",
item.lote || ""
]));
});

baixarArquivoAlertaEstoqueTexto(
"balu-insumos-para-repor.csv",
"\ufeff" + linhas.join("\n"),
"text/csv;charset=utf-8;"
);

mostrarMensagemAlertaInsumos("CSV de reposição exportado com sucesso.", "success");
}

function csvLinhaAlertaEstoqueInsumos(valores) {
return valores.map(function (valor) {
var texto = valor === null || valor === undefined ? "" : String(valor);


if (texto.indexOf('"') >= 0) {
  texto = texto.replace(/"/g, '""');
}

if (
  texto.indexOf(";") >= 0 ||
  texto.indexOf("\n") >= 0 ||
  texto.indexOf("\r") >= 0 ||
  texto.indexOf('"') >= 0
) {
  texto = '"' + texto + '"';
}

return texto;


}).join(";");
}

function numeroExportAlertaInsumo(valor) {
return numeroAlertaInsumo(valor).toFixed(2).replace(".", ",");
}

function baixarArquivoAlertaEstoqueTexto(nomeArquivo, conteudo, tipo) {
if (typeof baixarArquivoTexto === "function") {
baixarArquivoTexto(nomeArquivo, conteudo, tipo);
return;
}

var blob = new Blob([conteudo], { type: tipo || "text/plain;charset=utf-8;" });
var url = URL.createObjectURL(blob);
var link = document.createElement("a");

link.href = url;
link.download = nomeArquivo;

document.body.appendChild(link);
link.click();
document.body.removeChild(link);

URL.revokeObjectURL(url);
}

function mostrarMensagemAlertaInsumos(mensagem, tipo) {
if (typeof mostrarMensagemInsumo === "function") {
mostrarMensagemInsumo(mensagem, tipo || "info");
return;
}

if (typeof showToast === "function") {
showToast(mensagem, tipo || "info");
return;
}

alert(mensagem);
}


function numeroSeguro(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return 0;
  }

  if (typeof valor === "number") {
    return isNaN(valor) ? 0 : valor;
  }

  var texto = String(valor)
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "")
    .trim();

  var numero = parseFloat(texto);
  return isNaN(numero) ? 0 : numero;
}

function obterStatusEstoqueInsumo(insumo) {
  var estoqueAtual = numeroSeguro(insumo.estoqueAtual || insumo.estoque || 0);
  var estoqueMinimo = numeroSeguro(insumo.estoqueMinimo || 0);
  var estoqueIdeal = numeroSeguro(insumo.estoqueIdeal || 0);

  if (estoqueAtual <= estoqueMinimo && estoqueMinimo > 0) {
    return "critico";
  }

  if (estoqueAtual < estoqueIdeal && estoqueIdeal > 0) {
    return "atencao";
  }

  return "ok";
}

function obterInsumosComAlertaEstoque() {
  if (!Array.isArray(window.listaInsumos)) {
    return [];
  }

  window.listaInsumos = [
  {
    id: 1,
    codigo: "INS-001",
    nome: "Farinha de trigo",
    grupo: "Secos",
    unidade: "g",
    estoqueAtual: 7000,
    estoqueMinimo: 5000,
    estoqueIdeal: 10000
  }
];

document.addEventListener("DOMContentLoaded", function () {
  iniciarCliqueCardEstoqueBaixo();
  atualizarCardInsumosEstoqueBaixo();
});

  if (!card || !totalEl || !textoEl) {
    return;
  }

  var listaAlertas = obterInsumosComAlertaEstoque();

  var criticos = listaAlertas.filter(function (item) {
    return item.status === "critico";
  }).length;

  var atencao = listaAlertas.filter(function (item) {
    return item.status === "atencao";
  }).length;

  var total = listaAlertas.length;

  card.classList.remove("status-ok", "status-warning", "status-danger");

  totalEl.textContent = total;

  if (criticos > 0) {
    card.classList.add("status-danger");
    textoEl.textContent =
      criticos + " item(ns) em nível crítico" +
      (atencao > 0 ? " e " + atencao + " em atenção" : "");
  } else if (atencao > 0) {
    card.classList.add("status-warning");
    textoEl.textContent = atencao + " item(ns) precisam de reposição";
  } else {
    card.classList.add("status-ok");
    textoEl.textContent = "Nenhum item em atenção";
  }
}

function iniciarCliqueCardEstoqueBaixo() {
  var card = document.getElementById("cardInsumosEstoqueBaixo");

  if (!card) {
    return;
  }

  card.addEventListener("click", function () {
    if (typeof abrirDrawerAlertaEstoqueInsumos === "function") {
      abrirDrawerAlertaEstoqueInsumos();
      return;
    }

    if (typeof openDrawer === "function") {
      openDrawer("drawerAlertaEstoqueInsumos");
      return;
    }

    alert("Abrir pop-up lateral de estoque baixo.");
  });
}

// =====================================================
// BALU FOOD - FIX FINAL DO CARD ESTOQUE BAIXO
// Lê os insumos reais do sistema: insumosCache + localStorage
// Verde = ok | Amarelo = atenção | Vermelho = crítico
// =====================================================

function baluNumeroEstoque(valor) {
if (valor === null || valor === undefined || valor === "") {
return 0;
}

if (typeof valor === "number") {
return isNaN(valor) ? 0 : valor;
}

var texto = String(valor)
.replace("R$", "")
.replace("%", "")
.replace(/\s/g, "")
.trim();

if (texto.indexOf(",") >= 0) {
texto = texto.replace(/\./g, "").replace(",", ".");
}

var numero = Number(texto);

return isNaN(numero) ? 0 : numero;
}

function baluNormalizarTextoEstoque(valor) {
return String(valor || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();
}

function baluObterListaRealInsumos() {
if (typeof insumosCache !== "undefined" && Array.isArray(insumosCache)) {
return insumosCache;
}

try {
var texto = localStorage.getItem("balu_insumos");
var dados = texto ? JSON.parse(texto) : [];


if (Array.isArray(dados)) {
  return dados;
}

return [];


} catch (erro) {
return [];
}
}

function baluCalcularStatusEstoqueReal(insumo) {
if (!insumo) {
return "Estoque ok";
}

if (insumo.status === "Inativo") {
return "Inativo";
}

var estoqueAtual = baluNumeroEstoque(insumo.estoqueAtual);
var estoqueMinimo = baluNumeroEstoque(insumo.estoqueMinimo);
var estoqueIdeal = baluNumeroEstoque(insumo.estoqueIdeal);

if (estoqueAtual <= 0) {
return "Crítico";
}

if (estoqueMinimo > 0 && estoqueAtual <= estoqueMinimo) {
return "Crítico";
}

if (estoqueIdeal > 0 && estoqueAtual < estoqueIdeal) {
return "Atenção";
}

var statusSalvo = baluNormalizarTextoEstoque(insumo.statusEstoque || insumo.status || "");

if (statusSalvo.indexOf("critico") >= 0) {
return "Crítico";
}

if (statusSalvo.indexOf("atencao") >= 0 || statusSalvo.indexOf("estoque baixo") >= 0) {
return "Atenção";
}

return "Estoque ok";
}

function obterInsumosComAlertaEstoque() {
var lista = baluObterListaRealInsumos();

return lista
.filter(function (insumo) {
if (!insumo) {
return false;
}


  if (insumo.status === "Inativo") {
    return false;
  }

  var status = baluCalcularStatusEstoqueReal(insumo);
  var statusNormalizado = baluNormalizarTextoEstoque(status);

  return (
    statusNormalizado.indexOf("atencao") >= 0 ||
    statusNormalizado.indexOf("critico") >= 0 ||
    statusNormalizado.indexOf("estoque baixo") >= 0
  );
})
.map(function (insumo) {
  var estoqueAtual = baluNumeroEstoque(insumo.estoqueAtual);
  var estoqueMinimo = baluNumeroEstoque(insumo.estoqueMinimo);
  var estoqueIdeal = baluNumeroEstoque(insumo.estoqueIdeal);
  var precoMedioKg = baluNumeroEstoque(insumo.precoMedioKg);
  var custoUnitario = baluNumeroEstoque(insumo.custoUnitario);
  var precoMedio = baluNumeroEstoque(insumo.precoMedio);
  var unidade = insumo.unidadeConsumo || insumo.unidadeCompra || "";

  var faltaParaIdeal = 0;

  if (estoqueIdeal > estoqueAtual) {
    faltaParaIdeal = estoqueIdeal - estoqueAtual;
  } else if (estoqueMinimo > estoqueAtual) {
    faltaParaIdeal = estoqueMinimo - estoqueAtual;
  }

  var valorReposicao = 0;

  if (unidade === "unidade") {
    valorReposicao = faltaParaIdeal * (custoUnitario || precoMedio);
  } else if (precoMedioKg > 0) {
    valorReposicao = (faltaParaIdeal / 1000) * precoMedioKg;
  }

  return Object.assign({}, insumo, {
    estoqueAtualAlerta: estoqueAtual,
    estoqueMinimoAlerta: estoqueMinimo,
    estoqueIdealAlerta: estoqueIdeal,
    faltaParaIdealAlerta: faltaParaIdeal,
    valorReposicaoAlerta: valorReposicao,
    statusAlerta: baluCalcularStatusEstoqueReal(insumo),
    unidadeAlerta: unidade
  });
});


}

function atualizarAlertaCardInsumos() {
var numeroCard = document.getElementById("insumosEstoqueBaixo");
var textoCard = document.getElementById("textoInsumosEstoqueBaixo");
var card = document.getElementById("cardInsumosEstoqueBaixo");

if (!numeroCard || !card) {
return;
}

var lista = obterInsumosComAlertaEstoque();

var criticos = lista.filter(function (item) {
var status = baluNormalizarTextoEstoque(item.statusAlerta || "");
return status.indexOf("critico") >= 0;
}).length;

var atencao = lista.filter(function (item) {
var status = baluNormalizarTextoEstoque(item.statusAlerta || "");
return status.indexOf("atencao") >= 0 || status.indexOf("estoque baixo") >= 0;
}).length;

var total = lista.length;

numeroCard.textContent = total;

card.classList.remove(
"summary-alert-warning",
"summary-alert-danger",
"summary-alert-critical",
"summary-stock-ok",
"insumos-stock-ok",
"insumos-stock-warning",
"insumos-stock-danger"
);

card.classList.add("summary-clickable");
card.classList.add("insumos-stock-card");

if (criticos > 0) {
card.classList.add("insumos-stock-danger");


if (textoCard) {
  textoCard.textContent = criticos + " item(ns) crítico(s)" + (atencao > 0 ? " e " + atencao + " em atenção" : "");
}

return;


}

if (atencao > 0) {
card.classList.add("insumos-stock-warning");


if (textoCard) {
  textoCard.textContent = atencao + " item(ns) precisam de reposição";
}

return;


}

card.classList.add("insumos-stock-ok");

if (textoCard) {
textoCard.textContent = "Nenhum item em atenção";
}
}

function baluIniciarFixCardEstoqueBaixo() {
var card = document.getElementById("cardInsumosEstoqueBaixo");

if (card && card.dataset.baluFixClick !== "true") {
card.dataset.baluFixClick = "true";


card.addEventListener("click", function () {
  if (typeof abrirDrawerAlertaEstoqueInsumos === "function") {
    abrirDrawerAlertaEstoqueInsumos();
    return;
  }

  if (typeof openDrawer === "function") {
    openDrawer("drawerAlertaEstoqueInsumos");
  }
});


}

atualizarAlertaCardInsumos();
}

(function () {
var renderOriginal = window.renderizarInsumos;

if (typeof renderOriginal === "function" && renderOriginal.__baluFixCardEstoque !== true) {
window.renderizarInsumos = function () {
var retorno = renderOriginal.apply(this, arguments);


  setTimeout(function () {
    atualizarAlertaCardInsumos();
  }, 80);

  return retorno;
};

window.renderizarInsumos.__baluFixCardEstoque = true;


}

var resumoOriginal = window.renderizarResumoInsumos;

if (typeof resumoOriginal === "function" && resumoOriginal.__baluFixCardEstoque !== true) {
window.renderizarResumoInsumos = function () {
var retorno = resumoOriginal.apply(this, arguments);


  setTimeout(function () {
    atualizarAlertaCardInsumos();
  }, 80);

  return retorno;
};

window.renderizarResumoInsumos.__baluFixCardEstoque = true;


}

document.addEventListener("DOMContentLoaded", function () {
setTimeout(function () {
baluIniciarFixCardEstoqueBaixo();
}, 700);
});

setTimeout(function () {
baluIniciarFixCardEstoqueBaixo();
}, 1000);
})();


