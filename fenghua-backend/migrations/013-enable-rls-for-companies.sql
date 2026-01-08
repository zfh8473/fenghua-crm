-- Migration: Enable Row Level Security (RLS) for role-based data access filtering
-- Description: Enables RLS on companies and product_customer_interactions tables to provide defense-in-depth security layer
-- Date: 2025-01-03
-- Story: 3.7

-- ============================================================================
-- 1. Enable RLS on companies table
-- ============================================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create helper function to get current user role from session variable
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.user_role', true);
END;
$$ LANGUAGE plpgsql;

-- Create RLS policy for companies table
-- Policy allows:
-- - ADMIN and DIRECTOR: Can see all customers
-- - FRONTEND_SPECIALIST: Can only see BUYER customers
-- - BACKEND_SPECIALIST: Can only see SUPPLIER customers
CREATE POLICY companies_filter_by_role ON companies
  FOR SELECT
  USING (
    -- Admin and Director can see all
    current_setting('app.user_role', true) IN ('ADMIN', 'DIRECTOR')
    OR
    -- Frontend Specialist can only see BUYER
    (current_setting('app.user_role', true) = 'FRONTEND_SPECIALIST' AND customer_type = 'BUYER')
    OR
    -- Backend Specialist can only see SUPPLIER
    (current_setting('app.user_role', true) = 'BACKEND_SPECIALIST' AND customer_type = 'SUPPLIER')
  );

-- Add comment
COMMENT ON POLICY companies_filter_by_role ON companies IS 'RLS policy to filter companies by user role (ADMIN/DIRECTOR see all, FRONTEND_SPECIALIST see BUYER, BACKEND_SPECIALIST see SUPPLIER)';

-- ============================================================================
-- 2. Enable RLS on product_customer_interactions table
-- ============================================================================

ALTER TABLE product_customer_interactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for product_customer_interactions table
-- Policy filters interactions based on the associated customer's type
CREATE POLICY interactions_filter_by_role ON product_customer_interactions
  FOR SELECT
  USING (
    -- Admin and Director can see all
    current_setting('app.user_role', true) IN ('ADMIN', 'DIRECTOR')
    OR
    -- Frontend Specialist can only see interactions with BUYER customers
    (
      current_setting('app.user_role', true) = 'FRONTEND_SPECIALIST'
      AND EXISTS (
        SELECT 1 FROM companies c
        WHERE c.id = product_customer_interactions.customer_id
        AND c.customer_type = 'BUYER'
        AND c.deleted_at IS NULL
      )
    )
    OR
    -- Backend Specialist can only see interactions with SUPPLIER customers
    (
      current_setting('app.user_role', true) = 'BACKEND_SPECIALIST'
      AND EXISTS (
        SELECT 1 FROM companies c
        WHERE c.id = product_customer_interactions.customer_id
        AND c.customer_type = 'SUPPLIER'
        AND c.deleted_at IS NULL
      )
    )
  );

-- Add comment
COMMENT ON POLICY interactions_filter_by_role ON product_customer_interactions IS 'RLS policy to filter interactions by associated customer type (based on user role)';

-- ============================================================================
-- Notes:
-- ============================================================================
-- 1. This RLS implementation provides a defense-in-depth security layer
-- 2. The primary filtering is done at the service layer (NestJS)
-- 3. RLS acts as a safety net in case service layer filtering is bypassed
-- 4. To use RLS, NestJS services must set session variable before queries:
--    BEGIN;
--    SET LOCAL app.user_role = 'FRONTEND_SPECIALIST';
--    SELECT * FROM companies WHERE ...;
--    COMMIT;
-- 5. For MVP, service-layer filtering may be sufficient; RLS can be added later
-- 6. Consider creating index on customer_type column for better RLS performance:
--    CREATE INDEX IF NOT EXISTS idx_companies_customer_type ON companies(customer_type);



