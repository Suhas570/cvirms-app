const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cvirms_jwt_secret_key_secure_2026_dev';

async function run() {
  console.log('=== Day 6 Integration & Verification Gate ===\n');

  // 1. Generate JWT
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

  const API_BASE = 'http://localhost:5000';
  const FRONTEND_BASE = 'http://localhost:3001';

  // [1/4] Register a new employee via POST /api/employees
  console.log('[1/4] Registering new employee via POST /api/employees...');
  const newEmployee = {
    full_name: 'Priya Sharma',
    contact_number: '9876543212',
    alternate_contact: '9876543213',
    gender: 'Female',
    address: 'Indiranagar 100ft Road, Bangalore',
    pincode: '560038',
    document_type: 'Aadhaar Card',
    document_id: '9988-7766-5544',
    photo_url: 'mock://uploaded-file.jpg',
    check_in_time: '2026-10-13T08:30',
    remark: 'Housekeeping Supervisor',
  };

  const createRes = await fetch(`${API_BASE}/api/employees`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify(newEmployee),
  });
  console.log('Create Status:', createRes.status);
  const createData = await createRes.json();
  if (createRes.status !== 201 || !createData.employee) {
    throw new Error('Failed to register employee');
  }
  console.log('Created Employee:', createData.employee.full_name, `(ID: ${createData.employee.id})`);

  // [2/4] Verify GET /api/employees
  console.log('\n[2/4] Verifying GET /api/employees...');
  const listRes = await fetch(`${API_BASE}/api/employees`, { headers: authHeader });
  const listData = await listRes.json();
  console.log('Total Employees:', listData.total);
  if (listRes.status !== 200 || listData.total === 0) {
    throw new Error('Failed to list employees');
  }

  // [3/4] Verify Search filter
  console.log('\n[3/4] Verifying GET /api/employees?search=Priya...');
  const searchRes = await fetch(`${API_BASE}/api/employees?search=Priya`, { headers: authHeader });
  const searchData = await searchRes.json();
  console.log('Search matches for "Priya":', searchData.total);
  if (searchRes.status !== 200 || searchData.total === 0) {
    throw new Error('Search failed for employee');
  }

  // [4/4] Verify all routes return 200 (no 404s)
  console.log('\n[4/4] Checking frontend routes (no 404s)...');
  const routes = [
    '/dashboard',
    '/dashboard/add-employee',
    '/dashboard/employees',
    '/dashboard/add-tenant',
    '/dashboard/visitors',
    '/dashboard/coming-soon',
  ];

  for (const r of routes) {
    const res = await fetch(`${FRONTEND_BASE}${r}`);
    console.log(`Route ${r}: HTTP ${res.status}`);
    if (res.status !== 200) {
      throw new Error(`Route ${r} returned non-200 status: ${res.status}`);
    }
  }

  console.log('\n===========================================');
  console.log('Day 6 Integration Gate: PASSED ✅');
  console.log('===========================================');
}

run().catch((err) => {
  console.error('\nDay 6 Integration Gate: FAILED ❌', err);
  process.exit(1);
});
