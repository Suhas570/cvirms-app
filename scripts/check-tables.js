const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.resolve(__dirname, '../.agents/taskboard/tasks.sqlite');
console.log('Opening:', dbPath);
const db = new DatabaseSync(dbPath);
const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table'").all();
console.log('Tables found:', tables.map(t => t.name));
