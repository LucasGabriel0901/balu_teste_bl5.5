const express = require('express');
const { query } = require('../db');
const { ok, fail } = require('../utils/responses');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const result = await query('select * from empresas order by criado_em desc');
    return ok(res, 'Empresas listadas.', result.rows);
  } catch (error) {
    return fail(res, 'Erro ao listar empresas.', 500, error.message);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query('select * from empresas where id = $1', [req.params.id]);
    if (!result.rows[0]) return fail(res, 'Empresa não encontrada.', 404);
    return ok(res, 'Empresa encontrada.', result.rows[0]);
  } catch (error) {
    return fail(res, 'Erro ao buscar empresa.', 500, error.message);
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status, status_pagamento } = req.body || {};
    const result = await query(`
      update empresas
      set status = coalesce($2, status),
          status_pagamento = coalesce($3, status_pagamento),
          atualizado_em = now()
      where id = $1
      returning *
    `, [req.params.id, status, status_pagamento]);

    if (!result.rows[0]) return fail(res, 'Empresa não encontrada.', 404);
    return ok(res, 'Status atualizado.', result.rows[0]);
  } catch (error) {
    return fail(res, 'Erro ao atualizar status.', 500, error.message);
  }
});

module.exports = router;
