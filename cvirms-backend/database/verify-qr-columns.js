const db = require('../db');

async function verify() {
  try {
    const res = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name IN ('qr_token', 'qr_generated_at')
      ORDER BY ordinal_position;
    `);
    console.log('Verified columns in users table:', res.rows);
    await db.pool.end();
  } catch (err) {
    console.error('Verification error:', err);
    await db.pool.end();
  }
}

verify();
