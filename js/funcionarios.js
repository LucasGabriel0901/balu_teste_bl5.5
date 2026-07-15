// ==============================
// BALU FOOD - FUNCIONÁRIOS E MÃO DE OBRA
// CLT, Freelancer, Pró-labore e MEI
// ==============================

var funcionariosCache = [];

var BALU_FUNCIONARIOS_KEY = "balu_funcionarios";
var BALU_FATURAMENTO_FUNCIONARIOS_KEY = "balu_faturamento_mensal";
var BALU_FATURAMENTO_OFICIAL_KEY = "balu_faturamento";
var BALU_FATURAMENTO_MEDIA_KEY = "balu_faturamento_media_meses";

document.addEventListener("DOMContentLoaded", function () {
initFuncionarios();
});

function initFuncionarios() {
funcionariosCache = carregarFuncionariosLocal();

initEventosFuncionarios();
initImagemFuncionario();
prepararNovoFuncionario();
renderFuncionarios();
criarIconesFuncionarios();

console.log("BALU Funcionários carregado.");
}

function initEventosFuncionarios() {
var form = document.getElementById("formFuncionario");
var btnNovo = document.getElementById("btnNovoFuncionario");
var search = document.getElementById("searchFuncionarios");
var filterTipo = document.getElementById("filterTipoFuncionario");
var filterStatus = document.getElementById("filterStatusFuncionario");
var btnExportar = document.getElementById("btnExportarFuncionarios");
var faturamentoInput = document.getElementById("faturamentoMensalInput");

if (btnNovo) {
btnNovo.addEventListener("click", function () {
prepararNovoFuncionario();
});
}

if (form) {
form.addEventListener("submit", function (event) {
event.preventDefault();
salvarFuncionario();
});
}

if (search) {
search.addEventListener("input", renderFuncionarios);
}

if (filterTipo) {
filterTipo.addEventListener("change", renderFuncionarios);
}

if (filterStatus) {
filterStatus.addEventListener("change", renderFuncionarios);
}

if (btnExportar) {
btnExportar.addEventListener("click", exportarFuncionarios);
}

if (faturamentoInput) {
faturamentoInput.readOnly = true;
faturamentoInput.classList.add("calculated-field");
faturamentoInput.title = "Valor calculado automaticamente pelo módulo Faturamento.";
faturamentoInput.value = obterFaturamentoMedioFuncionario().toFixed(2);
}

var botoesTipo = document.querySelectorAll(".employee-type-option");

botoesTipo.forEach(function (botao) {
botao.addEventListener("click", function () {
selecionarTipoFuncionario(botao.getAttribute("data-tipo"));
});
});

var camposCalculo = [
"salarioBase",
"encargosPercentual",
"horasMensaisClt",
"valorDiaria",
"diasMes",
"horasDiaria",
"valorMensal",
"horasMensaisMensal",
"faturamentoMensalInput"
];

camposCalculo.forEach(function (id) {
var campo = document.getElementById(id);


if (campo) {
  campo.addEventListener("input", atualizarPreviewFuncionario);
  campo.addEventListener("change", atualizarPreviewFuncionario);
}


});
}

function initImagemFuncionario() {
var input = document.getElementById("funcionarioImagemInput");
var preview = document.getElementById("funcionarioImagemPreview");
var placeholder = document.getElementById("funcionarioImagemPlaceholder");

if (!input || !preview) {
return;
}

input.addEventListener("change", function () {
var file = input.files && input.files[0];


if (!file) {
  return;
}

var reader = new FileReader();

reader.onload = function (event) {
  var imageBase64 = event.target.result;

  input.dataset.imageBase64 = imageBase64;
  preview.src = imageBase64;
  preview.style.display = "block";

  if (placeholder) {
    placeholder.style.display = "none";
  }
};

reader.readAsDataURL(file);


});
}

function prepararNovoFuncionario() {
resetarFormularioFuncionario();

var title = document.getElementById("drawerFuncionarioTitle");

if (title) {
title.textContent = "Novo Funcionário";
}

selecionarTipoFuncionario("CLT");
atualizarPreviewFuncionario();
}

function resetarFormularioFuncionario() {
var form = document.getElementById("formFuncionario");
var inputImagem = document.getElementById("funcionarioImagemInput");
var preview = document.getElementById("funcionarioImagemPreview");
var placeholder = document.getElementById("funcionarioImagemPlaceholder");

if (form) {
form.reset();
}

setValueFuncionario("funcionarioId", "");

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

setValueFuncionario("faturamentoMensalInput", obterFaturamentoMedioFuncionario().toFixed(2));
}

function selecionarTipoFuncionario(tipo) {
var inputTipo = document.getElementById("tipoContratacao");
var botoes = document.querySelectorAll(".employee-type-option");

if (!tipo) {
tipo = "CLT";
}

if (inputTipo) {
inputTipo.value = tipo;
}

botoes.forEach(function (botao) {
if (botao.getAttribute("data-tipo") === tipo) {
botao.classList.add("active");
} else {
botao.classList.remove("active");
}
});

mostrarSecaoTipoFuncionario(tipo);

setTextFuncionario("tipoSelecionadoPreview", tipo);
atualizarPreviewFuncionario();
}

function mostrarSecaoTipoFuncionario(tipo) {
var sectionClt = document.getElementById("sectionClt");
var sectionFreelancer = document.getElementById("sectionFreelancer");
var sectionMensal = document.getElementById("sectionMensal");

if (sectionClt) {
sectionClt.style.display = "none";
}

if (sectionFreelancer) {
sectionFreelancer.style.display = "none";
}

if (sectionMensal) {
sectionMensal.style.display = "none";
}

if (tipo === "CLT" && sectionClt) {
sectionClt.style.display = "block";
}

if (tipo === "Freelancer" && sectionFreelancer) {
sectionFreelancer.style.display = "block";
}

if ((tipo === "Pró-labore" || tipo === "MEI") && sectionMensal) {
sectionMensal.style.display = "block";
}
}

function salvarFuncionario() {
var id = getValueFuncionario("funcionarioId");
var funcionarioExistente = id ? buscarFuncionarioPorId(id) : null;
var nome = getValueFuncionario("funcionarioNome");

if (!nome) {
mensagemFuncionarios("Informe o nome ou função.", "warning");
return;
}

var calculos = calcularFuncionario();

var inputImagem = document.getElementById("funcionarioImagemInput");
var imagem = inputImagem && inputImagem.dataset.imageBase64 ? inputImagem.dataset.imageBase64 : "";

if (!imagem && funcionarioExistente && funcionarioExistente.imagem) {
imagem = funcionarioExistente.imagem;
}

var faturamento = obterFaturamentoMedioFuncionario();

if (faturamento > 0) {
localStorage.setItem(getChaveFaturamentoFuncionarios(), faturamento);
}

var agora = new Date().toISOString();

var funcionario = {
id: id || gerarIdFuncionario(),
imagem: imagem,
nome: nome,
tipo: getValueFuncionario("tipoContratacao") || "CLT",
cargo: getValueFuncionario("funcionarioCargo"),
departamento: getValueFuncionario("funcionarioDepartamento"),
status: getValueFuncionario("funcionarioStatus") || "Ativo",


salarioBase: numeroFuncionario(getValueFuncionario("salarioBase")),
encargosPercentual: numeroFuncionario(getValueFuncionario("encargosPercentual")),
valorEncargos: calculos.valorEncargos,
horasMensaisClt: numeroFuncionario(getValueFuncionario("horasMensaisClt")),

valorDiaria: numeroFuncionario(getValueFuncionario("valorDiaria")),
diasMes: numeroFuncionario(getValueFuncionario("diasMes")),
horasDiaria: numeroFuncionario(getValueFuncionario("horasDiaria")),

valorMensal: numeroFuncionario(getValueFuncionario("valorMensal")),
horasMensaisMensal: numeroFuncionario(getValueFuncionario("horasMensaisMensal")),

custoMensal: calculos.custoMensal,
custoHora: calculos.custoHora,
horasMes: calculos.horasMes,
participacao: calculos.participacao,

observacoes: getValueFuncionario("funcionarioObservacoes"),
criadoEm: funcionarioExistente ? funcionarioExistente.criadoEm : agora,
atualizadoEm: agora


};

if (id) {
funcionariosCache = funcionariosCache.map(function (item) {
return item.id === id ? funcionario : item;
});


mensagemFuncionarios("Funcionário atualizado com sucesso.", "success");


} else {
funcionariosCache.push(funcionario);


mensagemFuncionarios("Funcionário cadastrado com sucesso.", "success");


}

salvarFuncionariosLocal(funcionariosCache);

if (typeof closeDrawer === "function") {
closeDrawer();
}

resetarFormularioFuncionario();
renderFuncionarios();
}

function editarFuncionario(id) {
var funcionario = buscarFuncionarioPorId(id);

if (!funcionario) {
mensagemFuncionarios("Funcionário não encontrado.", "danger");
return;
}

resetarFormularioFuncionario();

setValueFuncionario("funcionarioId", funcionario.id);
setValueFuncionario("funcionarioNome", funcionario.nome);
setValueFuncionario("funcionarioCargo", funcionario.cargo);
setValueFuncionario("funcionarioDepartamento", funcionario.departamento);
setValueFuncionario("funcionarioStatus", funcionario.status);

setValueFuncionario("salarioBase", numeroParaInputFuncionario(funcionario.salarioBase));
setValueFuncionario("encargosPercentual", numeroParaInputFuncionario(funcionario.encargosPercentual));
setValueFuncionario("horasMensaisClt", numeroParaInputFuncionario(funcionario.horasMensaisClt));

setValueFuncionario("valorDiaria", numeroParaInputFuncionario(funcionario.valorDiaria));
setValueFuncionario("diasMes", numeroParaInputFuncionario(funcionario.diasMes));
setValueFuncionario("horasDiaria", numeroParaInputFuncionario(funcionario.horasDiaria));

setValueFuncionario("valorMensal", numeroParaInputFuncionario(funcionario.valorMensal));
setValueFuncionario("horasMensaisMensal", numeroParaInputFuncionario(funcionario.horasMensaisMensal));

setValueFuncionario("funcionarioObservacoes", funcionario.observacoes);

var faturamentoSalvo = localStorage.getItem(getChaveFaturamentoFuncionarios());

if (faturamentoSalvo) {
setValueFuncionario("faturamentoMensalInput", faturamentoSalvo);
}

selecionarTipoFuncionario(funcionario.tipo || "CLT");

var title = document.getElementById("drawerFuncionarioTitle");
var inputImagem = document.getElementById("funcionarioImagemInput");
var preview = document.getElementById("funcionarioImagemPreview");
var placeholder = document.getElementById("funcionarioImagemPlaceholder");

if (title) {
title.textContent = "Editar Funcionário";
}

if (inputImagem) {
inputImagem.dataset.imageBase64 = funcionario.imagem || "";
}

if (preview && funcionario.imagem) {
preview.src = funcionario.imagem;
preview.style.display = "block";


if (placeholder) {
  placeholder.style.display = "none";
}


}

atualizarPreviewFuncionario();

if (typeof openDrawer === "function") {
openDrawer("drawerFuncionario");
}
}

function excluirFuncionario(id) {
var funcionario = buscarFuncionarioPorId(id);

if (!funcionario) {
return;
}

var confirmar = confirm("Deseja excluir " + funcionario.nome + "?");

if (!confirmar) {
return;
}

funcionariosCache = funcionariosCache.filter(function (item) {
return item.id !== id;
});

salvarFuncionariosLocal(funcionariosCache);
renderFuncionarios();

mensagemFuncionarios("Funcionário excluído com sucesso.", "success");
}

function buscarFuncionarioPorId(id) {
return funcionariosCache.find(function (item) {
return item.id === id;
});
}

function calcularFuncionario() {
var tipo = getValueFuncionario("tipoContratacao") || "CLT";
var faturamento = obterFaturamentoMedioFuncionario();

var custoMensal = 0;
var horasMes = 0;
var valorEncargos = 0;

if (tipo === "CLT") {
var salarioBase = numeroFuncionario(getValueFuncionario("salarioBase"));
var encargosPercentual = numeroFuncionario(getValueFuncionario("encargosPercentual"));
var horasMensaisClt = numeroFuncionario(getValueFuncionario("horasMensaisClt"));


valorEncargos = salarioBase * (encargosPercentual / 100);
custoMensal = salarioBase + valorEncargos;
horasMes = horasMensaisClt;


}

if (tipo === "Freelancer") {
var valorDiaria = numeroFuncionario(getValueFuncionario("valorDiaria"));
var diasMes = numeroFuncionario(getValueFuncionario("diasMes"));
var horasDiaria = numeroFuncionario(getValueFuncionario("horasDiaria"));


custoMensal = valorDiaria * diasMes;
horasMes = diasMes * horasDiaria;


}

if (tipo === "Pró-labore" || tipo === "MEI") {
var valorMensal = numeroFuncionario(getValueFuncionario("valorMensal"));
var horasMensaisMensal = numeroFuncionario(getValueFuncionario("horasMensaisMensal"));


custoMensal = valorMensal;
horasMes = horasMensaisMensal;


}

var custoHora = horasMes > 0 ? custoMensal / horasMes : 0;
var participacao = faturamento > 0 ? (custoMensal / faturamento) * 100 : 0;

return {
custoMensal: custoMensal,
horasMes: horasMes,
valorEncargos: valorEncargos,
custoHora: custoHora,
participacao: participacao
};
}

function atualizarPreviewFuncionario() {
var calculos = calcularFuncionario();
var tipo = getValueFuncionario("tipoContratacao") || "CLT";
setValueFuncionario("faturamentoMensalInput", obterFaturamentoMedioFuncionario().toFixed(2));

setTextFuncionario("valorEncargosPreview", moedaFuncionario(calculos.valorEncargos));
setTextFuncionario("horasTotaisFreelancerPreview", numeroFormatadoFuncionario(calculos.horasMes, 2) + "h");
setTextFuncionario("custoMensalPreview", moedaFuncionario(calculos.custoMensal));
setTextFuncionario("custoHoraPreview", moedaFuncionario(calculos.custoHora));
setTextFuncionario("horasMesPreview", numeroFormatadoFuncionario(calculos.horasMes, 2) + "h");
setTextFuncionario("participacaoFuncionarioPreview", percentualFuncionario(calculos.participacao));
setTextFuncionario("tipoSelecionadoPreview", tipo);
}

function renderFuncionarios() {
var table = document.getElementById("funcionariosTable");

if (!table) {
return;
}

var lista = filtrarFuncionarios();

renderResumoFuncionarios();

if (lista.length === 0) {
table.innerHTML =
"<tr>" +
"<td colspan='10' class='text-muted'>Nenhum funcionário encontrado.</td>" +
"</tr>";


return;


}

table.innerHTML = lista.map(function (funcionario) {
return (
"<tr>" +
"<td>" +
"<div class='product-cell'>" +
renderThumbFuncionario(funcionario.imagem, funcionario.nome) +
"<div>" +
"<strong>" + textoSeguroFuncionario(funcionario.nome) + "</strong>" +
"<span>" + textoSeguroFuncionario(funcionario.departamento || "Sem departamento") + "</span>" +
"</div>" +
"</div>" +
"</td>" +
"<td>" + textoSeguroFuncionario(funcionario.tipo || "-") + "</td>" +
"<td>" + textoSeguroFuncionario(funcionario.cargo || "-") + "</td>" +
"<td><strong>" + getValorBaseFuncionario(funcionario) + "</strong></td>" +
"<td>" + moedaFuncionario(funcionario.valorEncargos) + "</td>" +
"<td>" + numeroFormatadoFuncionario(funcionario.horasMes, 2) + "h</td>" +
"<td><strong>" + moedaFuncionario(funcionario.custoMensal) + "</strong></td>" +
"<td>" + moedaFuncionario(funcionario.custoHora) + "</td>" +
"<td>" + badgeStatusFuncionario(funcionario.status || "Ativo") + "</td>" +
"<td>" +
"<div class='table-actions'>" +
"<button type='button' class='btn-icon' title='Editar' onclick='editarFuncionario(\"" + funcionario.id + "\")'>" +
"<i data-lucide='edit-3'></i>" +
"</button>" +
"<button type='button' class='btn-icon danger' title='Excluir' onclick='excluirFuncionario(\"" + funcionario.id + "\")'>" +
"<i data-lucide='trash-2'></i>" +
"</button>" +
"</div>" +
"</td>" +
"</tr>"
);
}).join("");

criarIconesFuncionarios();
}

function filtrarFuncionarios() {
var search = getValueFuncionario("searchFuncionarios").toLowerCase();
var tipo = getValueFuncionario("filterTipoFuncionario");
var status = getValueFuncionario("filterStatusFuncionario");

return funcionariosCache.filter(function (funcionario) {
var texto =
String(funcionario.nome || "") + " " +
String(funcionario.tipo || "") + " " +
String(funcionario.cargo || "") + " " +
String(funcionario.departamento || "") + " " +
String(funcionario.observacoes || "");


texto = texto.toLowerCase();

var passaBusca = !search || texto.indexOf(search) >= 0;
var passaTipo = !tipo || funcionario.tipo === tipo;
var passaStatus = !status || funcionario.status === status;

return passaBusca && passaTipo && passaStatus;


});
}

function renderResumoFuncionarios() {
var faturamento = obterFaturamentoMedioFuncionario();

var totalClt = 0;
var totalFreelancers = 0;
var totalProlaboreMei = 0;
var totalMaoObra = 0;
var totalHoras = 0;

funcionariosCache.forEach(function (funcionario) {
if (funcionario.status !== "Ativo") {
return;
}

var custo = numeroFuncionario(funcionario.custoMensal);

totalMaoObra = totalMaoObra + custo;
totalHoras = totalHoras + numeroFuncionario(funcionario.horasMes);

if (funcionario.tipo === "CLT") {
  totalClt = totalClt + custo;
} else if (funcionario.tipo === "Freelancer") {
  totalFreelancers = totalFreelancers + custo;
} else {
  totalProlaboreMei = totalProlaboreMei + custo;
}
});

var participacao = faturamento > 0 ? (totalMaoObra / faturamento) * 100 : 0;
var custoMedioHora = totalHoras > 0 ? totalMaoObra / totalHoras : 0;
var statusTexto = obterStatusTextoMaoObra(participacao);

setTextFuncionario("faturamentoMensalFuncionario", moedaFuncionario(faturamento));
setTextFuncionario("totalClt", moedaFuncionario(totalMaoObra));
setTextFuncionario("totalFreelancers", percentualFuncionario(participacao));
setTextFuncionario("totalMaoObra", statusTexto);
setTextFuncionario("totalProlaboreMei", moedaFuncionario(totalProlaboreMei));
setTextFuncionario("participacaoMaoObra", percentualFuncionario(participacao));
setTextFuncionario("custoMedioHora", percentualFuncionario(25));

atualizarStatusMaoObra(participacao);
}


function obterFaturamentoMedioFuncionario() {
if (typeof window.BALU_GET_FATURAMENTO_MEDIO === "function") {
return numeroFuncionario(window.BALU_GET_FATURAMENTO_MEDIO());
}

var registros = carregarListaFuncionarioLocal(BALU_FATURAMENTO_OFICIAL_KEY);
var meses = Number(localStorage.getItem(BALU_FATURAMENTO_MEDIA_KEY)) || 6;
var mapa = {};

registros.forEach(function (item) {
var status = String(item.status || "Confirmado").toLowerCase();
var competencia = item.competencia || String(item.data || "").slice(0, 7);
if (["cancelado", "cancelada", "rascunho"].indexOf(status) >= 0 || !competencia) {
  return;
}
var totalItem = Array.isArray(item.canais)
  ? item.canais.reduce(function (soma, canal) { return soma + numeroFuncionario(canal.valor || canal.total); }, 0)
  : numeroFuncionario(item.total || item.valor || item.faturamento);
mapa[competencia] = (mapa[competencia] || 0) + totalItem;
});

var mesesComRegistro = Object.keys(mapa)
.filter(function (chave) { return mapa[chave] > 0; })
.sort(function (a, b) { return String(b).localeCompare(String(a)); })
.slice(0, meses);

var total = mesesComRegistro.reduce(function (soma, chave) {
return soma + mapa[chave];
}, 0);

return mesesComRegistro.length ? total / mesesComRegistro.length : 0;
}

function ultimasCompetenciasFuncionario(qtd) {
var lista = [];
var data = new Date();
data.setDate(1);

for (var i = 0; i < qtd; i++) {
lista.push(data.getFullYear() + "-" + String(data.getMonth() + 1).padStart(2, "0"));
data.setMonth(data.getMonth() - 1);
}

return lista;
}

function carregarListaFuncionarioLocal(chave) {
try {
var texto = localStorage.getItem(chave);
var lista = texto ? JSON.parse(texto) : [];
return Array.isArray(lista) ? lista : [];
} catch (erro) {
return [];
}
}

function obterStatusTextoMaoObra(participacao) {
if (participacao <= 0) return "Não calculado";
if (participacao <= 25) return "Dentro da meta";
if (participacao <= 35) return "Atenção";
return "Acima do ideal";
}

function atualizarStatusMaoObra(participacao) {
var badge = document.getElementById("maoObraStatus");
var progress = document.getElementById("laborProgressFill");

if (progress) {
var largura = Math.min(Math.max(participacao, 0), 100);


progress.style.width = largura + "%";
progress.classList.remove("warning");
progress.classList.remove("danger");

if (participacao > 35) {
  progress.classList.add("danger");
} else if (participacao > 25) {
  progress.classList.add("warning");
}


}

if (!badge) {
return;
}

badge.className = "badge";

if (participacao <= 0) {
badge.textContent = "Não calculado";
badge.classList.add("neutral");
} else if (participacao <= 25) {
badge.textContent = "Saudável";
badge.classList.add("success");
} else if (participacao <= 35) {
badge.textContent = "Atenção";
badge.classList.add("warning");
} else {
badge.textContent = "Alto custo";
badge.classList.add("danger");
}
}

function getValorBaseFuncionario(funcionario) {
if (funcionario.tipo === "CLT") {
return moedaFuncionario(funcionario.salarioBase);
}

if (funcionario.tipo === "Freelancer") {
return moedaFuncionario(funcionario.valorDiaria) + " / diária";
}

return moedaFuncionario(funcionario.valorMensal);
}

function exportarFuncionarios() {
if (!funcionariosCache.length) {
mensagemFuncionarios("Não há funcionários para exportar.", "warning");
return;
}

var linhas = [];

linhas.push("Nome;Tipo;Cargo;Departamento;Status;Custo Mensal;Horas Mes;Custo Hora;Participacao");

funcionariosCache.forEach(function (item) {
linhas.push([
item.nome || "",
item.tipo || "",
item.cargo || "",
item.departamento || "",
item.status || "",
numeroExportFuncionario(item.custoMensal),
numeroExportFuncionario(item.horasMes),
numeroExportFuncionario(item.custoHora),
numeroExportFuncionario(item.participacao)
].join(";"));
});

var blob = new Blob([linhas.join("\n")], {
type: "text/csv;charset=utf-8;"
});

var url = URL.createObjectURL(blob);
var link = document.createElement("a");

link.href = url;
link.download = "balu-funcionarios.csv";
link.click();

URL.revokeObjectURL(url);

mensagemFuncionarios("Arquivo de funcionários exportado.", "success");
}

function carregarFuncionariosLocal() {
var chaves = [];

if (typeof BALU_KEYS !== "undefined" && BALU_KEYS && BALU_KEYS.funcionarios) {
chaves.push(BALU_KEYS.funcionarios);
}

chaves.push(BALU_FUNCIONARIOS_KEY);
chaves.push("funcionarios");

for (var i = 0; i < chaves.length; i++) {
try {
var dados = localStorage.getItem(chaves[i]);


  if (!dados) {
    continue;
  }

  var parsed = JSON.parse(dados);

  if (Array.isArray(parsed)) {
    return parsed;
  }
} catch (erro) {
  console.warn("Erro ao carregar funcionários:", erro);
}

}

return [];
}

function salvarFuncionariosLocal(lista) {
var chave = getChaveFuncionarios();

localStorage.setItem(chave, JSON.stringify(lista));
localStorage.setItem(BALU_FUNCIONARIOS_KEY, JSON.stringify(lista));
}

function getChaveFuncionarios() {
if (typeof BALU_KEYS !== "undefined" && BALU_KEYS && BALU_KEYS.funcionarios) {
return BALU_KEYS.funcionarios;
}

return BALU_FUNCIONARIOS_KEY;
}

function getChaveFaturamentoFuncionarios() {
if (typeof BALU_KEYS !== "undefined" && BALU_KEYS && BALU_KEYS.faturamentoMensal) {
return BALU_KEYS.faturamentoMensal;
}

return BALU_FATURAMENTO_FUNCIONARIOS_KEY;
}

function getValueFuncionario(id) {
var element = document.getElementById(id);

if (!element) {
return "";
}

return element.value;
}

function setValueFuncionario(id, value) {
var element = document.getElementById(id);

if (!element) {
return;
}

element.value = value === undefined || value === null ? "" : value;
}

function setTextFuncionario(id, value) {
var element = document.getElementById(id);

if (!element) {
return;
}

if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
element.value = value === undefined || value === null ? "" : value;
} else {
element.textContent = value === undefined || value === null ? "" : value;
}
}

function numeroFuncionario(valor) {
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

function numeroParaInputFuncionario(valor) {
var numero = numeroFuncionario(valor);

if (numero === 0) {
return "";
}

return String(numero).replace(",", ".");
}

function moedaFuncionario(valor) {
var numero = numeroFuncionario(valor);

return numero.toLocaleString("pt-BR", {
style: "currency",
currency: "BRL"
});
}

function percentualFuncionario(valor) {
var numero = numeroFuncionario(valor);

return numero.toLocaleString("pt-BR", {
minimumFractionDigits: 2,
maximumFractionDigits: 2
}) + "%";
}

function numeroFormatadoFuncionario(valor, casas) {
var numero = numeroFuncionario(valor);

return numero.toLocaleString("pt-BR", {
minimumFractionDigits: casas,
maximumFractionDigits: casas
});
}

function numeroExportFuncionario(valor) {
var numero = numeroFuncionario(valor);

return numero.toFixed(2).replace(".", ",");
}

function renderThumbFuncionario(imagem, nome) {
if (imagem) {
return "<img src='" + imagem + "' alt='" + textoSeguroFuncionario(nome || "Funcionário") + "' class='item-thumb'>";
}

var iniciais = String(nome || "F")
.trim()
.split(" ")
.map(function (parte) {
return parte.charAt(0);
})
.join("")
.substring(0, 2)
.toUpperCase();

return "<div class='item-thumb placeholder'>" + textoSeguroFuncionario(iniciais || "F") + "</div>";
}

function badgeStatusFuncionario(status) {
var texto = String(status || "Ativo");
var statusLower = texto.toLowerCase();
var classe = "neutral";

if (statusLower === "ativo") {
classe = "success";
}

if (statusLower === "afastado") {
classe = "warning";
}

if (statusLower === "inativo") {
classe = "danger";
}

return "<span class='badge " + classe + "'>" + textoSeguroFuncionario(texto) + "</span>";
}

function textoSeguroFuncionario(value) {
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

function gerarIdFuncionario() {
return "FUN-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

function mensagemFuncionarios(texto, tipo) {
if (typeof showToast === "function") {
showToast(texto, tipo || "info");
return;
}

alert(texto);
}

function criarIconesFuncionarios() {
if (window.lucide) {
lucide.createIcons();
}
}


