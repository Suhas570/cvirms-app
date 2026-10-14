const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cvirms_jwt_secret_key_secure_2026_dev';

async function run() {
  console.log('=== Task 1 Loop Library Verification Gate: Employees API ===\n');

  // Create JWT for Demo PG (id: 1)
  const token = jwt.sign(
    {
      id: 1,
      phone: '9876543210',
      name: 'Demo PG',
      role: 'member',
      member_type: 'pg',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const authHeader = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const API_BASE = 'http://localhost:5000/api/employees';

  // [1/4] Validation failure test
  console.log('[1/4] Testing POST /api/employees validation failure...');
  const resBad = await fetch(API_BASE, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({}),
  });
  console.log('Status:', resBad.status);
  const badData = await resBad.json();
  console.log('Errors:', badData.errors);
  if (resBad.status !== 400 || !badData.errors.full_name) {
    throw new Error('Validation failure test did not return expected 400 errors');
  }

  // [2/4] Valid POST test
  console.log('\n[2/4] Testing POST /api/employees with valid payload...');
  const validPayload = {
    full_name: 'Rajesh Kumar',
    contact_number: '9876543210',
    alternate_contact: '9876543211',
    gender: 'Male',
    address: 'MG Road, Bangalore',
    pincode: '560001',
    document_type: 'PAN Card',
    document_id: 'ABCDE1234F',
    photo_url: 'mock://uploaded-file.jpg',
    check_in_time: '2026-10-13T09:00',
    remark: 'Staff member - Front desk reception',
  };

  const resGood = await fetch(API_BASE, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify(validPayload),
  });
  console.log('Status:', resGood.status);
  const goodData = await resGood.json();
  console.log('Created Employee:', goodData.employee);
  if (resGood.status !== 201 || !goodData.employee || !goodData.employee.id) {
    throw new Error('Valid POST test failed to return 201 + employee ID');
  }

  const employeeId = goodData.employee.id;

  // [3/4] GET /api/employees
  console.log('\n[3/4] Testing GET /api/employees...');
  const resList = await fetch(API_BASE, { headers: authHeader });
  console.log('Status:', resList.status);
  const listData = await resList.json();
  console.log('Total employees found:', listData.total);
  if (resList.status !== 200 || !Array.isArray(listData.employees)) {
    throw new Error('GET /api/employees failed');
  }

  // [4/4] GET with search
  console.log('\n[4/4] Testing GET /api/employees?search=Rajesh...');
  const resSearch = await fetch(`${API_BASE}?search=Rajesh`, { headers: authHeader });
  console.log('Status:', resSearch.status);
  const searchData = await resSearch.json();
  console.log('Search matches:', searchData.total);
  if (resSearch.status !== 200 || searchData.total === 0) {
    throw new Error('GET /api/employees?search failed');
  }

  console.log('\n===========================================');
  console.log('Task 1 Gate Verdict: PASSED ✅');
  console.log('===========================================');
}

run().catch((err) => {
  console.error('\nTask 1 Gate Verdict: FAILED ❌', err);
  process.exit(1);
});
