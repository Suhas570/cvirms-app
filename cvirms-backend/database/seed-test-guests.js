const db = require('../db');

async function seed() {
  try {
    const check = await db.query('SELECT COUNT(*)::int AS count FROM guests WHERE user_id = 1');
    if (check.rows[0].count > 0) {
      console.log(`Guests table already has ${check.rows[0].count} records for user 1. Skipping seed.`);
      await db.pool.end();
      return;
    }

    const sql = `
      INSERT INTO guests (user_id, guest_name, id_proof_type, id_proof_number, room_number, check_in_date, check_out_date, qr_code_string)
      VALUES 
        (1, 'Aarav Sharma', 'Aadhaar', 'XXXX-XXXX-4819', '201', NOW() - interval '2 days', NULL, 'QR-PASS-AARAV-4819'),
        (1, 'Pooja Hegde', 'Passport', 'Z7819204', '305', NOW() - interval '1 day', NULL, NULL),
        (1, 'Karthik Subramanian', 'Voter ID', 'KA/04/8192', '104', NOW() - interval '5 days', NOW() - interval '1 day', 'QR-PASS-KARTHIK-8192')
      RETURNING id, guest_name, room_number;
    `;

    const res = await db.query(sql);
    console.log('Successfully seeded test guests:', res.rows);
    await db.pool.end();
  } catch (err) {
    console.error('Seed error:', err.message);
    await db.pool.end();
  }
}

seed();
