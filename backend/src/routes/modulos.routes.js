const express = require('express');
const { query } = require('../db');
const { ok, fail } = require('../utils/responses');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();
router.use(requireAuth);

const tabelasPermitidas = new Set([
  'faturamentos_diarios',
  'compras_estoque',
  'inventarios',
  'custos_mensais',
  'vendas_mes',
  'feedbacks'
]);

router.get('/:tabela', async (req, res) => {
  try {
    const tabela = req.params.tabela;
    if (!tabelasPermitidas.has(tabela)) return fail(res, 'Módulo não permitido.', 400);

    const result = await query(`select * from ${tabela} where empresa_id = $1 order by criado_em desc limit 200`, [req.user.empresa_id]);
    return ok(res, 'Dados listados.', result.rows);
  } catch (error) {
    return fail(res, 'Erro ao listar dados.', 500, error.message);
  }
});

router.post('/:tabela', async (req, res) => {
  return fail(res, 'Endpoint de gravação específico ainda deve ser implementado por módulo para preservar regras de negócio.', 501);
});

module.exports = router;
