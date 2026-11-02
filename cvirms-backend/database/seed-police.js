const db = require('../db');
const bcrypt = require('bcryptjs');

async function seedPolice() {
  try {
    console.log('[Seed Police] Ensuring password_hash column exists...');
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;`);

    console.log('[Seed Police] Ensuring housing_society is in member_type enum...');
    try {
      await db.query(`ALTER TYPE member_type ADD VALUE IF NOT EXISTS 'housing_society';`);
    } catch (enumErr) {
      console.log('[Seed Police] Enum update note:', enumErr.message);
    }

    const saltRounds = 10;
    // Hash for '123456' as specified in prompt
    const passwordHash = await bcrypt.hash('123456', saltRounds);

    console.log('[Seed Police] Upserting Inspector Kumar with role=police and password 123456...');
    const result = await db.query(
      `INSERT INTO users (
        name, 
        email, 
        phone, 
        user_id, 
        username, 
        password_hash, 
        temp_password_hash, 
        role, 
        is_verified
      ) VALUES (
        'Inspector Kumar', 
        'kumar@karnatakapolice.gov.in', 
        '9998887776', 
        'police_kumar', 
        'police_kumar', 
        $1, 
        $1, 
        'police', 
        TRUE
      )
      ON CONFLICT (phone) DO UPDATE SET 
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        user_id = EXCLUDED.user_id,
        username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash,
        temp_password_hash = EXCLUDED.temp_password_hash,
        role = 'police',
        is_verified = TRUE
      RETURNING id, name, email, phone, user_id, username, role, is_verified;`,
      [passwordHash]
    );

    console.log('[Seed Police] Success:', result.rows[0]);
    await db.pool.end();
  } catch (error) {
    console.error('[Seed Police Error]:', error);
    await db.pool.end();
    process.exit(1);
  }
}

seedPolice();
