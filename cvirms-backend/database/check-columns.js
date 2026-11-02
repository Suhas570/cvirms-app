const db = require('../db');

async function checkCols() {
  try {
    const res = await db.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'guests'
      ORDER BY ordinal_position
    `);
    console.log('Columns in guests table:', res.rows);
    await db.pool.end();
  } catch (err) {
    console.error('Check cols error:', err);
    await db.pool.end();
  }
}

checkCols();
