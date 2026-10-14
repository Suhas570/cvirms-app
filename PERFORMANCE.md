# CVIRMS Performance Engineering & Scalability Guide

This document details the performance optimization, database indexing, response caching, load testing, and observability infrastructure implemented for the CVIRMS backend.

---

## 1. Load Testing with k6

CVIRMS utilizes **k6** by Grafana Labs for automated, threshold-driven performance and load testing against critical backend endpoints (`/api/db-test`, `/api/auth/send-otp`, `/api/dashboard/stats`).

### How to Run Load Tests

From the `cvirms-backend` directory, run any of the three configured test scenarios:

```bash
# 1. Smoke Test (1 virtual user, 30 seconds)
# Validates baseline connectivity, latencies, and 0% error threshold
npm run load-test:smoke

# 2. Average Load Test (Ramps up to 50 concurrent VUs over 2 minutes)
# Validates everyday operational load during peak establishment check-ins
npm run load-test:average

# 3. Stress Test (Ramps up to 200 concurrent VUs over 2 minutes)
# Validates traffic spikes, peak batch operations, and system resilience
npm run load-test:stress
```

### SLA & Thresholds
- **p95 Latency:** Less than 500ms (`http_req_duration: ['p(95)<500']`)
- **Error Rate:** Less than 1% (`http_req_failed: ['rate<0.01']`)

---

## 2. Dual-Tier Caching Architecture

CVIRMS implements a high-performance dual-tier caching layer located in `config/cache.js` and Express middleware in `middleware/cacheMiddleware.js`.

### How Caching Works
1. **Tier 1 (In-Memory / Zero-Dependency):** Powered by `cache-minimal`. Automatically active by default in development and local test environments. Requires no Redis daemon or Docker setup.
2. **Tier 2 (Enterprise Distributed Redis):** When the `REDIS_URL` environment variable is defined in `.env` (e.g. `redis://localhost:6379`), the cache manager transparently connects to Redis and falls back to memory if Redis is unavailable.
3. **Response Headers:**
   - `X-Cache: HIT` indicates the response was served directly from cache memory/Redis without database query execution.
   - `X-Cache: MISS` indicates a database query was performed, response was delivered, and asynchronously stored in cache.

### Endpoint TTL Configurations
- `GET /api/dashboard/stats`: **60 seconds** TTL (aggregated guest, employee, foreigner, and notice statistics)
- `GET /api/dashboard/recent-visitors`: **30 seconds** TTL (latest guest check-in feed)
- `GET /api/dashboard/activity`: **120 seconds** TTL (audit trail and broadcast logs)

---

## 3. Database Indexes Catalog

All indexes are defined in `database/indexes.sql` to eliminate sequential scans on high-traffic tables.

| Table | Index Name | Indexed Columns | Operational Purpose |
| :--- | :--- | :--- | :--- |
| `users` | `idx_users_phone` | `phone` | Instant lookup during OTP send and authentication verification |
| `users` | `idx_users_user_id` | `user_id` | Quick lookup for member/police establishment identifiers |
| `users` | `idx_users_role` | `role` | Rapid filtering by user roles (`member`, `police`, `admin`) |
| `guests` | `idx_guests_user_id` | `user_id` | Fast join and foreign key lookup per member establishment |
| `guests` | `idx_guests_check_in` | `check_in_date DESC` | Rapid sorting for recent visitor dashboards and timeline queries |
| `guests` | `idx_guests_name` | `guest_name` | Autocomplete and guest identity search filtering |
| `guests` | `idx_guests_id_proof` | `id_proof_number` | Law enforcement searches by Aadhaar/Passport/ID proof number |
| `employees` | `idx_employees_user_id` | `user_id` | Rapid staff lookup for a specific hotel or PG facility |
| `foreigners` | `idx_foreigners_user_id` | `user_id` | Rapid foreigner lookup per establishment |
| `foreigners` | `idx_foreigners_passport` | `passport_details` | Instant passport search for FRRO/Police tracking |
| `notices` | `idx_notices_archived` | `is_archived` | Filtering active police alerts and circulars |
| `notices` | `idx_notices_expiry` | `expiry_date` | Quick cleanup and expiry filtering for broadcast notices |

---

## 4. How to Add New Indexes

When new query patterns or database tables are introduced:

1. **Open and Edit `cvirms-backend/database/indexes.sql`**:
   Add idempotent index statements using `IF NOT EXISTS`:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_<tablename>_<column> ON <tablename>(<column>);
   ```

2. **Execute Against PostgreSQL**:
   Run the SQL file against the `cvirms` database:
   ```bash
   # From cvirms-backend directory:
   node -e "const fs = require('fs'); const db = require('./db'); db.query(fs.readFileSync('./database/indexes.sql', 'utf8')).then(() => { console.log('Indexes updated'); db.pool.end(); });"
   ```
   Or via `psql`:
   ```bash
   psql -U postgres -d cvirms -f database/indexes.sql
   ```

3. **Verify with EXPLAIN ANALYZE**:
   Run the verification script to confirm PostgreSQL leverages the new index:
   ```bash
   node database/verify-indexes.js
   ```

---

## 5. Monitoring & Observability

- **HTTP Request Logger:** `morgan('dev')` logs every incoming request method, route, HTTP status code, and latency in development mode.
- **Response Latency Header:** Every response includes `X-Response-Time: <duration>ms` computed directly on the Express response pipeline.
