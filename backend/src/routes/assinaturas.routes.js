const express = require('express');
const { query } = require('../db');
const { ok, fail } = require('../utils/responses');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const result = await query(`
      select a.*, e.nome_fantasia
      from assinaturas a
      join empresas e on e.id = a.empresa_id
      order by a.criado_em desc
    `);
    return ok(res, 'Assinaturas listadas.', result.rows);
  } catch (error) {
    return fail(res, 'Erro ao listar assinaturas.', 500, error.message);
  }
});

router.post('/', async (req, res) => {
  try {
    const { empresa_id, ciclo = 'Mensal', status = 'Aguardando pagamento' } = req.body || {};
    if (!empresa_id) return fail(res, 'empresa_id é obrigatório.', 422);

    const valores = { Mensal: 250, Trimestral: 675, Anual: 2500 };
    const valor = valores[ciclo] || 250;

    const result = await query(`
      insert into assinaturas (empresa_id, ciclo, valor_ciclo, status, criado_em, atualizado_em)
      values ($1, $2, $3, $4, now(), now())
      returning *
    `, [empresa_id, ciclo, valor, status]);

    return ok(res, 'Assinatura criada.', result.rows[0], 201);
  } catch (error) {
    return fail(res, 'Erro ao criar assinatura.', 500, error.message);
  }
});

router.put('/:id/cancelar', async (req, res) => {
  try {
    const result = await query(`
      update assinaturas
      set status = 'Cancelamento solicitado', atualizado_em = now()
      where id = $1
      returning *
    `, [req.params.id]);

    if (!result.rows[0]) return fail(res, 'Assinatura não encontrada.', 404);
    return ok(res, 'Cancelamento solicitado.', result.rows[0]);
  } catch (error) {
    return fail(res, 'Erro ao solicitar cancelamento.', 500, error.message);
  }
});

module.exports = router;
