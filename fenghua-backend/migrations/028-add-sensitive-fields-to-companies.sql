-- Migration: Add sensitive data fields to companies table
-- Description: Adds bank_account and id_number fields to companies table for sensitive data storage
-- Date: 2026-01-13
-- Story: 9.3
-- Note: This migration is conditional - only adds fields if they don't exist

-- Add bank_account column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'bank_account'
  ) THEN
    ALTER TABLE companies ADD COLUMN bank_account VARCHAR(255);
    COMMENT ON COLUMN companies.bank_account IS 'Bank account number (sensitive data, will be encrypted)';
  END IF;
END $$;

-- Add id_number column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'id_number'
  ) THEN
    ALTER TABLE companies ADD COLUMN id_number VARCHAR(50);
    COMMENT ON COLUMN companies.id_number IS 'ID number (sensitive data, will be encrypted)';
  END IF;
END $$;
