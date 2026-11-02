const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, '../.agents/taskboard/tasks.sqlite');
const db = new DatabaseSync(dbPath);
const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
const taskId = 'task-day13-karnataka-locations';

const followups = [
  {
    title: "Location Hierarchy Filtering on Admin & Police Dashboard",
    description: "Add cascading District -> Taluka -> Police Station filter pills to the admin & law enforcement dashboard visitor logs.",
    scope_size: "medium",
    priority: "high"
  },
  {
    title: "Auto-Fill Location Fields from Aadhaar QR/OCR Scan in Registration",
    description: "Extract District, Taluka, and Pincode during identity onboarding to auto-select cascading dropdowns.",
    scope_size: "small",
    priority: "medium"
  },
  {
    title: "Karnataka Police Station Jurisdiction Geo-Fencing & Contact Directory",
    description: "Map each police station to officer-in-charge contact details and station helpline numbers.",
    scope_size: "medium",
    priority: "medium"
  }
];

const walkthroughContent = `### Implementation Walkthrough: Day 13 Karnataka Cascading Location Selector

- **File changes**:
  - \`cvirms-frontend/lib/karnatakaLocations.ts\`: Created static typed dataset with all 31 Karnataka districts, talukas, and police stations plus helper lookup functions (\`getDistricts\`, \`getTalukas\`, \`getPoliceStations\`).
  - \`cvirms-backend/database/add-location-columns.js\`: Added migration DDL for \`district\`, \`taluka\`, \`police_station\`, \`landmark\`, \`full_address\` to PostgreSQL users table.
  - \`cvirms-backend/database/schema.sql\`: Updated schema definitions for synchronized fresh deployments.
  - \`cvirms-backend/routes/register.js\`: Updated \`POST /api/register/initiate\` with validation for all location fields and SQL insertion.
  - \`cvirms-frontend/app/register/page.tsx\`: Replaced legacy address section with Section 3: "Location Details" containing cascading dropdowns, Lucide map/pin icons, inline error messages, and submit gate.
  - \`DEV_LOG.md\`: Updated with Day 13 log entry.

- **Verification**:
  - \`cvirms-backend/database/verify-day13-columns.js\`: Verified all 5 location columns in PostgreSQL users table schema.
  - \`scripts/verify-day13-features.js\`: Executed 40/40 tests verifying dataset, SSR HTML elements, cascading reactivity, pincode rejection, registration initiate, payment verification, and DB row extraction.
  - \`SELECT district, taluka, police_station, landmark FROM users WHERE username LIKE '%grand%'\`: Verified stored data in PostgreSQL.

### Suggested Follow-up Tasks
1. **Location Hierarchy Filtering on Admin & Police Dashboard**: Add cascading District -> Taluka -> Police Station filter pills to the admin & law enforcement dashboard visitor logs.
2. **Auto-Fill Location Fields from Aadhaar QR/OCR Scan in Registration**: Extract District, Taluka, and Pincode during identity onboarding to auto-select cascading dropdowns.
3. **Karnataka Police Station Jurisdiction Geo-Fencing & Contact Directory**: Map each police station to officer-in-charge contact details and station helpline numbers.

<!-- FOLLOWUP_TASKS_JSON ${JSON.stringify(followups)} -->
`;

const commentId = `comment-${Date.now()}`;
db.prepare(`
  INSERT INTO task_comments (id, task_id, content, author, comment_type, created_at)
  VALUES (?, ?, ?, 'Fullstack Engineer', 'walkthrough', ?)
`).run(commentId, taskId, walkthroughContent, now);

db.prepare(`
  UPDATE agent_tasks 
  SET status = 'verification', updated_at = ?
  WHERE id = ?
`).run(now, taskId);

console.log('✅ Day 13 Walkthrough and status transition to verification complete!');
