-- Migration: Create integrity_validation_reports table
-- Description: Creates the integrity_validation_reports table for storing product association integrity validation results
-- Date: 2025-12-29
-- Story: 2-7-product-association-integrity-validation

-- Create integrity_validation_reports table
CREATE TABLE IF NOT EXISTS integrity_validation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id VARCHAR(255) UNIQUE NOT NULL,
  validation_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_records INTEGER NOT NULL DEFAULT 0,
  valid_records INTEGER NOT NULL DEFAULT 0,
  invalid_records INTEGER NOT NULL DEFAULT 0,
  issues_count INTEGER NOT NULL DEFAULT 0,
  issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  query_filter JSONB, -- Stores productId/customerId if validation was filtered
  validation_type VARCHAR(50) NOT NULL DEFAULT 'manual', -- 'manual' or 'scheduled'
  status VARCHAR(50) NOT NULL DEFAULT 'completed', -- 'running', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_integrity_reports_validation_time ON integrity_validation_reports(validation_time DESC);
CREATE INDEX IF NOT EXISTS idx_integrity_reports_report_id ON integrity_validation_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_integrity_reports_validation_type ON integrity_validation_reports(validation_type);
CREATE INDEX IF NOT EXISTS idx_integrity_reports_status ON integrity_validation_reports(status);
CREATE INDEX IF NOT EXISTS idx_integrity_reports_created_at ON integrity_validation_reports(created_at DESC);

-- Create GIN index for JSONB queries on issues
CREATE INDEX IF NOT EXISTS idx_integrity_reports_issues_gin ON integrity_validation_reports USING GIN (issues);

-- Add comment
COMMENT ON TABLE integrity_validation_reports IS 'Stores product association integrity validation results for historical viewing';
COMMENT ON COLUMN integrity_validation_reports.report_id IS 'Unique identifier for the validation report';
COMMENT ON COLUMN integrity_validation_reports.issues IS 'JSONB array of IntegrityIssueDto objects';
COMMENT ON COLUMN integrity_validation_reports.query_filter IS 'JSONB object with productId/customerId if validation was filtered';
COMMENT ON COLUMN integrity_validation_reports.validation_type IS 'Type of validation: manual (triggered by admin) or scheduled (automatic)';




