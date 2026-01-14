-- Migration: Create encryption_keys table
-- Description: Creates table for storing encryption keys with version management
-- Date: 2026-01-13
-- Story: 9.3

-- Create encryption_keys table
CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL UNIQUE,
  key_data TEXT NOT NULL, -- Base64 encoded key (may be encrypted if using database-encrypted method)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  rotated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_encryption_keys_version ON encryption_keys(version);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_active ON encryption_keys(is_active) WHERE is_active = true;

-- Add comments
COMMENT ON TABLE encryption_keys IS 'Encryption keys table for sensitive data encryption (AES-256-GCM)';
COMMENT ON COLUMN encryption_keys.version IS 'Key version number (increments on rotation)';
COMMENT ON COLUMN encryption_keys.key_data IS 'Base64 encoded key (encrypted if using database-encrypted storage method)';
COMMENT ON COLUMN encryption_keys.is_active IS 'Whether this key can be used for encrypting new data (old keys remain for decryption)';
COMMENT ON COLUMN encryption_keys.rotated_at IS 'Timestamp when this key was rotated (deactivated)';
