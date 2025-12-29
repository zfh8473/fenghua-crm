# 项目计划更新 - 2025-12-29

## 更新摘要

基于2025-12-29的产品管理模块功能增强讨论，更新了Epic 2的产品管理计划。

---

## 变更内容

### 1. Epic 2 更新

**用户成果更新：**
- 原：管理员可以创建和管理产品，所有用户可以搜索和查看产品信息
- 新：管理员可以创建和管理产品，**维护产品类别和HS编码映射关系**，所有用户可以搜索和查看产品信息

**Story数量：** 7个 → 8个

### 2. 新增Story

**Story 2.8: 产品类别管理**
- 状态：`ready-for-dev`
- 优先级：高（应在Story 2.2之前实现）
- 功能：类别CRUD、类别-HS编码绑定、使用统计、软删除+使用检查

### 3. Story 2.1 更新

**状态变更：** `review` → `in-progress`

**新增功能：**
- 类别-HS编码双向联动（选择类别自动填充HS编码，输入HS编码自动查找类别）
- 产品规格表格化UI（从JSON文本改为动态表格）

**新增Tasks：**
- Task 3.1: 类别-HS编码双向联动
- Task 3.2: 产品规格表格化UI
- Task 5.1: 类别-HS编码双向联动（前端）
- Task 5.2: 产品规格表格化（前端）

---

## 实施优先级

### Phase 1（高优先级）
1. **Story 2.8: 产品类别管理**
   - 数据库迁移和基础CRUD
   - 类别管理页面
   - 使用统计功能

### Phase 2（高优先级）
2. **Story 2.1 增强功能**
   - 类别-HS编码双向联动
   - 产品规格表格化UI

### Phase 3（中优先级）
3. **Story 2.2: 产品搜索**
   - 依赖类别数据（需要在Story 2.8之后）

---

## 依赖关系

```
Story 2.8 (类别管理)
    ↓
Story 2.1 (产品创建 - 需要类别数据)
    ↓
Story 2.2 (产品搜索 - 需要类别数据)
```

---

## 技术决策记录

### 数据库变更
- 新增表：`product_categories`
- 迁移脚本：`009-create-product-categories-table.sql`
- 数据迁移：`010-seed-product-categories.sql`

### 架构变更
- 新增模块：`ProductCategoriesModule`
- 产品服务依赖：`ProductsService` 需要验证类别存在性
- 前端组件：`SpecificationsTable`（可复用）

### 用户体验改进
- 双向联动：类别 ↔ HS编码自动同步
- 表格化输入：产品规格从JSON文本改为表格
- 使用统计：类别列表显示使用情况

---

## 相关文档

- **会议记录：** [meeting-notes-2025-12-29-product-management-enhancements.md](_bmad-output/meeting-notes-2025-12-29-product-management-enhancements.md)
- **Story 2.1：** [2-1-product-creation-and-management.md](_bmad-output/implementation-artifacts/stories/2-1-product-creation-and-management.md)
- **Story 2.8：** [2-8-product-category-management.md](_bmad-output/implementation-artifacts/stories/2-8-product-category-management.md)
- **Epic 2：** [epics.md#Epic-2](_bmad-output/epics.md#epic-2-产品管理)

---

**更新日期：** 2025-12-29  
**更新人：** John (Product Manager)  
**审核：** Travis_z

