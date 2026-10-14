import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const SCENARIO_TYPE = __ENV.SCENARIO || 'smoke';

const scenarioConfigs = {
  smoke: {
    executor: 'constant-vus',
    vus: 1,
    duration: '30s',
  },
  average: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 50 },
      { duration: '1m', target: 50 },
      { duration: '30s', target: 0 },
    ],
  },
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 100 },
      { duration: '1m', target: 200 },
      { duration: '30s', target: 0 },
    ],
  },
};

export const options = {
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(50)', 'p(90)', 'p(95)', 'p(99)'],
  scenarios: {
    selected_scenario: scenarioConfigs[SCENARIO_TYPE] || scenarioConfigs.smoke,
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],    // Error rate must be under 1%
  },
};

export default function () {
  // 1. GET /api/db-test
  const dbRes = http.get(`${BASE_URL}/api/db-test`);
  check(dbRes, {
    'db-test status 200': (r) => r.status === 200,
  });

  // 2. POST /api/auth/send-otp
  const otpPayload = JSON.stringify({ phone: '9876543210' });
  const otpParams = {
    headers: { 'Content-Type': 'application/json' },
  };
  const otpRes = http.post(`${BASE_URL}/api/auth/send-otp`, otpPayload, otpParams);
  check(otpRes, {
    'send-otp status 200': (r) => r.status === 200,
  });

  // 3. GET /api/dashboard/stats
  const statsRes = http.get(`${BASE_URL}/api/dashboard/stats`);
  check(statsRes, {
    'dashboard-stats status 200': (r) => r.status === 200,
  });

  sleep(1);
}

export function handleSummary(data) {
  const p50 = data.metrics.http_req_duration?.values['p(50)']?.toFixed(2) || 'N/A';
  const p95 = data.metrics.http_req_duration?.values['p(95)']?.toFixed(2) || 'N/A';
  const p99 = data.metrics.http_req_duration?.values['p(99)']?.toFixed(2) || 'N/A';
  const reqs = data.metrics.http_reqs?.values?.count || 0;
  const failRate = data.metrics.http_req_failed ? (data.metrics.http_req_failed.values.rate * 100).toFixed(2) : '0';

  const summary = `
===========================================================
  CVIRMS k6 Load Test Summary (${SCENARIO_TYPE.toUpperCase()})
===========================================================
  Total Requests:  ${reqs}
  Fail Rate:       ${failRate}%
  Latency p50:     ${p50} ms
  Latency p95:     ${p95} ms
  Latency p99:     ${p99} ms
===========================================================
`;
  return {
    stdout: summary,
  };
}
