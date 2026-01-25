-- 1. Create interaction_products table for 1:N relationship
CREATE TABLE IF NOT EXISTS interaction_products (
  interaction_id UUID NOT NULL REFERENCES product_customer_interactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (interaction_id, product_id)
);

-- 2. Create index for reverse lookup (search interactions by product)
CREATE INDEX IF NOT EXISTS idx_interaction_products_product_id ON interaction_products(product_id);

-- 3. Migrate existing data: Create an association for each existing interaction
-- This ensures that every interaction that had a product_id now has a corresponding entry in interaction_products
INSERT INTO interaction_products (interaction_id, product_id, created_at)
SELECT id, product_id, created_at
FROM product_customer_interactions
WHERE product_id IS NOT NULL
ON CONFLICT (interaction_id, product_id) DO NOTHING;

-- 4. Make product_id nullable in main table
-- This allows creating interactions without a single product_id in the future
-- Eventually, this column can be removed
ALTER TABLE product_customer_interactions ALTER COLUMN product_id DROP NOT NULL;
