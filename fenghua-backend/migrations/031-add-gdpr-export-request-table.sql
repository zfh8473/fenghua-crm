-- Migration: Create gdpr_export_requests table
-- Description: Stores GDPR data export requests for compliance with data subject rights
-- Date: 2026-01-13
-- Story: 9.5

-- Create gdpr_export_requests table
CREATE TABLE IF NOT EXISTS gdpr_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL DEFAULT 'GDPR_EXPORT',
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  download_token VARCHAR(255) UNIQUE NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  download_url TEXT,
  file_path TEXT,
  file_format VARCHAR(50) NOT NULL, -- JSON, CSV
  file_size BIGINT DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Check constraints
  CONSTRAINT gdpr_export_requests_status_check CHECK (status IN ('PENDING', 'QUEUED', 'PROCESSING', 'GENERATING_FILE', 'COMPLETED', 'FAILED')),
  CONSTRAINT gdpr_export_requests_format_check CHECK (file_format IN ('JSON', 'CSV')),
  CONSTRAINT gdpr_export_requests_request_type_check CHECK (request_type = 'GDPR_EXPORT')
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_gdpr_export_requests_user_id ON gdpr_export_requests(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_gdpr_export_requests_status ON gdpr_export_requests(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_gdpr_export_requests_requested_at ON gdpr_export_requests(requested_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_gdpr_export_requests_expires_at ON gdpr_export_requests(expires_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_gdpr_export_requests_download_token ON gdpr_export_requests(download_token) WHERE deleted_at IS NULL;

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_gdpr_export_requests_user_status ON gdpr_export_requests(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_gdpr_export_requests_user_requested_at ON gdpr_export_requests(user_id, requested_at DESC) WHERE deleted_at IS NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gdpr_export_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_gdpr_export_requests_updated_at
  BEFORE UPDATE ON gdpr_export_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_gdpr_export_requests_updated_at();

-- Add comments
COMMENT ON TABLE gdpr_export_requests IS 'Stores GDPR data export requests for compliance with data subject rights';
COMMENT ON COLUMN gdpr_export_requests.request_type IS 'Type of request: GDPR_EXPORT';
COMMENT ON COLUMN gdpr_export_requests.status IS 'Request status: PENDING, QUEUED, PROCESSING, GENERATING_FILE, COMPLETED, FAILED';
COMMENT ON COLUMN gdpr_export_requests.download_token IS 'Secure download token generated using crypto.randomUUID()';
COMMENT ON COLUMN gdpr_export_requests.file_format IS 'Export file format: JSON or CSV';
COMMENT ON COLUMN gdpr_export_requests.metadata IS 'Additional metadata in JSONB format (export configuration, statistics, etc.)';
COMMENT ON COLUMN gdpr_export_requests.expires_at IS 'Download link expiration time (7 days after completion)';
