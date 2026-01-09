-- Migration: Add import_type to import_history table
-- Description: Adds import_type field to distinguish between customer and product imports
-- Date: 2025-01-08
-- Story: 7.2

-- Add import_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'import_history' AND column_name = 'import_type'
  ) THEN
    ALTER TABLE import_history 
    ADD COLUMN import_type VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER';
    
    RAISE NOTICE 'Added import_type column to import_history table';
  END IF;
END $$;

-- Create index for import_type
CREATE INDEX IF NOT EXISTS idx_import_history_type 
  ON import_history(import_type) 
  WHERE deleted_at IS NULL;

-- Update existing records to have 'CUSTOMER' as import_type (if any exist)
UPDATE import_history 
SET import_type = 'CUSTOMER' 
WHERE import_type IS NULL OR import_type = '';


