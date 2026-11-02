import http from 'http';
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { id: 1, role: 'police', username: 'police_kumar', police_station: 'Koramangala Police Station' },
  'cvirms_jwt_secret_key_2026',
  { expiresIn: '1h' }
);

function makeReq(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: JSON.parse(body || '{}') });
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  const flags = await makeReq('/api/police/flags');
  console.log('GET /api/police/flags status:', flags.status, 'count:', flags.data.flags?.length);
  const alerts = await makeReq('/api/police/alerts');
  console.log('GET /api/police/alerts status:', alerts.status, 'alerts count:', alerts.data.alerts?.length);
  if (alerts.data.alerts && alerts.data.alerts.length > 0) {
    console.log('Sample alert:', alerts.data.alerts[0]);
  }
}

run().catch(console.error);
