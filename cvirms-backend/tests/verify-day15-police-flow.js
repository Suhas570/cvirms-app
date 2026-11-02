const http = require('http');
const app = require('../server');

async function verifyFullPoliceFlow() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    console.log('[Step 1] Police Login with police_kumar / 123456...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login-username`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'police_kumar',
        password: '123456',
      }),
    });

    const loginData = await loginRes.json();
    console.log('Login Status:', loginRes.status, 'Role:', loginData.user?.role);
    if (loginRes.status !== 200 || !loginData.token || loginData.user?.role !== 'police') {
      throw new Error('Police login with 123456 failed!');
    }
    const policeToken = loginData.token;
    console.log('✅ Police Login successful with role=police!');

    console.log('[Step 2] Fetching /api/police/stats with Police Token...');
    const statsRes = await fetch(`${baseUrl}/api/police/stats`, {
      headers: { Authorization: `Bearer ${policeToken}` },
    });
    const statsData = await statsRes.json();
    console.log('Stats Status:', statsRes.status, statsData.stats);
    if (statsRes.status !== 200 || !statsData.stats) {
      throw new Error('Failed to retrieve police global stats!');
    }
    console.log('✅ Police Global Stats verified successfully!');

    console.log('[Step 3] Fetching /api/police/establishments with Police Token...');
    const estRes = await fetch(`${baseUrl}/api/police/establishments`, {
      headers: { Authorization: `Bearer ${policeToken}` },
    });
    const estData = await estRes.json();
    console.log('Establishments Status:', estRes.status, 'Count:', estData.count);
    if (estRes.status !== 200 || !Array.isArray(estData.establishments)) {
      throw new Error('Failed to retrieve establishments directory!');
    }
    console.log('✅ Police Establishments Directory verified successfully!');

    console.log('[Step 4] Verifying RBAC Security: Non-police token is rejected with 403 Forbidden...');
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'cvirms_jwt_secret_key_secure_2026_dev';
    const memberToken = jwt.sign(
      { id: 1, user_id: 'test_member', role: 'member' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const forbiddenStatsRes = await fetch(`${baseUrl}/api/police/stats`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const forbiddenEstRes = await fetch(`${baseUrl}/api/police/establishments`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });

    if (forbiddenStatsRes.status !== 403 || forbiddenEstRes.status !== 403) {
      throw new Error('Member token was not blocked with 403 Forbidden!');
    }
    console.log('✅ Non-police member requests strictly blocked with 403 Forbidden!');

    console.log('\n=============================================');
    console.log('DAY 15 POLICE PORTAL FLOW: ALL TESTS PASS');
    console.log('=============================================\n');

    await new Promise((res) => server.close(res));
    process.exit(0);
  } catch (err) {
    console.error('Test Error:', err);
    await new Promise((res) => server.close(res)).catch(() => {});
    process.exit(1);
  }
}

verifyFullPoliceFlow();

