-- Migration: Create export_history table
-- Description: Stores export job history for data export functionality
-- Date: 2025-01-08

CREATE TABLE IF NOT EXISTS export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  total_records INTEGER NOT NULL DEFAULT 0,
  export_type VARCHAR(50) NOT NULL, -- CUSTOMER, PRODUCT, INTERACTION
  export_format VARCHAR(50) NOT NULL, -- JSON, CSV, EXCEL
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_export_history_created_by ON export_history(created_by);
CREATE INDEX IF NOT EXISTS idx_export_history_export_type ON export_history(export_type);
CREATE INDEX IF NOT EXISTS idx_export_history_status ON export_history(status);
CREATE INDEX IF NOT EXISTS idx_export_history_created_at ON export_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_history_expires_at ON export_history(expires_at);

-- Add comments
COMMENT ON TABLE export_history IS 'Stores export job history for data export functionality';
COMMENT ON COLUMN export_history.export_type IS 'Type of data exported: CUSTOMER, PRODUCT, or INTERACTION';
COMMENT ON COLUMN export_history.export_format IS 'Export file format: JSON, CSV, or EXCEL';
COMMENT ON COLUMN export_history.status IS 'Export job status: pending, processing, completed, or failed';
COMMENT ON COLUMN export_history.expires_at IS 'File download link expiration time (24 hours after creation)';


