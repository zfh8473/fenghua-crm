-- Migration: Add data access audit fields to audit_logs table
-- Description: Extends audit_logs table to support data access audit logging
-- Date: 2026-01-12
-- Story: 9.1

-- Add ip_address and user_agent columns for data access audit logging
-- These fields will be used to track who accessed what data from where
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Add index for ip_address (for security investigations)
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

-- Update table comment to reflect expanded scope
COMMENT ON TABLE audit_logs IS 'Stores audit logs for compliance and security, including permission operations and data access operations';
COMMENT ON COLUMN audit_logs.action IS 'Action type: ROLE_CHANGE, PERMISSION_VIOLATION, PERMISSION_VERIFICATION, DATA_ACCESS';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the user who performed the action (for data access audit)';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent string of the client (for data access audit)';

