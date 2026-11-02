const db = require('../db');

async function migrate() {
  try {
    await db.query(`
      ALTER TABLE guests ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';
    `);
    console.log('Migration successful: added status column to guests table');
    await db.pool.end();
  } catch (err) {
    console.error('Migration error:', err.message);
    await db.pool.end();
    process.exit(1);
  }
}

migrate();
