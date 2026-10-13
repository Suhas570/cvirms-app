const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cvirms_jwt_secret_key_secure_2026_dev';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Isolated SMS sender utility
 * TODO: Replace mock with real SMS API (Fast2SMS). Isolate in sendSmsOTP() for easy swap.
 */
async function sendSmsOTP(phoneNumber, otp) {
  console.log(`[MOCK OTP] Phone: ${phoneNumber} | OTP: ${otp}`);
  return true;
}

/**
 * 1. POST /api/auth/register
 * Accepts { name, email, phone, user_id, role, member_type }
 */
router.post('/register', async (req, res) => {
  const { name, email, phone, user_id, role = 'member', member_type = 'other' } = req.body;

  if (!name || !email || (!phone && !user_id)) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and at least phone or user_id are required.',
    });
  }

  try {
    // Check if user already exists
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1 OR (phone IS NOT NULL AND phone = $2) OR (user_id IS NOT NULL AND user_id = $3)',
      [email, phone || null, user_id || null]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email, phone, or user_id already exists.',
      });
    }

    const insertQuery = `
      INSERT INTO users (name, email, phone, user_id, role, member_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, phone, user_id, role, member_type, is_verified, created_at;
    `;

    const result = await db.query(insertQuery, [
      name,
      email,
      phone || null,
      user_id || null,
      role,
      member_type,
    ]);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('[Auth Register Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Registration failed due to server error.',
      error: error.message,
    });
  }
});

/**
 * 2. POST /api/auth/send-otp
 * Accepts { phone } OR { user_id }
 */
router.post('/send-otp', async (req, res) => {
  const { phone, user_id } = req.body;
  const identifier = phone || user_id;

  if (!identifier) {
    return res.status(400).json({
      success: false,
      message: 'Phone number or user_id is required.',
    });
  }

  try {
    // Find user by phone OR user_id
    const userResult = await db.query(
      'SELECT * FROM users WHERE phone = $1 OR user_id = $1 LIMIT 1',
      [identifier]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found with the provided phone or User ID.',
      });
    }

    const user = userResult.rows[0];
    const otp = '123456'; // MOCK 6-digit OTP
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    await db.query(
      'UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3',
      [otp, expiresAt, user.id]
    );

    // Send isolated SMS notification
    await sendSmsOTP(user.phone || identifier, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent',
    });
  } catch (error) {
    console.error('[Send OTP Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP.',
      error: error.message,
    });
  }
});

/**
 * 3. POST /api/auth/verify-otp
 * Accepts { phone OR user_id, otp, captcha }
 */
router.post('/verify-otp', async (req, res) => {
  const { phone, user_id, otp, captcha } = req.body;
  const identifier = phone || user_id;

  if (!identifier || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Phone/User ID and OTP are required.',
    });
  }

  // Captcha validation: SKIP for now (return true)
  // const isCaptchaValid = true;

  try {
    const userResult = await db.query(
      'SELECT * FROM users WHERE phone = $1 OR user_id = $1 LIMIT 1',
      [identifier]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or user not found.',
      });
    }

    const user = userResult.rows[0];

    // Check OTP expiry (allow hardcoded mock '123456' even if timestamp check is applied)
    const isMockOtp = otp === '123456';
    const isStoredOtp = user.otp_code && user.otp_code === otp;

    if (!isMockOtp && !isStoredOtp) {
      return res.status(401).json({
        success: false,
        message: 'Invalid OTP code. Please enter the correct code.',
      });
    }

    if (user.otp_expires_at && new Date() > new Date(user.otp_expires_at)) {
      return res.status(401).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.',
      });
    }

    // Mark as verified and clear temporary OTP
    await db.query(
      'UPDATE users SET is_verified = TRUE, otp_code = NULL WHERE id = $1',
      [user.id]
    );

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      user_id: user.user_id,
      role: user.role,
      member_type: user.member_type,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user: payload,
    });
  } catch (error) {
    console.error('[Verify OTP Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed.',
      error: error.message,
    });
  }
});

/**
 * 4. GET /api/auth/me
 * Protected route using verifyToken
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, phone, user_id, role, member_type, is_verified, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('[Auth /me Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile data.',
      error: error.message,
    });
  }
});

module.exports = router;
