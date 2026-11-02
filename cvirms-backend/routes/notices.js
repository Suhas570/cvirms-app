const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Require authentication for all notice endpoints
router.use(verifyToken);

/**
 * 1. GET /api/notices
 * Retrieves list of notices filtered by "current" or "archived"
 */
router.get('/', async (req, res) => {
  const { filter } = req.query;
  const isArchivedFilter = filter === 'archived';

  try {
    let query;
    if (isArchivedFilter) {
      query = `
        SELECT id, title, message, date_posted, expiry_date, is_archived
        FROM notices
        WHERE is_archived = TRUE OR expiry_date < NOW()
        ORDER BY date_posted DESC;
      `;
    } else {
      query = `
        SELECT id, title, message, date_posted, expiry_date, is_archived
        FROM notices
        WHERE is_archived = FALSE AND (expiry_date IS NULL OR expiry_date > NOW())
        ORDER BY date_posted DESC;
      `;
    }

    const result = await db.query(query);

    return res.status(200).json({
      success: true,
      filter: isArchivedFilter ? 'archived' : 'current',
      count: result.rows.length,
      notices: result.rows,
    });
  } catch (error) {
    console.error('[Get Notices Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notices.',
      error: error.message,
    });
  }
});

/**
 * 2. GET /api/notices/:id
 * Retrieves a single notice by ID
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT id, title, message, date_posted, expiry_date, is_archived
       FROM notices
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found.',
      });
    }

    return res.status(200).json({
      success: true,
      notice: result.rows[0],
    });
  } catch (error) {
    console.error('[Get Notice By ID Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notice details.',
      error: error.message,
    });
  }
});

module.exports = router;
