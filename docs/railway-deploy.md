# 迁移到 Railway 的步骤

**项目：** fenghua-crm  
**目的：** 将后端从 Vercel 迁至 Railway，以常驻进程运行；Cron、Worker、文件持久化与本地一致。前后端也可一并部署到 Railway。  
**对应：** Epic 18（迁移到 Railway）

> **从零部署：** 若只要一份可勾选的检查清单，直接看 [十、从零在 Railway 建前后端：检查清单](#十从零在-railway-建前后端检查清单)。

---

## 一、前提

- **Story 18.1 已完成**：已删除 `fenghua-backend/api/index.js`、`fenghua-backend/vercel.json`，并修改 `main.ts` 移除 Vercel 分支与 `handler` 导出，仅保留 `app.listen(port)` 启动。
- 代码仓库可被 Railway 访问（通过 **GitHub 连接** 或 **Railway CLI** 初始化）。
- 已有 **Neon**（PostgreSQL）与 **Upstash**（Redis）连接串，或计划使用 Railway 内建数据库/Redis。

---

## 二、创建 Railway 项目（后端）

1. 打开 [Railway](https://railway.app)，登录。
2. **New Project** → 选 **Deploy from GitHub repo**（或 **Empty** 后用 CLI 关联）。
3. 选择本仓库（若 monorepo，先选仓库，再在下一步设置 Root Directory）。
4. 在项目内添加 **Service**，来源选该仓库，作为**后端**。
5. 在该 Service 的 **Settings** 中设置 **Root Directory**：`fenghua-backend`（若 monorepo；否则留空）。

若前后端都上 Railway，同一项目内再**添加一个 Service**，同样从本仓库，Root Directory 设为 `fenghua-frontend`；详见 [九、前端也部署到 Railway](#九前端也部署到-railway)。

---

## 三、构建与启动（在哪里配置）

### 3.1 在 Railway 界面里的位置

1. 进入项目，点击你的 **Service**（后端服务）。
2. 打开 **Settings**（设置）标签。
3. 在设置页面向下滚动，找到：
   - **Build** 区块 → **Build Command**（或 **Custom Build Command**、**Override Build Command**）  
   - **Deploy** 区块 → **Start Command**（或 **Custom Start Command**、**Run Command**、**Override Start Command**）

   若看到的是 **Build & Deploy** 合在一页，则 Build Command 与 Start Command 通常在同一页的上下两处。

4. **Root Directory** 在 **Source** 或 **Build** 区块；若 monorepo，填 `fenghua-backend`。

> 若在 Settings 里没找到 **Build Command** / **Start Command**：  
> - 新版本可能在 **Source** → **Build** / **Deploy** 子项；  
> - 或先 **Deploy** 一次，再回 Settings 查看是否出现；  
> - 也可用 3.2 的 `railway.json` 在仓库里写死，不依赖 UI。

### 3.2 建议填写的值（本项目）

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **Build Command** | `npm run build` 或 `npm ci && npm run build` | **必填**。否则不会生成 `dist/`，启动时报 `Cannot find module '/app/dist/...'` |
| **Start Command** | `node dist/src/main` | 本项目 `nest build` 产出在 `dist/src/main.js`，不是 `dist/main.js`；与 `package.json` 的 `start:prod` 一致 |
| **Root Directory** | `fenghua-backend` | 仅 monorepo 需要 |

- Railway 会注入 `PORT`，应用使用 `process.env.PORT || 3001` 即可（`main.ts` 已支持）。
- **Build Command 务必设置**：Railway 若只做 `npm install` 而没跑 `nest build`，`dist/` 不存在，`node dist/src/main` 也会报 `MODULE_NOT_FOUND`。
- 不填时 Railway 会按 `package.json` 自动推断；Nest 可能被推断成 `npm start`（开发模式），**建议显式填 Build 与 Start**。

### 3.3 用配置文件（可选，不依赖 UI）

在 `fenghua-backend` 根目录（或仓库 Root Directory 所指目录）新建 `railway.json`，可替代在 UI 里填 Build/Start：

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "node dist/src/main"
  }
}
```

本项目 `nest build` 产出为 `dist/src/main.js`，故 `startCommand` 用 `node dist/src/main`。  
`railway.json` 需放在 **Root Directory 所指目录的根**（如 `fenghua-backend/railway.json`）；其内容会覆盖 UI 中的 Build/Start 设置。

### 3.4 构建失败时

在 **Deployments** → 选中一次部署 → **View Logs** 查看。常见原因：`npm ci` 无 `package-lock.json`、Node 版本不满足 `engines`（需 `>=20`）。

---

## 四、环境变量

在 Service 的 **Variables** 中配置：

### 必选

| 变量 | 说明 | 示例 |
|------|------|------|
| `NODE_ENV` | 运行环境 | `production` |
| `DATABASE_URL` | PostgreSQL 连接串 | Neon 或 Railway Postgres 提供的 URL |
| `REDIS_URL` | Redis 连接串（**Redis 协议**，非 REST） | Upstash 的 `rediss://...`；见 `docs/upstash-redis-config.md` |
| `JWT_SECRET` | JWT 签名密钥 | 与现有部署一致或重新生成 |
| `FRONTEND_URL` | 前端完整地址，用于 CORS；多域名逗号分隔、去尾斜杠 | `https://xxx.vercel.app` 或 `https://your-frontend.railway.app` |

- `PORT` 由 Railway 自动注入，一般无需设置。

### 可选

| 变量 | 说明 |
|------|------|
| `HTTPS_ENABLED` | 本地/自托管时启用；Railway 由平台提供 TLS，通常不设 |
| `LOG_LEVEL` | 日志级别（若应用支持） |
| `SSL_CERT_PATH` / `SSL_KEY_PATH` | 自管 HTTPS 时的证书路径；Railway 不必设 |

---

## 五、数据与 Redis

### 续用 Neon、Upstash

- **Neon**：在 Neon 控制台复制连接串，填入 `DATABASE_URL`；Neon 一般不限制出口 IP，Railway 可直接访问。
- **Upstash**：必须使用 **Redis 协议 URL**（`rediss://...`），不可用 REST URL；详见 `docs/upstash-redis-config.md`。

### 选用 Railway 内建

- 在 Railway 项目中 **New** → **Database** → **PostgreSQL** 或 **Redis**，Railway 会自动注入 `DATABASE_URL` 或 `REDIS_URL`。
- 若从 Neon/Upstash 迁入：先导出数据，在新库导入，再切换 `DATABASE_URL`/`REDIS_URL` 并重新部署；Redis 无持久化需求时可新建空实例。

---

## 六、前端与 CORS

1. **前端**  
   - **若前端在 Vercel 或其它**：在该平台设置 `VITE_BACKEND_URL`（或 `VITE_API_BASE_URL`）为 Railway 后端完整地址，如 `https://xxx.railway.app`，**必须含 `https://`**；修改后重新构建并部署。  
   - **若前端也在 Railway**：在前端 Service 的 **Variables** 中设置 `VITE_BACKEND_URL` 为后端 Railway 地址（见 [九、前端也部署到 Railway](#九前端也部署到-railway)）。Vite 在**构建时**注入该变量，故需在部署前配置好。

2. **后端 CORS**  
   - 在后端 Service 的 **Variables** 中设置 `FRONTEND_URL` 为前端完整地址（如 `https://fenghua-crm-frontend.vercel.app` 或前端 Railway 的 `https://xxx.railway.app`）；多域名用逗号分隔、去除末尾斜杠，与 `main.ts` 的 CORS 逻辑一致。

---

## 七、域名与 HTTPS

- **默认**：Railway 提供 `https://<service>-<env>.railway.app`，已含 HTTPS，无需额外配置。
- **自定义域名**：在 Service **Settings** → **Networking** → **Public Networking** 中添加 Custom Domain，按提示完成 CNAME 或 A 记录；Railway 会自动签发证书。

---

## 八、验证与排错

### 1. `/health` 返回 200

```bash
curl -s -o /dev/null -w "%{http_code}" https://<railway-backend>/health
```

- 若 404：确认 Root Directory、Start Command 正确，且 `main.ts` 已移除 Vercel 分支，使用 `app.listen(port)`。
- 若 500：查看 **Deployments** → **View Logs**，常见为 `DATABASE_URL` / `REDIS_URL` 未设或错误、连接超时。

### 2. 前端登录、用户管理等

- 能登录且可进入用户管理、仪表盘等：说明 CORS、`VITE_BACKEND_URL`、`FRONTEND_URL` 正确。
- **CORS 报错**：检查 `FRONTEND_URL` 是否包含前端实际 Origin（协议、域名、端口一致，无多余尾斜杠）。
- **Unexpected token '<', "doctype"** 或 返回 HTML：多为 `VITE_BACKEND_URL` 未含 `https://` 或指错，请求到了前端页面；修正后重新构建部署前端。

### 3. `DATABASE_URL` / `REDIS_URL` 连接失败

- **Neon**：确认 URL 完整、含 `?sslmode=require`（若需）；网络问题可重试或查 Neon 状态。
- **Upstash**：必须为 **Redis 协议** `rediss://...`，不能为 REST；见 `docs/upstash-redis-config.md`。
- **Railway 内建**：确认变量已自动注入，无多余空格、换行。

### 3.1 `ECONNRESET`、`MaxRetriesPerRequestError`（BullMQ / Redis）

日志中大量 `Error: read ECONNRESET` 或 `MaxRetriesPerRequestError: Reached the max retries per request limit (which is 20)`，通常表示 **ioredis 连 Upstash 时未走 TLS**：

- **原因**：`REDIS_URL` 用了 REST 地址、或用了 `redis://` 而非 `rediss://`；此前 BullMQ 的 connection 未根据 `rediss` 启用 TLS。
- **处理**：
  1. 在 Upstash 控制台复制 **Redis 协议** 的 `REDIS_URL`，格式为 `rediss://default:<密码>@<endpoint>:6379`（注意是 `rediss`）。
  2. 确认后端已使用包含 TLS 支持的 Bull 连接逻辑（`src/common/redis/bullmq-connection.util.ts`），`rediss://` 会自动加 `tls: {}`。
  3. 更新 `REDIS_URL` 后重新部署后端；若曾用 `redis://`，务必改为 `rediss://`。
- 详见 `docs/upstash-redis-config.md`。

### 4. `Cannot find module '/app/dist/main'` 或 `dist/...` 不存在

- **本项目 Nest 产出在 `dist/src/main.js`**，Start 必须为 `node dist/src/main`（不能是 `node dist/main`）。`package.json` 的 `start:prod` 已按此修正。
- 确认 **Build Command** 已设为 `npm run build` 且构建成功；未设置或未执行时 `dist/` 不会生成，启动必报 `MODULE_NOT_FOUND`。在 **Deployments** 的 **Build Logs** 中确认有 `nest build` / `npm run build` 及 `dist/` 产出。
- 若 monorepo，确认 **Root Directory** 为 `fenghua-backend`，否则 `npm run build` 可能跑在仓库根目录。

---

## 九、前端也部署到 Railway

前端用 Vite + React，构建产物为 `dist/`，需用静态服务器（如 `serve`）托管。仓库中已提供 `fenghua-frontend/railway.json` 和 `package.json` 的 `start` 脚本。

### 9.1 新建前端 Service

1. 在**同一 Railway 项目**中，**New** → **GitHub Repo**，选择本仓库。
2. 新 Service 的 **Settings** → **Source** / **Build**：**Root Directory** 设为 `fenghua-frontend`。
3. **Build / Start**：`fenghua-frontend/railway.json` 已配置 `buildCommand: npm run build`、`startCommand: npx serve -s dist -l $PORT`。若仍报 `Missing script: "start"`，在 **Settings → Deploy** 的 **Start Command** 中显式填：`npx serve -s dist -l $PORT`（绕过 `package.json` 的 `start`）。

   | 配置项 | 值 |
   |--------|-----|
   | **Build Command** | `npm run build` |
   | **Start Command** | `npx serve -s dist -l $PORT` |

### 9.2 前端 Variables（必填）

在**前端 Service** 的 **Variables** 中设置：

| 变量 | 说明 |
|------|------|
| `VITE_BACKEND_URL` | 后端 Railway 完整地址，如 `https://fenghua-backend-production.railway.app`，**必须含 `https://`**。Vite 在**构建时**写入，部署后改此变量需**重新部署**前端才生效。 |

### 9.3 后端 FRONTEND_URL

前端 Railway 部署成功后，在 **Settings** → **Networking** 或 **Deployments** 中拿到前端的公网地址（如 `https://fenghua-frontend-production.railway.app`）。  
在**后端 Service** 的 **Variables** 中，将 `FRONTEND_URL` 设为该地址（若原为 Vercel 可改为只填 Railway 前端，或多域名逗号分隔）；保存后触发后端重新部署，CORS 方会放行新前端。

### 9.4 部署顺序建议

1. 部署**后端**，获取后端 `https://xxx.railway.app`。
2. 创建**前端** Service，在 Variables 中设 `VITE_BACKEND_URL` = 后端地址，部署前端，获取前端 `https://yyy.railway.app`。
3. 更新**后端**的 `FRONTEND_URL` = 前端地址，触发后端重新部署。

### 9.5 前端排错

- **白屏、接口 404 或 HTML**：多为 `VITE_BACKEND_URL` 未设、写错或未含 `https://`；修正后必须**重新部署**前端（Vite 构建时注入）。
- **CORS**：后端 `FRONTEND_URL` 需包含前端 Railway 的 Origin（与浏览器地址栏一致，无尾斜杠）。
- **`Missing script: "start"`**：运行阶段未读到 `fenghua-frontend/package.json`。在 **Settings → Deploy** 的 **Start Command** 中填 `npx serve -s dist -l $PORT`，不再走 `npm run start`。
- **`serve` 相关错误**：`package.json` 已加入 `serve` 依赖，`npm run build` 会先 `npm install`，正常应有 `serve`；若缺失，检查 Root Directory 是否为 `fenghua-frontend`。

---

## 十、从零在 Railway 建前后端：检查清单

按顺序勾选，便于从零部署前后端到同一 Railway 项目。详细说明见上文各节。

### 前置

- [ ] 后端已移除 Vercel 特化：无 `fenghua-backend/api/index.js`、`fenghua-backend/vercel.json`，`main.ts` 仅 `app.listen(port)` 启动
- [ ] 已准备 **Neon** 连接串（或 Railway Postgres）和 **Upstash** Redis 协议 URL（或 Railway Redis），见 `docs/upstash-redis-config.md`
- [ ] 本仓库已连接 Railway（GitHub 授权）

---

### 第一步：后端 Service

- [ ] **New Project** → **Deploy from GitHub repo** → 选本仓库
- [ ] 对该 Service：**Settings** → **Root Directory** = `fenghua-backend`
- [ ] **Build Command**：`npm run build`（或依赖 `fenghua-backend/railway.json`，可不填）
- [ ] **Start Command**：`node dist/src/main`（或依赖 `railway.json`，可不填）

### 第二步：后端 Variables

- [ ] `NODE_ENV` = `production`
- [ ] `DATABASE_URL` = Neon 或 Railway Postgres 连接串
- [ ] `REDIS_URL` = Upstash **Redis 协议** `rediss://...` 或 Railway Redis 提供的 URL
- [ ] `JWT_SECRET` = 不少于 32 字符的随机串
- [ ] `FRONTEND_URL` = 前端地址（**可先填占位**，如 `https://placeholder.railway.app`，前端部署后再改；或若已知前端 Railway 域名可直接填）

### 第三步：部署后端

- [ ] 触发部署（推代码或 **Deploy**），等待成功
- [ ] **Settings** → **Networking** → **Generate Domain**（若未自动生成），复制后端地址，例如：  
  `https://fenghua-backend-production-xxxx.railway.app`  
  **记作：`<后端URL>`**

### 第四步：前端 Service

- [ ] 同一项目中 **New** → **GitHub Repo** → 选本仓库（新建一个 Service）
- [ ] 对该 Service：**Settings** → **Root Directory** = `fenghua-frontend`
- [ ] **Build Command**：`npm run build`（或依赖 `fenghua-frontend/railway.json`）
- [ ] **Start Command**：`npx serve -s dist -l $PORT`（或依赖 `railway.json`；若报 `Missing script: "start"` 须在 UI 显式填此项）

### 第五步：前端 Variables

- [ ] `VITE_BACKEND_URL` = `<后端URL>`，**必须含 `https://`**（如 `https://fenghua-backend-production-xxxx.railway.app`）

### 第六步：部署前端

- [ ] 触发部署，等待成功
- [ ] **Settings** → **Networking** → **Generate Domain**（若未自动生成），复制前端地址，例如：  
  `https://fenghua-frontend-production-yyyy.railway.app`  
  **记作：`<前端URL>`**

### 第七步：更新后端 CORS

- [ ] 打开**后端** Service → **Variables**
- [ ] 将 `FRONTEND_URL` 改为 `<前端URL>`（或在其后追加 `,<前端URL>`，去尾斜杠、无空格）
- [ ] 保存，触发后端重新部署

### 第八步：验证

- [ ] 浏览器访问 `<后端URL>/health`，应返回 200 或 `{"status":"ok"}` 等
- [ ] 浏览器访问 `<前端URL>`，应打开登录页
- [ ] 登录、进入用户管理或仪表盘，无 CORS 报错、无「Unexpected token '<'」或接口 404

---

### 快速对照：Variables 汇总

| Service | 变量 | 示例 / 说明 |
|---------|------|-------------|
| **后端** | `NODE_ENV` | `production` |
| | `DATABASE_URL` | Neon / Railway Postgres 连接串 |
| | `REDIS_URL` | Upstash `rediss://...` 或 Railway Redis |
| | `JWT_SECRET` | 随机字符串，≥32 字符 |
| | `FRONTEND_URL` | `https://<前端>.railway.app`，与浏览器地址栏一致、无尾斜杠 |
| **前端** | `VITE_BACKEND_URL` | `https://<后端>.railway.app`，必须含 `https://`，构建时注入 |

### 快速对照：Root / Build / Start

| Service | Root Directory | Build Command | Start Command |
|---------|----------------|---------------|---------------|
| **后端** | `fenghua-backend` | `npm run build` | `node dist/src/main` |
| **前端** | `fenghua-frontend` | `npm run build` | `npx serve -s dist -l $PORT` |

若仓库中已存在 `fenghua-backend/railway.json`、`fenghua-frontend/railway.json`，Build / Start 可省略不填，由配置文件生效。

---

## 相关文档

- Epic 18：`_bmad-output/epics.md`（Epic 18: 迁移到 Railway）
- [部署方案选型：Vercel 与 Railway/Render 等](./deployment-platform-comparison.md)
- [Upstash Redis 配置](./upstash-redis-config.md)
- [Vercel 快速部署步骤](./vercel-quick-deploy-steps.md)（前端可继续用 Vercel）

---

**文档版本：** 1.0  
**最后更新：** 2026-01
