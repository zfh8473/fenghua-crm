#!/bin/bash

# Run GDPR Export Table Migration
# This script runs the migration to create the gdpr_export_requests table

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Migration file
MIGRATION_FILE="migrations/031-add-gdpr-export-request-table.sql"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}GDPR Export Table Migration${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}DATABASE_URL not set. Checking for .env file...${NC}"
    
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
    else
        echo -e "${RED}Error: DATABASE_URL not found. Please set it or create .env file.${NC}"
        echo -e "${YELLOW}Example: export DATABASE_URL='postgresql://user:password@localhost:5432/dbname'${NC}"
        exit 1
    fi
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql command not found. Please install PostgreSQL client.${NC}"
    exit 1
fi

# Test database connection
echo -e "${YELLOW}Testing database connection...${NC}"
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Cannot connect to database. Please check your DATABASE_URL.${NC}"
    exit 1
fi
echo ""

# Check if table already exists
echo -e "${YELLOW}Checking if table already exists...${NC}"
TABLE_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gdpr_export_requests');" | tr -d ' ')

if [ "$TABLE_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓ Table gdpr_export_requests already exists${NC}"
    echo -e "${YELLOW}Do you want to run the migration anyway? (y/n): ${NC}"
    read -r confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo -e "${YELLOW}Migration cancelled.${NC}"
        exit 0
    fi
else
    echo -e "${YELLOW}Table does not exist. Running migration...${NC}"
fi

echo ""
echo -e "${YELLOW}Running migration: ${MIGRATION_FILE}${NC}"

if psql "$DATABASE_URL" -f "$MIGRATION_FILE"; then
    echo -e "${GREEN}✓ Migration completed successfully!${NC}"
else
    echo -e "${RED}✗ Migration failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Migration completed!${NC}"
echo -e "${GREEN}========================================${NC}"

# Verify table
echo ""
echo -e "${YELLOW}Verifying table...${NC}"
psql "$DATABASE_URL" -c "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name = 'gdpr_export_requests' ORDER BY ordinal_position LIMIT 5;"

echo ""
echo -e "${GREEN}✓ Table verification complete!${NC}"
