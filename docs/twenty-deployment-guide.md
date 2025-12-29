# Twenty CRM 部署指南

**项目：** fenghua-crm  
**日期：** 2025-12-23  
**目标：** 部署并评估 Twenty CRM 系统

---

## 📋 前置要求

### 系统要求

- **Node.js**: v18.x 或更高版本
- **Yarn**: v1.22.x 或更高版本
- **PostgreSQL**: v14.x 或更高版本
- **Redis**: v6.x 或更高版本（用于队列和缓存）
- **Docker** (可选): 用于快速部署

### 检查系统环境

```bash
# 检查 Node.js 版本
node --version

# 检查 Yarn 版本
yarn --version

# 检查 PostgreSQL 版本
psql --version

# 检查 Redis 版本
redis-cli --version

# 检查 Docker 版本（如果使用 Docker）
docker --version
```

---

## 🚀 部署方案

### 方案 1：Docker 部署（推荐 - 快速试用）

**优点：**
- 快速启动，无需配置复杂环境
- 隔离性好，不影响现有系统
- 适合快速评估和测试

**步骤：**

```bash
# 1. 克隆 Twenty 仓库
cd /Users/travis_z/Documents/GitHub
git clone https://github.com/twentyhq/twenty.git
cd twenty

# 2. 检查 Docker Compose 配置
ls -la docker-compose.yml

# 3. 启动所有服务
docker-compose up -d

# 4. 查看服务状态
docker-compose ps

# 5. 查看日志
docker-compose logs -f
```

**访问地址：**
- 前端: http://localhost:3000
- GraphQL API: http://localhost:3000/graphql
- 默认登录凭据: 查看 Docker 日志或文档

---

### 方案 2：本地开发环境部署（推荐 - 深度评估）

**优点：**
- 可以查看和修改源代码
- 便于调试和定制开发
- 适合长期使用和二次开发

**步骤：**

```bash
# 1. 克隆 Twenty 仓库
cd /Users/travis_z/Documents/GitHub
git clone https://github.com/twentyhq/twenty.git
cd twenty

# 2. 安装依赖
yarn install

# 3. 配置环境变量
cp .env.example .env

# 4. 编辑 .env 文件，配置以下关键变量：
# - DATABASE_URL (PostgreSQL 连接字符串)
# - REDIS_URL (Redis 连接字符串)
# - JWT_SECRET (JWT 密钥)
# - FRONT_BASE_URL (前端地址)
# - SERVER_URL (后端地址)

# 5. 设置 PostgreSQL 数据库
# 确保 PostgreSQL 服务运行
createdb twenty_dev  # 或使用现有数据库

# 6. 运行数据库迁移
yarn prisma migrate deploy

# 7. 生成 Prisma 客户端
yarn prisma generate

# 8. 启动 Redis（如果未运行）
redis-server

# 9. 启动开发服务器
yarn dev

# 或者分别启动前端和后端：
# 终端 1: yarn dev:server
# 终端 2: yarn dev:front
```

**访问地址：**
- 前端: http://localhost:3000
- GraphQL API: http://localhost:3000/graphql

---

## 🔧 环境变量配置

创建 `.env` 文件并配置以下变量：

```env
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/twenty_dev"

# Redis 配置
REDIS_URL="redis://localhost:6379"

# JWT 配置
JWT_SECRET="your-secret-key-here"

# 应用配置
FRONT_BASE_URL="http://localhost:3000"
SERVER_URL="http://localhost:3000"

# 邮件配置（可选）
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-password"

# 文件存储（可选）
STORAGE_TYPE="local"  # 或 "s3"
STORAGE_LOCAL_PATH="./storage"
```

---

## 📦 项目结构说明

```
twenty/
├── packages/
│   ├── server/          # NestJS 后端服务
│   │   ├── src/
│   │   │   ├── graphql/ # GraphQL schema 和 resolvers
│   │   │   ├── modules/ # 业务模块
│   │   │   └── ...
│   │   └── prisma/      # 数据库 schema 和迁移
│   │       └── schema.prisma
│   ├── front/           # React 前端应用
│   │   ├── src/
│   │   │   ├── modules/ # 功能模块
│   │   │   ├── components/ # UI 组件
│   │   │   └── ...
│   └── ...
├── docker-compose.yml   # Docker 配置
├── package.json         # 项目依赖
└── .env.example         # 环境变量示例
```

---

## ✅ 部署验证

### 1. 检查服务状态

```bash
# Docker 方式
docker-compose ps

# 本地方式
# 检查进程
ps aux | grep node
ps aux | grep redis
```

### 2. 测试 GraphQL API

```bash
# 使用 curl 测试
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

### 3. 访问前端界面

打开浏览器访问：http://localhost:3000

### 4. 检查数据库连接

```bash
# 连接到 PostgreSQL
psql -d twenty_dev

# 查看表
\dt

# 退出
\q
```

---

## 🐛 常见问题排查

### 问题 1: 端口被占用

```bash
# 检查端口占用
lsof -i :3000
lsof -i :5432
lsof -i :6379

# 杀死占用进程
kill -9 <PID>
```

### 问题 2: 数据库连接失败

```bash
# 检查 PostgreSQL 服务
pg_isready

# 检查数据库是否存在
psql -l | grep twenty

# 创建数据库
createdb twenty_dev
```

### 问题 3: Redis 连接失败

```bash
# 检查 Redis 服务
redis-cli ping

# 应该返回: PONG
```

### 问题 4: 依赖安装失败

```bash
# 清除缓存
yarn cache clean

# 删除 node_modules 重新安装
rm -rf node_modules
yarn install
```

---

## 📝 下一步

部署完成后，请参考 `twenty-evaluation-checklist.md` 进行详细评估。

---

## 🔗 相关资源

- [Twenty GitHub 仓库](https://github.com/twentyhq/twenty)
- [Twenty 官方文档](https://twenty.com/docs)
- [GraphQL API 文档](http://localhost:3000/graphql) (部署后访问)

---

**部署完成后，请记录以下信息：**
- 部署方式：□ Docker  □ 本地开发环境
- 部署时间：___________
- 访问地址：___________
- 遇到的问题：___________

