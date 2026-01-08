# Story 4.5: 生产进度跟进照片上传（后端专员）

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **后端专员**,
I want **在记录生产进度跟进时上传生产照片**,
so that **我可以记录生产现场情况，为后续验收提供依据**.

## Acceptance Criteria

**AC1: 照片选择对话框**
- **Given** 后端专员填写生产进度跟进互动记录
- **When** 后端专员点击"上传生产照片"按钮
- **Then** 系统显示照片选择对话框
- **And** 系统支持选择多张照片（最多 10 张）
- **And** 系统支持从电脑选择照片文件
- **And** 系统只允许选择图片文件（JPG, PNG, GIF）
- **And** 系统显示文件大小限制（单个文件最大 10MB）

**AC2: 照片上传和压缩**
- **Given** 后端专员选择照片上传
- **When** 后端专员选择照片并确认
- **Then** 系统开始上传照片
- **And** 系统显示上传进度条（每张照片的进度）
- **And** 系统自动压缩照片（如果照片过大），减少上传时间
- **And** 系统在上传过程中显示文件名和上传进度百分比

**AC3: 照片上传成功处理**
- **Given** 照片上传成功
- **When** 照片上传完成
- **Then** 系统将照片保存到存储系统（云对象存储）
- **And** 系统在表单中显示已上传的照片缩略图（网格布局）
- **And** 后端专员可以点击缩略图查看大图（模态框或新页面）
- **And** 后端专员可以删除已上传的照片（在上传后、提交前）
- **And** 每张照片显示：缩略图、文件名、文件大小

**AC4: 照片上传失败处理**
- **Given** 照片上传失败
- **When** 照片上传过程中网络中断或文件过大
- **Then** 系统显示错误消息（如"照片上传失败，请重试"或"文件大小超过限制"）
- **And** 系统提供"重试"按钮
- **And** 用户可以重新选择照片上传

**AC5: 照片与互动记录关联**
- **Given** 后端专员提交生产进度跟进记录
- **When** 记录包含生产照片
- **Then** 系统保存互动记录和照片关联关系（使用 `interaction_id` 外键）
- **And** 照片在互动历史中正确显示（后续 story 会实现详细显示）
- **And** 用户可以查看照片大图

**AC6: 互动类型验证**
- **Given** 后端专员填写互动记录表单
- **When** 后端专员选择互动类型为"生产进度跟进"（`PRODUCTION_PROGRESS`）
- **Then** 系统显示"上传生产照片"按钮
- **And** 如果互动类型不是"生产进度跟进"，系统不显示"上传生产照片"按钮（可选，或显示但禁用）

## Tasks / Subtasks

- [x] Task 1: 扩展文件上传组件支持照片专用模式 (AC: #1, #2, #3, #4)
  - [x] 在 `FileUpload` 组件中添加 `photoOnly?: boolean` prop（默认 false）
  - [x] **重要：** 实现 `photoOnly` 模式逻辑：如果 `photoOnly=true`，覆盖 `allowedFileTypes` 为仅图片类型（`['image/jpeg', 'image/png', 'image/gif']`）
  - [x] **重要：** 确保向后兼容：如果 `photoOnly=false` 或未设置，使用原有的 `allowedFileTypes` 逻辑
  - [x] 在 `FileUpload` 组件中添加 `maxFiles` 配置（默认 10 张，已存在，无需修改）
  - [x] 实现照片自动压缩功能（前端压缩，使用 `browser-image-compression`）
  - [x] **重要：** 实现压缩失败处理：压缩失败时回退到原文件，但验证文件大小限制
  - [x] **重要：** 实现压缩进度提示：显示"正在压缩照片..." toast 消息
  - [x] **重要：** 实现压缩后文件大小验证：确保压缩后不超过 10MB 限制
  - [x] 实现照片缩略图网格布局显示（photoOnly 模式使用网格布局）
  - [x] 实现照片大图预览功能（模态框，使用 `PhotoPreview` 组件）
  - [x] 优化照片上传进度显示（每张照片独立进度条）

- [x] Task 2: 集成照片上传到生产进度跟进表单 (AC: #1, #2, #3, #4, #5, #6)
  - [x] 在 `InteractionCreateForm.tsx` 中使用 `watch('interactionType')` 检测互动类型
  - [x] 当互动类型为 `PRODUCTION_PROGRESS` 时，显示照片上传组件
  - [x] **重要：** 实现互动类型变化处理：使用 `useEffect` 监听 `interactionType` 变化
  - [x] **重要：** 当互动类型从 `PRODUCTION_PROGRESS` 切换到其他类型时，清空已上传的照片（避免状态不一致）
  - [x] 使用 `FileUpload` 组件的 `photoOnly={true}` 模式
  - [x] 设置 `maxFiles={10}` 限制
  - [x] 在提交互动记录时，关联照片到互动记录（调用关联 API，参考 Story 4.4 的实现）
  - [x] 确保照片上传失败不影响互动记录创建（先创建互动记录，后关联照片）

- [x] Task 3: 实现照片自动压缩功能（前端）(AC: #2)
  - [x] 安装 `browser-image-compression` 库（`npm install browser-image-compression`）
  - [x] 在 `FileUpload` 组件中实现 `compressImage` 函数
  - [x] **重要：** 实现压缩前检查：如果文件已经小于 2MB，跳过压缩以提高性能
  - [x] 压缩参数：`maxSizeMB: 2`（压缩后目标大小），`maxWidthOrHeight: 1920`，`initialQuality: 0.8`，`useWebWorker: true`
  - [x] **重要：** 实现压缩失败处理：捕获错误，显示警告消息，回退到原文件
  - [x] **重要：** 实现压缩后验证：确保压缩后文件不超过 10MB 限制，如果超过则使用原文件
  - [x] 在压缩前显示"正在压缩照片..." toast 提示
  - [x] 压缩后显示压缩前后文件大小对比 toast 消息（例如："5.2MB → 1.8MB"）
  - [x] **重要：** 如果原文件超过 10MB 且压缩失败，抛出错误阻止上传

- [x] Task 4: 实现照片预览功能 (AC: #3)
  - [x] 创建 `PhotoPreview` 组件（模态框显示大图）
  - [x] **重要：** 实现状态管理：在 `FileUpload` 组件中使用 `useState` 管理 `selectedPhotoIndex`
  - [x] 实现点击缩略图打开大图预览（设置 `selectedPhotoIndex`）
  - [x] 支持键盘导航（左右箭头切换照片，ESC 关闭）
  - [x] **重要：** 实现图片加载状态：显示"加载中..."提示（带加载动画）
  - [x] **重要：** 实现图片加载错误处理：显示错误消息和"在新窗口打开"链接
  - [x] 显示照片信息（文件名、文件大小、当前索引/总数）
  - [x] **重要：** 实现移动端适配：响应式设计，触摸友好的按钮大小
  - [x] 支持点击背景关闭预览
  - [x] 支持图片缩放（可选，使用 `react-image-zoom` 或类似库）- 暂未实现，可后续添加

- [x] Task 5: 更新后端验证（可选）(AC: #6)
  - [x] 在 `AttachmentsService` 中添加验证：如果互动类型为 `PRODUCTION_PROGRESS`，确保附件类型为 `photo` - 跳过（前端已限制，后端验证可选）
  - [x] 在控制器中添加验证逻辑（可选，前端已限制）- 跳过（前端已限制）

- [x] Task 6: 更新测试用例 (AC: #1, #2, #3, #4, #5, #6)
  - [x] 更新 `FileUpload` 组件测试（如果存在）：
    - [x] 添加测试：验证 `photoOnly` 模式只允许图片文件 - 跳过（前端组件测试暂未实现）
    - [x] 添加测试：验证照片压缩功能 - 跳过（前端组件测试暂未实现）
    - [x] 添加测试：验证照片预览功能 - 跳过（前端组件测试暂未实现）
  - [x] 更新 `InteractionCreateForm` 测试（如果存在）：
    - [x] 添加测试：验证生产进度跟进时显示照片上传组件 - 跳过（前端组件测试暂未实现）
    - [x] 添加测试：验证其他互动类型不显示照片上传组件 - 跳过（前端组件测试暂未实现）

## Dev Notes

### 现有实现分析

**已实现的功能：**
- ✅ 文件上传服务（后端）：`AttachmentsService` 已实现
- ✅ 文件上传 API 端点（后端）：`POST /api/attachments/upload` 已实现
- ✅ 文件上传组件（前端）：`FileUpload` 组件已实现
- ✅ 附件关联 API 端点（后端）：`POST /api/attachments/:attachmentId/link` 已实现
- ✅ 互动记录创建表单：`InteractionCreateForm` 已实现

**需要扩展的功能：**
- ⚠️ 照片专用上传模式：需要扩展 `FileUpload` 组件支持 `photoOnly` 模式
  - **重要：** 实现方式：如果 `photoOnly=true`，覆盖 `allowedFileTypes` 为仅图片类型
  - **重要：** 保持向后兼容：如果 `photoOnly=false` 或未设置，使用原有的 `allowedFileTypes` 逻辑
- ⚠️ 照片自动压缩：需要实现前端照片压缩功能
  - **重要：** 压缩失败处理：回退到原文件，但验证文件大小限制
  - **重要：** 压缩进度提示：显示 toast 消息
  - **重要：** 压缩后验证：确保不超过 10MB 限制
- ⚠️ 照片预览：需要实现照片大图预览功能
  - **重要：** 状态管理：在 `FileUpload` 组件中管理 `selectedPhotoIndex`
  - **重要：** 错误处理：图片加载失败时显示错误消息
  - **重要：** 移动端适配：响应式设计
- ⚠️ 互动类型检测：需要在表单中检测互动类型并显示照片上传组件
  - **重要：** 状态重置：互动类型变化时清空已上传的照片
  - **重要：** 使用 `useEffect` 监听 `interactionType` 变化

### 依赖安装

**前端依赖：**
- `browser-image-compression` (用于照片压缩)
- `react-image-zoom` (可选，用于照片缩放预览)

**安装命令：**
```bash
cd fenghua-frontend
npm install browser-image-compression
npm install react-image-zoom --save  # 可选
```

### 技术实现要点

**照片压缩实现（前端）：**
```typescript
// 在 FileUpload 组件中
import imageCompression from 'browser-image-compression';

/**
 * 压缩照片
 * @param file - 原始照片文件
 * @param onProgress - 压缩进度回调（可选）
 * @returns 压缩后的文件，如果压缩失败则返回原文件
 */
const compressImage = async (
  file: File,
  onProgress?: (progress: number) => void,
): Promise<File> => {
  // 如果文件已经小于 2MB，不需要压缩
  if (file.size <= 2 * 1024 * 1024) {
    return file;
  }

  const options = {
    maxSizeMB: 2, // 最大文件大小 2MB（压缩后）
    maxWidthOrHeight: 1920, // 最大宽度或高度 1920px
    useWebWorker: true, // 使用 Web Worker 加速压缩
    fileType: file.type, // 保持原始文件类型
    initialQuality: 0.8, // 初始质量 80%
    // 注意：browser-image-compression 不支持进度回调，需要手动实现
  };

  try {
    // 显示压缩提示
    toast.info(`正在压缩照片: ${file.name}...`);
    
    const compressedFile = await imageCompression(file, options);
    
    // 验证压缩后的文件大小（确保不超过限制）
    if (compressedFile.size > 10 * 1024 * 1024) {
      toast.warn(`照片压缩后仍超过 10MB，将使用原文件: ${file.name}`);
      return file;
    }
    
    // 显示压缩结果
    const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
    const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
    toast.success(
      `照片压缩完成: ${file.name} (${originalSizeMB}MB → ${compressedSizeMB}MB)`
    );
    
    return compressedFile;
  } catch (error) {
    console.error('照片压缩失败', error);
    toast.warn(`照片压缩失败，将使用原文件: ${file.name}`);
    // 如果压缩失败，返回原文件（但需要验证文件大小）
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('照片文件过大且压缩失败，无法上传');
    }
    return file;
  }
};
```

**压缩参数说明：**
- `maxSizeMB: 2` - 压缩后目标大小 2MB，适合大多数照片
- `maxWidthOrHeight: 1920` - 适合桌面端和移动端显示，保持良好质量
- `initialQuality: 0.8` - 80% 质量，在文件大小和质量之间取得平衡
- 如果原始照片已经小于 2MB，跳过压缩以提高性能
- 压缩失败时回退到原文件，但需要验证文件大小限制

**照片预览组件：**
```typescript
// PhotoPreview.tsx
import { useEffect, useState } from 'react';
import { Attachment, formatFileSize } from '../services/attachments.service';

interface PhotoPreviewProps {
  photos: Attachment[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  photos,
  currentIndex,
  onClose,
  onNext,
  onPrevious,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const currentPhoto = photos[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onPrevious();
      } else if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrevious, currentIndex, photos.length]);

  // 重置图片状态当切换照片时
  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
  }, [currentIndex]);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-full p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            加载中...
          </div>
        )}
        {imageError ? (
          <div className="bg-gray-800 p-8 rounded text-white text-center">
            <p className="text-lg mb-2">图片加载失败</p>
            <p className="text-sm text-gray-400">{currentPhoto.fileName}</p>
            <a
              href={currentPhoto.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 mt-4 inline-block"
            >
              在新窗口打开
            </a>
          </div>
        ) : (
          <img
            src={currentPhoto.fileUrl}
            alt={currentPhoto.fileName}
            className="max-w-full max-h-screen object-contain"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: imageLoading ? 'none' : 'block' }}
          />
        )}
        
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-colors"
          aria-label="关闭预览"
        >
          ×
        </button>
        
        {/* 上一张按钮 */}
        {currentIndex > 0 && (
          <button
            onClick={onPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:text-gray-300 transition-colors"
            aria-label="上一张"
          >
            ‹
          </button>
        )}
        
        {/* 下一张按钮 */}
        {currentIndex < photos.length - 1 && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:text-gray-300 transition-colors"
            aria-label="下一张"
          >
            ›
          </button>
        )}
        
        {/* 照片信息 */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 rounded px-4 py-2 text-white text-center">
          <div className="text-sm">
            {currentIndex + 1} / {photos.length}
          </div>
          <div className="text-xs text-gray-300 mt-1">
            {currentPhoto.fileName} ({formatFileSize(currentPhoto.fileSize)})
          </div>
        </div>
      </div>
    </div>
  );
};
```

**在 FileUpload 组件中集成照片预览：**
```typescript
// 在 FileUpload.tsx 中
import { PhotoPreview } from './PhotoPreview';

const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

// 在已上传文件列表中添加点击事件
{uploadedFiles.map((file, index) => (
  <div key={file.id}>
    {file.fileType === 'photo' && (
      <img
        src={file.fileUrl}
        alt={file.fileName}
        className="w-12 h-12 object-cover rounded cursor-pointer"
        onClick={() => setSelectedPhotoIndex(index)}
      />
    )}
    {/* ... 其他文件信息 ... */}
  </div>
))}

{/* 照片预览模态框 */}
{selectedPhotoIndex !== null && (
  <PhotoPreview
    photos={uploadedFiles.filter(f => f.fileType === 'photo')}
    currentIndex={selectedPhotoIndex}
    onClose={() => setSelectedPhotoIndex(null)}
    onNext={() => {
      const photoFiles = uploadedFiles.filter(f => f.fileType === 'photo');
      if (selectedPhotoIndex < photoFiles.length - 1) {
        setSelectedPhotoIndex(selectedPhotoIndex + 1);
      }
    }}
    onPrevious={() => {
      if (selectedPhotoIndex > 0) {
        setSelectedPhotoIndex(selectedPhotoIndex - 1);
      }
    }}
  />
)}
```

**在 InteractionCreateForm 中集成：**
```typescript
// 在 InteractionCreateForm.tsx 中
import { BackendInteractionType } from '../services/interactions.service';
import { FileUpload } from '../../attachments/components/FileUpload';

const [attachments, setAttachments] = useState<Attachment[]>([]);
const interactionType = watch('interactionType');
const isProductionProgress = interactionType === BackendInteractionType.PRODUCTION_PROGRESS;

// 处理互动类型变化：如果从生产进度切换到其他类型，清空已上传的照片
useEffect(() => {
  if (!isProductionProgress && attachments.length > 0) {
    // 可选：提示用户照片将被清除
    // toast.warn('切换互动类型将清除已上传的照片');
    setAttachments([]);
  }
}, [interactionType, isProductionProgress]);

return (
  <form onSubmit={handleSubmit(onSubmit)}>
    {/* ... 现有表单字段 ... */}
    
    {/* 生产进度照片上传 */}
    {isProductionProgress && (
      <FileUpload
        photoOnly={true}
        maxFiles={10}
        maxFileSize={10 * 1024 * 1024}
        onFilesUploaded={setAttachments}
        initialAttachments={attachments}
      />
    )}
    
    {/* ... 其他表单字段 ... */}
  </form>
);
```

**互动类型变化处理策略：**
- **策略 A（推荐）：** 当互动类型从 `PRODUCTION_PROGRESS` 切换到其他类型时，清空已上传的照片
  - 优点：避免状态不一致，确保照片只与生产进度记录关联
  - 实现：使用 `useEffect` 监听 `interactionType` 变化
- **策略 B（可选）：** 保留照片但禁用上传组件
  - 优点：用户不会丢失已上传的照片
  - 缺点：可能导致状态不一致（照片关联到错误的互动类型）
- **推荐使用策略 A**，在切换时提示用户照片将被清除

### 项目结构说明

**前端文件：**
- `fenghua-frontend/src/attachments/components/FileUpload.tsx` - 更新：添加 `photoOnly` 模式和照片压缩
- `fenghua-frontend/src/attachments/components/PhotoPreview.tsx` - 新建：照片预览组件
- `fenghua-frontend/src/interactions/components/InteractionCreateForm.tsx` - 更新：集成生产进度照片上传

### 参考实现

**Story 4.4 学习：**
- 文件上传组件实现模式
- 附件关联策略
- 上传进度显示
- 错误处理模式

**现有代码参考：**
- `fenghua-frontend/src/attachments/components/FileUpload.tsx` - 文件上传组件
- `fenghua-frontend/src/interactions/components/InteractionCreateForm.tsx` - 互动记录创建表单
- `fenghua-backend/src/attachments/attachments.service.ts` - 附件服务

### 照片压缩参数

**推荐压缩参数：**
- `maxSizeMB: 2` - 压缩后目标大小 2MB，适合大多数照片
- `maxWidthOrHeight: 1920` - 适合桌面端和移动端显示，保持良好质量
- `initialQuality: 0.8` - 80% 质量，在文件大小和质量之间取得平衡
- `useWebWorker: true` - 使用 Web Worker 加速压缩，不阻塞主线程

**压缩策略：**
- **跳过压缩：** 如果原始照片已经小于 2MB，跳过压缩以提高性能
- **动态调整：** 对于超大照片（>10MB），可能需要更激进的压缩参数
- **质量平衡：** 0.8 质量适合大多数场景，如果照片质量要求高，可以提高到 0.9

**压缩前后对比：**
- 原始照片：5-10MB
- 压缩后：1-2MB
- 压缩时间：1-3 秒（取决于照片大小和浏览器性能）

**压缩失败处理：**
- 如果压缩失败，回退到原文件
- 如果原文件超过 10MB，阻止上传并显示错误消息
- 如果原文件在 10MB 以内，允许上传原文件

### 测试要求

**前端测试：**
- 组件测试：`FileUpload.test.tsx`（如果存在）
  - 测试 `photoOnly` 模式只允许图片文件
  - 测试照片压缩功能
  - 测试照片预览功能
- 集成测试：`InteractionCreateForm.test.tsx`（如果存在）
  - 测试生产进度跟进时显示照片上传组件
  - 测试其他互动类型不显示照片上传组件

### 错误处理策略

**网络中断处理：**
- 上传失败时，显示错误消息并提供"重试"按钮
- 重试逻辑：重新调用 `uploadFile` 函数
- 部分成功处理：如果多张照片中部分上传成功，保留成功上传的照片，只重试失败的照片

**压缩失败处理：**
- 捕获压缩错误，显示警告消息
- 如果原文件在 10MB 以内，回退到原文件并继续上传
- 如果原文件超过 10MB，阻止上传并显示错误消息

**上传失败处理：**
- 单张照片上传失败：显示错误消息，允许用户删除失败的照片并重新上传
- 多张照片部分失败：显示成功和失败的照片列表，允许用户重试失败的照片
- 确保失败的照片不影响已成功上传的照片

**图片加载失败处理：**
- 在 `PhotoPreview` 组件中捕获图片加载错误
- 显示错误消息和"在新窗口打开"链接
- 允许用户通过链接直接访问图片

### 快速参考

**关键代码模式：**

```typescript
// FileUpload 组件：photoOnly 模式实现
const effectiveAllowedTypes = photoOnly
  ? ['image/jpeg', 'image/png', 'image/gif'] // 覆盖为仅图片类型
  : allowedFileTypes; // 使用传入的类型或默认类型

// 照片压缩（带错误处理）
const compressImage = async (file: File): Promise<File> => {
  if (file.size <= 2 * 1024 * 1024) return file; // 跳过小文件
  
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });
    if (compressed.size > 10 * 1024 * 1024) {
      throw new Error('压缩后仍超过限制');
    }
    return compressed;
  } catch (error) {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('照片过大且压缩失败');
    }
    return file; // 回退到原文件
  }
};
```

```typescript
// 照片预览状态管理
const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
const photoFiles = uploadedFiles.filter(f => f.fileType === 'photo');

{selectedPhotoIndex !== null && (
  <PhotoPreview
    photos={photoFiles}
    currentIndex={selectedPhotoIndex}
    onClose={() => setSelectedPhotoIndex(null)}
    onNext={() => {
      if (selectedPhotoIndex < photoFiles.length - 1) {
        setSelectedPhotoIndex(selectedPhotoIndex + 1);
      }
    }}
    onPrevious={() => {
      if (selectedPhotoIndex > 0) {
        setSelectedPhotoIndex(selectedPhotoIndex - 1);
      }
    }}
  />
)}
```

```typescript
// 互动类型检测和状态重置
const interactionType = watch('interactionType');
const isProductionProgress = interactionType === BackendInteractionType.PRODUCTION_PROGRESS;

useEffect(() => {
  if (!isProductionProgress && attachments.length > 0) {
    setAttachments([]); // 清空照片
  }
}, [interactionType, isProductionProgress]);
```

## Dev Agent Record

### Agent Model Used

Auto (Cursor AI)

### Debug Log References

N/A

### Completion Notes List

1. **前端实现：**
   - 扩展了 `FileUpload` 组件，添加了 `photoOnly` prop 支持照片专用模式
   - 实现了照片自动压缩功能（使用 `browser-image-compression`）
   - 实现了压缩失败处理、进度提示、大小验证
   - 实现了照片缩略图网格布局（photoOnly 模式）
   - 创建了 `PhotoPreview` 组件，支持照片大图预览、键盘导航、错误处理
   - 在 `InteractionCreateForm` 中集成了生产进度照片上传功能
   - 实现了互动类型检测和状态重置逻辑

2. **依赖安装：**
   - 安装了 `browser-image-compression` 库

3. **功能特性：**
   - `photoOnly` 模式：仅允许图片文件（JPG, PNG, GIF）
   - 照片压缩：自动压缩大于 2MB 的照片，压缩后目标大小 2MB
   - 照片预览：点击缩略图查看大图，支持键盘导航（左右箭头、ESC）
   - 网格布局：photoOnly 模式使用网格布局显示照片缩略图
   - 状态管理：互动类型变化时自动清空照片，避免状态不一致

4. **注意事项：**
   - 照片压缩失败时会回退到原文件，但如果原文件超过 10MB 会阻止上传
   - 压缩进度通过 toast 消息显示，压缩结果会显示大小对比
   - 照片预览组件支持移动端适配，按钮大小适合触摸操作
   - 前端组件测试暂未实现（项目当前没有前端组件测试框架）

### File List

**前端文件：**
- `fenghua-frontend/src/attachments/components/FileUpload.tsx` - 更新：添加 `photoOnly` 模式、照片压缩、照片预览集成
- `fenghua-frontend/src/attachments/components/PhotoPreview.tsx` - 新建：照片预览组件
- `fenghua-frontend/src/interactions/components/InteractionCreateForm.tsx` - 更新：集成生产进度照片上传、互动类型检测、状态重置
- `fenghua-frontend/package.json` - 更新：添加 `browser-image-compression` 依赖

