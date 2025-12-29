#!/bin/bash

# Database Migration Script for Neon
# Date: 2025-12-26
# Description: Run database migrations for fenghua-crm using Neon connection strings

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
echo -e "${BLUE}fenghua-crm Database Migration (Neon)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql command not found. Please install PostgreSQL client.${NC}"
    echo -e "${YELLOW}Install: brew install postgresql (macOS) or apt-get install postgresql-client (Linux)${NC}"
    exit 1
fi

# Environment selection
echo -e "${YELLOW}Select environment:${NC}"
echo "  1. Development (fenghua-crm-dev)"
echo "  2. Production (fenghua-crm)"
echo ""
read -p "Enter choice [1 or 2]: " env_choice

case $env_choice in
    1)
        ENV_NAME="development"
        DATABASE_URL="postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-calm-glade-ahzfobn1-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm-dev?sslmode=require&channel_binding=require"
        ;;
    2)
        ENV_NAME="production"
        DATABASE_URL="postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-shiny-truth-ahie7zxc-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm?sslmode=require&channel_binding=require"
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}Environment: ${ENV_NAME}${NC}"
echo ""

# Test database connection
echo -e "${YELLOW}Testing database connection...${NC}"
if psql "${DATABASE_URL}" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Cannot connect to database. Please check your connection string.${NC}"
    exit 1
fi
echo ""

# Show database info
echo -e "${YELLOW}Database Information:${NC}"
psql "${DATABASE_URL}" -c "SELECT current_database(), current_user, version();" 2>/dev/null | head -5
echo ""

# Confirm migration
echo -e "${YELLOW}This will run the following migrations:${NC}"
echo "  1. 001-create-products-table.sql"
echo "  2. 002-create-interactions-table.sql"
echo "  3. 003-create-attachments-table.sql"
echo "  4. 004-create-system-settings-table.sql"
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
    "004-create-system-settings-table.sql"
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
        # Continue with next migration instead of exiting
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
  AND table_name IN ('products', 'product_customer_interactions', 'file_attachments', 'system_settings')
ORDER BY table_name;
" 2>/dev/null || echo -e "${YELLOW}Note: Some tables may not exist yet.${NC}"

echo ""
echo -e "${GREEN}Migration complete!${NC}"

