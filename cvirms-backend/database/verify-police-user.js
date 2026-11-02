const db = require('../db');

async function verifyPolice() {
  try {
    const res = await db.query("SELECT id, name, email, phone, user_id, username, role, is_verified FROM users WHERE role = 'police'");
    console.log('GATE_RESULT: Rows count:', res.rows.length);
    console.log(res.rows);
    await db.pool.end();
    if (res.rows.length === 1) {
      console.log('GATE_STATUS: PASS');
      process.exit(0);
    } else {
      console.log('GATE_STATUS: FAIL');
      process.exit(1);
    }
  } catch (err) {
    console.error('Verify error:', err);
    await db.pool.end();
    process.exit(1);
  }
}

verifyPolice();

