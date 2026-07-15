// ========================================
// BALU FOOD - PAINEL DE CONTROLE LIMPO
// Topo + abas horizontais + modal de cliente
// ========================================

var PANEL_ADMIN_KEY = "balu_panel_admin_logged";
var PANEL_CLIENTS_KEY = "balu_panel_clients_clean";
var PANEL_LOGS_KEY = "balu_panel_logs_clean";

var painelState = {
clientes: [],
logs: []
};

document.addEventListener("DOMContentLoaded", function () {
iniciarPainelControle();
});

function iniciarPainelControle() {
carregarDadosPainel();
criarModalCliente();
iniciarEventosPainel();
verificarLoginPainel();

if (window.lucide) {
lucide.createIcons();
}
}

// ========================================
// LOGIN DO PAINEL
// ========================================

function verificarLoginPainel() {
var logado = localStorage.getItem(PANEL_ADMIN_KEY);

if (logado === "true") {
mostrarAppPainel();
} else {
mostrarLoginPainel();
}
}

function mostrarLoginPainel() {
var loginScreen = document.getElementById("panelLoginScreen");
var app = document.getElementById("panelApp");

if (loginScreen) {
loginScreen.classList.remove("is-hidden");
}

if (app) {
app.classList.add("is-hidden");
}
}

function mostrarAppPainel() {
var loginScreen = document.getElementById("panelLoginScreen");
var app = document.getElementById("panelApp");

if (loginScreen) {
loginScreen.classList.add("is-hidden");
}

if (app) {
app.classList.remove("is-hidden");
}

renderizarPainel();
}

function fazerLoginPainel() {
var login = pegarValorCampo("adminLogin");
var senha = pegarValorCampo("adminSenha");

if (login === "@lucas" && senha === "1234") {
localStorage.setItem(PANEL_ADMIN_KEY, "true");


adicionarLog("Login administrativo", "Lucas Gabriel entrou no painel de controle.", "Painel", "Sucesso");

mostrarAlertaLogin("Acesso liberado. Abrindo painel...", "success");

setTimeout(function () {
  mostrarAppPainel();
}, 500);

return;


}

mostrarAlertaLogin("Login ou senha incorretos. Use @lucas e 1234.", "danger");
}

function sairPainel() {
adicionarLog("Logout administrativo", "Lucas Gabriel saiu do painel de controle.", "Painel", "Sucesso");

localStorage.removeItem(PANEL_ADMIN_KEY);

mostrarToast("Você saiu do painel.", "success");

setTimeout(function () {
mostrarLoginPainel();
}, 500);
}

function mostrarAlertaLogin(mensagem, tipo) {
var alerta = document.getElementById("panelLoginAlert");

if (!alerta) {
return;
}

alerta.textContent = mensagem;
alerta.className = "panel-alert is-visible " + (tipo || "success");
}

// ========================================
// EVENTOS
// ========================================

function iniciarEventosPainel() {
var formLogin = document.getElementById("formPainelLogin");
var btnLogout = document.getElementById("btnPainelLogout");
var btnAtualizar = document.getElementById("btnAtualizarPainel");
var btnNovoCliente = document.getElementById("btnNovoCliente");
var btnAbrirNovoCliente = document.getElementById("btnAbrirNovoCliente");
var buscaClientes = document.getElementById("buscaClientes");
var filtroClientes = document.getElementById("filtroClientes");

if (formLogin) {
formLogin.addEventListener("submit", function (event) {
event.preventDefault();
fazerLoginPainel();
});
}

if (btnLogout) {
btnLogout.addEventListener("click", function () {
sairPainel();
});
}

if (btnAtualizar) {
btnAtualizar.addEventListener("click", function () {
renderizarPainel();
mostrarToast("Painel atualizado.", "success");
});
}

if (btnNovoCliente) {
btnNovoCliente.addEventListener("click", function () {
abrirModalCliente();
});
}

if (btnAbrirNovoCliente) {
btnAbrirNovoCliente.addEventListener("click", function () {
abrirModalCliente();
});
}

if (buscaClientes) {
buscaClientes.addEventListener("input", function () {
renderizarTabelaClientes();
});
}

if (filtroClientes) {
filtroClientes.addEventListener("change", function () {
renderizarTabelaClientes();
});
}

var abas = document.querySelectorAll(".panel-menu-item");

abas.forEach(function (aba) {
aba.addEventListener("click", function () {
trocarAbaPainel(aba.getAttribute("data-section"));
});
});
}

// ========================================
// DADOS
// ========================================

function carregarDadosPainel() {
painelState.clientes = carregarLista(PANEL_CLIENTS_KEY);
painelState.logs = carregarLista(PANEL_LOGS_KEY);

if (painelState.clientes.length === 0) {
painelState.clientes = gerarClientesIniciais();
salvarClientes();
}

if (painelState.logs.length === 0) {
painelState.logs = [
criarLog("Painel iniciado", "Painel de controle carregado com dados simulados.", "Painel", "Sucesso"),
criarLog("Cliente criado", "Cliente Marmitaria da Ana criado automaticamente para teste.", "Clientes", "Sucesso"),
criarLog("Pagamento registrado", "Pagamento do cliente Burger House SP está em dia.", "Financeiro", "Sucesso")
];


salvarLogs();


}
}

function carregarLista(chave) {
var texto = localStorage.getItem(chave);

if (!texto) {
return [];
}

try {
return JSON.parse(texto);
} catch (erro) {
localStorage.removeItem(chave);
return [];
}
}

function salvarClientes() {
localStorage.setItem(PANEL_CLIENTS_KEY, JSON.stringify(painelState.clientes));
}

function salvarLogs() {
localStorage.setItem(PANEL_LOGS_KEY, JSON.stringify(painelState.logs));
}

function gerarClientesIniciais() {
return [
criarCliente("Marmitaria da Ana", "Ana Paula", "ana@marmitaria.com", "(11) 99999-1111", "Mensal", "Ativo", "Em dia"),
criarCliente("Burger House SP", "Carlos Lima", "carlos@burgerhouse.com", "(11) 99999-2222", "Trimestral", "Ativo", "Em dia"),
criarCliente("Buffet Sabor e Arte", "Mariana Souza", "mariana@buffetsabor.com", "(11) 99999-3333", "Anual", "Trial", "Pendente"),
criarCliente("Lanchonete Central", "Roberto Alves", "roberto@central.com", "(11) 99999-4444", "Mensal", "Bloqueado", "Atrasado"),
criarCliente("Restaurante Oliveira", "Fernanda Oliveira", "fernanda@oliveira.com", "(11) 99999-5555", "Mensal", "Cancelado", "Cancelado")
];
}

// ========================================
// RENDERIZAÇÃO
// ========================================

function renderizarPainel() {
renderizarResumo();
renderizarClientesRecentes();
renderizarTabelaClientes();
renderizarFinanceiro();
renderizarLogs();

if (window.lucide) {
lucide.createIcons();
}
}

function renderizarResumo() {
var resumo = calcularResumo();

setTexto("cardTotalClientes", resumo.totalClientes);
setTexto("cardClientesAtivos", resumo.clientesAtivos);
setTexto("cardClientesTeste", resumo.clientesTeste);
setTexto("cardClientesInadimplentes", resumo.inadimplentes);
setTexto("cardMrrBruto", formatarMoeda(resumo.mrrBruto));
setTexto("cardMrrLiquido", formatarMoeda(resumo.mrrLiquido));
setTexto("cardCustosOperacionais", formatarMoeda(resumo.custos));
setTexto("cardReceitaAtraso", formatarMoeda(resumo.receitaAtraso));

setTexto("infoPercentualAtivos", formatarPercentual(resumo.percentualAtivos));
setTexto("infoPercentualInadimplencia", formatarPercentual(resumo.percentualInadimplencia));
setTexto("infoPlanoMaisContratado", resumo.planoMaisContratado);
setTexto("infoTicketMedio", formatarMoeda(resumo.ticketMedio));
}

function renderizarClientesRecentes() {
var container = document.getElementById("clientesRecentesLista");

if (!container) {
return;
}

var lista = painelState.clientes.slice().sort(function (a, b) {
return b.id - a.id;
}).slice(0, 5);

if (lista.length === 0) {
container.innerHTML = "<p>Nenhum cliente cadastrado.</p>";
return;
}

var html = "";

lista.forEach(function (cliente) {
html +=
"<div class='panel-mini-item'>" +
"<div>" +
"<strong>" + cliente.nomeEmpresa + "</strong>" +
"<span>" + cliente.responsavel + " • BALU Food • " + cliente.cicloPlano + "</span>" +
"</div>" +
criarBadge(cliente.statusConta) +
"</div>";
});

container.innerHTML = html;
}

function renderizarTabelaClientes() {
var tbody = document.getElementById("clientesTableBody");

if (!tbody) {
return;
}

var busca = pegarValorCampo("buscaClientes").toLowerCase();
var filtro = pegarValorCampo("filtroClientes");

if (!filtro) {
filtro = "todos";
}

var clientes = painelState.clientes.filter(function (cliente) {
var texto = (
cliente.nomeEmpresa + " " +
cliente.responsavel + " " +
cliente.email + " " +
cliente.cicloPlano + " " +
cliente.statusConta + " " +
cliente.statusPagamento
).toLowerCase();


var passouBusca = texto.indexOf(busca) >= 0;
var passouFiltro = filtro === "todos" || cliente.statusConta === filtro;

return passouBusca && passouFiltro;


});

if (clientes.length === 0) {
tbody.innerHTML = "<tr><td colspan='8'>Nenhum cliente encontrado.</td></tr>";
return;
}

var html = "";

clientes.forEach(function (cliente) {
atualizarFinanceiroCliente(cliente);


html +=
  "<tr>" +
    "<td>" +
      "<strong>" + cliente.nomeEmpresa + "</strong>" +
      "<small>" + cliente.email + "</small>" +
    "</td>" +
    "<td>" +
      cliente.responsavel +
      "<small>" + cliente.telefone + "</small>" +
    "</td>" +
    "<td>" + criarBadgePlano(cliente.cicloPlano) + "</td>" +
    "<td>" + criarBadge(cliente.statusConta) + "</td>" +
    "<td>" + criarBadge(cliente.statusPagamento) + "</td>" +
    "<td>" +
      formatarMoeda(cliente.valorMensal) +
      "<small>Líquido: " + formatarMoeda(cliente.liquidoEstimado) + "</small>" +
    "</td>" +
    "<td>" + formatarData(cliente.dataVencimento) + "</td>" +
    "<td>" +
      "<div class='panel-actions'>" +
        "<button class='panel-action-btn' onclick='acaoClientePainel(\"ver\", " + cliente.id + ")'>Ver</button>" +
        "<button class='panel-action-btn warning' onclick='acaoClientePainel(\"bloquear\", " + cliente.id + ")'>Bloquear</button>" +
        "<button class='panel-action-btn' onclick='acaoClientePainel(\"liberar\", " + cliente.id + ")'>Liberar</button>" +
        "<button class='panel-action-btn' onclick='acaoClientePainel(\"pagamento\", " + cliente.id + ")'>Pagamento ok</button>" +
        "<button class='panel-action-btn danger' onclick='acaoClientePainel(\"cancelar\", " + cliente.id + ")'>Cancelar</button>" +
      "</div>" +
    "</td>" +
  "</tr>";


});

tbody.innerHTML = html;
}

function renderizarFinanceiro() {
var resumo = calcularResumo();

setTexto("finReceitaBruta", formatarMoeda(resumo.mrrBruto));
setTexto("finReceitaLiquida", formatarMoeda(resumo.mrrLiquido));
setTexto("finTicketBruto", formatarMoeda(resumo.ticketMedio));
setTexto("finClientesInadimplentes", resumo.inadimplentes);

var tbody = document.getElementById("planosFinanceiroTableBody");

if (!tbody) {
return;
}

var mensal = calcularPlano("Mensal");
var trimestral = calcularPlano("Trimestral");
var anual = calcularPlano("Anual");

tbody.innerHTML =
criarLinhaPlano("Mensal", mensal) +
criarLinhaPlano("Trimestral", trimestral) +
criarLinhaPlano("Anual", anual);
}

function renderizarLogs() {
var tbody = document.getElementById("logsTableBody");

if (!tbody) {
return;
}

var logs = painelState.logs.slice().sort(function (a, b) {
return b.id - a.id;
}).slice(0, 50);

if (logs.length === 0) {
tbody.innerHTML = "<tr><td colspan='5'>Nenhum log registrado.</td></tr>";
return;
}

var html = "";

logs.forEach(function (log) {
html +=
"<tr>" +
"<td>" +
formatarDataHora(log.criadoEm) +
"<small>" + log.responsavel + "</small>" +
"</td>" +
"<td>" + log.tipoEvento + "</td>" +
"<td>" + log.descricao + "</td>" +
"<td>" + log.origem + "</td>" +
"<td>" + criarBadge(log.status) + "</td>" +
"</tr>";
});

tbody.innerHTML = html;
}

// ========================================
// CÁLCULOS
// ========================================

function calcularResumo() {
var total = painelState.clientes.length;

var ativos = contarStatus("Ativo");
var teste = contarStatus("Teste");

var inadimplentes = painelState.clientes.filter(function (cliente) {
return cliente.statusConta === "Inadimplente" || cliente.statusPagamento === "Atrasado";
}).length;

var clientesValidos = painelState.clientes.filter(function (cliente) {
return cliente.statusConta !== "Cancelado";
});

var mrrBruto = 0;
var receitaAtraso = 0;

clientesValidos.forEach(function (cliente) {
atualizarFinanceiroCliente(cliente);

mrrBruto += cliente.valorMensal;

if (cliente.statusConta === "Inadimplente" || cliente.statusPagamento === "Atrasado") {
  receitaAtraso += cliente.valorMensal;
}

});

var custoTotal = clientesValidos.length * 75;
var mrrLiquido = mrrBruto - custoTotal;
var ticketMedio = clientesValidos.length > 0 ? mrrBruto / clientesValidos.length : 0;

var percentualAtivos = total > 0 ? ativos / total * 100 : 0;
var percentualInadimplencia = total > 0 ? inadimplentes / total * 100 : 0;

return {
totalClientes: total,
clientesAtivos: ativos,
clientesTeste: teste,
inadimplentes: inadimplentes,
mrrBruto: mrrBruto,
mrrLiquido: mrrLiquido,
custos: custoTotal,
receitaAtraso: receitaAtraso,
ticketMedio: ticketMedio,
percentualAtivos: percentualAtivos,
percentualInadimplencia: percentualInadimplencia,
planoMaisContratado: planoMaisContratado()
};
}

function calcularPlano(plano) {
var clientes = painelState.clientes.filter(function (cliente) {
return cliente.cicloPlano === plano && cliente.statusConta !== "Cancelado";
});

var bruto = 0;

clientes.forEach(function (cliente) {
atualizarFinanceiroCliente(cliente);
bruto += cliente.valorMensal;
});

var custo = clientes.length * 75;

return {
clientes: clientes.length,
bruto: bruto,
custo: custo,
liquido: bruto - custo
};
}

function criarLinhaPlano(nome, dados) {
return (
"<tr>" +
"<td>" + criarBadgePlano(nome) + "</td>" +
"<td>" + dados.clientes + "</td>" +
"<td>" + formatarMoeda(dados.bruto) + "</td>" +
"<td>" + formatarMoeda(dados.custo) + "</td>" +
"<td><strong>" + formatarMoeda(dados.liquido) + "</strong></td>" +
"</tr>"
);
}

function contarStatus(status) {
return painelState.clientes.filter(function (cliente) {
return cliente.statusConta === status;
}).length;
}

function planoMaisContratado() {
var mensal = painelState.clientes.filter(function (cliente) { return cliente.cicloPlano === "Mensal"; }).length;
var trimestral = painelState.clientes.filter(function (cliente) { return cliente.cicloPlano === "Trimestral"; }).length;
var anual = painelState.clientes.filter(function (cliente) { return cliente.cicloPlano === "Anual"; }).length;

if (mensal === 0 && trimestral === 0 && anual === 0) {
return "-";
}

if (anual >= trimestral && anual >= mensal) { return "Anual"; }
if (trimestral >= mensal) { return "Trimestral"; }
return "Mensal";
}

function atualizarFinanceiroCliente(cliente) {
var valorCiclo = obterValorCicloPainel(cliente.cicloPlano || cliente.plano || "Mensal");
cliente.valorMensal = valorCiclo.valorMensalEquivalente;
cliente.valorCiclo = valorCiclo.valorCiclo;
cliente.custoOperacional = 75;
cliente.liquidoEstimado = cliente.valorMensal - cliente.custoOperacional;
}

// ========================================
// AÇÕES DO CLIENTE
// ========================================

function acaoClientePainel(acao, id) {
var cliente = buscarCliente(id);

if (!cliente) {
mostrarToast("Cliente não encontrado.", "danger");
return;
}

if (acao === "ver") {
verCliente(cliente);
return;
}

if (acao === "bloquear") {
cliente.statusConta = "Bloqueado";
cliente.statusPagamento = "Atrasado";


adicionarLog("Cliente bloqueado", "Cliente " + cliente.nomeEmpresa + " foi bloqueado.", "Clientes", "Sucesso");
salvarClientes();
renderizarPainel();
mostrarToast("Cliente bloqueado.", "warning");
return;


}

if (acao === "liberar") {
cliente.statusConta = "Ativo";


if (cliente.statusPagamento === "Atrasado") {
  cliente.statusPagamento = "Pendente";
}

adicionarLog("Cliente liberado", "Cliente " + cliente.nomeEmpresa + " teve o acesso liberado.", "Clientes", "Sucesso");
salvarClientes();
renderizarPainel();
mostrarToast("Cliente liberado.", "success");
return;


}

if (acao === "pagamento") {
cliente.statusConta = "Ativo";
cliente.statusPagamento = "Em dia";
cliente.ultimoPagamento = dataHojeISO();
cliente.dataVencimento = adicionarDias(30);


adicionarLog("Pagamento registrado", "Pagamento do cliente " + cliente.nomeEmpresa + " foi registrado.", "Financeiro", "Sucesso");
salvarClientes();
renderizarPainel();
mostrarToast("Pagamento registrado.", "success");
return;


}

if (acao === "cancelar") {
if (!confirm("Deseja cancelar o cliente " + cliente.nomeEmpresa + "?")) {
return;
}

cliente.statusConta = "Cancelado";
cliente.statusPagamento = "Cancelado";

adicionarLog("Cliente cancelado", "Cliente " + cliente.nomeEmpresa + " foi cancelado.", "Clientes", "Sucesso");
salvarClientes();
renderizarPainel();
mostrarToast("Cliente cancelado.", "danger");


}
}

function verCliente(cliente) {
var texto =
"Empresa: " + cliente.nomeEmpresa + "\n" +
"Responsável: " + cliente.responsavel + "\n" +
"E-mail: " + cliente.email + "\n" +
"Telefone: " + cliente.telefone + "\n" +
"Plano: BALU Food\n" +
"Ciclo: " + (cliente.cicloPlano || cliente.plano || "Mensal") + "\n" +
"Status: " + cliente.statusConta + "\n" +
"Pagamento: " + cliente.statusPagamento + "\n" +
"Valor equivalente mensal: " + formatarMoeda(cliente.valorMensal) + "\n" +
"Valor do ciclo: " + formatarMoeda(cliente.valorCiclo || cliente.valorMensal) + "\n" +
"Link de acesso: " + cliente.linkAcesso;

alert(texto);

adicionarLog("Cliente visualizado", "Dados do cliente " + cliente.nomeEmpresa + " foram visualizados.", "Clientes", "Sucesso");
salvarLogs();
renderizarLogs();
}

function buscarCliente(id) {
for (var i = 0; i < painelState.clientes.length; i++) {
if (Number(painelState.clientes[i].id) === Number(id)) {
return painelState.clientes[i];
}
}

return null;
}

// ========================================
// MODAL DE NOVO CLIENTE
// ========================================

function criarModalCliente() {
if (document.getElementById("modalClientePainel")) {
return;
}

injetarCssModalCliente();

var modal = document.createElement("div");
modal.id = "modalClientePainel";
modal.className = "panel-modal-overlay is-hidden";

modal.innerHTML =
"<div class='panel-modal'>" +
"<div class='panel-modal-header'>" +
"<div>" +
"<span>Novo cliente</span>" +
"<h2>Cadastrar cliente no SaaS</h2>" +
"</div>" +
"<button type='button' id='btnFecharModalCliente' class='panel-modal-close'>&times;</button>" +
"</div>" +
"<form id='formNovoClientePainel' class='panel-modal-form'>" +
"<div class='panel-field'>" +
"<label>Nome da empresa</label>" +
"<input type='text' id='modalNomeEmpresa' placeholder='Ex: Marmitaria da Ana' required>" +
"</div>" +
"<div class='panel-field'>" +
"<label>Responsável</label>" +
"<input type='text' id='modalResponsavel' placeholder='Nome do responsável' required>" +
"</div>" +
"<div class='panel-field'>" +
"<label>E-mail</label>" +
"<input type='email' id='modalEmail' placeholder='cliente@email.com' required>" +
"</div>" +
"<div class='panel-field'>" +
"<label>Telefone</label>" +
"<input type='text' id='modalTelefone' placeholder='(11) 99999-9999'>" +
"</div>" +
"<div class='panel-field'>" +
"<label>Ciclo do plano único</label>" +
"<select id='modalPlano'>" +
"<option value='Mensal'>BALU Food Mensal - R$ 250</option>" +
"<option value='Trimestral'>BALU Food Trimestral - R$ 675</option>" +
"<option value='Anual'>BALU Food Anual - R$ 2.500</option>" +
"</select>" +
"</div>" +
"<div class='panel-field'>" +
"<label>Status inicial</label>" +
"<select id='modalStatus'>" +
"<option value='Teste'>Teste</option>" +
"<option value='Ativo'>Ativo</option>" +
"</select>" +
"</div>" +
"<div class='panel-modal-actions'>" +
"<button type='button' id='btnCancelarModalCliente' class='panel-secondary-button'>Cancelar</button>" +
"<button type='submit' class='panel-primary-button'>Cadastrar cliente</button>" +
"</div>" +
"</form>" +
"</div>";

document.body.appendChild(modal);

document.getElementById("btnFecharModalCliente").addEventListener("click", fecharModalCliente);
document.getElementById("btnCancelarModalCliente").addEventListener("click", fecharModalCliente);

document.getElementById("formNovoClientePainel").addEventListener("submit", function (event) {
event.preventDefault();
cadastrarClientePeloModal();
});
}

function abrirModalCliente() {
var modal = document.getElementById("modalClientePainel");

if (modal) {
modal.classList.remove("is-hidden");
}

limparCamposModalCliente();
}

function fecharModalCliente() {
var modal = document.getElementById("modalClientePainel");

if (modal) {
modal.classList.add("is-hidden");
}
}

function limparCamposModalCliente() {
setValorCampo("modalNomeEmpresa", "");
setValorCampo("modalResponsavel", "");
setValorCampo("modalEmail", "");
setValorCampo("modalTelefone", "");
setValorCampo("modalPlano", "Mensal");
setValorCampo("modalStatus", "Teste");
}

function cadastrarClientePeloModal() {
var nomeEmpresa = pegarValorCampo("modalNomeEmpresa");
var responsavel = pegarValorCampo("modalResponsavel");
var email = pegarValorCampo("modalEmail");
var telefone = pegarValorCampo("modalTelefone");
var plano = pegarValorCampo("modalPlano");
var status = pegarValorCampo("modalStatus");

if (!nomeEmpresa || !responsavel || !email) {
mostrarToast("Preencha empresa, responsável e e-mail.", "warning");
return;
}

var pagamento = status === "Ativo" ? "Em dia" : "Pendente";
var cliente = criarCliente(nomeEmpresa, responsavel, email, telefone, plano, status, pagamento);

painelState.clientes.push(cliente);
salvarClientes();

adicionarLog("Cliente criado", "Cliente " + nomeEmpresa + " cadastrado no painel.", "Clientes", "Sucesso");

fecharModalCliente();
renderizarPainel();
mostrarToast("Cliente cadastrado com sucesso.", "success");
}

function injetarCssModalCliente() {
if (document.getElementById("panelModalClienteCss")) {
return;
}

var style = document.createElement("style");
style.id = "panelModalClienteCss";

style.textContent =
".panel-modal-overlay{" +
"position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:9998;" +
"display:flex;align-items:center;justify-content:center;padding:22px;backdrop-filter:blur(8px);" +
"}" +
".panel-modal{" +
"width:100%;max-width:680px;background:#fff;border-radius:28px;border:1px solid #e2e8f0;" +
"box-shadow:0 30px 90px rgba(15,23,42,.22);padding:24px;" +
"}" +
".panel-modal-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px;}" +
".panel-modal-header span{display:block;color:#6d28d9;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;}" +
".panel-modal-header h2{margin:0;font-size:24px;letter-spacing:-.8px;}" +
".panel-modal-close{width:38px;height:38px;border:0;border-radius:14px;background:#f1f5f9;color:#0f172a;font-size:24px;font-weight:900;cursor:pointer;}" +
".panel-modal-form{display:grid;grid-template-columns:1fr 1fr;gap:14px;}" +
".panel-modal-actions{grid-column:1/-1;display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-top:6px;}" +
"@media(max-width:640px){.panel-modal-form{grid-template-columns:1fr}.panel-modal-actions{flex-direction:column}.panel-modal-actions button{width:100%}}";

document.head.appendChild(style);
}

// ========================================
// CRIAÇÃO DE OBJETOS
// ========================================

function criarCliente(nomeEmpresa, responsavel, email, telefone, plano, statusConta, statusPagamento) {
var cliente = {
id: gerarId(),
nomeEmpresa: nomeEmpresa,
responsavel: responsavel,
email: email,
telefone: telefone || "",
plano: "BALU Food",
cicloPlano: plano || "Mensal",
valorMensal: 0,
custoOperacional: 75,
liquidoEstimado: 0,
statusConta: statusConta || "Teste",
statusPagamento: statusPagamento || "Pendente",
dataInicio: dataHojeISO(),
dataVencimento: adicionarDias(30),
ultimoPagamento: "",
slug: gerarSlug(nomeEmpresa),
linkAcesso: "https://seudominio.com/app/" + gerarSlug(nomeEmpresa),
criadoEm: new Date().toISOString()
};

atualizarFinanceiroCliente(cliente);

return cliente;
}

function criarLog(tipoEvento, descricao, origem, status) {
return {
id: gerarId(),
tipoEvento: tipoEvento,
descricao: descricao,
origem: origem || "Painel",
status: status || "Sucesso",
responsavel: "Lucas Gabriel",
criadoEm: new Date().toISOString()
};
}

function adicionarLog(tipoEvento, descricao, origem, status) {
painelState.logs.push(criarLog(tipoEvento, descricao, origem, status));

if (painelState.logs.length > 300) {
painelState.logs = painelState.logs.slice(painelState.logs.length - 300);
}

salvarLogs();
}

// ========================================
// ABAS
// ========================================

function trocarAbaPainel(secao) {
var secoes = document.querySelectorAll(".panel-section");
var abas = document.querySelectorAll(".panel-menu-item");

secoes.forEach(function (item) {
item.classList.remove("active");
});

abas.forEach(function (item) {
item.classList.remove("active");
});

var secaoAtual = document.getElementById("section-" + secao);
var abaAtual = document.querySelector(".panel-menu-item[data-section='" + secao + "']");

if (secaoAtual) {
secaoAtual.classList.add("active");
}

if (abaAtual) {
abaAtual.classList.add("active");
}

setTexto("panelPageTitle", tituloSecao(secao));

if (window.lucide) {
lucide.createIcons();
}
}

function tituloSecao(secao) {
if (secao === "clientes") {
return "Clientes";
}

if (secao === "financeiro") {
return "Financeiro";
}

if (secao === "logs") {
return "Logs";
}

return "Visão Geral";
}

// ========================================
// BADGES
// ========================================

function criarBadge(texto) {
var classe = "dark";

if (texto === "Ativo" || texto === "Em dia" || texto === "Sucesso") {
classe = "success";
}

if (texto === "Teste" || texto === "Pendente") {
classe = "warning";
}

if (texto === "Inadimplente" || texto === "Bloqueado" || texto === "Cancelado" || texto === "Atrasado" || texto === "Erro") {
classe = "danger";
}

return "<span class='panel-badge " + classe + "'>" + texto + "</span>";
}

function criarBadgePlano(ciclo) {
var texto = ciclo || "Mensal";
if (texto === "Anual") {
return "<span class='panel-badge success'>BALU Food • Anual</span>";
}
if (texto === "Trimestral") {
return "<span class='panel-badge info'>BALU Food • Trimestral</span>";
}
return "<span class='panel-badge dark'>BALU Food • Mensal</span>";
}

function obterValorCicloPainel(ciclo) {
if (ciclo === "Anual") {
return { valorCiclo: 2500, valorMensalEquivalente: 2500 / 12 };
}

if (ciclo === "Trimestral") {
return { valorCiclo: 675, valorMensalEquivalente: 675 / 3 };
}

return { valorCiclo: 250, valorMensalEquivalente: 250 };
}

// ========================================
// HELPERS
// ========================================

function setTexto(id, valor) {
var elemento = document.getElementById(id);

if (elemento) {
elemento.textContent = valor;
}
}

function pegarValorCampo(id) {
var elemento = document.getElementById(id);

if (!elemento) {
return "";
}

return String(elemento.value || "").trim();
}

function setValorCampo(id, valor) {
var elemento = document.getElementById(id);

if (elemento) {
elemento.value = valor;
}
}

function formatarMoeda(valor) {
var numero = Number(valor);

if (isNaN(numero)) {
numero = 0;
}

return numero.toLocaleString("pt-BR", {
style: "currency",
currency: "BRL"
});
}

function formatarPercentual(valor) {
var numero = Number(valor);

if (isNaN(numero)) {
numero = 0;
}

return numero.toLocaleString("pt-BR", {
minimumFractionDigits: 1,
maximumFractionDigits: 1
}) + "%";
}

function formatarData(dataISO) {
if (!dataISO) {
return "-";
}

var partes = String(dataISO).substring(0, 10).split("-");

if (partes.length !== 3) {
return dataISO;
}

return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function formatarDataHora(dataISO) {
if (!dataISO) {
return "-";
}

var data = new Date(dataISO);

if (isNaN(data.getTime())) {
return dataISO;
}

return data.toLocaleString("pt-BR");
}

function dataHojeISO() {
return new Date().toISOString().substring(0, 10);
}

function adicionarDias(dias) {
var data = new Date();
data.setDate(data.getDate() + Number(dias || 0));

return data.toISOString().substring(0, 10);
}

function gerarId() {
return Date.now() + Math.floor(Math.random() * 9999);
}

function gerarSlug(texto) {
var slug = String(texto || "")
.toLowerCase()
.trim()
.replace(/[áàãâ]/g, "a")
.replace(/[éê]/g, "e")
.replace(/[í]/g, "i")
.replace(/[óôõ]/g, "o")
.replace(/[ú]/g, "u")
.replace(/[ç]/g, "c")
.replace(/[^a-z0-9]+/g, "-")
.replace(/^-+|-+$/g, "");

if (!slug) {
slug = "cliente";
}

return slug;
}

function mostrarToast(mensagem, tipo) {
var toast = document.getElementById("painelToast");

if (!toast) {
toast = document.createElement("div");
toast.id = "painelToast";
toast.style.position = "fixed";
toast.style.right = "22px";
toast.style.bottom = "22px";
toast.style.zIndex = "9999";
toast.style.maxWidth = "360px";
toast.style.padding = "14px 16px";
toast.style.borderRadius = "16px";
toast.style.fontFamily = "Inter, Arial, sans-serif";
toast.style.fontSize = "13px";
toast.style.fontWeight = "900";
toast.style.boxShadow = "0 18px 50px rgba(15, 23, 42, 0.18)";
document.body.appendChild(toast);
}

toast.textContent = mensagem;

if (tipo === "danger") {
toast.style.background = "#fee2e2";
toast.style.color = "#991b1b";
toast.style.border = "1px solid #fecaca";
} else if (tipo === "warning") {
toast.style.background = "#ffedd5";
toast.style.color = "#9a3412";
toast.style.border = "1px solid #fed7aa";
} else {
toast.style.background = "#dcfce7";
toast.style.color = "#166534";
toast.style.border = "1px solid #bbf7d0";
}

toast.style.display = "block";

setTimeout(function () {
toast.style.display = "none";
}, 2600);
}


