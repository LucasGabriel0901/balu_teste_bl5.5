const jwt = require('jsonwebtoken');
const { fail } = require('../utils/responses');

const INTERNAL_PROFILES = ['admin_balu', 'representante_balu', 'suporte_balu', 'desenvolvedor_balu'];

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return fail(res, 'Token não informado.', 401);

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    return next();
  } catch (error) {
    return fail(res, 'Token inválido ou expirado.', 401);
  }
}

function requireInternal(req, res, next) {
  if (!req.user || !INTERNAL_PROFILES.includes(req.user.perfil)) {
    return fail(res, 'Acesso restrito ao time BALU.', 403);
  }
  return next();
}

module.exports = { requireAuth, requireInternal, INTERNAL_PROFILES };
