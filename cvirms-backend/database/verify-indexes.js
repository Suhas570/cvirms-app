const db = require('../db');

async function verify() {
  try {
    console.log('--- Checking Indexes in PostgreSQL cvirms ---');
    const indexesRes = await db.query(`
      SELECT tablename, indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      ORDER BY tablename, indexname;
    `);
    console.table(indexesRes.rows.map(r => ({ table: r.tablename, index: r.indexname })));

    console.log('\n--- Running Loop Library Gate: EXPLAIN ANALYZE on SELECT * FROM guests WHERE user_id = 1 ---');
    // Force index scan preference if table has few/no rows
    await db.query('SET enable_seqscan = off;');
    const explainRes = await db.query('EXPLAIN ANALYZE SELECT * FROM guests WHERE user_id = 1;');
    console.log('Query Plan:');
    explainRes.rows.forEach(r => console.log(r['QUERY PLAN']));

    const usesIndexScan = explainRes.rows.some(r => r['QUERY PLAN'].includes('Index Scan') || r['QUERY PLAN'].includes('Bitmap Index Scan'));
    console.log('\nGate Result: Uses Index Scan?', usesIndexScan ? 'PASSED ✅' : 'FAILED ❌');

    await db.pool.end();
    process.exit(usesIndexScan ? 0 : 1);
  } catch (err) {
    console.error('Verification error:', err.message);
    await db.pool.end();
    process.exit(1);
  }
}

verify();
