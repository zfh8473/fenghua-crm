# Upstash Redis 配置说明

**日期：** 2026-01-14  
**项目：** fenghua-crm

---

## 两种连接方式

Upstash 提供两种连接方式，**本项目当前使用的是「Redis 协议」（`REDIS_URL`），不是 REST API。**

| 方式 | 环境变量 | 用途 | 本项目是否使用 |
|------|----------|------|----------------|
| **REST API** | `UPSTASH_REDIS_REST_URL`<br>`UPSTASH_REDIS_REST_TOKEN` | HTTP 请求，适合 Serverless/Edge | ❌ 暂未使用 |
| **Redis 协议** | `REDIS_URL` | 标准 Redis 连接，BullMQ / node-redis / ioredis | ✅ 使用中 |

---

## 你当前拿到的配置

你提供的是 **REST API** 配置：

- `UPSTASH_REDIS_REST_URL="https://pretty-shark-35200.upstash.io"`
- `UPSTASH_REDIS_REST_TOKEN="AYmAAAIncDEwYmU2MjRlYTZlZDk0NDgyYjFiMDVkYWMyMTU5OTc1Y3AxMzUyMDA"`

BullMQ、仪表盘缓存、导入队列等都用的是 **`REDIS_URL`（Redis 协议）**，所以还需要从 Upstash 拿到 **Redis 协议的连接串**。

---

## 如何获取 REDIS_URL

1. 打开 [Upstash Console](https://console.upstash.com/)
2. 进入你的数据库（例如 `pretty-shark-35200`）
3. 在详情页找到 **「Redis Connect」** 或 **「TCP」** 区域（不是 REST API 那个）
4. 复制其中的 **Redis URL**，格式类似：

   ```
   rediss://default:这里是一串密码@pretty-shark-35200.upstash.io:6379
   ```

   或 Upstash 直接给出的 `REDIS_URL` / `UPSTASH_REDIS_REST_URL` 旁的 **「Redis URL」** 链接。

如果没有看到完整 URL，可手工拼：

```text
rediss://default:<密码>@<endpoint>:6379
```

- **协议：** `rediss`（带 TLS），如 Upstash 说明用 6380 则相应改为 `redis://...:6380`
- **用户名：** 一般为 `default`
- **密码：** 在 Upstash 该数据库的「Redis Connect」/「Password」处
- **Host：** `pretty-shark-35200.upstash.io`（或控制台里给的 endpoint）
- **端口：** 通常 TLS 为 `6379`，按 Upstash 页面为准

---

## 在项目中如何配置

在 **Vercel 环境变量** 或本地 `.env` 中设置：

```env
REDIS_URL=rediss://default:你的Redis密码@pretty-shark-35200.upstash.io:6379
```

请务必：

1. 使用 **Redis 协议** 的 URL，不要用 `UPSTASH_REDIS_REST_URL`
2. 密码使用 **Redis 密码**，不要用 `UPSTASH_REDIS_REST_TOKEN`
3. 从 Upstash 控制台直接复制 `REDIS_URL` 最省事，避免手输错误

---

## 安全说明

- `UPSTASH_REDIS_REST_TOKEN` 和 Redis 密码都是敏感信息，不要提交到 Git
- 不要在文档或截图里暴露完整 `REDIS_URL` 或 token
- 如已泄露，请在 Upstash 控制台重置/轮换

---

## 你已有的 REST 配置如何处理

`UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN` 目前不会被本项目使用，可以：

- 先不配置在 Vercel / .env 里；或  
- 保留在 .env 中备用，将来若改用 `@upstash/redis` 再启用。

---

## 配置后如何验证

配置好 `REDIS_URL` 并启动后端后，可检查：

1. **健康检查接口**（如 `/health`）里若有 Redis 检查，应显示正常  
2. **导入/导出、仪表盘** 等使用 BullMQ / Redis 的功能不再报连接错误  
3. 日志中无 `REDIS_URL not configured` 或 Redis 连接失败

---

## 参考

- [Upstash - Connect with Redis CLI / Clients](https://upstash.com/docs/redis/howto/connectclient)
- [Upstash - REST API](https://upstash.com/docs/redis/features/restapi)
