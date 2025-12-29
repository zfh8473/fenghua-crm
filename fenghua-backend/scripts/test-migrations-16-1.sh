#!/bin/bash

# Test Migration Scripts for Story 16.1
# Date: 2025-12-26
# Description: Test database migration scripts for users, roles, companies, and people tables

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Migration directory
MIGRATION_DIR="$(cd "$(dirname "$0")/../migrations" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Story 16.1: Migration Script Testing${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql command not found. Please install PostgreSQL client.${NC}"
    exit 1
fi

# Load environment variables
if [ -f .env.development ]; then
    export $(cat .env.development | grep -v '^#' | xargs)
fi

# Use DATABASE_URL from environment or default
DATABASE_URL="${DATABASE_URL:-postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-calm-glade-ahzfobn1-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm-dev?sslmode=require&channel_binding=require}"

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL not configured${NC}"
    exit 1
fi

# Test database connection
echo -e "${YELLOW}Testing database connection...${NC}"
if psql "${DATABASE_URL}" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Cannot connect to database${NC}"
    exit 1
fi
echo ""

# Show database info
echo -e "${YELLOW}Database Information:${NC}"
psql "${DATABASE_URL}" -c "SELECT current_database(), current_user, version();" 2>/dev/null | head -5
echo ""

# Confirm migration
echo -e "${YELLOW}This will run the following migrations:${NC}"
echo "  1. 005-create-users-and-roles-tables.sql"
echo "  2. 006-create-companies-and-people-tables.sql"
echo "  3. 007-remove-workspace-dependencies.sql"
echo "  4. 008-seed-roles.sql"
echo ""
read -p "Do you want to continue? (y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo -e "${YELLOW}Migration cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Starting migrations...${NC}"
echo ""

# Run migrations
MIGRATIONS=(
    "005-create-users-and-roles-tables.sql"
    "006-create-companies-and-people-tables.sql"
    "007-remove-workspace-dependencies.sql"
    "008-seed-roles.sql"
)

SUCCESS_COUNT=0
FAILED_COUNT=0

for migration in "${MIGRATIONS[@]}"; do
    migration_file="${MIGRATION_DIR}/${migration}"
    
    if [ ! -f "$migration_file" ]; then
        echo -e "${RED}✗ Migration file not found: ${migration_file}${NC}"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        continue
    fi
    
    echo -e "${YELLOW}Running ${migration}...${NC}"
    
    if psql "${DATABASE_URL}" -f "${migration_file}" 2>&1; then
        echo -e "${GREEN}✓ ${migration} completed successfully${NC}"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo -e "${RED}✗ ${migration} failed${NC}"
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
    
    echo ""
done

echo -e "${BLUE}========================================${NC}"
if [ $FAILED_COUNT -eq 0 ]; then
    echo -e "${GREEN}All migrations completed successfully!${NC}"
    echo -e "${GREEN}Success: ${SUCCESS_COUNT}, Failed: ${FAILED_COUNT}${NC}"
else
    echo -e "${YELLOW}Migration completed with some failures.${NC}"
    echo -e "${YELLOW}Success: ${SUCCESS_COUNT}, Failed: ${FAILED_COUNT}${NC}"
fi
echo -e "${BLUE}========================================${NC}"
echo ""

# Verify tables
echo -e "${YELLOW}Verifying tables...${NC}"
psql "${DATABASE_URL}" -c "
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'roles', 'user_roles', 'companies', 'people')
ORDER BY table_name;
" 2>/dev/null || echo -e "${YELLOW}Note: Some tables may not exist yet.${NC}"

echo ""

# Verify indexes
echo -e "${YELLOW}Verifying indexes...${NC}"
psql "${DATABASE_URL}" -c "
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('users', 'roles', 'user_roles', 'companies', 'people')
ORDER BY tablename, indexname;
" 2>/dev/null || echo -e "${YELLOW}Note: Some indexes may not exist yet.${NC}"

echo ""

# Verify foreign keys
echo -e "${YELLOW}Verifying foreign keys...${NC}"
psql "${DATABASE_URL}" -c "
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('users', 'roles', 'user_roles', 'companies', 'people')
ORDER BY tc.table_name, kcu.column_name;
" 2>/dev/null || echo -e "${YELLOW}Note: Some foreign keys may not exist yet.${NC}"

echo ""

# Verify triggers
echo -e "${YELLOW}Verifying triggers...${NC}"
psql "${DATABASE_URL}" -c "
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE event_object_table IN ('users', 'roles', 'user_roles', 'companies', 'people')
ORDER BY event_object_table, trigger_name;
" 2>/dev/null || echo -e "${YELLOW}Note: Some triggers may not exist yet.${NC}"

echo ""

# Verify roles
echo -e "${YELLOW}Verifying seeded roles...${NC}"
psql "${DATABASE_URL}" -c "
SELECT name, description FROM roles ORDER BY name;
" 2>/dev/null || echo -e "${YELLOW}Note: Roles table may not exist yet.${NC}"

echo ""
echo -e "${GREEN}Migration testing complete!${NC}"

