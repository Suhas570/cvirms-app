// scripts/verify-day10-features.js
// Automated verification script for Day 10: Self-Registration, Payment & Password Login

const http = require('http');
const path = require('path');
const pool = require('../cvirms-backend/db');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runVerification() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 CVIRMS DAY 10 VERIFICATION GATE: REGISTRATION, PAYMENT & DUAL AUTH');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. Verify Database Columns in users table
    console.log('--- 1. Verifying Database Migration Columns ---');
    const colsRes = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    const colNames = colsRes.rows.map(r => r.column_name);
    const requiredCols = [
      'username',
      'temp_password_hash',
      'owner_name',
      'address',
      'city',
      'state',
      'pincode',
      'payment_status',
      'payment_amount',
      'payment_order_id',
      'registered_at'
    ];

    for (const c of requiredCols) {
      if (!colNames.includes(c)) {
        throw new Error(`Missing required database column in users table: ${c}`);
      }
    }
    console.log(`[PASS] All 11 new columns present in users table: ${requiredCols.join(', ')}`);

    // 2. Test Registration Initiate: POST /api/register/initiate
    console.log('\n--- 2. Testing Registration Initiation API ---');
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const testPhone = `9845${uniqueSuffix}12`;
    const testEmail = `royal.orchid_${uniqueSuffix}@example.com`;

    const initRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/register/initiate',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        establishment_name: 'Hotel Royal Orchid',
        member_type: 'Hotel',
        owner_name: 'Deepak Rao',
        phone: testPhone,
        email: testEmail,
        address: '10 Old Airport Road, Domlur',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560008',
      }
    );

    console.log(`Status ${initRes.status}: Response:`, initRes.body);
    if (initRes.status !== 201 || !initRes.body.success || !initRes.body.orderId) {
      throw new Error(`Initiate registration failed: ${JSON.stringify(initRes.body)}`);
    }

    const { userId, orderId, username } = initRes.body;
    console.log(`[PASS] Registration initiated! Order ID: ${orderId}, Username: ${username}, User ID: ${userId}`);

    // 3. Test Check Username API
    console.log('\n--- 3. Testing Username Uniqueness Check API ---');
    const checkTaken = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/register/check-username/${username}`,
      method: 'GET',
    });
    if (checkTaken.body.available !== false) {
      throw new Error(`Expected username ${username} to be taken`);
    }
    console.log(`[PASS] GET /api/register/check-username/${username} -> available: false (correctly claimed)`);

    const checkAvail = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/register/check-username/totally_unique_random_${Date.now()}`,
      method: 'GET',
    });
    if (checkAvail.body.available !== true) {
      throw new Error('Expected unique username to be available');
    }
    console.log(`[PASS] GET /api/register/check-username/random -> available: true`);

    // 4. Test Payment Verification: POST /api/register/verify-payment
    console.log('\n--- 4. Testing Payment Verification & WhatsApp Credential Delivery ---');
    const verifyRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/register/verify-payment',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        userId,
        orderId,
        paymentMethod: 'upi',
      }
    );

    console.log(`Status ${verifyRes.status}: Response:`, verifyRes.body);
    if (verifyRes.status !== 200 || !verifyRes.body.success || !verifyRes.body.tempPassword) {
      throw new Error(`Payment verification failed: ${JSON.stringify(verifyRes.body)}`);
    }

    const { tempPassword } = verifyRes.body;
    console.log(`[PASS] Payment verified! Temp Password generated: ${tempPassword}`);

    // Verify DB payment status
    const dbUserRes = await pool.query('SELECT payment_status, payment_amount, username FROM users WHERE id = $1', [userId]);
    const dbUser = dbUserRes.rows[0];
    if (dbUser.payment_status !== 'paid' || dbUser.payment_amount !== 1450) {
      throw new Error(`DB payment status not updated properly: ${JSON.stringify(dbUser)}`);
    }
    console.log(`[PASS] Database confirms payment_status = 'paid' and payment_amount = 1450`);

    // 5. Test Username + Password Login: POST /api/auth/login-username
    console.log('\n--- 5. Testing Dual Authentication (Username + Password Login) ---');
    const loginRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login-username',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        username,
        password: tempPassword,
      }
    );

    console.log(`Status ${loginRes.status}: Response:`, loginRes.body);
    if (loginRes.status !== 200 || !loginRes.body.success || !loginRes.body.token) {
      throw new Error(`Username login failed: ${JSON.stringify(loginRes.body)}`);
    }
    console.log(`[PASS] Successfully logged in with newly generated establishment credentials!`);
    console.log(`   - JWT Token: ${loginRes.body.token.slice(0, 30)}...`);
    console.log(`   - User: ${loginRes.body.user.name} (${loginRes.body.user.username})`);

    // 6. Test Invalid Password Login
    console.log('\n--- 6. Testing Invalid Password Rejection ---');
    const invalidLoginRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login-username',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        username,
        password: 'incorrect_password_123',
      }
    );
    if (invalidLoginRes.status !== 401) {
      throw new Error(`Expected 401 for bad password, got ${invalidLoginRes.status}`);
    }
    console.log(`[PASS] Bad password successfully rejected with 401: "${invalidLoginRes.body.message}"`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ALL DAY 10 SELF-REGISTRATION & PAYMENT FEATURES FULLY VERIFIED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('\n❌ Verification Failed:', error);
    process.exit(1);
  }
  process.exit(0);
}

runVerification();
