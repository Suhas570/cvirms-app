const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      database: process.env.DB_NAME || 'cvirms',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'admin123',
    };

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log(`[PostgreSQL] Connection pool established with database "${process.env.DB_NAME || 'cvirms'}"`);
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected error on idle client:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
