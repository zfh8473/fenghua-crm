# Story 4.1: 互动记录创建（前端专员 - 采购商互动）

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **前端专员**,
I want **记录与采购商的互动**,
so that **我可以完整记录与采购商的业务往来，包括初步接触、产品询价、报价、接受/拒绝报价、签署订单、完成订单等**.

## Acceptance Criteria

**AC1: 显示互动记录创建表单**
- **Given** 前端专员已登录系统
- **When** 前端专员访问互动记录页面或点击"记录新互动"
- **Then** 系统显示互动记录创建表单
- **And** 表单包含必填字段：客户（采购商）、产品（多选，只能选择该客户已关联的产品）、互动类型、互动时间
- **And** 表单包含可选字段：互动描述、状态、附件等
- **And** 客户选择器只显示采购商类型的客户
- **And** 选择客户后，产品选择器只显示该客户已关联的产品（支持多选）
- **And** 如果客户没有关联任何产品，显示提示："该客户尚未关联任何产品，请先在产品管理或客户管理界面创建关联"

**AC2: 表单验证**
- **Given** 前端专员填写互动记录表单
- **When** 前端专员选择采购商、产品（多选，只能选择该客户已关联的产品）、互动类型（初步接触、产品询价、报价、接受/拒绝报价、签署订单、完成订单），填写互动描述和互动时间
- **Then** 系统验证所有必填字段已填写
- **And** 系统验证至少选择了一个产品
- **And** 系统验证所选客户是采购商类型
- **And** 系统验证所选产品都是该客户已关联的产品
- **And** 系统验证所选产品存在且为 active 状态

**AC3: 成功创建互动记录**
- **Given** 前端专员提交互动记录表单
- **When** 所有验证通过
- **Then** 系统使用 REST API 创建互动记录
- **And** 互动记录保存到数据库，正确关联到产品和客户
- **And** 系统自动记录创建者（前端专员）和时间戳（FR30, FR31）
- **And** 系统显示成功消息"互动记录创建成功"
- **And** 新互动记录出现在互动历史列表中

**AC4: 验证失败处理**
- **Given** 前端专员提交互动记录表单
- **When** 必填字段缺失或验证失败
- **Then** 系统显示验证错误消息（如"产品关联是必填项"、"所选客户必须是采购商类型"）
- **And** 互动记录不被创建
- **And** 表单保持填写状态，允许前端专员修正错误

**AC5: 产品-客户-互动关联完整性验证**
- **Given** 前端专员创建互动记录
- **When** 系统保存互动记录
- **Then** 系统验证产品-客户-互动关联的完整性（FR116）
- **And** 如果验证失败，系统显示错误消息并阻止保存

## Tasks / Subtasks

- [x] Task 1: 创建后端 Interaction Service 和 Controller (AC: #3, #5)
  - [x] 创建 `interactions/interactions.service.ts` - 实现创建互动记录的业务逻辑
  - [x] 创建 `interactions/interactions.controller.ts` - 实现 REST API 端点 `POST /api/interactions`
  - [x] 创建 `interactions/dto/create-interaction.dto.ts` - 定义创建互动记录的 DTO
  - [x] 创建 `interactions/dto/interaction-response.dto.ts` - 定义互动记录响应 DTO
  - [x] 创建 `interactions/interactions.module.ts` - 注册 Interaction 模块
  - [x] 在 `app.module.ts` 中导入 `InteractionsModule`
  - [x] 初始化 PostgreSQL 连接池（参考 `ProductsService.initializeDatabaseConnection` 模式）
  - [x] 实现产品关联验证（必填项）
  - [x] 实现基于角色的客户过滤（前端专员只能选择采购商）
  - [x] 验证产品存在且为 active 状态（调用 `ProductsService.findOne`）
  - [x] 验证客户存在（通过数据库外键约束自动验证，捕获错误并转换为友好消息）
  - [x] 自动记录创建者（从 JWT token 提取用户 ID）和时间戳

- [x] Task 2: 创建前端互动记录表单组件 (AC: #1, #2, #4)
  - [x] 创建 `interactions/components/InteractionCreateForm.tsx` - 互动记录创建表单组件
  - [x] 使用 React Hook Form 管理表单状态
  - [x] 实现客户选择器（只显示采购商类型的客户，参考 `fenghua-frontend/src/customers/components/CustomerSearch.tsx` 的实现）
  - [x] 实现产品选择器（使用产品搜索功能）
  - [x] 实现互动类型选择器（下拉菜单，包含：初步接触、产品询价、报价、接受/拒绝报价、签署订单、完成订单）
  - [x] 实现互动时间选择器（日期时间选择器，默认当前时间）
  - [x] 实现互动描述输入框（多行文本，可选）
  - [x] 实现状态选择器（可选，文本输入）
  - [x] 实现表单验证（必填字段验证、客户类型验证、产品状态验证）
  - [x] 实现错误消息显示

- [x] Task 3: 创建前端互动记录 API 服务 (AC: #3)
  - [x] 创建 `interactions/services/interactions.service.ts` - 互动记录 API 服务
  - [x] 实现 `createInteraction` 方法 - 调用 `POST /api/interactions`
  - [x] 使用 React Query 管理 API 调用状态
  - [x] 实现成功/失败消息提示

- [x] Task 4: 创建互动记录页面 (AC: #1, #3)
  - [x] 创建 `interactions/pages/InteractionsPage.tsx` - 互动记录列表页面
  - [x] 创建 `interactions/pages/InteractionCreatePage.tsx` - 互动记录创建页面（使用 `InteractionCreateForm` 组件）
  - [x] 在路由中注册互动记录页面：
    - 在 `fenghua-frontend/src/App.tsx` 中添加路由配置（参考现有路由模式）
    - 路由路径：`/interactions`（列表页）和 `/interactions/create`（创建页）
  - [x] 在导航菜单中添加"互动记录"入口：
    - 在 `App.tsx` 的导航菜单组件中添加菜单项（参考现有菜单项实现）
    - 菜单项文本："互动记录"，链接到 `/interactions`
  - [x] 实现互动记录列表显示（后续 story 会实现详细列表功能，这里只需要基本结构）

- [x] Task 5: 实现权限验证和客户类型过滤 (AC: #1, #2, #4)
  - [x] 在后端 `InteractionsService.create` 中验证用户角色
  - [x] 验证前端专员只能选择采购商类型的客户（调用 `PermissionService.getDataAccessFilter`）
  - [x] 验证客户存在且类型匹配：
    - [x] 调用 `CompaniesService.findOne` 获取客户信息（用于友好错误处理）
    - [x] 验证客户类型与用户角色匹配（前端专员 → BUYER，后端专员 → SUPPLIER）
    - [x] 如果客户不存在，数据库外键约束会抛出错误，捕获并转换为友好消息
  - [x] 如果客户类型不匹配，返回 403 Forbidden 错误（错误代码：`INTERACTION_INVALID_CUSTOMER_TYPE = 3002`）

- [x] Task 6: 实现产品关联验证 (AC: #2, #4)
  - [x] 在后端验证产品 ID 存在且为 active 状态（调用 `ProductsService.findOne`）
  - [x] 验证产品关联是必填项（前端和后端都验证）
  - [x] 如果产品不存在或非 active，返回 400 Bad Request 错误（错误代码：`INTERACTION_INVALID_PRODUCT = 3003`）

- [x] Task 7: 实现产品-客户关联验证 (AC: #5)
  - [x] 在 `InteractionsService.create` 中验证产品和客户关联：
    - [x] 验证产品存在且为 active（已在 Task 6 中实现）
    - [x] 验证客户存在（通过数据库外键约束自动验证，已在 Task 5 中实现）
    - [x] 对于单个记录创建，不需要调用批量验证服务 `ProductAssociationIntegrityService.validateProductAssociations`
  - [x] 如果验证失败，返回 400 Bad Request 错误，包含详细错误信息

- [x] Task 8: 实现审计日志记录 (AC: #3)
  - [x] 在 `InteractionsService.create` 中记录互动记录创建操作到审计日志
  - [x] 使用 `AuditService.log` 记录操作（action: 'INTERACTION_CREATED'）
  - [x] 参考 Story 3.8 的审计日志实现模式
  - [x] 确保审计日志失败不影响主请求（使用 try-catch）

- [x] Task 9: 编写测试 (AC: #1, #2, #3, #4, #5)
  - [x] 创建 `interactions/interactions.service.spec.ts` - 单元测试
    - [x] 测试创建互动记录成功场景
    - [x] 测试客户类型验证失败场景
    - [x] 测试产品关联验证失败场景
    - [x] 测试客户存在性验证失败场景（客户不存在）
    - [x] 测试数据库事务回滚场景
  - [x] 创建 `interactions/interactions.controller.spec.ts` - 控制器测试
    - [x] 测试 POST /api/interactions 端点
    - [x] 测试权限验证
    - [x] 测试错误处理
  - [ ] 创建前端组件测试（可选，后续实现）

## Dev Notes

### 现有实现分析

**数据库表结构：**
- `product_customer_interactions` 表已存在（迁移脚本 `002-create-interactions-table.sql`）
- 表结构包含：id, product_id, customer_id, interaction_type, interaction_date, description, status, additional_info, created_at, updated_at, deleted_at, created_by, updated_by
- **注意：** 迁移脚本 007 已移除 `workspace_id` 字段，数据隔离通过 `created_by` 字段实现
- `customer_id` 有外键约束到 `companies` 表（迁移脚本 007 已添加），数据库会自动验证客户存在性
- 互动类型约束已定义（CHECK constraint）：
  - 采购商互动类型：`initial_contact`, `product_inquiry`, `quotation`, `quotation_accepted`, `quotation_rejected`, `order_signed`, `order_completed`
  - 供应商互动类型：`product_inquiry_supplier`, `quotation_received`, `specification_confirmed`, `production_progress`, `pre_shipment_inspection`, `shipped`

**权限和客户类型过滤：**
- `PermissionService.getDataAccessFilter` 已实现基于角色的客户类型过滤
- 前端 `CustomerSearch.tsx` 已实现基于角色的客户类型过滤（参考第 47-51 行）
- RLS 策略已启用（迁移脚本 `013-enable-rls-for-companies.sql`）

**产品关联验证：**
- 对于单个互动记录创建，直接验证产品存在且为 active，客户存在性由数据库外键约束自动验证
- `ProductAssociationIntegrityService.validateProductAssociations` 用于批量验证，不适用于单个记录创建

**审计日志：**
- `AuditService` 已存在（Story 3.8 实现）
- 使用 `AuditService.log` 记录操作，action: 'INTERACTION_CREATED'

### 技术要求和架构约束

**后端架构：**
- 使用 NestJS + TypeScript
- RESTful API（不是 GraphQL）
- 使用原生 PostgreSQL 连接池（`pg.Pool`）查询数据库
- 使用 JWT 认证（`JwtAuthGuard`）
- 使用 `@Token()` 装饰器获取 JWT token
- **数据库连接池初始化：** 参考 `ProductsService.initializeDatabaseConnection` 模式，在构造函数中初始化 `pg.Pool`

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
  "interactionType": "initial_contact" | "product_inquiry" | "quotation" | "quotation_accepted" | "quotation_rejected" | "order_signed" | "order_completed",
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
  "interactionType": "initial_contact",
  "interactionDate": "2025-01-03T10:00:00Z",
  "description": "string",
  "status": "string",
  "createdAt": "2025-01-03T10:00:00Z",
  "createdBy": "uuid"
}
```

**互动类型枚举（前端专员）：**
```typescript
enum FrontendInteractionType {
  INITIAL_CONTACT = 'initial_contact',           // 初步接触
  PRODUCT_INQUIRY = 'product_inquiry',            // 产品询价
  QUOTATION = 'quotation',                        // 报价
  QUOTATION_ACCEPTED = 'quotation_accepted',      // 接受报价
  QUOTATION_REJECTED = 'quotation_rejected',      // 拒绝报价
  ORDER_SIGNED = 'order_signed',                  // 签署订单
  ORDER_COMPLETED = 'order_completed'              // 完成订单
}
```

**客户类型过滤：**
- 前端专员（FRONTEND_SPECIALIST）：只能选择 `customer_type = 'BUYER'` 的客户
- 使用 `PermissionService.getDataAccessFilter` 获取过滤条件
- 前端使用 `CustomerSearch` 组件时，传入 `userRole` prop，组件会自动过滤

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
  ├── interactions.service.ts          # 互动记录服务
  ├── interactions.controller.ts       # 互动记录控制器
  ├── interactions.module.ts           # 互动记录模块
  ├── dto/
  │   ├── create-interaction.dto.ts   # 创建互动记录 DTO
  │   └── interaction-response.dto.ts # 互动记录响应 DTO
  └── interactions.service.spec.ts   # 单元测试
```

**前端文件结构：**
```
fenghua-frontend/src/interactions/
  ├── components/
  │   └── InteractionCreateForm.tsx   # 互动记录创建表单
  ├── pages/
  │   ├── InteractionsPage.tsx        # 互动记录列表页面
  │   └── InteractionCreatePage.tsx   # 互动记录创建页面
  ├── services/
  │   └── interactions.service.ts     # 互动记录 API 服务
  └── hooks/
      └── useInteractions.ts           # 互动记录 React Query hooks（可选）
```

**数据库迁移：**
- 无需创建新的迁移脚本，`product_customer_interactions` 表已存在

### 参考实现

**Story 3.8 学习：**
- 审计日志实现模式：使用 `AuditService.log` 记录操作，使用 try-catch 确保失败不影响主请求
- 从 JWT token 提取用户信息：使用 `@Token()` 装饰器获取 token，然后调用 `AuthService.validateToken` 或类似方法

**Story 2.7 学习：**
- 批量验证模式：`ProductAssociationIntegrityService.validateProductAssociations` 用于批量验证
- 单个记录验证：直接验证产品存在且为 active，客户存在性由外键约束验证
- 错误处理：返回详细的错误信息，包含验证失败的原因

**Story 3.3 学习：**
- 客户类型过滤：使用 `PermissionService.getDataAccessFilter` 获取过滤条件
- 前端客户选择器：参考 `CustomerSearch.tsx` 的实现，传入 `userRole` prop

**现有代码参考：**
- `fenghua-backend/src/companies/companies.service.ts` - 客户服务实现（参考客户创建模式、数据库连接池初始化）
- `fenghua-backend/src/products/products.service.ts` - 产品服务实现（参考产品创建模式、数据库连接池初始化）
- `fenghua-frontend/src/customers/components/CustomerCreateForm.tsx` - 客户创建表单（参考表单实现模式）
- `fenghua-frontend/src/customers/components/CustomerSearch.tsx` - 客户搜索组件（参考客户类型过滤实现）
- `fenghua-frontend/src/App.tsx` - 路由和导航菜单配置（参考路由注册和菜单项添加）

### 测试要求

**后端测试：**
- 单元测试：`interactions.service.spec.ts`
  - 测试创建互动记录成功场景
  - 测试客户类型验证失败场景（前端专员选择供应商）
  - 测试产品关联验证失败场景（产品不存在或非 active）
  - 测试客户存在性验证失败场景（客户不存在）
  - 测试数据库事务回滚场景
  - 测试审计日志记录
- 集成测试：`interactions.controller.spec.ts`
  - 测试 POST /api/interactions 端点
  - 测试权限验证（JWT token 验证）
  - 测试错误处理（400, 403, 500）

**前端测试：**
- 组件测试：`InteractionCreateForm.test.tsx`（可选，后续实现）
  - 测试表单渲染
  - 测试表单验证
  - 测试客户类型过滤
  - 测试提交成功/失败场景

### 快速参考

**关键代码模式：**

```typescript
// 后端：创建互动记录（InteractionsService.create）
async create(createDto: CreateInteractionDto, token: string): Promise<InteractionResponseDto> {
  if (!this.pgPool) {
    throw new BadRequestException('数据库连接未初始化');
  }

  // 使用数据库事务确保数据一致性
  const client = await this.pgPool.connect();
  try {
    await client.query('BEGIN');

    // 1. 验证用户权限
    const user = await this.authService.validateToken(token);
    if (!user || !user.id) {
      throw new UnauthorizedException('无效的用户 token');
    }

    // 2. 验证产品存在且为 active
    const product = await this.productsService.findOne(createDto.productId, token);
    if (!product || product.status !== 'active') {
      throw new BadRequestException({
        message: '产品不存在或非 active 状态',
        code: 3003, // INTERACTION_INVALID_PRODUCT
      });
    }

    // 3. 验证客户存在且类型匹配
    let customer;
    try {
      customer = await this.companiesService.findOne(createDto.customerId, token);
    } catch (error) {
      // 捕获数据库外键约束错误或服务错误，转换为友好消息
      if (error.code === '23503') { // Foreign key violation
        throw new BadRequestException({
          message: '客户不存在',
          code: 3002,
        });
      }
      throw error;
    }

    // 验证客户类型与用户角色匹配
    if (user.role === 'FRONTEND_SPECIALIST' && customer.customerType !== 'BUYER') {
      throw new ForbiddenException({
        message: '前端专员只能选择采购商类型的客户',
        code: 3002, // INTERACTION_INVALID_CUSTOMER_TYPE
      });
    }

    // 4. 创建互动记录
    const insertQuery = `
      INSERT INTO product_customer_interactions 
        (product_id, customer_id, interaction_type, interaction_date, description, status, additional_info, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, product_id, customer_id, interaction_type, interaction_date, description, status, created_at, created_by
    `;
    const result = await client.query(insertQuery, [
      createDto.productId,
      createDto.customerId,
      createDto.interactionType,
      createDto.interactionDate,
      createDto.description || null,
      createDto.status || null,
      createDto.additionalInfo ? JSON.stringify(createDto.additionalInfo) : null,
      user.id,
      new Date(),
    ]);

    const interaction = result.rows[0];
    await client.query('COMMIT');

    // 5. 记录审计日志（不阻塞主请求，异步执行）
    setImmediate(async () => {
      try {
        await this.auditService.log({
          action: 'INTERACTION_CREATED',
          entityType: 'INTERACTION',
          entityId: interaction.id,
          userId: user.id,
          operatorId: user.id,
          timestamp: new Date(),
          metadata: { interactionType: createDto.interactionType },
        });
      } catch (error) {
        this.logger.warn('Failed to log interaction creation', error);
      }
    });

    return {
      id: interaction.id,
      productId: interaction.product_id,
      customerId: interaction.customer_id,
      interactionType: interaction.interaction_type,
      interactionDate: interaction.interaction_date,
      description: interaction.description,
      status: interaction.status,
      createdAt: interaction.created_at,
      createdBy: interaction.created_by,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

```typescript
// 前端：互动记录创建表单（InteractionCreateForm.tsx）
const { user } = useAuth();
const { mutate: createInteraction } = useMutation({
  mutationFn: (data: CreateInteractionDto) => interactionsService.create(data),
  onSuccess: () => {
    toast.success('互动记录创建成功');
    navigate('/interactions');
  },
  onError: (error) => {
    toast.error(error.message || '创建互动记录失败');
  },
});

// 客户选择器（只显示采购商）
<CustomerSearch
  userRole={user?.role}
  onSearch={(filters) => {
    // filters.customerType 会自动设置为 'BUYER'（前端专员）
  }}
/>
```

**常见问题：**
- Q: 如何获取当前用户 ID？
  A: 从 JWT token 提取，使用 `AuthService.validateToken(token)` 获取用户信息，包含 `user.id`。
- Q: 如何验证客户存在性？
  A: 数据库外键约束会自动验证。调用 `CompaniesService.findOne` 用于友好错误处理和类型验证。
- Q: 审计日志失败是否影响主请求？
  A: 不应该影响。使用 `setImmediate` 异步执行审计日志，确保失败时只记录警告，不抛出异常。
- Q: 是否需要使用数据库事务？
  A: 是的。使用事务确保数据一致性，如果任何步骤失败，回滚所有更改。

### 参考资料

- [Source: _bmad-output/epics.md#Story 4.1] - Story 4.1 完整需求
- [Source: _bmad-output/prd.md#FR19] - 前端专员可以记录与采购商的互动
- [Source: _bmad-output/prd.md#FR21] - 所有用户可以在记录互动时关联产品（必填项）
- [Source: _bmad-output/prd.md#FR30] - 系统可以自动记录互动的时间戳
- [Source: _bmad-output/prd.md#FR31] - 系统可以自动记录互动的创建者和修改者
- [Source: _bmad-output/prd.md#FR116] - 自动验证产品-客户-互动关联的数据完整性
- [Source: docs/api-integration-architecture.md] - 原生技术栈架构详细说明
- [Source: fenghua-backend/migrations/002-create-interactions-table.sql] - 互动记录表结构
- [Source: fenghua-backend/src/permission/permission.service.ts] - 权限服务实现
- [Source: fenghua-backend/migrations/007-remove-workspace-dependencies.sql] - 移除 workspace_id 和添加 customer_id 外键约束
- [Source: fenghua-backend/src/products/product-association-integrity.service.ts] - 产品关联批量验证服务（参考，但不用于单个记录创建）
- [Source: fenghua-backend/src/audit/audit.service.ts] - 审计服务实现
- [Source: fenghua-frontend/src/customers/components/CustomerSearch.tsx] - 客户搜索组件（参考客户类型过滤）
- [Source: _bmad-output/implementation-artifacts/stories/3-8-permission-operation-audit-log.md] - Story 3.8 实现参考（审计日志）
- [Source: _bmad-output/implementation-artifacts/stories/2-7-product-association-integrity-validation.md] - Story 2.7 实现参考（产品关联完整性验证）

## Dev Agent Record

### Agent Model Used

Auto (Cursor AI)

### Debug Log References

N/A

### Completion Notes List

**代码审查修复完成时间：** 2025-01-03

**修复总结：**
- ✅ 修复了所有 3 个 CRITICAL 问题
- ✅ 修复了所有 3 个 MEDIUM 问题
- ✅ 所有测试通过（11/11，新增 3 个测试用例）
- ✅ 所有 Acceptance Criteria 已完全实现

**实现完成时间：** 2025-01-03

**实现总结：**
1. ✅ 后端实现完成：
   - 创建了 InteractionsService、InteractionsController、InteractionsModule
   - 实现了数据库连接池初始化
   - 实现了产品、客户验证和权限检查
   - 实现了数据库事务处理
   - 实现了审计日志记录
   - 创建了单元测试和控制器测试

2. ✅ 前端实现完成：
   - 创建了 InteractionsService API 服务
   - 创建了 InteractionCreateForm 表单组件
   - 创建了 InteractionsPage 和 InteractionCreatePage 页面
   - 添加了路由配置和导航菜单项

3. ✅ 测试完成：
   - 后端单元测试通过（6个测试用例）
   - 后端控制器测试创建完成

**技术实现细节：**
- 使用 PostgreSQL 连接池进行数据库操作
- 使用数据库事务确保数据一致性
- 使用 React Hook Form 管理表单状态
- 使用 React Query 管理 API 调用状态
- 实现了基于角色的客户类型过滤
- 实现了产品存在性和状态验证
- 实现了友好的错误处理和消息提示

**代码审查修复（2025-01-03）：**
- ✅ 修复 Task 5-8 子任务标记不一致问题
- ✅ 实现前端产品搜索防抖（500ms 延迟）
- ✅ 实现前端产品状态验证和过滤（只显示 active 产品）
- ✅ 移除未使用的导入（setValue, watch）
- ✅ 修复后端权限检查代码逻辑
- ✅ 添加缺失的测试用例（审计日志、后端专员角色、客户不存在）
- ✅ 所有测试通过（11/11）
- ✅ 安装缺失的依赖（react-hook-form, react-toastify）
- ✅ 添加 ToastContainer 到 main.tsx

### File List

**后端文件：**
- `fenghua-backend/src/interactions/dto/create-interaction.dto.ts`
- `fenghua-backend/src/interactions/dto/interaction-response.dto.ts`
- `fenghua-backend/src/interactions/interactions.service.ts`
- `fenghua-backend/src/interactions/interactions.controller.ts`
- `fenghua-backend/src/interactions/interactions.module.ts`
- `fenghua-backend/src/interactions/interactions.service.spec.ts`
- `fenghua-backend/src/interactions/interactions.controller.spec.ts`
- `fenghua-backend/src/app.module.ts` (修改：添加 InteractionsModule)

**前端文件：**
- `fenghua-frontend/src/interactions/services/interactions.service.ts`
- `fenghua-frontend/src/interactions/components/InteractionCreateForm.tsx` (修改：添加防抖、产品状态过滤)
- `fenghua-frontend/src/interactions/pages/InteractionsPage.tsx`
- `fenghua-frontend/src/interactions/pages/InteractionCreatePage.tsx`
- `fenghua-frontend/src/App.tsx` (修改：添加路由和导航菜单项)
- `fenghua-frontend/src/main.tsx` (修改：添加 ToastContainer)
- `fenghua-frontend/package.json` (修改：添加 react-hook-form 和 react-toastify 依赖)

**代码审查报告：**
- `_bmad-output/code-review-reports/code-review-story-4-1-2025-01-03.md`

