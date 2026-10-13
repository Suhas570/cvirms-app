const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * 1. GET /api/dashboard/stats
 * Protected route returning aggregate stats for authenticated establishment
 * Returns: { totalVisitors, activeTenants, pendingQR, totalEmployees }
 */
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [totalRes, activeRes, pendingRes, employeesRes] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS count FROM guests WHERE user_id = $1', [userId]),
      db.query('SELECT COUNT(*)::int AS count FROM guests WHERE user_id = $1 AND check_out_date IS NULL', [userId]),
      db.query('SELECT COUNT(*)::int AS count FROM guests WHERE user_id = $1 AND qr_code_string IS NULL', [userId]),
      db.query('SELECT COUNT(*)::int AS count FROM employees WHERE user_id = $1', [userId]),
    ]);

    const stats = {
      totalVisitors: totalRes.rows[0]?.count || 0,
      activeTenants: activeRes.rows[0]?.count || 0,
      pendingQR: pendingRes.rows[0]?.count || 0,
      totalEmployees: employeesRes.rows[0]?.count || 0,
    };

    return res.status(200).json({
      success: true,
      ...stats,
      stats,
    });
  } catch (error) {
    console.error('[Dashboard Stats Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics',
      error: error.message,
    });
  }
});

/**
 * 2. GET /api/dashboard/recent-visitors
 * Returns last 10 guests for authenticated establishment
 * Fields: id, guest_name, id_proof_type, id_proof_number, room_number, check_in_date, check_out_date, created_at
 */
router.get('/recent-visitors', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT id, guest_name, id_proof_type, id_proof_number, room_number, check_in_date, check_out_date, created_at
       FROM guests
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    const rows = result.rows || [];

    return res.status(200).json({
      success: true,
      recentVisitors: rows,
      visitors: rows,
      data: rows,
      count: rows.length,
    });
  } catch (error) {
    console.error('[Dashboard Recent Visitors Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent visitors',
      error: error.message,
    });
  }
});

/**
 * 3. GET /api/dashboard/activity
 * Returns array of last 5 activity items with realistic Indian names
 * Structure: [{ type, name, detail, timestamp }]
 */
router.get('/activity', verifyToken, async (req, res) => {
  try {
    const activities = [
      {
        id: 1,
        type: 'checkin',
        name: 'Rajesh Kumar',
        detail: 'Checked into Room 204 • Aadhaar verified',
        timestamp: '12 mins ago',
      },
      {
        id: 2,
        type: 'qr_approved',
        name: 'Priya Sharma',
        detail: 'Digital QR Pass approved for PG Room 102',
        timestamp: '45 mins ago',
      },
      {
        id: 3,
        type: 'employee_added',
        name: 'Suresh Patil',
        detail: 'Registered as Night Security Guard',
        timestamp: '2 hours ago',
      },
      {
        id: 4,
        type: 'checkout',
        name: 'Anita Desai',
        detail: 'Checked out from Room 305 • Records archived',
        timestamp: '3 hours ago',
      },
      {
        id: 5,
        type: 'foreigner_registered',
        name: 'Vikram Reddy',
        detail: 'International visitor Form C compliance logged',
        timestamp: '5 hours ago',
      },
    ];

    return res.status(200).json({
      success: true,
      activities,
      activity: activities,
      data: activities,
    });
  } catch (error) {
    console.error('[Dashboard Activity Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard activity',
      error: error.message,
    });
  }
});

module.exports = router;
