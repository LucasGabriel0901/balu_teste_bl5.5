const express = require('express');
const { ok, fail } = require('../utils/responses');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();
router.use(requireAuth);

router.post('/mercado-pago/assinatura', async (req, res) => {
  const { ciclo = 'Mensal' } = req.body || {};
  const valores = { Mensal: 250, Trimestral: 675, Anual: 2500 };

  // Produção: criar assinatura no Mercado Pago pelo backend usando ACCESS_TOKEN em variável de ambiente.
  // Nunca colocar Access Token ou secret no front-end.
  return ok(res, 'Placeholder de assinatura Mercado Pago preparado.', {
    gateway: 'mercado_pago',
    ciclo,
    valor: valores[ciclo] || 250,
    status: 'placeholder',
    message: 'Configure MERCADO_PAGO_ACCESS_TOKEN no backend e implemente a criação real de preapproval.'
  });
});

router.post('/mercado-pago/webhook', async (req, res) => {
  // Produção: validar evento, registrar em webhook_eventos e atualizar assinaturas/pagamentos.
  return ok(res, 'Webhook recebido em modo placeholder.', { received: true });
});

module.exports = router;
