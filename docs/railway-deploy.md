# 迁移到 Railway 的步骤

**项目：** fenghua-crm  
**目的：** 将后端从 Vercel 迁至 Railway，以常驻进程运行；Cron、Worker、文件持久化与本地一致。  
**对应：** Epic 18（迁移到 Railway）

---

## 一、前提

- **Story 18.1 已完成**：已删除 `fenghua-backend/api/index.js`、`fenghua-backend/vercel.json`，并修改 `main.ts` 移除 Vercel 分支与 `handler` 导出，仅保留 `app.listen(port)` 启动。
- 代码仓库可被 Railway 访问（通过 **GitHub 连接** 或 **Railway CLI** 初始化）。
- 已有 **Neon**（PostgreSQL）与 **Upstash**（Redis）连接串，或计划使用 Railway 内建数据库/Redis。

---

## 二、创建 Railway 项目

1. 打开 [Railway](https://railway.app)，登录。
2. **New Project** → 选 **Deploy from GitHub repo**（或 **Empty** 后用 CLI 关联）。
3. 选择本仓库（若 monorepo，先选仓库，再在下一步设置 Root Directory）。
4. 在项目内添加 **Service**，来源选该仓库。
5. 在 Service 的 **Settings** 中设置 **Root Directory**：`fenghua-backend`（若 monorepo；否则留空）。

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

1. **前端**（若在 Vercel 或其它）  
   - 设置 `VITE_BACKEND_URL`（或 `VITE_API_BASE_URL`）为 Railway 后端完整地址，例如：  
     `https://fenghua-backend-production.railway.app`  
   - **必须含 `https://`**；否则会请求到前端同源，返回 HTML 导致 JSON 解析错误。
   - 修改后**重新构建并部署**前端，使环境变量生效。

2. **后端 CORS**  
   - 在 Railway 的 Variables 中设置 `FRONTEND_URL` 为前端完整地址；多域名用逗号分隔、去除末尾斜杠，与 `main.ts` 的 CORS 逻辑一致。

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

### 4. `Cannot find module '/app/dist/main'` 或 `dist/...` 不存在

- **本项目 Nest 产出在 `dist/src/main.js`**，Start 必须为 `node dist/src/main`（不能是 `node dist/main`）。`package.json` 的 `start:prod` 已按此修正。
- 确认 **Build Command** 已设为 `npm run build` 且构建成功；未设置或未执行时 `dist/` 不会生成，启动必报 `MODULE_NOT_FOUND`。在 **Deployments** 的 **Build Logs** 中确认有 `nest build` / `npm run build` 及 `dist/` 产出。
- 若 monorepo，确认 **Root Directory** 为 `fenghua-backend`，否则 `npm run build` 可能跑在仓库根目录。

---

## 相关文档

- Epic 18：`_bmad-output/epics.md`（Epic 18: 迁移到 Railway）
- [部署方案选型：Vercel 与 Railway/Render 等](./deployment-platform-comparison.md)
- [Upstash Redis 配置](./upstash-redis-config.md)
- [Vercel 快速部署步骤](./vercel-quick-deploy-steps.md)（前端可继续用 Vercel）

---

**文档版本：** 1.0  
**最后更新：** 2026-01
