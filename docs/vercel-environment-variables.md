# Vercel 环境变量配置清单

**日期：** 2026-01-14  
**项目：** fenghua-crm

---

## 📋 环境变量清单

### 后端环境变量（fenghua-backend）

#### 🔴 必需变量

| 变量名 | 说明 | 示例值 | 获取方式 |
|--------|------|--------|----------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://user:pass@host:5432/db?sslmode=require` | 数据库服务商提供 |
| `REDIS_URL` | Redis 连接字符串 | `redis://default:pass@host:6379` | Redis 服务商提供 |
| `JWT_SECRET` | JWT 密钥（至少32字符） | `your-super-secret-jwt-key-min-32-chars-long` | 自行生成 |
| `DEPLOYMENT_PLATFORM` | 部署平台标识 | `vercel` | 固定值 |
| `VERCEL` | Vercel 环境标识 | `1` | 固定值 |

#### 🟡 可选变量

| 变量名 | 说明 | 默认值 | 何时需要 |
|--------|------|--------|----------|
| `PORT` | 服务端口 | `3001` | 通常不需要 |
| `JWT_EXPIRES_IN` | JWT 过期时间 | `7d` | 需要自定义过期时间时 |
| `NODE_ENV` | 环境标识 | `production` | Vercel 自动设置 |
| `PG_DATABASE_URL` | PostgreSQL 备用连接字符串 | 同 `DATABASE_URL` | 需要备用连接时 |

---

### 前端环境变量（fenghua-frontend）

#### 🔴 必需变量

| 变量名 | 说明 | 示例值 | 获取方式 |
|--------|------|--------|----------|
| `VITE_BACKEND_URL` | 后端 API 地址（**必须含 `https://`**，不能只有主机名，否则会当相对路径请求到前端域名导致登录 405） | `https://fenghua-crm-backend.vercel.app` | 后端部署后获取 |

**注意：** 必须填**完整 URL**（如 `https://fenghua-crm-backend.vercel.app`），不要填 `fenghua-crm-backend.vercel.app`；不要加末尾 `/` 或 `/api`。修改后需**重新部署前端**才生效。

#### 🟡 可选变量

| 变量名 | 说明 | 默认值 | 何时需要 |
|--------|------|--------|----------|
| `VITE_API_BASE_URL` | API 基础地址（备用，同样须含 `https://`） | 同 `VITE_BACKEND_URL` | 需要不同 API 地址时 |

---

## 🔑 如何生成 JWT_SECRET

### 方法 1: 使用 OpenSSL

```bash
openssl rand -base64 32
```

### 方法 2: 使用 Node.js

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 方法 3: 在线生成器

- https://generate-secret.vercel.app/32
- https://randomkeygen.com/

**重要：** JWT_SECRET 必须至少 32 个字符，建议使用 64 个字符。

---

## 📝 在 Vercel 中配置环境变量

### 步骤 1: 进入项目设置

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目
3. 点击 **Settings** → **Environment Variables**

### 步骤 2: 添加环境变量

1. 点击 **Add New**
2. 输入变量名和值
3. 选择环境（Production、Preview、Development）
4. 点击 **Save**

### 步骤 3: 重新部署

环境变量更改后，需要重新部署项目：
1. 进入 **Deployments** 页面
2. 点击最新部署右侧的 **...** 菜单
3. 选择 **Redeploy**

---

## 🔍 验证环境变量

### 在 Vercel 中验证

1. 进入项目 **Settings** → **Environment Variables**
2. 检查所有变量是否已添加
3. 确认变量值正确（注意不要暴露敏感信息）

### 在代码中验证

后端代码会在启动时检查必需的环境变量，如果缺失会抛出错误。

---

## ⚠️ 安全注意事项

1. **不要提交环境变量到 Git**
   - 确保 `.env` 文件在 `.gitignore` 中
   - 不要在代码中硬编码敏感信息

2. **使用强密码**
   - JWT_SECRET 必须足够长且随机
   - 数据库密码应该复杂

3. **定期轮换密钥**
   - 定期更换 JWT_SECRET
   - 定期更换数据库密码

4. **限制访问**
   - 只给需要的人访问 Vercel 项目的权限
   - 使用 Vercel 的团队权限管理

---

## 📋 快速检查清单

### 后端环境变量

- [ ] `DATABASE_URL` - PostgreSQL 连接字符串
- [ ] `REDIS_URL` - Redis 连接字符串
- [ ] `JWT_SECRET` - JWT 密钥（至少32字符）
- [ ] `DEPLOYMENT_PLATFORM` - 设置为 `vercel`
- [ ] `VERCEL` - 设置为 `1`

### 前端环境变量

- [ ] `VITE_BACKEND_URL` - 后端 API 地址

---

## 🔗 相关资源

- [Vercel 环境变量文档](https://vercel.com/docs/concepts/projects/environment-variables)
- [JWT 最佳实践](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [PostgreSQL 连接字符串格式](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)

---

**文档版本：** 1.0  
**最后更新：** 2026-01-14
