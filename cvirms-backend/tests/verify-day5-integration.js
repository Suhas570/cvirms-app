const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cvirms_jwt_secret_key_secure_2026_dev';

async function verifyDay5() {
  console.log('=== Day 5 Integration & Verification Gate ===\n');

  const token = jwt.sign(
    {
      id: 1,
      name: 'Demo PG',
      email: 'demopg@example.com',
      phone: '9876543210',
      user_id: 'demopg',
      role: 'member',
      member_type: 'pg',
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const authHeader = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 1. Initial stats
  console.log('[1/5] Checking GET /api/dashboard/stats...');
  const statsRes1 = await fetch('http://localhost:5000/api/dashboard/stats', { headers: authHeader });
  const stats1 = await statsRes1.json();
  console.log('Initial Total Visitors:', stats1.totalVisitors);

  // 2. Register a new tenant via POST /api/guests
  console.log('\n[2/5] Registering new tenant via POST /api/guests...');
  const newGuest = {
    first_name: 'Anita',
    middle_name: '',
    last_name: 'Desai',
    contact_number: '9876543211',
    number_of_guests: 1,
    id_proof_type: 'Aadhaar Card',
    id_proof_number: '9876-5432-1098',
    room_number: '302',
    check_in_date: new Date().toISOString(),
    purpose_of_visit: 'Tourism',
  };

  const createRes = await fetch('http://localhost:5000/api/guests', {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify(newGuest),
  });
  console.log('Create Status:', createRes.status);
  const createData = await createRes.json();
  console.log('Created Guest:', createData.guest.guest_name, `(ID: ${createData.guest.id})`);

  if (createRes.status !== 201) {
    throw new Error('Tenant creation failed');
  }

  // 3. Re-check stats to ensure count incremented
  console.log('\n[3/5] Verifying stats update...');
  const statsRes2 = await fetch('http://localhost:5000/api/dashboard/stats', { headers: authHeader });
  const stats2 = await statsRes2.json();
  console.log('Updated Total Visitors:', stats2.totalVisitors);
  if (stats2.totalVisitors < stats1.totalVisitors + 1) {
    throw new Error('Stats did not reflect new tenant registration');
  }

  // 4. Verify GET /api/guests & search
  console.log('\n[4/5] Verifying GET /api/guests with search...');
  const searchRes = await fetch('http://localhost:5000/api/guests?search=Anita', { headers: authHeader });
  const searchData = await searchRes.json();
  console.log(`Search for "Anita" returned ${searchData.total} records`);
  if (searchData.total === 0 || searchData.guests[0].guest_name !== 'Anita Desai') {
    throw new Error('Search query failed to match newly registered tenant');
  }

  // 5. Verify frontend routes return 200
  console.log('\n[5/5] Checking all frontend routes (no 404s)...');
  const routes = [
    '/dashboard',
    '/dashboard/add-tenant',
    '/dashboard/visitors',
    '/dashboard/coming-soon',
  ];

  for (const r of routes) {
    const res = await fetch(`http://localhost:3001${r}`);
    console.log(`Route ${r}: HTTP ${res.status}`);
    if (res.status !== 200) {
      throw new Error(`Route ${r} returned HTTP ${res.status}`);
    }
  }

  console.log('\n===========================================');
  console.log('Day 5 Integration Gate: PASSED ✅');
  console.log('===========================================');
}

verifyDay5().catch((err) => {
  console.error('\nDay 5 Integration FAILED ❌:', err);
  process.exit(1);
});
