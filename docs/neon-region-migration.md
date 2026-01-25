# Neon 数据库从 US East (N. Virginia) 迁到新加坡

**结论：** Neon **不支持**在现有项目上直接改区域。要迁到新加坡，必须**新建一个选新加坡区 (AWS Asia Pacific Singapore)** 的项目，再把数据迁过去，最后把 `DATABASE_URL` 指到新项目。

---

## 一、Neon 新加坡区

- **区域名：** AWS Asia Pacific (Singapore)  
- **区域码：** `aws-ap-southeast-1`  
- 在 Neon 控制台 **Create project** 时，在 **Region** 里选 **Singapore** 即可。

---

## 二、迁移方式怎么选

| 方式 | 适用 | 停机 | 说明 |
|------|------|------|------|
| **Import Data Assistant** | 库 < 10 GB，且 1 小时内可导完 | 短（导入期间停写即可） | 在控制台填源库连接串，自动 pg_dump/pg_restore |
| **pg_dump + pg_restore** | 任意大小 | 短 | 自己在本机或跳板机跑，可控 |
| **Logical Replication** | 生产、要近零停机 | 近零 | 从 Virginia 流式复制到新加坡，切换时停写、等追齐再切 |
| **pgcopydb** | 大库（>10 GB）且可接受一次停机 | 短 | 比 pg_dump 快，需单独安装 |

**推荐：**

- 库不大（<10 GB）：优先 **Import Data Assistant**，步骤少。  
- 库大或 Assistant 超时：用 **pg_dump / pg_restore** 或 **pgcopydb**。  
- 生产、不能停：用 **Logical Replication**（需看 [Neon 逻辑复制文档](https://neon.tech/docs/guides/logical-replication-neon-to-neon)）。

---

## 三、用 Import Data Assistant 迁到新加坡（库 <10 GB）

### 1. 拿源库（Virginia）连接串

1. 打开 [Neon Console](https://console.neon.tech) → 选 **Virginia 项目**。  
2. 在 **Connection details** 里选 **Unpooled**（不要用 PgBouncer 的 Pooled），复制连接串。  
   - 形式类似：  
     `postgres://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`  
3. 若库有 IP 白名单，先确认你跑导入的出口 IP 已被放行（Neon 网页端一般在 Neon 侧已放行）。

### 2. 新建新加坡项目并导入

1. Neon Console → **New Project**。  
2. **Region** 选 **Singapore**（`aws-ap-southeast-1`）。  
3. 项目名、库名可按习惯填（如 `fenghua-crm-sg`），Postgres 版本选和 Virginia 一致（如 15 / 16）。  
4. 在创建流程里选 **Import existing data**（或完成创建后，在项目里打开 **Import** / **Import Database**）。  
5. 把 **Virginia 的 Unpooled 连接串** 贴进去，按提示下一步。  
6. 等校验通过（库大小、版本、扩展等），确认开始导入。  
7. 导入会在**新项目里创建一个 branch**，数据都在上面。通常默认会用该 branch 作为主 branch，或以新 branch 形式存在，需在控制台看清哪个 branch 有数据。

### 3. 拿到新库连接串并切流量

1. 在新 **Singapore 项目** 里，选 **有导入数据的 branch**（多为 `main` 或 Assistant 创建的那个）。  
2. 在 **Connection details** 复制 **Unpooled** 连接串（若应用用连接池，再视情况选 Pooled）。  
3. 在 **Railway**（或当前部署平台）的后端服务里，把 `DATABASE_URL` 换成新的新加坡连接串，保存并重新部署。  
4. 做接口/登录等冒烟验证。  
5. 确认无问题后，可在 Virginia 项目做一次最终备份，再按需归档或删除旧项目。

### 4. 注意

- **<10 GB、1 小时内完成**：超过则可能失败，改用 pg_dump/pg_restore。  
- **扩展**：若 Virginia 用了特殊扩展，Assistant 会检查；若有不支持项，会用 pg_dump 手动迁。  
- **导入期间**：为数据一致，建议暂停对 Virginia 的写入，或接受导入的是「某一时间点」的 snapshot。

---

## 四、用 pg_dump + pg_restore 迁移（任意大小）

### 1. 新建新加坡项目

1. Neon Console → **New Project**，**Region** 选 **Singapore**。  
2. 库名、Postgres 版本与 Virginia 保持一致。  
3. 创建完成后，在 **Connection details** 拿到 **Unpooled** 连接串，作为 `DESTINATION_URL`。

### 2. 拿 Virginia 的 Unpooled 连接串

在 Virginia 项目里复制 **Unpooled** 连接串，作为 `SOURCE_URL`。

### 3. 在本机或跳板机执行

```bash
pg_dump -Fc -v -d "$SOURCE_URL" | pg_restore -v -d "$DESTINATION_URL"
```

- `-Fc`：自定义格式，便于 pg_restore。  
- 若库很大，建议先落到文件再恢复，避免管道超时：

  ```bash
  pg_dump -Fc -v -d "$SOURCE_URL" -f neon-virginia.dump
  pg_restore -v -d "$DESTINATION_URL" neon-virginia.dump
  ```

### 4. 恢复时的常见报错

- **已存在的对象**：`pg_restore` 会报错，若目标是空库且只迁一次，可先忽略；若有现成 schema，可加 `--clean`（会 DROP，慎用）或 `--if-exists`，或先清空目标库再恢复。  
- **权限 / 角色**：若报 `role "xxx" does not exist`，可在目标库先 `CREATE ROLE`，或 pg_restore 时加 `--no-owner`。  
- **扩展**：目标项目需启用与 Virginia 相同的扩展（Neon Console → Project settings → Extensions）。

### 5. 切流量

与「三、3」相同：把 `DATABASE_URL` 换成新加坡的 Unpooled（或 Pooled）连接串，重新部署并验证。

---

## 五、迁移后需要改的地方

| 位置 | 变量 | 操作 |
|------|------|------|
| **Railway 后端** | `DATABASE_URL` | 换成新加坡项目的连接串 |
| **本地 / 其他环境** | `DATABASE_URL` | 同上 |
| **备份、脚本、CI** | 任何写死的 Virginia 连接串 | 统一改成新加坡 |

---

## 六、和 Railway / 应用的配合

- 你当前 **Railway 在 Singapore**：Neon 迁到新加坡后，**DB 与计算同区**，延迟会从 Virginia 的跨区 150–250ms 降到同区几 ms，对缓解 401/503 和鉴权超时很有帮助。  
- 若之后 **应用迁到香港**（见 `docs/hong-kong-deployment-options.md` 方案 F）：Neon 保留新加坡即可，香港 ↔ 新加坡约 30–50ms，一般可接受。

---

## 七、参考

- [Neon Regions](https://neon.tech/docs/introduction/regions)  
- [Migrate data from another Neon project](https://neon.tech/docs/import/migrate-from-neon)  
- [Import Data Assistant](https://neon.tech/docs/import/import-data-assistant)  
- [Logical replication from Neon to Neon](https://neon.tech/docs/guides/logical-replication-neon-to-neon)（近零停机用）

---

**文档版本：** 1.0  
**最后更新：** 2026-01
