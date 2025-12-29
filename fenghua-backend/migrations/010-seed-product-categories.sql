-- Migration: Seed product_categories table
-- Date: 2025-12-29
-- Description: Import existing hardcoded product categories into database
-- Story: 2.8

-- Insert existing categories (using placeholder HS codes - to be updated by business)
-- Note: HS codes are placeholders and should be confirmed with business team
INSERT INTO product_categories (name, hs_code, description, created_by)
VALUES
  ('电子产品', '85437090', '电子设备和组件', NULL),
  ('机械设备', '84798999', '机械设备和工具', NULL),
  ('化工产品', '38249990', '化工原料和制品', NULL),
  ('纺织品', '63079000', '纺织品和服装', NULL),
  ('食品', '21069090', '食品和饮料', NULL),
  ('其他', '99999999', '其他未分类产品', NULL)
ON CONFLICT (name) DO NOTHING;  -- If category already exists, skip

-- Note: After migration, business team should review and update HS codes as needed

