const pool = require('../cvirms-backend/db');

async function testTask3() {
  console.log('[TEST] Initiating registration with all location fields...');
  const payload = {
    establishment_name: 'Grand Plaza Hotel',
    member_type: 'hotel',
    owner_name: 'Suresh Kumar',
    phone: '9845012345',
    email: 'suresh.kumar.grandplaza@example.com',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    taluka: 'Bengaluru North',
    police_station: 'Yelahanka PS',
    city: 'Bengaluru',
    pincode: '560064',
    landmark: 'Opposite Yelahanka Traffic Station',
    full_address: 'Plot 42, 1st Cross, BBMP Main Road, Yelahanka New Town'
  };

  const response = await fetch('http://localhost:5000/api/register/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  console.log('HTTP Status:', response.status);
  console.log('Response body:', data);

  if (response.status !== 201 || !data.success) {
    console.error('❌ Task 3 Gate Failed: Failed to register user');
    process.exit(1);
  }

  // Check database directly
  const dbCheck = await pool.query(
    `SELECT id, name, username, phone, email, state, district, taluka, police_station, city, pincode, landmark, full_address
     FROM users 
     WHERE id = $1`,
    [data.userId]
  );

  console.log('\n[DATABASE RECORD FOUND]:');
  console.table(dbCheck.rows);

  const row = dbCheck.rows[0];
  if (
    row.district === 'Bengaluru Urban' &&
    row.taluka === 'Bengaluru North' &&
    row.police_station === 'Yelahanka PS' &&
    row.landmark === 'Opposite Yelahanka Traffic Station' &&
    row.full_address === 'Plot 42, 1st Cross, BBMP Main Road, Yelahanka New Town'
  ) {
    console.log('✅ GATE PASSED: 201 Created and user saved with all location fields!');
    process.exit(0);
  } else {
    console.error('❌ Field verification failed on database row');
    process.exit(1);
  }
}

testTask3().catch(err => {
  console.error(err);
  process.exit(1);
});
