const jwt = require('jsonwebtoken');
const app = require('../server');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'cvirms_jwt_secret_key_secure_2026_dev';

async function runTests() {
  let server;
  try {
    server = app.listen(5001);
    const baseUrl = 'http://localhost:5001';

    // 1. Create JWT token for Demo PG (user id 1)
    const token = jwt.sign(
      {
        id: 1,
        name: 'Demo PG',
        user_id: 'demopg',
        role: 'member',
        member_type: 'pg',
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('\n--- 1. Testing GET /api/qr/my-qr ---');
    const myQrRes = await fetch(`${baseUrl}/api/qr/my-qr`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const myQrData = await myQrRes.json();
    console.log('my-qr response:', myQrData);
    if (!myQrData.success || !myQrData.qrToken || myQrData.qrToken.length !== 10) {
      throw new Error('Failed to generate or retrieve 10-char qrToken');
    }
    const qrToken = myQrData.qrToken;
    console.log(`✅ Passed: Generated QR token ${qrToken}`);

    console.log('\n--- 2. Testing Public GET /api/qr/hotel/:qrToken ---');
    const hotelRes = await fetch(`${baseUrl}/api/qr/hotel/${qrToken}`);
    const hotelData = await hotelRes.json();
    console.log('hotel info response:', hotelData);
    if (!hotelData.valid || hotelData.hotelName !== 'Demo PG') {
      throw new Error('Hotel lookup returned invalid data');
    }
    console.log(`✅ Passed: Found hotel "${hotelData.hotelName}"`);

    console.log('\n--- 3. Testing Public POST /api/qr/public-register/:qrToken ---');
    const regRes = await fetch(`${baseUrl}/api/qr/public-register/${qrToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guest_name: 'Aarav Sharma',
        contact_number: '9876543210',
        id_proof_type: 'Aadhaar Card',
        id_proof_number: '9876-5432-1098',
        purpose_of_visit: 'Business Conference',
      }),
    });
    const regData = await regRes.json();
    console.log('public-register response:', regData);
    if (!regData.success || !regData.guest || regData.guest.qr_code_string !== 'PENDING') {
      throw new Error('Failed to register pending visitor');
    }
    const guestId = regData.guest.id;
    console.log(`✅ Passed: Visitor registered with pending ID ${guestId}`);

    console.log('\n--- 4. Testing GET /api/qr/pending ---');
    const pendingRes = await fetch(`${baseUrl}/api/qr/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pendingData = await pendingRes.json();
    console.log('pending response count:', pendingData.count);
    const foundGuest = (pendingData.pending || []).find((g) => g.id === guestId);
    if (!foundGuest) {
      throw new Error(`Guest ${guestId} not found in pending list`);
    }
    console.log(`✅ Passed: Guest ${guestId} found in pending list`);

    console.log('\n--- 5. Testing POST /api/qr/approve/:guestId ---');
    const approveRes = await fetch(`${baseUrl}/api/qr/approve/${guestId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const approveData = await approveRes.json();
    console.log('approve response:', approveData);
    if (!approveData.success) {
      throw new Error('Approve endpoint returned failure');
    }

    // Verify guest no longer pending and has hotel's qrToken
    const checkGuest = await db.query('SELECT * FROM guests WHERE id = $1', [guestId]);
    if (checkGuest.rows[0].qr_code_string !== qrToken || checkGuest.rows[0].status !== 'APPROVED') {
      throw new Error('Guest was not properly approved');
    }
    console.log(`✅ Passed: Guest ${guestId} approved with token ${qrToken}`);

    console.log('\n--- 6. Testing Reject Flow ---');
    // Register another visitor for rejection test
    const regRes2 = await fetch(`${baseUrl}/api/qr/public-register/${qrToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guest_name: 'Reject Candidate',
        contact_number: '9123456780',
        id_proof_type: 'Driving License',
        id_proof_number: 'DL-99887766',
        purpose_of_visit: 'Tourism',
      }),
    });
    const regData2 = await regRes2.json();
    const rejectGuestId = regData2.guest.id;

    const rejectRes = await fetch(`${baseUrl}/api/qr/reject/${rejectGuestId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const rejectData = await rejectRes.json();
    console.log('reject response:', rejectData);
    if (!rejectData.success) {
      throw new Error('Reject endpoint failed');
    }

    const checkReject = await db.query('SELECT * FROM guests WHERE id = $1', [rejectGuestId]);
    if (checkReject.rows.length !== 0) {
      throw new Error('Rejected guest was not removed');
    }
    console.log(`✅ Passed: Guest ${rejectGuestId} rejected and removed`);

    console.log('\n--- 7. Testing Invalid QR Token ---');
    const invalidRes = await fetch(`${baseUrl}/api/qr/hotel/INVALIDTOKEN99`);
    console.log('invalid token status code:', invalidRes.status);
    if (invalidRes.status !== 404) {
      throw new Error('Expected 404 for invalid token');
    }
    console.log('✅ Passed: Invalid token correctly returned 404');

    console.log('\n🎉 ALL QR BACKEND ENDPOINT TESTS PASSED WITH 100% SUCCESS!\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    await db.pool.end();
  }
}

runTests();
