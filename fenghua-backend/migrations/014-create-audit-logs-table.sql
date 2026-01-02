-- Migration: Create audit_logs table
-- Description: Creates the audit_logs table for storing permission-related audit logs
-- Date: 2025-01-03
-- Story: 3.8

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  user_id UUID NOT NULL,
  operator_id UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,
  metadata JSONB
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operator_id ON audit_logs(operator_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_timestamp ON audit_logs(action, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operator_timestamp ON audit_logs(operator_id, timestamp DESC);

-- Revoke UPDATE and DELETE permissions (only allow INSERT)
-- Note: This ensures audit logs cannot be modified or deleted by regular users
-- Only database administrators can modify logs (for cleanup purposes)
REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC;

-- Add comments
COMMENT ON TABLE audit_logs IS 'Stores permission-related audit logs for compliance and security';
COMMENT ON COLUMN audit_logs.action IS 'Action type: ROLE_CHANGE, PERMISSION_VIOLATION, PERMISSION_VERIFICATION';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional metadata in JSONB format';
COMMENT ON COLUMN audit_logs.timestamp IS 'Timestamp when the audit event occurred';
COMMENT ON COLUMN audit_logs.operator_id IS 'ID of the user who performed the action';
COMMENT ON COLUMN audit_logs.user_id IS 'ID of the user affected by the action';

