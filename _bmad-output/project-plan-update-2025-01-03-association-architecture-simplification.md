# 项目计划更新 - 关联架构简化

**日期：** 2025-01-03  
**更新人：** John (Product Manager)  
**背景：** 团队讨论（Party Mode）决定简化产品-客户关联架构

---

## 决策摘要

经过团队讨论，决定简化产品-客户关联架构，移除"隐式关联"概念。

### 业务规则澄清

1. **互动的对象：** 一定是客户（必须先选择客户）
2. **互动的内容：** 针对某一类或某几类产品（只能选择该客户已关联的产品）
3. **创建互动的前提：** 产品和客户之间必须已有关联
4. **多产品支持：** 创建互动时可以选择多个产品

### 架构简化决策

- ✅ **移除"隐式关联"概念**：不再通过互动记录自动创建关联
- ✅ **关联只能手动创建**：通过产品管理界面或客户管理界面
- ✅ **简化查询逻辑**：只查询 `product_customer_associations` 表，移除 UNION 查询
- ✅ **简化前端逻辑**：移除 `hasExplicitAssociation` 字段和状态判断

---

## 受影响的 Story

### Story 17.6: 关联关系与互动记录的集成
- **状态变更：** `done` → `deprecated`
- **原因：** 此 Story 实现的自动创建关联逻辑将被移除
- **替代：** Story 17.7 将实现简化后的架构

### Story 17.1: 产品-客户关联数据模型和 API
- **状态：** `review` → 需要更新
- **变更内容：**
  - 更新查询逻辑说明：移除 UNION 查询，只查询 `product_customer_associations` 表
  - 更新 DTO 说明：移除 `hasExplicitAssociation` 字段

### Story 4.1: 互动记录创建（前端）
- **状态：** `done` → 需要更新
- **变更内容：**
  - 产品选择限制为已关联的产品
  - 支持多产品选择
  - 添加空状态提示和快捷操作

### Story 17.7: 简化关联架构 - 移除隐式关联概念（新建）
- **状态：** `ready-for-dev`
- **优先级：** 高
- **依赖：** 无

---

## 实施计划

### Phase 1: 后端简化（Story 17.7 - Task 1, 2）
1. 简化 `getProductAssociations` 和 `getCustomerAssociations` 方法
2. 移除 UNION 查询逻辑
3. 移除 `InteractionsService.create` 中的自动创建关联逻辑
4. 添加关联验证（创建互动前必须已有关联）

### Phase 2: 前端更新（Story 17.7 - Task 3, 4）
1. 更新 `InteractionCreateForm` 组件
2. 限制产品选择为已关联的产品
3. 实现多产品选择功能
4. 添加空状态提示和快捷操作

### Phase 3: 类型和文档更新（Story 17.7 - Task 5, 6）
1. 更新 DTO 和类型定义
2. 移除 `hasExplicitAssociation` 字段
3. 更新代码注释和文档

---

## 技术影响分析

### 后端变更

**文件：** `fenghua-backend/src/products/product-customer-association-management.service.ts`
- `getProductAssociations`: 简化查询，移除 UNION
- `getCustomerAssociations`: 简化查询，移除 UNION

**文件：** `fenghua-backend/src/interactions/interactions.service.ts`
- `create`: 移除自动创建关联逻辑（步骤 5）
- 添加关联验证

**文件：** `fenghua-backend/src/interactions/dto/create-interaction.dto.ts`
- 将 `productId: string` 改为 `productIds: string[]`

### 前端变更

**文件：** `fenghua-frontend/src/interactions/components/InteractionCreateForm.tsx`
- 选择客户后，调用 `GET /api/customers/:id/associations` 获取已关联的产品
- 产品选择器只显示已关联的产品
- 支持多选功能

**文件：** `fenghua-frontend/src/products/components/ProductCustomerAssociation.tsx`
- 移除 `hasExplicitAssociation` 相关逻辑

**文件：** `fenghua-frontend/src/customers/components/CustomerProductAssociation.tsx`
- 移除 `hasExplicitAssociation` 相关逻辑

### 数据库变更

- **无需迁移**：表结构不变
- **查询优化**：简化查询逻辑，性能可能提升

---

## 风险评估

### 低风险
- ✅ 现有数据不受影响（表结构不变）
- ✅ 向后兼容（只需更新前端以匹配新的 API 响应格式）

### 需要注意
- ⚠️ 前端需要更新以移除 `hasExplicitAssociation` 字段的引用
- ⚠️ 需要确保所有关联都是手动创建的（检查现有数据）

---

## 下一步行动

1. **立即开始：** Story 17.7 开发
2. **优先级：** 高（架构简化，影响多个 Story）
3. **预计时间：** 2-3 天
4. **负责人：** Amelia (Developer)

---

## 相关文档

- Story 17.7: `_bmad-output/implementation-artifacts/stories/17-7-simplify-association-architecture-remove-implicit-associations.md`
- Story 17.6: `_bmad-output/implementation-artifacts/stories/17-6-association-and-interaction-integration.md` (deprecated)
- Story 17.1: `_bmad-output/implementation-artifacts/stories/17-1-product-customer-association-data-model-and-api.md`
- Story 4.1: `_bmad-output/implementation-artifacts/stories/4-1-interaction-record-creation-frontend.md`

---

**更新完成时间：** 2025-01-03  
**下次审查：** Story 17.7 完成后

