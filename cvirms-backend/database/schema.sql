-- =============================================================================
-- CVIRMS (City Visitor Information & Record Management System) Database Schema
-- Version: 2.0 (Day 2 Milestone)
-- Database Target: PostgreSQL 14+
-- =============================================================================

-- Ensure custom ENUM types exist without throwing error if re-executed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('member', 'police', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_type') THEN
        CREATE TYPE member_type AS ENUM ('hotel', 'pg', 'petrol_bunk', 'hostel', 'other');
    END IF;
END $$;

-- 1. USERS TABLE (Establishments, Law Enforcement Officers, Administrators)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE,
    user_id VARCHAR(50) UNIQUE,
    role user_role NOT NULL DEFAULT 'member',
    member_type member_type DEFAULT 'other',
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 2. GUESTS TABLE (Hotel, PG, Hostel visitor records with QR verification)
CREATE TABLE IF NOT EXISTS guests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    guest_name VARCHAR(255) NOT NULL,
    id_proof_type VARCHAR(100) NOT NULL,
    id_proof_number VARCHAR(100) NOT NULL,
    room_number VARCHAR(50),
    check_in_date TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out_date TIMESTAMP WITH TIME ZONE,
    qr_code_string TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. EMPLOYEES TABLE (Staff verification and biometric/identity profiling)
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50) NOT NULL,
    alternate_contact VARCHAR(50),
    gender VARCHAR(20),
    address TEXT,
    pincode VARCHAR(20),
    document_type VARCHAR(100),
    document_id VARCHAR(100),
    photo_url TEXT,
    check_in_time VARCHAR(50),
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. FOREIGNERS TABLE (International visitors compliance, passport, visa monitoring)
CREATE TABLE IF NOT EXISTS foreigners (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100) NOT NULL,
    mobile_number VARCHAR(50),
    indian_contact VARCHAR(50),
    passport_details VARCHAR(255),
    visa_number VARCHAR(100),
    valid_from DATE,
    valid_upto DATE,
    purpose_of_visit TEXT,
    coming_from VARCHAR(255),
    going_to VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. NOTICES TABLE (Police alerts, regulatory circulars, and departmental broadcasts)
CREATE TABLE IF NOT EXISTS notices (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    date_posted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE,
    is_archived BOOLEAN DEFAULT FALSE
);

-- Indices for rapid querying and foreign key optimization
CREATE INDEX IF NOT EXISTS idx_guests_user_id ON guests(user_id);
CREATE INDEX IF NOT EXISTS idx_guests_check_in ON guests(check_in_date);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_foreigners_user_id ON foreigners(user_id);
CREATE INDEX IF NOT EXISTS idx_foreigners_country ON foreigners(country);
CREATE INDEX IF NOT EXISTS idx_notices_date ON notices(date_posted);
