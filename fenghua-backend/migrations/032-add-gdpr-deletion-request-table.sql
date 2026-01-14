-- Migration: Create gdpr_deletion_requests table
-- Description: Stores GDPR data deletion requests for compliance with data subject rights (Article 17 - Right to be forgotten)
-- Date: 2026-01-14
-- Story: 9.6

-- Create gdpr_deletion_requests table
CREATE TABLE IF NOT EXISTS gdpr_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL DEFAULT 'GDPR_DELETION',
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  deletion_summary JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Check constraints
  CONSTRAINT gdpr_deletion_requests_status_check CHECK (status IN ('PENDING', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIALLY_COMPLETED')),
  CONSTRAINT gdpr_deletion_requests_request_type_check CHECK (request_type = 'GDPR_DELETION')
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_gdpr_deletion_requests_user_id ON gdpr_deletion_requests(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_gdpr_deletion_requests_status ON gdpr_deletion_requests(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_gdpr_deletion_requests_requested_at ON gdpr_deletion_requests(requested_at DESC) WHERE deleted_at IS NULL;

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_gdpr_deletion_requests_user_status ON gdpr_deletion_requests(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_gdpr_deletion_requests_user_requested_at ON gdpr_deletion_requests(user_id, requested_at DESC) WHERE deleted_at IS NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gdpr_deletion_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_gdpr_deletion_requests_updated_at
  BEFORE UPDATE ON gdpr_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_gdpr_deletion_requests_updated_at();

-- Add comments
COMMENT ON TABLE gdpr_deletion_requests IS 'Stores GDPR data deletion requests for compliance with data subject rights (Article 17 - Right to be forgotten)';
COMMENT ON COLUMN gdpr_deletion_requests.request_type IS 'Type of request: GDPR_DELETION';
COMMENT ON COLUMN gdpr_deletion_requests.status IS 'Request status: PENDING, QUEUED, PROCESSING, COMPLETED, FAILED, PARTIALLY_COMPLETED';
COMMENT ON COLUMN gdpr_deletion_requests.deletion_summary IS 'Deletion result summary in JSONB format (deleted count, anonymized count, statistics by data type)';
COMMENT ON COLUMN gdpr_deletion_requests.metadata IS 'Additional metadata in JSONB format (deletion configuration, error details, etc.)';
