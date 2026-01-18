# Vercel 部署操作步骤

**适用于：** 在 Vercel 中从零创建项目并完成部署  
**项目：** fenghua-crm（前端 + 后端两个独立项目）

---

## 一、部署前准备

### 1. 确认已就绪

- [ ] 代码已推送到 GitHub 仓库
- [ ] 已在 **Neon** 创建 PostgreSQL，并拿到连接串（形如 `postgresql://...?sslmode=require`）
- [ ] 已在 **Upstash** 创建 Redis，并拿到 **Redis 协议** 的 `REDIS_URL`（形如 `rediss://default:xxx@xxx.upstash.io:6379`，参见 [Upstash 配置说明](./upstash-redis-config.md)）
- [ ] 已生成 `JWT_SECRET`（至少 32 字符，如：`openssl rand -base64 32`）

### 2. 数据库迁移（如尚未执行）

在 Neon 控制台或本地用 `psql` 连接数据库，按顺序执行 `fenghua-backend/migrations/` 下的 `.sql` 文件。

---

## 二、创建并部署「后端」项目

### 步骤 1：新建项目

1. 打开 [Vercel Dashboard](https://vercel.com/dashboard) 并登录
2. 点击 **Add New** → **Project**
3. 在 **Import Git Repository** 中选择你的 **fenghua-crm** 仓库；如未授权，按提示完成 GitHub 授权

### 步骤 2：配置后端项目

在 **Configure Project** 页面：

| 配置项 | 填写 |
|--------|------|
| **Project Name** | `fenghua-backend`（或 `fenghua-crm-api`，自定） |
| **Framework Preset** | **Other** |
| **Root Directory** | 点击 **Edit**，选择 **fenghua-backend**（必填；留空会报 `No entrypoint found` 或 `fsPath`，根目录没有 `src/main.ts`） |
| **Build Command** | 留空，由 Vercel 对 NestJS 的零配置自动检测；若构建失败可改为 `npm run build` |
| **Output Directory** | 留空 |
| **Install Command** | `npm install`（默认即可） |

> **若项目已创建**：到 **Settings → General → Root Directory** 点击 **Edit**，填 **`fenghua-backend`**，保存后重新部署；否则会报 `No entrypoint found`。

### 步骤 3：添加后端环境变量

在 **Environment Variables** 区域，逐条添加：

| Name | Value | 环境 |
|------|-------|------|
| `DATABASE_URL` | 你的 Neon PostgreSQL 连接串 | Production, Preview |
| `REDIS_URL` | 你的 Upstash Redis 协议 URL | Production, Preview |
| `JWT_SECRET` | 你生成的至少 32 位密钥 | Production, Preview |
| `DEPLOYMENT_PLATFORM` | `vercel` | Production, Preview |
| `VERCEL` | `1` | Production, Preview |

每一行添加后点 **Add**；全部加完后可继续下一步。

### 步骤 4：部署后端

1. 点击 **Deploy**
2. 等待构建结束（约 1–3 分钟）
3. 部署成功后，在项目页顶部看到 **Visit** 的域名，例如：  
   `https://fenghua-backend-xxx.vercel.app`  
   **复制并保存该 URL，作为后端地址。**

### 步骤 5：验证后端

在浏览器或 `curl` 访问：

```
https://你的后端域名/health
```

若返回 JSON（含 `status` 等），说明后端与数据库、Redis 连接正常。

### 步骤 6：配置函数超时（可选）

如部分接口较慢，可在项目 **Settings** → **Functions** 中将 **Max Duration** 调整为 `60` 秒（免费版上限一般 10s，若需 60s 需 Pro）。

---

## 三、创建并部署「前端」项目

### 步骤 1：再新建一个项目

1. 在 Vercel 中再次点击 **Add New** → **Project**
2. 仍然选择 **fenghua-crm** 仓库

### 步骤 2：配置前端项目

在 **Configure Project** 页面：

| 配置项 | 填写 |
|--------|------|
| **Project Name** | `fenghua-crm` 或 `fenghua-frontend` |
| **Framework Preset** | **Vite**（可自动识别） |
| **Root Directory** | 点击 **Edit**，选择 **fenghua-frontend** |
| **Build Command** | `npm run build`（默认） |
| **Output Directory** | `dist`（默认） |
| **Install Command** | `npm install`（默认） |

### 步骤 3：添加前端环境变量

在 **Environment Variables** 中添加：

| Name | Value | 环境 |
|------|-------|------|
| `VITE_BACKEND_URL` | 后端完整地址，如 `https://fenghua-crm-backend.vercel.app`（**必须含 `https://`**，只填主机名会导致登录 405） | Production, Preview |

**注意：** 不要加末尾斜杠；不要带 `/api`，前端会自动拼接到具体接口路径。

### 步骤 4：部署前端

1. 点击 **Deploy**
2. 等待构建完成
3. 记下 **Visit** 的域名，如：  
   `https://fenghua-crm-xxx.vercel.app`

### 步骤 5：验证前端

1. 打开前端域名，应能看到登录页
2. 使用你在数据库中已有的用户登录
3. 简单点击几个菜单，确认请求都发往后端且无 CORS 报错

---

## 四、部署后如修改了后端地址

若之后后端域名变更：

1. 打开 **前端** 对应的 Vercel 项目
2. **Settings** → **Environment Variables**
3. 修改 `VITE_BACKEND_URL` 为新的后端域名
4. **Deployments** → 最新一次部署右侧 **⋯** → **Redeploy**，选 **Use existing Build Cache** 或直接 **Redeploy** 均可

---

## 五、常见问题

### 构建报错：`Cannot read properties of undefined (reading 'fsPath')`

- **fenghua-backend** 内不要放 `vercel.json`；根目录不要有含 `builds`/`routes`/`functions` 的配置。
- 后端 **Root Directory** 必须为 **fenghua-backend**。
- 若仍报错：**Settings → General** 开启 **Force no build cache**；**Build & Development Settings** 将 **Build Command** 设为 `npm run build` 再试。

### 构建报错：`No entrypoint found. Searched for: src/main.*, ...`

- 表示 Vercel 在**错误目录**下找入口（例如在仓库根而非 `fenghua-backend`）。
- **必须**将后端项目的 **Root Directory** 设为 **`fenghua-backend`**（Settings → General）。根目录没有 `src/main.ts`，留空或填错都会报此错。
- 确认保存后重新部署。

### 构建报错：`No Output Directory named "public" found after the Build completed`

- Vercel 会查找 `public` 目录；已在 `fenghua-backend/public/` 下加入占位（如 `robots.txt`），构建应能通过。
- 若仍报错：在 **Settings → Build & Development Settings → Output Directory** 中将其**清空**（纯 Nest 后端无需 Output Directory，输出为 serverless 函数）。

### 构建失败：`Cannot find module` 等

- 确认 **Root Directory** 正确：后端 `fenghua-backend`，前端 `fenghua-frontend`
- 查看 **Build Logs** 里报错的文件路径，确认是否缺依赖或 `package.json` 配置有误

### 数据库连接失败

- 检查 `DATABASE_URL` 是否完整、是否有 `?sslmode=require`
- 确认 Neon 允许外网连接，且 IP 未在防火墙等白名单中受限

### Redis 连接失败

- 确认使用的是 **Redis 协议** 的 `REDIS_URL`，而不是 Upstash 的 REST URL/Token  
  参见：[Upstash Redis 配置说明](./upstash-redis-config.md)

### 前端访问 API 报 CORS 或 404

- 确认 `VITE_BACKEND_URL` 为后端根域名（如 `https://xxx.vercel.app`），且未多加 `/api` 或尾斜杠
- 确认后端 `Settings` → **Domains** 中已包含该前端域名（如 Vercel 自动分配的 `*.vercel.app` 一般已放行）

### 后端 502 / 函数超时

- 到 **Functions** → **Logs** 看具体报错
- 冷启动或复杂查询可能导致超时：可尝试提高 **Max Duration**（需 Pro），或优化接口与 SQL

---

## 六、检查清单（部署前 / 后）

**部署前：**

- [ ] GitHub 仓库可访问，分支正确（如 `main`）
- [ ] Neon 数据库已建库、已跑迁移
- [ ] Upstash `REDIS_URL`（Redis 协议）已拿到
- [ ] `JWT_SECRET` 已生成并妥善保存

**后端部署后：**

- [ ] `/health` 返回正常
- [ ] 在 **Logs** 中无数据库、Redis 连接错误

**前端部署后：**

- [ ] 登录页可打开
- [ ] 能登录并看到仪表盘等页面
- [ ] 浏览器控制台无跨域或 404 报错

---

## 相关文档

- [Vercel 部署指南（详细版）](./vercel-deployment-guide.md)
- [环境变量说明](./vercel-environment-variables.md)
- [部署检查清单](./vercel-deployment-checklist.md)
- [Upstash Redis 配置](./upstash-redis-config.md)
