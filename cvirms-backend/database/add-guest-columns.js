const db = require('../db');

async function migrate() {
  try {
    await db.query(`
      ALTER TABLE guests ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50);
      ALTER TABLE guests ADD COLUMN IF NOT EXISTS number_of_guests INTEGER DEFAULT 1;
      ALTER TABLE guests ADD COLUMN IF NOT EXISTS purpose_of_visit VARCHAR(255);
    `);
    console.log('Migration successful: added contact_number, number_of_guests, purpose_of_visit to guests');
    await db.pool.end();
  } catch (err) {
    console.error('Migration error:', err.message);
    await db.pool.end();
  }
}

migrate();
