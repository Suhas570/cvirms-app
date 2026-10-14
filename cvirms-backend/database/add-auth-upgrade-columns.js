const db = require('../db');

async function migrate() {
  try {
    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_attempts INT DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS captcha_sessions JSONB DEFAULT '[]'::jsonb;
    `);
    console.log('Migration successful: added otp_attempts and captcha_sessions to users table');
    await db.pool.end();
  } catch (err) {
    console.error('Migration error:', err.message);
    await db.pool.end();
    process.exit(1);
  }
}

migrate();
