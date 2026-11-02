// scripts/verify-day9-features.js
// Automated verification script for Day 9 features: Notices, Profile, Real Dashboard Stats

const http = require('http');
const path = require('path');
const jwt = require('../cvirms-backend/node_modules/jsonwebtoken');
require('../cvirms-backend/node_modules/dotenv').config({ path: path.join(__dirname, '../cvirms-backend/.env') });
const pool = require('../cvirms-backend/db');

const JWT_SECRET = process.env.JWT_SECRET || 'cvirms_secret_key_2026';

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
  console.log('🚀 CVIRMS DAY 9 VERIFICATION GATE: NOTICES, PROFILE & STATS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. Fetch Demo PG user
    const userRes = await pool.query("SELECT * FROM users WHERE user_id = 'demopg' LIMIT 1;");
    if (userRes.rows.length === 0) {
      throw new Error("Demo PG user 'demopg' not found in database.");
    }
    const demoUser = userRes.rows[0];
    console.log(`[PASS] Found test user: ${demoUser.name} (id: ${demoUser.id}, user_id: ${demoUser.user_id})`);

    // 2. Generate valid JWT
    const token = jwt.sign(
      { id: demoUser.id, user_id: demoUser.user_id, role: demoUser.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 3. Verify Database Notices Seed
    const noticesCountRes = await pool.query('SELECT COUNT(*) FROM notices;');
    const count = parseInt(noticesCountRes.rows[0].count, 10);
    console.log(`[PASS] DB Notices count: ${count} notices found.`);
    if (count < 4) {
      throw new Error(`Expected at least 4 seeded notices, got ${count}`);
    }

    // 4. Test GET /api/notices?filter=current
    console.log('\n--- 1. Testing Notices API ---');
    const currentNoticesRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/notices?filter=current',
      method: 'GET',
      headers,
    });
    console.log(`Status ${currentNoticesRes.status}: Current notices returned count = ${currentNoticesRes.body.count}`);
    if (currentNoticesRes.status !== 200 || !currentNoticesRes.body.notices || currentNoticesRes.body.count !== 3) {
      throw new Error(`Expected 3 current notices, got ${currentNoticesRes.body.count}`);
    }
    console.log(`[PASS] Current notices query returned exactly 3 notices:`);
    currentNoticesRes.body.notices.forEach((n, i) => {
      console.log(`   ${i + 1}. [ID: ${n.id}] ${n.title} (Expires: ${n.expiry_date})`);
    });

    // 5. Test GET /api/notices?filter=archived
    const archivedNoticesRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/notices?filter=archived',
      method: 'GET',
      headers,
    });
    console.log(`Status ${archivedNoticesRes.status}: Archived notices returned count = ${archivedNoticesRes.body.count}`);
    if (archivedNoticesRes.status !== 200 || !archivedNoticesRes.body.notices || archivedNoticesRes.body.count < 1) {
      throw new Error(`Expected at least 1 archived notice, got ${archivedNoticesRes.body.count}`);
    }
    console.log(`[PASS] Archived notices query returned ${archivedNoticesRes.body.count} notice(s):`);
    archivedNoticesRes.body.notices.forEach((n, i) => {
      console.log(`   ${i + 1}. [ID: ${n.id}] ${n.title} (Archived: ${n.is_archived})`);
    });

    // 6. Test GET /api/notices/:id
    const singleNoticeId = currentNoticesRes.body.notices[0].id;
    const singleNoticeRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/notices/${singleNoticeId}`,
      method: 'GET',
      headers,
    });
    if (singleNoticeRes.status !== 200 || !singleNoticeRes.body.notice) {
      throw new Error(`Failed to fetch notice ID ${singleNoticeId}`);
    }
    console.log(`[PASS] GET /api/notices/${singleNoticeId} -> "${singleNoticeRes.body.notice.title}"`);

    // 7. Test Profile API: GET /api/profile/me
    console.log('\n--- 2. Testing Profile API ---');
    const profileRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/profile/me',
      method: 'GET',
      headers,
    });
    if (profileRes.status !== 200 || !profileRes.body.user) {
      throw new Error(`Failed to fetch profile: ${JSON.stringify(profileRes.body)}`);
    }
    console.log(`[PASS] GET /api/profile/me -> Name: ${profileRes.body.user.name}, Email: ${profileRes.body.user.email}, Phone: ${profileRes.body.user.phone}`);

    // 8. Test Profile API: PUT /api/profile/update
    const updatedName = 'Demo PG Managed';
    const updateRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/profile/update',
        method: 'PUT',
        headers,
      },
      {
        name: updatedName,
        email: profileRes.body.user.email || 'demopg@example.com',
        phone: profileRes.body.user.phone || '9876543210',
      }
    );
    if (updateRes.status !== 200 || !updateRes.body.success || updateRes.body.user.name !== updatedName) {
      throw new Error(`Failed to update profile: ${JSON.stringify(updateRes.body)}`);
    }
    console.log(`[PASS] PUT /api/profile/update -> ${updateRes.body.message} (Updated Name: ${updateRes.body.user.name})`);

    // Restore name back to "Demo PG"
    await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/profile/update',
        method: 'PUT',
        headers,
      },
      {
        name: 'Demo PG',
        email: profileRes.body.user.email || 'demopg@example.com',
        phone: profileRes.body.user.phone || '9876543210',
      }
    );
    console.log(`[PASS] Restored test user name to 'Demo PG'.`);

    // 9. Test Dashboard Stats API: GET /api/dashboard/stats
    console.log('\n--- 3. Testing Dashboard Stats API ---');
    const statsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/dashboard/stats',
      method: 'GET',
      headers,
    });
    if (statsRes.status !== 200) {
      throw new Error(`Failed to fetch stats: ${JSON.stringify(statsRes.body)}`);
    }
    const stats = statsRes.body;
    console.log(`[PASS] GET /api/dashboard/stats returned live database metrics:`);
    console.log(`   - totalVisitors:       ${stats.totalVisitors}`);
    console.log(`   - activeCustomers:     ${stats.activeCustomers}`);
    console.log(`   - pendingQR:           ${stats.pendingQR}`);
    console.log(`   - totalEmployees:      ${stats.totalEmployees}`);
    console.log(`   - totalForeigners:     ${stats.totalForeigners}`);
    console.log(`   - totalVisitorsWithQr: ${stats.totalVisitorsWithQr}`);
    console.log(`   - complianceScore:     ${stats.complianceScore}%`);
    console.log(`   - weeklyCheckins count: ${stats.weeklyCheckins?.length || 0} day buckets`);

    // 10. Test Dashboard Recent Activity: GET /api/dashboard/recent-activity
    console.log('\n--- 4. Testing Dashboard Recent Activity API ---');
    const activityRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/dashboard/recent-activity',
      method: 'GET',
      headers,
    });
    if (activityRes.status !== 200) {
      throw new Error(`Failed to fetch recent activity: ${JSON.stringify(activityRes.body)}`);
    }
    console.log(`[PASS] GET /api/dashboard/recent-activity returned ${activityRes.body.activities?.length || 0} activities.`);
    (activityRes.body.activities || []).forEach((act, idx) => {
      console.log(`   ${idx + 1}. [${act.type}] ${act.name}: ${act.detail} (${act.timestamp})`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ALL DAY 9 FEATURES FULLY VERIFIED AND PASSING GATES!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('\n❌ Verification Failed:', error);
    process.exit(1);
  }
  process.exit(0);
}

runVerification();
