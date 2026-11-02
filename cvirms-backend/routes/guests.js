const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * All routes require authentication
 */
router.use(verifyToken);

/**
 * 1. POST /api/guests
 * Registers a new tenant/guest for the authenticated establishment
 */
router.post('/', async (req, res) => {
  const {
    first_name,
    middle_name,
    last_name,
    contact_number,
    number_of_guests,
    id_proof_type,
    id_proof_number,
    room_number,
    check_in_date,
    check_out_date,
    purpose_of_visit,
    customer_sub_type,
    item_description,
    item_weight,
    item_purity,
    item_amount,
    loan_amount,
    pledge_duration_days,
    vehicle_type,
    vehicle_registration,
    vehicle_make_model,
  } = req.body;

  // Resolve establishment member_type
  let memberType = req.user && req.user.member_type;
  if (!memberType) {
    try {
      const u = await db.query('SELECT member_type FROM users WHERE id = $1', [req.user.id]);
      memberType = u.rows[0]?.member_type;
    } catch {}
  }
  memberType = (memberType || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  const isSpecialEstablishment = memberType === 'jewellery' || memberType === 'vehicle_dealer';

  // Field-level validation
  const errors = {};
  if (!first_name || !first_name.trim()) errors.first_name = 'First name is required';
  if (!last_name || !last_name.trim()) errors.last_name = 'Last name is required';
  if (!contact_number || !contact_number.trim()) {
    errors.contact_number = 'Contact number is required';
  } else if (!/^[0-9+\s-]{10,15}$/.test(contact_number.trim())) {
    errors.contact_number = 'Contact number must be 10 digits';
  }
  if (!id_proof_type || !id_proof_type.trim()) errors.id_proof_type = 'ID proof type is required';
  if (!id_proof_number || !id_proof_number.trim()) errors.id_proof_number = 'ID proof number is required';
  if (!isSpecialEstablishment && (!room_number || !room_number.trim())) {
    errors.room_number = 'Room number is required';
  }
  if (!check_in_date) errors.check_in_date = 'Check-in date is required';

  // Sub-type validations per establishment type
  if (memberType === 'jewellery') {
    if (!customer_sub_type || !['seller', 'pledger'].includes(customer_sub_type.toLowerCase())) {
      errors.customer_sub_type = 'Customer sub-type must be either seller or pledger';
    }
  } else if (memberType === 'vehicle_dealer') {
    if (!customer_sub_type || !['buyer', 'seller'].includes(customer_sub_type.toLowerCase())) {
      errors.customer_sub_type = 'Customer sub-type must be either buyer or seller';
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please review the highlighted fields.',
      errors,
    });
  }

  const guest_name = [first_name.trim(), (middle_name || '').trim(), last_name.trim()]
    .filter(Boolean)
    .join(' ');

  const guestCount = parseInt(number_of_guests, 10) || 1;
  const checkIn = new Date(check_in_date);
  const checkOut = check_out_date ? new Date(check_out_date) : null;
  const finalRoomNumber = room_number && room_number.trim()
    ? room_number.trim()
    : (isSpecialEstablishment ? 'Counter 1' : '101');

  try {
    const insertQuery = `
      INSERT INTO guests (
        user_id,
        guest_name,
        contact_number,
        number_of_guests,
        id_proof_type,
        id_proof_number,
        room_number,
        check_in_date,
        check_out_date,
        purpose_of_visit,
        customer_sub_type,
        item_description,
        item_weight,
        item_purity,
        item_amount,
        loan_amount,
        pledge_duration_days,
        vehicle_type,
        vehicle_registration,
        vehicle_make_model,
        qr_code_string,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        NULL, NOW()
      )
      RETURNING *;
    `;

    const values = [
      req.user.id,
      guest_name,
      contact_number.trim(),
      guestCount,
      id_proof_type.trim(),
      id_proof_number.trim(),
      finalRoomNumber,
      checkIn,
      checkOut,
      purpose_of_visit ? purpose_of_visit.trim() : null,
      customer_sub_type ? customer_sub_type.toLowerCase().trim() : null,
      item_description ? item_description.trim() : null,
      item_weight ? parseFloat(item_weight) : null,
      item_purity ? item_purity.trim() : null,
      item_amount ? parseFloat(item_amount) : null,
      loan_amount ? parseFloat(loan_amount) : null,
      pledge_duration_days ? parseInt(pledge_duration_days, 10) : null,
      vehicle_type ? vehicle_type.trim() : null,
      vehicle_registration ? vehicle_registration.trim().toUpperCase() : null,
      vehicle_make_model ? vehicle_make_model.trim() : null,
    ];

    const result = await db.query(insertQuery, values);
    const guest = result.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Guest registered successfully',
      guest,
    });
  } catch (error) {
    console.error('[Create Guest Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to register guest due to server error.',
      error: error.message,
    });
  }
});

/**
 * 2. GET /api/guests
 * Retrieves guest list for authenticated establishment with optional search
 */
router.get('/', async (req, res) => {
  const { search } = req.query;

  try {
    let query;
    let values;

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = `
        SELECT * FROM guests
        WHERE user_id = $1 AND (guest_name ILIKE $2 OR id_proof_number ILIKE $2 OR room_number ILIKE $2)
        ORDER BY created_at DESC
      `;
      values = [req.user.id, term];
    } else {
      query = `
        SELECT * FROM guests
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      values = [req.user.id];
    }

    const result = await db.query(query, values);

    return res.status(200).json({
      success: true,
      guests: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('[Get Guests Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve guests.',
      error: error.message,
    });
  }
});

/**
 * 3. GET /api/guests/:id
 * Retrieves single guest with ownership validation
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('SELECT * FROM guests WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Guest record not found',
      });
    }

    const guest = result.rows[0];

    if (guest.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this guest record.',
      });
    }

    return res.status(200).json({
      success: true,
      guest,
    });
  } catch (error) {
    console.error('[Get Guest by ID Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve guest record.',
      error: error.message,
    });
  }
});

/**
 * 4. PUT /api/guests/:id
 * Updates an existing guest with ownership validation
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    guest_name,
    first_name,
    middle_name,
    last_name,
    contact_number,
    number_of_guests,
    id_proof_type,
    id_proof_number,
    room_number,
    check_in_date,
    check_out_date,
    purpose_of_visit,
    qr_code_string,
  } = req.body;

  try {
    const existing = await db.query('SELECT * FROM guests WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Guest record not found',
      });
    }

    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to update this guest record.',
      });
    }

    let resolvedName = guest_name;
    if (!resolvedName && (first_name || last_name)) {
      resolvedName = [first_name, middle_name, last_name].filter(Boolean).join(' ').trim();
    }
    if (!resolvedName) {
      resolvedName = existing.rows[0].guest_name;
    }

    const updateQuery = `
      UPDATE guests
      SET
        guest_name = COALESCE($1, guest_name),
        contact_number = COALESCE($2, contact_number),
        number_of_guests = COALESCE($3, number_of_guests),
        id_proof_type = COALESCE($4, id_proof_type),
        id_proof_number = COALESCE($5, id_proof_number),
        room_number = COALESCE($6, room_number),
        check_in_date = COALESCE($7, check_in_date),
        check_out_date = $8,
        purpose_of_visit = COALESCE($9, purpose_of_visit),
        qr_code_string = COALESCE($10, qr_code_string)
      WHERE id = $11 AND user_id = $12
      RETURNING *;
    `;

    const values = [
      resolvedName,
      contact_number || existing.rows[0].contact_number,
      number_of_guests ? parseInt(number_of_guests, 10) : existing.rows[0].number_of_guests,
      id_proof_type || existing.rows[0].id_proof_type,
      id_proof_number || existing.rows[0].id_proof_number,
      room_number || existing.rows[0].room_number,
      check_in_date ? new Date(check_in_date) : existing.rows[0].check_in_date,
      check_out_date !== undefined ? (check_out_date ? new Date(check_out_date) : null) : existing.rows[0].check_out_date,
      purpose_of_visit || existing.rows[0].purpose_of_visit,
      qr_code_string !== undefined ? qr_code_string : existing.rows[0].qr_code_string,
      id,
      req.user.id,
    ];

    const result = await db.query(updateQuery, values);

    return res.status(200).json({
      success: true,
      message: 'Guest record updated successfully',
      guest: result.rows[0],
    });
  } catch (error) {
    console.error('[Update Guest Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update guest record.',
      error: error.message,
    });
  }
});

/**
 * 5. DELETE /api/guests/:id
 * Deletes a guest record with ownership validation
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await db.query('SELECT * FROM guests WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Guest record not found',
      });
    }

    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to delete this guest record.',
      });
    }

    await db.query('DELETE FROM guests WHERE id = $1 AND user_id = $2', [id, req.user.id]);

    return res.status(200).json({
      success: true,
      message: 'Guest record deleted successfully',
      id: parseInt(id, 10),
    });
  } catch (error) {
    console.error('[Delete Guest Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete guest record.',
      error: error.message,
    });
  }
});

module.exports = router;
