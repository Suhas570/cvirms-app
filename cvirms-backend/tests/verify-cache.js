const http = require('http');
const app = require('../server');

async function testCache() {
  const server = http.createServer(app);
  
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`[Test Server] Running on temporary port ${port}`);

  function fetchStats() {
    return new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/api/dashboard/stats`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            cacheHeader: res.headers['x-cache'],
            body: JSON.parse(data),
          });
        });
      }).on('error', reject);
    });
  }

  try {
    console.log('--- Request 1: Expecting X-Cache: MISS ---');
    const res1 = await fetchStats();
    console.log(`Status: ${res1.statusCode}, X-Cache: ${res1.cacheHeader}`);
    console.log('Body:', res1.body);

    console.log('\n--- Request 2: Expecting X-Cache: HIT ---');
    const res2 = await fetchStats();
    console.log(`Status: ${res2.statusCode}, X-Cache: ${res2.cacheHeader}`);
    console.log('Body:', res2.body);

    const passed = (res1.cacheHeader === 'MISS') && (res2.cacheHeader === 'HIT');
    console.log('\nGate Result: Caching Hit/Miss Verification?', passed ? 'PASSED ✅' : 'FAILED ❌');

    server.close();
    process.exit(passed ? 0 : 1);
  } catch (err) {
    console.error('Test error:', err.message);
    server.close();
    process.exit(1);
  }
}

testCache();
