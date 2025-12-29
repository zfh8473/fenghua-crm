-- Migration: Seed default roles
-- Description: Inserts default roles into the roles table
-- Date: 2025-12-26
-- Story: 16.1, 16.3

-- Insert default roles
INSERT INTO roles (name, description, created_at, updated_at) VALUES
  ('ADMIN', 'Administrator - Full system access and user management', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('DIRECTOR', 'Director - Access to all data but cannot manage users', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('FRONTEND_SPECIALIST', 'Frontend Specialist - Access to buyer (采购商) data only', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('BACKEND_SPECIALIST', 'Backend Specialist - Access to supplier (供应商) data only', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- Add comment
COMMENT ON TABLE roles IS 'Default roles: ADMIN, DIRECTOR, FRONTEND_SPECIALIST, BACKEND_SPECIALIST';

