# Story 8.4: 供应商分析

Status: done

## Code Review

**Review Date:** 2026-01-12  
**Review Status:** ✅ APPROVED with Recommendations  
**Review Report:** `_bmad-output/code-reviews/story-8-4-code-review.md`

**Critical Issues Found:** 0  
**High Priority Issues:** 2 (已修复)  
**Medium Priority Issues:** 3 (已修复)  
**Low Priority Issues:** 2 (可选)

**Key Findings:**
- ✅ Good code structure and error handling
- ✅ Proper permission control and security practices
- ✅ Performance optimizations implemented (Redis cache, database indexes, lazy loading)
- ✅ Export data limit check added (before query execution)
- ✅ Request retry mechanism confirmed implemented
- ✅ Cooperation frequency calculation improved (consistent with customer analysis)
- ✅ Cooperation trend data validation added
- ✅ Export format validation improved

## User Story

**As a** 总监或管理员  
**I want to** 查看供应商分析数据，包括供应商订单统计、合作频率、合作稳定性等指标  
**So that** 我可以了解供应商的表现，优化供应链管理，识别优质供应商和潜在风险供应商

## Acceptance Criteria

### AC1: 供应商分析基础显示
**Given** 用户已登录且角色为总监或管理员  
**When** 用户访问供应商分析页面  
**Then** 系统显示供应商分析表格，包含以下列：
- 供应商名称
- 供应商类型（SUPPLIER）
- 订单量（该供应商提供的产品相关的订单互动记录数）
- 订单金额（从互动记录的 `additional_info` 中提取的订单金额总和）
- 合作频率（订单数 / 时间范围天数，或使用平均订单间隔）
- 最后合作日期
- 距离上次合作天数
- 合作稳定性（基于合作频率和最后合作日期的稳定性评级）
- 供应商生命周期价值（累计订单金额）

### AC2: 供应商分析数据展示和筛选
**Given** 用户已登录且角色为总监或管理员  
**When** 用户在供应商分析页面
**Then** 系统支持以下筛选功能：
- 按时间范围筛选（基于 `product_customer_interactions.interaction_date`）
- 按产品类别筛选（基于 `products.category`）
- 支持分页显示（默认每页 20 条，最大 100 条）
- 支持按订单金额、订单量、合作频率等字段排序
- 点击供应商名称可跳转到供应商详情页面

### AC3: 供应商合作稳定性计算和展示
**Given** 用户已登录且角色为总监或管理员  
**When** 用户查看供应商分析数据  
**Then** 系统计算并显示供应商合作稳定性：
- 稳定性评级：高（最近 30 天内有合作且合作频率高）、中（最近 60 天内有合作）、低（最近 90 天内有合作）、风险（超过 90 天无合作）
- 稳定性评级使用颜色编码显示（高=绿色，中=蓝色，低=黄色，风险=红色）
- 系统显示供应商合作趋势图（按时间展示合作频率变化）

### AC4: 供应商分析数据导出
**Given** 用户已登录且角色为总监或管理员  
**When** 用户点击"导出"按钮  
**Then** 系统支持导出供应商分析数据：
- 支持 CSV 格式导出
- 导出数据包含所有筛选后的供应商分析指标
- 导出文件名包含当前日期

## Tasks / Subtasks

- [x] Task 1: 创建后端供应商分析 API (AC: 1,2,3)
  - [x] 1.1 创建供应商分析服务模块
    - 创建 `fenghua-backend/src/dashboard/supplier-analysis.service.ts`
    - 注入 `PermissionService` 和 `ConfigService`
    - 实现供应商分析统计查询：
      - 查询每个供应商的订单量（`interaction_type` 为 `ORDER_SIGNED` 或 `ORDER_COMPLETED` 的互动记录数，且 `customer_type` 为 `SUPPLIER`）
      - 查询每个供应商的订单金额（从 `additional_info` JSONB 字段中提取 `orderAmount` 或 `amount`，如果存在）
      - 查询每个供应商的合作频率（订单数 / 时间范围天数，或使用平均订单间隔）
      - 查询每个供应商的最后合作日期（用于稳定性计算）
      - 计算供应商合作稳定性（基于最后合作日期和合作频率）
    - 使用 `PermissionService.getDataAccessFilter(token)` 获取数据访问过滤器
    - 使用 PostgreSQL 聚合查询优化性能
    - 支持按时间范围筛选（基于 `product_customer_interactions.interaction_date`）
    - 支持按产品类别筛选（基于 `products.category`）
  - [x] 1.2 创建供应商分析控制器
    - 创建 `fenghua-backend/src/dashboard/supplier-analysis.controller.ts`
    - 实现 `GET /api/dashboard/supplier-analysis` 端点
    - 添加 JWT 认证和角色验证：`@UseGuards(JwtAuthGuard, DirectorOrAdminGuard)`
    - 支持查询参数：
      - `startDate` (可选): 开始日期（ISO 8601 格式）
      - `endDate` (可选): 结束日期（ISO 8601 格式）
      - `categoryName` (可选): 产品类别名称
      - `page` (可选): 页码，默认 1
      - `limit` (可选): 每页数量，默认 20，最大 100
    - 返回供应商分析数据：
      ```typescript
      {
        suppliers: Array<{
          supplierId: string;
          supplierName: string;
          orderCount: number;
          orderAmount: number;
          cooperationFrequency: number; // 订单数/天
          lastCooperationDate: string; // ISO 8601
          daysSinceLastCooperation: number;
          stabilityRating: 'HIGH' | 'MEDIUM' | 'LOW' | 'RISK';
          lifetimeValue: number;
        }>;
        total: number;
        page: number;
        limit: number;
      }
      ```
  - [x] 1.3 实现供应商合作趋势查询
    - 在 `supplier-analysis.service.ts` 中实现 `getCooperationTrend()` 方法
    - 返回按时间（周或月）分组的合作频率趋势数据
    - 支持时间范围筛选
    - 实现 `GET /api/dashboard/supplier-analysis/cooperation-trend` 端点

- [x] Task 2: 创建前端供应商分析页面 (AC: 1,2,3)
  - [x] 2.1 创建供应商分析服务
    - 创建 `fenghua-frontend/src/dashboard/services/supplier-analysis.service.ts`
    - 实现 `getSupplierAnalysis()` 函数，调用后端 API
    - 实现 `getCooperationTrend()` 函数，调用后端趋势 API
  - [x] 2.2 创建供应商分析主页面组件
    - 创建 `fenghua-frontend/src/dashboard/pages/SupplierAnalysisPage.tsx`
    - 使用 React Query 管理数据获取和缓存
    - 实现筛选器（时间范围、产品类别）
    - 实现分页功能
    - 实现排序功能
    - 添加加载状态和错误处理
  - [x] 2.3 创建供应商分析可视化组件
    - 创建 `fenghua-frontend/src/dashboard/components/SupplierAnalysisTable.tsx`
    - 显示供应商分析表格，包含所有必需列
    - 实现稳定性评级颜色编码
    - 实现点击供应商名称跳转功能
    - 创建 `fenghua-frontend/src/dashboard/components/CooperationTrendChart.tsx`
    - 使用 Recharts 显示合作趋势图

- [x] Task 3: 添加路由和导航 (AC: 1)
  - [x] 3.1 添加供应商分析路由
    - 在 `fenghua-frontend/src/App.tsx` 中添加 `/dashboard/supplier-analysis` 路由
    - 添加 `ProtectedRoute` 和 `requiredRoles={['ADMIN', 'DIRECTOR']}` 保护
  - [x] 3.2 添加导航菜单项
    - 在 `fenghua-frontend/src/components/layout/MainLayout.tsx` 中添加"供应商分析"菜单项
    - 仅对总监和管理员显示

- [x] Task 4: 实现导出功能 (AC: 4)
  - [x] 4.1 实现后端导出端点
    - 在 `supplier-analysis.controller.ts` 中实现 `GET /api/dashboard/supplier-analysis/export` 端点
    - 支持 `format=csv` 查询参数
    - 返回 CSV 格式的供应商分析数据
    - 添加数据量限制（最大 50000 条）
  - [x] 4.2 实现前端导出功能
    - 在 `SupplierAnalysisPage.tsx` 中添加"导出 CSV"按钮
    - 实现导出功能，调用后端导出端点
    - 处理导出错误和加载状态

- [x] Task 5: 性能优化
  - [x] 5.1 优化数据库查询
    - 创建数据库索引优化供应商分析查询
    - 创建迁移文件 `fenghua-backend/migrations/025-add-supplier-analysis-indexes.sql`
    - 添加复合索引：`product_customer_interactions(customer_id, interaction_type, interaction_date)` WHERE `customer_type = 'SUPPLIER'`
    - 添加索引：`products(category)` WHERE `deleted_at IS NULL`
  - [x] 5.2 优化前端加载
    - 使用 React Query 的 `staleTime` 和 `gcTime` 配置缓存
    - 实现组件懒加载（`React.lazy`）
    - 添加骨架屏加载状态

- [ ] Task 6: 测试和文档
  - [x] 6.1 更新 Story 文件
    - 标记所有任务为完成
    - 添加文件列表
    - 更新状态为 `done`
  - [x] 6.2 创建手动测试指南
    - 创建 `_bmad-output/test-reports/story-8-4-manual-testing-guide.md`
    - 包含所有验收标准的测试用例
  - [x] 6.3 手动测试指南
    - 测试供应商分析数据展示
    - 测试筛选和排序功能
    - 测试稳定性评级计算
    - 测试合作趋势图
    - 测试导出功能
    - 测试权限控制

## Dev Notes

### 架构约束
- 使用 `DirectorOrAdminGuard` 保护所有供应商分析端点
- 使用 `PermissionService.getDataAccessFilter()` 进行数据访问控制
- 使用原生 PostgreSQL 查询（`pg.Pool`）进行复杂聚合查询
- 使用 Redis 缓存查询结果（如果可用）

### 技术栈
- **后端:** NestJS, PostgreSQL, Redis (可选), `class-validator`, `class-transformer`
- **前端:** React, TypeScript, React Query, Recharts, React Router

### 数据库表结构
- `companies` 表：
  - `id` (UUID): 供应商 ID
  - `name` (VARCHAR): 供应商名称
  - `customer_type` (ENUM): 客户类型，值为 `'SUPPLIER'` 时表示供应商
  - `deleted_at` (TIMESTAMP): 软删除时间戳
- `product_customer_interactions` 表：
  - `id` (UUID): 互动记录 ID
  - `customer_id` (UUID): 客户/供应商 ID（外键到 `companies.id`）
  - `product_id` (UUID): 产品 ID
  - `interaction_type` (ENUM): 互动类型，`'ORDER_SIGNED'` 或 `'ORDER_COMPLETED'` 表示订单
  - `interaction_date` (DATE): 互动日期
  - `additional_info` (JSONB): 额外信息，可能包含 `orderAmount` 或 `amount` 字段
  - `deleted_at` (TIMESTAMP): 软删除时间戳
- `products` 表：
  - `id` (UUID): 产品 ID
  - `category` (VARCHAR): 产品类别
  - `deleted_at` (TIMESTAMP): 软删除时间戳

### 订单金额提取逻辑
- 从 `product_customer_interactions.additional_info` JSONB 字段中提取订单金额
- 优先使用 `orderAmount` 字段，如果不存在则使用 `amount` 字段
- 如果两个字段都不存在，则订单金额为 0

### 合作稳定性评级规则
- **HIGH (高):** 最近 30 天内有合作且合作频率 >= 0.1 单/天
- **MEDIUM (中):** 最近 60 天内有合作（但不符合 HIGH 条件）
- **LOW (低):** 最近 90 天内有合作（但不符合 MEDIUM 条件）
- **RISK (风险):** 超过 90 天无合作

**注意:** 此评级规则与客户分析的"流失风险"概念相似，但术语不同。合作稳定性更侧重于供应商的持续合作能力，而流失风险更侧重于客户的流失可能性。

### 合作频率计算
- 如果订单数 > 1，使用 `(订单数 - 1) / (最后订单日期 - 第一订单日期)` 计算平均订单间隔，然后转换为"每天订单数"
- 如果只有 1 个订单或未指定时间范围，使用 `订单数 / 时间范围天数`

### 参考实现
- 参考 `customer-analysis.service.ts` 的实现模式
- 参考 `product-association-analysis.service.ts` 的筛选和聚合逻辑
- 参考 `dashboard.service.ts` 的权限检查和缓存实现

### 交货及时率计算（可选，如果系统有验收记录数据）
**注意:** 当前 Story 主要关注供应商订单统计和合作稳定性。交货及时率计算需要关联验收记录（`interaction_type = 'PRE_SHIPMENT_INSPECTION'`），如果系统没有验收记录数据，此功能可以标记为"待实现"或简化实现。

**如果系统有验收记录数据，实现逻辑如下:**
- 查询供应商的所有订单（`interaction_type IN ('ORDER_SIGNED', 'ORDER_COMPLETED')`）
- 关联对应的验收记录（`interaction_type = 'PRE_SHIPMENT_INSPECTION'`，通过 `product_id` 和 `customer_id` 关联）
- 判断"按时交货"：验收日期 <= 订单中约定的交货日期（从 `additional_info` 中提取 `expectedDeliveryDate` 或 `deliveryDate`）
- 计算交货及时率 = (按时交货次数 / 总交货次数) × 100%

**SQL 查询示例（如果系统有验收记录）:**
```sql
WITH supplier_orders AS (
  SELECT 
    pci.customer_id as supplier_id,
    pci.id as order_id,
    pci.interaction_date as order_date,
    (pci.additional_info->>'expectedDeliveryDate')::date as expected_delivery_date
  FROM product_customer_interactions pci
  WHERE pci.interaction_type IN ('ORDER_SIGNED', 'ORDER_COMPLETED')
    AND pci.customer_id IN (SELECT id FROM companies WHERE customer_type = 'SUPPLIER')
    AND pci.deleted_at IS NULL
),
inspection_records AS (
  SELECT 
    pci.customer_id as supplier_id,
    pci.product_id,
    pci.interaction_date as inspection_date
  FROM product_customer_interactions pci
  WHERE pci.interaction_type = 'PRE_SHIPMENT_INSPECTION'
    AND pci.deleted_at IS NULL
)
SELECT 
  so.supplier_id,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN ir.inspection_date <= so.expected_delivery_date THEN 1 END) as on_time_orders,
  CASE 
    WHEN COUNT(*) > 0 
    THEN ROUND((COUNT(CASE WHEN ir.inspection_date <= so.expected_delivery_date THEN 1 END)::float / COUNT(*)::float * 100)::numeric, 2)
    ELSE 0
  END as on_time_rate
FROM supplier_orders so
LEFT JOIN inspection_records ir ON ir.supplier_id = so.supplier_id
GROUP BY so.supplier_id;
```

### 质量问题率计算（可选，如果系统有验收记录数据）
**注意:** 质量问题率计算需要从验收记录中提取质量问题信息。如果系统没有验收记录数据或验收记录中没有质量问题标记，此功能可以标记为"待实现"。

**如果系统有验收记录数据且包含质量问题标记，实现逻辑如下:**
- 查询供应商的所有订单
- 关联对应的验收记录
- 从验收记录的 `additional_info` 中提取质量问题标记（如 `hasQualityIssue: true` 或 `qualityIssue: 'description'`）
- 计算质量问题率 = (有质量问题的订单数 / 总订单数) × 100%

### 依赖关系
- 依赖 Story 8.1 (业务仪表板概览) - 已完成
- 依赖 Story 8.2 (产品关联分析) - 已完成
- 依赖 Story 8.3 (客户分析) - 已完成

### 文件结构
```
fenghua-backend/
  src/dashboard/
    supplier-analysis.service.ts
    supplier-analysis.controller.ts
    dto/supplier-analysis.dto.ts
  migrations/
    025-add-supplier-analysis-indexes.sql

fenghua-frontend/
  src/dashboard/
    pages/SupplierAnalysisPage.tsx
    components/SupplierAnalysisTable.tsx
    components/CooperationTrendChart.tsx
    services/supplier-analysis.service.ts
```

## File List

### Backend Files
- `fenghua-backend/src/dashboard/dto/supplier-analysis.dto.ts`
- `fenghua-backend/src/dashboard/supplier-analysis.service.ts`
- `fenghua-backend/src/dashboard/supplier-analysis.controller.ts`
- `fenghua-backend/src/dashboard/dashboard.module.ts` (updated)
- `fenghua-backend/migrations/025-add-supplier-analysis-indexes.sql`

### Frontend Files
- `fenghua-frontend/src/dashboard/services/supplier-analysis.service.ts`
- `fenghua-frontend/src/dashboard/components/SupplierAnalysisTable.tsx`
- `fenghua-frontend/src/dashboard/components/CooperationTrendChart.tsx`
- `fenghua-frontend/src/dashboard/pages/SupplierAnalysisPage.tsx`
- `fenghua-frontend/src/App.tsx` (updated)
- `fenghua-frontend/src/components/layout/MainLayout.tsx` (updated)

