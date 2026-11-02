const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.resolve(__dirname, '../.agents/taskboard/tasks.sqlite');
const db = new DatabaseSync(dbPath);
const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

const planContent = `### Implementation Plan
1. **Database Migration**: Run ALTER TABLE users commands adding registration, payment, and temporary password columns. Update \`schema.sql\`.
2. **Backend Registration Routes**: Create \`cvirms-backend/routes/register.js\` with \`POST /api/register/initiate\`, \`POST /api/register/verify-payment\`, and \`GET /api/register/check-username/:username\`. Mount in \`cvirms-backend/server.js\`.
3. **Backend Username Login Route**: Update \`cvirms-backend/routes/auth.js\` with \`POST /api/auth/login-username\` using bcrypt password comparison against \`temp_password_hash\`.
4. **Frontend Login Dual Mode**: Update \`cvirms-frontend/app/login/page.tsx\` to add OTP vs Password tab switcher and bottom registration prompt linking to \`/register\`.
5. **Frontend Self-Registration Form**: Build \`cvirms-frontend/app/register/page.tsx\` with 4 sections: Establishment details, Owner details, Address, and Pricing card.
6. **Frontend Payment Page**: Build \`cvirms-frontend/app/register/payment/page.tsx\` with order summary, payment method selection, and payment simulation.
7. **Frontend Receipt Printer & Success View**: Build \`cvirms-frontend/components/ReceiptPrinter.tsx\` with realistic printer slot, jagged receipt paper, SVG barcode, CSS animations, and credentials card with copy buttons. Create \`cvirms-frontend/app/register/success/page.tsx\`.
8. **WhatsApp/SMS Delivery Mock**: Ensure backend mock logging prints clear credentials with [WHATSAPP MOCK] format, and frontend displays delivery confirmation.
9. **Humanization & Design Compliance**: Ensure zero emojis, Lucide SVG icons only, Inter + JetBrains Mono typography, Indian locale dates, and smooth micro-animations.
10. **End-to-End Verification**: Execute test script covering complete self-registration, payment, and dual-mode login flow, then update DEV_LOG.md.

Verification Plan: Run automated test script \`scripts/verify-day10-features.js\` and verify all API responses and DB changes.`;

db.prepare(`
  INSERT INTO task_comments (id, task_id, author, comment_type, content, processed_by_agent, created_at)
  VALUES ('comment-d10-plan', 'task-day10-reg-pay', 'Antigravity', 'plan', ?, 0, ?)
`).run(planContent, now);

console.log('✅ Plan comment added.');
