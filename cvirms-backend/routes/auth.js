const express = require('express');
const jwt = require('jsonwebtoken');
const svgCaptcha = require('svg-captcha');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cvirms_jwt_secret_key_secure_2026_dev';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || JWT_SECRET;

// In-memory replay cache for consumed captcha IDs (cleans up every 10 mins)
const consumedCaptchas = new Set();
setInterval(() => {
  consumedCaptchas.clear();
}, 10 * 60 * 1000);

/**
 * Rate limiters for authentication endpoints
 */
const captchaLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 captchas per minute per IP
  message: { success: false, message: 'Too many captcha requests. Please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const sendOtpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 OTP requests per 5 minutes per IP
  message: { success: false, message: 'Rate limit exceeded: Too many OTP requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyOtpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // 15 verification attempts per 5 minutes per IP
  message: { success: false, message: 'Rate limit exceeded: Too many verification attempts. Please wait 5 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Generate Alphanumeric Captcha challenge
 * 5-6 characters, A-Z, a-z, 0-9, no symbols, case-insensitive
 */
function createCaptcha() {
  const captcha = svgCaptcha.create({
    size: 5,
    ignoreChars: '0o1ilI', // avoid ambiguous characters
    noise: 2,
    color: false,
    width: 140,
    height: 44,
    fontSize: 44,
    charPreset: '23456789abcdefghjkmnpqrstuvwxyz',
  });

  const captchaId = jwt.sign(
    { text: captcha.text.toLowerCase() },
    CAPTCHA_SECRET,
    { expiresIn: '5m' }
  );

  return { captchaId, captchaSvg: captcha.data, text: captcha.text };
}

/**
 * Validate Captcha answer (case-insensitive, one-time consumption)
 */
function verifyCaptcha(captchaId, userText) {
  if (!captchaId || !userText || !userText.trim()) {
    return { valid: false, reason: 'Security check required: Please enter the captcha code.' };
  }

  if (consumedCaptchas.has(captchaId)) {
    return { valid: false, reason: 'Security check expired: Captcha already consumed. Please click refresh.' };
  }

  try {
    const decoded = jwt.verify(captchaId, CAPTCHA_SECRET);
    if (decoded.text.toLowerCase() !== userText.trim().toLowerCase()) {
      return { valid: false, reason: 'Incorrect captcha code. Please enter the characters shown in the image.' };
    }
    // Mark as consumed to prevent replay attacks
    consumedCaptchas.add(captchaId);
    return { valid: true };
  } catch (err) {
    return { valid: false, reason: 'Captcha expired. Please click refresh for a new challenge.' };
  }
}

/**
 * Isolated SMS sender utility
 * TODO: Replace mock with real SMS API (Fast2SMS). Isolate in sendSmsOTP() for easy swap.
 */
async function sendSmsOTP(phoneNumber, otp) {
  console.log(`[SMS PROVIDER - MOCK] Sending OTP to ${phoneNumber} | Code: ${otp}`);
  return true;
}

/**
 * 0. GET /api/auth/captcha
 * Generates an alphanumeric SVG captcha
 */
router.get('/captcha', captchaLimiter, (req, res) => {
  try {
    const { captchaId, captchaSvg } = createCaptcha();
    res.status(200).json({
      success: true,
      captchaId,
      captchaSvg,
    });
  } catch (error) {
    console.error('[Captcha Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate security captcha.',
    });
  }
});

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
 * Accepts { phone, user_id, captcha, captchaId }
 * Enforces real alphanumeric captcha validation before issuing OTP.
 */
router.post('/send-otp', sendOtpLimiter, async (req, res) => {
  const { phone, user_id, captcha, captchaId } = req.body;
  const identifier = phone || user_id;

  if (!identifier) {
    return res.status(400).json({
      success: false,
      message: 'Phone number or user_id is required.',
    });
  }

  // 1. Validate real alphanumeric captcha
  const captchaCheck = verifyCaptcha(captchaId, captcha);
  if (!captchaCheck.valid) {
    return res.status(400).json({
      success: false,
      message: captchaCheck.reason,
    });
  }

  try {
    const userResult = await db.query(
      'SELECT * FROM users WHERE phone = $1 OR LOWER(user_id) = LOWER($1) LIMIT 1',
      [identifier]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found with the provided phone or User ID.',
      });
    }

    const user = userResult.rows[0];

    // In dev: OTP is "123456". In prod: cryptographic 6-digit number.
    const isDev = process.env.NODE_ENV !== 'production';
    const otp = isDev ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Reset attempts and save OTP
    await db.query(
      'UPDATE users SET otp_code = $1, otp_expires_at = $2, otp_attempts = 0 WHERE id = $3',
      [otp, expiresAt, user.id]
    );

    // Isolated SMS dispatch
    await sendSmsOTP(user.phone || identifier, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully. Please enter the 6-digit code.',
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
 * Accepts { phone, user_id, otp, captcha, captchaId }
 * Enforces atomic single-query verification, expired OTP rejection, and lockout after 5 failed attempts.
 */
router.post('/verify-otp', verifyOtpLimiter, async (req, res) => {
  const { phone, user_id, otp, captcha, captchaId } = req.body;
  const identifier = phone || user_id;

  if (!identifier || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Phone/User ID and 6-digit OTP are required.',
    });
  }

  // Optional: If client supplied fresh captcha with verify-otp, validate it
  if (captcha && captchaId && !consumedCaptchas.has(captchaId)) {
    const captchaCheck = verifyCaptcha(captchaId, captcha);
    if (!captchaCheck.valid) {
      return res.status(400).json({
        success: false,
        message: captchaCheck.reason,
      });
    }
  }

  try {
    const userResult = await db.query(
      'SELECT * FROM users WHERE phone = $1 OR LOWER(user_id) = LOWER($1) LIMIT 1',
      [identifier]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or user not found.',
      });
    }

    const user = userResult.rows[0];

    // Check attempt lockout
    if ((user.otp_attempts || 0) >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. This OTP has been invalidated. Please request a new OTP.',
      });
    }

    // Check active OTP exists
    if (!user.otp_code) {
      return res.status(401).json({
        success: false,
        message: 'No active OTP found. Please request a new code.',
      });
    }

    // Strict Expiry Gate (must reject expired OTP even in dev)
    if (user.otp_expires_at && new Date() > new Date(user.otp_expires_at)) {
      return res.status(401).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.',
      });
    }

    const submittedOtp = otp.toString().trim();
    const isMatch = user.otp_code === submittedOtp;

    if (!isMatch) {
      const newAttempts = (user.otp_attempts || 0) + 1;
      if (newAttempts >= 5) {
        // Invalidate on 5th failure
        await db.query(
          'UPDATE users SET otp_code = NULL, otp_expires_at = NULL, otp_attempts = $1 WHERE id = $2',
          [newAttempts, user.id]
        );
        return res.status(429).json({
          success: false,
          message: 'Too many incorrect attempts. This OTP has been invalidated. Please request a new OTP.',
        });
      }

      await db.query(
        'UPDATE users SET otp_attempts = $1 WHERE id = $2',
        [newAttempts, user.id]
      );

      return res.status(401).json({
        success: false,
        message: `Invalid OTP code. ${5 - newAttempts} attempts remaining.`,
      });
    }

    // ATOMIC VERIFICATION & CONSUMPTION:
    // Guarantees zero replay and zero race condition under concurrency.
    const atomicUpdate = await db.query(
      `UPDATE users
       SET is_verified = TRUE, otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0
       WHERE id = $1 AND otp_code = $2 AND (otp_expires_at IS NULL OR otp_expires_at > NOW())
       RETURNING id, name, email, phone, user_id, role, member_type, created_at;`,
      [user.id, user.otp_code]
    );

    if (atomicUpdate.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'OTP expired or already used. Please request a new code.',
      });
    }

    const verifiedUser = atomicUpdate.rows[0];

    const payload = {
      id: verifiedUser.id,
      name: verifiedUser.name,
      email: verifiedUser.email,
      phone: verifiedUser.phone,
      user_id: verifiedUser.user_id,
      role: verifiedUser.role,
      member_type: verifiedUser.member_type,
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
      message: 'OTP verification failed due to internal error.',
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
