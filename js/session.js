// ========================================
// BALU FOOD - SESSION SaaS
// Sessão obrigatória, multiempresa e perfis internos
// ========================================

var BALU_SESSION_KEY = "balu_auth_session";
var BALU_API_TOKEN_KEY = "balu_api_token";

var BALU_INTERNAL_PROFILES = [
  "admin_balu",
  "representante_balu",
  "suporte_balu",
  "desenvolvedor_balu"
];

var BALU_CLIENT_PROFILES = [
  "cliente_admin",
  "cliente_colaborador",
  "Dono",
  "Admin",
  "Cliente",
  "Colaborador"
];

function baluGetSession() {
  var sessaoTexto = localStorage.getItem(BALU_SESSION_KEY);
  if (!sessaoTexto) return null;

  try {
    return JSON.parse(sessaoTexto);
  } catch (erro) {
    localStorage.removeItem(BALU_SESSION_KEY);
    localStorage.removeItem(BALU_API_TOKEN_KEY);
    return null;
  }
}

function baluSaveSession(sessao) {
  if (!sessao || typeof sessao !== "object") return false;

  var normalizada = baluNormalizeSession(sessao);
  localStorage.setItem(BALU_SESSION_KEY, JSON.stringify(normalizada));

  if (normalizada.token) {
    localStorage.setItem(BALU_API_TOKEN_KEY, normalizada.token);
  }

  return true;
}

function baluNormalizeSession(sessao) {
  var usuario = sessao.usuario || sessao.user || {};
  var empresa = sessao.empresa || {};
  var plano = sessao.plano || { nome: "BALU Food" };
  var assinatura = sessao.assinatura || {};

  return {
    token: sessao.token || sessao.accessToken || localStorage.getItem(BALU_API_TOKEN_KEY) || "",
    acesso_liberado: sessao.acesso_liberado !== false,
    motivo_bloqueio: sessao.motivo_bloqueio || null,
    usuario: {
      id: usuario.id || usuario.usuario_id || null,
      nome: usuario.nome || usuario.name || "Usuário",
      email: usuario.email || "",
      perfil: usuario.perfil || usuario.role || "cliente_admin",
      status: usuario.status || "Ativo"
    },
    empresa: empresa ? {
      id: empresa.id || empresa.empresa_id || null,
      nome_fantasia: empresa.nome_fantasia || empresa.empresa || empresa.nome || "Conta Teste",
      slug: empresa.slug || "conta-teste",
      cnpj: empresa.cnpj || "",
      responsavel: empresa.responsavel || empresa.administrador || "",
      email: empresa.email || "",
      status: empresa.status || "Ativo",
      status_pagamento: empresa.status_pagamento || "Em dia"
    } : null,
    plano: {
      id: plano.id || null,
      nome: plano.nome || "BALU Food",
      valor: Number(plano.valor || plano.valor_ciclo || 250),
      ciclo: plano.ciclo || assinatura.ciclo || "Mensal"
    },
    assinatura: {
      id: assinatura.id || null,
      status: assinatura.status || "Ativa",
      ciclo: assinatura.ciclo || plano.ciclo || "Mensal",
      data_vencimento: assinatura.data_vencimento || assinatura.vencimento || ""
    },
    login_em: sessao.login_em || new Date().toISOString()
  };
}

function baluGetUserProfile() {
  var sessao = baluGetSession();
  return sessao && sessao.usuario ? String(sessao.usuario.perfil || "") : "";
}

function baluIsInternalUser() {
  return BALU_INTERNAL_PROFILES.indexOf(baluGetUserProfile()) >= 0;
}

function baluIsClientUser() {
  return BALU_CLIENT_PROFILES.indexOf(baluGetUserProfile()) >= 0;
}

function baluAccountCanAccess(sessao) {
  if (!sessao || !sessao.usuario) return { ok: false, motivo: "Sessão não encontrada." };

  if (sessao.acesso_liberado === false) {
    return { ok: false, motivo: sessao.motivo_bloqueio || "Acesso bloqueado." };
  }

  if (String(sessao.usuario.status || "Ativo") !== "Ativo") {
    return { ok: false, motivo: "Usuário inativo ou bloqueado." };
  }

  if (BALU_INTERNAL_PROFILES.indexOf(String(sessao.usuario.perfil || "")) >= 0) {
    return { ok: true, motivo: "Usuário interno BALU." };
  }

  if (!sessao.empresa || !sessao.empresa.id) {
    return { ok: false, motivo: "Empresa não vinculada ao usuário." };
  }

  var statusEmpresa = String(sessao.empresa.status || "Ativo").toLowerCase();
  var statusPagamento = String(sessao.empresa.status_pagamento || "Em dia").toLowerCase();
  var statusAssinatura = String((sessao.assinatura && sessao.assinatura.status) || "Ativa").toLowerCase();

  var empresaBloqueada = ["bloqueado", "cancelado"].indexOf(statusEmpresa) >= 0;
  var pagamentoBloqueado = ["atrasado", "cancelado"].indexOf(statusPagamento) >= 0;
  var assinaturaBloqueada = ["bloqueada", "cancelada", "cancelamento solicitado"].indexOf(statusAssinatura) >= 0;

  if (empresaBloqueada || pagamentoBloqueado || assinaturaBloqueada) {
    return { ok: false, motivo: "Conta sem assinatura ativa." };
  }

  return { ok: true, motivo: "Cliente ativo." };
}

function baluIsLogged() {
  return baluAccountCanAccess(baluGetSession()).ok;
}

function baluGetEmpresaId() {
  var sessao = baluGetSession();
  if (!sessao || !sessao.empresa) return null;
  return sessao.empresa.id;
}

function baluGetUsuarioId() {
  var sessao = baluGetSession();
  if (!sessao || !sessao.usuario) return null;
  return sessao.usuario.id;
}

function baluGetToken() {
  var sessao = baluGetSession();
  return sessao && sessao.token ? sessao.token : localStorage.getItem(BALU_API_TOKEN_KEY) || null;
}

function baluGetEmpresaNome() {
  var sessao = baluGetSession();
  return sessao && sessao.empresa ? sessao.empresa.nome_fantasia || "Empresa" : "Empresa";
}

function baluGetUsuarioNome() {
  var sessao = baluGetSession();
  return sessao && sessao.usuario ? sessao.usuario.nome || "Usuário" : "Usuário";
}

function baluGetUsuarioEmail() {
  var sessao = baluGetSession();
  return sessao && sessao.usuario ? sessao.usuario.email || "" : "";
}

function baluGetPlanoNome() {
  var sessao = baluGetSession();
  if (!sessao) return "BALU Food";
  var ciclo = sessao.plano && sessao.plano.ciclo ? " - " + sessao.plano.ciclo : "";
  return ((sessao.plano && sessao.plano.nome) || "BALU Food") + ciclo;
}

function baluLogout() {
  localStorage.removeItem(BALU_SESSION_KEY);
  localStorage.removeItem(BALU_API_TOKEN_KEY);
  var path = window.location.pathname || "";
  var prefix = path.indexOf("/pages/") >= 0 ? "" : "pages/";
  window.location.href = prefix + "login.html";
}

function baluRedirectIfNotLogged() {
  var resultado = baluAccountCanAccess(baluGetSession());
  if (!resultado.ok) {
    localStorage.setItem("balu_auth_redirect", window.location.href);
    baluLogout();
  }
}

window.baluGetSession = baluGetSession;
window.baluSaveSession = baluSaveSession;
window.baluIsLogged = baluIsLogged;
window.baluIsInternalUser = baluIsInternalUser;
window.baluIsClientUser = baluIsClientUser;
window.baluAccountCanAccess = baluAccountCanAccess;
window.baluGetEmpresaId = baluGetEmpresaId;
window.baluGetUsuarioId = baluGetUsuarioId;
window.baluGetToken = baluGetToken;
window.baluGetEmpresaNome = baluGetEmpresaNome;
window.baluGetUsuarioNome = baluGetUsuarioNome;
window.baluGetUsuarioEmail = baluGetUsuarioEmail;
window.baluGetPlanoNome = baluGetPlanoNome;
window.baluLogout = baluLogout;
