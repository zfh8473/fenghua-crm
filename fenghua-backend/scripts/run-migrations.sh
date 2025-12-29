#!/bin/bash

# Database Migration Script
# Date: 2025-12-26
# Description: Run database migrations for fenghua-crm

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Database connection parameters
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-fenghua_crm}"
DB_USER="${DB_USER:-postgres}"

# Migration directory
MIGRATION_DIR="$(cd "$(dirname "$0")/../migrations" && pwd)"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}fenghua-crm Database Migration${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql command not found. Please install PostgreSQL client.${NC}"
    exit 1
fi

# Prompt for database password
read -sp "Enter database password for user ${DB_USER}: " DB_PASSWORD
echo ""

# Test database connection
echo -e "${YELLOW}Testing database connection...${NC}"
export PGPASSWORD="${DB_PASSWORD}"
if ! psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}Error: Cannot connect to database. Please check your connection parameters.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Database connection successful${NC}"
echo ""

# Confirm migration
echo -e "${YELLOW}This will run the following migrations:${NC}"
echo "  1. 001-create-products-table.sql"
echo "  2. 002-create-interactions-table.sql"
echo "  3. 003-create-attachments-table.sql"
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
    "001-create-products-table.sql"
    "002-create-interactions-table.sql"
    "003-create-attachments-table.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    migration_file="${MIGRATION_DIR}/${migration}"
    
    if [ ! -f "$migration_file" ]; then
        echo -e "${RED}Error: Migration file not found: ${migration_file}${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Running ${migration}...${NC}"
    
    if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${migration_file}"; then
        echo -e "${GREEN}✓ ${migration} completed successfully${NC}"
    else
        echo -e "${RED}✗ ${migration} failed${NC}"
        exit 1
    fi
    
    echo ""
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All migrations completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Verify tables
echo -e "${YELLOW}Verifying tables...${NC}"
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('products', 'product_customer_interactions', 'file_attachments')
ORDER BY table_name;
"

echo ""
echo -e "${GREEN}Migration verification complete!${NC}"

