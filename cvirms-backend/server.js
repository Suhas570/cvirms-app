const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// HTTP Request Logging (dev mode)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Response Time Header Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    if (!res.headersSent) {
      const duration = Date.now() - start;
      res.setHeader('X-Response-Time', `${duration}ms`);
    }
    return originalWriteHead.apply(this, args);
  };
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!res.headersSent) {
      try {
        res.setHeader('X-Response-Time', `${duration}ms`);
      } catch (e) {}
    }
  });
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const guestRoutes = require('./routes/guests');
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/guests', guestRoutes);


// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'CVIRMS Backend API is operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database Connectivity Test Route (Day 2)
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT NOW() AS current_time, current_database() AS database_name, version() AS pg_version;'
    );
    res.status(200).json({
      success: true,
      message: 'PostgreSQL database connection verified successfully',
      db_time: result.rows[0].current_time,
      database: result.rows[0].database_name,
      version: result.rows[0].pg_version,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[DB Test Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to PostgreSQL database',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    name: 'CVIRMS Backend API',
    description: 'City Visitor Information and Record Management System',
    version: '2.0.0',
    endpoints: {
      health: '/api/health',
      db_test: '/api/db-test'
    }
  });
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[CVIRMS Backend] Server running on port ${PORT}`);
    console.log(`[CVIRMS Backend] Health check: http://localhost:${PORT}/api/health`);
    console.log(`[CVIRMS Backend] DB Test: http://localhost:${PORT}/api/db-test`);
  });
}

module.exports = app;
