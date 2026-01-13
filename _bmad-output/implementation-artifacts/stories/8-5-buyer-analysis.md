# Story 8.5: 采购商分析

Status: done

## Code Review

**Review Date:** 2026-01-12  
**Review Status:** ✅ APPROVED with Recommendations  
**Review Report:** `_bmad-output/code-reviews/story-8-5-code-review.md`

**Critical Issues Found:** 0  
**High Priority Issues:** 1 (已修复)  
**Medium Priority Issues:** 2 (已修复)  
**Low Priority Issues:** 2 (可选)

**Key Findings:**
- ✅ Good code structure and error handling
- ✅ Proper permission control and security practices
- ✅ Performance optimizations implemented (Redis cache, database indexes, lazy loading)
- ⚠️ Export data limit check should be performed before query execution (currently checked after query)
- ✅ Request retry mechanism confirmed implemented
- ✅ Activity level calculation logic correct
- ✅ Churn risk calculation logic correct
- ✅ Export data limit check fixed (check before query execution)
- ✅ Activity trend query logic fixed
- ✅ Activity trend data validation improved

## User Story

**As a** 总监或管理员  
**I want to** 查看采购商分析数据，包括采购商订单统计、订单频率、活跃度、流失风险等指标  
**So that** 我可以评估采购商价值，制定精准的销售策略

## Acceptance Criteria

### AC1: 采购商分析基础显示
**Given** 用户已登录且角色为总监或管理员  
**When** 用户访问采购商分析页面  
**Then** 系统显示采购商分析表格，包含以下列：
- 采购商名称
- 采购商类型（BUYER）
- 订单量（该采购商相关的订单互动记录数）
- 订单金额（从互动记录的 `additional_info` 中提取的订单金额总和）
- 订单频率（订单数 / 时间范围天数，或使用平均订单间隔）
- 最后互动日期
- 距离最后互动天数
- 活跃度（基于最近 30 天互动记录频率）
- 流失风险（基于最后互动时间的风险评级）
- 采购商生命周期价值（累计订单金额）

### AC2: 采购商分析数据展示和筛选
**Given** 用户已登录且角色为总监或管理员  
**When** 用户在采购商分析页面
**Then** 系统支持以下筛选功能：
- 按时间范围筛选（基于 `product_customer_interactions.interaction_date`）
- 按产品类别筛选（基于 `products.category`）
- 支持分页显示（默认每页 20 条，最大 100 条）
- 支持按订单金额、订单量、订单频率等字段排序
- 点击采购商名称可跳转到客户详情页面

### AC3: 采购商活跃度计算和展示
**Given** 用户已登录且角色为总监或管理员  
**When** 用户查看采购商分析数据  
**Then** 系统计算并显示采购商活跃度：
- 活跃度 = (最近 30 天互动记录数 / 总互动记录数) × 100%
- 活跃度评级：高（>= 30%）、中（10-30%）、低（< 10%）
- 活跃度评级使用颜色编码显示（高=绿色，中=蓝色，低=黄色）
- 系统显示采购商活跃度趋势图（按时间展示活跃度变化）

### AC4: 采购商流失风险计算和展示
**Given** 用户已登录且角色为总监或管理员  
**When** 用户查看采购商分析数据  
**Then** 系统计算并显示采购商流失风险：
- 流失风险评级：无风险（最近 30 天内有互动）、低风险（30-60 天）、中风险（60-90 天）、高风险（超过 90 天无互动）
- 流失风险评级使用颜色编码显示（无风险=绿色，低风险=黄色，中风险=橙色，高风险=红色）
- 系统显示采购商流失率趋势图（按时间展示流失率变化）

### AC5: 采购商分析数据导出
**Given** 用户已登录且角色为总监或管理员  
**When** 用户点击"导出"按钮  
**Then** 系统支持导出采购商分析数据：
- 支持 CSV 格式导出
- 导出数据包含所有筛选后的采购商分析指标
- 导出文件名包含当前日期
- 导出数据量限制：最大 50000 条（超过限制时提示用户缩小筛选范围）

## Tasks / Subtasks

- [x] Task 1: 创建后端采购商分析 API (AC: 1,2,3,4)
  - [ ] 1.1 创建采购商分析服务模块
    - 创建 `fenghua-backend/src/dashboard/buyer-analysis.service.ts`
    - 注入 `PermissionService` 和 `ConfigService`
    - 实现采购商分析统计查询：
      - 查询每个采购商的订单量（`interaction_type` 为 `ORDER_SIGNED` 或 `ORDER_COMPLETED` 的互动记录数，且 `customer_type` 为 `BUYER`）
      - 查询每个采购商的订单金额（从 `additional_info` JSONB 字段中提取 `orderAmount` 或 `amount`，如果存在）
      - 查询每个采购商的订单频率（订单数 / 时间范围天数，或使用平均订单间隔）
      - 查询每个采购商的最后互动日期（用于流失风险计算）
      - 计算采购商活跃度（最近 30 天互动记录数 / 总互动记录数）
      - 计算采购商流失风险（基于最后互动日期）
    - 使用 `PermissionService.getDataAccessFilter(token)` 获取数据访问过滤器
    - 使用 PostgreSQL 聚合查询优化性能
    - 支持按时间范围筛选（基于 `product_customer_interactions.interaction_date`）
    - 支持按产品类别筛选（基于 `products.category`）
  - [ ] 1.2 创建采购商分析控制器
    - 创建 `fenghua-backend/src/dashboard/buyer-analysis.controller.ts`
    - 实现 `GET /api/dashboard/buyer-analysis` 端点
    - 添加 JWT 认证和角色验证：`@UseGuards(JwtAuthGuard, DirectorOrAdminGuard)`
    - 支持查询参数：
      - `startDate` (可选): 开始日期（ISO 8601 格式）
      - `endDate` (可选): 结束日期（ISO 8601 格式）
      - `categoryName` (可选): 产品类别名称
      - `page` (可选): 页码，默认 1
      - `limit` (可选): 每页数量，默认 20，最大 100
    - 返回采购商分析数据：
      ```typescript
      {
        buyers: Array<{
          buyerId: string;
          buyerName: string;
          orderCount: number;
          orderAmount: number;
          orderFrequency: number; // 订单数 / 时间范围天数
          lastInteractionDate: string; // ISO 8601 格式
          daysSinceLastInteraction: number;
          activityLevel: number; // 活跃度百分比 (0-100)
          activityRating: 'HIGH' | 'MEDIUM' | 'LOW';
          churnRisk: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
          lifetimeValue: number;
        }>;
        total: number;
        page: number;
        limit: number;
      }
      ```
    - 实现 `GET /api/dashboard/buyer-analysis/activity-trend` 端点
      - 返回采购商活跃度趋势数据（按时间分组）
    - 实现 `GET /api/dashboard/buyer-analysis/churn-trend` 端点
      - 返回采购商流失率趋势数据（按时间分组）
  - [ ] 1.3 创建采购商分析 DTO
    - 创建 `fenghua-backend/src/dashboard/dto/buyer-analysis.dto.ts`
    - 定义 `BuyerAnalysisQueryDto`（查询参数）
    - 定义 `BuyerAnalysisItemDto`（单个采购商分析项）
    - 定义 `BuyerAnalysisResponseDto`（响应数据）
    - 定义 `ActivityTrendItemDto` 和 `ActivityTrendResponseDto`（活跃度趋势）
    - 定义 `ChurnTrendItemDto` 和 `ChurnTrendResponseDto`（流失率趋势）
    - 使用 `class-validator` 验证输入参数
  - [ ] 1.4 实现 Redis 缓存（可选，性能优化）
    - 缓存采购商分析查询结果（5 分钟过期）
    - 缓存键格式：`dashboard:buyer-analysis:{filters}:{page}:{limit}`

- [x] Task 2: 创建前端采购商分析页面 (AC: 1,2,3,4)
  - [ ] 2.1 创建采购商分析服务
    - 创建 `fenghua-frontend/src/dashboard/services/buyer-analysis.service.ts`
    - 实现 `getBuyerAnalysis` 函数（调用后端 API）
    - 实现 `getActivityTrend` 函数（获取活跃度趋势）
    - 实现 `getChurnTrend` 函数（获取流失率趋势）
    - 使用 React Query 进行数据获取和缓存
  - [ ] 2.2 创建采购商分析表格组件
    - 创建 `fenghua-frontend/src/dashboard/components/BuyerAnalysisTable.tsx`
    - 显示采购商分析数据表格
    - 支持排序功能
    - 支持点击采购商名称跳转到客户详情页
    - 使用颜色编码显示活跃度和流失风险
  - [ ] 2.3 创建采购商活跃度趋势图表组件
    - 创建 `fenghua-frontend/src/dashboard/components/ActivityTrendChart.tsx`
    - 使用 Recharts 显示活跃度趋势折线图
    - 支持时间范围筛选
  - [ ] 2.4 创建采购商流失率趋势图表组件
    - 创建 `fenghua-frontend/src/dashboard/components/ChurnTrendChart.tsx`
    - 使用 Recharts 显示流失率趋势折线图
    - 支持时间范围筛选
  - [ ] 2.5 创建采购商分析页面
    - 创建 `fenghua-frontend/src/dashboard/pages/BuyerAnalysisPage.tsx`
    - 集成筛选条件（时间范围、产品类别）
    - 集成采购商分析表格
    - 集成活跃度趋势图表
    - 集成流失率趋势图表
    - 实现分页功能
    - 实现加载状态和错误处理
    - 使用 React Query 的 `useQuery` 进行数据获取
    - 使用 `staleTime` 和 `gcTime` 优化缓存策略

- [x] Task 3: 添加路由和导航 (AC: 1)
  - [ ] 3.1 添加采购商分析路由
    - 在 `fenghua-frontend/src/App.tsx` 中添加路由：`/dashboard/buyer-analysis`
    - 添加权限控制：`allowedRoles={['ADMIN', 'DIRECTOR']}`
  - [ ] 3.2 添加导航菜单项
    - 在 `fenghua-frontend/src/components/layout/MainLayout.tsx` 中添加"采购商分析"菜单项
    - 图标：🛒 或 📊
    - 仅对 ADMIN 和 DIRECTOR 角色显示

- [x] Task 4: 实现导出功能 (AC: 5)
  - [ ] 4.1 后端导出 API
    - 在 `buyer-analysis.controller.ts` 中实现 `GET /api/dashboard/buyer-analysis/export` 端点
    - 支持 `format` 查询参数（目前仅支持 `csv`）
    - 在导出前检查数据量限制（最大 50000 条）
    - 返回 CSV 格式数据
    - 设置正确的响应头：`Content-Type: text/csv; charset=utf-8`
    - 设置文件名：`采购商分析_YYYY-MM-DD.csv`
  - [ ] 4.2 前端导出功能
    - 在 `BuyerAnalysisPage.tsx` 中添加"导出 CSV"按钮
    - 实现导出功能，调用后端导出 API
    - 处理导出错误和加载状态

- [x] Task 5: 性能优化
  - [ ] 5.1 数据库索引优化
    - 创建迁移文件：`026-add-buyer-analysis-indexes.sql`
    - 添加复合索引：`idx_interactions_buyer_type_date`（优化采购商分析查询）
    - 添加产品类别索引（如果尚未存在）
  - [ ] 5.2 前端性能优化
    - 使用 React.lazy 和 Suspense 懒加载图表组件
    - 使用 React Query 的 `staleTime` 和 `gcTime` 优化缓存
    - 实现请求重试机制（使用 React Query 的 `retry` 配置）

- [x] Task 6: 测试和文档
  - [x] 6.1 创建手动测试指南
    - 创建 `_bmad-output/test-reports/story-8-5-manual-testing-guide.md`
    - 包含所有测试用例和验证步骤
  - [x] 6.2 运行数据库迁移
    - 运行 `026-add-buyer-analysis-indexes.sql`
    - 验证索引创建成功
  - [x] 6.3 创建测试验证总结文档
    - 创建 `_bmad-output/test-reports/story-8-5-testing-summary.md`
    - 用于记录测试执行结果
  - [x] 6.4 最终验收
    - 所有任务已完成
    - 代码审查通过（所有高优先级和中优先级问题已修复）
    - 数据库迁移已完成
    - 测试指南已创建
    - Story 状态更新为 `done`

## Dev Notes

### 采购商活跃度计算逻辑
- 活跃度 = (最近 30 天互动记录数 / 总互动记录数) × 100%
- 如果总互动记录数为 0，活跃度设为 0
- 活跃度评级：
  - HIGH: >= 30%
  - MEDIUM: 10% - 30%
  - LOW: < 10%

### 采购商流失风险计算逻辑
- 基于最后互动日期计算：
  - NONE: 最近 30 天内有互动
  - LOW: 30-60 天无互动
  - MEDIUM: 60-90 天无互动
  - HIGH: 超过 90 天无互动

### 订单频率计算逻辑
- 如果采购商有多个订单（> 1），使用平均订单间隔：
  - 订单频率 = 订单数 / (最后订单日期 - 第一订单日期 + 1) 天
- 如果采购商只有 1 个订单或未指定时间范围，使用时间范围：
  - 订单频率 = 订单数 / 时间范围天数

### SQL 查询优化
- 使用 CTE（Common Table Expression）优化复杂查询
- 使用 `FILTER` 子句优化聚合查询
- 使用 `LEFT JOIN` 确保所有采购商都被包含（即使没有订单）

### 参考实现
- 参考 Story 8.3（客户分析）的实现模式
- 参考 Story 8.4（供应商分析）的实现模式
- 保持代码风格和架构一致性

