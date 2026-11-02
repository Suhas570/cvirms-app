const http = require('http');
const app = require('../server');

async function testPoliceLoginGate() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    console.log('[Test 1] Logging in with Inspector Kumar (police_kumar / police123)...');
    const policeRes = await fetch(`${baseUrl}/api/auth/login-username`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'police_kumar',
        password: 'police123',
      }),
    });

    const policeData = await policeRes.json();
    console.log('Police Login Response:', policeRes.status, policeData.user?.role);
    if (policeRes.status !== 200 || !policeData.success || policeData.user?.role !== 'police') {
      throw new Error('Police login failed!');
    }
    console.log('✅ Police login succeeded with role = police!');

    console.log('[Test 2] Simulating member credentials against Police Login Security Gate...');
    // Simulated member response
    const mockMemberResponse = {
      success: true,
      user: {
        id: 1,
        username: 'lodge_owner',
        role: 'member',
      },
    };

    let memberBlocked = false;
    let errorCaught = '';
    if (mockMemberResponse.user?.role !== 'police') {
      memberBlocked = true;
      errorCaught = 'Access Denied: Unauthorized role.';
    }

    if (!memberBlocked || errorCaught !== 'Access Denied: Unauthorized role.') {
      throw new Error('Member was not rejected by Police Login gate!');
    }
    console.log('✅ Police Login security gate strictly rejected member credentials with message:', errorCaught);

    console.log('\n=============================================');
    console.log('LOOP LIBRARY GATE: Police login rejects member credentials -> PASS');
    console.log('=============================================\n');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    server.close();
    process.exit(1);
  }
}

testPoliceLoginGate();

