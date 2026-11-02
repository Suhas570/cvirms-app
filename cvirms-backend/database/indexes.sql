-- =============================================================================
-- CVIRMS Performance Optimization Indexes
-- Target Database: cvirms (PostgreSQL)
-- =============================================================================

-- Users table
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Guests table
CREATE INDEX IF NOT EXISTS idx_guests_user_id ON guests(user_id);
CREATE INDEX IF NOT EXISTS idx_guests_check_in ON guests(check_in_date DESC);
CREATE INDEX IF NOT EXISTS idx_guests_name ON guests(guest_name);
CREATE INDEX IF NOT EXISTS idx_guests_id_proof ON guests(id_proof_number);

-- Employees table
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);

-- Foreigners table
CREATE INDEX IF NOT EXISTS idx_foreigners_user_id ON foreigners(user_id);
CREATE INDEX IF NOT EXISTS idx_foreigners_passport ON foreigners(passport_details);

-- Notices table
CREATE INDEX IF NOT EXISTS idx_notices_archived ON notices(is_archived);
CREATE INDEX IF NOT EXISTS idx_notices_expiry ON notices(expiry_date);
