const jwt = require('jsonwebtoken');
const app = require('../server');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'cvirms_jwt_secret_key_secure_2026_dev';

async function testDashboard() {
  let server;
  try {
    server = app.listen(5004);
    const baseUrl = 'http://localhost:5004';

    const token = jwt.sign(
      { id: 1, name: 'Demo PG', user_id: 'demopg', role: 'member', member_type: 'pg' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('\n--- 1. Testing GET /api/dashboard/stats ---');
    const statsRes = await fetch(`${baseUrl}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const statsData = await statsRes.json();
    console.log('Real Stats Response:', statsData);
    if (!statsData.success) {
      throw new Error('GET /api/dashboard/stats failed');
    }
    console.log(`✅ Total Visitors: ${statsData.totalVisitors}`);
    console.log(`✅ Active Customers: ${statsData.activeCustomers}`);
    console.log(`✅ Pending QR: ${statsData.pendingQR}`);
    console.log(`✅ Total Employees: ${statsData.totalEmployees}`);
    console.log(`✅ Total Foreigners: ${statsData.totalForeigners}`);

    console.log('\n--- 2. Testing GET /api/dashboard/recent-activity ---');
    const actRes = await fetch(`${baseUrl}/api/dashboard/recent-activity`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const actData = await actRes.json();
    console.log('Real Activity Feed (count):', actData.activities.length);
    console.log('First activity item:', actData.activities[0]);
    if (!actData.success || !Array.isArray(actData.activities)) {
      throw new Error('GET /api/dashboard/recent-activity failed');
    }
    console.log('✅ Real activity feed verified');

    console.log('\n🎉 ALL DASHBOARD REAL STATS TESTS PASSED!\n');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  } finally {
    if (server) server.close();
    await db.pool.end();
  }
}

testDashboard();
