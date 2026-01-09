-- Migration: Add customer_code field to companies table
-- Description: Adds customer_code column to companies table for customer identification
-- Date: 2025-01-03
-- Story: 3.1

-- Add customer_code column to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS customer_code VARCHAR(50);

-- Create unique index on customer_code (excluding soft-deleted records)
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_customer_code 
ON companies(customer_code) 
WHERE deleted_at IS NULL;

-- Add comment
COMMENT ON COLUMN companies.customer_code IS 'Customer code for identification (alphanumeric, 1-50 characters, unique)';




