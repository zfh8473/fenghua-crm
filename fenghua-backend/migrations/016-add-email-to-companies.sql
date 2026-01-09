-- Migration: Add email column to companies table
-- Description: Adds email column to companies table for storing official email addresses
-- Date: 2025-01-03

-- Add email column to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create index on email (excluding soft-deleted records)
CREATE INDEX IF NOT EXISTS idx_companies_email 
ON companies(email) 
WHERE deleted_at IS NULL;

-- Add comment
COMMENT ON COLUMN companies.email IS 'Official email address of the company';




