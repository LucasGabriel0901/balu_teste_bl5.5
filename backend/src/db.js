const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function query(text, params) {
  return pool.query(text, params);
}

async function healthCheck() {
  const result = await query('select now() as now');
  return result.rows[0];
}

module.exports = { query, pool, healthCheck };
