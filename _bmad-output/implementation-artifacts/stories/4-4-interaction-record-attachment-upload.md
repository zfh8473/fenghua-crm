# Story 4.4: 互动记录附件上传（桌面端）

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **所有用户**,
I want **在记录互动时上传附件（照片、文档等）**,
so that **我可以保存与互动相关的文件，如合同、报价单、产品照片等**.

## Acceptance Criteria

**AC1: 文件选择对话框**
- **Given** 用户填写互动记录表单
- **When** 用户点击"上传附件"按钮
- **Then** 系统显示文件选择对话框
- **And** 系统支持选择多种文件类型：图片（JPG, PNG, GIF）、文档（PDF, DOC, DOCX, XLS, XLSX）等
- **And** 系统显示文件大小限制（单个文件最大 10MB）
- **And** 系统支持多文件选择（可选，建议实现）

**AC2: 文件上传进度显示**
- **Given** 用户选择文件上传
- **When** 用户选择文件并确认
- **Then** 系统开始上传文件
- **And** 系统显示上传进度条
- **And** 系统在上传过程中显示文件名和上传进度百分比
- **And** 系统支持取消上传（可选）

**AC3: 文件上传成功处理**
- **Given** 文件上传成功
- **When** 文件上传完成
- **Then** 系统将文件保存到存储系统（云对象存储：阿里云 OSS、AWS S3 或 Cloudflare R2）
- **And** 系统在互动记录表单中显示已上传的文件列表
- **And** 每个文件显示：文件名、文件大小、上传时间、预览图标（如果是图片）
- **And** 用户可以点击文件名查看或下载文件（预览或下载）
- **And** 用户可以删除已上传的文件（在上传后、提交前）

**AC4: 文件上传失败处理**
- **Given** 文件上传失败
- **When** 文件上传过程中网络中断或文件过大
- **Then** 系统显示错误消息（如"文件上传失败，请重试"或"文件大小超过限制"）
- **And** 系统提供"重试"按钮
- **And** 用户可以重新选择文件上传

**AC5: 文件类型和大小验证**
- **Given** 用户选择文件上传
- **When** 用户选择不符合要求的文件（类型不支持或大小超过限制）
- **Then** 系统在文件选择阶段就显示验证错误消息
- **And** 系统阻止不符合要求的文件上传
- **And** 系统显示允许的文件类型和大小限制

**AC6: 附件与互动记录关联**
- **Given** 用户提交互动记录
- **When** 互动记录包含附件
- **Then** 系统保存互动记录和附件关联关系（使用 `interaction_id` 外键）
- **And** 附件在互动历史中正确显示（后续 story 会实现详细显示）
- **And** 用户可以查看和下载附件

## Tasks / Subtasks

- [x] Task 1: 创建文件上传服务（后端）(AC: #3, #6)
  - [x] 创建 `attachments` 模块和 `AttachmentsService`
  - [x] **重要：** 实现 `getWorkspaceId` 方法（参考 `ProductsService.getWorkspaceId` 实现）
  - [x] 创建存储提供商接口 `StorageProvider`（定义 upload, delete, getSignedUrl 方法）
  - [x] 实现存储提供商实现类（LocalStorageService 用于开发测试，可扩展为 AliyunOssService, AwsS3Service, CloudflareR2Service）
  - [x] 实现文件上传到云对象存储的逻辑（当前使用本地存储，支持扩展为阿里云 OSS、AWS S3、Cloudflare R2）
  - [x] 实现文件元数据保存到数据库（`file_attachments` 表，**必须包含 workspace_id 字段**）
  - [x] 实现文件类型和大小验证（应用层验证）
  - [x] 实现文件删除功能（**同时从云存储和数据库中删除**，使用软删除）
  - [x] 实现生成签名 URL 功能（用于文件访问）

- [x] Task 2: 创建文件上传 API 端点（后端）(AC: #1, #2, #3, #4, #5)
  - [x] **重要：** 安装依赖 `@types/multer`（`npm install @types/multer --save-dev`）
  - [x] **重要：** 在 `main.ts` 中配置文件上传限制（可选，也可以在拦截器中配置）
  - [x] 创建 `AttachmentsController` 和上传端点 `POST /api/attachments/upload`
  - [x] 实现文件上传端点（使用 `@UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))`）
  - [x] 实现文件类型验证（MIME 类型和文件扩展名）
  - [x] 实现文件大小验证（最大 10MB，在拦截器和服务层双重验证）
  - [x] 实现上传进度跟踪（可选，使用流式上传）
  - [x] 实现错误处理和错误响应
  - [x] 创建删除端点 `DELETE /api/attachments/:attachmentId`

- [x] Task 3: 创建附件关联 API 端点（后端）(AC: #6)
  - [x] 创建端点 `POST /api/attachments/:attachmentId/link` 用于关联附件到互动记录
  - [x] 实现附件与互动记录的关联（更新 `interaction_id` 字段）
  - [x] 实现关联验证（确保附件存在且未被关联）
  - [x] 实现关联删除功能（可选，用于取消关联）

- [x] Task 4: 实现前端文件上传组件 (AC: #1, #2, #3, #4, #5)
  - [x] 创建 `FileUpload` 组件（支持拖拽上传，可选）
  - [x] 实现文件选择对话框（使用 `<input type="file">` 或文件选择库）
  - [x] 实现文件类型和大小验证（前端验证）
  - [x] 实现文件上传进度显示（使用 `XMLHttpRequest` 或 `fetch` with progress）
  - [x] 实现已上传文件列表显示（文件名、大小、时间、预览图标）
  - [x] 实现文件预览功能（图片预览，文档下载链接）
  - [x] 实现文件删除功能（在上传后、提交前）
  - [x] 实现错误处理和重试功能

- [x] Task 5: 集成文件上传到互动记录表单 (AC: #1, #2, #3, #4, #5, #6)
  - [x] 在 `InteractionCreateForm.tsx` 中集成 `FileUpload` 组件
  - [x] 实现附件状态管理（已上传的附件列表）
  - [x] **重要：** 实现附件关联策略（推荐：先创建互动记录，后上传附件并关联）
  - [x] 在提交互动记录时，关联附件到互动记录（调用关联 API）
  - [x] 实现附件删除功能（在提交前可以删除）
  - [x] 确保附件上传失败不影响互动记录创建（可以允许先创建互动记录，后上传附件）

- [x] Task 6: 更新测试用例 (AC: #1, #2, #3, #4, #5, #6)
  - [x] 更新 `attachments/attachments.service.spec.ts`：
    - [x] 添加测试：验证文件类型验证
    - [x] 添加测试：验证文件大小验证
    - [x] 添加测试：验证文件上传成功
    - [x] 添加测试：验证文件删除
    - [x] 添加测试：验证附件关联到互动记录
  - [x] 更新 `attachments/attachments.controller.spec.ts`：
    - [x] 添加测试：验证文件上传端点
    - [x] 添加测试：验证文件类型和大小验证在控制器层面
    - [x] 添加测试：验证附件关联端点

## Dev Notes

### 现有实现分析

**已实现的功能：**
- ✅ 数据库表 `file_attachments` 已创建（迁移脚本 003）
- ✅ 数据库表包含所有必要字段：`file_name`, `file_url`, `file_size`, `file_type`, `mime_type`, `storage_provider`, `storage_key`, `interaction_id`, `metadata` 等
- ✅ 数据库表包含外键约束：`fk_attachments_interaction` 关联到 `product_customer_interactions` 表

**需要实现的功能：**
- ⚠️ 文件上传服务（后端）：需要实现云对象存储集成
- ⚠️ 文件上传 API 端点（后端）：需要创建控制器和端点
- ⚠️ 文件上传组件（前端）：需要创建文件上传 UI 组件
- ⚠️ 文件上传集成（前端）：需要集成到互动记录表单

### 依赖安装和配置

**后端依赖：**
- `@nestjs/platform-express` (通常已包含在 NestJS 中，检查 `package.json`)
- `multer` (通常通过 @nestjs/platform-express 间接依赖)
- `@types/multer` (TypeScript 类型定义，需要安装)
- `uuid` (用于生成存储 key，需要安装)
- `@types/uuid` (TypeScript 类型定义，需要安装)

**安装命令：**
```bash
cd fenghua-backend
npm install uuid @types/uuid --save
npm install @types/multer --save-dev
```

**注意：** 如果使用阿里云 OSS，还需要安装：
```bash
npm install ali-oss --save
```

如果使用 AWS S3，还需要安装：
```bash
npm install @aws-sdk/client-s3 --save
```

如果使用 Cloudflare R2，还需要安装：
```bash
npm install @aws-sdk/client-s3 --save  # R2 兼容 S3 API
```

**文件上传配置（可选）：**
在 `main.ts` 中配置文件上传限制（也可以在拦截器中配置）：

```typescript
// fenghua-backend/src/main.ts
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

**注意：** 文件大小限制也可以在 `FileInterceptor` 中配置：
```typescript
@UseInterceptors(FileInterceptor('file', {
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}))
```

### 技术实现要点

**文件上传服务（后端）：**
```typescript
// 在 attachments/attachments.service.ts 中
@Injectable()
export class AttachmentsService {
  /**
   * 上传文件到云对象存储
   * @param file - 上传的文件（Multer file object）
   * @param userId - 用户ID
   * @param token - JWT token（用于获取 workspace_id）
   * @returns 附件信息（包含 file_url, storage_key 等）
   */
  async uploadFile(file: Express.Multer.File, userId: string, token: string): Promise<Attachment> {
    // 1. 验证文件类型和大小
    this.validateFile(file);
    
    // 2. 获取 workspace_id（参考 ProductsService.getWorkspaceId 实现）
    const workspaceId = await this.getWorkspaceId(token);
    
    // 3. 生成存储 key（使用 UUID + 文件扩展名）
    // 注意：需要安装 uuid 包：npm install uuid @types/uuid
    const { v4: uuidv4 } = require('uuid');
    const storageKey = `${uuidv4()}.${this.getFileExtension(file.originalname)}`;
    
    // 4. 上传到云对象存储（根据配置选择提供商）
    const storageProvider = this.configService.get('STORAGE_PROVIDER', 'aliyun_oss');
    const storageService = this.getStorageProvider(storageProvider);
    const fileUrl = await storageService.upload(file.buffer, storageKey, file.mimetype);
    
    // 5. 保存文件元数据到数据库
    const attachment = await this.saveAttachmentMetadata({
      fileName: file.originalname,
      fileUrl,
      fileSize: file.size,
      fileType: this.getFileType(file.mimetype),
      mimeType: file.mimetype,
      storageProvider,
      storageKey,
      workspaceId, // 必须字段（数据库约束：NOT NULL）
      createdBy: userId,
    });
    
    return attachment;
  }

  /**
   * 获取 workspace_id（参考 ProductsService.getWorkspaceId 实现）
   * 注意：如果项目已移除 Twenty CRM 依赖，可能需要从用户表或其他方式获取
   */
  private async getWorkspaceId(token: string): Promise<string> {
    try {
      // 方法 1：从 JWT payload 中提取（推荐，如果 JWT 包含 workspace_id）
      const payload = this.jwtService.decode(token) as any;
      const workspaceId = payload.workspaceId || payload.workspace_id;
      if (workspaceId) {
        return workspaceId;
      }

      // 方法 2：从用户表查询（如果用户表包含 workspace_id）
      // const user = await this.getUserById(userId);
      // return user.workspaceId;

      // 方法 3：使用默认 workspace（不推荐，仅用于开发测试）
      // return this.configService.get('DEFAULT_WORKSPACE_ID');

      throw new BadRequestException('无法从 token 中获取工作空间ID');
    } catch (error) {
      this.logger.error('Failed to get workspace ID', error);
      throw new BadRequestException('获取工作空间ID失败');
    }
  }

  /**
   * 验证文件类型和大小
   */
  private validateFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const maxFileSize = 10 * 1024 * 1024; // 10MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('不支持的文件类型');
    }
    if (file.size > maxFileSize) {
      throw new BadRequestException('文件大小超过限制（最大 10MB）');
    }
  }

  /**
   * 关联附件到互动记录
   */
  async linkToInteraction(attachmentId: string, interactionId: string): Promise<void> {
    // 更新 interaction_id 字段
    await this.updateAttachment(attachmentId, { interactionId });
  }

  /**
   * 删除附件（从云存储和数据库中删除）
   * @param attachmentId - 附件ID
   * @param userId - 用户ID（用于权限验证）
   */
  async deleteAttachment(attachmentId: string, userId: string): Promise<void> {
    // 1. 查询附件信息（获取 storage_key 和 storage_provider）
    const attachment = await this.getAttachmentById(attachmentId);
    if (!attachment) {
      throw new BadRequestException('附件不存在');
    }

    // 2. 验证权限（确保用户有权限删除）
    if (attachment.createdBy !== userId) {
      throw new ForbiddenException('无权删除此附件');
    }

    // 3. 从云存储删除文件
    const storageService = this.getStorageProvider(attachment.storageProvider);
    await storageService.delete(attachment.storageKey);

    // 4. 从数据库删除记录（软删除）
    await this.updateAttachment(attachmentId, { deletedAt: new Date() });
  }

  /**
   * 获取存储提供商实例
   */
  private getStorageProvider(provider: string): StorageProvider {
    switch (provider) {
      case 'aliyun_oss':
        return this.aliyunOssService;
      case 'aws_s3':
        return this.awsS3Service;
      case 'cloudflare_r2':
        return this.cloudflareR2Service;
      default:
        throw new BadRequestException(`不支持的存储提供商: ${provider}`);
    }
  }
}
```

**文件上传控制器（后端）：**
```typescript
// 在 attachments/attachments.controller.ts 中
@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Token() token: string,
  ): Promise<AttachmentResponseDto> {
    // 验证文件
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    // 调用服务上传文件
    const user = await this.authService.validateToken(token);
    const attachment = await this.attachmentsService.uploadFile(file, user.id, token);

    return this.toResponseDto(attachment);
  }

  @Post(':attachmentId/link')
  async linkToInteraction(
    @Param('attachmentId') attachmentId: string,
    @Body() linkDto: { interactionId: string },
    @Token() token: string,
  ): Promise<void> {
    const user = await this.authService.validateToken(token);
    await this.attachmentsService.linkToInteraction(attachmentId, linkDto.interactionId);
  }
}
```

**文件上传组件（前端）：**
```typescript
// 在 interactions/components/FileUpload.tsx 中
interface FileUploadProps {
  onFilesUploaded: (attachments: Attachment[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // bytes
  allowedFileTypes?: string[];
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUploaded,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', ...],
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Attachment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // 验证文件
    for (const file of files) {
      if (file.size > maxFileSize) {
        setErrors(prev => ({ ...prev, [file.name]: '文件大小超过限制（最大 10MB）' }));
        continue;
      }
      if (!allowedFileTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, [file.name]: '不支持的文件类型' }));
        continue;
      }
    }

    // 上传文件
    for (const file of files) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const xhr = new XMLHttpRequest();
      
      // 跟踪上传进度
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(prev => ({ ...prev, [file.name]: percentComplete }));
        }
      });

      const attachment = await new Promise<Attachment>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('文件上传失败'));
          }
        };
        xhr.onerror = () => reject(new Error('文件上传失败'));
        xhr.open('POST', '/api/attachments/upload');
        xhr.setRequestHeader('Authorization', `Bearer ${getAuthToken()}`);
        xhr.send(formData);
      });

      setUploadedFiles(prev => [...prev, attachment]);
      onFilesUploaded([...uploadedFiles, attachment]);
    } catch (error) {
      setErrors(prev => ({ ...prev, [file.name]: error.message }));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    // 调用删除 API
    await attachmentsService.delete(attachmentId);
    setUploadedFiles(prev => prev.filter(f => f.id !== attachmentId));
  };

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      {/* 上传进度显示 */}
      {Object.entries(uploadProgress).map(([fileName, progress]) => (
        <div key={fileName}>
          <p>{fileName}</p>
          <progress value={progress} max={100} />
          <span>{Math.round(progress)}%</span>
        </div>
      ))}
      {/* 已上传文件列表 */}
      {uploadedFiles.map((file) => (
        <div key={file.id}>
          <span>{file.fileName}</span>
          <span>{formatFileSize(file.fileSize)}</span>
          {file.fileType === 'photo' && <img src={file.fileUrl} alt={file.fileName} />}
          <button onClick={() => handleDelete(file.id)}>删除</button>
        </div>
      ))}
    </div>
  );
};
```

**集成到互动记录表单：**
```typescript
// 在 InteractionCreateForm.tsx 中
const [attachments, setAttachments] = useState<Attachment[]>([]);

const onSubmit = async (data: CreateInteractionDto) => {
  // ... 现有验证逻辑 ...

  // 附件关联策略：先创建互动记录，后上传附件并关联
  // 注意：如果需要在创建互动记录前上传附件，需要修改数据库约束
  // 或者使用临时关联（关联到 product_id，然后更新为 interaction_id）

  // 1. 创建互动记录
  const interaction = await createMutation.mutateAsync(submitData);

  // 2. 上传附件并关联到互动记录（如果有附件）
  if (attachments.length > 0) {
    for (const file of attachments) {
      // 如果附件还未上传，先上传
      let attachment = file;
      if (!file.id) {
        attachment = await attachmentsService.upload(file, {
          interactionId: interaction.id, // 直接关联
        });
      } else {
        // 如果已上传，关联到互动记录
        await attachmentsService.linkToInteraction(attachment.id, interaction.id);
      }
    }
  }
};

return (
  <form onSubmit={handleSubmit(onSubmit)}>
    {/* ... 现有表单字段 ... */}
    
    {/* 文件上传组件 */}
    <FileUpload
      onFilesUploaded={(files) => setAttachments(files)}
      maxFiles={10}
      maxFileSize={10 * 1024 * 1024}
    />
    
    {/* ... 其他表单字段 ... */}
  </form>
);
```

**附件关联策略说明：**

**策略 A：先创建互动记录，后上传附件（推荐）**
1. 用户填写表单并提交
2. 创建互动记录（获得 interaction_id）
3. 上传附件时直接关联 interaction_id
4. 优点：符合数据库约束，逻辑清晰
5. 缺点：如果附件上传失败，需要处理回滚

**策略 B：临时关联，后更新（需要修改数据库约束）**
1. 先上传附件（临时关联到 product_id 或使用占位符）
2. 创建互动记录后，更新附件的 interaction_id
3. 需要修改数据库约束为允许 interaction_id 和 product_id 都为 NULL（临时状态）
4. 不推荐：违反业务逻辑，需要修改数据库约束

**推荐实现：策略 A**
在文件上传时，如果已有 interaction_id，直接关联；如果没有，先上传，创建互动记录后再关联。

### 存储提供商实现模式

**存储接口定义：**
```typescript
// attachments/storage/storage.interface.ts
export interface StorageProvider {
  /**
   * 上传文件到云存储
   * @param buffer - 文件内容（Buffer）
   * @param key - 存储 key（对象存储中的路径）
   * @param mimeType - MIME 类型
   * @returns 文件访问 URL
   */
  upload(buffer: Buffer, key: string, mimeType: string): Promise<string>;

  /**
   * 从云存储删除文件
   * @param key - 存储 key
   */
  delete(key: string): Promise<void>;

  /**
   * 生成签名 URL（用于临时访问）
   * @param key - 存储 key
   * @param expiresIn - 过期时间（秒），默认 3600
   * @returns 签名 URL
   */
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}
```

**具体存储提供商实现示例（阿里云 OSS）：**
```typescript
// attachments/storage/aliyun-oss.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OSS from 'ali-oss';
import { StorageProvider } from './storage.interface';

@Injectable()
export class AliyunOssService implements StorageProvider {
  private client: OSS;

  constructor(private readonly configService: ConfigService) {
    this.client = new OSS({
      region: this.configService.get('ALIYUN_OSS_REGION'),
      accessKeyId: this.configService.get('ALIYUN_OSS_ACCESS_KEY_ID'),
      accessKeySecret: this.configService.get('ALIYUN_OSS_ACCESS_KEY_SECRET'),
      bucket: this.configService.get('ALIYUN_OSS_BUCKET'),
    });
  }

  async upload(buffer: Buffer, key: string, mimeType: string): Promise<string> {
    const result = await this.client.put(key, buffer, {
      headers: {
        'Content-Type': mimeType,
      },
    });
    return result.url;
  }

  async delete(key: string): Promise<void> {
    await this.client.delete(key);
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    return this.client.signatureUrl(key, { expires: expiresIn });
  }
}
```

**在 AttachmentsService 中使用：**
```typescript
// attachments/attachments.service.ts
@Injectable()
export class AttachmentsService {
  constructor(
    private readonly aliyunOssService: AliyunOssService,
    private readonly awsS3Service: AwsS3Service,
    private readonly cloudflareR2Service: CloudflareR2Service,
    // ... 其他依赖
  ) {}

  /**
   * 获取存储提供商实例
   */
  private getStorageProvider(provider: string): StorageProvider {
    switch (provider) {
      case 'aliyun_oss':
        return this.aliyunOssService;
      case 'aws_s3':
        return this.awsS3Service;
      case 'cloudflare_r2':
        return this.cloudflareR2Service;
      default:
        throw new BadRequestException(`不支持的存储提供商: ${provider}`);
    }
  }
}
```

### 项目结构说明

**后端文件：**
- `fenghua-backend/src/attachments/attachments.module.ts` - 附件模块
- `fenghua-backend/src/attachments/attachments.service.ts` - 附件服务（文件上传、删除、关联）
- `fenghua-backend/src/attachments/attachments.controller.ts` - 附件控制器（API 端点）
- `fenghua-backend/src/attachments/dto/upload-attachment.dto.ts` - 上传附件 DTO
- `fenghua-backend/src/attachments/dto/attachment-response.dto.ts` - 附件响应 DTO
- `fenghua-backend/src/attachments/storage/storage.interface.ts` - 存储提供商接口
- `fenghua-backend/src/attachments/storage/aliyun-oss.service.ts` - 阿里云 OSS 实现
- `fenghua-backend/src/attachments/storage/aws-s3.service.ts` - AWS S3 实现
- `fenghua-backend/src/attachments/storage/cloudflare-r2.service.ts` - Cloudflare R2 实现
- `fenghua-backend/src/attachments/attachments.service.spec.ts` - 附件服务测试
- `fenghua-backend/src/attachments/attachments.controller.spec.ts` - 附件控制器测试

**前端文件：**
- `fenghua-frontend/src/attachments/services/attachments.service.ts` - 附件 API 服务
- `fenghua-frontend/src/attachments/components/FileUpload.tsx` - 文件上传组件
- `fenghua-frontend/src/interactions/components/InteractionCreateForm.tsx` - 集成文件上传

### 参考实现

**Story 4.1, 4.2, 4.3 学习：**
- 表单验证模式：使用 `react-hook-form` 进行表单验证
- API 调用模式：使用 `@tanstack/react-query` 进行数据获取和状态管理
- 错误处理模式：使用 `react-toastify` 显示错误消息
- 状态管理模式：使用 `useState` 管理本地状态

**现有代码参考：**
- `fenghua-backend/migrations/003-create-attachments-table.sql` - 数据库表结构
- `docs/database-schema-design.md` - 数据库设计文档
- `docs/infrastructure-decisions.md` - 文件存储决策（云对象存储）

### 存储提供商配置

**支持的存储提供商：**
- 阿里云 OSS（Aliyun OSS）
- AWS S3
- Cloudflare R2

**配置方式：**
- 使用环境变量 `STORAGE_PROVIDER` 选择存储提供商
- 使用环境变量配置存储提供商的访问密钥和区域

### 测试要求

**后端测试：**
- 单元测试：`attachments.service.spec.ts`
  - 测试文件类型验证
  - 测试文件大小验证
  - 测试文件上传成功
  - 测试文件删除
  - 测试附件关联到互动记录
- 集成测试：`attachments.controller.spec.ts`
  - 测试文件上传端点
  - 测试文件类型和大小验证在控制器层面
  - 测试附件关联端点

**前端测试：**
- 组件测试：`FileUpload.test.tsx`（可选，后续实现）
  - 测试文件选择
  - 测试文件验证
  - 测试上传进度显示
  - 测试文件删除

### 快速参考

**关键代码模式：**

```typescript
// 后端：文件上传验证
const allowedMimeTypes = [
  'image/jpeg', 'image/png', 'image/gif',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const maxFileSize = 10 * 1024 * 1024; // 10MB
```

```typescript
// 前端：文件上传进度跟踪（使用 XMLHttpRequest）
const xhr = new XMLHttpRequest();
xhr.upload.addEventListener('progress', (e) => {
  if (e.lengthComputable) {
    const percentComplete = (e.loaded / e.total) * 100;
    setUploadProgress(percentComplete);
  }
});
```

```typescript
// 前端：使用 react-query 的文件上传（可选，推荐）
const uploadMutation = useMutation({
  mutationFn: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return await attachmentsService.upload(formData, {
      onUploadProgress: (progress) => {
        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
      },
    });
  },
  onSuccess: (attachment, file) => {
    setUploadedFiles(prev => [...prev, attachment]);
    onFilesUploaded([...uploadedFiles, attachment]);
  },
  onError: (error, file) => {
    setErrors(prev => ({ ...prev, [file.name]: error.message }));
  },
});
```

```typescript
// 前端：文件预览
{file.fileType === 'photo' && (
  <img src={file.fileUrl} alt={file.fileName} className="w-20 h-20 object-cover" />
)}
```

```typescript
// 后端：文件删除实现
async deleteAttachment(attachmentId: string, userId: string): Promise<void> {
  // 1. 查询附件信息
  const attachment = await this.getAttachmentById(attachmentId);
  
  // 2. 验证权限
  if (attachment.createdBy !== userId) {
    throw new ForbiddenException('无权删除此附件');
  }
  
  // 3. 从云存储删除
  const storageService = this.getStorageProvider(attachment.storageProvider);
  await storageService.delete(attachment.storageKey);
  
  // 4. 从数据库软删除
  await this.updateAttachment(attachmentId, { deletedAt: new Date() });
}
```

## Dev Agent Record

### Agent Model Used

Auto (Cursor AI)

### Debug Log References

N/A

### Completion Notes List

1. **后端实现：**
   - 创建了 `attachments` 模块，包含 `AttachmentsService`、`AttachmentsController` 和 `AttachmentsModule`
   - 实现了存储提供商接口 `StorageProvider` 和本地存储实现 `LocalStorageService`（用于开发测试）
   - 实现了文件上传、删除、关联到互动记录的功能
   - 实现了文件类型和大小验证（应用层验证）
   - 实现了 `getWorkspaceId` 方法（从 JWT token 中提取 workspace_id）
   - 创建了 DTOs：`AttachmentResponseDto`、`LinkAttachmentDto`

2. **前端实现：**
   - 创建了 `attachments` 服务，包含文件上传、删除、关联到互动记录的 API 调用
   - 创建了 `FileUpload` 组件，支持文件选择、上传进度显示、已上传文件列表、文件预览和删除
   - 集成到 `InteractionCreateForm`，实现了附件关联策略（先创建互动记录，后关联附件）

3. **测试实现：**
   - 创建了 `attachments.service.spec.ts`，包含文件上传、删除、关联的单元测试
   - 创建了 `attachments.controller.spec.ts`，包含控制器端点的单元测试

4. **依赖安装：**
   - 安装了 `uuid`、`@types/uuid`、`@types/multer`

5. **注意事项：**
   - 当前使用本地存储（`LocalStorageService`）作为临时实现，生产环境需要替换为云存储（阿里云 OSS、AWS S3 或 Cloudflare R2）
   - 文件上传限制：单个文件最大 10MB，最多 10 个文件
   - 支持的文件类型：图片（JPG, PNG, GIF）、文档（PDF, DOC, DOCX, XLS, XLSX）

### File List

**后端文件：**
- `fenghua-backend/src/attachments/attachments.module.ts` - 附件模块
- `fenghua-backend/src/attachments/attachments.service.ts` - 附件服务（文件上传、删除、关联）
- `fenghua-backend/src/attachments/attachments.controller.ts` - 附件控制器（API 端点）
- `fenghua-backend/src/attachments/dto/attachment-response.dto.ts` - 附件响应 DTO
- `fenghua-backend/src/attachments/dto/link-attachment.dto.ts` - 关联附件 DTO
- `fenghua-backend/src/attachments/storage/storage.interface.ts` - 存储提供商接口
- `fenghua-backend/src/attachments/storage/local-storage.service.ts` - 本地存储实现（开发测试用）
- `fenghua-backend/src/attachments/attachments.service.spec.ts` - 附件服务测试
- `fenghua-backend/src/attachments/attachments.controller.spec.ts` - 附件控制器测试
- `fenghua-backend/src/app.module.ts` - 更新：添加 AttachmentsModule

**前端文件：**
- `fenghua-frontend/src/attachments/services/attachments.service.ts` - 附件 API 服务
- `fenghua-frontend/src/attachments/components/FileUpload.tsx` - 文件上传组件
- `fenghua-frontend/src/interactions/components/InteractionCreateForm.tsx` - 更新：集成文件上传

