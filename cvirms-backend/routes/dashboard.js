const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

function formatRelativeTime(date) {
  if (!date) return 'Recently';
  try {
    const diffSec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diffSec < 15) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? '' : 's'} ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr${diffHr === 1 ? '' : 's'} ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  } catch {
    return 'Recently';
  }
}

/**
 * 1. GET /api/dashboard/stats
 * Real aggregate counts for authenticated establishment
 */
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      totalRes,
      activeRes,
      pendingRes,
      employeesRes,
      foreignersRes,
      qrVisitorsRes,
      weeklyRes,
    ] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS count FROM guests WHERE user_id = $1', [userId]),
      db.query('SELECT COUNT(*)::int AS count FROM guests WHERE user_id = $1 AND check_out_date IS NULL', [userId]),
      db.query("SELECT COUNT(*)::int AS count FROM guests WHERE user_id = $1 AND qr_code_string = 'PENDING'", [userId]),
      db.query('SELECT COUNT(*)::int AS count FROM employees WHERE user_id = $1', [userId]),
      db.query('SELECT COUNT(*)::int AS count FROM foreigners WHERE user_id = $1', [userId]),
      db.query("SELECT COUNT(*)::int AS count FROM guests WHERE user_id = $1 AND qr_code_string IS NOT NULL AND qr_code_string NOT IN ('PENDING', 'REJECTED')", [userId]),
      db.query(
        `SELECT TO_CHAR(check_in_date, 'Dy') AS day_name, TO_CHAR(check_in_date, 'YYYY-MM-DD') AS day_date, COUNT(*)::int AS count
         FROM guests
         WHERE user_id = $1 AND check_in_date >= NOW() - INTERVAL '7 days'
         GROUP BY TO_CHAR(check_in_date, 'Dy'), TO_CHAR(check_in_date, 'YYYY-MM-DD')
         ORDER BY day_date ASC`,
        [userId]
      ),
    ]);

    const totalVisitors = totalRes.rows[0]?.count || 0;
    const activeTenants = activeRes.rows[0]?.count || 0;
    const pendingQR = pendingRes.rows[0]?.count || 0;
    const totalEmployees = employeesRes.rows[0]?.count || 0;
    const totalForeigners = foreignersRes.rows[0]?.count || 0;
    const totalVisitorsWithQr = qrVisitorsRes.rows[0]?.count || 0;

    // Compliance Score: (totalVisitorsWithQr / totalVisitors) * 100, fallback 0
    const complianceScore =
      totalVisitors > 0
        ? Math.min(100, Math.round((totalVisitorsWithQr / totalVisitors) * 100))
        : 100;

    const stats = {
      totalVisitors,
      activeTenants,
      activeCustomers: activeTenants,
      pendingQR,
      totalEmployees,
      totalForeigners,
      totalVisitorsWithQr,
      complianceScore,
      weeklyCheckins: weeklyRes.rows || [],
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
 */
router.get('/recent-visitors', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT id, guest_name, id_proof_type, id_proof_number, room_number, check_in_date, check_out_date, qr_code_string, created_at
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
 * Helper to get live merged activities from guests and employees
 */
async function getLiveRecentActivity(userId) {
  const [guestsRes, employeesRes] = await Promise.all([
    db.query(
      `SELECT id, guest_name AS name, room_number, qr_code_string, check_in_date, created_at
       FROM guests
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    ),
    db.query(
      `SELECT id, full_name AS name, document_type, created_at
       FROM employees
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    ),
  ]);

  const guestActivities = (guestsRes.rows || []).map((g) => {
    let type = 'checkin';
    let detail = g.room_number ? `Checked into Room ${g.room_number}` : 'Visitor checked in';

    if (g.qr_code_string && g.qr_code_string !== 'PENDING' && g.qr_code_string !== 'REJECTED') {
      type = 'qr_approved';
      detail = 'Digital QR registration approved & checked in';
    } else if (g.qr_code_string === 'PENDING') {
      type = 'qr_pending';
      detail = 'QR Self-registration submitted • Pending approval';
    }

    return {
      id: `guest-${g.id}`,
      type,
      name: g.name,
      detail,
      rawDate: new Date(g.created_at || g.check_in_date),
      timestamp: formatRelativeTime(g.created_at || g.check_in_date),
    };
  });

  const employeeActivities = (employeesRes.rows || []).map((e) => ({
    id: `emp-${e.id}`,
    type: 'employee_added',
    name: e.name,
    detail: `Staff profile registered with ${e.document_type || 'ID'}`,
    rawDate: new Date(e.created_at),
    timestamp: formatRelativeTime(e.created_at),
  }));

  const merged = [...guestActivities, ...employeeActivities]
    .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
    .slice(0, 5)
    .map(({ rawDate, ...rest }) => rest);

  return merged;
}

/**
 * 3. GET /api/dashboard/recent-activity & GET /api/dashboard/activity
 * Real activity feed merged from live database records
 */
const activityHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const activities = await getLiveRecentActivity(userId);

    return res.status(200).json({
      success: true,
      activities,
      activity: activities,
      data: activities,
      count: activities.length,
    });
  } catch (error) {
    console.error('[Dashboard Activity Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard activity',
      error: error.message,
    });
  }
};

router.get('/recent-activity', verifyToken, activityHandler);
router.get('/activity', verifyToken, activityHandler);

module.exports = router;
