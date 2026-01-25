-- Migration: Add People Module Fields
-- Description: Extends people table with new contact methods and important flag, adds person_id to interactions table
-- Date: 2026-01-21
-- Story: 20.1
-- Epic: 20

-- ============================================================================
-- Part 1: Extend people table with new fields
-- ============================================================================

-- Add WhatsApp contact field
ALTER TABLE people 
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(100);

-- Add Facebook contact field
ALTER TABLE people 
ADD COLUMN IF NOT EXISTS facebook VARCHAR(255);

-- Add important flag (for star marking)
ALTER TABLE people 
ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT false NOT NULL;

-- ============================================================================
-- Part 2: Add email uniqueness constraint
-- ============================================================================

-- Note: Email uniqueness is global (not per company) to prevent duplicate contacts
-- Exception: Contact email can match company email (official company email)
-- We use a partial unique index to only enforce uniqueness on non-null, non-deleted emails

-- Drop existing index if it exists (in case it was created differently)
DROP INDEX IF EXISTS idx_people_email_unique;

-- Create unique index on email (only for non-null, non-deleted records)
CREATE UNIQUE INDEX idx_people_email_unique 
ON people(email) 
WHERE email IS NOT NULL AND deleted_at IS NULL;

-- ============================================================================
-- Part 3: Add person_id to interactions table
-- ============================================================================

-- Add person_id column to product_customer_interactions table (nullable, optional)
ALTER TABLE product_customer_interactions 
ADD COLUMN IF NOT EXISTS person_id UUID;

-- Add foreign key constraint (ON DELETE SET NULL to preserve interaction history if person is deleted)
-- Drop constraint if exists (for idempotency)
ALTER TABLE product_customer_interactions
DROP CONSTRAINT IF EXISTS fk_interactions_person;

-- Add foreign key constraint
ALTER TABLE product_customer_interactions
ADD CONSTRAINT fk_interactions_person 
FOREIGN KEY (person_id) 
REFERENCES people(id) 
ON DELETE SET NULL;

-- Add index on person_id for querying interactions by person
CREATE INDEX IF NOT EXISTS idx_interactions_person_id 
ON product_customer_interactions(person_id) 
WHERE deleted_at IS NULL AND person_id IS NOT NULL;

-- ============================================================================
-- Part 4: Add indexes for new people fields
-- ============================================================================

-- Index for filtering important contacts
CREATE INDEX IF NOT EXISTS idx_people_is_important 
ON people(is_important) 
WHERE deleted_at IS NULL AND is_important = true;

-- Index for searching by WhatsApp (if needed)
CREATE INDEX IF NOT EXISTS idx_people_whatsapp 
ON people(whatsapp) 
WHERE deleted_at IS NULL AND whatsapp IS NOT NULL;

-- ============================================================================
-- Part 5: Update table and column comments
-- ============================================================================

COMMENT ON COLUMN people.whatsapp IS 'WhatsApp contact information';
COMMENT ON COLUMN people.facebook IS 'Facebook contact information';
COMMENT ON COLUMN people.is_important IS 'Flag to mark important contacts (star marking)';
COMMENT ON COLUMN people.email IS 'Email address (globally unique, except can match company email)';

COMMENT ON COLUMN product_customer_interactions.person_id IS 'Optional reference to specific contact person (nullable, for interactions without specific contact use company official email)';

-- ============================================================================
-- Part 6: Data validation notes
-- ============================================================================

-- Note: Email format validation is handled at application level using @IsEmail() decorator
-- Note: Email uniqueness is enforced by idx_people_email_unique index
-- Note: Exception: Contact email can match company email (official company email) - this is allowed
-- Note: If a person changes company (job change), update company_id manually; old company interactions remain (customer_id points to old company)
