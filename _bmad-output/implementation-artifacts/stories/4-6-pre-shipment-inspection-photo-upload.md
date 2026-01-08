# Story 4.6: 发货前验收照片上传（后端专员）

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **后端专员**,
I want **在记录发货前验收时上传多张验收照片**,
so that **我可以从多个角度记录验收情况，确保验收记录的完整性**.

## Acceptance Criteria

**AC1: 照片选择对话框**
- **Given** 后端专员填写发货前验收互动记录
- **When** 后端专员点击"上传验收照片"按钮
- **Then** 系统显示照片选择对话框
- **And** 系统支持选择多张照片（最多 20 张）
- **And** 系统支持从电脑选择照片文件
- **And** 系统支持拖拽上传照片（拖拽文件到上传区域）
- **And** 系统只允许选择图片文件（JPG, PNG, GIF）
- **And** 系统显示文件大小限制（单个文件最大 10MB）

**AC2: 照片批量上传和压缩**
- **Given** 后端专员选择多张照片上传
- **When** 后端专员选择照片并确认
- **Then** 系统开始批量上传照片
- **And** 系统显示每张照片的上传进度（独立进度条）
- **And** 系统显示总体上传进度（可选，如"已上传 5/20 张"）
- **And** 系统自动压缩照片（如果照片过大），减少上传时间
- **And** 系统在上传过程中显示文件名和上传进度百分比

**AC3: 照片上传成功处理**
- **Given** 照片上传成功
- **When** 所有照片上传完成
- **Then** 系统将照片保存到存储系统（云对象存储）
- **And** 系统在表单中显示已上传的照片网格视图
- **And** 后端专员可以点击照片查看大图（模态框或新页面）
- **And** 后端专员可以拖拽照片调整顺序（在网格视图中拖拽排序）
- **And** 后端专员可以为每张照片添加标注（可选，如"正面"、"侧面"、"问题区域"等）
- **And** 后端专员可以删除已上传的照片（在上传后、提交前）
- **And** 每张照片显示：缩略图、文件名、文件大小、标注（如果有）

**AC4: 照片上传失败处理**
- **Given** 照片上传失败
- **When** 照片上传过程中网络中断或文件过大
- **Then** 系统显示错误消息（如"照片上传失败，请重试"或"文件大小超过限制"）
- **And** 系统提供"重试"按钮（针对失败的照片）
- **And** 用户可以重新选择照片上传
- **And** 部分照片上传成功时，系统显示成功和失败的照片列表

**AC5: 照片与互动记录关联**
- **Given** 后端专员提交发货前验收记录
- **When** 记录包含多张验收照片
- **Then** 系统保存互动记录和照片关联关系（使用 `interaction_id` 外键）
- **And** 照片按上传顺序或用户调整后的顺序保存（使用 `metadata` 字段存储顺序和标注）
- **And** 照片在互动历史中正确显示，支持查看大图和切换照片（后续 story 会实现详细显示）

**AC6: 互动类型验证**
- **Given** 后端专员填写互动记录表单
- **When** 后端专员选择互动类型为"发货前验收"（`PRE_SHIPMENT_INSPECTION`）
- **Then** 系统显示"上传验收照片"按钮
- **And** 如果互动类型不是"发货前验收"，系统不显示"上传验收照片"按钮（或显示但禁用）

## Tasks / Subtasks

- [x] Task 1: 扩展文件上传组件支持拖拽上传和更多照片 (AC: #1, #2, #3, #4)
  - [ ] 在 `FileUpload` 组件中添加拖拽上传功能（使用 HTML5 drag and drop API）
  - [ ] **重要：** 拖拽区域范围：整个上传区域（文件输入区域），但已上传照片的网格区域除外（避免与照片排序拖拽冲突）
  - [ ] **重要：** 拖拽事件优先级：文件上传拖拽优先于照片排序拖拽（通过事件目标判断）
  - [ ] **重要：** 移动端降级：移动端不支持拖拽，自动降级为文件选择方式（检测 `dataTransfer` 支持）
  - [ ] 实现拖拽区域高亮效果（拖拽文件进入时显示视觉反馈，如边框高亮、背景色变化）
  - [ ] 实现拖拽文件验证（文件类型、大小、数量限制，与文件选择验证逻辑一致）
  - [ ] 更新 `maxFiles` 配置支持动态设置（发货前验收：20 张，生产进度：10 张）
  - [ ] 实现批量上传进度显示（每张照片独立进度条 + 总体进度）
  - [ ] 实现部分上传失败处理（显示成功和失败的照片列表，失败照片显示重试按钮）

- [x] Task 2: 实现照片拖拽排序功能 (AC: #3)
  - [ ] 在 `FileUpload` 组件中实现照片拖拽排序（使用 `react-beautiful-dnd` 或 `@dnd-kit/core`）
  - [ ] 保存照片顺序到组件状态（`uploadedFiles` 数组顺序）
  - [ ] 在提交互动记录时，将照片顺序保存到 `metadata` 字段（JSON 格式：`{ order: number, annotation?: string }`）
  - [ ] 实现拖拽排序的视觉反馈（拖拽时显示占位符）

- [x] Task 3: 实现照片标注功能（可选）(AC: #3)
  - [ ] 在照片网格视图中添加"添加标注"按钮（每张照片）
  - [ ] 实现标注输入对话框（点击按钮后显示输入框）
  - [ ] 保存标注到照片的 `metadata` 字段（JSON 格式：`{ order: number, annotation: string }`）
  - [ ] 在照片缩略图下方显示标注文本（如果有）
  - [ ] 支持编辑和删除标注

- [x] Task 4: 集成照片上传到发货前验收表单 (AC: #1, #2, #3, #4, #5, #6)
  - [ ] 在 `InteractionCreateForm.tsx` 中使用 `watch('interactionType')` 检测互动类型
  - [ ] 当互动类型为 `PRE_SHIPMENT_INSPECTION` 时，显示照片上传组件
  - [ ] **重要：** 实现互动类型变化处理：使用 `useEffect` 监听 `interactionType` 变化
  - [ ] **重要：** 当互动类型从 `PRE_SHIPMENT_INSPECTION` 切换到其他类型时，清空已上传的照片（避免状态不一致）
  - [ ] 使用 `FileUpload` 组件的 `photoOnly={true}` 模式
  - [ ] 设置 `maxFiles={20}` 限制（发货前验收支持更多照片）
  - [ ] 在提交互动记录时，关联照片到互动记录（调用关联 API，参考 Story 4.4 的实现）
  - [ ] 保存照片顺序和标注到 `metadata` 字段（JSON 格式）
  - [ ] 确保照片上传失败不影响互动记录创建（先创建互动记录，后关联照片）

- [x] Task 5: 更新后端支持照片顺序和标注 (AC: #5)
  - [ ] **重要：** 创建 `UpdateAttachmentMetadataDto`（包含 `order?: number` 和 `annotation?: string` 字段）
  - [ ] **重要：** 在 `AttachmentsController` 中添加 `PATCH /api/attachments/:attachmentId/metadata` 端点（必需，不是可选）
  - [ ] **重要：** 在 `AttachmentsService` 中添加 `updateMetadata` 方法，验证 `metadata` 字段格式
  - [ ] 确保 `metadata` 字段可以存储 JSON 数据（顺序和标注），格式：`{ order: number, annotation?: string }`
  - [ ] 在 `AttachmentResponseDto` 中返回 `metadata` 字段（如果存在）
  - [ ] 添加错误处理：如果附件不存在或用户无权限，返回相应错误
  - [ ] 数据库 `metadata` 字段已经是 JSONB 类型，无需修改迁移脚本

- [ ] Task 6: 更新测试用例 (AC: #1, #2, #3, #4, #5, #6)
  - [ ] 更新 `FileUpload` 组件测试（如果存在）：
    - [ ] 添加测试：验证拖拽上传功能
    - [ ] 添加测试：验证照片排序功能
    - [ ] 添加测试：验证照片标注功能
    - [ ] 添加测试：验证批量上传进度显示
  - [ ] 更新 `InteractionCreateForm` 测试（如果存在）：
    - [ ] 添加测试：验证发货前验收时显示照片上传组件
    - [ ] 添加测试：验证照片顺序和标注保存
  - [ ] **手动测试指导（项目当前没有前端组件测试框架）：**
    - [ ] 测试拖拽上传：在桌面浏览器中拖拽照片文件到上传区域，验证高亮效果和文件选择
    - [ ] 测试照片排序：在照片网格中拖拽照片调整顺序，验证顺序变化和视觉反馈
    - [ ] 测试照片标注：点击照片上的编辑图标，添加、编辑、删除标注，验证保存
    - [ ] 测试批量上传：选择 20 张照片，验证并发上传控制、进度显示、部分失败处理
    - [ ] 测试错误处理：模拟网络中断，验证失败照片的重试功能
    - [ ] 测试移动端：在移动设备上测试，验证拖拽降级为文件选择

## Dev Notes

### 现有实现分析

**已实现的功能：**
- ✅ 文件上传服务（后端）：`AttachmentsService` 已实现
- ✅ 文件上传 API 端点（后端）：`POST /api/attachments/upload` 已实现
- ✅ 文件上传组件（前端）：`FileUpload` 组件已实现（Story 4.4, 4.5）
- ✅ 附件关联 API 端点（后端）：`POST /api/attachments/:attachmentId/link` 已实现
- ✅ 照片压缩功能（前端）：已实现（Story 4.5）
- ✅ 照片预览功能（前端）：`PhotoPreview` 组件已实现（Story 4.5）
- ✅ 照片网格布局（前端）：已实现（Story 4.5）
- ✅ 互动记录创建表单：`InteractionCreateForm` 已实现

**需要扩展的功能：**
- ⚠️ 拖拽上传：需要扩展 `FileUpload` 组件支持 HTML5 drag and drop
- ⚠️ 照片排序：需要实现拖拽排序功能（使用 `react-beautiful-dnd` 或 `@dnd-kit/core`）
- ⚠️ 照片标注：需要实现标注输入和保存功能
- ⚠️ 批量上传进度：需要显示总体进度（已上传 X/Y 张）
- ⚠️ 更多照片支持：发货前验收支持 20 张照片（生产进度支持 10 张）

### 依赖安装

**前端依赖：**
- `react-beautiful-dnd` 或 `@dnd-kit/core`（用于拖拽排序）
- `@dnd-kit/core` 和 `@dnd-kit/sortable`（推荐，更现代，支持触摸设备）

**安装命令：**
```bash
cd fenghua-frontend
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
# 或者使用 react-beautiful-dnd（但可能不支持触摸设备）
# npm install react-beautiful-dnd @types/react-beautiful-dnd
```

### 技术实现要点

**批量上传并发控制实现：**
```typescript
// 在 FileUpload 组件中
const MAX_CONCURRENT_UPLOADS = 3; // 最大并发上传数量
const uploadQueue: File[] = [];
let activeUploads = 0;

const processUploadQueue = async () => {
  while (uploadQueue.length > 0 && activeUploads < MAX_CONCURRENT_UPLOADS) {
    const file = uploadQueue.shift();
    if (file) {
      activeUploads++;
      uploadSingleFile(file)
        .then(() => {
          activeUploads--;
          processUploadQueue(); // 继续处理队列
        })
        .catch((error) => {
          activeUploads--;
          // 处理错误（显示错误消息，添加到失败列表）
          handleUploadError(file, error);
          processUploadQueue(); // 继续处理队列
        });
    }
  }
};

const handleFiles = (files: File[]) => {
  // 验证文件
  const validFiles = files.filter(/* 验证逻辑 */);
  
  // 添加到上传队列
  uploadQueue.push(...validFiles);
  setTotalFilesToUpload(validFiles.length);
  
  // 开始处理队列
  processUploadQueue();
};
```

**错误处理和状态管理：**
```typescript
// 在 FileUpload 组件中
interface FileUploadState {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const [fileStates, setFileStates] = useState<Map<string, FileUploadState>>(new Map());

const uploadSingleFile = async (file: File) => {
  const fileId = file.name;
  
  // 设置状态为 uploading
  setFileStates((prev) => {
    const newMap = new Map(prev);
    newMap.set(fileId, { file, status: 'uploading', progress: 0 });
    return newMap;
  });
  
  try {
    const attachment = await uploadFile(file, (progress) => {
      setFileStates((prev) => {
        const newMap = new Map(prev);
        const state = newMap.get(fileId);
        if (state) {
          newMap.set(fileId, { ...state, progress });
        }
        return newMap;
      });
    });
    
    // 设置状态为 success
    setFileStates((prev) => {
      const newMap = new Map(prev);
      newMap.set(fileId, { file, status: 'success', progress: 100 });
      return newMap;
    });
    
    // 添加到已上传列表
    setUploadedFiles((prev) => [...prev, attachment]);
  } catch (error) {
    // 设置状态为 error
    setFileStates((prev) => {
      const newMap = new Map(prev);
      newMap.set(fileId, {
        file,
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : '上传失败',
      });
      return newMap;
    });
  }
};

// 重试失败的上传
const retryUpload = (fileId: string) => {
  const state = fileStates.get(fileId);
  if (state && state.status === 'error') {
    uploadSingleFile(state.file);
  }
};
```

**拖拽上传实现（前端）：**
```typescript
// 在 FileUpload 组件中
const [isDragging, setIsDragging] = useState(false);
const uploadAreaRef = useRef<HTMLDivElement>(null);

// 检测是否支持拖拽（移动端不支持）
const supportsDragDrop = typeof window !== 'undefined' && 'draggable' in document.createElement('div');

const handleDragEnter = (e: React.DragEvent) => {
  // 重要：检查事件目标，避免与照片排序拖拽冲突
  if (!uploadAreaRef.current?.contains(e.target as Node)) {
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(true);
};

const handleDragLeave = (e: React.DragEvent) => {
  // 重要：检查是否真的离开了上传区域
  if (!uploadAreaRef.current?.contains(e.relatedTarget as Node)) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }
};

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

const handleDrop = (e: React.DragEvent) => {
  // 重要：检查事件目标，避免与照片排序拖拽冲突
  if (!uploadAreaRef.current?.contains(e.target as Node)) {
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(false);
  
  const files = Array.from(e.dataTransfer.files);
  // 验证和处理文件（与 handleFileSelect 类似）
  handleFiles(files);
};

// 在 JSX 中
// 重要：拖拽区域只覆盖文件输入区域，不包括已上传照片的网格区域
<div
  ref={uploadAreaRef}
  onDragEnter={supportsDragDrop ? handleDragEnter : undefined}
  onDragLeave={supportsDragDrop ? handleDragLeave : undefined}
  onDragOver={supportsDragDrop ? handleDragOver : undefined}
  onDrop={supportsDragDrop ? handleDrop : undefined}
  className={isDragging ? 'border-2 border-dashed border-primary-blue bg-blue-50 p-4 rounded-monday-md' : 'border-2 border-dashed border-gray-300 p-4 rounded-monday-md'}
>
  {/* 文件输入区域 */}
  <input type="file" ... />
</div>
{/* 已上传照片网格区域（不包含在拖拽区域中） */}
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-monday-2">
  {/* 照片网格 */}
</div>
```

**照片排序实现（使用 @dnd-kit）：**
```typescript
// 在 FileUpload 组件中
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, gridSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 使用网格排序策略（适合照片网格布局）
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // 移动 8px 后才开始拖拽，避免误触
    },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  
  if (over && active.id !== over.id) {
    setUploadedFiles((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      // 重要：更新 onFilesUploaded 回调，通知父组件顺序变化
      onFilesUploaded(newItems);
      return newItems;
    });
  }
};

// SortablePhotoItem 组件
const SortablePhotoItem: React.FC<{ file: Attachment }> = ({ file }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* 照片缩略图 */}
    </div>
  );
};

// 在 JSX 中（照片网格区域）
<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={uploadedFiles.map((f) => f.id)} strategy={gridSortingStrategy}>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-monday-2">
      {uploadedFiles.map((file) => (
        <SortablePhotoItem key={file.id} file={file} />
      ))}
    </div>
  </SortableContext>
</DndContext>
```

**照片标注实现：**
```typescript
// 在 FileUpload 组件中
const [editingAnnotation, setEditingAnnotation] = useState<{ fileId: string; annotation: string } | null>(null);
const MAX_ANNOTATION_LENGTH = 50; // 标注字符限制

// 标注输入方式：点击照片上的"编辑"图标，显示内联输入框
const handleAnnotationEdit = (fileId: string) => {
  const file = uploadedFiles.find((f) => f.id === fileId);
  setEditingAnnotation({
    fileId,
    annotation: (file?.metadata as any)?.annotation || '',
  });
};

// 保存标注（实时保存到本地状态，提交时保存到服务器）
const handleAnnotationSave = (fileId: string, annotation: string) => {
  // 验证字符限制
  if (annotation.length > MAX_ANNOTATION_LENGTH) {
    toast.error(`标注不能超过 ${MAX_ANNOTATION_LENGTH} 个字符`);
    return;
  }
  
  setUploadedFiles((prev) =>
    prev.map((file) => {
      if (file.id === fileId) {
        return {
          ...file,
          metadata: {
            ...(file.metadata || {}),
            annotation: annotation.trim() || undefined,
          },
        };
      }
      return file;
    })
  );
  setEditingAnnotation(null);
};

// 删除标注
const handleAnnotationDelete = (fileId: string) => {
  setUploadedFiles((prev) =>
    prev.map((file) => {
      if (file.id === fileId) {
        const metadata = { ...(file.metadata || {}) };
        delete metadata.annotation;
        return {
          ...file,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        };
      }
      return file;
    })
  );
};

// 在照片缩略图下方显示标注和编辑按钮
<div className="relative group">
  <img src={file.fileUrl} alt={file.fileName} />
  {/* 编辑标注按钮（hover 时显示） */}
  <button
    onClick={() => handleAnnotationEdit(file.id)}
    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white rounded p-1"
  >
    ✏️
  </button>
  {/* 标注文本或输入框 */}
  {editingAnnotation?.fileId === file.id ? (
    <div className="mt-1">
      <input
        type="text"
        value={editingAnnotation.annotation}
        onChange={(e) => setEditingAnnotation({ ...editingAnnotation, annotation: e.target.value })}
        maxLength={MAX_ANNOTATION_LENGTH}
        className="w-full text-monday-xs"
        onBlur={() => handleAnnotationSave(file.id, editingAnnotation.annotation)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleAnnotationSave(file.id, editingAnnotation.annotation);
          } else if (e.key === 'Escape') {
            setEditingAnnotation(null);
          }
        }}
        autoFocus
      />
    </div>
  ) : (
    (file.metadata as any)?.annotation && (
      <div className="text-monday-xs text-monday-text-secondary mt-1 truncate">
        {(file.metadata as any).annotation}
      </div>
    )
  )}
</div>
```

**批量上传进度显示：**
```typescript
// 在 FileUpload 组件中
// 重要：使用初始选择的文件数量作为总数，而不是动态计算
const [totalFilesToUpload, setTotalFilesToUpload] = useState(0);

// 在选择文件时设置总数
const handleFiles = (files: File[]) => {
  setTotalFilesToUpload(files.length);
  // ... 处理文件
};

// 计算进度
const completedFiles = uploadedFiles.length;
const inProgressFiles = Object.keys(uploadProgress).length;
const progressPercentage = totalFilesToUpload > 0 
  ? ((completedFiles / totalFilesToUpload) * 100) 
  : 0;

// 在 JSX 中
{totalFilesToUpload > 0 && (
  <div className="space-y-monday-2">
    <div className="flex justify-between text-monday-sm text-monday-text-secondary">
      <span>总体进度：{completedFiles} / {totalFilesToUpload} 张</span>
      <span>{Math.round(progressPercentage)}%</span>
    </div>
    <div className="w-full bg-monday-bg-secondary rounded-full h-2">
      <div
        className="bg-primary-blue h-2 rounded-full transition-all duration-300"
        style={{ width: `${progressPercentage}%` }}
      />
    </div>
    {/* 每张照片的独立进度条 */}
  </div>
)}
```

**照片顺序和标注保存：**
```typescript
// 在 InteractionCreateForm.tsx 的 onSubmit 中
const submitData: CreateInteractionDto = {
  // ... 其他字段
};

// 创建互动记录后，关联照片并保存顺序和标注
// 重要：总是保存顺序和标注，因为顺序可能通过拖拽改变了
if (attachments.length > 0) {
  for (let i = 0; i < attachments.length; i++) {
    const attachment = attachments[i];
    // 1. 先关联到互动记录
    await linkAttachmentToInteraction(attachment.id, interaction.id);
    
    // 2. 总是更新 metadata（顺序和标注）
    // 顺序：使用数组索引 i（反映用户拖拽后的顺序）
    // 标注：从 attachment.metadata?.annotation 获取（如果存在）
    await updateAttachmentMetadata(attachment.id, {
      order: i,
      annotation: attachment.metadata?.annotation || undefined,
    });
  }
}
```

### 数据库 Schema

**`file_attachments` 表：**
- `metadata` 字段（JSONB 类型）用于存储照片顺序和标注：
  ```json
  {
    "order": 0,
    "annotation": "正面"
  }
  ```

### 项目结构

```
fenghua-frontend/src/
├── attachments/
│   ├── components/
│   │   ├── FileUpload.tsx (更新：添加拖拽上传、排序、标注、并发控制)
│   │   └── PhotoPreview.tsx (已存在，无需修改)
│   └── services/
│       └── attachments.service.ts (更新：添加 updateAttachmentMetadata 函数)
└── interactions/
    └── components/
        └── InteractionCreateForm.tsx (更新：集成发货前验收照片上传)

fenghua-backend/src/
├── attachments/
│   ├── dto/
│   │   └── update-attachment-metadata.dto.ts (新建：UpdateAttachmentMetadataDto)
│   ├── attachments.service.ts (更新：添加 updateMetadata 方法)
│   └── attachments.controller.ts (更新：添加 PATCH /:attachmentId/metadata 端点)
```

### 参考实现

- Story 4.5: 生产进度跟进照片上传（已实现，可作为参考）
- Story 4.4: 互动记录附件上传（已实现，附件关联逻辑）

### 注意事项

1. **拖拽排序库选择：**
   - **推荐使用 `@dnd-kit/core`**，原因：
     - ✅ 支持触摸设备（移动端友好，发货前验收可能在移动端使用）
     - ✅ 更好的 TypeScript 支持（类型定义完整）
     - ✅ 更活跃的维护（定期更新，bug 修复及时）
     - ✅ 更小的包体积（性能更好）
     - ✅ 更好的可访问性支持（键盘导航、屏幕阅读器）
   - `react-beautiful-dnd`：不推荐，原因：
     - ❌ 不支持触摸设备（移动端无法使用）
     - ❌ 维护不活跃（最后更新较久）
     - ❌ 包体积较大
     - ⚠️ 如果必须使用，需要注意移动端降级处理

2. **照片标注功能：**
   - 标注功能是**可选**的，如果时间有限，可以先实现基本功能（拖拽上传、排序），标注功能可以后续添加
   - 标注保存在 `metadata` 字段中，不影响现有功能

3. **批量上传性能：**
   - **重要：** 实现并发上传队列控制（同时最多上传 3-5 张照片，避免过多并发请求）
   - **重要：** 使用上传队列管理，确保按顺序处理上传任务
   - 如果照片数量很多（20 张），自动分批上传
   - 实现上传失败重试机制（最多重试 3 次）

4. **照片顺序保存：**
   - 照片顺序通过 `uploadedFiles` 数组的顺序来确定（反映用户拖拽后的顺序）
   - **重要：** 在提交时，总是按照数组顺序保存到 `metadata.order` 字段（即使顺序没有改变）
   - 顺序从 0 开始，递增保存

5. **错误处理和状态管理：**
   - 每个文件有独立的上传状态：`uploading`、`success`、`error`
   - 失败照片显示重试按钮，点击后重新上传
   - 部分成功时允许提交（只关联成功上传的照片）
   - 显示成功和失败的照片列表，失败照片显示错误原因

6. **性能优化建议：**
   - 使用 Web Worker 进行照片压缩（避免阻塞主线程，可选）
   - 实现上传队列管理（避免内存溢出，限制并发数量）
   - 大量照片时考虑虚拟滚动（如果照片数量超过 20 张，可选）
   - 实现断点续传（高级功能，可选）

7. **向后兼容：**
   - 确保现有的照片上传功能（生产进度跟进）不受影响
   - `maxFiles` 应该根据互动类型动态设置（生产进度：10 张，发货前验收：20 张）
   - 拖拽上传和排序功能不影响现有的文件选择上传方式

## Quick Reference

### 关键文件

- `fenghua-frontend/src/attachments/components/FileUpload.tsx` - 文件上传组件（需要扩展）
- `fenghua-frontend/src/interactions/components/InteractionCreateForm.tsx` - 互动记录创建表单（需要集成）
- `fenghua-frontend/src/attachments/services/attachments.service.ts` - 附件服务（更新：添加 updateAttachmentMetadata 函数）
- `fenghua-backend/src/attachments/attachments.service.ts` - 附件服务（更新：添加 updateMetadata 方法）
- `fenghua-backend/src/attachments/attachments.controller.ts` - 附件控制器（更新：添加 PATCH /:attachmentId/metadata 端点）
- `fenghua-backend/src/attachments/dto/update-attachment-metadata.dto.ts` - DTO（新建）

**前端 updateAttachmentMetadata 函数实现：**
```typescript
// 在 fenghua-frontend/src/attachments/services/attachments.service.ts 中
export interface UpdateAttachmentMetadataDto {
  order?: number;
  annotation?: string;
}

export async function updateAttachmentMetadata(
  attachmentId: string,
  metadata: UpdateAttachmentMetadataDto,
): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录');
  }

  const response = await fetch(`${API_URL}/api/attachments/${attachmentId}/metadata`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '更新附件 metadata 失败');
  }
}
```

### 关键枚举和类型

- `BackendInteractionType.PRE_SHIPMENT_INSPECTION` - 发货前验收互动类型
- `Attachment.metadata` - 照片顺序和标注存储字段

### API 端点

- `POST /api/attachments/upload` - 上传文件（已存在）
- `POST /api/attachments/:attachmentId/link` - 关联附件到互动记录（已存在）
- `PATCH /api/attachments/:attachmentId/metadata` - **更新附件 metadata（必需）**

**Metadata 更新端点实现：**
```typescript
// DTO: UpdateAttachmentMetadataDto
export class UpdateAttachmentMetadataDto {
  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  annotation?: string;
}

// Controller
@Patch(':attachmentId/metadata')
@HttpCode(HttpStatus.NO_CONTENT)
async updateMetadata(
  @Param('attachmentId') attachmentId: string,
  @Body(ValidationPipe) dto: UpdateAttachmentMetadataDto,
  @Token() token: string,
): Promise<void> {
  const user = await this.authService.validateToken(token);
  await this.attachmentsService.updateMetadata(attachmentId, dto, user.id);
}

// Service
async updateMetadata(
  attachmentId: string,
  dto: UpdateAttachmentMetadataDto,
  userId: string,
): Promise<void> {
  // 1. 验证附件存在
  const attachment = await this.getAttachmentById(attachmentId);
  if (!attachment) {
    throw new BadRequestException('附件不存在');
  }
  
  // 2. 验证权限（可选，如果需要）
  // if (attachment.createdBy !== userId) {
  //   throw new ForbiddenException('无权修改此附件');
  // }
  
  // 3. 构建 metadata 对象
  const metadata: Record<string, unknown> = {};
  if (dto.order !== undefined) {
    metadata.order = dto.order;
  }
  if (dto.annotation !== undefined) {
    metadata.annotation = dto.annotation;
  }
  
  // 4. 更新数据库
  const updateQuery = `
    UPDATE file_attachments
    SET metadata = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND deleted_at IS NULL
  `;
  await this.pgPool.query(updateQuery, [JSON.stringify(metadata), attachmentId]);
}
```

## Reference Materials

- Epic 4: 互动记录管理（`_bmad-output/epics.md`）
- Story 4.5: 生产进度跟进照片上传（`_bmad-output/implementation-artifacts/stories/4-5-production-progress-photo-upload.md`）
- Story 4.4: 互动记录附件上传（`_bmad-output/implementation-artifacts/stories/4-4-interaction-record-attachment-upload.md`）
- Database Schema: `docs/database-schema-design.md`（`file_attachments` 表）
- Infrastructure Decisions: `docs/infrastructure-decisions.md`（文件存储）

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### File List

_To be filled by dev agent_

