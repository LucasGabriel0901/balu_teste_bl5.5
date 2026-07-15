// ==============================
// BALU FOOD - FICHAS TÉCNICAS SIMPLIFICADAS
// Custo do prato, CMV teórico, margem desejada e preço sugerido
// ==============================

var fichasTecnicasCache = [];
var BALU_FICHAS_STORAGE_KEY = "balu_fichas_tecnicas";
var fichaTipoItemSelecionado = "Insumo";

if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", function () {
initFichasTecnicas();
});
} else {
initFichasTecnicas();
}

function initFichasTecnicas() {
fichasTecnicasCache = carregarFichasTecnicasLocal();

initEventosFichasTecnicas();
initImagemFicha();
garantirLinhaItemFicha();
garantirLinhaCanalFicha();
renderFichasTecnicas();
atualizarPreviewFichaTecnica();
atualizarDatalistFichaItens();
criarIconesFicha();

console.log("BALU Fichas Técnicas V2 carregado.");
}

function initEventosFichasTecnicas() {
var form = document.getElementById("formFichaTecnica");
var btnNovaFicha = document.getElementById("btnNovaFicha");
var btnExportar = document.getElementById("btnExportarFichas");
var btnAdicionarItem = document.getElementById("btnAdicionarItemFicha");
var btnAdicionarCanal = document.getElementById("btnAdicionarCanalFicha");
var btnExcluirAtual = document.getElementById("btnExcluirFichaAtual");
var search = document.getElementById("searchFichas");
var filterTipo = document.getElementById("filterTipoFicha");
var filterCategoria = document.getElementById("filterCategoriaFicha");
var filterStatus = document.getElementById("filterStatusFicha");

if (btnNovaFicha) {
btnNovaFicha.addEventListener("click", function () {
prepararNovaFichaTecnica();
});
}

if (form) {
form.addEventListener("submit", function (event) {
event.preventDefault();
salvarFichaTecnica();
});
}

if (btnExportar) {
btnExportar.addEventListener("click", function () {
exportarFichasTecnicas();
});
}

if (btnAdicionarItem) {
btnAdicionarItem.addEventListener("click", function () {
adicionarItemFicha({
tipo: fichaTipoItemSelecionado
});
});
}

if (btnAdicionarCanal) {
btnAdicionarCanal.addEventListener("click", function () {
adicionarCanalFicha();
});
}

if (btnExcluirAtual) {
btnExcluirAtual.addEventListener("click", function () {
var id = getValueFicha("fichaId");


  if (!id) {
    mensagemFicha("Nenhuma ficha selecionada para excluir.", "warning");
    return;
  }

  excluirFichaTecnica(id);
});


}

if (search) {
search.addEventListener("input", function () {
renderFichasTecnicas();
});
}

if (filterTipo) {
filterTipo.addEventListener("change", function () {
renderFichasTecnicas();
});
}

if (filterCategoria) {
filterCategoria.addEventListener("change", function () {
renderFichasTecnicas();
});
}

if (filterStatus) {
filterStatus.addEventListener("change", function () {
renderFichasTecnicas();
});
}

document.addEventListener("click", function (event) {
var tab = event.target.closest("[data-ficha-tab]");


if (tab) {
  ativarAbaFicha(tab.getAttribute("data-ficha-tab"));
  return;
}

var chip = event.target.closest("[data-ficha-item-type]");

if (chip) {
  fichaTipoItemSelecionado = chip.getAttribute("data-ficha-item-type") || "Insumo";
  ativarTipoItemFicha(fichaTipoItemSelecionado);
  return;
}

var botao = event.target.closest("button");

if (!botao) {
  return;
}

if (botao.classList.contains("fichaItemRemove")) {
  var item = botao.closest(".inventory-item");

  if (item) {
    item.remove();
    garantirLinhaItemFicha();
    atualizarPreviewFichaTecnica();
  }
}

if (botao.classList.contains("fichaCanalRemove")) {
  var canal = botao.closest(".inventory-item");

  if (canal) {
    canal.remove();
    garantirLinhaCanalFicha();
    atualizarPreviewFichaTecnica();
  }
}


}, true);

document.addEventListener("input", function (event) {
if (event.target && event.target.classList.contains("fichaItemNome")) {
preencherItemFichaPeloNome(event.target.closest(".inventory-item"));
}

if (campoFichaTecnica(event.target)) {
atualizarPreviewFichaTecnica();
}
}, true);

document.addEventListener("change", function (event) {
if (event.target && event.target.classList.contains("fichaItemTipo")) {
atualizarDatalistFichaItens();
preencherItemFichaPeloNome(event.target.closest(".inventory-item"));
}

if (event.target && event.target.classList.contains("fichaItemNome")) {
preencherItemFichaPeloNome(event.target.closest(".inventory-item"));
}

if (campoFichaTecnica(event.target)) {
atualizarPreviewFichaTecnica();
}
}, true);
}

function campoFichaTecnica(campo) {
if (!campo) {
return false;
}

return (
campo.id === "fichaNome" ||
campo.id === "fichaTipo" ||
campo.id === "fichaStatus" ||
campo.id === "fichaCategoria" ||
campo.id === "fichaSubcategoria" ||
campo.id === "fichaCentroResultado" ||
campo.id === "fichaResponsavel" ||
campo.id === "fichaPesoBruto" ||
campo.id === "fichaPesoLiquido" ||
campo.id === "fichaUnidadePeso" ||
campo.id === "fichaPorcaoPadrao" ||
campo.id === "fichaRendimento" ||
campo.id === "fichaUnidadeRendimento" ||
campo.id === "fichaPrecoVenda" ||
campo.id === "fichaCmvAlvo" ||
campo.id === "fichaMargemDesejada" ||
campo.id === "fichaCustosOperacionaisPercent" ||
campo.id === "fichaMaoObraPercentual" ||
campo.id === "fichaMarkupDesejado" ||
campo.id === "fichaCanalPrincipal" ||
campo.id === "fichaUsadaEmCardapios" ||
campo.id === "fichaFrequenciaMensal" ||
campo.id === "fichaConsumoMensal" ||
campo.id === "fichaImpactoMensal" ||
campo.classList.contains("fichaItemTipo") ||
campo.classList.contains("fichaItemNome") ||
campo.classList.contains("fichaItemQuantidade") ||
campo.classList.contains("fichaItemUnidade") ||
campo.classList.contains("fichaItemCustoUnitario") ||
campo.classList.contains("fichaCanalNome") ||
campo.classList.contains("fichaCanalPreco") ||
campo.classList.contains("fichaCanalTaxa")
);
}

function initImagemFicha() {
var input = document.getElementById("fichaImagemInput");
var preview = document.getElementById("fichaImagemPreview");
var placeholder = document.getElementById("fichaImagemPlaceholder");

if (!input || !preview) {
return;
}

input.addEventListener("change", function () {
var file = input.files[0];


if (!file) {
  return;
}

converterArquivoFichaBase64(file).then(function (base64) {
  input.dataset.imageBase64 = base64;
  preview.src = base64;
  preview.style.display = "block";

  if (placeholder) {
    placeholder.style.display = "none";
  }
});


});
}

function prepararNovaFichaTecnica() {
resetarFormularioFichaTecnica();

setTextFicha("drawerFichaTitle", "Nova Ficha Técnica");
setTextFicha("drawerFichaSubtitle", "Cadastre composição, resultado, utilização, preparo e precificação.");

setValueFicha("fichaTipo", "Receita");
setValueFicha("fichaStatus", "Ativa");
setValueFicha("fichaResponsavel", "Lucas Gabriel");
setValueFicha("fichaUnidadePeso", "g");
setValueFicha("fichaUnidadeRendimento", "porções");
setValueFicha("fichaCmvAlvo", "30");
setValueFicha("fichaMargemDesejada", "30");
setValueFicha("fichaCustosOperacionaisPercent", calcularPercentualCustosOperacionaisFicha());
setValueFicha("fichaMaoObraPercentual", calcularPercentualMaoObraFicha());
setValueFicha("fichaMarkupDesejado", "3");
setValueFicha("fichaCanalPrincipal", "Delivery Próprio");

fichaTipoItemSelecionado = "Insumo";
ativarTipoItemFicha("Insumo");
ativarAbaFicha("composicao");

garantirLinhaItemFicha();
garantirLinhaCanalFicha();
atualizarPreviewFichaTecnica();

if (typeof openDrawer === "function") {
openDrawer("drawerFichaTecnica");
}
}

function resetarFormularioFichaTecnica() {
var form = document.getElementById("formFichaTecnica");
var itensContainer = document.getElementById("fichaItensContainer");
var canaisContainer = document.getElementById("fichaCanaisContainer");
var inputImagem = document.getElementById("fichaImagemInput");
var preview = document.getElementById("fichaImagemPreview");
var placeholder = document.getElementById("fichaImagemPlaceholder");

if (form) {
form.reset();
}

setValueFicha("fichaId", "");

if (itensContainer) {
itensContainer.innerHTML = "";
}

if (canaisContainer) {
canaisContainer.innerHTML = "";
}

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

adicionarItemFicha({
tipo: "Insumo"
});

adicionarCanalFicha({
nome: "Delivery Próprio",
preco: "",
taxa: ""
});
}

function ativarAbaFicha(nomeAba) {
var tabs = document.querySelectorAll("[data-ficha-tab]");
var panels = document.querySelectorAll(".ficha-tab-panel");

tabs.forEach(function (tab) {
if (tab.getAttribute("data-ficha-tab") === nomeAba) {
tab.classList.add("active");
} else {
tab.classList.remove("active");
}
});

panels.forEach(function (panel) {
panel.classList.remove("active");
});

var mapa = {
composicao: "tabFichaComposicao",
resultado: "tabFichaResultado",
utilizacao: "tabFichaUtilizacao",
preparo: "tabFichaPreparo",
precificacao: "tabFichaPrecificacao"
};

var panelAtivo = document.getElementById(mapa[nomeAba]);

if (panelAtivo) {
panelAtivo.classList.add("active");
}
}

function ativarTipoItemFicha(tipo) {
var chips = document.querySelectorAll("[data-ficha-item-type]");

chips.forEach(function (chip) {
if (chip.getAttribute("data-ficha-item-type") === tipo) {
chip.classList.add("active");
} else {
chip.classList.remove("active");
}
});
}

function garantirLinhaItemFicha() {
var container = document.getElementById("fichaItensContainer");

if (!container) {
return;
}

var itens = container.querySelectorAll(".inventory-item");

if (itens.length === 0) {
adicionarItemFicha({
tipo: "Insumo"
});
}
}

function garantirLinhaCanalFicha() {
var container = document.getElementById("fichaCanaisContainer");

if (!container) {
return;
}

var canais = container.querySelectorAll(".inventory-item");

if (canais.length === 0) {
adicionarCanalFicha({
nome: "Delivery Próprio",
preco: "",
taxa: ""
});
}
}

function adicionarItemFicha(itemSalvo) {
var container = document.getElementById("fichaItensContainer");

if (!container) {
return;
}

var item = itemSalvo || {};
var div = document.createElement("div");

div.className = "inventory-item ficha-composition-item";

div.innerHTML =
"<div class='inventory-item-grid ficha-composition-grid'>" +
"<div class='form-field'>" +
"<label>Tipo</label>" +
"<select class='fichaItemTipo'>" +
"<option value='Insumo'>Insumo</option>" +
"<option value='Base'>Base</option>" +
"<option value='Embalagem'>Embalagem</option>" +
"<option value='Mão de obra'>Mão de obra</option>" +
"<option value='Outro'>Outro</option>" +
"</select>" +
"</div>" +


  "<div class='form-field'>" +
    "<label>Item</label>" +
    "<input type='text' class='fichaItemNome' list='fichaItensDisponiveis' data-item-id='' data-item-codigo='' placeholder='Ex: Frango, arroz, embalagem...'>" +
  "</div>" +

  "<div class='form-field'>" +
    "<label>Quantidade</label>" +
    "<input type='text' class='fichaItemQuantidade' inputmode='decimal' placeholder='0'>" +
  "</div>" +

  "<div class='form-field'>" +
    "<label>Unidade</label>" +
    "<select class='fichaItemUnidade'>" +
      "<option value='g'>g</option>" +
      "<option value='kg'>kg</option>" +
      "<option value='ml'>ml</option>" +
      "<option value='litro'>litro</option>" +
      "<option value='un'>un</option>" +
      "<option value='min'>min</option>" +
      "<option value='pacote'>pacote</option>" +
      "<option value='caixa'>caixa</option>" +
    "</select>" +
  "</div>" +

  "<div class='form-field'>" +
    "<label>Custo unitário</label>" +
    "<input type='text' class='fichaItemCustoUnitario' inputmode='decimal' placeholder='0,00'>" +
  "</div>" +

  "<div class='form-field'>" +
    "<label>Custo total</label>" +
    "<input type='text' class='fichaItemTotal calculated-field' readonly value='R$ 0,00'>" +
  "</div>" +

  "<button type='button' class='btn btn-outline btn-small fichaItemRemove'>Remover</button>" +
"</div>";


container.appendChild(div);

setItemValueFicha(div, ".fichaItemTipo", item.tipo || fichaTipoItemSelecionado || "Insumo");
setItemValueFicha(div, ".fichaItemNome", item.nome || "");
setItemValueFicha(div, ".fichaItemQuantidade", item.quantidade || "");
setItemValueFicha(div, ".fichaItemUnidade", item.unidade || "g");
setItemValueFicha(div, ".fichaItemCustoUnitario", item.custoUnitario || "");
preencherItemFichaPeloNome(div);

atualizarPreviewFichaTecnica();
atualizarDatalistFichaItens();
criarIconesFicha();
}

function adicionarCanalFicha(canalSalvo) {
var container = document.getElementById("fichaCanaisContainer");

if (!container) {
return;
}

var canal = canalSalvo || {};
var div = document.createElement("div");

div.className = "inventory-item ficha-canal-item";

div.innerHTML =
"<div class='inventory-item-grid ficha-canal-grid'>" +
"<div class='form-field'>" +
"<label>Canal</label>" +
"<input type='text' class='fichaCanalNome' placeholder='Ex: Delivery Próprio'>" +
"</div>" +


  "<div class='form-field'>" +
    "<label>Preço</label>" +
    "<input type='text' class='fichaCanalPreco' inputmode='decimal' placeholder='0,00'>" +
  "</div>" +

  "<div class='form-field'>" +
    "<label>Taxa (%)</label>" +
    "<input type='text' class='fichaCanalTaxa' inputmode='decimal' placeholder='0'>" +
  "</div>" +

  "<div class='form-field'>" +
    "<label>CMV</label>" +
    "<input type='text' class='fichaCanalCmv calculated-field' readonly value='0,00%'>" +
  "</div>" +

  "<div class='form-field'>" +
    "<label>Margem</label>" +
    "<input type='text' class='fichaCanalMargem calculated-field' readonly value='0,00%'>" +
  "</div>" +

  "<div class='form-field'>" +
    "<label>Lucro</label>" +
    "<input type='text' class='fichaCanalLucro calculated-field' readonly value='R$ 0,00'>" +
  "</div>" +

  "<button type='button' class='btn btn-outline btn-small fichaCanalRemove'>Remover</button>" +
"</div>";

container.appendChild(div);

setItemValueFicha(div, ".fichaCanalNome", canal.nome || "Delivery Próprio");
setItemValueFicha(div, ".fichaCanalPreco", canal.preco || "");
setItemValueFicha(div, ".fichaCanalTaxa", canal.taxa || "");

atualizarPreviewFichaTecnica();
criarIconesFicha();
}

function calcularFichaTecnica() {
var itens = [];
var canais = [];

var totalInsumosBases = 0;
var totalEmbalagens = 0;
var totalMaoObra = 0;
var totalOutros = 0;

var linhasItens = document.querySelectorAll("#fichaItensContainer .inventory-item");

linhasItens.forEach(function (linha) {
var tipo = getItemValueFicha(linha, ".fichaItemTipo") || "Insumo";
var nome = getItemValueFicha(linha, ".fichaItemNome");
var quantidade = numeroFicha(getItemValueFicha(linha, ".fichaItemQuantidade"));
var unidade = getItemValueFicha(linha, ".fichaItemUnidade") || "g";
var custoUnitario = numeroFicha(getItemValueFicha(linha, ".fichaItemCustoUnitario"));
var total = quantidade * custoUnitario;
var campoNomeItem = linha.querySelector(".fichaItemNome");


setItemValueFicha(linha, ".fichaItemTotal", moedaFicha(total));

if (nome && quantidade > 0 && custoUnitario > 0) {
  itens.push({
    tipo: tipo,
    itemId: campoNomeItem ? campoNomeItem.dataset.itemId || "" : "",
    codigo: campoNomeItem ? campoNomeItem.dataset.itemCodigo || "" : "",
    nome: nome,
    quantidade: quantidade,
    unidade: unidade,
    custoUnitario: custoUnitario,
    total: total
  });

  if (tipo === "Insumo" || tipo === "Base") {
    totalInsumosBases = totalInsumosBases + total;
  } else if (tipo === "Embalagem") {
    totalEmbalagens = totalEmbalagens + total;
  } else if (tipo === "Mão de obra") {
    totalMaoObra = totalMaoObra + total;
  } else {
    totalOutros = totalOutros + total;
  }
}


});

var pesoBruto = numeroFicha(getValueFicha("fichaPesoBruto"));
var pesoLiquido = numeroFicha(getValueFicha("fichaPesoLiquido"));
var porcaoPadrao = numeroFicha(getValueFicha("fichaPorcaoPadrao"));
var rendimentoInformado = numeroFicha(getValueFicha("fichaRendimento"));
var precoVenda = numeroFicha(getValueFicha("fichaPrecoVenda"));
var cmvAlvo = numeroFicha(getValueFicha("fichaCmvAlvo"));
var markupDesejado = numeroFicha(getValueFicha("fichaMarkupDesejado"));
var margemDesejada = numeroFicha(getValueFicha("fichaMargemDesejada"));
var custosOperacionaisPercent = numeroFicha(getValueFicha("fichaCustosOperacionaisPercent"));
var maoObraPercentual = numeroFicha(getValueFicha("fichaMaoObraPercentual"));

var totalBase = totalInsumosBases + totalEmbalagens + totalMaoObra + totalOutros;
var basePercentualOperacional = totalInsumosBases + totalEmbalagens;
var adicionalOperacional = basePercentualOperacional * ((custosOperacionaisPercent + maoObraPercentual) / 100);

var perdaPeso = 0;
var perdaPercentual = 0;
var rendimentoProducao = 0;
var valorPerdas = 0;

if (pesoBruto > 0 && pesoLiquido > 0) {
perdaPeso = pesoBruto - pesoLiquido;


if (perdaPeso < 0) {
  perdaPeso = 0;
}

perdaPercentual = (perdaPeso / pesoBruto) * 100;
rendimentoProducao = (pesoLiquido / pesoBruto) * 100;
valorPerdas = totalInsumosBases * (perdaPercentual / 100);


}

var custoTotal = totalBase + adicionalOperacional;

var rendimentoCalculado = rendimentoInformado;

if (rendimentoCalculado <= 0 && pesoLiquido > 0 && porcaoPadrao > 0) {
rendimentoCalculado = pesoLiquido / porcaoPadrao;
}

var custoPorPorcao = rendimentoCalculado > 0 ? custoTotal / rendimentoCalculado : 0;
var custoPor100g = pesoLiquido > 0 ? (custoTotal / pesoLiquido) * 100 : 0;

if (custoPor100g <= 0 && porcaoPadrao > 0) {
custoPor100g = (custoPorPorcao / porcaoPadrao) * 100;
}

var cmvAtual = precoVenda > 0 ? (custoPorPorcao / precoVenda) * 100 : 0;
var lucroUnitario = precoVenda - custoPorPorcao;
var margemContribuicao = precoVenda > 0 ? (lucroUnitario / precoVenda) * 100 : 0;
var markupAplicado = custoPorPorcao > 0 ? precoVenda / custoPorPorcao : 0;

var precoSugeridoCmv = cmvAlvo > 0 ? custoPorPorcao / (cmvAlvo / 100) : 0;
var precoSugeridoMarkup = markupDesejado > 0 ? custoPorPorcao * markupDesejado : 0;
var precoSugeridoMargem = margemDesejada > 0 && margemDesejada < 100 ? custoPorPorcao / (1 - margemDesejada / 100) : 0;

var statusFinanceiro = classificarFichaFinanceira(cmvAtual, margemContribuicao, lucroUnitario, precoVenda);

var linhasCanais = document.querySelectorAll("#fichaCanaisContainer .inventory-item");

linhasCanais.forEach(function (linha) {
var nomeCanal = getItemValueFicha(linha, ".fichaCanalNome");
var precoCanal = numeroFicha(getItemValueFicha(linha, ".fichaCanalPreco"));
var taxaCanal = numeroFicha(getItemValueFicha(linha, ".fichaCanalTaxa"));


if (precoCanal <= 0 && precoVenda > 0) {
  precoCanal = precoVenda;
}

var valorTaxa = precoCanal * (taxaCanal / 100);
var receitaLiquida = precoCanal - valorTaxa;
var lucroCanal = receitaLiquida - custoPorPorcao;
var cmvCanal = precoCanal > 0 ? (custoPorPorcao / precoCanal) * 100 : 0;
var margemCanal = precoCanal > 0 ? (lucroCanal / precoCanal) * 100 : 0;

setItemValueFicha(linha, ".fichaCanalCmv", percentualFicha(cmvCanal));
setItemValueFicha(linha, ".fichaCanalMargem", percentualFicha(margemCanal));
setItemValueFicha(linha, ".fichaCanalLucro", moedaFicha(lucroCanal));

if (nomeCanal) {
  canais.push({
    nome: nomeCanal,
    preco: precoCanal,
    taxa: taxaCanal,
    valorTaxa: valorTaxa,
    receitaLiquida: receitaLiquida,
    cmv: cmvCanal,
    margem: margemCanal,
    lucro: lucroCanal
  });
}


});

var usadaEmCardapios = numeroFicha(getValueFicha("fichaUsadaEmCardapios"));
var frequenciaMensal = numeroFicha(getValueFicha("fichaFrequenciaMensal"));
var consumoMensal = numeroFicha(getValueFicha("fichaConsumoMensal"));
var impactoMensalManual = numeroFicha(getValueFicha("fichaImpactoMensal"));

var impactoMensal = impactoMensalManual;

if (impactoMensal <= 0 && frequenciaMensal > 0) {
impactoMensal = frequenciaMensal * custoPorPorcao;
}

var participacaoEstimada = 0;

if (impactoMensal > 0 && custoTotal > 0) {
participacaoEstimada = (impactoMensal / (impactoMensal + custoTotal)) * 100;
}

return {
itens: itens,
canais: canais,
totalInsumosBases: totalInsumosBases,
totalEmbalagens: totalEmbalagens,
totalMaoObra: totalMaoObra,
totalOutros: totalOutros,
totalBase: totalBase,
adicionalOperacional: adicionalOperacional,
custosOperacionaisPercent: custosOperacionaisPercent,
maoObraPercentual: maoObraPercentual,
valorPerdas: valorPerdas,
pesoBruto: pesoBruto,
pesoLiquido: pesoLiquido,
perdaPeso: perdaPeso,
perdaPercentual: perdaPercentual,
rendimentoProducao: rendimentoProducao,
porcaoPadrao: porcaoPadrao,
rendimento: rendimentoCalculado,
rendimentoInformado: rendimentoInformado,
custoTotal: custoTotal,
custoPorPorcao: custoPorPorcao,
custoPor100g: custoPor100g,
precoVenda: precoVenda,
cmvAlvo: cmvAlvo,
cmvAtual: cmvAtual,
lucroUnitario: lucroUnitario,
margemContribuicao: margemContribuicao,
markupDesejado: markupDesejado,
margemDesejada: margemDesejada,
markupAplicado: markupAplicado,
precoSugeridoCmv: precoSugeridoCmv,
precoSugeridoMarkup: precoSugeridoMarkup,
precoSugeridoMargem: precoSugeridoMargem,
statusFinanceiro: statusFinanceiro,
usadaEmCardapios: usadaEmCardapios,
frequenciaMensal: frequenciaMensal,
consumoMensal: consumoMensal,
impactoMensal: impactoMensal,
participacaoEstimada: participacaoEstimada
};
}

function atualizarPreviewFichaTecnica() {
var resultado = calcularFichaTecnica();
var unidadePeso = getValueFicha("fichaUnidadePeso") || "g";
var unidadeRendimento = getValueFicha("fichaUnidadeRendimento") || "porções";

setTextFicha("resumoFichaCustoTotal", moedaFicha(resultado.custoTotal));
setTextFicha("resumoFichaCustoPorcao", moedaFicha(resultado.custoPorPorcao));
setTextFicha("resumoFichaCmvAtual", percentualFicha(resultado.cmvAtual));
setTextFicha("resumoFichaMargem", percentualFicha(resultado.margemContribuicao));
setTextFicha("resumoFichaLucroUnitario", moedaFicha(resultado.lucroUnitario));
setTextFicha("resumoFichaPrecoSugerido", moedaFicha(resultado.precoSugeridoCmv));

setTextFicha("fichaResultadoInsumos", moedaFicha(resultado.totalInsumosBases));
setTextFicha("fichaResultadoEmbalagens", moedaFicha(resultado.totalEmbalagens));
setTextFicha("fichaResultadoMaoObra", moedaFicha(resultado.totalMaoObra));
setTextFicha("fichaResultadoOutros", moedaFicha(resultado.totalOutros));
setTextFicha("fichaResultadoPerdas", moedaFicha(resultado.valorPerdas));
setTextFicha("fichaResultadoCustoTotal", moedaFicha(resultado.custoTotal));
setTextFicha("fichaResultadoCustoPorcao", moedaFicha(resultado.custoPorPorcao));
setTextFicha("fichaResultadoCusto100g", moedaFicha(resultado.custoPor100g));
setTextFicha("fichaResultadoRendimentoProducao", percentualFicha(resultado.rendimentoProducao));
setTextFicha("fichaResultadoQuantidadeFinal", numeroFormatoFicha(resultado.rendimento) + " " + unidadeRendimento);

setTextFicha("fichaResultadoPesoBruto", numeroFormatoFicha(resultado.pesoBruto) + " " + unidadePeso);
setTextFicha("fichaResultadoPesoLiquido", numeroFormatoFicha(resultado.pesoLiquido) + " " + unidadePeso);
setTextFicha("fichaResultadoPerdaPeso", numeroFormatoFicha(resultado.perdaPeso) + " " + unidadePeso);

setTextFicha("fichaUtilizacaoCardapiosPreview", numeroFormatoFicha(resultado.usadaEmCardapios));
setTextFicha("fichaUtilizacaoConsumoPreview", numeroFormatoFicha(resultado.consumoMensal));
setTextFicha("fichaUtilizacaoImpactoPreview", moedaFicha(resultado.impactoMensal));
setTextFicha("fichaUtilizacaoParticipacaoPreview", percentualFicha(resultado.participacaoEstimada));

setTextFicha("fichaPrecoSugeridoCmvPreview", moedaFicha(resultado.precoSugeridoCmv));
setTextFicha("fichaPrecoSugeridoMarkupPreview", moedaFicha(resultado.precoSugeridoMarkup));
setTextFicha("fichaPrecoSugeridoMargemPreview", moedaFicha(resultado.precoSugeridoMargem));
setTextFicha("fichaAdicionalOperacionalPreview", moedaFicha(resultado.adicionalOperacional));
setTextFicha("fichaCmvAtualPreview", percentualFicha(resultado.cmvAtual));
setTextFicha("fichaMargemContribuicaoPreview", percentualFicha(resultado.margemContribuicao));
setTextFicha("fichaLucroUnitarioPreview", moedaFicha(resultado.lucroUnitario));
setTextFicha("fichaMarkupAplicadoPreview", multiplicadorFicha(resultado.markupAplicado));

return resultado;
}

function salvarFichaTecnica() {
var id = getValueFicha("fichaId");
var fichaExistente = id ? buscarFichaTecnicaPorId(id) : null;

var nome = getValueFicha("fichaNome");
var tipo = getValueFicha("fichaTipo") || "Receita";
var categoria = getValueFicha("fichaCategoria");
var status = getValueFicha("fichaStatus") || "Ativa";
var porcaoPadrao = numeroFicha(getValueFicha("fichaPorcaoPadrao"));
var rendimento = numeroFicha(getValueFicha("fichaRendimento"));
var precoVenda = numeroFicha(getValueFicha("fichaPrecoVenda"));

if (!nome) {
mensagemFicha("Informe o nome da receita.", "warning");
return;
}

if (!categoria) {
mensagemFicha("Selecione a categoria da receita.", "warning");
return;
}

if (porcaoPadrao <= 0) {
mensagemFicha("Informe a porção padrão para venda.", "warning");
return;
}

if (rendimento <= 0) {
mensagemFicha("Informe o rendimento da receita.", "warning");
return;
}

if (precoVenda <= 0) {
mensagemFicha("Informe o preço de venda praticado.", "warning");
return;
}

var resultado = calcularFichaTecnica();

if (resultado.itens.length === 0) {
mensagemFicha("Adicione pelo menos um item na composição da receita.", "warning");
return;
}

var inputImagem = document.getElementById("fichaImagemInput");
var imagem = inputImagem && inputImagem.dataset.imageBase64 ? inputImagem.dataset.imageBase64 : "";

if (!imagem && fichaExistente && fichaExistente.imagem) {
imagem = fichaExistente.imagem;
}

var agora = new Date().toISOString();

var ficha = {
id: id || gerarIdFicha("FICHA"),
imagem: imagem,
nome: nome,
tipo: tipo,
status: status,
categoria: categoria,
subcategoria: getValueFicha("fichaSubcategoria"),
centroResultado: getValueFicha("fichaCentroResultado"),
responsavel: getValueFicha("fichaResponsavel"),
pesoBruto: resultado.pesoBruto,
pesoLiquido: resultado.pesoLiquido,
unidadePeso: getValueFicha("fichaUnidadePeso") || "g",
porcaoPadrao: resultado.porcaoPadrao,
rendimento: resultado.rendimento,
rendimentoInformado: resultado.rendimentoInformado,
unidadeRendimento: getValueFicha("fichaUnidadeRendimento") || "porções",
itens: resultado.itens,
canais: resultado.canais,
totalInsumosBases: resultado.totalInsumosBases,
totalEmbalagens: resultado.totalEmbalagens,
totalMaoObra: resultado.totalMaoObra,
totalOutros: resultado.totalOutros,
totalBase: resultado.totalBase,
adicionalOperacional: resultado.adicionalOperacional,
custosOperacionaisPercent: resultado.custosOperacionaisPercent,
maoObraPercentual: resultado.maoObraPercentual,
valorPerdas: resultado.valorPerdas,
perdaPeso: resultado.perdaPeso,
perdaPercentual: resultado.perdaPercentual,
rendimentoProducao: resultado.rendimentoProducao,
custoTotal: resultado.custoTotal,
custoPorPorcao: resultado.custoPorPorcao,
custoPor100g: resultado.custoPor100g,
precoVenda: resultado.precoVenda,
cmvAlvo: resultado.cmvAlvo,
margemDesejada: resultado.margemDesejada,
cmvAtual: resultado.cmvAtual,
lucroUnitario: resultado.lucroUnitario,
margemContribuicao: resultado.margemContribuicao,
markupDesejado: resultado.markupDesejado,
markupAplicado: resultado.markupAplicado,
precoSugeridoCmv: resultado.precoSugeridoCmv,
precoSugeridoMarkup: resultado.precoSugeridoMarkup,
precoSugeridoMargem: resultado.precoSugeridoMargem,
statusFinanceiro: resultado.statusFinanceiro,
canalPrincipal: getValueFicha("fichaCanalPrincipal"),
usadaEmCardapios: resultado.usadaEmCardapios,
frequenciaMensal: resultado.frequenciaMensal,
consumoMensal: resultado.consumoMensal,
impactoMensal: resultado.impactoMensal,
participacaoEstimada: resultado.participacaoEstimada,
tempoPreparo: getValueFicha("fichaTempoPreparo"),
validade: getValueFicha("fichaValidade"),
armazenamento: getValueFicha("fichaArmazenamento"),
unidadeProducao: getValueFicha("fichaUnidadeProducao"),
modoPreparo: getValueFicha("fichaModoPreparo"),
observacoes: getValueFicha("fichaObservacoes"),
criadoEm: fichaExistente ? fichaExistente.criadoEm : agora,
atualizadoEm: agora
};

if (id) {
fichasTecnicasCache = fichasTecnicasCache.map(function (item) {
return item.id === id ? ficha : item;
});


mensagemFicha("Ficha técnica atualizada com sucesso.", "success");


} else {
fichasTecnicasCache.push(ficha);


mensagemFicha("Ficha técnica cadastrada com sucesso.", "success");

}

salvarFichasTecnicasLocal(fichasTecnicasCache);

if (typeof closeDrawer === "function") {
closeDrawer();
}

resetarFormularioFichaTecnica();
renderFichasTecnicas();
}

function editarFichaTecnica(id) {
var ficha = buscarFichaTecnicaPorId(id);

if (!ficha) {
mensagemFicha("Ficha técnica não encontrada.", "danger");
return;
}

resetarFormularioFichaTecnica();

setValueFicha("fichaId", ficha.id);
setValueFicha("fichaNome", ficha.nome);
setValueFicha("fichaTipo", ficha.tipo || "Receita");
setValueFicha("fichaStatus", ficha.status || "Ativa");
setValueFicha("fichaCategoria", ficha.categoria);
setValueFicha("fichaSubcategoria", ficha.subcategoria);
setValueFicha("fichaCentroResultado", ficha.centroResultado);
setValueFicha("fichaResponsavel", ficha.responsavel);
setValueFicha("fichaPesoBruto", ficha.pesoBruto);
setValueFicha("fichaPesoLiquido", ficha.pesoLiquido);
setValueFicha("fichaUnidadePeso", ficha.unidadePeso || "g");
setValueFicha("fichaPorcaoPadrao", ficha.porcaoPadrao);
setValueFicha("fichaRendimento", ficha.rendimentoInformado || ficha.rendimento);
setValueFicha("fichaUnidadeRendimento", ficha.unidadeRendimento || "porções");
setValueFicha("fichaPrecoVenda", ficha.precoVenda);
setValueFicha("fichaCmvAlvo", ficha.cmvAlvo);
setValueFicha("fichaMargemDesejada", ficha.margemDesejada);
setValueFicha("fichaCustosOperacionaisPercent", ficha.custosOperacionaisPercent);
setValueFicha("fichaMaoObraPercentual", ficha.maoObraPercentual);
setValueFicha("fichaMarkupDesejado", ficha.markupDesejado);
setValueFicha("fichaCanalPrincipal", ficha.canalPrincipal);
setValueFicha("fichaUsadaEmCardapios", ficha.usadaEmCardapios);
setValueFicha("fichaFrequenciaMensal", ficha.frequenciaMensal);
setValueFicha("fichaConsumoMensal", ficha.consumoMensal);
setValueFicha("fichaImpactoMensal", ficha.impactoMensal);
setValueFicha("fichaTempoPreparo", ficha.tempoPreparo);
setValueFicha("fichaValidade", ficha.validade);
setValueFicha("fichaArmazenamento", ficha.armazenamento);
setValueFicha("fichaUnidadeProducao", ficha.unidadeProducao);
setValueFicha("fichaModoPreparo", ficha.modoPreparo);
setValueFicha("fichaObservacoes", ficha.observacoes);

setTextFicha("drawerFichaTitle", ficha.nome || "Editar Ficha Técnica");
setTextFicha("drawerFichaSubtitle", "Editando ficha técnica cadastrada.");

var inputImagem = document.getElementById("fichaImagemInput");
var preview = document.getElementById("fichaImagemPreview");
var placeholder = document.getElementById("fichaImagemPlaceholder");

if (inputImagem) {
inputImagem.dataset.imageBase64 = ficha.imagem || "";
}

if (preview && ficha.imagem) {
preview.src = ficha.imagem;
preview.style.display = "block";


if (placeholder) {
  placeholder.style.display = "none";
}


}

var itensContainer = document.getElementById("fichaItensContainer");
var canaisContainer = document.getElementById("fichaCanaisContainer");

if (itensContainer) {
itensContainer.innerHTML = "";
}

if (canaisContainer) {
canaisContainer.innerHTML = "";
}

if (Array.isArray(ficha.itens) && ficha.itens.length > 0) {
ficha.itens.forEach(function (item) {
adicionarItemFicha(item);
});
} else {
adicionarItemFicha({
tipo: "Insumo"
});
}

if (Array.isArray(ficha.canais) && ficha.canais.length > 0) {
ficha.canais.forEach(function (canal) {
adicionarCanalFicha(canal);
});
} else {
adicionarCanalFicha({
nome: "Delivery Próprio",
preco: ficha.precoVenda || "",
taxa: ""
});
}

ativarAbaFicha("composicao");
atualizarPreviewFichaTecnica();

if (typeof openDrawer === "function") {
openDrawer("drawerFichaTecnica");
}
}

function excluirFichaTecnica(id) {
var ficha = buscarFichaTecnicaPorId(id);

if (!ficha) {
return;
}

var confirmar = true;

if (typeof confirmAction === "function") {
confirmar = confirmAction("Deseja excluir esta ficha técnica?");
} else {
confirmar = confirm("Deseja excluir esta ficha técnica?");
}

if (!confirmar) {
return;
}

fichasTecnicasCache = fichasTecnicasCache.filter(function (item) {
return item.id !== id;
});

salvarFichasTecnicasLocal(fichasTecnicasCache);
renderFichasTecnicas();

if (typeof closeDrawer === "function") {
closeDrawer();
}

mensagemFicha("Ficha técnica excluída com sucesso.", "success");
}

function buscarFichaTecnicaPorId(id) {
return fichasTecnicasCache.find(function (item) {
return item.id === id;
});
}

function renderFichasTecnicas() {
var table = document.getElementById("fichasTecnicasTable");

if (!table) {
return;
}

var lista = filtrarFichasTecnicas();

renderResumoFichasTecnicas();

if (lista.length === 0) {
table.innerHTML =
"<tr>" +
"<td colspan='11' class='text-muted'>Nenhuma ficha técnica encontrada.</td>" +
"</tr>";


return;

}

table.innerHTML = lista.map(function (ficha) {
return (
"<tr>" +
"<td>" +
"<div class='ficha-table-recipe'>" +
getImagemReceitaHtml(ficha) +
"<div>" +
"<strong>" + textoSeguroFicha(ficha.nome || "-") + "</strong>" +
"<small>" + textoSeguroFicha(ficha.centroResultado || ficha.responsavel || "") + "</small>" +
"</div>" +
"</div>" +
"</td>" +
"<td>" + textoSeguroFicha(ficha.tipo || "-") + "</td>" +
"<td>" + textoSeguroFicha(ficha.categoria || "-") + "</td>" +
"<td>" + numeroFormatoFicha(ficha.porcaoPadrao) + " " + textoSeguroFicha(ficha.unidadePeso || "g") + "</td>" +
"<td><strong>" + moedaFicha(ficha.custoPorPorcao) + "</strong></td>" +
"<td>" + moedaFicha(ficha.custoPor100g) + "</td>" +
"<td>" + moedaFicha(ficha.precoVenda) + "</td>" +
"<td><strong>" + percentualFicha(ficha.cmvAtual) + "</strong></td>" +
"<td><strong>" + percentualFicha(ficha.margemContribuicao) + "</strong></td>" +
"<td>" + badgeFichaFinanceira(ficha.statusFinanceiro) + "</td>" +
"<td>" +
"<div class='table-actions'>" +
"<button type='button' class='btn-icon' title='Editar' onclick='editarFichaTecnica(\"" + ficha.id + "\")'>" +
"<i data-lucide='edit-3'></i>" +
"</button>" +
"<button type='button' class='btn-icon danger' title='Excluir' onclick='excluirFichaTecnica(\"" + ficha.id + "\")'>" +
"<i data-lucide='trash-2'></i>" +
"</button>" +
"</div>" +
"</td>" +
"</tr>"
);
}).join("");

criarIconesFicha();
}

function filtrarFichasTecnicas() {
var search = getValueFicha("searchFichas").toLowerCase();
var tipo = getValueFicha("filterTipoFicha");
var categoria = getValueFicha("filterCategoriaFicha");
var status = getValueFicha("filterStatusFicha");

return fichasTecnicasCache.filter(function (ficha) {
var texto =
String(ficha.nome || "") + " " +
String(ficha.tipo || "") + " " +
String(ficha.categoria || "") + " " +
String(ficha.subcategoria || "") + " " +
String(ficha.centroResultado || "") + " " +
String(ficha.status || "") + " " +
String(ficha.statusFinanceiro || "");


texto = texto.toLowerCase();

var passaBusca = !search || texto.indexOf(search) >= 0;
var passaTipo = !tipo || ficha.tipo === tipo;
var passaCategoria = !categoria || ficha.categoria === categoria;
var passaStatus = !status || ficha.status === status;

return passaBusca && passaTipo && passaCategoria && passaStatus;


});
}

function renderResumoFichasTecnicas() {
var fichasAtivas = fichasTecnicasCache.filter(function (ficha) {
return ficha.status !== "Inativa";
});

var totalReceitas = fichasAtivas.length;
var somaCustoPorcao = 0;
var somaCusto100g = 0;
var totalAtencao = 0;

fichasAtivas.forEach(function (ficha) {
somaCustoPorcao = somaCustoPorcao + numeroFicha(ficha.custoPorPorcao);
somaCusto100g = somaCusto100g + numeroFicha(ficha.custoPor100g);


if (ficha.statusFinanceiro === "Atenção" || ficha.statusFinanceiro === "Prejuízo") {
  totalAtencao = totalAtencao + 1;
}


});

var custoMedioPorcao = totalReceitas > 0 ? somaCustoPorcao / totalReceitas : 0;
var custoMedio100g = totalReceitas > 0 ? somaCusto100g / totalReceitas : 0;

setTextFicha("fichasTotalReceitas", totalReceitas);
setTextFicha("fichasCustoMedioPorcao", moedaFicha(custoMedioPorcao));
setTextFicha("fichasCustoMedio100g", moedaFicha(custoMedio100g));
setTextFicha("fichasReceitasAtencao", totalAtencao);

if (fichasAtivas.length > 0) {
var ultima = fichasAtivas[fichasAtivas.length - 1];


setTextFicha("resumoFichaCustoTotal", moedaFicha(ultima.custoTotal));
setTextFicha("resumoFichaCustoPorcao", moedaFicha(ultima.custoPorPorcao));
setTextFicha("resumoFichaCmvAtual", percentualFicha(ultima.cmvAtual));
setTextFicha("resumoFichaMargem", percentualFicha(ultima.margemContribuicao));
setTextFicha("resumoFichaLucroUnitario", moedaFicha(ultima.lucroUnitario));
setTextFicha("resumoFichaPrecoSugerido", moedaFicha(ultima.precoSugeridoCmv));


} else {
setTextFicha("resumoFichaCustoTotal", moedaFicha(0));
setTextFicha("resumoFichaCustoPorcao", moedaFicha(0));
setTextFicha("resumoFichaCmvAtual", percentualFicha(0));
setTextFicha("resumoFichaMargem", percentualFicha(0));
setTextFicha("resumoFichaLucroUnitario", moedaFicha(0));
setTextFicha("resumoFichaPrecoSugerido", moedaFicha(0));
}
}

function exportarFichasTecnicas() {
if (!fichasTecnicasCache.length) {
mensagemFicha("Não há fichas técnicas para exportar.", "warning");
return;
}

var linhas = [];

linhas.push("Receita;Tipo;Categoria;Porcao;Custo Porcao;Custo 100g;Preco Venda;CMV;Margem;Lucro;Status");

fichasTecnicasCache.forEach(function (ficha) {
linhas.push([
ficha.nome || "",
ficha.tipo || "",
ficha.categoria || "",
numeroExportFicha(ficha.porcaoPadrao),
numeroExportFicha(ficha.custoPorPorcao),
numeroExportFicha(ficha.custoPor100g),
numeroExportFicha(ficha.precoVenda),
numeroExportFicha(ficha.cmvAtual),
numeroExportFicha(ficha.margemContribuicao),
numeroExportFicha(ficha.lucroUnitario),
ficha.statusFinanceiro || ""
].join(";"));
});

var blob = new Blob([linhas.join("\n")], {
type: "text/csv;charset=utf-8;"
});

var url = URL.createObjectURL(blob);
var link = document.createElement("a");

link.href = url;
link.download = "balu-fichas-tecnicas.csv";
link.click();

URL.revokeObjectURL(url);

mensagemFicha("Arquivo de fichas técnicas exportado.", "success");
}

function classificarFichaFinanceira(cmvAtual, margem, lucro, precoVenda) {
if (precoVenda <= 0) {
return "Não calculado";
}

if (lucro < 0) {
return "Prejuízo";
}

if (cmvAtual > 45 || margem < 20) {
return "Atenção";
}

return "Lucrativo";
}

function badgeFichaFinanceira(status) {
if (status === "Lucrativo") {
return "<span class='finance-classification excellent'>Lucrativo</span>";
}

if (status === "Atenção") {
return "<span class='finance-classification warning'>Atenção</span>";
}

if (status === "Prejuízo") {
return "<span class='finance-classification critical'>Prejuízo</span>";
}

return "<span class='badge purple'>Não calculado</span>";
}

function getImagemReceitaHtml(ficha) {
if (ficha && ficha.imagem) {
return "<img class='ficha-table-img' src='" + ficha.imagem + "' alt='Receita'>";
}

return "<div class='ficha-table-img ficha-table-img-empty'><i data-lucide='utensils'></i></div>";
}

function carregarFichasTecnicasLocal() {
var chaves = [
getChaveFichasTecnicas(),
BALU_FICHAS_STORAGE_KEY,
"balu_fichas_tecnicas",
"fichas_tecnicas"
];

for (var i = 0; i < chaves.length; i++) {
var chave = chaves[i];


if (!chave) {
  continue;
}

try {
  if (typeof loadData === "function" && window.BALU_KEYS && chave === getChaveFichasTecnicas()) {
    var dadosLoadData = loadData(chave, []);

    if (Array.isArray(dadosLoadData)) {
      return dadosLoadData;
    }
  }

  var dados = localStorage.getItem(chave);

  if (!dados) {
    continue;
  }

  var lista = JSON.parse(dados);

  if (Array.isArray(lista)) {
    return lista;
  }
} catch (erro) {
  console.warn("Erro ao carregar fichas técnicas:", erro);
}


}

return [];
}

function salvarFichasTecnicasLocal(lista) {
var chave = getChaveFichasTecnicas() || BALU_FICHAS_STORAGE_KEY;

try {
if (typeof saveData === "function" && window.BALU_KEYS && getChaveFichasTecnicas()) {
saveData(chave, lista);
} else {
localStorage.setItem(chave, JSON.stringify(lista));
}


localStorage.setItem(BALU_FICHAS_STORAGE_KEY, JSON.stringify(lista));


} catch (erro) {
console.warn("Erro ao salvar fichas técnicas:", erro);
localStorage.setItem(BALU_FICHAS_STORAGE_KEY, JSON.stringify(lista));
}
}

function getChaveFichasTecnicas() {
if (window.BALU_KEYS) {
if (window.BALU_KEYS.fichasTecnicas) {
return window.BALU_KEYS.fichasTecnicas;
}


if (window.BALU_KEYS.fichas_tecnicas) {
  return window.BALU_KEYS.fichas_tecnicas;
}


}

return "";
}

function getValueFicha(id) {
var element = document.getElementById(id);

if (!element) {
return "";
}

return element.value;
}

function setValueFicha(id, value) {
var element = document.getElementById(id);

if (!element) {
return;
}

element.value = value === undefined || value === null ? "" : value;
}

function setTextFicha(id, value) {
var element = document.getElementById(id);

if (!element) {
return;
}

if (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.tagName === "SELECT") {
element.value = value === undefined || value === null ? "" : value;
} else {
element.textContent = value === undefined || value === null ? "" : value;
}
}

function getItemValueFicha(container, selector) {
var element = container.querySelector(selector);

if (!element) {
return "";
}

return element.value;
}

function setItemValueFicha(container, selector, value) {
var element = container.querySelector(selector);

if (!element) {
return;
}

element.value = value === undefined || value === null ? "" : value;
}

function atualizarDatalistFichaItens() {
var datalist = document.getElementById("fichaItensDisponiveis");

if (!datalist) {
datalist = document.createElement("datalist");
datalist.id = "fichaItensDisponiveis";
document.body.appendChild(datalist);
}

var itens = []
.concat(montarItensCadastroFicha("Insumo"))
.concat(montarItensCadastroFicha("Embalagem"))
.concat(montarItensCadastroFicha("Base"));

datalist.innerHTML = itens.map(function (item) {
var label = [item.tipo, item.codigo].filter(Boolean).join(" - ");
return "<option value='" + textoSeguroFicha(item.nome || "") + "' label='" + textoSeguroFicha(label) + "'></option>";
}).join("");
}

function preencherItemFichaPeloNome(linha) {
if (!linha) {
return;
}

var tipo = getItemValueFicha(linha, ".fichaItemTipo") || "Insumo";
var nome = getItemValueFicha(linha, ".fichaItemNome");
var cadastro = buscarCadastroFichaPorNome(tipo, nome);
var campoNome = linha.querySelector(".fichaItemNome");

if (!campoNome) {
return;
}

campoNome.dataset.itemId = "";
campoNome.dataset.itemCodigo = "";

if (!cadastro) {
return;
}

campoNome.dataset.itemId = cadastro.id || "";
campoNome.dataset.itemCodigo = cadastro.codigo || "";

if (cadastro.unidade) {
setItemValueFicha(linha, ".fichaItemUnidade", cadastro.unidade);
}

if (numeroFicha(getItemValueFicha(linha, ".fichaItemCustoUnitario")) <= 0 && cadastro.custoUnitario > 0) {
setItemValueFicha(linha, ".fichaItemCustoUnitario", numeroParaInputFicha(cadastro.custoUnitario));
}
}

function buscarCadastroFichaPorNome(tipo, nome) {
var nomeNormalizado = normalizarTextoFicha(nome);

if (!nomeNormalizado) {
return null;
}

return montarItensCadastroFicha(tipo).find(function (item) {
return normalizarTextoFicha(item.nome) === nomeNormalizado ||
normalizarTextoFicha(item.codigo) === nomeNormalizado;
}) || null;
}

function montarItensCadastroFicha(tipo) {
if (tipo === "Insumo") {
return carregarListaFichaStorage("insumos", "balu_insumos").map(function (item) {
return {
tipo: "Insumo",
id: item.id || "",
codigo: item.codigo || "",
nome: item.nome || "",
unidade: item.unidadeConsumo || item.unidadeCompra || "g",
custoUnitario: obterCustoCadastroFicha("Insumo", item)
};
});
}

if (tipo === "Embalagem") {
return carregarListaFichaStorage("embalagens", "balu_embalagens").map(function (item) {
return {
tipo: "Embalagem",
id: item.id || "",
codigo: item.codigo || "",
nome: item.nome || "",
unidade: item.unidade || "un",
custoUnitario: obterCustoCadastroFicha("Embalagem", item)
};
});
}

if (tipo === "Base") {
return fichasTecnicasCache.filter(function (ficha) {
return ficha.tipo === "Base" || ficha.tipo === "Receita";
}).map(function (ficha) {
return {
tipo: "Base",
id: ficha.id || "",
codigo: ficha.codigo || "",
nome: ficha.nome || "",
unidade: ficha.unidadeRendimento || "un",
custoUnitario: numeroFicha(ficha.custoPorPorcao || ficha.custoTotal || 0)
};
});
}

return [];
}

function carregarListaFichaStorage(nomeChave, fallbackChave) {
var chave = fallbackChave;

if (typeof BALU_KEYS !== "undefined" && BALU_KEYS && BALU_KEYS[nomeChave]) {
chave = BALU_KEYS[nomeChave];
}

if (typeof loadData === "function") {
var dadosLoad = loadData(chave, []);

if (Array.isArray(dadosLoad)) {
return dadosLoad;
}
}

try {
var dados = localStorage.getItem(chave);

if (!dados) {
return [];
}

var lista = JSON.parse(dados);
return Array.isArray(lista) ? lista : [];
} catch (erro) {
console.warn("Erro ao carregar cadastro para ficha:", chave, erro);
return [];
}
}

function obterCustoCadastroFicha(tipo, item) {
if (tipo === "Insumo") {
var unidade = normalizarTextoFicha(item.unidadeConsumo || item.unidadeCompra || "");
var custoUnitario = numeroFicha(item.custoUnitario || item.precoUnitario);
var precoMedioKg = numeroFicha(item.precoMedioKg);

if ((unidade === "g" || unidade === "gramas") && precoMedioKg > 0) {
  return precoMedioKg / 1000;
}

if ((unidade === "kg" || unidade === "quilo") && precoMedioKg > 0) {
  return precoMedioKg;
}

if (custoUnitario > 0) {
return custoUnitario;
}

return numeroFicha(item.precoMedio || item.valorUnitario || 0);
}

return numeroFicha(item.precoUnitario || item.precoMedioPacote || item.custoUnitario || 0);
}

function numeroParaInputFicha(valor) {
var numero = numeroFicha(valor);
return numero === 0 ? "" : String(numero);
}

function normalizarTextoFicha(value) {
return String(value || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();
}

function numeroFicha(valor) {
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
texto = texto.replace(/\\./g, "").replace(",", ".");
}

var numero = Number(texto);

if (isNaN(numero)) {
return 0;
}

return numero;
}

function moedaFicha(valor) {
var numero = Number(valor);

if (isNaN(numero)) {
numero = 0;
}

return numero.toLocaleString("pt-BR", {
style: "currency",
currency: "BRL"
});
}

function percentualFicha(valor) {
var numero = Number(valor);

if (isNaN(numero)) {
numero = 0;
}

return numero.toLocaleString("pt-BR", {
minimumFractionDigits: 2,
maximumFractionDigits: 2
}) + "%";
}

function multiplicadorFicha(valor) {
var numero = Number(valor);

if (isNaN(numero)) {
numero = 0;
}

return numero.toLocaleString("pt-BR", {
minimumFractionDigits: 2,
maximumFractionDigits: 2
}) + "x";
}

function numeroFormatoFicha(valor) {
var numero = Number(valor);

if (isNaN(numero)) {
numero = 0;
}

return numero.toLocaleString("pt-BR", {
minimumFractionDigits: 0,
maximumFractionDigits: 2
});
}

function numeroExportFicha(valor) {
var numero = Number(valor);

if (isNaN(numero)) {
numero = 0;
}

return numero.toFixed(2).replace(".", ",");
}

function textoSeguroFicha(value) {
if (value === null || value === undefined) {
return "";
}

return String(value)
.replace(/&/g, String.fromCharCode(38) + "amp;")
.replace(/</g, String.fromCharCode(38) + "lt;")
.replace(/>/g, String.fromCharCode(38) + "gt;")
.replace(/"/g, String.fromCharCode(38) + "quot;")
.replace(/'/g, String.fromCharCode(38) + "#039;");
}

function gerarIdFicha(prefixo) {
if (typeof generateId === "function") {
return generateId(prefixo);
}

return prefixo + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
}

function mensagemFicha(texto, tipo) {
if (typeof showToast === "function") {
showToast(texto, tipo || "info");
return;
}

alert(texto);
}

function converterArquivoFichaBase64(file) {
return new Promise(function (resolve, reject) {
var reader = new FileReader();


reader.onload = function () {
  resolve(reader.result);
};

reader.onerror = function () {
  reject("Erro ao converter imagem.");
};

reader.readAsDataURL(file);


});
}


function calcularPercentualCustosOperacionaisFicha() {
var competencia = new Date().toISOString().slice(0, 7);
var totalCustos = 0;
var faturamento = obterFaturamentoMensalFicha(competencia);

try {
var texto = localStorage.getItem("balu_custos_operacionais");
var lista = texto ? JSON.parse(texto) : [];
if (Array.isArray(lista)) {
lista.forEach(function (item) {
var data = item.data || item.dataRegistro || "";
var status = item.status || "Confirmado";
if (String(data).slice(0, 7) === competencia && String(status) === "Confirmado") {
totalCustos += numeroFicha(item.valor || item.valorTotal || 0);
}
});
}
} catch (erro) {
console.warn("Erro ao calcular percentual de custos operacionais:", erro);
}

if (faturamento <= 0 || totalCustos <= 0) {
return "";
}

return numeroFormatoFicha(totalCustos / faturamento * 100);
}

function calcularPercentualMaoObraFicha() {
var competencia = new Date().toISOString().slice(0, 7);
var totalMaoObra = 0;
var faturamento = obterFaturamentoMensalFicha(competencia);

try {
var texto = localStorage.getItem("balu_funcionarios");
var lista = texto ? JSON.parse(texto) : [];
if (Array.isArray(lista)) {
lista.forEach(function (item) {
var status = item.status || item.funcionarioStatus || "Ativo";
if (String(status) !== "Inativo") {
totalMaoObra += numeroFicha(item.custoMensal || item.totalMensal || item.valorMensal || item.salario || item.valor || 0);
}
});
}
} catch (erro) {
console.warn("Erro ao calcular percentual de mão de obra:", erro);
}

if (faturamento <= 0 || totalMaoObra <= 0) {
return "";
}

return numeroFormatoFicha(totalMaoObra / faturamento * 100);
}

function obterFaturamentoMensalFicha(competencia) {
var total = 0;
try {
var texto = localStorage.getItem("balu_faturamento");
var lista = texto ? JSON.parse(texto) : [];
if (Array.isArray(lista)) {
lista.forEach(function (item) {
var data = item.data || item.dataRegistro || item.fatData || "";
var status = item.status || item.fatStatus || "Confirmado";
if (String(data).slice(0, 7) === competencia && String(status) === "Confirmado") {
total += numeroFicha(item.valor || item.valorTotal || item.fatValor || item.total || 0);
}
});
}
} catch (erro) {
console.warn("Erro ao carregar faturamento para ficha técnica:", erro);
}
return total;
}

function criarIconesFicha() {
if (window.lucide) {
lucide.createIcons();
}
}
