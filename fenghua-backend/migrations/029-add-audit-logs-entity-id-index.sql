-- Migration: Add entity_id index to audit_logs table
-- Description: Adds index on entity_id (resource_id) for efficient querying by resource
-- Date: 2026-01-12
-- Story: 9.1

-- Add index for entity_id (resource_id) to optimize queries filtering by specific resource
-- This index is useful for queries like "show all access logs for customer X" or "show all access logs for product Y"
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);

-- Create composite index for entity_type and entity_id (common query pattern)
-- This optimizes queries filtering by both resource type and resource ID
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);

-- Create composite index for entity_type, entity_id, and timestamp (for time-based queries on specific resources)
-- This optimizes queries like "show access logs for customer X in the last 30 days"
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_id_timestamp ON audit_logs(entity_type, entity_id, timestamp DESC);

-- Add comments
COMMENT ON INDEX idx_audit_logs_entity_id IS 'Optimizes queries filtering audit logs by specific resource ID';
COMMENT ON INDEX idx_audit_logs_entity_type_id IS 'Optimizes queries filtering audit logs by resource type and ID';
COMMENT ON INDEX idx_audit_logs_entity_type_id_timestamp IS 'Optimizes time-based queries on specific resources';
