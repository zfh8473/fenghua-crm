#!/bin/bash

# Database Migration Verification Script
# Date: 2025-12-26
# Description: Verify database migrations for fenghua-crm

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

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}fenghua-crm Migration Verification${NC}"
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

# Verify tables
echo -e "${YELLOW}Verifying tables...${NC}"
TABLES=("products" "product_customer_interactions" "file_attachments")
MISSING_TABLES=()

for table in "${TABLES[@]}"; do
    if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table}');" | grep -q t; then
        echo -e "${GREEN}✓ Table '${table}' exists${NC}"
    else
        echo -e "${RED}✗ Table '${table}' does not exist${NC}"
        MISSING_TABLES+=("${table}")
    fi
done

if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    echo -e "${RED}Error: Missing tables: ${MISSING_TABLES[*]}${NC}"
    exit 1
fi

echo ""

# Verify indexes
echo -e "${YELLOW}Verifying indexes...${NC}"
EXPECTED_INDEXES=(
    "idx_products_workspace_hs_code"
    "idx_products_status"
    "idx_products_category"
    "idx_products_name_search"
    "idx_products_workspace"
    "idx_products_workspace_status"
    "idx_interactions_product"
    "idx_interactions_customer"
    "idx_interactions_product_customer"
    "idx_interactions_date"
    "idx_interactions_type"
    "idx_interactions_workspace"
    "idx_interactions_product_customer_date"
    "idx_interactions_creator"
    "idx_attachments_interaction"
    "idx_attachments_product"
    "idx_attachments_type"
    "idx_attachments_workspace"
)

MISSING_INDEXES=()

for index in "${EXPECTED_INDEXES[@]}"; do
    if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT EXISTS (SELECT FROM pg_indexes WHERE indexname = '${index}');" | grep -q t; then
        echo -e "${GREEN}✓ Index '${index}' exists${NC}"
    else
        echo -e "${RED}✗ Index '${index}' does not exist${NC}"
        MISSING_INDEXES+=("${index}")
    fi
done

if [ ${#MISSING_INDEXES[@]} -gt 0 ]; then
    echo -e "${YELLOW}Warning: Missing indexes: ${MISSING_INDEXES[*]}${NC}"
fi

echo ""

# Verify triggers
echo -e "${YELLOW}Verifying triggers...${NC}"
EXPECTED_TRIGGERS=(
    "trigger_update_products_updated_at"
    "trigger_update_interactions_updated_at"
    "trigger_update_attachments_updated_at"
)

MISSING_TRIGGERS=()

for trigger in "${EXPECTED_TRIGGERS[@]}"; do
    if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = '${trigger}');" | grep -q t; then
        echo -e "${GREEN}✓ Trigger '${trigger}' exists${NC}"
    else
        echo -e "${RED}✗ Trigger '${trigger}' does not exist${NC}"
        MISSING_TRIGGERS+=("${trigger}")
    fi
done

if [ ${#MISSING_TRIGGERS[@]} -gt 0 ]; then
    echo -e "${RED}Error: Missing triggers: ${MISSING_TRIGGERS[*]}${NC}"
    exit 1
fi

echo ""

# Verify functions
echo -e "${YELLOW}Verifying functions...${NC}"
EXPECTED_FUNCTIONS=(
    "update_products_updated_at"
    "update_interactions_updated_at"
    "update_attachments_updated_at"
)

MISSING_FUNCTIONS=()

for func in "${EXPECTED_FUNCTIONS[@]}"; do
    if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT EXISTS (SELECT FROM pg_proc WHERE proname = '${func}');" | grep -q t; then
        echo -e "${GREEN}✓ Function '${func}' exists${NC}"
    else
        echo -e "${RED}✗ Function '${func}' does not exist${NC}"
        MISSING_FUNCTIONS+=("${func}")
    fi
done

if [ ${#MISSING_FUNCTIONS[@]} -gt 0 ]; then
    echo -e "${RED}Error: Missing functions: ${MISSING_FUNCTIONS[*]}${NC}"
    exit 1
fi

echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Migration verification complete!${NC}"
echo -e "${GREEN}========================================${NC}"

if [ ${#MISSING_INDEXES[@]} -eq 0 ] && [ ${#MISSING_TABLES[@]} -eq 0 ] && [ ${#MISSING_TRIGGERS[@]} -eq 0 ] && [ ${#MISSING_FUNCTIONS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All migrations verified successfully!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some issues found. Please review above.${NC}"
    exit 1
fi

