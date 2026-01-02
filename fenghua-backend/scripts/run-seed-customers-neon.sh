#!/bin/bash

# Script: Seed Test Customer Data (Neon)
# Description: Creates 20 test customer records using Neon database connection
# Date: 2025-01-03

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Seed Test Customer Data (Neon)${NC}"
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

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SQL_FILE="${SCRIPT_DIR}/seed-test-customers.sql"

if [ ! -f "${SQL_FILE}" ]; then
    echo -e "${RED}Error: SQL file not found: ${SQL_FILE}${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}This will insert 20 test customers (10 BUYER + 10 SUPPLIER)${NC}"
read -p "Do you want to continue? (y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo -e "${YELLOW}Operation cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Executing SQL script...${NC}"

# Execute SQL script
if psql "${DATABASE_URL}" -f "${SQL_FILE}"; then
    echo ""
    echo -e "${GREEN}✅ Test customers inserted successfully!${NC}"
    echo ""
    
    # Show summary
    echo -e "${BLUE}Summary:${NC}"
    psql "${DATABASE_URL}" -c "
      SELECT 
        customer_type,
        COUNT(*) as count
      FROM companies
      WHERE customer_code IN (
        'BUYER001', 'BUYER002', 'BUYER003', 'BUYER004', 'BUYER005',
        'BUYER006', 'BUYER007', 'BUYER008', 'BUYER009', 'BUYER010',
        'SUPPLIER001', 'SUPPLIER002', 'SUPPLIER003', 'SUPPLIER004', 'SUPPLIER005',
        'SUPPLIER006', 'SUPPLIER007', 'SUPPLIER008', 'SUPPLIER009', 'SUPPLIER010'
      )
      GROUP BY customer_type;
    "
    
    echo ""
    echo -e "${GREEN}✅ Done! You now have 20 test customers in your database.${NC}"
else
    echo -e "${RED}✗ Error executing SQL script.${NC}"
    exit 1
fi

