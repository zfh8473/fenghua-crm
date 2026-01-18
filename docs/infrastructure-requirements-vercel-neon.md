# 基础设施需求 - Vercel + Neon 部署

**日期：** 2026-01-14  
**项目：** fenghua-crm  
**部署方案：** Vercel (应用服务器) + Neon (数据库)

---

## 📋 基础设施清单

### ✅ 已选择

| 服务 | 提供商 | 用途 | 状态 |
|------|--------|------|------|
| **数据库** | Neon | PostgreSQL 数据库 | ✅ 已选择 |
| **应用服务器** | Vercel | 前端 + 后端 Serverless Functions | ✅ 已选择 |

---

## 🔴 必需的基础设施

### 1. Redis 服务（必需）

**用途：**
- 缓存（仪表盘数据、分析结果）
- BullMQ 队列（数据导入、导出、GDPR 处理）
- 会话存储（可选）

**推荐服务商：**

#### 选项 1: Upstash（推荐，专为 Serverless 设计）
- **免费版：** 10,000 命令/天
- **付费版：** $0.20/100K 命令
- **优势：**
  - 专为 Serverless 设计，无需管理连接池
  - 自动扩展
  - 全球低延迟
  - 与 Vercel 集成良好
- **网址：** https://upstash.com
- **获取连接字符串：** 创建数据库后，在控制台获取 REST API URL 或 Redis URL

#### 选项 2: Redis Cloud
- **免费版：** 30MB 内存
- **付费版：** 从 $10/月起
- **优势：**
  - 标准 Redis 协议
  - 高可用性
- **网址：** https://redis.com/cloud
- **获取连接字符串：** 数据库配置中

**连接字符串格式：**
```
redis://default:password@host:port
# 或 Upstash REST API
https://your-redis.upstash.io
```

**环境变量：**
```env
REDIS_URL=redis://default:password@host:6379
```

---

## 🟡 可延后的基础设施

### 2. 文件存储服务（可延后，待需要图片/附件上传时再配置）

**用途：**
- 附件上传（互动记录附件、产品图片等）
- 导出文件临时存储
- 备份文件存储（如果使用）

**是否现在就要配？**
- **暂不测试图片/附件上传时：可以不配置**
- 应用会使用默认的 `STORAGE_PROVIDER=local`
- 只要**不触发**附件上传接口，应用可正常部署和运行
- 若用户操作了上传，在 Vercel 上会失败或文件无法持久化
- **建议：** 等开始测试或使用附件功能时，再配置 Cloudflare R2（或 S3/OSS）

**当前代码：**
- 默认 `STORAGE_PROVIDER=local`，未配置时不会报错
- 需要启用云存储时，再实现 R2/S3 并提供相应环境变量即可

**推荐服务商（待需要时选用）：**

#### 选项 1: Cloudflare R2（推荐，性价比高）
- **免费版：** 10GB 存储，100 万次读取/月
- **付费版：** $0.015/GB/月存储，$4.50/百万次读取
- **优势：**
  - 无出口费用（与 S3 兼容）
  - 全球 CDN
  - 与 Vercel 集成良好
- **网址：** https://www.cloudflare.com/products/r2/
- **配置：**
  ```env
  STORAGE_PROVIDER=cloudflare_r2
  R2_ACCOUNT_ID=your_account_id
  R2_ACCESS_KEY_ID=your_access_key
  R2_SECRET_ACCESS_KEY=your_secret_key
  R2_BUCKET_NAME=fenghua-crm-attachments
  R2_PUBLIC_URL=https://your-bucket.r2.dev
  ```

#### 选项 2: AWS S3
- **免费版：** 5GB 存储，20,000 次 GET 请求/月（12个月）
- **付费版：** $0.023/GB/月存储
- **优势：**
  - 成熟稳定
  - 全球可用
- **网址：** https://aws.amazon.com/s3/
- **配置：**
  ```env
  STORAGE_PROVIDER=aws_s3
  AWS_ACCESS_KEY_ID=your_access_key
  AWS_SECRET_ACCESS_KEY=your_secret_key
  AWS_REGION=us-east-1
  S3_BUCKET_NAME=fenghua-crm-attachments
  ```

#### 选项 3: 阿里云 OSS（如果主要用户在中国）
- **免费版：** 无
- **付费版：** ¥0.12/GB/月存储
- **优势：**
  - 国内访问速度快
  - 价格相对便宜
- **网址：** https://www.aliyun.com/product/oss
- **配置：**
  ```env
  STORAGE_PROVIDER=aliyun_oss
  OSS_ACCESS_KEY_ID=your_access_key
  OSS_ACCESS_KEY_SECRET=your_secret_key
  OSS_REGION=oss-cn-hangzhou
  OSS_BUCKET_NAME=fenghua-crm-attachments
  OSS_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
  ```

**注意：** 需要时再实现对应的云存储提供者（目前仅有 `LocalStorageService`）。

---

## 🟡 可选的基础设施

### 3. 邮件服务（Epic 11 需要）

**用途：**
- 发送询价邮件（Epic 11）
- 系统通知邮件
- 密码重置邮件

**推荐服务商：**

#### 选项 1: SendGrid（推荐）
- **免费版：** 100 封/天
- **付费版：** 从 $19.95/月起（40,000 封/月）
- **优势：**
  - 易于集成
  - 良好的送达率
  - 详细的发送统计
- **网址：** https://sendgrid.com
- **配置：**
  ```env
  SENDGRID_API_KEY=your_api_key
  SENDGRID_FROM_EMAIL=inquiry@fenghua-crm.com
  ```

#### 选项 2: Resend
- **免费版：** 3,000 封/月
- **付费版：** 从 $20/月起（50,000 封/月）
- **优势：**
  - 专为开发者设计
  - 简洁的 API
  - 与 Vercel 集成良好
- **网址：** https://resend.com

**注意：** 如果暂时不需要邮件功能，可以稍后添加

---

### 4. 监控和日志服务（可选，但推荐）

**用途：**
- 错误监控
- 性能监控
- 日志聚合

**推荐服务商：**

#### 选项 1: Sentry（推荐）
- **免费版：** 5,000 事件/月
- **付费版：** 从 $26/月起
- **优势：**
  - 强大的错误追踪
  - 性能监控
  - 与 Vercel 集成良好
- **网址：** https://sentry.io

#### 选项 2: Logtail（日志聚合）
- **免费版：** 1GB/月日志
- **付费版：** 从 $29/月起
- **网址：** https://logtail.com

---

## 📊 基础设施架构图

```
┌─────────────────┐
│   Vercel CDN    │  ← 前端静态资源
│  (fenghua-crm)  │
└────────┬────────┘
         │
         │ API 请求
         ▼
┌─────────────────┐
│ Vercel Functions│  ← 后端 Serverless Functions
│ (fenghua-backend)│
└────────┬────────┘
         │
         ├──► Neon PostgreSQL (数据库) ✅
         ├──► Upstash Redis (缓存/队列) 🔴 必需
         ├──► Cloudflare R2 (文件存储) 🟡 可延后（暂不测附件时可不配）
         └──► SendGrid (邮件服务) 🟡 可选（Epic 11）
```

---

## 💰 成本估算

### 最小配置（MVP）

| 服务 | 提供商 | 方案 | 月成本 |
|------|--------|------|--------|
| 数据库 | Neon | 免费版（3GB） | $0 |
| 应用服务器 | Vercel | 免费版 | $0 |
| Redis | Upstash | 免费版（10K 命令/天） | $0 |
| 文件存储 | Cloudflare R2 | 免费版（10GB） | $0 |
| **总计** | | | **$0/月** |

### 生产环境（中等规模）

| 服务 | 提供商 | 方案 | 月成本 |
|------|--------|------|--------|
| 数据库 | Neon | Pro ($19/月起) | $19 |
| 应用服务器 | Vercel | Pro ($20/月起) | $20 |
| Redis | Upstash | Pay-as-you-go | ~$5-10 |
| 文件存储 | Cloudflare R2 | Pay-as-you-go | ~$5-10 |
| 邮件服务 | SendGrid | Essentials ($19.95/月) | $20 |
| **总计** | | | **~$69-79/月** |

---

## 🚀 快速开始清单

### 步骤 1: 创建必需服务

- [ ] **Neon 数据库** ✅（已选择）
  - 创建项目
  - 获取连接字符串
  - 运行数据库迁移

- [ ] **Upstash Redis**
  - 注册账户：https://upstash.com
  - 创建 Redis 数据库
  - 获取连接字符串

- [ ] **Cloudflare R2**（可延后：暂不测试附件上传时可跳过）
  - 注册 Cloudflare 账户
  - 创建 R2 存储桶
  - 获取 API 凭证
  - 配置 CORS（如需时再做）

### 步骤 2: 配置环境变量

**后端环境变量（最小集，不含文件存储）：**
```env
# 数据库
DATABASE_URL=postgresql://user:pass@neon-host/db?sslmode=require

# Redis
REDIS_URL=redis://default:pass@upstash-host:6379

# 文件存储（可选，暂不测附件时可省略，默认 local）
# STORAGE_PROVIDER=local

# 其他
JWT_SECRET=your-secret-key-min-32-chars
DEPLOYMENT_PLATFORM=vercel
VERCEL=1
```

**启用云存储时再追加：**
```env
STORAGE_PROVIDER=cloudflare_r2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=fenghua-crm-attachments
R2_PUBLIC_URL=https://your-bucket.r2.dev
```

### 步骤 3: 实现云存储服务（可延后）

**待开始测试附件上传时再实现：**
- `CloudflareR2Service` 实现 `StorageProvider` 接口
- 或使用 S3 SDK（R2 兼容 S3 API）

---

## ⚠️ 重要注意事项

### 1. Vercel Serverless Functions 限制

- **文件系统：** 只读，无法持久化文件
- **执行时间：** 免费版 10 秒，Pro 版 60 秒
- **内存：** 免费版 1024 MB，Pro 版 1024 MB
- **冷启动：** 首次请求可能有延迟

### 2. Neon 数据库限制

- **连接数：** 免费版 100 个并发连接
- **存储：** 免费版 3GB
- **自动暂停：** 免费版 5 分钟无活动后暂停（需要几秒恢复）

### 3. Redis 使用建议

- **Upstash：** 专为 Serverless 设计，无需连接池管理
- **连接方式：** 使用 REST API 或标准 Redis 协议
- **缓存策略：** 设置合理的过期时间

### 4. 文件存储建议

- **暂不测附件时：** 可不配置云存储，保持 `STORAGE_PROVIDER=local`（默认），只要不调用上传接口即可正常部署
- **启用附件功能后：** 必须改用云存储（R2/S3/OSS），因 Vercel Serverless 无法持久化本地文件
- **CDN 配置：** 使用 Cloudflare R2 的 CDN 可加速文件访问
- **CORS 配置：** 使用云存储时需配置 CORS，便于前端访问

---

## 🔧 需要实现的代码

### 1. Cloudflare R2 存储服务

创建 `fenghua-backend/src/attachments/storage/cloudflare-r2.service.ts`：

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageProvider } from './storage.interface';

@Injectable()
export class CloudflareR2Service implements StorageProvider {
  private readonly logger = new Logger(CloudflareR2Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME') || 'fenghua-crm-attachments';
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL') || `https://${accountId}.r2.cloudflarestorage.com`;

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async upload(buffer: Buffer, key: string, mimeType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });

    await this.s3Client.send(command);
    return `${this.publicUrl}/${key}`;
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }
}
```

**需要安装依赖：**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 2. 更新 AttachmentsService

在 `attachments.service.ts` 中添加 Cloudflare R2 支持：

```typescript
private getStorageProvider(provider: string): StorageProvider {
  switch (provider) {
    case 'local':
      return this.localStorageService;
    case 'cloudflare_r2':
      return this.cloudflareR2Service;
    // ... 其他存储提供者
    default:
      return this.localStorageService;
  }
}
```

---

## 📋 部署检查清单

### 基础设施准备

- [ ] Neon 数据库已创建并配置
- [ ] Redis 服务已创建（Upstash 或 Redis Cloud）
- [ ] 文件存储服务（可延后：暂不测附件时跳过）

### 代码准备

- [ ] 云存储实现（可延后：待需要附件上传时再做）
- [ ] 测试文件上传（可延后）

### 环境变量配置

- [ ] `DATABASE_URL` - Neon 连接字符串
- [ ] `REDIS_URL` - Redis 连接字符串
- [ ] `STORAGE_PROVIDER` 及 R2/S3/OSS 等（可延后，默认 `local`）

---

## 🔗 相关资源

- [Neon 文档](https://neon.tech/docs)
- [Upstash Redis 文档](https://docs.upstash.com/redis)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [Vercel Serverless Functions 文档](https://vercel.com/docs/functions)
- [AWS S3 SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-examples.html)

---

## 💡 建议

### MVP 阶段（最小成本）
1. Neon 免费版（3GB）
2. Vercel 免费版
3. Upstash 免费版（10K 命令/天）
4. Cloudflare R2 免费版（10GB）

**总成本：$0/月**

### 生产环境
1. Neon Pro（$19/月起）
2. Vercel Pro（$20/月起）
3. Upstash Pay-as-you-go（~$5-10/月）
4. Cloudflare R2 Pay-as-you-go（~$5-10/月）

**总成本：~$49-59/月**

---

**文档版本：** 1.0  
**最后更新：** 2026-01-14
