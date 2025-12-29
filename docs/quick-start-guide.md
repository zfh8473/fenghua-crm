# 快速启动指南

**日期：** 2025-12-26  
**项目：** fenghua-crm  
**架构：** 原生技术栈（无外部依赖）

> **重要更新：** 本文档已更新以反映移除 Twenty CRM 依赖的决策。  
> 历史版本（包含 Twenty CRM 启动步骤）已归档到 `docs/archive/twenty-crm/`

---

## 前置要求

- Node.js 18+
- PostgreSQL 14+（或使用 Neon Serverless 数据库）
- npm 或 yarn

**不再需要：**
- ❌ Docker & Docker Compose
- ❌ Redis
- ❌ Twenty CRM

---

## 启动步骤

### 1. 克隆项目

```bash
git clone <repository-url>
cd fenghua-crm
```

### 2. 配置环境变量

**后端环境变量** (`fenghua-backend/.env.development`)：
```env
NODE_ENV=development
DATABASE_URL=postgresql://neondb_owner:npg_9EkbDI3AiLGT@ep-calm-glade-ahzfobn1-pooler.c-3.us-east-1.aws.neon.tech/fenghua-crm-dev?sslmode=require&channel_binding=require
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRES_IN=7d
PORT=3001
LOG_LEVEL=debug
```

**前端环境变量** (`fenghua-frontend/.env.development`)：
```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=fenghua-crm
```

### 3. 安装依赖

**后端：**
```bash
cd fenghua-backend
npm install
```

**前端：**
```bash
cd fenghua-frontend
npm install
```

### 4. 运行数据库迁移

```bash
cd fenghua-backend
npm run migration:run
```

或使用迁移脚本：
```bash
./scripts/run-migrations.sh
```

### 5. 启动后端服务

```bash
cd fenghua-backend
npm run start:dev
```

后端服务将在 http://localhost:3001 运行

### 6. 启动前端应用

```bash
cd fenghua-frontend
npm run dev
```

前端应用将在 http://localhost:3005 运行（根据 `vite.config.ts` 配置）

---

## 验证安装

### 检查后端

```bash
cd fenghua-backend
npm run build  # 应该成功编译
npm run test   # 运行测试
```

### 检查前端

```bash
cd fenghua-frontend
npm run build  # 应该成功编译
npm run test   # 运行测试
```

### 检查健康状态

```bash
# 后端健康检查
curl http://localhost:3001/health

# 前端访问
# 浏览器打开：http://localhost:3005
```

---

## 开发工作流

### 日常开发

1. **启动服务**：
   ```bash
   # 终端 1: 后端
   cd fenghua-backend
   npm run start:dev
   
   # 终端 2: 前端
   cd fenghua-frontend
   npm run dev
   ```

2. **访问应用**：
   - 前端：http://localhost:3005
   - 后端 API：http://localhost:3001/api
   - API 文档：http://localhost:3001/api/docs（如果配置了 Swagger）

### 数据库操作

**运行迁移：**
```bash
cd fenghua-backend
npm run migration:run
```

**回滚迁移：**
```bash
cd fenghua-backend
npm run migration:revert
```

**验证迁移：**
```bash
cd fenghua-backend
./scripts/verify-migrations.sh
```

---

## 常见问题

### 1. 端口冲突

如果端口被占用，修改配置：
- 后端：`PORT=3001`（在 `.env.development` 中）
- 前端：`server.port=3005`（在 `vite.config.ts` 中）

### 2. 数据库连接失败

检查：
- 数据库连接字符串是否正确
- 网络连接是否正常
- Neon 数据库是否已创建

```bash
# 测试数据库连接
psql "$DATABASE_URL" -c "SELECT version();"
```

### 3. 依赖安装失败

```bash
# 清除缓存重新安装
rm -rf node_modules package-lock.json
npm install
```

### 4. 迁移失败

```bash
# 检查迁移状态
cd fenghua-backend
npm run migration:status

# 手动运行迁移
npm run migration:run
```

---

## 部署到 Vercel

### 1. 安装 Vercel CLI

```bash
npm i -g vercel
```

### 2. 配置 Vercel 项目

```bash
# 在项目根目录
vercel
```

### 3. 设置环境变量

在 Vercel 控制台设置：
- `DATABASE_URL` - 数据库连接字符串
- `JWT_SECRET` - JWT 签名密钥
- `NODE_ENV` - 环境（production）

### 4. 部署

```bash
vercel --prod
```

---

## 下一步

1. **开始开发**
   - 查看 [Epic 和 Story](../_bmad-output/epics.md)
   - 查看 [架构文档](../_bmad-output/architecture.md)

2. **了解架构**
   - [原生技术栈架构](api-integration-architecture.md)
   - [基础设施决策](infrastructure-decisions.md)

3. **环境配置**
   - [环境设置指南](environment-setup-guide.md)
   - [数据库配置](neon-database-setup-guide.md)

---

**参考文档：**
- [架构文档](../_bmad-output/architecture.md)
- [Epic 和 Story](../_bmad-output/epics.md)
- [API 集成架构](api-integration-architecture.md)
- [环境设置指南](environment-setup-guide.md)

---

**最后更新：** 2025-12-26
