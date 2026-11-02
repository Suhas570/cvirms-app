const jwt = require('jsonwebtoken');
const app = require('../server');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'cvirms_jwt_secret_key_secure_2026_dev';

async function testNotices() {
  let server;
  try {
    server = app.listen(5002);
    const baseUrl = 'http://localhost:5002';

    const token = jwt.sign(
      { id: 1, name: 'Demo PG', user_id: 'demopg', role: 'member', member_type: 'pg' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('\n--- 1. Testing GET /api/notices?filter=current ---');
    const currentRes = await fetch(`${baseUrl}/api/notices?filter=current`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const currentData = await currentRes.json();
    console.log('Current notices count:', currentData.count);
    if (!currentData.success || currentData.count !== 3) {
      throw new Error(`Expected 3 current notices, got ${currentData.count}`);
    }
    console.log('✅ Current notices: 3 returned as expected');

    console.log('\n--- 2. Testing GET /api/notices?filter=archived ---');
    const archRes = await fetch(`${baseUrl}/api/notices?filter=archived`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const archData = await archRes.json();
    console.log('Archived notices count:', archData.count);
    if (!archData.success || archData.count !== 1) {
      throw new Error(`Expected 1 archived notice, got ${archData.count}`);
    }
    console.log('✅ Archived notices: 1 returned as expected');

    console.log('\n--- 3. Testing GET /api/notices/:id ---');
    const noticeId = currentData.notices[0].id;
    const singleRes = await fetch(`${baseUrl}/api/notices/${noticeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const singleData = await singleRes.json();
    if (!singleData.success || !singleData.notice || singleData.notice.id !== noticeId) {
      throw new Error('Single notice lookup failed');
    }
    console.log(`✅ Single notice lookup passed for ID ${noticeId}`);

    console.log('\n🎉 ALL NOTICES ENDPOINT TESTS PASSED!\n');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  } finally {
    if (server) server.close();
    await db.pool.end();
  }
}

testNotices();
