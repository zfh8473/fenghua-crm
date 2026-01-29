#!/bin/bash

# Script: Create 50 Interaction Records for Two-Column Layout Testing
# Description: Executes SQL script to create 50 diverse interaction records
# Date: 2026-01-27

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Create 50 Interaction Records${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql command not found. Please install PostgreSQL client.${NC}"
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
echo -e "${YELLOW}This will create 50 new interaction records.${NC}"
echo -e "${YELLOW}Existing interactions will NOT be deleted.${NC}"
echo ""
read -p "Continue? [y/N]: " confirm

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Executing SQL script...${NC}"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="${SCRIPT_DIR}/create-50-interactions-test-data.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}Error: SQL file not found at ${SQL_FILE}${NC}"
    exit 1
fi

# Execute SQL script
if psql "${DATABASE_URL}" -f "${SQL_FILE}"; then
    echo ""
    echo -e "${GREEN}✓ Successfully created 50 interaction records!${NC}"
    echo ""
    
    # Show summary
    echo -e "${BLUE}Summary:${NC}"
    psql "${DATABASE_URL}" -c "
        SELECT 
            'Total interactions' as info,
            COUNT(*) as count
        FROM product_customer_interactions 
        WHERE deleted_at IS NULL;
    "
else
    echo ""
    echo -e "${RED}✗ Failed to create interaction records.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Done! You can now refresh the frontend to see the two-column layout with 50 records.${NC}"
