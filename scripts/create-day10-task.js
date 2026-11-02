const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, '../.agents/taskboard/tasks.sqlite');
const db = new DatabaseSync(dbPath);
const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
const taskId = 'task-day10-reg-pay';

db.prepare(`
  INSERT INTO agent_tasks (id, title, description, acceptance_criteria, verification_cmd, status, priority, subagent_role, scope_size, order_index, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  taskId,
  'Day 10: Self-Registration, Payment & Receipt Printer',
  'Build self-registration flow, mock payment, animated receipt printer, credentials generation & delivery, and dual-mode login (OTP + Password)',
  'Full self-registration works: form -> payment -> receipt animation -> credentials -> login with password',
  'node scripts/verify-day10-features.js',
  'in_progress',
  'high',
  'Fullstack Engineer',
  'large',
  1,
  now,
  now
);

const subtasks = [
  { id: 'subtask-d10-t1', title: 'Task 1: Database - Add Registration Columns' },
  { id: 'subtask-d10-t2', title: 'Task 2: Backend - Registration Endpoints' },
  { id: 'subtask-d10-t3', title: 'Task 3: Backend - Update Login to Support Username' },
  { id: 'subtask-d10-t4', title: 'Task 4: Frontend - Login Page Updates' },
  { id: 'subtask-d10-t5', title: 'Task 5: Frontend - Register Page' },
  { id: 'subtask-d10-t6', title: 'Task 6: Frontend - Payment Page' },
  { id: 'subtask-d10-t7', title: 'Task 7: Frontend - Receipt Printer Success Page' },
  { id: 'subtask-d10-t8', title: 'Task 8: Frontend/Backend - WhatsApp/SMS Delivery Mock' },
  { id: 'subtask-d10-t9', title: 'Task 9: Humanization Check' },
  { id: 'subtask-d10-t10', title: 'Task 10: Test + Dev Log' }
];

const insertSubtask = db.prepare(`
  INSERT INTO task_subtasks (id, task_id, title, status, order_index, created_at, updated_at)
  VALUES (?, ?, ?, 'todo', ?, ?, ?)
`);

subtasks.forEach((st, idx) => {
  insertSubtask.run(st.id, taskId, st.title, idx + 1, now, now);
});

console.log('✅ Day 10 Task + 10 Subtasks created successfully!');
