-- Migration: Add error_details to import_history table
-- Description: Adds error_details JSONB field to store detailed error information for failed import records
-- Date: 2025-01-08
-- Story: 7.6

-- Add error_details column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'import_history' AND column_name = 'error_details'
  ) THEN
    ALTER TABLE import_history 
    ADD COLUMN error_details JSONB;
    
    RAISE NOTICE 'Added error_details column to import_history table';
  END IF;
END $$;

-- Create index for error_details queries (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_import_history_error_details 
  ON import_history USING GIN (error_details) 
  WHERE deleted_at IS NULL AND error_details IS NOT NULL;

-- Add comment
COMMENT ON COLUMN import_history.error_details IS 'Stores detailed error information for failed import records in JSONB format';

