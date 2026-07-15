// ==============================
// BALU FOOD - CONFIGURAÇÕES
// Dados da empresa, plano, assinatura e preferências
// ==============================

var BALU_CONFIG_STORAGE_KEY = "balu_configuracoes_empresa";

document.addEventListener("DOMContentLoaded", function () {
initConfiguracoes();
});

function initConfiguracoes() {
initEventosConfiguracoes();
carregarConfiguracoesTela();
atualizarResumoConfiguracoes();
criarIconesConfiguracoes();

console.log("BALU Configurações carregado.");
}

function initEventosConfiguracoes() {
var form = document.getElementById("formConfiguracoes");
var btnSalvarTopo = document.getElementById("btnSalvarConfiguracoesTopo");
var btnRestaurar = document.getElementById("btnRestaurarConfiguracoes");
var btnLimpar = document.getElementById("btnLimparConfiguracoes");

if (form) {
form.addEventListener("submit", function (event) {
event.preventDefault();
salvarConfiguracoes();
});
}

if (btnSalvarTopo) {
btnSalvarTopo.addEventListener("click", function () {
salvarConfiguracoes();
});
}

if (btnRestaurar) {
btnRestaurar.addEventListener("click", function () {
carregarConfiguracoesTela();
mensagemConfiguracoes("Configurações restauradas.", "success");
});
}

if (btnLimpar) {
btnLimpar.addEventListener("click", function () {
limparConfiguracoes();
});
}

document.addEventListener("input", function (event) {
if (campoConfiguracoes(event.target)) {
atualizarResumoConfiguracoes();
}
}, true);

document.addEventListener("change", function (event) {
if (campoConfiguracoes(event.target)) {
atualizarResumoConfiguracoes();
aplicarValorAutomaticoPlano();
}
}, true);
}

function campoConfiguracoes(campo) {
if (!campo) {
return false;
}

return (
campo.id === "configNomeEmpresa" ||
campo.id === "configCnpj" ||
campo.id === "configSegmento" ||
campo.id === "configUnidade" ||
campo.id === "configResponsavel" ||
campo.id === "configTelefone" ||
campo.id === "configEmail" ||
campo.id === "configCidade" ||
campo.id === "configPlano" ||
campo.id === "configValorPlano" ||
campo.id === "configCicloPlano" ||
campo.id === "configFormaPagamento" ||
campo.id === "configStatusConta" ||
campo.id === "configStatusPagamento" ||
campo.id === "configDataInicio" ||
campo.id === "configProximoVencimento" ||
campo.id === "configCmvIdeal" ||
campo.id === "configMargemMinima" ||
campo.id === "configMarkupPadrao" ||
campo.id === "configMoeda" ||
campo.id === "configEstoqueBaixo" ||
campo.id === "configCmvAlerta" ||
campo.id === "configObservacoes"
);
}

function getConfiguracoesPadrao() {
var hoje = new Date();
var proximoMes = new Date();

proximoMes.setMonth(proximoMes.getMonth() + 1);

return {
nomeEmpresa: "Empresa Teste BALU",
cnpj: "",
segmento: "Restaurante",
unidade: "Matriz",
responsavel: "Lucas Gabriel",
telefone: "",
email: "lucas@balufood.com.br",
cidade: "Guarulhos",
plano: "BALU Food",
cicloPlano: "Mensal",
valorPlano: 250,
valorTrimestral: 675,
valorAnual: 2500,
formaPagamento: "Cartão de crédito",
statusConta: "Ativo",
statusPagamento: "Em dia",
dataInicio: formatarDataInput(hoje),
proximoVencimento: formatarDataInput(proximoMes),
cmvIdeal: 30,
margemMinima: 20,
markupPadrao: 3,
moeda: "BRL",
estoqueBaixo: "Ativo",
cmvAlerta: "Ativo",
observacoes: ""
};
}

function carregarConfiguracoesTela() {
var config = carregarConfiguracoesLocal();

setValueConfig("configNomeEmpresa", config.nomeEmpresa);
setValueConfig("configCnpj", config.cnpj);
setValueConfig("configSegmento", config.segmento);
setValueConfig("configUnidade", "Matriz");
setValueConfig("configResponsavel", config.responsavel);
setValueConfig("configTelefone", config.telefone);
setValueConfig("configEmail", config.email);
setValueConfig("configCidade", config.cidade);

setValueConfig("configPlano", "BALU Food");
setValueConfig("configCicloPlano", config.cicloPlano || "Mensal");
setValueConfig("configValorPlano", formatarValorCicloConfig(config.cicloPlano || "Mensal"));
setValueConfig("configFormaPagamento", "Cartão de crédito");
setValueConfig("configStatusConta", config.statusConta);
setValueConfig("configStatusPagamento", config.statusPagamento);
setValueConfig("configDataInicio", config.dataInicio);
setValueConfig("configProximoVencimento", config.proximoVencimento);

setValueConfig("configCmvIdeal", numeroParaInputConfig(config.cmvIdeal));
setValueConfig("configMargemMinima", numeroParaInputConfig(config.margemMinima));
setValueConfig("configMarkupPadrao", numeroParaInputConfig(config.markupPadrao));
setValueConfig("configMoeda", config.moeda);
setValueConfig("configEstoqueBaixo", config.estoqueBaixo);
setValueConfig("configCmvAlerta", config.cmvAlerta);
setValueConfig("configObservacoes", config.observacoes);

atualizarResumoConfiguracoes();
}

function salvarConfiguracoes() {
var nomeEmpresa = getValueConfig("configNomeEmpresa");
var responsavel = getValueConfig("configResponsavel");
var plano = "BALU Food";

if (!nomeEmpresa) {
mensagemConfiguracoes("Informe o nome da empresa.", "warning");
return;
}

if (!responsavel) {
mensagemConfiguracoes("Informe o responsável pela empresa.", "warning");
return;
}

if (!plano) {
mensagemConfiguracoes("Selecione o plano da empresa.", "warning");
return;
}

var config = {
nomeEmpresa: nomeEmpresa,
cnpj: getValueConfig("configCnpj"),
segmento: getValueConfig("configSegmento"),
unidade: "Matriz",
responsavel: responsavel,
telefone: getValueConfig("configTelefone"),
email: getValueConfig("configEmail"),
cidade: getValueConfig("configCidade"),

plano: "BALU Food",
cicloPlano: "Mensal",
valorPlano: 250,
valorTrimestral: 675,
valorAnual: 2500,
formaPagamento: "Cartão de crédito",
statusConta: getValueConfig("configStatusConta"),
statusPagamento: getValueConfig("configStatusPagamento"),
dataInicio: getValueConfig("configDataInicio"),
proximoVencimento: getValueConfig("configProximoVencimento"),

cmvIdeal: numeroConfig(getValueConfig("configCmvIdeal")),
margemMinima: numeroConfig(getValueConfig("configMargemMinima")),
markupPadrao: numeroConfig(getValueConfig("configMarkupPadrao")),
moeda: getValueConfig("configMoeda"),
estoqueBaixo: getValueConfig("configEstoqueBaixo"),
cmvAlerta: getValueConfig("configCmvAlerta"),
observacoes: getValueConfig("configObservacoes"),

atualizadoEm: new Date().toISOString()

};

salvarConfiguracoesLocal(config);
atualizarResumoConfiguracoes();

mensagemConfiguracoes("Configurações salvas com sucesso.", "success");
}

function limparConfiguracoes() {
var confirmar = confirm("Deseja limpar as configurações e voltar ao padrão?");

if (!confirmar) {
return;
}

localStorage.removeItem(BALU_CONFIG_STORAGE_KEY);

carregarConfiguracoesTela();
mensagemConfiguracoes("Configurações limpas e restauradas para o padrão.", "success");
}

function carregarConfiguracoesLocal() {
try {
var dados = localStorage.getItem(BALU_CONFIG_STORAGE_KEY);

if (!dados) {
  return getConfiguracoesPadrao();
}

var configSalva = JSON.parse(dados);
var configPadrao = getConfiguracoesPadrao();

return Object.assign({}, configPadrao, configSalva);

} catch (erro) {
console.warn("Erro ao carregar configurações:", erro);
return getConfiguracoesPadrao();
}
}

function salvarConfiguracoesLocal(config) {
try {
localStorage.setItem(BALU_CONFIG_STORAGE_KEY, JSON.stringify(config));
} catch (erro) {
console.warn("Erro ao salvar configurações:", erro);
mensagemConfiguracoes("Erro ao salvar configurações.", "danger");
}
}

function atualizarResumoConfiguracoes() {
var nomeEmpresa = getValueConfig("configNomeEmpresa") || "Empresa Teste BALU";
var plano = "BALU Food";
var statusConta = getValueConfig("configStatusConta") || "Ativo";
var statusPagamento = getValueConfig("configStatusPagamento") || "Em dia";

setTextConfig("configResumoEmpresa", nomeEmpresa);
setTextConfig("configResumoPlano", plano);
setTextConfig("configResumoStatus", statusConta);
setTextConfig("configResumoPagamento", statusPagamento);
}

function aplicarValorAutomaticoPlano() {
setValueConfig("configPlano", "BALU Food");
setValueConfig("configCicloPlano", config.cicloPlano || "Mensal");
setValueConfig("configValorPlano", formatarValorCicloConfig(config.cicloPlano || "Mensal"));
setValueConfig("configFormaPagamento", "Cartão de crédito");
}

function getValueConfig(id) {
var campo = document.getElementById(id);

if (!campo) {
return "";
}

return campo.value.trim();
}

function setValueConfig(id, value) {
var campo = document.getElementById(id);

if (!campo) {
return;
}

campo.value = value === undefined || value === null ? "" : value;
}

function setTextConfig(id, value) {
var campo = document.getElementById(id);

if (!campo) {
return;
}

campo.textContent = value === undefined || value === null ? "" : value;
}

function numeroConfig(valor) {
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

if (isNaN(numero)) {
return 0;
}

return numero;
}

function numeroParaInputConfig(valor) {
var numero = Number(valor);

if (isNaN(numero)) {
numero = 0;
}

if (numero % 1 === 0) {
return String(numero);
}

return String(numero).replace(".", ",");
}

function moedaConfig(valor) {
var numero = Number(valor);

if (isNaN(numero)) {
numero = 0;
}

return numero.toLocaleString("pt-BR", {
style: "currency",
currency: "BRL"
});
}

function formatarDataInput(data) {
var ano = data.getFullYear();
var mes = String(data.getMonth() + 1).padStart(2, "0");
var dia = String(data.getDate()).padStart(2, "0");

return ano + "-" + mes + "-" + dia;
}

function mensagemConfiguracoes(texto, tipo) {
if (typeof showToast === "function") {
showToast(texto, tipo || "info");
return;
}

alert(texto);
}

function criarIconesConfiguracoes() {
if (window.lucide) {
lucide.createIcons();
}
}

