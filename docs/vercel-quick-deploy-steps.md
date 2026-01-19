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
| `FRONTEND_URL` | 前端完整地址，用于 CORS（**必填**，否则登录会报 CORS  blocked），如 `https://fenghua-crm-frontend.vercel.app` | Production, Preview |

每一行添加后点 **Add**；全部加完后可继续下一步。

### 步骤 4：部署后端

1. 点击 **Deploy**
2. 等待构建结束（约 1–3 分钟）
3. 部署成功后，在项目页顶部看到 **Visit** 的域名，例如：  
   `https://fenghua-backend-xxx.vercel.app`  
   **复制并保存该 URL，作为后端地址。**

### 步骤 5：验证后端

1. **健康检查**：在浏览器或 `curl` 访问  
   `https://你的后端域名/health`  
   若返回 JSON（含 `status` 等），说明后端与数据库、Redis 连接正常。

2. **CORS 预检（可选）**：若前端登录报 CORS blocked，可在本机执行：
   ```bash
   curl -sI -X OPTIONS "https://你的后端域名/auth/login" \
     -H "Origin: https://fenghua-crm-frontend.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type"
   ```
   若响应头中出现 `Access-Control-Allow-Origin: https://fenghua-crm-frontend.vercel.app`，说明 **`FRONTEND_URL`** 已生效；若没有，请检查后端 **Environment Variables** 中 **`FRONTEND_URL`** 是否为 `https://fenghua-crm-frontend.vercel.app`（可含尾斜杠，后端会自动去掉），并**重新部署后端**。

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

**注意：** 不要加末尾斜杠；不要带 `/api`，前端会自动拼接到具体接口路径。若漏配，用户管理、产品、客户等**所有**模块的请求会 fallback 到 `http://localhost:3001`，在 Vercel 上会出现 Failed to fetch / CORS；配好之后需 **Redeploy** 前端才生效。

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

- **CORS（Access to fetch ... blocked by CORS policy / No 'Access-Control-Allow-Origin' header）**  
  1. 在**后端**（而不是前端）Vercel 项目的 **Settings → Environment Variables** 中，添加或修改 **`FRONTEND_URL`**，值为前端完整地址，如：`https://fenghua-crm-frontend.vercel.app`（尾斜杠可有可无，后端会忽略）。  
  2. 保存后，在 **Deployments** 对最新一次部署点 **Redeploy**，等部署完成后再试登录。  
  3. 可用本页「步骤 5」中的 `curl -sI -X OPTIONS ...` 检查响应头是否含 `Access-Control-Allow-Origin`，以确认是否生效。  
- **登录后某模块（如用户管理）报 "Failed to fetch"，控制台显示请求到 `http://localhost:3001/...` 且 CORS**  
  原因：前端构建时 **`VITE_BACKEND_URL` 未设置**，所有 API 请求 fallback 到 localhost，在 Vercel 上必然连不上并触发 CORS。  
  处理：在**前端** Vercel 项目的 **Settings → Environment Variables** 中添加 **`VITE_BACKEND_URL`**，值为 `https://fenghua-crm-backend.vercel.app`（须含 `https://`，替换为你的后端域名）。保存后到 **Deployments** 对最新部署点 **Redeploy**（`VITE_*` 在构建时打入，必须重新构建才生效）。用户管理、角色、产品、客户等模块均使用该变量，配置后即可恢复。  
- **报 "Unexpected token '<', doctype is not valid JSON" 或 "接口返回了 HTML 而非 JSON"**  
  原因：请求到了前端页面（如 SPA 的 index.html）或后端返回了 HTML 错误页，多为 **`VITE_BACKEND_URL` 未配置或未含 `https://`**。  
  处理：同上，配置 **`VITE_BACKEND_URL`** 为后端完整地址并 **Redeploy** 前端。若已配置仍报错，在 Network 里查看该请求的 URL 与 Response，确认是否指向后端及是否仍为 HTML。  
- **404**：1）若在前端报 404，确认 `VITE_BACKEND_URL` 为后端根域名（如 `https://xxx.vercel.app`），且未多加 `/api` 或尾斜杠；2）若直接访问 `https://你的后端域名/health` 为 404，确认是在**后端**项目（如 fenghua-crm-**backend**.vercel.app）的 Logs 中查看，**前端**项目收到 /health 会 404 属正常（应请求后端域名）；3）若后端 /health 仍 404，确认仓库含 **`api/index.js`**、**`vercel.json`**（rewrites `/:path*` → `/api?__path=:path*`），并重新部署**后端**。

### 后端 500 / "This Serverless Function has crashed" / FUNCTION_INVOCATION_FAILED

- 到 **Vercel 项目 → Logs**（或 **Deployments → 某次部署 → Functions → 对应函数 Logs**）查看具体报错。
- **常见原因**：  
  1. **`DATABASE_URL`** 未填、填错或 Neon 不可达（需含 `?sslmode=require`）；  
  2. **`REDIS_URL`** 未填或格式错误（需 Redis 协议 URL，参见 [Upstash 配置](./upstash-redis-config.md)）；  
  3. **`dist/` 未进入部署**：确认 `npm run build` 在构建里成功、且仓库有 **`api/index.js`** 与 **`vercel.json`**（仅 rewrites）；  
  4. **Bootstrap 或模块初始化抛错**：日志中会有 `[api/index] handler/bootstrap error:` 或 Nest 的报错，按提示修（如缺 env、连不上 DB/Redis）；  
  5. **`ENOENT: no such file or directory, mkdir '...'`**（如 `./uploads`、`/var/task/tmp/import-reports`、`./exports/gdpr`、`./backups`）：已在 `LocalStorageService`、`ErrorReportGeneratorService`、`GdprExportService`、`BackupService` 中修复，Vercel 下自动改用 `/tmp` 下路径（仅当次请求有效，持久化需 R2/S3）。若仍报错，请拉取最新代码并重新部署。
  6. **`Cannot GET /health` 且 Logs 中 Search Params 为 `_path` 或 `path`**：`api/index.js` 已兼容 `__path`、`_path`、`path`。若 404 已解决，可删除 `api/index.js` 中两行 `[api] before/after rewrite` 的临时 `console.log`。
- 若响应 JSON 中有 `LOAD_FAILED`，多为 `require(dist/src/main)` 失败，请查看 Logs 中的 `[api/index] require(...) failed`。

### 后端 502 / 函数超时

- 到 **Functions** → **Logs** 看具体报错
- 冷启动或复杂查询可能导致超时：可尝试提高 **Max Duration**（需 Pro），或优化接口与 SQL

### 日志中的 ECONNRESET、DEP0169

- **ECONNRESET**：多为连接被对端关闭（Neon、Upstash、客户端超时等），可查 DB/Redis 连通性与超时设置；冷启动或并发时更易出现，一般重试即可。
- **DEP0169 `url.parse()`**：已在 `api/index.js` 中改用 WHATWG `URL`，拉取最新代码并重新部署即可消除。

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
- [部署方案选型：Vercel 与 Railway/Render 等对比](./deployment-platform-comparison.md)
- [迁移到 Railway 的步骤](./railway-deploy.md)
- [基础设施需求（Vercel + Neon）](./infrastructure-requirements-vercel-neon.md)
