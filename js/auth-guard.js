// ========================================
// BALU FOOD - AUTH GUARD SaaS
// Login obrigatório em todas as páginas internas
// ========================================

var BALU_AUTH_SESSION_KEY = "balu_auth_session";

(function protegerPaginaBalu() {
  var pagina = (window.location.pathname.split("/").pop() || "").toLowerCase();
  var paginasLivres = ["login.html"];

  if (paginasLivres.indexOf(pagina) >= 0) {
    return;
  }

  var sessao = typeof baluGetSession === "function" ? baluGetSession() : obterSessaoBalu();
  var resultado = typeof baluAccountCanAccess === "function" ? baluAccountCanAccess(sessao) : validarSessaoBasica(sessao);

  if (!resultado.ok) {
    try {
      localStorage.setItem("balu_auth_redirect", window.location.href);
      localStorage.removeItem(BALU_AUTH_SESSION_KEY);
      localStorage.removeItem("balu_api_token");
      localStorage.setItem("balu_auth_block_reason", resultado.motivo || "Faça login para continuar.");
    } catch (erro) {}

    redirecionarParaLogin();
    return;
  }

  if (pagina === "painel-controle.html" && !usuarioPodeAcessarPainel(sessao)) {
    window.location.href = "dashboard.html";
    return;
  }

  document.documentElement.classList.add("balu-authenticated");
})();

document.addEventListener("DOMContentLoaded", function () {
  preencherDadosDaSessao();
  iniciarBotoesLogout();
  iniciarAvisoStatusConta();

  setTimeout(function () {
    criarAreaUsuarioNoMenu();
    if (typeof window.BALU_RENDER_ICONS === "function") window.BALU_RENDER_ICONS();
  }, 120);
});

function redirecionarParaLogin() {
  var path = window.location.pathname || "";
  var destino = path.indexOf("/pages/") >= 0 ? "login.html" : "pages/login.html";
  window.location.replace(destino);
}

function obterSessaoBalu() {
  var sessaoTexto = localStorage.getItem(BALU_AUTH_SESSION_KEY);
  if (!sessaoTexto) return null;
  try { return JSON.parse(sessaoTexto); } catch (erro) { return null; }
}

function validarSessaoBasica(sessao) {
  if (!sessao || sessao.acesso_liberado === false || !sessao.usuario) {
    return { ok: false, motivo: "Sessão inválida." };
  }
  return { ok: true, motivo: "Sessão ativa." };
}

function usuarioPodeAcessarPainel(sessao) {
  if (!sessao || !sessao.usuario) return false;
  var perfil = String(sessao.usuario.perfil || "");
  return ["admin_balu", "representante_balu", "suporte_balu", "desenvolvedor_balu"].indexOf(perfil) >= 0;
}

function preencherDadosDaSessao() {
  var sessao = typeof baluGetSession === "function" ? baluGetSession() : obterSessaoBalu();
  if (!sessao) return;

  var usuarioNome = sessao.usuario && sessao.usuario.nome ? sessao.usuario.nome : "Usuário";
  var usuarioEmail = sessao.usuario && sessao.usuario.email ? sessao.usuario.email : "";
  var empresaNome = sessao.empresa && sessao.empresa.nome_fantasia ? sessao.empresa.nome_fantasia : "BALU Interno";
  var planoNome = sessao.plano && sessao.plano.nome ? sessao.plano.nome : "BALU Food";

  preencherTexto("[data-auth-user-name]", usuarioNome);
  preencherTexto("[data-auth-user-email]", usuarioEmail);
  preencherTexto("[data-auth-company-name]", empresaNome);
  preencherTexto("[data-auth-plan-name]", planoNome);
}

function preencherTexto(selector, texto) {
  document.querySelectorAll(selector).forEach(function (el) { el.textContent = texto; });
}

function criarAreaUsuarioNoMenu() {
  var sessao = typeof baluGetSession === "function" ? baluGetSession() : obterSessaoBalu();
  if (!sessao || document.querySelector(".sidebar-user-card")) return;

  var sidebar = encontrarSidebar();
  if (!sidebar) return;

  var usuarioNome = sessao.usuario && sessao.usuario.nome ? sessao.usuario.nome : "Usuário";
  var usuarioEmail = sessao.usuario && sessao.usuario.email ? sessao.usuario.email : "";
  var empresaNome = sessao.empresa && sessao.empresa.nome_fantasia ? sessao.empresa.nome_fantasia : "BALU Interno";
  var planoNome = sessao.plano && sessao.plano.nome ? sessao.plano.nome : "Acesso interno";
  var perfil = sessao.usuario && sessao.usuario.perfil ? sessao.usuario.perfil : "cliente";

  var card = document.createElement("div");
  card.className = "sidebar-user-card";
  card.innerHTML =
    "<div class='sidebar-user-top'>" +
      "<div class='sidebar-user-avatar'>" + pegarIniciais(usuarioNome) + "</div>" +
      "<div class='sidebar-user-info'>" +
        "<strong>" + escaparHtml(usuarioNome) + "</strong>" +
        "<span>" + escaparHtml(usuarioEmail) + "</span>" +
      "</div>" +
    "</div>" +
    "<div class='sidebar-company-info'>" +
      "<span>" + escaparHtml(empresaNome) + "</span>" +
      "<small>" + escaparHtml(planoNome) + " • " + escaparHtml(perfil) + "</small>" +
    "</div>" +
    "<button type='button' class='sidebar-logout-btn' data-auth-logout>" +
      "<i data-lucide='log-out'></i>" +
      "Sair do sistema" +
    "</button>";

  sidebar.appendChild(card);
}

function encontrarSidebar() {
  var seletores = [".sidebar", ".app-sidebar", ".layout-sidebar", ".side-menu", "aside", "[data-sidebar]"];
  for (var i = 0; i < seletores.length; i++) {
    var el = document.querySelector(seletores[i]);
    if (el) return el;
  }
  return null;
}

function iniciarBotoesLogout() {
  document.querySelectorAll("[data-auth-logout]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      if (typeof baluLogout === "function") baluLogout();
    });
  });
}

function iniciarAvisoStatusConta() {
  var sessao = typeof baluGetSession === "function" ? baluGetSession() : obterSessaoBalu();
  if (!sessao || !sessao.empresa || usuarioPodeAcessarPainel(sessao)) return;

  var status = String((sessao.assinatura && sessao.assinatura.status) || "Ativa");
  if (["Atrasada", "Aguardando pagamento", "Pagamento pendente"].indexOf(status) < 0) return;

  if (typeof showToast === "function") {
    showToast("Sua assinatura está com status: " + status + ". Verifique o plano.", "warning");
  }
}

function pegarIniciais(nome) {
  var partes = String(nome || "U").trim().split(" ");
  return ((partes[0] || "U").charAt(0) + (partes.length > 1 ? partes[partes.length - 1].charAt(0) : "")).toUpperCase();
}

function escaparHtml(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

function obterEmpresaIdAtual() { return typeof baluGetEmpresaId === "function" ? baluGetEmpresaId() : null; }
function obterUsuarioIdAtual() { return typeof baluGetUsuarioId === "function" ? baluGetUsuarioId() : null; }
function obterTokenAtual() { return typeof baluGetToken === "function" ? baluGetToken() : null; }
function obterEmpresaNomeAtual() { return typeof baluGetEmpresaNome === "function" ? baluGetEmpresaNome() : "Empresa"; }

window.obterEmpresaIdAtual = obterEmpresaIdAtual;
window.obterUsuarioIdAtual = obterUsuarioIdAtual;
window.obterTokenAtual = obterTokenAtual;
window.obterEmpresaNomeAtual = obterEmpresaNomeAtual;
