# 原生技术栈架构详细说明

**日期：** 2025-12-26  
**项目：** fenghua-crm  
**架构类型：** 原生技术栈架构（无外部依赖）  
**状态：** 当前架构

> **重要更新：** 本文档已更新以反映移除 Twenty CRM 依赖的决策。  
> 历史版本（API 集成架构）已归档到 `docs/archive/twenty-crm/`  
> 重构计划：`_bmad-output/refactoring-plan-remove-twenty-dependency-2025-12-26.md`

---

## 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    fenghua-crm 系统                      │
│                                                          │
│  ┌──────────────────┐         ┌──────────────────┐    │
│  │ fenghua-frontend │─────────▶│ fenghua-backend  │    │
│  │  (React + Vite)  │  HTTP   │  (NestJS)        │    │
│  │  专有代码        │         │  专有代码        │    │
│  └──────────────────┘         └────────┬─────────┘    │
│                                         │               │
│                                         │ 直接数据库访问 │
│                                         ▼               │
│                                ┌──────────────────┐    │
│                                │  PostgreSQL      │    │
│                                │  (Neon Serverless)│    │
│                                │  独立数据库       │    │
│                                └──────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 组件说明

### 1. fenghua-frontend（定制前端）

**职责：**
- 提供用户界面
- 实现定制 UI 组件（产品管理、快速记录等）
- 通过 REST API 调用后端服务
- 用户认证（NextAuth.js）

**技术栈：**
- React 18+
- TypeScript
- Vite
- Tailwind CSS（自定义设计系统）
- React Query（状态管理）
- NextAuth.js（认证，Vercel 原生支持）

**部署：**
- Vercel（静态文件 + Serverless Functions）

---

### 2. fenghua-backend（定制后端）

**职责：**
- 实现所有业务逻辑
- 用户认证和授权
- 用户管理、角色管理
- 客户管理、联系人管理
- 产品管理、互动记录
- 权限管理和数据隔离

**技术栈：**
- NestJS
- TypeScript
- Prisma/TypeORM（ORM）
- PostgreSQL（直接数据库访问）
- JWT（认证）
- bcrypt（密码加密）

**部署：**
- Vercel（API Routes / Serverless Functions）
- 或独立服务器（如果需要）

**API 设计：**
- RESTful API（标准 HTTP 方法）
- 无 GraphQL（简化架构）

---

### 3. PostgreSQL 数据库（Neon）

**职责：**
- 存储所有业务数据
- 用户、角色、权限数据
- 客户、联系人数据
- 产品、互动记录数据

**技术特性：**
- PostgreSQL 16+
- Serverless（Neon）
- 支持 RLS（Row Level Security）用于数据隔离
- 自动备份和恢复

**数据库架构：**
- 独立数据库（不依赖外部系统）
- 完整的表结构（users, roles, companies, people, products, interactions）

---

## 数据流示例

### 场景：创建产品并关联客户

```
1. 用户在 fenghua-frontend 创建产品
   ↓
2. fenghua-frontend 调用 fenghua-backend API
   POST /api/products
   ↓
3. fenghua-backend 处理业务逻辑
   - 验证数据
   - 验证用户权限
   - 存储到数据库（直接 SQL 查询）
   ↓
4. fenghua-backend 返回结果给前端
   ↓
5. fenghua-frontend 更新 UI
```

**关键差异：**
- ✅ 无需调用外部 API
- ✅ 直接数据库访问（性能更好）
- ✅ 无网络延迟
- ✅ 完整的事务支持

---

## 数据库设计

### 核心表结构

**用户和认证：**
- `users` - 用户表
- `roles` - 角色表
- `user_roles` - 用户角色关联表

**客户管理：**
- `companies` - 客户表（供应商/采购商）
- `people` - 联系人表

**业务数据：**
- `products` - 产品表
- `product_customer_interactions` - 互动记录表
- `file_attachments` - 文件附件表

**系统管理：**
- `audit_logs` - 审计日志表
- `system_settings` - 系统设置表

### 数据隔离策略

**基于角色的数据隔离：**
- 前端专员（FRONTEND_SPECIALIST）：只能访问 `customer_type = 'BUYER'` 的客户
- 后端专员（BACKEND_SPECIALIST）：只能访问 `customer_type = 'SUPPLIER'` 的客户
- 总监（DIRECTOR）和管理员（ADMIN）：可以访问所有客户

**实现方式：**
- 应用层过滤（Service 层）
- 数据库层 RLS（Row Level Security，可选）

---

## API 设计

### RESTful API 端点

**认证：**
```
POST   /api/auth/login          # 用户登录
POST   /api/auth/register       # 用户注册（可选）
POST   /api/auth/logout         # 用户登出
GET    /api/auth/me             # 获取当前用户信息
```

**用户管理：**
```
GET    /api/users               # 获取用户列表
POST   /api/users               # 创建用户
GET    /api/users/:id           # 获取用户详情
PUT    /api/users/:id           # 更新用户
DELETE /api/users/:id           # 删除用户
```

**角色管理：**
```
GET    /api/roles               # 获取角色列表
POST   /api/roles/assign       # 分配角色
DELETE /api/roles/assign       # 移除角色
```

**客户管理：**
```
GET    /api/companies           # 获取客户列表（支持筛选）
POST   /api/companies          # 创建客户
GET    /api/companies/:id      # 获取客户详情
PUT    /api/companies/:id      # 更新客户
DELETE /api/companies/:id      # 删除客户
GET    /api/companies/search   # 搜索客户
```

**联系人管理：**
```
GET    /api/people             # 获取联系人列表
POST   /api/people             # 创建联系人
GET    /api/people/:id         # 获取联系人详情
PUT    /api/people/:id         # 更新联系人
DELETE /api/people/:id         # 删除联系人
```

**产品管理：**
```
GET    /api/products           # 获取产品列表
POST   /api/products           # 创建产品
GET    /api/products/:id      # 获取产品详情
PUT    /api/products/:id       # 更新产品
DELETE /api/products/:id       # 删除产品
GET    /api/products/search   # 搜索产品
```

**互动记录：**
```
GET    /api/interactions       # 获取互动记录列表
POST   /api/interactions       # 创建互动记录
GET    /api/interactions/:id   # 获取互动记录详情
PUT    /api/interactions/:id   # 更新互动记录
DELETE /api/interactions/:id   # 删除互动记录
```

---

## 部署架构

### 开发环境

```bash
# 启动后端
cd fenghua-backend
npm install
npm run start:dev

# 启动前端
cd fenghua-frontend
npm install
npm run dev
```

**数据库：**
- Neon PostgreSQL（开发环境）
- 本地 PostgreSQL（可选）

### 生产环境（Vercel）

**架构：**
```
┌─────────────────┐
│  Vercel         │
│                 │
│  ┌───────────┐ │
│  │ Frontend  │ │  ← 静态文件
│  │ (React)   │ │
│  └───────────┘ │
│                 │
│  ┌───────────┐ │
│  │ Backend   │ │  ← API Routes
│  │ (NestJS)  │ │
│  └───────────┘ │
└─────────────────┘
        │
        │ API calls
        ▼
┌─────────────────┐
│  Neon PostgreSQL│  ← Serverless Database
│  (Serverless)   │
└─────────────────┘
```

**优势：**
- ✅ 无需 Docker 容器
- ✅ Vercel 原生支持
- ✅ 自动扩展
- ✅ 全球 CDN
- ✅ 零配置部署

---

## 开发工作流

### 1. 设置开发环境

```bash
# 克隆项目
git clone <repository-url>
cd fenghua-crm

# 安装后端依赖
cd fenghua-backend
npm install

# 安装前端依赖
cd ../fenghua-frontend
npm install

# 配置环境变量
# 复制 .env.example 到 .env.development
# 设置 DATABASE_URL 和 JWT_SECRET

# 运行数据库迁移
cd ../fenghua-backend
npm run migration:run

# 启动后端
npm run start:dev

# 启动前端（新终端）
cd ../fenghua-frontend
npm run dev
```

### 2. 开发新功能

- 在 `fenghua-backend` 中实现业务逻辑
- 在 `fenghua-frontend` 中实现 UI
- 直接调用后端 API（无需外部依赖）

### 3. 测试

- 单元测试：测试业务逻辑
- 集成测试：测试 API 端点
- E2E 测试：测试完整流程

---

## 优势总结

### 技术优势

1. **完全控制**：无外部依赖，完全控制代码和数据
2. **性能优秀**：直接数据库访问，无 API 调用延迟
3. **部署简单**：Vercel 原生支持，无需 Docker
4. **架构清晰**：单一数据库，简单明了
5. **易于维护**：无集成问题，易于调试

### 业务优势

1. **开发效率**：无集成问题，开发速度更快
2. **成本降低**：无需额外的服务器（Docker 容器）
3. **可扩展性**：可以根据需求自由扩展
4. **灵活性**：不受外部系统限制

---

## 技术栈对比

| 特性 | 旧架构（Twenty CRM） | 新架构（原生技术栈） |
|------|-------------------|-------------------|
| **认证** | Twenty GraphQL API | NextAuth.js / JWT |
| **用户管理** | Twenty API | 自建服务 |
| **客户管理** | Twenty API | 自建服务 |
| **数据库** | 共享数据库 | 独立数据库 |
| **部署** | Docker 容器 | Vercel Serverless |
| **依赖** | 外部系统 | 无外部依赖 |
| **性能** | API 调用延迟 | 直接数据库访问 |
| **复杂度** | 高（集成问题） | 低（单一系统） |

---

## 迁移计划

详细的迁移计划请参考：
- `_bmad-output/refactoring-plan-remove-twenty-dependency-2025-12-26.md`

**迁移阶段：**
1. 数据库设计和迁移脚本（1 周）
2. 替换认证系统（1-2 周）
3. 替换用户和角色管理（1 周）
4. 替换客户和联系人管理（1-2 周）
5. 更新产品和互动记录（1 周）
6. 移除 Twenty 依赖和清理（1 周）

**总计：6-8 周**

---

## 参考文档

- **基础设施决策：** `docs/infrastructure-decisions.md`
- **架构文档：** `_bmad-output/architecture.md`
- **重构计划：** `_bmad-output/refactoring-plan-remove-twenty-dependency-2025-12-26.md`
- **环境设置：** `docs/environment-setup-guide.md`
- **快速开始：** `docs/quick-start-guide.md`

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|------|----------|--------|
| 2025-12-26 | 重写为原生技术栈架构，移除 Twenty CRM 依赖 | Party Mode 讨论 |

---

**文档状态：** 当前架构  
**最后更新：** 2025-12-26
