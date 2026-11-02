const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

/**
 * Apply verifyToken and requireRole('police') to ALL routes in this file.
 * Strict RBAC: Any user without role='police' receives 403 Forbidden.
 */
router.use(verifyToken);
router.use(requireRole('police'));

/**
 * GET /api/police/stats
 * Global counts across categories:
 * - totalPgs: users where member_type='pg'
 * - totalHotels: users where member_type IN ('hotel', 'lodge')
 * - totalOrgs: users where member_type='organization'
 * - totalSocieties: users where member_type='housing_society'
 * - totalJewellery: users where member_type='jewellery'
 * - totalVisitors: count from guests
 */
router.get('/stats', async (req, res) => {
  try {
    const query = `
      SELECT 
        (SELECT COUNT(*)::int FROM users WHERE role = 'member' AND member_type = 'pg') AS total_pgs,
        (SELECT COUNT(*)::int FROM users WHERE role = 'member' AND member_type IN ('hotel', 'lodge')) AS total_hotels,
        (SELECT COUNT(*)::int FROM users WHERE role = 'member' AND member_type = 'organization') AS total_orgs,
        (SELECT COUNT(*)::int FROM users WHERE role = 'member' AND member_type = 'housing_society') AS total_societies,
        (SELECT COUNT(*)::int FROM users WHERE role = 'member' AND member_type = 'jewellery') AS total_jewellery,
        (SELECT COUNT(*)::int FROM guests) AS total_visitors;
    `;

    const result = await db.query(query);
    const row = result.rows[0] || {};

    return res.status(200).json({
      success: true,
      message: 'Police global statistics retrieved successfully',
      stats: {
        totalPgs: row.total_pgs || 0,
        totalHotels: row.total_hotels || 0,
        totalOrgs: row.total_orgs || 0,
        totalSocieties: row.total_societies || 0,
        totalJewellery: row.total_jewellery || 0,
        totalVisitors: row.total_visitors || 0,
      },
      officer: {
        id: req.user.id,
        user_id: req.user.user_id,
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error('[Police Stats Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch police statistics',
      error: error.message,
    });
  }
});

/**
 * GET /api/police/establishments
 * Returns all establishments (users where role='member') with total visitor count subquery
 */
router.get('/establishments', async (req, res) => {
  try {
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;
    const type = req.query.type ? req.query.type.trim().toLowerCase() : null;

    let query = `
      SELECT 
        u.id,
        u.name,
        u.member_type,
        u.owner_name,
        u.phone,
        u.city,
        u.district,
        u.address,
        u.police_station,
        u.is_verified,
        u.created_at,
        (SELECT COUNT(*)::int FROM guests g WHERE g.user_id = u.id) AS total_visitors
      FROM users u
      WHERE u.role = 'member'
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (type && type !== 'all') {
      if (type === 'hotel' || type === 'lodge') {
        query += ` AND u.member_type IN ('hotel', 'lodge')`;
      } else {
        query += ` AND u.member_type = $${paramIndex++}`;
        queryParams.push(type);
      }
    }

    if (search) {
      query += `
        AND (
          u.name ILIKE $${paramIndex} 
          OR u.owner_name ILIKE $${paramIndex} 
          OR u.phone ILIKE $${paramIndex} 
          OR u.city ILIKE $${paramIndex} 
          OR u.district ILIKE $${paramIndex}
          OR u.member_type::text ILIKE $${paramIndex}
        )
      `;
      queryParams.push(search);
      paramIndex++;
    }

    query += ` ORDER BY u.created_at DESC;`;

    const result = await db.query(query, queryParams);

    return res.status(200).json({
      success: true,
      message: 'Establishments directory retrieved successfully',
      establishments: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('[Police Establishments Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch establishments directory',
      error: error.message,
    });
  }
});

/**
 * 1. GET /api/police/search-visitors
 * Accepts query params: q (search string), id_type, vehicle, limit (default 100)
 * Joins guests with users to return comprehensive visitor details and host establishment info.
 */
router.get('/search-visitors', async (req, res) => {
  try {
    const { q, id_type, vehicle, limit } = req.query;
    const parsedLimit = parseInt(limit, 10);
    const limitValue = !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 100;

    let query = `
      SELECT 
        g.id,
        g.guest_name,
        g.contact_number,
        g.id_proof_type,
        g.id_proof_number,
        g.room_number,
        g.check_in_date,
        g.check_out_date,
        g.status,
        g.vehicle_registration,
        g.vehicle_type,
        g.vehicle_make_model,
        u.id AS hotel_id,
        u.name AS hotel_name,
        u.member_type AS hotel_type,
        u.district,
        u.taluka,
        u.police_station
      FROM guests g
      LEFT JOIN users u ON g.user_id = u.id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (q && q.trim()) {
      query += ` AND (g.guest_name ILIKE $${paramIndex} OR g.contact_number ILIKE $${paramIndex} OR g.id_proof_number ILIKE $${paramIndex} OR g.vehicle_registration ILIKE $${paramIndex})`;
      queryParams.push(`%${q.trim()}%`);
      paramIndex++;
    }

    if (id_type && id_type.trim() && id_type.trim().toLowerCase() !== 'all') {
      query += ` AND g.id_proof_type ILIKE $${paramIndex}`;
      queryParams.push(`%${id_type.trim()}%`);
      paramIndex++;
    }

    if (vehicle && vehicle.trim()) {
      query += ` AND g.vehicle_registration ILIKE $${paramIndex}`;
      queryParams.push(`%${vehicle.trim()}%`);
      paramIndex++;
    }

    query += ` ORDER BY g.check_in_date DESC NULLS LAST, g.created_at DESC LIMIT $${paramIndex};`;
    queryParams.push(limitValue);

    const result = await db.query(query, queryParams);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      visitors: result.rows,
    });
  } catch (error) {
    console.error('[Police Search Visitors Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to search visitors',
      error: error.message,
    });
  }
});

/**
 * 2. GET /api/police/search-establishments
 * Accepts query params: q (name/owner/phone/user_id/username), district, taluka, type (member_type)
 * Includes subquery for total_visitors.
 */
router.get('/search-establishments', async (req, res) => {
  try {
    const { q, district, taluka, type } = req.query;

    let query = `
      SELECT 
        u.id,
        u.name,
        u.member_type,
        u.owner_name,
        u.phone,
        u.district,
        u.taluka,
        u.police_station,
        u.city,
        u.address,
        u.is_verified,
        (SELECT COUNT(*)::int FROM guests g WHERE g.user_id = u.id) AS total_visitors
      FROM users u
      WHERE u.role = 'member'
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (q && q.trim()) {
      query += ` AND (u.name ILIKE $${paramIndex} OR u.owner_name ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex} OR u.user_id ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`;
      queryParams.push(`%${q.trim()}%`);
      paramIndex++;
    }

    if (district && district.trim() && district.trim().toLowerCase() !== 'all') {
      query += ` AND u.district ILIKE $${paramIndex}`;
      queryParams.push(`%${district.trim()}%`);
      paramIndex++;
    }

    if (taluka && taluka.trim() && taluka.trim().toLowerCase() !== 'all') {
      query += ` AND u.taluka ILIKE $${paramIndex}`;
      queryParams.push(`%${taluka.trim()}%`);
      paramIndex++;
    }

    if (type && type.trim() && type.trim().toLowerCase() !== 'all') {
      query += ` AND u.member_type = $${paramIndex}`;
      queryParams.push(type.trim().toLowerCase());
      paramIndex++;
    }

    query += ` ORDER BY u.name ASC;`;

    const result = await db.query(query, queryParams);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      establishments: result.rows,
    });
  } catch (error) {
    console.error('[Police Search Establishments Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to search establishments',
      error: error.message,
    });
  }
});

/**
 * 3. GET /api/police/stations
 * Summary of registrations grouped by taluka, police station, and member type,
 * plus distinct district/taluka combinations for geo filtering.
 */
router.get('/stations', async (req, res) => {
  try {
    const stationsQuery = `
      SELECT 
        COALESCE(taluka, 'Unassigned') AS taluka,
        COALESCE(police_station, 'Unassigned PS') AS police_station,
        member_type,
        COUNT(id)::int AS registrations
      FROM users 
      WHERE role = 'member' 
      GROUP BY taluka, police_station, member_type 
      ORDER BY taluka, police_station, member_type;
    `;

    const geoQuery = `
      SELECT DISTINCT district, taluka 
      FROM users 
      WHERE role = 'member' AND district IS NOT NULL;
    `;

    const [stationsResult, geoResult] = await Promise.all([
      db.query(stationsQuery),
      db.query(geoQuery),
    ]);

    return res.status(200).json({
      success: true,
      count: stationsResult.rows.length,
      stations: stationsResult.rows,
      geoOptions: geoResult.rows,
    });
  } catch (error) {
    console.error('[Police Stations Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch police stations summary',
      error: error.message,
    });
  }
});

/**
 * 4. POST /api/police/flags
 * Accepts body: { suspect_name, mobile, aadhaar, pan, dl, vehicle_number, remark }
 * Validates that suspect_name is provided (trimmed).
 * Inserts into police_flags with status = 'ACTIVE' and created_by = req.user.id.
 * Returns: { success: true, message: 'Flag added successfully', flag: result.rows[0] }
 */
router.post('/flags', async (req, res) => {
  try {
    const { suspect_name, mobile, aadhaar, pan, dl, vehicle_number, remark } = req.body;

    if (!suspect_name || typeof suspect_name !== 'string' || !suspect_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Suspect name is required',
      });
    }

    const trimmedName = suspect_name.trim();
    const cleanMobile = mobile && String(mobile).trim() ? String(mobile).trim() : null;
    const cleanAadhaar = aadhaar && String(aadhaar).trim() ? String(aadhaar).trim() : null;
    const cleanPan = pan && String(pan).trim() ? String(pan).trim() : null;
    const cleanDl = dl && String(dl).trim() ? String(dl).trim() : null;
    const cleanVehicle = vehicle_number && String(vehicle_number).trim() ? String(vehicle_number).trim() : null;
    const cleanRemark = remark && String(remark).trim() ? String(remark).trim() : null;

    const insertQuery = `
      INSERT INTO police_flags (
        suspect_name,
        mobile,
        aadhaar,
        pan,
        dl,
        vehicle_number,
        remark,
        status,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', $8)
      RETURNING *;
    `;

    const result = await db.query(insertQuery, [
      trimmedName,
      cleanMobile,
      cleanAadhaar,
      cleanPan,
      cleanDl,
      cleanVehicle,
      cleanRemark,
      req.user.id,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Flag added successfully',
      flag: result.rows[0],
    });
  } catch (error) {
    console.error('[Police Create Flag Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to add flag',
      error: error.message,
    });
  }
});

/**
 * 5. GET /api/police/flags
 * Returns all flags created by this officer (WHERE (f.created_by = $1 OR $2 = 'super_admin')), ordered by f.created_at DESC.
 * Joins users u ON f.created_by = u.id to include officer name (u.name AS officer_name).
 * Returns: { success: true, count: result.rows.length, flags: result.rows }
 */
router.get('/flags', async (req, res) => {
  try {
    const query = `
      SELECT 
        f.*,
        u.name AS officer_name
      FROM police_flags f
      LEFT JOIN users u ON f.created_by = u.id
      WHERE (f.created_by = $1 OR $2 = 'super_admin')
      ORDER BY f.created_at DESC;
    `;

    const result = await db.query(query, [req.user.id, req.user.role]);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      flags: result.rows,
    });
  } catch (error) {
    console.error('[Police Get Flags Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch flags',
      error: error.message,
    });
  }
});

/**
 * 6. PUT /api/police/flags/:id/close
 * Updates police_flags setting status = 'CLOSED' where id = $1 and (created_by = $2 OR $3 = 'super_admin').
 * If not found or already closed: returns appropriate response.
 * Returns: { success: true, message: 'Flag closed successfully', flag: result.rows[0] }
 */
router.put('/flags/:id/close', async (req, res) => {
  try {
    const flagId = req.params.id;

    // Verify flag exists and officer has permission
    const checkQuery = `
      SELECT * FROM police_flags
      WHERE id = $1 AND (created_by = $2 OR $3 = 'super_admin');
    `;
    const checkResult = await db.query(checkQuery, [flagId, req.user.id, req.user.role]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Flag not found or unauthorized',
      });
    }

    const existingFlag = checkResult.rows[0];
    if (existingFlag.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        message: 'Flag is already closed',
        flag: existingFlag,
      });
    }

    const updateQuery = `
      UPDATE police_flags
      SET status = 'CLOSED'
      WHERE id = $1 AND (created_by = $2 OR $3 = 'super_admin')
      RETURNING *;
    `;
    const updateResult = await db.query(updateQuery, [flagId, req.user.id, req.user.role]);

    return res.status(200).json({
      success: true,
      message: 'Flag closed successfully',
      flag: updateResult.rows[0],
    });
  } catch (error) {
    console.error('[Police Close Flag Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to close flag',
      error: error.message,
    });
  }
});

/**
 * 7. GET /api/police/alerts
 * Critical Alert Query:
 * Joins police_flags f with guests g and users u ON g.user_id = u.id.
 * Matches ANY active flag (f.status = 'ACTIVE') where:
 * - Mobile match
 * - Aadhaar match (ignoring spaces)
 * - Vehicle match (ignoring spaces)
 * - PAN match
 * - DL match
 * Ordered by g.check_in_date DESC NULLS LAST, f.created_at DESC.
 * Returns: { success: true, count: result.rows.length, alerts: result.rows }
 */
router.get('/alerts', async (req, res) => {
  try {
    const query = `
      SELECT 
        g.id AS guest_id,
        g.guest_name,
        g.contact_number AS guest_mobile,
        g.id_proof_type,
        g.id_proof_number AS guest_id_proof,
        g.vehicle_registration AS guest_vehicle,
        g.room_number,
        g.check_in_date,
        g.status AS guest_status,
        u.id AS hotel_id,
        u.name AS hotel_name,
        u.member_type AS hotel_type,
        u.city AS hotel_city,
        u.district AS hotel_district,
        u.taluka AS hotel_taluka,
        u.police_station AS hotel_police_station,
        u.address AS hotel_address,
        f.id AS flag_id,
        f.suspect_name,
        f.mobile AS flag_mobile,
        f.aadhaar AS flag_aadhaar,
        f.pan AS flag_pan,
        f.dl AS flag_dl,
        f.vehicle_number AS flag_vehicle,
        f.remark AS flag_remark,
        f.created_at AS flag_created_at,
        COALESCE(
          NULLIF(
            CONCAT_WS(
              ', ',
              CASE 
                WHEN (f.mobile IS NOT NULL AND f.mobile != '' AND (g.contact_number ILIKE '%' || f.mobile || '%' OR f.mobile ILIKE '%' || g.contact_number || '%')) 
                THEN 'Mobile Match' 
              END,
              CASE 
                WHEN (f.aadhaar IS NOT NULL AND f.aadhaar != '' AND (REPLACE(g.id_proof_number, ' ', '') ILIKE '%' || REPLACE(f.aadhaar, ' ', '') || '%' OR REPLACE(f.aadhaar, ' ', '') ILIKE '%' || REPLACE(g.id_proof_number, ' ', '') || '%')) 
                THEN 'Aadhaar Match' 
              END,
              CASE 
                WHEN (f.vehicle_number IS NOT NULL AND f.vehicle_number != '' AND (REPLACE(g.vehicle_registration, ' ', '') ILIKE '%' || REPLACE(f.vehicle_number, ' ', '') || '%' OR REPLACE(f.vehicle_number, ' ', '') ILIKE '%' || REPLACE(g.vehicle_registration, ' ', '') || '%')) 
                THEN 'Vehicle Match' 
              END,
              CASE 
                WHEN (f.pan IS NOT NULL AND f.pan != '' AND g.id_proof_number ILIKE '%' || f.pan || '%') 
                THEN 'PAN Match' 
              END,
              CASE 
                WHEN (f.dl IS NOT NULL AND f.dl != '' AND g.id_proof_number ILIKE '%' || f.dl || '%') 
                THEN 'DL Match' 
              END
            ),
            ''
          ),
          'Suspect Match'
        ) AS match_reason
      FROM police_flags f
      JOIN guests g ON (
        (f.mobile IS NOT NULL AND f.mobile != '' AND (g.contact_number ILIKE '%' || f.mobile || '%' OR f.mobile ILIKE '%' || g.contact_number || '%'))
        OR (f.aadhaar IS NOT NULL AND f.aadhaar != '' AND (REPLACE(g.id_proof_number, ' ', '') ILIKE '%' || REPLACE(f.aadhaar, ' ', '') || '%' OR REPLACE(f.aadhaar, ' ', '') ILIKE '%' || REPLACE(g.id_proof_number, ' ', '') || '%'))
        OR (f.vehicle_number IS NOT NULL AND f.vehicle_number != '' AND (REPLACE(g.vehicle_registration, ' ', '') ILIKE '%' || REPLACE(f.vehicle_number, ' ', '') || '%' OR REPLACE(f.vehicle_number, ' ', '') ILIKE '%' || REPLACE(g.vehicle_registration, ' ', '') || '%'))
        OR (f.pan IS NOT NULL AND f.pan != '' AND g.id_proof_number ILIKE '%' || f.pan || '%')
        OR (f.dl IS NOT NULL AND f.dl != '' AND g.id_proof_number ILIKE '%' || f.dl || '%')
      )
      LEFT JOIN users u ON g.user_id = u.id
      WHERE f.status = 'ACTIVE'
      ORDER BY g.check_in_date DESC NULLS LAST, f.created_at DESC;
    `;

    const result = await db.query(query);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      alerts: result.rows,
    });
  } catch (error) {
    console.error('[Police Alerts Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch police alerts',
      error: error.message,
    });
  }
});

module.exports = router;
