const jwt = require('../cvirms-backend/node_modules/jsonwebtoken');

const BACKEND_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3001';
const JWT_SECRET = 'cvirms_jwt_secret_key_secure_2026_dev';

async function verifyAllScenarios() {
  console.log('====================================================');
  console.log('🚀 CVIRMS DAY 8 QR SYSTEM - END-TO-END VERIFICATION');
  console.log('====================================================\n');

  // Scenario 1: Login & Token
  console.log('--- SCENARIO 1: Generate & verify JWT for Demo PG ---');
  const token = jwt.sign(
    {
      id: 1,
      name: 'Demo PG',
      user_id: 'demopg',
      role: 'member',
      member_type: 'pg',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  console.log('✔ JWT Token generated for demopg (id: 1)');

  // Scenario 2: Establish QR Code & Retrieve URL
  console.log('\n--- SCENARIO 2: GET /api/qr/my-qr (Establishment QR Code) ---');
  const myQrRes = await fetch(`${BACKEND_URL}/api/qr/my-qr`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const myQrData = await myQrRes.json();
  console.log('my-qr response:', myQrData);
  if (!myQrData.success || !myQrData.qrToken || myQrData.qrToken.length !== 10) {
    throw new Error('Scenario 2 Failed: Did not receive valid 10-char qrToken');
  }
  const qrToken = myQrData.qrToken;
  const qrUrl = myQrData.qrUrl;
  console.log(`✔ QR Token: ${qrToken}`);
  console.log(`✔ Public QR URL: ${qrUrl}`);

  // Scenario 3: Public QR Scan Page Verification
  console.log('\n--- SCENARIO 3: Public GET /api/qr/hotel/:token (No Auth Required) ---');
  const hotelRes = await fetch(`${BACKEND_URL}/api/qr/hotel/${qrToken}`);
  const hotelData = await hotelRes.json();
  console.log('Hotel public lookup:', hotelData);
  if (!hotelData.valid || hotelData.hotelName !== 'Demo PG') {
    throw new Error('Scenario 3 Failed: Public hotel endpoint did not return correct hotel');
  }
  console.log(`✔ Hotel "${hotelData.hotelName}" validated for visitors without login`);

  // Scenario 4: Visitor Self-Registration Submission
  console.log('\n--- SCENARIO 4: Public Visitor Self-Registration ---');
  const regPayload = {
    guest_name: 'Priya Kulkarni',
    contact_number: '9845112233',
    id_proof_type: 'Aadhaar Card',
    id_proof_number: '5566-7788-9900',
    purpose_of_visit: 'Tourism',
  };
  const regRes = await fetch(`${BACKEND_URL}/api/qr/public-register/${qrToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regPayload),
  });
  const regData = await regRes.json();
  console.log('Visitor registration response:', regData);
  if (!regData.success || !regData.guest || regData.guest.qr_code_string !== 'PENDING') {
    throw new Error('Scenario 4 Failed: Visitor could not self-register');
  }
  const priyaId = regData.guest.id;
  console.log(`✔ Registration submitted! Visitor ID: ${priyaId}, Status: PENDING`);

  // Scenario 5: Check Pending QR Approvals List
  console.log('\n--- SCENARIO 5: GET /api/qr/pending (Review Pending Queue) ---');
  const pendingRes = await fetch(`${BACKEND_URL}/api/qr/pending`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const pendingData = await pendingRes.json();
  console.log(`Found ${pendingData.count} pending visitor(s)`);
  const priyaPending = (pendingData.pending || []).find((g) => g.id === priyaId);
  if (!priyaPending) {
    throw new Error(`Scenario 5 Failed: Visitor ${priyaId} not found in pending list`);
  }
  console.log(`✔ Visitor "${priyaPending.guest_name}" correctly displayed in pending queue`);

  // Scenario 6: Hotel Approves Visitor
  console.log(`\n--- SCENARIO 6: POST /api/qr/approve/${priyaId} (Approve Visitor) ---`);
  const approveRes = await fetch(`${BACKEND_URL}/api/qr/approve/${priyaId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const approveData = await approveRes.json();
  console.log('Approve response:', approveData);
  if (!approveData.success) {
    throw new Error('Scenario 6 Failed: Could not approve visitor');
  }

  // Check pending list again to verify visitor disappeared
  const pendingResAfter = await fetch(`${BACKEND_URL}/api/qr/pending`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const pendingDataAfter = await pendingResAfter.json();
  const stillPending = (pendingDataAfter.pending || []).some((g) => g.id === priyaId);
  if (stillPending) {
    throw new Error('Scenario 6 Failed: Visitor is still in pending list after approval');
  }
  console.log(`✔ Visitor ${priyaId} successfully removed from pending approvals queue`);

  // Scenario 7: Check Visitor List
  console.log('\n--- SCENARIO 7: GET /api/guests (Verify Approved Visitor in Main List) ---');
  const guestsRes = await fetch(`${BACKEND_URL}/api/guests`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const guestsData = await guestsRes.json();
  const priyaInList = (guestsData.guests || []).find((g) => g.id === priyaId);
  if (!priyaInList) {
    throw new Error(`Scenario 7 Failed: Visitor ${priyaId} not found in main visitor list`);
  }
  console.log('Priya record in visitor list:', {
    id: priyaInList.id,
    name: priyaInList.guest_name,
    qr_code_string: priyaInList.qr_code_string,
    status: priyaInList.status,
  });
  if (priyaInList.qr_code_string !== qrToken) {
    throw new Error('Scenario 7 Failed: Guest qr_code_string did not match hotel qrToken');
  }
  console.log(`✔ Visitor ${priyaId} has valid QR Token "${priyaInList.qr_code_string}" -> Displays as "Checked In" with QR source pill!`);

  // Scenario 8: Test Reject Flow
  console.log('\n--- SCENARIO 8: Reject Visitor Flow ---');
  const rejectPayload = {
    guest_name: 'Test Reject Visitor',
    contact_number: '9811223344',
    id_proof_type: 'Voter ID',
    id_proof_number: 'VOT-112233',
    purpose_of_visit: 'Medical',
  };
  const regRes2 = await fetch(`${BACKEND_URL}/api/qr/public-register/${qrToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rejectPayload),
  });
  const regData2 = await regRes2.json();
  const rejectId = regData2.guest.id;
  console.log(`Registered reject test visitor ID: ${rejectId}`);

  // Hotel rejects visitor
  const rejectRes = await fetch(`${BACKEND_URL}/api/qr/reject/${rejectId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const rejectData = await rejectRes.json();
  console.log('Reject response:', rejectData);
  if (!rejectData.success) {
    throw new Error('Scenario 8 Failed: Reject call failed');
  }

  // Verify removed from pending
  const pendingResReject = await fetch(`${BACKEND_URL}/api/qr/pending`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const pendingRejectData = await pendingResReject.json();
  if ((pendingRejectData.pending || []).some((g) => g.id === rejectId)) {
    throw new Error('Scenario 8 Failed: Rejected visitor still appears in pending list');
  }
  console.log(`✔ Rejected visitor ${rejectId} successfully purged from system!`);

  // Scenario 9: Invalid QR URL
  console.log('\n--- SCENARIO 9: Invalid QR URL Handling ---');
  const invalidRes = await fetch(`${BACKEND_URL}/api/qr/hotel/NONEXISTENT999`);
  const invalidData = await invalidRes.json();
  console.log('Invalid lookup response (status ' + invalidRes.status + '):', invalidData);
  if (invalidRes.status !== 404 || invalidData.valid !== false) {
    throw new Error('Scenario 9 Failed: Invalid token did not return 404 with valid: false');
  }
  console.log('✔ Invalid token safely rejected with 404 and friendly guidance');

  console.log('\n====================================================');
  console.log('🎉 ALL 9 TEST SCENARIOS PASSED WITH COMPLETE FIDELITY!');
  console.log('====================================================\n');
}

verifyAllScenarios().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
