const pool = require('../db');

async function migrate() {
  console.log('[MIGRATION] Adding Karnataka cascading location columns to users table...');
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS district VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS taluka VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS police_station VARCHAR(150);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS landmark VARCHAR(200);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS full_address TEXT;
    `);

    const res = await pool.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name IN ('district', 'taluka', 'police_station', 'landmark', 'full_address')
      ORDER BY ordinal_position;
    `);

    console.log('[MIGRATION SUCCESS] Verified new columns in users table:');
    res.rows.forEach(col => {
      console.log(` - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
    });

    if (res.rows.length === 5) {
      console.log('✅ All 5 location columns successfully verified in PostgreSQL users table.');
    } else {
      console.error('❌ Expected 5 columns, found', res.rows.length);
      process.exit(1);
    }
  } catch (err) {
    console.error('[MIGRATION ERROR]', err);
    process.exit(1);
  }
  process.exit(0);
}

migrate();
