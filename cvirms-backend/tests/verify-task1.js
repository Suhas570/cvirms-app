const http = require('http');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cvirms_jwt_secret_key_secure_2026_dev';
const token = jwt.sign(
  {
    id: 1,
    name: 'Demo PG',
    email: 'demo@cvirms.in',
    phone: '9876543210',
    user_id: 'demopg',
    role: 'member',
    member_type: 'pg',
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

function getJson(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data, error: e.message });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runGate() {
  console.log('=== Task 1 Loop Library Verification Gate ===');

  try {
    // 1. Check /stats
    console.log('\n[1/3] Testing GET /api/dashboard/stats...');
    const statsRes = await getJson('/api/dashboard/stats');
    console.log('Status:', statsRes.status);
    console.log('Body:', statsRes.body);
    const hasStatsFields =
      statsRes.status === 200 &&
      statsRes.body.totalVisitors !== undefined &&
      statsRes.body.activeTenants !== undefined &&
      statsRes.body.pendingQR !== undefined &&
      statsRes.body.totalEmployees !== undefined;

    // 2. Check /recent-visitors
    console.log('\n[2/3] Testing GET /api/dashboard/recent-visitors...');
    const visitorsRes = await getJson('/api/dashboard/recent-visitors');
    console.log('Status:', visitorsRes.status);
    console.log('Body:', visitorsRes.body);
    const hasVisitorsFields =
      visitorsRes.status === 200 &&
      Array.isArray(visitorsRes.body.recentVisitors);

    // 3. Check /activity
    console.log('\n[3/3] Testing GET /api/dashboard/activity...');
    const activityRes = await getJson('/api/dashboard/activity');
    console.log('Status:', activityRes.status);
    console.log('Body:', activityRes.body);
    const hasActivityFields =
      activityRes.status === 200 &&
      Array.isArray(activityRes.body.activities) &&
      activityRes.body.activities.length === 5;

    const allPassed = hasStatsFields && hasVisitorsFields && hasActivityFields;
    console.log('\n===========================================');
    console.log('Gate Verdict:', allPassed ? 'PASSED ✅' : 'FAILED ❌');
    console.log('===========================================');

    process.exit(allPassed ? 0 : 1);
  } catch (err) {
    console.error('Gate execution failed:', err.message);
    process.exit(1);
  }
}

runGate();
