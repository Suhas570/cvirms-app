const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, '../.agents/taskboard/tasks.sqlite');
const db = new DatabaseSync(dbPath);
const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
const taskId = 'task-day13-karnataka-locations';

// Remove existing if any
try {
  db.prepare(`DELETE FROM task_subtasks WHERE task_id = ?`).run(taskId);
  db.prepare(`DELETE FROM agent_tasks WHERE id = ?`).run(taskId);
} catch (e) {
  // ignore
}

db.prepare(`
  INSERT INTO agent_tasks (id, title, description, acceptance_criteria, verification_cmd, status, priority, subagent_role, scope_size, order_index, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  taskId,
  'Day 13: Karnataka Cascading Location Selector',
  'Add Karnataka-specific cascading location selector (State -> District -> Taluka -> Police Station) with Landmark and Full Address to registration form',
  'All 31 districts, cascading dropdowns, database migration, backend validation/insertion, frontend validation, and dev log complete',
  'node cvirms-backend/database/verify-day13-columns.js',
  'in_progress',
  'high',
  'Fullstack Engineer',
  'medium',
  1,
  now,
  now
);

const subtasks = [
  { id: 'subtask-d13-t1', title: 'Task 1: Create Karnataka Locations Data (31 districts)' },
  { id: 'subtask-d13-t2', title: 'Task 2: Database - Add Location Columns to Users Table' },
  { id: 'subtask-d13-t3', title: 'Task 3: Backend - Accept & Validate New Location Fields' },
  { id: 'subtask-d13-t4', title: 'Task 4: Frontend - Cascading Location Section & Validation' }
];

const insertSubtask = db.prepare(`
  INSERT INTO task_subtasks (id, task_id, title, status, order_index, created_at, updated_at)
  VALUES (?, ?, ?, 'todo', ?, ?, ?)
`);

subtasks.forEach((st, idx) => {
  insertSubtask.run(st.id, taskId, st.title, idx + 1, now, now);
});

console.log('✅ Day 13 Task + 4 Subtasks created successfully in Taskboard!');
