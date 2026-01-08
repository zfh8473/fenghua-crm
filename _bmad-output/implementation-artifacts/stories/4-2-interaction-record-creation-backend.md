# Story 4.2: 互动记录创建（后端专员 - 供应商互动）

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **后端专员**,
I want **记录与供应商的互动**,
so that **我可以完整记录与供应商的业务往来，包括询价产品、接收报价、产品规格确认、生产进度跟进、发货前验收等**.

## Acceptance Criteria

**AC1: 显示互动记录创建表单**
- **Given** 后端专员已登录系统
- **When** 后端专员访问互动记录页面或点击"记录新互动"
- **Then** 系统显示互动记录创建表单
- **And** 表单包含必填字段：客户（供应商）、产品、互动类型、互动时间
- **And** 表单包含可选字段：互动描述、状态、附件等
- **And** 客户选择器只显示供应商类型的客户
- **And** 互动类型选择器只显示后端专员的互动类型（询价产品、接收报价、产品规格确认、生产进度跟进、发货前验收）

**AC2: 表单验证**
- **Given** 后端专员填写互动记录表单
- **When** 后端专员选择供应商、产品、互动类型（询价产品、接收报价、产品规格确认、生产进度跟进、发货前验收），填写互动描述和互动时间
- **Then** 系统验证所有必填字段已填写
- **And** 系统验证产品关联已填写（FR7, FR21）
- **And** 系统验证所选客户是供应商类型
- **And** 系统验证所选产品存在且为 active 状态

**AC3: 成功创建互动记录**
- **Given** 后端专员提交互动记录表单
- **When** 所有验证通过
- **Then** 系统使用 REST API 创建互动记录
- **And** 互动记录保存到数据库，正确关联到产品和客户
- **And** 系统自动记录创建者（后端专员）和时间戳（FR30, FR31）
- **And** 系统显示成功消息"互动记录创建成功"
- **And** 新互动记录出现在互动历史列表中

**AC4: 验证失败处理**
- **Given** 后端专员提交互动记录表单
- **When** 必填字段缺失或验证失败
- **Then** 系统显示验证错误消息（如"产品关联是必填项"、"所选客户必须是供应商类型"）
- **And** 互动记录不被创建
- **And** 表单保持填写状态，允许后端专员修正错误

**AC5: 产品-客户-互动关联完整性验证**
- **Given** 后端专员创建互动记录
- **When** 系统保存互动记录
- **Then** 系统验证产品-客户-互动关联的完整性（FR116）
- **And** 如果验证失败，系统显示错误消息并阻止保存

## Tasks / Subtasks

- [x] Task 1: 扩展后端 DTO 以支持后端专员互动类型 (AC: #2, #3)
  - [x] 在 `interactions/dto/create-interaction.dto.ts` 中添加 `BackendInteractionType` 枚举
  - [x] 创建联合类型 `InteractionType = FrontendInteractionType | BackendInteractionType`
  - [x] 更新 `CreateInteractionDto` 的 `interactionType` 字段类型为 `InteractionType`
  - [x] **重要：** 使用 `@IsIn()` 装饰器验证所有允许的值（`@IsEnum()` 不支持联合类型）
  - [x] 互动类型枚举值：
    - `PRODUCT_INQUIRY_SUPPLIER = 'product_inquiry_supplier'` (询价产品)
    - `QUOTATION_RECEIVED = 'quotation_received'` (接收报价)
    - `SPECIFICATION_CONFIRMED = 'specification_confirmed'` (产品规格确认)
    - `PRODUCTION_PROGRESS = 'production_progress'` (生产进度跟进)
    - `PRE_SHIPMENT_INSPECTION = 'pre_shipment_inspection'` (发货前验收)
    - `SHIPPED = 'shipped'` (已发货) - 可选，根据 Story 4.2 的 AC，主要关注前 5 种

- [x] Task 2: 扩展前端互动类型枚举和服务 (AC: #1, #2, #3)
  - [x] 在 `interactions/services/interactions.service.ts` 中添加 `BackendInteractionType` 枚举
  - [x] 更新 `CreateInteractionDto` 接口，支持前端和后端两种互动类型
  - [x] 确保前端和后端的互动类型枚举值保持一致

- [x] Task 3: 扩展前端互动记录表单组件以支持后端专员 (AC: #1, #2, #4)
  - [x] 修改 `interactions/components/InteractionCreateForm.tsx`：
    - [x] 根据用户角色（`user.role`）动态显示不同的互动类型选项
    - [x] 如果用户是 `BACKEND_SPECIALIST`，显示后端专员的互动类型选项
    - [x] 如果用户是 `FRONTEND_SPECIALIST`，显示前端专员的互动类型选项（已实现）
    - [x] 更新客户选择器，后端专员只能选择供应商类型的客户（传入 `customerType: 'SUPPLIER'` 到 `CustomerSearch` 组件）
    - [x] **重要：** 根据用户角色动态设置表单默认值：
      - 后端专员默认互动类型为 `BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER`
      - 前端专员默认互动类型为 `FrontendInteractionType.INITIAL_CONTACT`（已实现）
    - [x] 确保表单验证逻辑支持后端专员的互动类型
    - [x] 确保 `useForm` 的 `defaultValues` 根据用户角色动态设置

- [x] Task 4: 验证后端服务已支持后端专员互动类型 (AC: #2, #3, #5)
  - [x] 检查 `InteractionsService.create` 方法是否已支持后端专员的客户类型验证（Story 4.1 已实现）
  - [x] 验证后端服务已正确处理 `BackendInteractionType` 枚举值
  - [x] 确保数据库约束支持后端专员的互动类型（迁移脚本 002 已定义 CHECK constraint）

- [x] Task 5: 更新测试用例以覆盖后端专员场景 (AC: #1, #2, #3, #4, #5)
  - [x] 更新 `interactions/interactions.service.spec.ts`：
    - [x] 添加测试：后端专员成功创建互动记录
    - [x] 添加测试：后端专员选择采购商类型客户应失败
    - [x] 添加测试：后端专员使用后端互动类型创建记录
  - [x] 更新 `interactions/interactions.controller.spec.ts`：
    - [x] 添加测试：后端专员创建互动记录端点
  - [ ] 创建前端组件测试（可选，后续实现）

## Dev Notes

### 现有实现分析

**Story 4.1 已完成的工作：**
- ✅ 后端 `InteractionsService.create` 已实现，支持前端和后端两种角色的客户类型验证
- ✅ 后端已实现基于角色的客户类型过滤（前端专员 → BUYER，后端专员 → SUPPLIER）
- ✅ 前端 `InteractionCreateForm` 已实现，但只支持前端专员的互动类型
- ✅ 前端 `CustomerSearch` 组件已支持基于角色的客户类型过滤
- ✅ 数据库表 `product_customer_interactions` 已存在，支持所有互动类型

**需要扩展的工作：**
- ⚠️ 后端 DTO 只定义了 `FrontendInteractionType`，需要添加 `BackendInteractionType`
- ⚠️ 前端表单只支持前端专员的互动类型，需要根据用户角色动态显示
- ⚠️ 前端服务只定义了 `FrontendInteractionType`，需要添加 `BackendInteractionType`

**数据库约束：**
- 迁移脚本 `002-create-interactions-table.sql` 已定义 CHECK constraint，支持以下互动类型：
  - 采购商互动类型：`initial_contact`, `product_inquiry`, `quotation`, `quotation_accepted`, `quotation_rejected`, `order_signed`, `order_completed`
  - 供应商互动类型：`product_inquiry_supplier`, `quotation_received`, `specification_confirmed`, `production_progress`, `pre_shipment_inspection`, `shipped`

**后端服务验证逻辑（已实现）：**
- `InteractionsService.create` 已实现后端专员的客户类型验证：
  ```typescript
  if (user.role === 'BACKEND_SPECIALIST' && customer.customerType !== 'SUPPLIER') {
    throw new ForbiddenException({
      message: '后端专员只能选择供应商类型的客户',
      code: InteractionErrorCode.INTERACTION_INVALID_CUSTOMER_TYPE,
    });
  }
  ```

### 技术要求和架构约束

**后端架构：**
- 使用 NestJS + TypeScript
- RESTful API（不是 GraphQL）
- 使用原生 PostgreSQL 连接池（`pg.Pool`）查询数据库
- 使用 JWT 认证（`JwtAuthGuard`）
- 使用 `@Token()` 装饰器获取 JWT token

**前端架构：**
- 使用 React 18+ + TypeScript
- 使用 React Hook Form 管理表单状态
- 使用 React Query 管理 API 调用状态
- 使用 Tailwind CSS 样式（自定义设计系统）
- 使用 `useAuth` hook 获取当前用户信息

**API 端点：**
```
POST /api/interactions
Content-Type: application/json
Authorization: Bearer <token>

Request Body:
{
  "productId": "uuid",
  "customerId": "uuid",
  "interactionType": "product_inquiry_supplier" | "quotation_received" | "specification_confirmed" | "production_progress" | "pre_shipment_inspection" | "shipped",
  "interactionDate": "2025-01-03T10:00:00Z",
  "description": "string (optional)",
  "status": "string (optional)",
  "additionalInfo": {} (optional)
}

Response (201 Created):
{
  "id": "uuid",
  "productId": "uuid",
  "customerId": "uuid",
  "interactionType": "product_inquiry_supplier",
  "interactionDate": "2025-01-03T10:00:00Z",
  "description": "string",
  "status": "string",
  "createdAt": "2025-01-03T10:00:00Z",
  "createdBy": "uuid"
}
```

**互动类型枚举（后端专员）：**
```typescript
enum BackendInteractionType {
  PRODUCT_INQUIRY_SUPPLIER = 'product_inquiry_supplier',     // 询价产品
  QUOTATION_RECEIVED = 'quotation_received',                  // 接收报价
  SPECIFICATION_CONFIRMED = 'specification_confirmed',        // 产品规格确认
  PRODUCTION_PROGRESS = 'production_progress',               // 生产进度跟进
  PRE_SHIPMENT_INSPECTION = 'pre_shipment_inspection',       // 发货前验收
  SHIPPED = 'shipped'                                          // 已发货（可选）
}
```

**客户类型过滤：**
- 后端专员（BACKEND_SPECIALIST）：只能选择 `customer_type = 'SUPPLIER'` 的客户
- 使用 `PermissionService.getDataAccessFilter` 获取过滤条件
- 前端使用 `CustomerSearch` 组件时，传入 `userRole` prop 和 `initialFilters={{ customerType: 'SUPPLIER' }}`，组件会自动过滤

**产品关联验证：**
- 产品 ID 是必填项（前端和后端都验证）
- 验证产品存在且为 active 状态（调用 `ProductsService.findOne`）
- 如果产品不存在或非 active，返回 400 Bad Request 错误（错误代码：`INTERACTION_INVALID_PRODUCT = 3003`）

**客户关联验证：**
- 客户 ID 是必填项（前端和后端都验证）
- 客户存在性由数据库外键约束自动验证（迁移脚本 007 已添加外键约束）
- 捕获数据库外键约束错误并转换为友好错误消息
- 验证客户类型与用户角色匹配（前端专员 → BUYER，后端专员 → SUPPLIER）
- 如果客户类型不匹配，返回 403 Forbidden 错误（错误代码：`INTERACTION_INVALID_CUSTOMER_TYPE = 3002`）

**错误代码定义（Interaction 3000-3999）：**
- `INTERACTION_CREATE_FAILED = 3001` - 创建互动记录失败
- `INTERACTION_INVALID_CUSTOMER_TYPE = 3002` - 客户类型不匹配
- `INTERACTION_INVALID_PRODUCT = 3003` - 产品不存在或非 active
- `INTERACTION_MISSING_REQUIRED_FIELD = 3004` - 缺少必填字段

### 项目结构注意事项

**后端文件结构：**
```
fenghua-backend/src/interactions/
  ├── interactions.service.ts          # 互动记录服务（已实现，无需修改）
  ├── interactions.controller.ts       # 互动记录控制器（已实现，无需修改）
  ├── interactions.module.ts           # 互动记录模块（已实现，无需修改）
  ├── dto/
  │   ├── create-interaction.dto.ts   # 创建互动记录 DTO（需要扩展：添加 BackendInteractionType）
  │   └── interaction-response.dto.ts # 互动记录响应 DTO（已实现，无需修改）
  └── interactions.service.spec.ts   # 单元测试（需要扩展：添加后端专员测试用例）
```

**前端文件结构：**
```
fenghua-frontend/src/interactions/
  ├── components/
  │   └── InteractionCreateForm.tsx   # 互动记录创建表单（需要扩展：支持后端专员）
  ├── pages/
  │   ├── InteractionsPage.tsx        # 互动记录列表页面（已实现，无需修改）
  │   └── InteractionCreatePage.tsx  # 互动记录创建页面（已实现，无需修改）
  └── services/
      └── interactions.service.ts     # 互动记录 API 服务（需要扩展：添加 BackendInteractionType）
```

**数据库迁移：**
- 无需创建新的迁移脚本，`product_customer_interactions` 表已存在，支持所有互动类型

### 参考实现

**Story 4.1 学习：**
- 前端表单实现模式：使用 React Hook Form，根据用户角色过滤客户类型
- 后端服务实现模式：使用数据库事务，验证客户类型与用户角色匹配
- 审计日志实现模式：使用 `AuditService.log` 记录操作，使用 try-catch 确保失败不影响主请求

**现有代码参考：**
- `fenghua-backend/src/interactions/dto/create-interaction.dto.ts` - DTO 定义（参考如何定义枚举和验证）
- `fenghua-backend/src/interactions/interactions.service.ts` - 服务实现（参考客户类型验证逻辑）
- `fenghua-frontend/src/interactions/components/InteractionCreateForm.tsx` - 表单组件（参考如何根据用户角色过滤客户）
- `fenghua-frontend/src/customers/components/CustomerSearch.tsx` - 客户搜索组件（参考如何根据用户角色过滤客户类型）
- `fenghua-frontend/src/products/components/ProductCustomerInteractionHistory.tsx` - 互动历史组件（参考后端互动类型定义）

### 测试要求

**后端测试：**
- 单元测试：`interactions.service.spec.ts`
  - **后端专员成功场景：**
    - 测试后端专员使用 `BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER` 创建互动记录成功
    - 测试后端专员使用其他后端互动类型（`QUOTATION_RECEIVED`, `SPECIFICATION_CONFIRMED` 等）创建记录成功
    - 测试后端专员创建记录时自动记录创建者和时间戳
    - 测试后端专员创建记录时记录审计日志
  - **后端专员验证失败场景：**
    - 测试后端专员选择采购商类型客户应失败（返回 403 Forbidden）
    - 测试后端专员使用前端互动类型应失败（DTO 验证失败，返回 400 Bad Request）
    - 测试后端专员选择不存在的客户应失败（外键约束错误，返回 400 Bad Request）
    - 测试后端专员选择非 active 产品应失败（返回 400 Bad Request）
  - **通用测试场景：**
    - 测试产品关联验证失败场景（产品不存在或非 active）
    - 测试客户存在性验证失败场景（客户不存在）
    - 测试数据库事务回滚场景（验证失败时回滚）
    - 测试审计日志记录（异步执行，不阻塞主请求）
- 集成测试：`interactions.controller.spec.ts`
  - **后端专员端点测试：**
    - 测试后端专员 POST /api/interactions 端点成功创建记录
    - 测试后端专员使用有效的后端互动类型和供应商客户创建记录
    - 测试后端专员使用无效的互动类型（前端互动类型）应失败
    - 测试后端专员使用采购商客户应失败
  - **通用端点测试：**
    - 测试权限验证（JWT token 验证）
    - 测试错误处理（400 Bad Request, 403 Forbidden, 500 Internal Server Error）
    - 测试请求体验证（必填字段缺失）

**前端测试：**
- 组件测试：`InteractionCreateForm.test.tsx`（可选，后续实现）
  - **角色相关测试：**
    - 测试后端专员登录时，表单显示后端专员的互动类型选项
    - 测试前端专员登录时，表单显示前端专员的互动类型选项
    - 测试后端专员的默认互动类型为 `PRODUCT_INQUIRY_SUPPLIER`
    - 测试前端专员的默认互动类型为 `INITIAL_CONTACT`
  - **客户选择器测试：**
    - 测试后端专员只能选择供应商类型的客户
    - 测试前端专员只能选择采购商类型的客户
    - 测试客户选择器根据用户角色自动过滤
  - **表单验证测试：**
    - 测试必填字段验证（产品、客户、互动类型、互动时间）
    - 测试后端专员使用后端互动类型验证通过
    - 测试后端专员使用前端互动类型验证失败
  - **提交场景测试：**
    - 测试后端专员提交成功场景（显示成功消息，导航到列表页）
    - 测试后端专员提交失败场景（显示错误消息，表单保持状态）
    - 测试网络错误处理

### 快速参考

**关键代码模式：**

```typescript
// 后端：扩展 DTO 以支持后端互动类型
export enum BackendInteractionType {
  PRODUCT_INQUIRY_SUPPLIER = 'product_inquiry_supplier',
  QUOTATION_RECEIVED = 'quotation_received',
  SPECIFICATION_CONFIRMED = 'specification_confirmed',
  PRODUCTION_PROGRESS = 'production_progress',
  PRE_SHIPMENT_INSPECTION = 'pre_shipment_inspection',
  SHIPPED = 'shipped',
}

// 创建联合类型
export type InteractionType = FrontendInteractionType | BackendInteractionType;

// 所有允许的互动类型值（用于验证）
const ALL_INTERACTION_TYPES = [
  ...Object.values(FrontendInteractionType),
  ...Object.values(BackendInteractionType),
];

// 更新 CreateInteractionDto 的验证
// 注意：@IsEnum() 不支持联合类型，必须使用 @IsIn()
@IsIn(ALL_INTERACTION_TYPES, {
  message: '互动类型无效，必须是前端或后端专员的互动类型',
})
@IsNotEmpty({ message: '互动类型不能为空' })
interactionType: InteractionType;
```

```typescript
// 前端：根据用户角色显示不同的互动类型选项
const INTERACTION_TYPE_OPTIONS_FRONTEND = [
  { value: FrontendInteractionType.INITIAL_CONTACT, label: '初步接触' },
  { value: FrontendInteractionType.PRODUCT_INQUIRY, label: '产品询价' },
  { value: FrontendInteractionType.QUOTATION, label: '报价' },
  { value: FrontendInteractionType.QUOTATION_ACCEPTED, label: '接受报价' },
  { value: FrontendInteractionType.QUOTATION_REJECTED, label: '拒绝报价' },
  { value: FrontendInteractionType.ORDER_SIGNED, label: '签署订单' },
  { value: FrontendInteractionType.ORDER_COMPLETED, label: '完成订单' },
];

const INTERACTION_TYPE_OPTIONS_BACKEND = [
  { value: BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER, label: '询价产品' },
  { value: BackendInteractionType.QUOTATION_RECEIVED, label: '接收报价' },
  { value: BackendInteractionType.SPECIFICATION_CONFIRMED, label: '产品规格确认' },
  { value: BackendInteractionType.PRODUCTION_PROGRESS, label: '生产进度跟进' },
  { value: BackendInteractionType.PRE_SHIPMENT_INSPECTION, label: '发货前验收' },
  { value: BackendInteractionType.SHIPPED, label: '已发货' }, // 可选
];

// 在表单组件中
const { user } = useAuth();

// 根据用户角色动态选择互动类型选项
const interactionTypeOptions = user?.role === 'BACKEND_SPECIALIST' 
  ? INTERACTION_TYPE_OPTIONS_BACKEND 
  : INTERACTION_TYPE_OPTIONS_FRONTEND;

// 根据用户角色动态设置默认互动类型
const defaultInteractionType = user?.role === 'BACKEND_SPECIALIST'
  ? BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER
  : FrontendInteractionType.INITIAL_CONTACT;

const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
} = useForm<CreateInteractionDto>({
  defaultValues: {
    interactionDate: new Date().toISOString().slice(0, 16),
    interactionType: defaultInteractionType, // 根据用户角色动态设置
  },
});

// 在表单渲染中使用动态选项
<select {...register('interactionType', { required: '互动类型不能为空' })}>
  {interactionTypeOptions.map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</select>
```

```typescript
// 前端：客户选择器根据用户角色过滤
// CustomerSearch 组件已实现基于角色的自动过滤，但可以显式传入 initialFilters 以确保一致性
<CustomerSearch
  onSearch={handleCustomerSearch}
  userRole={user?.role}
  initialFilters={{
    // 后端专员只能选择供应商，前端专员只能选择采购商
    // CustomerSearch 组件会根据 userRole 自动过滤，但显式传入可以确保一致性
    customerType: user?.role === 'BACKEND_SPECIALIST' ? 'SUPPLIER' : 'BUYER'
  }}
/>

// 注意：CustomerSearch 组件内部已实现基于角色的过滤逻辑：
// - 前端专员（FRONTEND_SPECIALIST）自动过滤为 BUYER
// - 后端专员（BACKEND_SPECIALIST）自动过滤为 SUPPLIER
// - 总监和管理员可以看到所有类型
```

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (via Cursor)

### Debug Log References

无

### Completion Notes List

**实现完成（2025-01-03）：**
- ✅ 扩展后端 DTO 以支持后端专员互动类型，使用 `@IsIn()` 装饰器验证联合类型
- ✅ 扩展前端互动类型枚举和服务，添加 `BackendInteractionType` 枚举
- ✅ 扩展前端表单组件，根据用户角色动态显示不同的互动类型选项和默认值
- ✅ 添加客户和产品选择的移除按钮（UX 改进）
- ✅ 验证后端服务已支持后端专员互动类型（Story 4.1 已实现）
- ✅ 更新测试用例，添加后端专员成功场景、验证失败场景和审计日志测试
- ✅ 所有后端测试通过（19/19：service 16个，controller 3个）

**代码审查修复（2025-01-03）：**
- ✅ 修复前端表单：用户角色变化时表单默认值不会更新的问题（添加 useEffect 监听）
- ✅ 修复测试问题：移除循环测试中过度使用的 jest.clearAllMocks()
- ✅ 移除未使用的 IsEnum 导入
- ✅ 修复前端验证：在 onSubmit 中添加产品状态验证，防止竞态条件
- ✅ 添加用户角色变化时的表单重置逻辑
- ✅ 添加边界情况测试：DIRECTOR 角色测试和 null/undefined 角色测试
- ✅ 添加 JSDoc 注释
- ✅ 改进类型安全：使用类型定义替代类型断言

**关键实现点：**
- 后端 DTO 使用 `@IsIn()` 装饰器验证联合类型（`@IsEnum()` 不支持联合类型）
- 前端表单使用 `useMemo` 根据用户角色动态选择互动类型选项和默认值
- 客户选择器标签和初始过滤器根据用户角色动态设置
- 测试覆盖了后端专员的所有主要场景

### File List

**后端文件：**
- `fenghua-backend/src/interactions/dto/create-interaction.dto.ts` (修改：添加 BackendInteractionType 枚举，使用 @IsIn() 验证，移除未使用的 IsEnum 导入)
- `fenghua-backend/src/interactions/dto/interaction-response.dto.ts` (修改：更新 interactionType 类型为 InteractionType)
- `fenghua-backend/src/interactions/interactions.service.ts` (修改：添加用户角色验证，确保用户有有效角色)
- `fenghua-backend/src/interactions/interactions.service.spec.ts` (修改：添加后端专员测试用例，添加 DIRECTOR 角色测试，添加 null/undefined 角色测试，修复循环测试中的 mock 清理)
- `fenghua-backend/src/interactions/interactions.controller.spec.ts` (修改：添加后端专员控制器测试)

**前端文件：**
- `fenghua-frontend/src/interactions/services/interactions.service.ts` (修改：添加 BackendInteractionType 枚举和 InteractionType 联合类型)
- `fenghua-frontend/src/interactions/components/InteractionCreateForm.tsx` (修改：根据用户角色动态显示互动类型选项和设置默认值，添加客户和产品移除按钮，添加用户角色变化时的表单重置逻辑，添加产品状态验证，添加 JSDoc 注释，改进类型安全)

