-- Migration: Create companies and people tables
-- Description: Creates companies and people tables for customer and contact management
-- Date: 2025-12-26
-- Story: 16.1

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain_name VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  industry VARCHAR(100),
  employees INTEGER,
  website VARCHAR(255),
  phone VARCHAR(50),
  customer_type VARCHAR(50) NOT NULL, -- SUPPLIER, BUYER
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  CONSTRAINT companies_customer_type_check CHECK (customer_type IN ('SUPPLIER', 'BUYER'))
);

-- Create people table
CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  job_title VARCHAR(100),
  department VARCHAR(100),
  linkedin_url VARCHAR(255),
  wechat VARCHAR(100),
  notes TEXT,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Create indexes for companies table
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_companies_customer_type ON companies(customer_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_companies_domain_name ON companies(domain_name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_companies_deleted_at ON companies(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by) WHERE deleted_at IS NULL;

-- Create indexes for people table
CREATE INDEX IF NOT EXISTS idx_people_company_id ON people(company_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_people_email ON people(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_people_name ON people(first_name, last_name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_people_deleted_at ON people(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_people_created_by ON people(created_by) WHERE deleted_at IS NULL;

-- Create function to update updated_at timestamp for companies
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at for companies
DROP TRIGGER IF EXISTS trigger_update_companies_updated_at ON companies;
CREATE TRIGGER trigger_update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();

-- Create function to update updated_at timestamp for people
CREATE OR REPLACE FUNCTION update_people_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at for people
DROP TRIGGER IF EXISTS trigger_update_people_updated_at ON people;
CREATE TRIGGER trigger_update_people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW
  EXECUTE FUNCTION update_people_updated_at();

-- Add comments
COMMENT ON TABLE companies IS 'Companies table for customer management (suppliers and buyers)';
COMMENT ON TABLE people IS 'People table for contact management (linked to companies)';
COMMENT ON COLUMN companies.customer_type IS 'Customer type: SUPPLIER or BUYER';
COMMENT ON COLUMN companies.domain_name IS 'Company domain name (for matching with email domains)';
COMMENT ON COLUMN people.company_id IS 'Foreign key to companies table';

