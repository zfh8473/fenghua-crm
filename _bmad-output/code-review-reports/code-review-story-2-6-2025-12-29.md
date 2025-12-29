# Code Review Report: Story 2.6 - 产品业务流程查看

**Date:** 2025-12-29  
**Story:** 2-6-product-business-process-view  
**Reviewer:** Auto (Cursor AI Assistant)  

## Executive Summary

本次审查覆盖 Story 2.6 “产品业务流程查看”的后端 API、前端时间线视图、路由与集成，重点核对：
- **Acceptance Criteria 是否真实满足**
- **Story 中标记为 [x] 的任务是否真的实现**
- **安全/性能/可维护性/测试覆盖**

**总体结论：Changes Requested（需要修改）**  
存在 **2 个 HIGH**（其中 1 个属于“任务已打勾但未实现”的严重不一致），以及多项 MEDIUM/LOW 问题。

## Review Scope

Story File List 涉及的文件：
- `fenghua-backend/src/products/dto/product-business-process.dto.ts`
- `fenghua-backend/src/products/product-business-process.service.ts`
- `fenghua-backend/src/products/product-business-process.controller.ts`
- `fenghua-backend/src/products/products.module.ts`
- `fenghua-frontend/src/products/components/ProductBusinessProcess.tsx`
- `fenghua-frontend/src/products/ProductBusinessProcessPage.tsx`
- `fenghua-frontend/src/products/components/ProductCustomerAssociation.tsx`
- `fenghua-frontend/src/App.tsx`

## Git vs Story Discrepancies

在当前受限环境中 `git status` 显示大量 `??`（全部未跟踪），无法可靠对比 “实际改动文件” 与 Story File List。  
**结论：无法完成严格的 Git 证据核对（MEDIUM：透明性/可追溯性问题）。**

## Acceptance Criteria Validation

### AC #1/#2/#3（角色 + 采购商/供应商流程）

**PARTIAL**：后端按 `companies.customer_type` 选择 BUYER/SUPPLIER 阶段列表，且权限过滤使用 `PermissionService.getDataAccessFilter()` 进行 customer_type 约束；整体方向正确。  
但对 **customer_type 非 BUYER/SUPPLIER** 的行为未显式处理（见 M3）。

### AC #4（点击阶段查看该阶段互动记录 + 状态颜色）

**PARTIAL（HIGH）**：
- 前端点击阶段会跳转到互动历史页并附带 `stage` 参数：  
  `fenghua-frontend/src/products/components/ProductBusinessProcess.tsx` L78-L84
- 但互动历史页面与请求 **完全忽略 stage**，仍会显示“全量互动历史”，导致 “点击阶段=查看该阶段明细” 实际不成立：  
  `fenghua-frontend/src/products/components/ProductCustomerInteractionHistory.tsx` L182-L190

### AC #5（空状态 + 引导记录第一次互动）

**IMPLEMENTED**：当 `stages` 为空时展示空状态与 “记录新互动” 按钮（前端实现存在）。

## Findings Summary

- **HIGH:** 2
- **MEDIUM:** 3
- **LOW:** 2

## Detailed Findings

### 🔴 HIGH-1：阶段过滤未实现（AC#4 部分缺失）

**问题**：点击阶段跳转时带了 `stage`，但互动历史页/接口没有使用该参数过滤互动记录，用户看到的仍是该产品+客户的全部互动记录。  
**影响**：AC#4 “点击阶段查看该阶段详细互动记录” 不满足；同时 Story Task 3 中宣称 “使用 interactionIds 过滤” 与现实不符。  

**证据：**
- 跳转带 `stage`：`fenghua-frontend/src/products/components/ProductBusinessProcess.tsx` L78-L84  
- 拉取互动历史不带 stage：`fenghua-frontend/src/products/components/ProductCustomerInteractionHistory.tsx` L182-L190

**建议修复方向（择一）：**
- A）前端在互动历史页读取 `stage`，并在前端对 `data.interactions` 做过滤（需要 stage→interactionType 映射）。  
- B）后端互动历史 API 支持 `stage` 或 `interactionType[]` 过滤（更干净，但需要改 API/DTO/SQL）。

### 🔴 HIGH-2：缓存失效逻辑“已勾选但未实现”（任务完成性不真实）

**问题**：Story Task 3 打勾声明实现了 `queryClient.invalidateQueries(...)` 的缓存失效逻辑，但代码中仅有注释，且 `useQueryClient` 也未被使用。  
**影响**：属于“任务标记完成但实际未实现”的严重不一致，会误导后续开发/排障。  

**证据：**
- 未使用的 import：`fenghua-frontend/src/products/components/ProductBusinessProcess.tsx` L8  
- 仅注释提及 invalidateQueries：同文件 L180-L183

**建议修复方向：**
- 如果当前 Story 不包含“创建/更新互动记录”的 mutation：把该项从 Story 勾选改为 action item（或实现一个明确的触发点）。  
- 如果包含：在相关 mutation 成功后实际调用 `invalidateQueries(['product-business-process', productId, customerId])`。

### 🟡 MEDIUM-1：DTO 校验装饰器使用不当（IsEnum）

**问题**：`@IsEnum(['BUYER','SUPPLIER'])` / `@IsEnum(['buyer','supplier'])` 不是 `class-validator` 推荐用法（应传 enum 对象），可能导致校验行为不符合预期。  
**证据**：`fenghua-backend/src/products/dto/product-business-process.dto.ts` L50-L56  
**建议**：改用 `@IsIn(['BUYER','SUPPLIER'])` / `@IsIn(['buyer','supplier'])` 或定义枚举并用 `IsEnum(EnumType)`。

### 🟡 MEDIUM-2：Controller 对 customerId 重复校验/来源不一致

**问题**：controller 同时用 `@Query('customerId', ParseUUIDPipe)` 和 `@Query(ValidationPipe) query: ProductBusinessProcessQueryDto`，但业务逻辑只用前者；这会造成维护成本与潜在不一致。  
**证据**：`fenghua-backend/src/products/product-business-process.controller.ts` L38-L42  
**建议**：二选一：只保留 DTO（并从 `query.customerId` 取值），或只保留 `@Query('customerId', ...)`。

### 🟡 MEDIUM-3：customer_type 非预期值处理缺失

**问题**：service 用 `customerType === 'BUYER' ? BUYER_STAGES : SUPPLIER_STAGES`，遇到其它值会默认为 supplier 流程。  
**证据**：`fenghua-backend/src/products/product-business-process.service.ts` L159-L162  
**建议**：对非 BUYER/SUPPLIER 直接 400/500（视数据约束而定）并记录日志。

### 🟢 LOW-1：无效交互体验（无互动记录阶段仍呈现可点击）

**问题**：无互动记录阶段仍显示 `cursor-pointer` 与 hover 阴影，点击无反馈（handle 内部直接 return）。  
**证据**：`fenghua-frontend/src/products/components/ProductBusinessProcess.tsx` L104-L111  
**建议**：无互动记录时移除 pointer/hover，并加“暂无详情”提示或禁用样式。

### 🟢 LOW-2：可访问性（A11y）细节

**问题**：阶段状态仅靠颜色+符号（✓/⟳/○）区分，未提供屏幕阅读器友好文本。  
**建议**：在状态圆点上加 `aria-label` 或在文案中包含状态描述。

## Test Coverage Review

未发现与 business-process 相关的新增测试文件（repo 现有 spec 主要在 backend 其它模块）。  
前端 `package.json` 没有 `test` script，现有 `*.test.ts` 难以在 CI/本地一致运行。  
**结论：测试覆盖不足（MEDIUM）** —— 至少应为后端 service/controller 增加 spec，用 mock pgPool 或将 stage 计算逻辑抽函数单测。

## Recommendation

优先修复 **HIGH-1 / HIGH-2**，并在修复后再运行一次 code-review 以确认 AC#4 与任务完成性一致。  


