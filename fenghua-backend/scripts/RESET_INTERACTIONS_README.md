# 重置和重建互动记录数据

本目录包含两个脚本来清空并重建互动记录数据：

## 方法 1: 使用 SQL 脚本（推荐）

SQL 脚本可以直接在数据库中执行，不依赖环境变量。

### 使用步骤：

1. **连接到数据库**：
   ```bash
   # 如果使用 psql 命令行工具
   psql -d your_database_name -f scripts/reset-and-seed-interactions.sql
   
   # 或者如果使用 Docker
   docker exec -i your_postgres_container psql -U postgres -d your_database < scripts/reset-and-seed-interactions.sql
   
   # 或者在任何数据库客户端（如 pgAdmin、DBeaver）中直接执行 SQL 文件内容
   ```

2. **脚本功能**：
   - 软删除所有现有的互动记录（设置 `deleted_at`）
   - 删除所有 `interaction_products` 关联记录
   - 根据现有的客户-产品关联关系创建新的互动记录
   - 每个客户创建 2-3 个互动记录
   - 每个互动记录关联 1-3 个产品
   - 自动选择符合客户类型的互动类型（采购商/供应商）

3. **执行后查看结果**：
   脚本执行完成后会显示摘要信息，包括：
   - 客户总数
   - 产品总数
   - 关联关系总数
   - 新创建的互动记录总数
   - 互动-产品关联总数

## 方法 2: 使用 TypeScript 脚本

TypeScript 脚本需要设置 `DATABASE_URL` 环境变量。

### 使用步骤：

1. **设置环境变量**：
   ```bash
   export DATABASE_URL=postgresql://user:password@host:port/database
   # 或者
   export PG_DATABASE_URL=postgresql://user:password@host:port/database
   ```

2. **运行脚本**：
   ```bash
   cd fenghua-backend
   npx ts-node scripts/cli/reset-interactions.ts
   ```

## 注意事项

1. **数据要求**：
   - 至少需要 1 个客户（companies 表）
   - 至少需要 1 个活跃产品（products 表，status='active'）
   - 至少需要 1 个产品-客户关联（product_customer_associations 表）
   - 至少需要 1 个用户（users 表）

2. **数据安全**：
   - 脚本使用软删除（`deleted_at`），不会永久删除数据
   - 所有操作都在事务中执行，如果出错会自动回滚
   - 建议在执行前备份数据库

3. **创建的数据**：
   - 每个客户创建 2-3 个互动记录
   - 每个互动记录随机选择 1-3 个产品
   - 互动日期随机分布在过去 90 天内
   - 互动类型根据客户类型（BUYER/SUPPLIER）自动选择

## 验证结果

执行脚本后，可以在前端应用中验证：
1. 打开互动列表页面
2. 检查客户名称是否正确显示
3. 检查产品信息是否正确显示（应该显示多个产品）
4. 检查互动详情页面中的产品表格是否正确显示
