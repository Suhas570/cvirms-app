const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cvirms_jwt_secret_key_secure_2026_dev';

async function testGuestAPI() {
  console.log('=== Task 1 Loop Library Verification Gate: Guests API ===\n');

  // Create JWT for Demo PG (id: 1)
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

  const API_BASE = 'http://localhost:5000/api/guests';

  // [Gate 1] Test POST /api/guests with invalid body (expect 400)
  console.log('[1/4] Testing POST /api/guests validation failure...');
  const resBad = await fetch(API_BASE, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({}),
  });
  console.log('Status:', resBad.status);
  const dataBad = await resBad.json();
  console.log('Errors:', dataBad.errors);
  if (resBad.status !== 400 || !dataBad.errors) {
    throw new Error('Validation failure gate failed');
  }

  // [Gate 2] Test POST /api/guests with valid payload (expect 201 + guest.id)
  console.log('\n[2/4] Testing POST /api/guests with valid payload...');
  const newGuestPayload = {
    first_name: 'Rajesh',
    middle_name: '',
    last_name: 'Kumar',
    contact_number: '9876543210',
    number_of_guests: 2,
    id_proof_type: 'Aadhaar Card',
    id_proof_number: '1234-5678-9012',
    room_number: '204',
    check_in_date: new Date().toISOString(),
    purpose_of_visit: 'Business',
  };

  const resPost = await fetch(API_BASE, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify(newGuestPayload),
  });
  console.log('Status:', resPost.status);
  const dataPost = await resPost.json();
  console.log('Created Guest:', dataPost.guest);
  if (resPost.status !== 201 || !dataPost.guest || !dataPost.guest.id) {
    throw new Error('POST /api/guests did not return 201 + guest ID');
  }
  const createdGuestId = dataPost.guest.id;

  // [Gate 3] Test GET /api/guests (expect 200 + guests array)
  console.log('\n[3/4] Testing GET /api/guests...');
  const resGet = await fetch(API_BASE, { headers: authHeader });
  console.log('Status:', resGet.status);
  const dataGet = await resGet.json();
  console.log(`Total guests found: ${dataGet.total}`);
  if (resGet.status !== 200 || !Array.isArray(dataGet.guests)) {
    throw new Error('GET /api/guests did not return 200 + guests array');
  }

  // [Gate 4] Test GET /api/guests?search=Rajesh (expect 200 + filtered count)
  console.log('\n[4/4] Testing GET /api/guests?search=Rajesh...');
  const resSearch = await fetch(`${API_BASE}?search=Rajesh`, { headers: authHeader });
  console.log('Status:', resSearch.status);
  const dataSearch = await resSearch.json();
  console.log(`Search matches: ${dataSearch.total}`);
  if (resSearch.status !== 200 || dataSearch.total === 0) {
    throw new Error('GET /api/guests?search= did not return expected matches');
  }

  console.log('\n===========================================');
  console.log('Task 1 Gate Verdict: PASSED ✅');
  console.log('===========================================');
}

testGuestAPI().catch((err) => {
  console.error('\nTask 1 Gate FAILED ❌:', err);
  process.exit(1);
});
