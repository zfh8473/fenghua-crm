-- Migration: Create import_history table
-- All custom code is proprietary and not open source.

-- Create import_history table to track customer import operations
CREATE TABLE IF NOT EXISTS import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id VARCHAR(255) NOT NULL UNIQUE, -- BullMQ job ID
  file_name VARCHAR(255) NOT NULL,
  file_id VARCHAR(255) NOT NULL, -- Temporary file ID
  user_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'processing', -- processing, completed, failed
  total_records INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  error_report_path VARCHAR(1000), -- Path to error report Excel file
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Foreign key to users table
  CONSTRAINT fk_import_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_import_history_user_id ON import_history(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_import_history_status ON import_history(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_import_history_started_at ON import_history(started_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_import_history_task_id ON import_history(task_id) WHERE deleted_at IS NULL;

-- Add comment
COMMENT ON TABLE import_history IS 'Stores history of customer data import operations';
COMMENT ON COLUMN import_history.task_id IS 'BullMQ job ID for tracking import task';
COMMENT ON COLUMN import_history.file_id IS 'Temporary file ID used during import';
COMMENT ON COLUMN import_history.error_report_path IS 'Path to Excel file containing failed records and error details';

