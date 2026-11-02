const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../db');

// Helper to generate a human-friendly temporary password (e.g. "pass4829" or 8 alphanumeric chars)
function generateTempPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 8; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

// Helper to normalize member_type to PostgreSQL enum
function normalizeMemberType(type) {
  if (!type) return 'lodge';
  const t = String(type).trim().toLowerCase().replace(/[\s-]+/g, '_');
  const validTypes = [
    'lodge', 'pg', 'hotel', 'organization', 'properties',
    'jewellery', 'petrol_bunk', 'scrap_dealer', 'vehicle_dealer',
    'home_stay', 'resort', 'hostel', 'other'
  ];
  if (validTypes.includes(t)) return t;
  return 'lodge';
}

// Helper to generate a unique username from establishment name
async function generateUniqueUsername(establishmentName) {
  const cleanBase = establishmentName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 12) || 'cvuser';

  let attempts = 0;
  while (attempts < 20) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit random
    const candidate = `${cleanBase}${randomSuffix}`;

    const check = await pool.query('SELECT id FROM users WHERE username = $1 OR user_id = $1 LIMIT 1', [candidate]);
    if (check.rows.length === 0) {
      return candidate;
    }
    attempts++;
  }
  return `cvuser${Date.now().toString().slice(-6)}`;
}

// Helper for Mock WhatsApp / SMS delivery
// TODO: Replace with Fast2SMS (SMS) or Twilio WhatsApp Business API
async function sendWhatsAppOTP(phone, username, tempPassword) {
  console.log(`\n============================================================`);
  console.log(`[WHATSAPP MOCK] To: +91${phone} | Username: ${username} | Temp Password: ${tempPassword}`);
  console.log(`[WHATSAPP MOCK] To: +91${phone}`);
  console.log(`[WHATSAPP MOCK] Username: ${username}`);
  console.log(`[WHATSAPP MOCK] Temp Password: ${tempPassword}`);
  console.log(`============================================================\n`);
  // Simulate 200ms async network delay
  await new Promise((resolve) => setTimeout(resolve, 200));
  return { success: true };
}

// ============================================================================
// 1. POST /api/register/initiate
// ============================================================================
router.post('/initiate', async (req, res) => {
  try {
    const {
      establishment_name,
      member_type,
      owner_name,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      district,
      taluka,
      police_station,
      landmark,
      full_address,
    } = req.body;

    // Validation
    if (!establishment_name || !establishment_name.trim()) {
      return res.status(400).json({ success: false, message: 'Establishment name is required' });
    }
    if (!owner_name || !owner_name.trim()) {
      return res.status(400).json({ success: false, message: 'Owner name is required' });
    }

    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(String(email).trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    // Location Fields Validation
    if (!district || !district.trim()) {
      return res.status(400).json({ success: false, message: 'District is required' });
    }
    if (!taluka || !taluka.trim()) {
      return res.status(400).json({ success: false, message: 'Taluka is required' });
    }
    if (!police_station || !police_station.trim()) {
      return res.status(400).json({ success: false, message: 'Police Station is required' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ success: false, message: 'City is required' });
    }

    const cleanPincode = String(pincode || '').replace(/\D/g, '');
    if (cleanPincode.length !== 6) {
      return res.status(400).json({ success: false, message: 'Pincode must be exactly 6 digits' });
    }

    if (!landmark || !landmark.trim()) {
      return res.status(400).json({ success: false, message: 'Landmark is required' });
    }

    const resolvedFullAddress = String(full_address || address || '').trim();
    if (!resolvedFullAddress) {
      return res.status(400).json({ success: false, message: 'Full Address is required' });
    }

    // Generate unique username & initial temp password
    const username = await generateUniqueUsername(establishment_name);
    const initialTempPassword = generateTempPassword();
    const tempPasswordHash = await bcrypt.hash(initialTempPassword, 10);

    // Format order ID: 'CV-2026-' + 5-digit random
    const orderId = `CV-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const normalizedType = normalizeMemberType(member_type);

    // Check if phone or email is already registered; if so, create unique identifier suffix for demo
    let finalPhone = cleanPhone;
    let finalEmail = email.trim().toLowerCase();
    const resolvedState = (state && state.trim()) ? state.trim() : 'Karnataka';

    // Insert user into PostgreSQL users table
    const insertQuery = `
      INSERT INTO users (
        name,
        email,
        phone,
        user_id,
        role,
        member_type,
        username,
        temp_password_hash,
        owner_name,
        address,
        city,
        state,
        pincode,
        district,
        taluka,
        police_station,
        landmark,
        full_address,
        payment_status,
        payment_amount,
        payment_order_id,
        registered_at
      ) VALUES (
        $1, $2, $3, $4, 'member', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'pending', 1450, $18, NOW()
      )
      RETURNING id, name, username, phone, email, payment_order_id, payment_amount, district, taluka, police_station, landmark, full_address;
    `;

    const queryParams = [
      establishment_name.trim(),
      finalEmail,
      finalPhone,
      username, // user_id column
      normalizedType,
      username,
      tempPasswordHash,
      owner_name.trim(),
      resolvedFullAddress,
      city.trim(),
      resolvedState,
      cleanPincode,
      district.trim(),
      taluka.trim(),
      police_station.trim(),
      landmark.trim(),
      resolvedFullAddress,
      orderId,
    ];

    let insertedUser;
    try {
      const result = await pool.query(insertQuery, queryParams);
      insertedUser = result.rows[0];
    } catch (dbErr) {
      // If email or phone has unique conflict, handle gracefully by appending timestamp
      if (dbErr.code === '23505') {
        const uniqueSuffix = Date.now().toString().slice(-4);
        finalEmail = `${finalEmail.split('@')[0]}_${uniqueSuffix}@${finalEmail.split('@')[1]}`;
        finalPhone = `${cleanPhone.slice(0, 6)}${uniqueSuffix}`;

        queryParams[1] = finalEmail;
        queryParams[2] = finalPhone;

        const result2 = await pool.query(insertQuery, queryParams);
        insertedUser = result2.rows[0];
      } else {
        throw dbErr;
      }
    }

    return res.status(201).json({
      success: true,
      userId: insertedUser.id,
      orderId: insertedUser.payment_order_id,
      amount: 1450,
      username: insertedUser.username,
      phone: insertedUser.phone,
      message: 'Registration initiated successfully. Proceed to payment.',
    });
  } catch (error) {
    console.error('Registration initiate error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error while initiating registration' });
  }
});

// ============================================================================
// 2. POST /api/register/verify-payment
// ============================================================================
router.post('/verify-payment', async (req, res) => {
  try {
    const { userId, orderId, paymentMethod, simulateFailure } = req.body;

    if (!userId || !orderId) {
      return res.status(400).json({ success: false, message: 'Missing userId or orderId' });
    }

    // Check user & order
    const userQuery = await pool.query(
      'SELECT id, name, username, phone, payment_order_id, payment_status FROM users WHERE id = $1 AND payment_order_id = $2',
      [userId, orderId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order or establishment record not found' });
    }

    const user = userQuery.rows[0];

    // MOCK Payment Simulation: 90% success rate, 10% failure (unless simulateFailure is specified)
    const isSuccess = simulateFailure ? false : Math.random() < 0.95;

    if (!isSuccess) {
      return res.status(400).json({
        success: false,
        message: 'Payment failed. Please try again.',
      });
    }

    // Generate fresh 8-char temporary password
    const tempPassword = generateTempPassword();
    const tempPasswordHash = await bcrypt.hash(tempPassword, 10);

    // Update users record
    await pool.query(
      `UPDATE users 
       SET payment_status = 'paid', 
           payment_amount = 1450, 
           temp_password_hash = $1 
       WHERE id = $2 AND payment_order_id = $3`,
      [tempPasswordHash, userId, orderId]
    );

    // Deliver credentials via mock WhatsApp / SMS
    await sendWhatsAppOTP(user.phone, user.username, tempPassword);

    return res.status(200).json({
      success: true,
      orderId,
      amount: 1450,
      date: new Date().toISOString(),
      method: paymentMethod || 'upi',
      username: user.username,
      tempPassword,
      phone: user.phone,
      message: 'Payment verified successfully. Credentials generated.',
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error while verifying payment' });
  }
});

// ============================================================================
// 3. GET /api/register/check-username/:username
// ============================================================================
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ available: false, message: 'Username parameter required' });
    }

    const check = await pool.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(user_id) = LOWER($1) LIMIT 1',
      [username.trim()]
    );

    return res.status(200).json({
      available: check.rows.length === 0,
      username: username.trim(),
    });
  } catch (error) {
    console.error('Check username error:', error);
    return res.status(500).json({ available: false, message: 'Error checking username' });
  }
});

module.exports = router;
