const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * All routes require authentication
 */
router.use(verifyToken);

/**
 * 1. POST /api/employees
 * Registers a new staff member / employee for the authenticated establishment
 */
router.post('/', async (req, res) => {
  const {
    full_name,
    contact_number,
    alternate_contact,
    gender,
    address,
    pincode,
    document_type,
    document_id,
    photo_url,
    check_in_time,
    remark,
  } = req.body;

  // Field-level validation
  const errors = {};
  if (!full_name || !full_name.trim()) {
    errors.full_name = 'Full name is required';
  }

  if (!contact_number || !contact_number.trim()) {
    errors.contact_number = 'Contact number is required';
  } else {
    const digitsOnly = contact_number.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      errors.contact_number = 'Contact number must be 10 digits';
    }
  }

  if (!gender || !gender.trim()) {
    errors.gender = 'Gender is required';
  }

  if (!address || !address.trim()) {
    errors.address = 'Address is required';
  }

  if (!pincode || !pincode.trim()) {
    errors.pincode = 'Pincode is required';
  } else if (!/^\d{6}$/.test(pincode.trim())) {
    errors.pincode = 'Pincode must be 6 digits';
  }

  if (!document_type || !document_type.trim()) {
    errors.document_type = 'Document type is required';
  }

  if (!document_id || !document_id.trim()) {
    errors.document_id = 'Document ID is required';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please review the highlighted fields.',
      errors,
    });
  }

  try {
    const insertQuery = `
      INSERT INTO employees (
        user_id,
        full_name,
        contact_number,
        alternate_contact,
        gender,
        address,
        pincode,
        document_type,
        document_id,
        photo_url,
        check_in_time,
        remark,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING *;
    `;

    const values = [
      req.user.id,
      full_name.trim(),
      contact_number.trim(),
      alternate_contact ? alternate_contact.trim() : null,
      gender.trim(),
      address.trim(),
      pincode.trim(),
      document_type.trim(),
      document_id.trim(),
      photo_url || null, // Mocked upload URL e.g. "mock://uploaded-file.jpg"
      check_in_time ? check_in_time.trim() : null,
      remark ? remark.trim() : null,
    ];

    const result = await db.query(insertQuery, values);
    const employee = result.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      employee,
    });
  } catch (error) {
    console.error('[Create Employee Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to register employee due to server error.',
      error: error.message,
    });
  }
});

/**
 * 2. GET /api/employees
 * Retrieves employee list for authenticated establishment with optional search
 */
router.get('/', async (req, res) => {
  const { search } = req.query;

  try {
    let query;
    let values;

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = `
        SELECT * FROM employees
        WHERE user_id = $1 AND (full_name ILIKE $2 OR contact_number ILIKE $2 OR document_id ILIKE $2)
        ORDER BY created_at DESC
      `;
      values = [req.user.id, term];
    } else {
      query = `
        SELECT * FROM employees
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      values = [req.user.id];
    }

    const result = await db.query(query, values);

    return res.status(200).json({
      success: true,
      employees: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('[Get Employees Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employees.',
      error: error.message,
    });
  }
});

/**
 * 3. GET /api/employees/:id
 * Retrieves single employee with ownership validation
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('SELECT * FROM employees WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found',
      });
    }

    const employee = result.rows[0];

    if (employee.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this employee record.',
      });
    }

    return res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    console.error('[Get Employee by ID Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee record.',
      error: error.message,
    });
  }
});

/**
 * 4. PUT /api/employees/:id
 * Updates an existing employee with ownership validation
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    full_name,
    contact_number,
    alternate_contact,
    gender,
    address,
    pincode,
    document_type,
    document_id,
    photo_url,
    check_in_time,
    remark,
  } = req.body;

  try {
    const existing = await db.query('SELECT * FROM employees WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found',
      });
    }

    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to update this employee record.',
      });
    }

    const updateQuery = `
      UPDATE employees
      SET
        full_name = COALESCE($1, full_name),
        contact_number = COALESCE($2, contact_number),
        alternate_contact = COALESCE($3, alternate_contact),
        gender = COALESCE($4, gender),
        address = COALESCE($5, address),
        pincode = COALESCE($6, pincode),
        document_type = COALESCE($7, document_type),
        document_id = COALESCE($8, document_id),
        photo_url = COALESCE($9, photo_url),
        check_in_time = COALESCE($10, check_in_time),
        remark = COALESCE($11, remark)
      WHERE id = $12 AND user_id = $13
      RETURNING *;
    `;

    const values = [
      full_name ? full_name.trim() : null,
      contact_number ? contact_number.trim() : null,
      alternate_contact ? alternate_contact.trim() : null,
      gender ? gender.trim() : null,
      address ? address.trim() : null,
      pincode ? pincode.trim() : null,
      document_type ? document_type.trim() : null,
      document_id ? document_id.trim() : null,
      photo_url || null,
      check_in_time || null,
      remark || null,
      id,
      req.user.id,
    ];

    const result = await db.query(updateQuery, values);

    return res.status(200).json({
      success: true,
      message: 'Employee record updated successfully',
      employee: result.rows[0],
    });
  } catch (error) {
    console.error('[Update Employee Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update employee record.',
      error: error.message,
    });
  }
});

/**
 * 5. DELETE /api/employees/:id
 * Deletes an employee record with ownership validation
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await db.query('SELECT * FROM employees WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found',
      });
    }

    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to delete this employee record.',
      });
    }

    await db.query('DELETE FROM employees WHERE id = $1 AND user_id = $2', [id, req.user.id]);

    return res.status(200).json({
      success: true,
      message: 'Employee record deleted successfully',
      id: parseInt(id, 10),
    });
  } catch (error) {
    console.error('[Delete Employee Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete employee record.',
      error: error.message,
    });
  }
});

module.exports = router;
