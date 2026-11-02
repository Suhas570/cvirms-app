const db = require('../db');

async function seedNotices() {
  try {
    // Clear existing to ensure idempotency
    await db.query('DELETE FROM notices;');

    const insertSql = `
      INSERT INTO notices (title, message, date_posted, expiry_date, is_archived) VALUES
      ('Mandatory QR Visitor Registration', 'All registered establishments must use the CVIRMS QR code for visitor registration. Non-compliance will attract penalties under KA-POL-2026-89.', NOW(), NOW() + INTERVAL '90 days', FALSE),
      ('Monthly Compliance Report Due', 'Submit your monthly visitor logs before the 5th of each month via the dashboard. Late submissions will be flagged.', NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', FALSE),
      ('Foreigner C-Form Deadline Reminder', 'All foreign national check-ins must be reported to the local police station within 24 hours via the C-Form module.', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', FALSE),
      ('Annual Police Verification Drive', 'A police verification drive will be conducted from 1st to 15th of next month. Please ensure all records are up to date.', NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', TRUE);
    `;

    await db.query(insertSql);

    const countRes = await db.query('SELECT COUNT(*) FROM notices;');
    console.log(`✅ Notices seeded successfully. Total count: ${countRes.rows[0].count}`);
    await db.pool.end();
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    await db.pool.end();
    process.exit(1);
  }
}

seedNotices();
