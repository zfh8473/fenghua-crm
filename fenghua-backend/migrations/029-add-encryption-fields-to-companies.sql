-- Migration: Add encryption fields to companies table
-- Description: Adds encryption metadata fields to track which fields are encrypted and which key version was used
-- Date: 2026-01-13
-- Story: 9.3

-- Add encryption metadata fields
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS bank_account_encrypted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS id_number_encrypted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS encryption_key_version INTEGER;

-- Add comments
COMMENT ON COLUMN companies.bank_account_encrypted IS 'Flag indicating if bank_account field is encrypted';
COMMENT ON COLUMN companies.id_number_encrypted IS 'Flag indicating if id_number field is encrypted';
COMMENT ON COLUMN companies.encryption_key_version IS 'Version of encryption key used to encrypt sensitive fields (references encryption_keys.version)';

-- Note: These fields cannot have indexes because:
-- 1. They are boolean flags (low cardinality)
-- 2. Encryption key version is a foreign key reference but we don't enforce it at DB level
-- 3. Encrypted fields themselves cannot be indexed (encrypted data is not searchable)
