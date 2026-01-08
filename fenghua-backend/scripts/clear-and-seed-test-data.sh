#!/bin/bash

# Script: Clear and Seed Test Data
# Description: Clears existing products and customers data, then creates test data with associations
# Date: 2025-01-03

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Clear and Seed Test Data${NC}"
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
echo -e "${YELLOW}⚠️  WARNING: This will DELETE all existing data in the following tables:${NC}"
echo "  - product_customer_interactions"
echo "  - product_customer_associations"
echo "  - products"
echo "  - companies (test customers only)"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Operation cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Clearing existing data...${NC}"

# Clear data in correct order (respecting foreign keys)
psql "${DATABASE_URL}" <<EOF
BEGIN;

-- Delete interactions first (they reference products and customers)
DELETE FROM product_customer_interactions;
-- Delete associations (they reference products and customers)
DELETE FROM product_customer_associations;
-- Delete products
DELETE FROM products;
-- Delete test customers (identified by customer_code)
DELETE FROM companies WHERE customer_code IN (
  'BUYER001', 'BUYER002', 'BUYER003', 'BUYER004', 'BUYER005',
  'BUYER006', 'BUYER007', 'BUYER008', 'BUYER009', 'BUYER010',
  'SUPPLIER001', 'SUPPLIER002', 'SUPPLIER003', 'SUPPLIER004', 'SUPPLIER005',
  'SUPPLIER006', 'SUPPLIER007', 'SUPPLIER008', 'SUPPLIER009', 'SUPPLIER010'
);

COMMIT;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Data cleared successfully${NC}"
else
    echo -e "${RED}✗ Failed to clear data${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Creating test data...${NC}"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Seed customers
echo -e "${YELLOW}Seeding test customers...${NC}"
psql "${DATABASE_URL}" -f "${SCRIPT_DIR}/seed-test-customers.sql"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Test customers created${NC}"
else
    echo -e "${RED}✗ Failed to create test customers${NC}"
    exit 1
fi

# Create test products and associations
echo -e "${YELLOW}Creating test products and associations...${NC}"

psql "${DATABASE_URL}" <<EOF
BEGIN;

-- Create test products (note: workspace_id was removed in migration 007)
WITH new_products AS (
  INSERT INTO products (name, hs_code, description, category, status, specifications, created_at, updated_at, deleted_at, created_by, updated_by)
  VALUES
    ('测试产品 A', '1234567890', '这是一个测试产品 A 的描述', '电子产品', 'active', '{"color": "黑色", "size": "标准"}'::jsonb, NOW(), NOW(), NULL, NULL, NULL),
    ('测试产品 B', '0987654321', '这是一个测试产品 B 的描述', '机械产品', 'active', '{"weight": "10kg", "material": "不锈钢"}'::jsonb, NOW(), NOW(), NULL, NULL, NULL),
    ('测试产品 C', '1122334455', '这是一个测试产品 C 的描述', '化工产品', 'active', '{"grade": "工业级", "purity": "99%"}'::jsonb, NOW(), NOW(), NULL, NULL, NULL)
  RETURNING id, name
),
-- Get test customers
test_customers AS (
  SELECT id, name, customer_type, customer_code
  FROM companies
  WHERE customer_code IN (
    'BUYER001', 'BUYER002', 'BUYER003',
    'SUPPLIER001', 'SUPPLIER002', 'SUPPLIER003'
  )
)
-- Create associations between products and customers
INSERT INTO product_customer_associations (product_id, customer_id, association_type, created_at, updated_at, deleted_at, created_by, updated_by)
SELECT 
  p.id,
  c.id,
  CASE WHEN c.customer_type = 'BUYER' THEN 'POTENTIAL_BUYER' ELSE 'POTENTIAL_SUPPLIER' END,
  NOW(),
  NOW(),
  NULL,
  NULL,
  NULL
FROM new_products p
CROSS JOIN test_customers c
WHERE 
  -- Product A with first 2 buyers and first supplier
  (p.name = '测试产品 A' AND c.customer_code IN ('BUYER001', 'BUYER002', 'SUPPLIER001'))
  OR
  -- Product B with next 2 buyers and next supplier
  (p.name = '测试产品 B' AND c.customer_code IN ('BUYER003', 'SUPPLIER002', 'SUPPLIER003'))
  OR
  -- Product C with remaining customers
  (p.name = '测试产品 C' AND c.customer_code IN ('BUYER001', 'SUPPLIER001'));

COMMIT;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Test products and associations created${NC}"
else
    echo -e "${RED}✗ Failed to create test products and associations${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Test Data Created Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "  - Test customers: 20 (10 BUYER, 10 SUPPLIER)"
echo "  - Test products: 3"
echo "  - Test associations: Created between products and customers"
echo ""
echo -e "${YELLOW}You can now test the association display in the frontend!${NC}"

