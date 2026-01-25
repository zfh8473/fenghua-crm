# 香港区部署选项

**项目：** fenghua-crm  
**目的：** 把应用迁到香港，改善中国内地用户访问（无需 VPN 的概率更高）；对比各云厂商香港区方案，便于选型。

---

## 一、香港区能解决什么

- **中国内地访问**：香港到内地的国际出口通常比 US/EU 更稳，内地用户**不挂 VPN 能访问**的概率更高（不保证 100%）。
- **与内地部署的差别**：香港**不需要 ICP 备案**；若以后要迁入内地，需再备案并迁到国内云。

---

## 二、可选方案概览

| 方案 | 应用托管 | 数据库 | Redis | 运维难度 | 月成本（粗估） |
|------|----------|--------|-------|----------|----------------|
| **A. AWS 香港 (ap-east-1)** | EC2 / Lightsail | RDS PostgreSQL | ElastiCache | 中 | $30–80+ |
| **B. Azure 香港 (East Asia)** | App Service | Azure Database for PostgreSQL | Azure Cache for Redis | 中 | $40–90+ |
| **C. 阿里云 香港** | ECS | ApsaraDB RDS (PostgreSQL) | ApsaraDB for Redis | 中 | ¥200–600+ |
| **D. 腾讯云 香港** | CVM | TencentDB for PostgreSQL | TencentDB for Redis | 中 | ¥200–600+ |
| **E. 华为云 香港** | ECS | RDS for PostgreSQL | DCS for Redis | 中 | ¥200–600+ |
| **F. 折中：仅应用迁香港，DB/Redis 留新加坡** | 任一香港计算服务 | Neon (ap-southeast-1) | Upstash (Singapore) | 低 | 视计算服务 + 现有 Neon/Upstash |

> **说明：**  
> - **Railway、Render**：无香港区域，不列入。  
> - **Fly.io**：香港 (hkg) 已**弃用**，无法新建，不推荐。  
> - **Vultr**：无香港，仅东京、新加坡等，不列入。  
> - 若 Neon 在 **US East (Virginia)**，可先迁到新加坡再配合方案 F；见 `docs/neon-region-migration.md`。

---

## 三、各方案要点

### A. AWS 香港 (ap-east-1)

- **区域**：`ap-east-1`（Hong Kong），需在 AWS 控制台**手动启用**（opt-in）。
- **组件**：  
  - 应用：**EC2** 或 **Lightsail**（Node 跑 `nest build` + `node dist/src/main`，或 Docker）。  
  - 数据库：**RDS for PostgreSQL**。  
  - 缓存：**ElastiCache for Redis**。
- **优点**：与 Neon/Upstash 使用方式类似，生态成熟，文档多。  
- **注意**：ap-east-1 需单独开启；定价略高于 us-east-1。

---

### B. Azure 香港 (East Asia)

- **区域**：**East Asia**（Hong Kong）。
- **组件**：  
  - 应用：**App Service**（Linux + Node）。  
  - 数据库：**Azure Database for PostgreSQL - Flexible Server**。  
  - 缓存：**Azure Cache for Redis**。
- **优点**：全托管，与现有 Nest 兼容；App Service 支持从 Git/镜像部署。  
- **注意**：East Asia 的 App Service  zone redundancy 支持需查最新文档；PostgreSQL / Redis 均支持。

---

### C. 阿里云 香港

- **区域**：**中国（香港）**。
- **组件**：  
  - 应用：**ECS**（装 Node + 跑 Nest，或用 **Web+** 等若适合）。  
  - 数据库：**ApsaraDB RDS for PostgreSQL**。  
  - 缓存：**ApsaraDB for Redis**。
- **优点**：控制台与文档有中文；内地→香港的专线/出口通常较好。  
- **注意**：计费、实名与支付方式以阿里云香港的规则为准。

---

### D. 腾讯云 香港

- **区域**：**中国香港**。
- **组件**：  
  - 应用：**CVM**。  
  - 数据库：**TencentDB for PostgreSQL**。  
  - 缓存：**TencentDB for Redis**。
- **优点**：与阿里云类似，中文支持好，内地访问路径常见且稳定。  
- **注意**：需按腾讯云香港的计费与合规要求配置。

---

### E. 华为云 香港

- **区域**：**中国-香港 (ap-south-1)**。
- **组件**：  
  - 应用：**ECS**。  
  - 数据库：**RDS for PostgreSQL**。  
  - 缓存：**DCS for Redis**。
- **优点**：香港区齐全，若已有华为云账号可复用。  
- **注意**：控制台与文档偏华为体系，需单独熟悉。

---

### F. 折中：仅应用迁香港，DB/Redis 留新加坡

- **做法**：  
  - 在 **AWS / Azure / 阿里 / 腾讯 / 华为** 的**香港**区只部署**应用**（Nest + 前端静态或同机 `serve`）。  
  - **Neon** 继续用 **ap-southeast-1 (Singapore)**；**Upstash** 继续用 **Singapore**。
- **延迟**：香港 ↔ 新加坡 RTT 约 30–50ms，对多数业务可接受。
- **优点**：  
  - 只迁应用，**不动 DB/Redis**，迁移量小。  
  - 不改 Neon / Upstash 配置，仅改 `DATABASE_URL`、`REDIS_URL` 的指向（若你切到自建再改）。  
  - 应用在香港，内地访问时**第一跳**到香港，通常比到 US/SG 更稳。
- **成本**：主要为香港的计算费用 + 现有 Neon/Upstash。

---

## 四、迁移时要做的事（任选一方案后）

1. **应用**  
   - 与 Railway 类似：`npm run build`，`node dist/src/main`（或 Docker 等价）；前端 `vite build` + `serve -s dist -l $PORT` 或同类。  
   - 环境变量：`DATABASE_URL`、`REDIS_URL`、`JWT_SECRET`、`FRONTEND_URL` 等，按新环境重配。

2. **数据库**  
   - 若**从 Neon 迁出**：用 `pg_dump` 导出，在目标 RDS/PostgreSQL 导入，再切 `DATABASE_URL`。  
   - 若**选方案 F**：只改应用部署与 `DATABASE_URL` 的只读/连接串（一般不用改，继续指 Neon Singapore）。

3. **Redis**  
   - 若**从 Upstash 迁出**：在目标云创建 Redis，把 `REDIS_URL` 指向新实例；BullMQ、缓存等无持久化时可从空实例开始。  
   - 若**选方案 F**：继续用 Upstash Singapore，不改 `REDIS_URL`。

4. **域名与 HTTPS**  
   - 若用新域名或子域：在对应云配置 DNS、申请证书（云厂商一般提供）或挂到 CDN。  
   - 香港部署**仍不需要 ICP 备案**。

---

## 五、如何选

- **已有 AWS / Azure**：优先 **A 或 B**，或 **F + 该云香港计算**。  
- **团队更熟国内云、中文控制台**：**C / D / E** 更顺手；若希望**最少迁库**，可 **F + 阿里/腾讯/华为 香港 ECS/CVM**。  
- **希望改动最小、先试香港效果**：**F（仅应用迁香港，Neon + Upstash 留新加坡）** 最省事。

---

## 六、相关文档

- `docs/railway-deploy.md`：当前 Railway 部署步骤，迁移时环境变量与构建/启动命令可参考。  
- `docs/deployment-platform-comparison.md`：各平台能力与「主要用户在中国」的考量。  
- `docs/upstash-redis-config.md`：若续用 Upstash，Redis 协议与 `REDIS_URL` 的配置。

---

**文档版本：** 1.0  
**最后更新：** 2026-01
