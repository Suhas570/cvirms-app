const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Require authentication for all profile endpoints
router.use(verifyToken);

/**
 * 1. GET /api/profile/me
 * Retrieves the current authenticated user's profile details
 */
router.get('/me', async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT id, name, email, phone, user_id, role, member_type, qr_token, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('[Get Profile Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.',
      error: error.message,
    });
  }
});

/**
 * 2. PUT /api/profile/update
 * Updates user profile details (name, email, phone)
 */
router.put('/update', async (req, res) => {
  const userId = req.user.id;
  const { name, email, phone } = req.body;

  // Field Validations
  const errors = {};
  if (!name || !name.trim()) {
    errors.name = 'Full name is required';
  }

  if (!email || !email.trim()) {
    errors.email = 'Email address is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Please provide a valid email address';
  }

  if (phone) {
    const cleanPhone = phone.toString().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      errors.phone = 'Phone number must be 10 digits';
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone ? phone.toString().replace(/\D/g, '') : null;

  try {
    // Check email uniqueness across other users
    const emailConflict = await db.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [cleanEmail, userId]
    );
    if (emailConflict.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This email is already in use by another account.',
      });
    }

    // Check phone uniqueness if phone provided
    if (cleanPhone) {
      const phoneConflict = await db.query(
        'SELECT id FROM users WHERE phone = $1 AND id != $2',
        [cleanPhone, userId]
      );
      if (phoneConflict.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'This phone number is already registered to another account.',
        });
      }
    }

    const updateQuery = `
      UPDATE users
      SET name = $1, email = $2, phone = COALESCE($3, phone)
      WHERE id = $4
      RETURNING id, name, email, phone, user_id, role, member_type, qr_token, created_at;
    `;

    const result = await db.query(updateQuery, [cleanName, cleanEmail, cleanPhone, userId]);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('[Update Profile Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: error.message,
    });
  }
});

/**
 * 3. PUT /api/profile/change-password
 * Not applicable for OTP-based authentication accounts
 */
router.put('/change-password', (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Password change not applicable for OTP accounts',
  });
});

module.exports = router;
