// ========================================
// BALU FOOD - LOGIN SaaS
// Demo local + preparado para API/backend
// ========================================

var BALU_AUTH_SESSION_KEY = "balu_auth_session";
var BALU_API_TOKEN_KEY = "balu_api_token";

var BALU_USUARIOS_TESTE = [
  {
    email: "dev@balufood.com.br",
    senha: "BaluDev2026!",
    usuario: { id: "dev-1", nome: "Desenvolvedor BALU", email: "dev@balufood.com.br", perfil: "desenvolvedor_balu", status: "Ativo" },
    empresa: null,
    plano: { nome: "Acesso interno BALU", ciclo: "Isento", valor: 0 },
    assinatura: { status: "Isento", ciclo: "Isento" }
  },
  {
    email: "admin@balufood.com.br",
    senha: "BaluAdmin2026!",
    usuario: { id: "admin-1", nome: "Admin BALU", email: "admin@balufood.com.br", perfil: "admin_balu", status: "Ativo" },
    empresa: null,
    plano: { nome: "Acesso interno BALU", ciclo: "Isento", valor: 0 },
    assinatura: { status: "Isento", ciclo: "Isento" }
  },
  {
    email: "representante@balufood.com.br",
    senha: "BaluRep2026!",
    usuario: { id: "rep-1", nome: "Representante BALU", email: "representante@balufood.com.br", perfil: "representante_balu", status: "Ativo" },
    empresa: null,
    plano: { nome: "Acesso interno BALU", ciclo: "Isento", valor: 0 },
    assinatura: { status: "Isento", ciclo: "Isento" }
  },
  {
    email: "cliente@balufood.com.br",
    senha: "BaluCliente2026!",
    usuario: { id: "cliente-1", nome: "Cliente Teste", email: "cliente@balufood.com.br", perfil: "cliente_admin", status: "Ativo" },
    empresa: { id: "empresa-demo-1", nome_fantasia: "Empresa Teste BALU", slug: "empresa-teste-balu", status: "Ativo", status_pagamento: "Em dia" },
    plano: { nome: "BALU Food", ciclo: "Mensal", valor: 250 },
    assinatura: { status: "Ativa", ciclo: "Mensal", data_vencimento: "2026-12-31" }
  }
];

document.addEventListener("DOMContentLoaded", function () {
  iniciarLoginBalu();
});

function iniciarLoginBalu() {
  var form = document.getElementById("loginForm");
  if (!form) return;

  limparSessaoBloqueadaMensagem();
  verificarSessaoExistente();

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    fazerLoginBalu();
  });

  iniciarBotoesPreencherTeste();
  iniciarToggleSenhaLogin();

  if (typeof window.BALU_RENDER_ICONS === "function") window.BALU_RENDER_ICONS();
}

function verificarSessaoExistente() {
  var sessao = obterSessaoLoginBalu();
  if (!sessao) return;

  var resultado = typeof baluAccountCanAccess === "function" ? baluAccountCanAccess(sessao) : { ok: sessao.acesso_liberado === true };
  if (resultado.ok) redirecionarAposLogin(sessao);
}

async function fazerLoginBalu() {
  var email = getLoginValue("loginEmail").toLowerCase();
  var senha = getLoginValue("loginPassword");

  if (!email || !senha) {
    mostrarMensagemLogin("Informe e-mail e senha.", "warning");
    return;
  }

  bloquearBotaoLogin(true);

  try {
    if (window.BALU_USE_API === true && typeof baluApiFetch === "function") {
      await fazerLoginViaApi(email, senha);
    } else {
      fazerLoginDemo(email, senha);
    }
  } catch (erro) {
    mostrarMensagemLogin(erro.message || "Erro ao fazer login.", "danger");
  } finally {
    bloquearBotaoLogin(false);
  }
}

async function fazerLoginViaApi(email, senha) {
  var resposta = await baluApiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: email, senha: senha })
  });

  var dados = resposta.data || resposta;
  var sessao = dados.session || dados;

  salvarSessaoLoginBalu(sessao);
  mostrarMensagemLogin("Login realizado com sucesso.", "success");
  setTimeout(function () { redirecionarAposLogin(sessao); }, 450);
}

function fazerLoginDemo(email, senha) {
  var usuarioEncontrado = BALU_USUARIOS_TESTE.find(function (item) {
    return String(item.email).toLowerCase() === email && item.senha === senha;
  });

  if (!usuarioEncontrado) {
    throw new Error("E-mail ou senha inválidos.");
  }

  if (usuarioEncontrado.usuario.status !== "Ativo") {
    throw new Error("Usuário bloqueado ou inativo.");
  }

  var sessao = {
    token: gerarTokenLoginBalu(),
    acesso_liberado: true,
    motivo_bloqueio: null,
    usuario: usuarioEncontrado.usuario,
    empresa: usuarioEncontrado.empresa,
    plano: usuarioEncontrado.plano,
    assinatura: usuarioEncontrado.assinatura,
    login_em: new Date().toISOString()
  };

  salvarSessaoLoginBalu(sessao);
  mostrarMensagemLogin("Login realizado com sucesso.", "success");

  setTimeout(function () { redirecionarAposLogin(sessao); }, 450);
}

function salvarSessaoLoginBalu(sessao) {
  var normalizada = typeof baluNormalizeSession === "function" ? baluNormalizeSession(sessao) : sessao;
  localStorage.setItem(BALU_AUTH_SESSION_KEY, JSON.stringify(normalizada));
  if (normalizada.token) localStorage.setItem(BALU_API_TOKEN_KEY, normalizada.token);
}

function redirecionarAposLogin(sessao) {
  var perfil = sessao && sessao.usuario ? String(sessao.usuario.perfil || "") : "";
  var destinoSalvo = localStorage.getItem("balu_auth_redirect");
  localStorage.removeItem("balu_auth_redirect");

  if (["admin_balu", "representante_balu", "suporte_balu", "desenvolvedor_balu"].indexOf(perfil) >= 0) {
    window.location.href = destinoSalvo && destinoSalvo.indexOf("login.html") < 0 ? destinoSalvo : "painel-controle.html";
    return;
  }

  window.location.href = destinoSalvo && destinoSalvo.indexOf("login.html") < 0 ? destinoSalvo : "dashboard.html";
}

function iniciarBotoesPreencherTeste() {
  var loginBox = document.querySelector(".login-test-box");
  if (!loginBox || loginBox.querySelector(".login-test-actions")) return;

  var actions = document.createElement("div");
  actions.className = "login-test-actions";
  actions.innerHTML =
    "<button type='button' class='login-test-btn' data-login-demo='dev@balufood.com.br' data-login-pass='BaluDev2026!'>Dev</button>" +
    "<button type='button' class='login-test-btn' data-login-demo='admin@balufood.com.br' data-login-pass='BaluAdmin2026!'>Admin</button>" +
    "<button type='button' class='login-test-btn' data-login-demo='representante@balufood.com.br' data-login-pass='BaluRep2026!'>Representante</button>" +
    "<button type='button' class='login-test-btn' data-login-demo='cliente@balufood.com.br' data-login-pass='BaluCliente2026!'>Cliente</button>";

  loginBox.appendChild(actions);

  document.querySelectorAll("[data-login-demo]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      setLoginValue("loginEmail", botao.getAttribute("data-login-demo"));
      setLoginValue("loginPassword", botao.getAttribute("data-login-pass"));
    });
  });
}

function iniciarToggleSenhaLogin() {
  var togglePassword = document.getElementById("togglePassword");
  var passwordInput = document.getElementById("loginPassword");

  if (!togglePassword || !passwordInput) return;

  togglePassword.addEventListener("click", function () {
    var isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePassword.innerHTML = isPassword ? "<i data-lucide='eye'></i>" : "<i data-lucide='eye-off'></i>";
    if (typeof window.BALU_RENDER_ICONS === "function") window.BALU_RENDER_ICONS();
  });
}

function obterSessaoLoginBalu() {
  var texto = localStorage.getItem(BALU_AUTH_SESSION_KEY);
  if (!texto) return null;
  try { return JSON.parse(texto); } catch (erro) { localStorage.removeItem(BALU_AUTH_SESSION_KEY); return null; }
}

function getLoginValue(id) {
  var campo = document.getElementById(id);
  return campo ? String(campo.value || "").trim() : "";
}

function setLoginValue(id, valor) {
  var campo = document.getElementById(id);
  if (campo) campo.value = valor || "";
}

function bloquearBotaoLogin(bloquear) {
  var botao = document.querySelector(".login-submit-btn");
  if (!botao) return;
  botao.disabled = !!bloquear;
  botao.textContent = bloquear ? "Entrando..." : "Entrar";
}

function gerarTokenLoginBalu() {
  return "token_balu_" + Date.now() + "_" + Math.floor(Math.random() * 999999);
}

function mostrarMensagemLogin(mensagem, tipo) {
  if (typeof showToast === "function") { showToast(mensagem, tipo || "info"); return; }

  var alertaExistente = document.querySelector(".login-alert");
  if (alertaExistente) alertaExistente.remove();

  var form = document.getElementById("loginForm");
  if (!form) { alert(mensagem); return; }

  var alerta = document.createElement("div");
  alerta.className = "login-alert login-alert-" + (tipo || "info");
  alerta.textContent = mensagem;
  form.insertBefore(alerta, form.firstChild);

  setTimeout(function () { if (alerta && alerta.parentNode) alerta.remove(); }, 4200);
}

function limparSessaoBloqueadaMensagem() {
  var motivo = localStorage.getItem("balu_auth_block_reason");
  if (!motivo) return;
  localStorage.removeItem("balu_auth_block_reason");
  setTimeout(function () { mostrarMensagemLogin(motivo, "warning"); }, 250);
}
