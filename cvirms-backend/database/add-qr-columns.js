const db = require('../db');

async function migrate() {
  try {
    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS qr_token VARCHAR(20) UNIQUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS qr_generated_at TIMESTAMP;
    `);
    console.log('Migration successful: added qr_token and qr_generated_at to users table');
    await db.pool.end();
  } catch (err) {
    console.error('Migration error:', err.message);
    await db.pool.end();
    process.exit(1);
  }
}

migrate();
