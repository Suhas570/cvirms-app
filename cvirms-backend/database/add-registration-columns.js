const pool = require('../db');

async function migrate() {
  console.log('[MIGRATION] Adding registration & payment columns to users table...');
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS temp_password_hash TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS owner_name VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS pincode VARCHAR(6);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_amount INTEGER;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_order_id VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP;
    `);

    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);

    console.log('[MIGRATION SUCCESS] Current columns in users table:');
    res.rows.forEach(col => console.log(` - ${col.column_name} (${col.data_type})`));
  } catch (err) {
    console.error('[MIGRATION ERROR]', err);
    process.exit(1);
  }
  process.exit(0);
}

migrate();
