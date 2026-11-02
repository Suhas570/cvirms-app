const pool = require('../db');

async function verify() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);

    console.log('\n[USERS TABLE SCHEMA]');
    res.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
    });

    const requiredColumns = ['district', 'taluka', 'police_station', 'landmark', 'full_address'];
    const present = requiredColumns.every(col => res.rows.some(r => r.column_name === col));

    if (present) {
      console.log('\n✅ GATE PASSED: All 5 location columns present in users table.');
      process.exit(0);
    } else {
      console.error('\n❌ GATE FAILED: Some location columns are missing.');
      process.exit(1);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

verify();
