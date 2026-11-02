const jwt = require('jsonwebtoken');
const http = require('http');
const app = require('../server');

const JWT_SECRET = process.env.JWT_SECRET || 'cvirms_jwt_secret_key_secure_2026_dev';

async function verifyPoliceEndpoints() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const policeToken = jwt.sign(
      { id: 22, user_id: 'police_kumar', role: 'police' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const memberToken = jwt.sign(
      { id: 1, user_id: 'test_member', role: 'member', member_type: 'hotel' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 1. Check member 403 blocks
    console.log('[Test 1] Testing Member token on /api/police/stats...');
    const memStats = await fetch(`${baseUrl}/api/police/stats`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    if (memStats.status !== 403) throw new Error(`Expected 403, got ${memStats.status}`);
    console.log('✅ Member blocked from /api/police/stats (403)');

    console.log('[Test 2] Testing Member token on /api/police/establishments...');
    const memEst = await fetch(`${baseUrl}/api/police/establishments`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    if (memEst.status !== 403) throw new Error(`Expected 403, got ${memEst.status}`);
    console.log('✅ Member blocked from /api/police/establishments (403)');

    // 2. Check police stats
    console.log('[Test 3] Testing Police token on /api/police/stats...');
    const polStats = await fetch(`${baseUrl}/api/police/stats`, {
      headers: { Authorization: `Bearer ${policeToken}` },
    });
    const statsData = await polStats.json();
    if (polStats.status !== 200 || !statsData.stats) throw new Error(`Failed police stats: ${polStats.status}`);
    console.log('✅ Police stats returned:', statsData.stats);

    // 3. Check police establishments
    console.log('[Test 4] Testing Police token on /api/police/establishments...');
    const polEst = await fetch(`${baseUrl}/api/police/establishments`, {
      headers: { Authorization: `Bearer ${policeToken}` },
    });
    const estData = await polEst.json();
    if (polEst.status !== 200 || !Array.isArray(estData.establishments)) throw new Error(`Failed establishments: ${polEst.status}`);
    console.log(`✅ Police establishments returned: ${estData.count} establishments.`);
    if (estData.establishments.length > 0) {
      console.log('Sample establishment:', {
        name: estData.establishments[0].name,
        type: estData.establishments[0].member_type,
        visitors: estData.establishments[0].total_visitors,
      });
    }

    console.log('\n=============================================');
    console.log('TASK 2 BACKEND VERIFICATION: PASS');
    console.log('=============================================\n');

    await new Promise((res) => server.close(res));
    process.exit(0);
  } catch (err) {
    console.error('Verification Error:', err);
    await new Promise((res) => server.close(res)).catch(() => {});
    process.exit(1);
  }
}

verifyPoliceEndpoints();
