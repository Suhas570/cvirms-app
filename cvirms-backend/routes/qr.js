const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3001';

/**
 * ============================================================================
 * PUBLIC ENDPOINTS (NO AUTH REQUIRED)
 * ============================================================================
 */

/**
 * 1. GET /api/qr/hotel/:qrToken
 * Public: Validate QR token and fetch hotel name + member_type
 */
router.get('/hotel/:qrToken', async (req, res) => {
  const { qrToken } = req.params;

  if (!qrToken || typeof qrToken !== 'string' || qrToken.trim().length === 0) {
    return res.status(400).json({
      success: false,
      valid: false,
      message: 'QR token is required.',
    });
  }

  const tokenClean = qrToken.trim().toUpperCase();

  try {
    const result = await db.query(
      `SELECT id, name, member_type, qr_token 
       FROM users 
       WHERE qr_token = $1`,
      [tokenClean]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Invalid QR code. Please ask your hotel for the correct code.',
      });
    }

    const hotel = result.rows[0];
    return res.status(200).json({
      success: true,
      valid: true,
      hotelName: hotel.name,
      memberType: hotel.member_type,
    });
  } catch (error) {
    console.error('[QR Hotel Lookup Error]:', error.message);
    return res.status(500).json({
      success: false,
      valid: false,
      message: 'Failed to verify QR code due to server error.',
      error: error.message,
    });
  }
});

/**
 * 2. POST /api/qr/public-register/:qrToken
 * Public: Self-registration submission by visitor scanning the hotel's QR code
 */
router.post('/public-register/:qrToken', async (req, res) => {
  const { qrToken } = req.params;
  const {
    guest_name,
    contact_number,
    id_proof_type,
    id_proof_number,
    purpose_of_visit,
  } = req.body;

  if (!qrToken || typeof qrToken !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'QR token is missing.',
    });
  }

  const tokenClean = qrToken.trim().toUpperCase();

  // Field validation
  const errors = {};
  if (!guest_name || !guest_name.trim()) errors.guest_name = 'Full name is required';
  if (!contact_number || !contact_number.trim()) {
    errors.contact_number = 'Contact number is required';
  } else if (!/^[0-9+\s-]{10,15}$/.test(contact_number.trim())) {
    errors.contact_number = 'Valid contact number is required';
  }
  if (!id_proof_type || !id_proof_type.trim()) errors.id_proof_type = 'ID proof type is required';
  if (!id_proof_number || !id_proof_number.trim()) errors.id_proof_number = 'ID number is required';

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please fill in all required fields.',
      errors,
    });
  }

  try {
    // Look up hotel by QR token
    const hotelResult = await db.query(
      `SELECT id, name, qr_token FROM users WHERE qr_token = $1`,
      [tokenClean]
    );

    if (hotelResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired QR code. Please ask the establishment for a new code.',
      });
    }

    const hotel = hotelResult.rows[0];

    // Insert new pending guest record
    const insertResult = await db.query(
      `INSERT INTO guests (
        user_id,
        guest_name,
        contact_number,
        id_proof_type,
        id_proof_number,
        purpose_of_visit,
        room_number,
        check_in_date,
        qr_code_string,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'Pending', NOW(), 'PENDING', 'PENDING', NOW())
      RETURNING id, user_id, guest_name, contact_number, id_proof_type, id_proof_number, purpose_of_visit, qr_code_string, status, created_at;`,
      [
        hotel.id,
        guest_name.trim(),
        contact_number.trim(),
        id_proof_type.trim(),
        id_proof_number.trim(),
        purpose_of_visit ? purpose_of_visit.trim() : 'General Visit',
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Your registration is pending approval by the hotel',
      guest: insertResult.rows[0],
    });
  } catch (error) {
    console.error('[Public Register Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Registration submission failed due to server error.',
      error: error.message,
    });
  }
});

/**
 * ============================================================================
 * AUTHENTICATED ENDPOINTS (REQUIRE VALID BEARER TOKEN)
 * ============================================================================
 */

router.use(verifyToken);

/**
 * 3. GET /api/qr/my-qr
 * Retrieves the logged-in establishment's QR token.
 * Generates and saves a 10-char uppercase hex token if one doesn't exist yet.
 */
router.get('/my-qr', async (req, res) => {
  const userId = req.user.id;

  try {
    const userRes = await db.query(
      `SELECT id, name, qr_token, qr_generated_at FROM users WHERE id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    let { qr_token, qr_generated_at } = userRes.rows[0];

    // If no qr_token exists, generate a unique 10-character token
    if (!qr_token) {
      let uniqueToken = null;
      let attempts = 0;

      while (!uniqueToken && attempts < 5) {
        attempts++;
        const candidate = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 chars
        const check = await db.query(`SELECT id FROM users WHERE qr_token = $1`, [candidate]);
        if (check.rows.length === 0) {
          uniqueToken = candidate;
        }
      }

      if (!uniqueToken) {
        return res.status(500).json({
          success: false,
          message: 'Failed to generate unique QR token. Please try again.',
        });
      }

      const updateRes = await db.query(
        `UPDATE users 
         SET qr_token = $1, qr_generated_at = NOW() 
         WHERE id = $2 
         RETURNING qr_token, qr_generated_at`,
        [uniqueToken, userId]
      );

      qr_token = updateRes.rows[0].qr_token;
      qr_generated_at = updateRes.rows[0].qr_generated_at;
    }

    const qrUrl = `${CLIENT_URL}/scan/${qr_token}`;

    return res.status(200).json({
      success: true,
      qrToken: qr_token,
      qrUrl,
      generatedAt: qr_generated_at,
    });
  } catch (error) {
    console.error('[Get My QR Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve or generate establishment QR code.',
      error: error.message,
    });
  }
});

/**
 * 4. GET /api/qr/pending
 * Returns all guests with qr_code_string = 'PENDING' for req.user.id ORDER BY created_at DESC
 */
router.get('/pending', async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT * FROM guests 
       WHERE user_id = $1 AND qr_code_string = 'PENDING' 
       ORDER BY created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      pending: result.rows,
      guests: result.rows,
    });
  } catch (error) {
    console.error('[Get Pending QR Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending QR self-registrations.',
      error: error.message,
    });
  }
});

/**
 * 5. POST /api/qr/approve/:guestId
 * Approves a pending self-registration:
 * - Verifies guest belongs to req.user.id
 * - Updates guest: qr_code_string = hotel's qr_token, status = 'APPROVED'
 */
router.post('/approve/:guestId', async (req, res) => {
  const userId = req.user.id;
  const { guestId } = req.params;

  try {
    // 1. Get hotel's qr_token
    const userRes = await db.query(`SELECT qr_token FROM users WHERE id = $1`, [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const hotelQrToken = userRes.rows[0].qr_token || 'APPROVED_QR';

    // 2. Check if guest exists and belongs to current user
    const guestCheck = await db.query(`SELECT id, user_id FROM guests WHERE id = $1`, [guestId]);
    if (guestCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Guest record not found.',
      });
    }

    if (guestCheck.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not own this guest record.',
      });
    }

    // 3. Update guest status
    await db.query(
      `UPDATE guests 
       SET qr_code_string = $1, status = 'APPROVED', check_in_date = NOW() 
       WHERE id = $2 AND user_id = $3`,
      [hotelQrToken, guestId, userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Visitor approved',
    });
  } catch (error) {
    console.error('[Approve QR Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve visitor.',
      error: error.message,
    });
  }
});

/**
 * 6. POST /api/qr/reject/:guestId
 * Rejects a pending self-registration:
 * - Verifies ownership
 * - Deletes the guest record
 */
router.post('/reject/:guestId', async (req, res) => {
  const userId = req.user.id;
  const { guestId } = req.params;

  try {
    // 1. Check if guest exists and belongs to current user
    const guestCheck = await db.query(`SELECT id, user_id FROM guests WHERE id = $1`, [guestId]);
    if (guestCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Guest record not found.',
      });
    }

    if (guestCheck.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not own this guest record.',
      });
    }

    // 2. Delete guest record
    await db.query(`DELETE FROM guests WHERE id = $1 AND user_id = $2`, [guestId, userId]);

    return res.status(200).json({
      success: true,
      message: 'Visitor rejected',
    });
  } catch (error) {
    console.error('[Reject QR Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject visitor.',
      error: error.message,
    });
  }
});

module.exports = router;
