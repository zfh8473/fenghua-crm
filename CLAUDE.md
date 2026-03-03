# CLAUDE.md — fenghua-crm 项目指南

## 项目概述

**fenghua-crm** 是一个为进出口贸易公司定制的私有 CRM 系统，核心场景是管理买家（BUYER）和供应商（SUPPLIER）关系、产品信息、商业互动记录，并提供多维度的数据分析仪表板。

系统采用前后端完全分离架构，单仓库（Monorepo）管理。

---

## 技术栈

### 前端 (`fenghua-frontend/`)
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2 | UI 框架 |
| TypeScript | 5.0 | 类型安全 |
| Vite | 4.4 | 构建工具 |
| Tailwind CSS | 3.4 | 样式（Monday.com 风格设计系统）|
| React Router DOM | 7.x | 前端路由 |
| @tanstack/react-query | 5.x | 服务端状态管理 |
| React Hook Form | 7.x | 表单处理 |
| React Toastify | 11.x | 通知提示 |
| Vitest | 4.x | 单元测试 |

### 后端 (`fenghua-backend/`)
| 技术 | 版本 | 用途 |
|------|------|------|
| NestJS | 10.0 | 后端框架 |
| TypeScript | 5.1 | 类型安全 |
| PostgreSQL | 14+ | 主数据库（Neon 云端或自托管）|
| node-pg | — | 原生 SQL（无 ORM）|
| JWT + bcrypt | — | 认证与密码加密 |
| Redis + BullMQ | — | 缓存与任务队列 |
| xlsx / csv-stringify | — | 数据导入导出 |
| Jest / Supertest | 29.x | 后端测试 |

---

## 目录结构说明

```
fenghua-crm/
├── fenghua-frontend/          # React 前端应用
│   └── src/
│       ├── auth/              # 登录、AuthContext、路由守卫
│       ├── customers/         # 客户管理（公司）
│       ├── people/            # 联系人管理
│       ├── products/          # 产品管理
│       ├── product-categories/# 产品分类
│       ├── interactions/      # 互动记录
│       ├── dashboard/         # 数据分析仪表板
│       ├── users/             # 用户管理（管理员）
│       ├── roles/             # 角色定义
│       ├── import/            # Excel 批量导入 UI
│       ├── export/            # 数据导出 UI
│       ├── gdpr/              # GDPR 合规功能
│       ├── audit-logs/        # 审计日志查看
│       ├── settings/          # 系统设置
│       ├── monitoring/        # 系统监控
│       ├── backup/            # 备份状态
│       ├── restore/           # 数据恢复
│       ├── components/        # 通用 UI 组件（Card、Button、Table 等）
│       ├── utils/             # 工具函数
│       ├── styles/            # 主题配置
│       └── App.tsx            # 路由入口
│
├── fenghua-backend/           # NestJS 后端服务
│   └── src/
│       ├── auth/              # JWT 认证、登录登出
│       ├── users/             # 用户 CRUD
│       ├── roles/             # 角色管理与权限 RBAC
│       ├── permission/        # 权限检查逻辑
│       ├── companies/         # 客户（公司）CRUD
│       ├── people/            # 联系人 CRUD
│       ├── products/          # 产品管理（含多个子服务）
│       ├── product-categories/# 产品分类
│       ├── interactions/      # 互动记录 CRUD
│       ├── dashboard/         # 数据分析服务
│       ├── import/            # Excel 导入（3 种实体类型）
│       ├── export/            # 数据导出
│       ├── audit/             # 审计日志
│       ├── encryption/        # 字段级加密
│       ├── gdpr/              # GDPR 合规
│       ├── data-retention/    # 自动数据清理
│       ├── settings/          # 系统配置
│       ├── monitoring/        # 健康检查与指标
│       ├── backup/            # 定时备份
│       ├── restore/           # 数据恢复
│       ├── security/          # HTTPS 重定向、安全头
│       ├── common/            # 共享工具、Redis 客户端
│       ├── app.module.ts      # 根模块
│       └── main.ts            # 启动入口
│
├── docs/                      # 50+ 技术文档（架构、部署、API 测试等）
├── scripts/                   # 运维自动化脚本
├── test-data/                 # 测试数据与 fixtures
├── _bmad-output/              # BMad AI 设计文档输出
└── _backup/                   # 备份文件
```

---

## 核心模块

### 1. 认证与授权（RBAC）
- JWT 无状态认证，令牌有效期 7 天（可配置）
- 4 个角色，权限逐层递减：
  - **ADMIN**：全部权限，包括用户/产品管理和系统设置
  - **DIRECTOR**：查看全部数据和分析仪表板
  - **FRONTEND_SPECIALIST**：只能看到 BUYER 类客户数据
  - **BACKEND_SPECIALIST**：只能看到 SUPPLIER 类客户数据
- 后端通过 Guard + Decorator 在路由层强制执行权限

### 2. 客户管理
- 公司分两种类型：`BUYER`（买家）和 `SUPPLIER`（供应商）
- 自动生成客户编号（BUYER001、SUPPLIER001...）
- 数据层按角色过滤：专员只能访问对应类型的客户

### 3. 产品管理（仅 ADMIN）
- 以 HS 编码（海关编码）为唯一标识
- 支持产品分类、状态管理（active / inactive / archived）
- 产品与客户之间存在多对多关联

### 4. 互动记录
- 记录产品与客户之间的商业互动，是系统的核心数据
- 13 种互动类型，覆盖买家侧和供应商侧全流程：
  - 买家侧：`initial_contact` → `product_inquiry` → `quotation` → `quotation_accepted/rejected` → `order_signed` → `order_completed`
  - 供应商侧：`product_inquiry_supplier` → `quotation_received` → `specification_confirmed` → `production_progress` → `pre_shipment_inspection` → `shipped`
- 支持按类型、日期、客户、状态等多维度搜索
- 支持批量为多个产品创建互动记录

### 5. 数据分析仪表板（仅 DIRECTOR）
- 产品关联分析：产品与客户的关系网络
- 客户分析、供应商分析、买家分析
- 业务趋势分析（时间维度）

### 6. 数据导入 / 导出
- 支持 Excel 批量导入：客户、产品、互动记录（3 种模板）
- 支持导出为 Excel / CSV
- GDPR 合规：支持个人数据导出和删除申请

### 7. 系统管理
- 用户和角色管理
- 系统设置
- 审计日志（记录所有 GET / POST / PUT / DELETE 操作）
- 数据库备份与恢复
- 系统健康监控

---

## 数据模型（核心表）

```
users              → 用户（UUID 主键，软删除）
roles              → 角色（ADMIN, DIRECTOR, FRONTEND_SPECIALIST, BACKEND_SPECIALIST）
user_roles         → 用户角色关联（多对多）
companies          → 客户/公司（customer_type: BUYER | SUPPLIER）
people             → 联系人（归属于 company_id）
products           → 产品（hs_code 唯一，workspace_id 预留多租户）
product_categories → 产品分类
product_customer_interactions → 互动记录（核心业务表）
product_customer_associations → 产品-客户关联
file_attachments   → 文件附件
audit_logs         → 审计日志
```

**通用字段约定：**
- 主键：`id UUID`
- 软删除：`deleted_at TIMESTAMP`（所有查询加 `WHERE deleted_at IS NULL`）
- 审计字段：`created_at`, `updated_at`, `created_by`, `updated_by`
- 多租户预留：`workspace_id UUID`

---

## 代码规范与设计模式

### 后端（NestJS）

**分层架构：**
```
Controller（HTTP 路由）
    ↓ 注入
Service（业务逻辑）
    ↓ 直接 SQL
pg.Pool（数据库访问，无 ORM）
```

**命名规范：**
- 类名：PascalCase（`ProductsService`, `CreateProductDto`）
- 变量/方法：camelCase（`findAll`, `createProduct`）
- 常量/枚举：UPPER_SNAKE_CASE（`ADMIN`, `INITIAL_CONTACT`）
- 文件名：kebab-case（`products.service.ts`, `create-product.dto.ts`）

**DTO 规范：**
- 输入 DTO：`CreateXxxDto`, `UpdateXxxDto`, `XxxQueryDto`
- 输出 DTO：`XxxResponseDto`

**错误处理：**
```typescript
throw new BadRequestException('Invalid input');
throw new NotFoundException('Record not found');
throw new ForbiddenException('Access denied');
```

**日志：**
```typescript
private readonly logger = new Logger(ProductsService.name);
```

**拦截器（全局应用）：**
- `DataAccessAuditInterceptor`：记录所有 GET 请求
- `DataModificationAuditInterceptor`：记录所有写操作
- `EncryptionInterceptor / DecryptionInterceptor`：敏感字段加解密

### 前端（React）

**组件规范：**
- 函数式组件 + Hooks（无 class 组件）
- 文件名：PascalCase（`CustomerManagementPage.tsx`）
- 默认导出

**API 服务层：**
- 每个模块有独立的 Service 类（如 `CustomersService`）
- 封装 Bearer token 认证头
- 统一错误处理

**状态管理：**
- 服务端状态：React Query（`useQuery`, `useMutation`）
- 认证状态：React Context（`useAuth()` hook）
- 本地 UI 状态：`useState`

**路由：**
- 路由定义在 `App.tsx`
- 权限路由通过 AuthContext 的角色判断控制渲染

---

## 开发注意事项

### 启动开发环境
```bash
# 后端（端口 3001）
cd fenghua-backend
npm run start:dev

# 前端（端口 3005，/api 代理到 3001）
cd fenghua-frontend
npm run dev
```

### 环境变量（后端 .env）
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@host:5432/fenghua_crm
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3005
```

### 数据库操作原则
- **不使用 ORM**，全部手写 SQL，通过 `pg.Pool` 执行
- 所有删除操作使用软删除（更新 `deleted_at`）
- 查询必须加 `WHERE deleted_at IS NULL`

### 部署
- 推荐：Vercel（前端静态部署）+ Neon（Serverless PostgreSQL）
- 备选：Railway、Docker/自托管

### 新增功能时的标准流程
1. 后端：创建 Module → Controller → Service → DTO → 注册到 AppModule
2. 前端：创建 Service 类（API 调用）→ 创建 Page 组件 → 注册路由到 App.tsx
3. 权限：在 Controller 加 Guard，在 Service 加角色过滤逻辑

---

## 参考文档

- `docs/api-integration-architecture.md` — 架构概览
- `docs/database-schema-design.md` — 完整数据库 Schema
- `docs/quick-start-guide.md` — 快速启动
- `docs/vercel-deployment-guide.md` — Vercel 部署
- `docs/license-compliance-guide.md` — 开源合规（AGPL vs 私有代码分离）
