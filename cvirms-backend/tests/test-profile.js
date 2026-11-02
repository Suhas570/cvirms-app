const jwt = require('jsonwebtoken');
const app = require('../server');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'cvirms_jwt_secret_key_secure_2026_dev';

async function testProfile() {
  let server;
  try {
    server = app.listen(5003);
    const baseUrl = 'http://localhost:5003';

    const token = jwt.sign(
      { id: 1, name: 'Demo PG', user_id: 'demopg', role: 'member', member_type: 'pg' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('\n--- 1. Testing GET /api/profile/me ---');
    const meRes = await fetch(`${baseUrl}/api/profile/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await meRes.json();
    console.log('GET profile/me response:', meData);
    if (!meData.success || !meData.user || meData.user.id !== 1) {
      throw new Error('GET profile/me failed');
    }
    console.log(`✅ Profile retrieved for: ${meData.user.name} (${meData.user.user_id})`);

    console.log('\n--- 2. Testing PUT /api/profile/update ---');
    const updateRes = await fetch(`${baseUrl}/api/profile/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Demo PG Official',
        email: 'demo@cvirms.in',
        phone: '9876543210',
      }),
    });
    const updateData = await updateRes.json();
    console.log('PUT profile/update response:', updateData);
    if (!updateData.success || updateData.user.name !== 'Demo PG Official') {
      throw new Error('PUT profile/update failed');
    }
    console.log('✅ Profile name successfully updated to:', updateData.user.name);

    // Revert name back to Demo PG
    await db.query("UPDATE users SET name = 'Demo PG' WHERE id = 1;");
    console.log('✅ Cleaned up: name reverted to Demo PG');

    console.log('\n--- 3. Testing PUT /api/profile/change-password ---');
    const pwdRes = await fetch(`${baseUrl}/api/profile/change-password`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    const pwdData = await pwdRes.json();
    console.log('change-password response (expected error):', pwdData);
    if (pwdData.success !== false) {
      throw new Error('Expected change-password to fail for OTP accounts');
    }
    console.log('✅ Password change correctly rejected for OTP account');

    console.log('\n🎉 ALL PROFILE ENDPOINT TESTS PASSED!\n');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  } finally {
    if (server) server.close();
    await db.pool.end();
  }
}

testProfile();
