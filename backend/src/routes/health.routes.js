const express = require('express');
const { healthCheck } = require('../db');
const { ok, fail } = require('../utils/responses');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = await healthCheck();
    return ok(res, 'API BALU Food online.', { database: db.now });
  } catch (error) {
    return fail(res, 'API online, mas banco indisponível.', 500, error.message);
  }
});

module.exports = router;
