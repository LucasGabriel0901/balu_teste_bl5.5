const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { ok, fail } = require('../utils/responses');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

const INTERNAL_PROFILES = ['admin_balu', 'representante_balu', 'suporte_balu', 'desenvolvedor_balu'];

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body || {};

    if (!email || !senha) return fail(res, 'Informe e-mail e senha.', 422);

    const result = await query(`
      select
        u.id, u.empresa_id, u.nome, u.email, u.senha_hash, u.perfil, u.status,
        e.nome_fantasia, e.slug, e.cnpj, e.responsavel, e.email as empresa_email,
        e.status as status_empresa, e.status_pagamento,
        a.id as assinatura_id, a.status as assinatura_status, a.ciclo, a.valor_ciclo, a.data_vencimento,
        p.id as plano_id, p.nome as plano_nome
      from usuarios u
      left join empresas e on e.id = u.empresa_id
      left join assinaturas a on a.empresa_id = e.id and a.status <> 'Cancelada'
      left join planos p on p.id = a.plano_id
      where lower(u.email) = lower($1)
      order by a.criado_em desc nulls last
      limit 1
    `, [email]);

    const user = result.rows[0];
    if (!user || !user.senha_hash) return fail(res, 'Usuário ou senha inválidos.', 401);

    const valid = await bcrypt.compare(senha, user.senha_hash);
    if (!valid) return fail(res, 'Usuário ou senha inválidos.', 401);

    const isInternal = INTERNAL_PROFILES.includes(user.perfil);
    const usuarioBloqueado = ['Bloqueado', 'Cancelado'].includes(user.status);
    const empresaBloqueada = !isInternal && ['Bloqueado', 'Cancelado'].includes(user.status_empresa);
    const assinaturaBloqueada = !isInternal && ['Bloqueada', 'Cancelada', 'Cancelamento solicitado'].includes(user.assinatura_status);

    if (usuarioBloqueado || empresaBloqueada || assinaturaBloqueada) {
      return fail(res, 'Conta sem acesso ativo.', 403);
    }

    const token = jwt.sign({
      id: user.id,
      empresa_id: user.empresa_id,
      email: user.email,
      perfil: user.perfil,
      interno: isInternal,
    }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '8h' });

    await query('update usuarios set ultimo_acesso = now() where id = $1', [user.id]);

    const session = {
      token,
      acesso_liberado: true,
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil,
        status: user.status,
      },
      empresa: isInternal ? null : {
        id: user.empresa_id,
        nome_fantasia: user.nome_fantasia,
        slug: user.slug,
        cnpj: user.cnpj,
        responsavel: user.responsavel,
        email: user.empresa_email,
        status: user.status_empresa,
        status_pagamento: user.status_pagamento,
      },
      plano: {
        id: user.plano_id,
        nome: user.plano_nome || (isInternal ? 'Acesso interno BALU' : 'BALU Food'),
        valor: Number(user.valor_ciclo || 0),
        ciclo: user.ciclo || (isInternal ? 'Isento' : 'Mensal'),
      },
      assinatura: {
        id: user.assinatura_id,
        status: user.assinatura_status || (isInternal ? 'Isento' : 'Ativa'),
        ciclo: user.ciclo || (isInternal ? 'Isento' : 'Mensal'),
        data_vencimento: user.data_vencimento,
      },
      login_em: new Date().toISOString(),
    };

    return ok(res, 'Login realizado.', { session });
  } catch (error) {
    return fail(res, 'Erro ao fazer login.', 500, error.message);
  }
});

router.get('/me', requireAuth, async (req, res) => ok(res, 'Usuário autenticado.', req.user));

module.exports = router;
