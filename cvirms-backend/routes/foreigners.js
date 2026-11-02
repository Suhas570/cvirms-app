const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * All routes require authentication
 */
router.use(verifyToken);

/**
 * 1. POST /api/foreigners
 * Registers a new foreign national for C-Form regulatory compliance
 */
router.post('/', async (req, res) => {
  const {
    first_name,
    middle_name,
    last_name,
    country,
    mobile_number,
    address,
    city,
    state,
    zip_code,
    indian_contact,
    passport_number,
    passport_details,
    visa_number,
    valid_from,
    valid_upto,
    purpose_of_visit,
    coming_from,
    going_to,
    photo_url,
    passport_photo_url,
    c_form_url,
  } = req.body;

  const errors = {};
  if (!first_name || !first_name.trim()) errors.first_name = 'First name is required';
  if (!last_name || !last_name.trim()) errors.last_name = 'Last name is required';
  if (!country || !country.trim()) errors.country = 'Country is required';
  if (!mobile_number || !mobile_number.trim()) errors.mobile_number = 'Mobile number is required';
  if (!address || !address.trim()) errors.address = 'Address is required';
  if (!city || !city.trim()) errors.city = 'City is required';

  const passport = (passport_number || passport_details || '').trim();
  if (!passport) errors.passport_number = 'Passport number is required';

  if (!visa_number || !visa_number.trim()) errors.visa_number = 'Visa number is required';
  if (!valid_from) errors.valid_from = 'Visa valid from date is required';
  if (!valid_upto) errors.valid_upto = 'Visa valid up to date is required';
  if (!purpose_of_visit || !purpose_of_visit.trim()) errors.purpose_of_visit = 'Purpose of visit is required';

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please review the highlighted fields.',
      errors,
    });
  }

  try {
    const insertQuery = `
      INSERT INTO foreigners (
        user_id,
        first_name,
        middle_name,
        last_name,
        country,
        mobile_number,
        address,
        city,
        state,
        zip_code,
        indian_contact,
        passport_number,
        passport_details,
        visa_number,
        valid_from,
        valid_upto,
        purpose_of_visit,
        coming_from,
        going_to,
        photo_url,
        passport_photo_url,
        c_form_url,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW())
      RETURNING *;
    `;

    const values = [
      req.user.id,
      first_name.trim(),
      middle_name ? middle_name.trim() : null,
      last_name.trim(),
      country.trim(),
      mobile_number.trim(),
      address.trim(),
      city.trim(),
      state ? state.trim() : null,
      zip_code ? zip_code.trim() : null,
      indian_contact ? indian_contact.trim() : null,
      passport,
      passport, // mirror to passport_details
      visa_number.trim(),
      valid_from,
      valid_upto,
      purpose_of_visit.trim(),
      coming_from ? coming_from.trim() : null,
      going_to ? going_to.trim() : null,
      photo_url || null,
      passport_photo_url || null,
      c_form_url || null,
    ];

    const result = await db.query(insertQuery, values);
    const foreigner = result.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Foreigner registered successfully',
      foreigner,
    });
  } catch (error) {
    console.error('[Create Foreigner Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to register foreigner record due to server error.',
      error: error.message,
    });
  }
});

/**
 * 2. GET /api/foreigners
 * Retrieves all foreigner records for the authenticated establishment with optional search
 */
router.get('/', async (req, res) => {
  const { search } = req.query;

  try {
    let query;
    let values;

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = `
        SELECT * FROM foreigners
        WHERE user_id = $1 AND (
          first_name ILIKE $2 OR
          last_name ILIKE $2 OR
          country ILIKE $2 OR
          passport_number ILIKE $2 OR
          passport_details ILIKE $2 OR
          visa_number ILIKE $2
        )
        ORDER BY created_at DESC
      `;
      values = [req.user.id, term];
    } else {
      query = `
        SELECT * FROM foreigners
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      values = [req.user.id];
    }

    const result = await db.query(query, values);

    return res.status(200).json({
      success: true,
      foreigners: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('[Get Foreigners Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve foreigner records.',
      error: error.message,
    });
  }
});

/**
 * 3. GET /api/foreigners/:id
 * Retrieves a single foreigner record with ownership validation
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('SELECT * FROM foreigners WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Foreigner record not found',
      });
    }

    const foreigner = result.rows[0];

    if (foreigner.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this record.',
      });
    }

    return res.status(200).json({
      success: true,
      foreigner,
    });
  } catch (error) {
    console.error('[Get Foreigner by ID Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve foreigner record.',
      error: error.message,
    });
  }
});

/**
 * 4. PUT /api/foreigners/:id
 * Updates an existing foreigner record with ownership validation
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    first_name,
    middle_name,
    last_name,
    country,
    mobile_number,
    address,
    city,
    state,
    zip_code,
    indian_contact,
    passport_number,
    passport_details,
    visa_number,
    valid_from,
    valid_upto,
    purpose_of_visit,
    coming_from,
    going_to,
    photo_url,
    passport_photo_url,
    c_form_url,
  } = req.body;

  try {
    const existing = await db.query('SELECT * FROM foreigners WHERE id = $1', [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Foreigner record not found',
      });
    }

    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to update this record.',
      });
    }

    const passport = (passport_number || passport_details || existing.rows[0].passport_number || existing.rows[0].passport_details || '').trim();

    const updateQuery = `
      UPDATE foreigners SET
        first_name = COALESCE($1, first_name),
        middle_name = COALESCE($2, middle_name),
        last_name = COALESCE($3, last_name),
        country = COALESCE($4, country),
        mobile_number = COALESCE($5, mobile_number),
        address = COALESCE($6, address),
        city = COALESCE($7, city),
        state = COALESCE($8, state),
        zip_code = COALESCE($9, zip_code),
        indian_contact = COALESCE($10, indian_contact),
        passport_number = COALESCE($11, passport_number),
        passport_details = COALESCE($12, passport_details),
        visa_number = COALESCE($13, visa_number),
        valid_from = COALESCE($14, valid_from),
        valid_upto = COALESCE($15, valid_upto),
        purpose_of_visit = COALESCE($16, purpose_of_visit),
        coming_from = COALESCE($17, coming_from),
        going_to = COALESCE($18, going_to),
        photo_url = COALESCE($19, photo_url),
        passport_photo_url = COALESCE($20, passport_photo_url),
        c_form_url = COALESCE($21, c_form_url)
      WHERE id = $22 AND user_id = $23
      RETURNING *;
    `;

    const values = [
      first_name ? first_name.trim() : null,
      middle_name ? middle_name.trim() : null,
      last_name ? last_name.trim() : null,
      country ? country.trim() : null,
      mobile_number ? mobile_number.trim() : null,
      address ? address.trim() : null,
      city ? city.trim() : null,
      state ? state.trim() : null,
      zip_code ? zip_code.trim() : null,
      indian_contact ? indian_contact.trim() : null,
      passport || null,
      passport || null,
      visa_number ? visa_number.trim() : null,
      valid_from || null,
      valid_upto || null,
      purpose_of_visit ? purpose_of_visit.trim() : null,
      coming_from ? coming_from.trim() : null,
      going_to ? going_to.trim() : null,
      photo_url || null,
      passport_photo_url || null,
      c_form_url || null,
      id,
      req.user.id,
    ];

    const result = await db.query(updateQuery, values);

    return res.status(200).json({
      success: true,
      message: 'Foreigner record updated successfully',
      foreigner: result.rows[0],
    });
  } catch (error) {
    console.error('[Update Foreigner Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update foreigner record.',
      error: error.message,
    });
  }
});

/**
 * 5. DELETE /api/foreigners/:id
 * Deletes a foreigner record with ownership validation
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await db.query('SELECT * FROM foreigners WHERE id = $1', [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Foreigner record not found',
      });
    }

    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to delete this record.',
      });
    }

    await db.query('DELETE FROM foreigners WHERE id = $1 AND user_id = $2', [id, req.user.id]);

    return res.status(200).json({
      success: true,
      message: 'Foreigner record deleted successfully',
      id: parseInt(id, 10),
    });
  } catch (error) {
    console.error('[Delete Foreigner Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete foreigner record.',
      error: error.message,
    });
  }
});

module.exports = router;
