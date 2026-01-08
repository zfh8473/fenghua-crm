# Story 17.3: 客户创建时关联产品（前端）

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **所有用户**,
I want **在创建客户时快速关联产品**,
So that **我可以一步完成客户创建和产品关联，提升工作效率**.

## Acceptance Criteria

1. **Given** 用户已登录系统并进入客户创建页面
   **When** 用户填写客户创建表单
   **Then** 表单包含"关联产品"部分（可折叠，默认折叠）
   **And** 用户可以选择展开"关联产品"部分
   **And** "关联产品"部分显示搜索下拉组件（支持多选）
   **And** 搜索下拉组件显示所有 active 状态的产品

2. **Given** 用户在"关联产品"部分搜索产品
   **When** 用户输入产品名称、HS编码或类别
   **Then** 系统显示匹配的产品列表（支持模糊搜索）
   **And** 用户可以选择多个产品
   **And** 系统显示已选择的产品数量："已选择 5 个产品"
   **And** 用户可以取消选择已选产品

3. **Given** 用户填写完客户信息和关联产品
   **When** 用户提交客户创建表单
   **Then** 系统首先创建客户
   **And** 如果用户选择了关联产品，系统为每个产品建立关联关系
   **And** 关联类型根据客户类型自动设置：
     - 采购商：`POTENTIAL_BUYER`
     - 供应商：`POTENTIAL_SUPPLIER`
   **And** 系统显示成功消息："客户创建成功，已关联 X 个产品"
   **And** 如果关联失败，系统显示错误消息，但客户创建成功

4. **Given** 用户未选择关联产品
   **When** 用户提交客户创建表单
   **Then** 系统正常创建客户
   **And** 不建立任何关联关系
   **And** 系统显示成功消息："客户创建成功"

5. **Given** 用户创建客户时关联产品失败
   **When** 客户创建成功但关联失败
   **Then** 系统显示警告消息："客户已创建，但部分产品关联失败"
   **And** 系统提供"在详情页管理关联"的链接
   **And** 用户可以稍后在客户详情页手动建立关联

## Tasks / Subtasks

- [x] Task 1: 创建多选产品搜索组件 (AC: #1, #2)
  - [x] 创建 `products/components/ProductMultiSelect.tsx` 组件
    - [ ] **UI 结构参考：**
      - [ ] 参考 `CustomerMultiSelect` 组件的实现模式（搜索输入框 + 下拉结果列表 + 键盘导航）
      - [ ] 参考 `HsCodeSelect` 组件的实现模式（搜索输入框 + 下拉结果列表 + 键盘导航）
      - [ ] 搜索输入框：使用 `Input` 组件，支持 debounce（500ms，参考 `ProductSearch` 的实现）
      - [ ] 下拉结果列表：使用绝对定位的 `div`，显示匹配的产品列表（参考 `CustomerMultiSelect` 第 270-314 行）
      - [ ] 已选产品标签：显示在搜索输入框下方，每个标签显示产品名称和删除按钮
    - [ ] **搜索功能实现：**
      - [ ] 使用 `productsService.getProducts` 进行搜索（参考 `InteractionCreateForm` 中的产品搜索实现，第 247-278 行）
      - [ ] 实现 debounce（500ms，参考 `ProductSearch` 的实现）
      - [ ] 只显示 `status === 'active'` 的产品（参考 `InteractionCreateForm` 第 269-271 行）
      - [ ] 支持模糊搜索（产品名称、HS编码或类别）
    - [ ] **多选交互实现：**
      - [ ] 点击搜索结果项时，添加到已选列表（如果未选择）
      - [ ] 点击已选产品标签的删除按钮时，从已选列表移除
      - [ ] 显示已选择产品数量："已选择 X 个产品"（显示在搜索输入框下方）
    - [ ] **键盘导航实现：**
      - [ ] Arrow keys：在下拉列表中导航（参考 `CustomerMultiSelect` 第 112-144 行）
      - [ ] Enter：选择当前高亮的产品
      - [ ] Escape：关闭下拉列表
    - [ ] **无障碍访问：**
      - [ ] 添加 ARIA labels（`aria-label`, `aria-expanded`, `aria-haspopup`）
      - [ ] 支持键盘导航（`tabIndex`, `role="option"`）
  - [ ] 组件 Props：
    - [ ] `selectedProducts: Product[]` - 已选择的产品列表
    - [ ] `onChange: (products: Product[]) => void` - 选择变化回调
    - [ ] `placeholder?: string` - 占位符文本（默认："搜索产品名称、HS编码或类别..."）
    - [ ] `disabled?: boolean` - 是否禁用
    - [ ] `error?: boolean` - 是否显示错误状态
    - [ ] `errorMessage?: string` - 错误消息

- [x] Task 2: 扩展客户创建表单 (AC: #1, #2, #3, #4, #5)
  - [ ] 修改 `customers/components/CustomerCreateForm.tsx`
    - [ ] **添加"关联产品"可折叠部分：**
      - [ ] **重要：不使用第三方 Collapsible/Accordion 组件**（代码库中没有，也不应添加）
      - [ ] 使用 `useState` 管理展开/折叠状态：`const [isAssociationExpanded, setIsAssociationExpanded] = useState(false)`
      - [ ] 使用 Tailwind CSS 实现折叠动画：
        - [ ] 使用条件渲染：`{isAssociationExpanded && <div>...</div>}`
        - [ ] 使用 Tailwind 的 `transition` 和 `transform` 类实现平滑动画（参考 `ProductCreateForm` 的实现模式）
        - [ ] 添加展开/折叠按钮（使用 `Button` 组件，显示箭头图标）
      - [ ] 默认折叠状态（`isAssociationExpanded = false`）
    - [ ] 集成 `ProductMultiSelect` 组件
    - [ ] 添加状态管理：`selectedProducts: Product[]`
    - [ ] 在表单提交时处理关联逻辑
  - [ ] 修改 `handleSubmit` 方法：
    - [ ] 首先调用 `customersService.createCustomer` 创建客户
    - [ ] 如果创建成功且有 `selectedProducts`，批量创建关联
    - [ ] 使用 `Promise.allSettled` 处理批量关联（允许部分失败）
    - [ ] 根据关联结果显示不同的成功/警告消息
    - [ ] 如果客户创建成功但关联失败，提供"在详情页管理关联"的链接（使用 toast.info 显示 `Button` 组件）

- [x] Task 3: 创建关联 API 服务方法 (AC: #3)
  - [ ] 在 `customers/customers.service.ts` 中添加关联方法：
    - [ ] `createCustomerProductAssociation(customerId: string, productId: string, associationType: AssociationType): Promise<void>`
    - [ ] 调用后端 `POST /api/customers/:customerId/associations` 端点
    - [ ] 请求体：`{ productId: string, associationType: AssociationType }`
    - [ ] 使用 JWT token 进行认证（使用现有的 `getAuthToken` 方法）
    - [ ] 实现错误处理（400, 403, 404, 500）
  - [ ] **关联类型定义：**
    - [ ] **优先从后端导入：** 检查 `fenghua-backend/src/products/constants/association-types.ts` 是否已导出 `AssociationType`。如果已导出，则在前端 `customers.service.ts` 中导入使用。
    - [ ] **否则在前端定义：** 如果后端未导出，则在 `fenghua-frontend/src/customers/types/association-types.ts` (新建) 中定义 `export type AssociationType = 'POTENTIAL_SUPPLIER' | 'POTENTIAL_BUYER'`，或从 `products/types/association-types.ts` 导入（如果已存在）。

- [x] Task 4: 实现关联逻辑和错误处理 (AC: #3, #4, #5)
  - [ ] 在 `CustomerCreateForm` 中实现关联创建逻辑：
    - [ ] **修改 `handleSubmit` 方法：**
      - [ ] 首先调用 `customersService.createCustomer` 创建客户
      - [ ] 从返回值中获取 `customer.id`：`const createdCustomer = await customersService.createCustomer(submitData)`
      - [ ] 如果创建成功且有 `selectedProducts`，批量创建关联
    - [ ] **关联类型确定：**
      - [ ] 根据客户类型确定关联类型：
        - [ ] `formData.customerType === 'BUYER'` → `'POTENTIAL_BUYER'`
        - [ ] `formData.customerType === 'SUPPLIER'` → `'POTENTIAL_SUPPLIER'`
    - [ ] **批量关联实现：**
      - [ ] 使用 `Promise.allSettled` 批量创建关联（允许部分失败）
      - [ ] **注意：** 关联创建是轻量级操作，不需要限制并发数量
      - [ ] 为每个产品调用：`customersService.createCustomerProductAssociation(createdCustomer.id, product.id, associationType)`
      - [ ] 统计成功和失败的关联数量，并记录失败的详细信息（产品名称和错误消息）
    - [ ] **消息显示和导航：**
      - [ ] 使用 `toast.success` 或 `toast.warning` 显示消息（参考 `ProductCreateForm` 的使用方式）
      - [ ] 显示相应的成功/警告消息：
        - [ ] 全部成功：`CUSTOMER_CREATE_WITH_ASSOCIATIONS_SUCCESS(selectedProducts.length)`
        - [ ] 部分失败：`CUSTOMER_CREATE_ASSOCIATIONS_PARTIAL_FAILURE(successCount, failureCount)`
        - [ ] 全部失败：`CUSTOMER_CREATE_ASSOCIATIONS_ALL_FAILURE`
      - [ ] **导航到客户详情页：**
        - [ ] 导入 `useNavigate`：`import { useNavigate } from 'react-router-dom'`
        - [ ] 客户详情页路由：`/customers/:customerId`（参考 `App.tsx` 中的路由配置）
        - [ ] 如果关联失败（部分或全部），在警告消息中提供链接（使用 toast.info 显示 `Button` 组件，点击后导航到详情页）
        - [ ] 如果全部成功，保持在当前页面（根据 UX 需求）

- [x] Task 5: 添加错误消息常量 (AC: #3, #5)
  - [ ] 在 `common/constants/error-messages.ts` 中添加关联相关的错误消息：
    - [ ] **使用函数形式接受参数（参考现有错误消息的模式）：**
      - [ ] `export const CUSTOMER_CREATE_SUCCESS = '客户创建成功'`（字符串常量）
      - [ ] `export const CUSTOMER_CREATE_WITH_ASSOCIATIONS_SUCCESS = (count: number) => \`客户创建成功，已关联 ${count} 个产品\``（函数）
      - [ ] `export const CUSTOMER_CREATE_ASSOCIATIONS_PARTIAL_FAILURE = (successCount: number, failureCount: number) => \`客户已创建，但部分产品关联失败（成功：${successCount}，失败：${failureCount}）\``（函数）
      - [ ] `export const CUSTOMER_CREATE_ASSOCIATIONS_ALL_FAILURE = '客户已创建，但所有产品关联失败'`（字符串常量）
      - [ ] `export const ASSOCIATION_CREATE_FAILED = (error: string) => \`创建关联失败：${error}\``（函数，如果尚未存在则添加）
      - [ ] `export const MANAGE_ASSOCIATIONS_IN_DETAIL = '在详情页管理关联'`（字符串常量，如果尚未存在则复用）

- [x] Task 6: 更新 UI 和样式 (AC: #1, #2)
  - [ ] 确保"关联产品"部分使用统一的折叠组件样式
    - [ ] 使用 Tailwind CSS 的 `border`, `rounded-monday-md`, `p-monday-4` 等类（参考 `ProductCreateForm` 的实现）
    - [ ] 折叠按钮使用 `Button` 组件，显示箭头图标（展开时向下，折叠时向右）
  - [ ] 确保 `ProductMultiSelect` 组件样式与现有设计系统一致
    - [ ] 使用 `Input` 组件（参考 `CustomerMultiSelect` 的实现）
    - [ ] 下拉列表使用 `bg-monday-surface`, `border-gray-200`, `shadow-monday-lg` 等类（参考 `CustomerMultiSelect` 的样式）
    - [ ] 已选产品标签使用 `bg-monday-bg-secondary`, `rounded-monday-md`, `p-monday-3` 等类（参考 `CustomerMultiSelect` 的实现）
  - [ ] **实现响应式设计（移动端适配）：**
    - [ ] 多选组件在移动端（`max-width: 767px`）：
      - [ ] 搜索输入框使用全宽（`w-full`）
      - [ ] 下拉列表使用全宽，最大高度限制（`max-h-60`）
      - [ ] 已选产品标签支持横向滚动（`overflow-x-auto`, `flex-nowrap`）
    - [ ] 折叠部分在移动端：
      - [ ] 保持默认折叠，但确保折叠按钮足够大（最小 44x44px，符合触摸目标要求）
  - [ ] 添加加载状态指示器（关联创建中）
    - [ ] 在批量关联创建时，显示加载状态（使用 `isSubmitting` 状态）
    - [ ] 在 `ProductMultiSelect` 搜索时，显示加载指示器（参考 `CustomerMultiSelect` 的 `loading` prop）
  - [ ] 添加空状态提示（无产品可选时）
    - [ ] 当搜索结果为空时，显示："未找到匹配的产品"（参考 `CustomerMultiSelect` 第 278-280 行）
    - [ ] 当没有 active 产品时，显示："当前没有可用的产品"

- [ ] Task 7: 添加测试用例 (AC: #1, #2, #3, #4, #5)
  - [ ] 添加 `ProductMultiSelect.test.tsx` 测试：
    - [ ] **多选功能测试：**
      - [ ] 测试选择单个产品
      - [ ] 测试选择多个产品
      - [ ] 测试取消选择已选产品
      - [ ] 测试已选产品数量显示
    - [ ] **搜索功能测试：**
      - [ ] 测试输入搜索关键词触发搜索
      - [ ] 测试 debounce 延迟（500ms）
      - [ ] 测试模糊搜索（产品名称、HS编码、类别）
      - [ ] 测试只显示 active 状态的产品
      - [ ] 测试空搜索结果显示
    - [ ] **键盘导航测试：**
      - [ ] 测试 Arrow keys 导航
      - [ ] 测试 Enter 选择
      - [ ] 测试 Escape 关闭下拉列表
  - [ ] 添加 `CustomerCreateForm.test.tsx` 测试（或更新现有测试）：
    - [ ] **关联产品部分测试：**
      - [ ] 测试折叠部分的显示/隐藏
      - [ ] 测试默认折叠状态
      - [ ] 测试展开/折叠按钮功能
    - [ ] **客户创建和关联测试：**
      - [ ] 测试客户创建成功后的关联创建（全部成功）
      - [ ] 测试客户创建成功但关联部分失败
      - [ ] 测试客户创建成功但关联全部失败
      - [ ] 测试未选择产品时的正常创建（不创建关联）
    - [ ] **错误处理测试：**
      - [ ] 测试客户创建失败时的错误处理
      - [ ] 测试关联创建失败时的警告消息
      - [ ] 测试导航到客户详情页的链接功能
    - [ ] **边界情况测试：**
      - [ ] 测试网络错误时的处理
      - [ ] 测试权限错误时的处理（403）
      - [ ] 测试客户不存在时的处理（404）

## Dev Notes

### Architecture Compliance

**技术栈：**
- React + TypeScript
- React Hook Form（表单管理，如果使用）
- React Query（API 调用和状态管理，如果使用）
- Tailwind CSS（样式）
- React Toastify（消息提示）

**项目结构：**
- 组件文件：`fenghua-frontend/src/products/components/ProductMultiSelect.tsx` (新建)
- 表单文件：`fenghua-frontend/src/customers/components/CustomerCreateForm.tsx`（修改）
- 服务文件：`fenghua-frontend/src/customers/customers.service.ts`（扩展）
- 常量文件：`fenghua-frontend/src/common/constants/error-messages.ts`（扩展）
- 类型文件：`fenghua-frontend/src/customers/types/association-types.ts` (如果后端未导出 AssociationType 且 products/types 不存在则新建)

**UI/UX 设计：**
- 参考 Sally 的 UI 设计：创建时快速关联（可选）
- 使用 `useState` + Tailwind CSS 实现"关联产品"可折叠部分（不使用第三方组件）
- 默认折叠，减少表单复杂度
- 多选组件使用 tag 模式显示已选产品（参考 `CustomerMultiSelect` 的实现）
- 支持搜索和键盘导航（参考 `CustomerMultiSelect` 的实现）

**API 集成：**
- 使用 Story 17.1 创建的关联 API：`POST /api/customers/:id/associations`
- 请求体：`{ productId: string, associationType: 'POTENTIAL_SUPPLIER' | 'POTENTIAL_BUYER' }`
- 响应：`{ id: string, productId: string, customerId: string, associationType: string }`

**错误处理：**
- 客户创建和关联建立分开处理
- 使用 `Promise.allSettled` 允许部分关联失败
- 提供清晰的错误消息和恢复建议
- 使用统一的错误消息常量（函数形式）

### Previous Story Intelligence

**参考 Story 17.2 的实现：**
- `CustomerMultiSelect` 组件的实现模式
- `ProductCreateForm` 中的关联逻辑和错误处理
- Toast 消息的显示方式（使用 `Button` 组件在 toast 中）

**参考 Story 17.1 的实现：**
- 关联 API 端点和请求格式
- 关联类型的定义和使用（优先从后端导入）
- 错误处理和权限验证

**参考 Story 3.1 的实现：**
- `CustomerCreateForm` 的现有实现
- 表单验证和错误处理模式
- 成功消息的显示方式

**参考 Story 4.1 的实现：**
- `InteractionCreateForm` 中的产品搜索实现
- 产品搜索的 debounce 和过滤逻辑

### File Structure Requirements

**前端文件结构：**
```
fenghua-frontend/
├── src/
│   ├── products/
│   │   └── components/
│   │       └── ProductMultiSelect.tsx (新建)
│   ├── customers/
│   │   ├── components/
│   │   │   └── CustomerCreateForm.tsx (修改)
│   │   └── customers.service.ts (扩展)
│   └── common/
│       └── constants/
│           └── error-messages.ts (扩展)
```

**命名约定：**
- 组件：`ProductMultiSelect` (PascalCase)
- 方法：`createCustomerProductAssociation` (camelCase)
- 常量：`CUSTOMER_CREATE_SUCCESS` (UPPER_SNAKE_CASE)

### Testing Requirements

**测试文件位置：**
- 组件测试：`fenghua-frontend/src/products/components/ProductMultiSelect.test.tsx`
- 表单测试：`fenghua-frontend/src/customers/components/CustomerCreateForm.test.tsx`（更新）

**测试覆盖：**
- 单元测试：测试组件功能（多选、搜索、过滤、键盘导航、空状态）
- 集成测试：测试表单提交和 API 调用（客户创建、批量关联成功/部分失败/全部失败、未选择产品）
- 错误处理测试：测试关联失败场景
- 导航测试：验证导航到客户详情页的链接

**Mock 依赖：**
- Mock `customersService.createCustomer`
- Mock `customersService.createCustomerProductAssociation`
- Mock `productsService.getProducts`
- Mock React Query hooks（如果使用）
- Mock `useAuth`
- Mock `useNavigate`

### References

- Epic 17 定义：`_bmad-output/epics.md#epic-17`
- Story 17.3 详细说明：`_bmad-output/epics.md#story-17-3`
- Story 17.2 实现：`_bmad-output/implementation-artifacts/stories/17-2-associate-customers-when-creating-product.md`
- Story 17.1 实现：`_bmad-output/implementation-artifacts/stories/17-1-product-customer-association-data-model-and-api.md`
- 架构设计：`_bmad-output/architecture.md`
- UX 设计：`_bmad-output/ux-design-specification.md`
- 客户创建表单参考：`fenghua-frontend/src/customers/components/CustomerCreateForm.tsx`
- 产品搜索组件参考：`fenghua-frontend/src/products/components/ProductSearch.tsx`
- 客户多选组件参考：`fenghua-frontend/src/customers/components/CustomerMultiSelect.tsx`
- 产品创建表单参考：`fenghua-frontend/src/products/components/ProductCreateForm.tsx`
- 客户服务参考：`fenghua-frontend/src/customers/customers.service.ts`
- 产品服务参考：`fenghua-frontend/src/products/products.service.ts`

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5

### Debug Log References
- 使用 `productsService.getProducts` 进行产品搜索（支持 `status: 'active'` 参数）
- 使用 `AssociationType` 从 `products/types/association-types.ts` 导入
- 客户详情页导航路径：`/customers/:customerId/interactions`（客户互动历史页面）
- API 端点路径：`/customers/:customerId/associations`（不包含 `/api` 前缀）
- 修复了重复声明 `user` 变量的编译错误
- 添加了 UUID 格式验证到 `createCustomerProductAssociation` 方法
- 添加了产品搜索错误处理和用户友好的错误消息
- 优化了 Toast 导航按钮代码，消除重复

### Completion Notes List
1. **ProductMultiSelect 组件：** 成功创建多选产品搜索组件，支持搜索、多选、键盘导航、只显示 active 产品等功能
2. **CustomerCreateForm 扩展：** 添加了可折叠的"关联产品"部分，集成了 ProductMultiSelect 组件
3. **关联 API 服务：** 在 customers.service.ts 中添加了 `createCustomerProductAssociation` 方法
4. **关联逻辑：** 实现了客户创建后的批量关联创建，使用 `Promise.allSettled` 处理部分失败场景
5. **错误消息：** 添加了所有相关的错误消息常量，使用函数形式支持参数化消息
6. **CustomerManagementPage 更新：** 修改了 `handleSubmit` 方法，避免重复创建客户（参考 ProductManagementPage 的实现）
7. **代码审查修复：** 修复了所有代码审查中发现的问题：
   - 添加了完整的 JSDoc 注释到 `ProductMultiSelect` 组件
   - 添加了产品搜索错误处理和用户友好的错误消息
   - 添加了 UUID 格式验证到 `createCustomerProductAssociation` 方法
   - 优化了 Toast 导航按钮代码，消除重复
   - 更新了导航按钮文本为"前往客户互动历史"，更准确地描述导航目标

### File List
- `fenghua-frontend/src/products/components/ProductMultiSelect.tsx` (新建)
- `fenghua-frontend/src/customers/components/CustomerCreateForm.tsx` (修改)
- `fenghua-frontend/src/customers/customers.service.ts` (扩展)
- `fenghua-frontend/src/common/constants/error-messages.ts` (扩展)
- `fenghua-frontend/src/customers/CustomerManagementPage.tsx` (修改)

