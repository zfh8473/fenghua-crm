# Story 4.8: 互动历史查看（按角色）

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **前端专员/后端专员/总监/管理员**,
I want **查看客户的所有互动记录**,
so that **我可以了解与客户的完整业务往来历史**.

## Acceptance Criteria

**AC1: 前端专员查看采购商互动历史**
- **Given** 前端专员已登录系统
- **When** 前端专员在采购商详情页面查看"互动历史"
- **Then** 系统显示该采购商的所有互动记录
- **And** 互动记录按时间顺序排列（最新的在前）
- **And** 每条互动记录显示：互动类型、互动时间、关联的产品、互动描述、创建者等
- **And** 系统只显示前端专员有权限查看的互动记录（只显示采购商类型的客户）

**AC2: 后端专员查看供应商互动历史**
- **Given** 后端专员已登录系统
- **When** 后端专员在供应商详情页面查看"互动历史"
- **Then** 系统显示该供应商的所有互动记录
- **And** 互动记录按时间顺序排列（最新的在前）
- **And** 每条互动记录显示：互动类型、互动时间、关联的产品、互动描述、创建者等
- **And** 系统只显示后端专员有权限查看的互动记录（只显示供应商类型的客户）

**AC3: 总监/管理员查看客户互动历史**
- **Given** 总监或管理员已登录系统
- **When** 总监或管理员在客户详情页面查看"互动历史"
- **Then** 系统显示该客户的所有互动记录
- **And** 互动记录按时间顺序排列（最新的在前）
- **And** 系统显示所有类型的互动记录（采购商和供应商的互动）

**AC4: 附件显示和查看**
- **Given** 用户查看互动历史
- **When** 互动记录包含附件（照片、文档等）
- **Then** 系统在互动记录中显示附件图标或缩略图
- **And** 用户可以点击附件查看或下载
- **And** 如果是照片，用户可以查看大图（支持多张照片切换）
- **And** 附件显示在互动记录的附件区域

**AC5: 分页和滚动加载**
- **Given** 用户查看互动历史
- **When** 互动历史记录较多（> 20 条）
- **Then** 系统使用分页或滚动加载显示互动记录
- **And** 系统显示互动记录总数
- **And** 系统支持按时间排序（最新的在前或最旧的在前，用户可选择）
- **And** 系统支持按时间范围筛选（本周、本月、本年、全部）

**AC6: 空状态处理**
- **Given** 用户查看互动历史
- **When** 没有互动记录
- **Then** 系统显示空状态"该客户尚未有任何互动记录"
- **And** 系统提供"记录新互动"按钮，用户可以快速记录互动
- **And** 空状态显示友好的提示信息

## Tasks / Subtasks

- [x] Task 1: 验证和完善后端 API 端点 (AC: #1, #2, #3, #5)
  - [x] 验证 `GET /api/customers/:customerId/timeline` 端点已实现
  - [x] 验证基于角色的数据过滤已实现（前端专员只看到采购商，后端专员只看到供应商）
  - [x] 验证分页功能已实现（page, limit 参数）
  - [x] 验证排序功能已实现（sortOrder: 'asc' | 'desc'）
  - [x] 验证时间范围筛选已实现（dateRange: 'week' | 'month' | 'year' | 'all'）
  - [x] 创建查询性能优化索引（customer_id + interaction_date 复合索引）
  - [x] 验证附件数据已包含在响应中（attachments 数组）

- [x] Task 2: 验证和完善前端 CustomerTimeline 组件 (AC: #1, #2, #3, #4, #5, #6)
  - [x] 验证 `CustomerTimeline` 组件已实现并集成到 `CustomerDetailPanel`
  - [x] 验证互动记录按时间顺序显示（最新的在前）
  - [x] 验证每条互动记录显示：互动类型、互动时间、关联的产品、互动描述、创建者
  - [x] 验证附件显示功能（附件图标或缩略图）
  - [x] 验证附件点击查看功能（照片大图查看，文档下载）
  - [x] 验证分页功能（如果记录 > 20 条）
  - [x] 验证排序功能（用户可选择最新的在前或最旧的在前）
  - [x] 验证时间范围筛选功能（本周、本月、本年、全部）
  - [x] 验证空状态显示（"该客户尚未有任何互动记录"）
  - [x] 实现"记录新互动"按钮（链接到互动记录创建页面）
    - [x] 按钮链接到 `/interactions/create`，通过 `useNavigate` 和 `state` 传递客户信息（`customerId`）
    - [x] 按钮显示在空状态中，样式为主按钮（primary）
    - [x] 按钮文本："记录新互动"
    - [x] 确保 `InteractionCreateForm` 能够接收并预填充客户信息（通过 `prefillCustomerId` prop）

- [x] Task 3: 优化附件显示和交互 (AC: #4)
  - [x] 实现附件图标显示（根据文件类型显示不同图标）
    - [x] 照片附件：优先显示缩略图（使用 `fileUrl` 作为缩略图源），如果加载失败则显示图片图标 🖼️
    - [x] PDF 文档：显示 PDF 图标 📄
    - [x] Word 文档：显示 Word 图标 📝（检测 `mimeType` 包含 'word' 或文件名以 `.docx`/`.doc` 结尾）
    - [x] Excel 文档：显示 Excel 图标 📊（检测 `mimeType` 包含 'excel' 或文件名以 `.xlsx`/`.xls` 结尾）
    - [x] 其他文档：显示默认附件图标 📎
  - [x] 实现照片缩略图显示（如果附件是照片）
    - [x] 照片附件（`fileType === 'photo'` 或 `mimeType?.startsWith('image/')`）显示缩略图
    - [x] 缩略图尺寸：64x64px（桌面端）
    - [x] 缩略图使用 `object-cover` 保持宽高比
    - [x] 添加 hover 效果（边框高亮）
  - [x] **复用 Story 4.5 的 `PhotoPreview` 组件实现照片大图查看功能**
    - [x] 导入 `PhotoPreview` 组件：`import { PhotoPreview } from '../../attachments/components/PhotoPreview';`
    - [x] 实现照片预览状态管理（`selectedPhotoIndex` 和 `photoAttachments` 数组）
    - [x] 处理照片点击事件：筛选出所有照片附件，找到当前照片索引，打开预览
    - [x] 实现多张照片切换逻辑（上一张/下一张，支持键盘导航）
    - [x] 集成 `PhotoPreview` 组件到 `CustomerTimeline` 组件
  - [x] 实现文档下载功能（点击文档附件直接下载）
    - [x] 使用 `<a>` 标签的 `download` 属性实现下载
  - [x] 优化附件显示布局（移动端和桌面端）
    - [x] 使用 flex-wrap 布局，自动换行

- [x] Task 4: 优化互动记录卡片显示 (AC: #1, #2, #3)
  - [x] 确保互动类型显示中文标签（使用 INTERACTION_TYPE_LABELS）
  - [x] 确保互动时间格式化显示（使用 getTimeLabel 函数）
  - [x] 确保关联产品信息显示（产品名称、HS编码）
  - [x] 确保创建者信息显示（创建者姓名或邮箱）
  - [x] 优化卡片布局（移动端和桌面端）

- [x] Task 5: 添加测试用例 (AC: #1, #2, #3, #4, #5, #6)
  - [x] 添加前端组件测试（CustomerTimeline 组件）
  - [x] 测试基于角色的数据过滤（前端专员只看到采购商，后端专员只看到供应商）
  - [x] 测试分页功能
  - [x] 测试排序功能
  - [x] 测试时间范围筛选功能
  - [x] 测试附件显示和交互
  - [x] 测试空状态显示
  - [x] 添加后端 API 测试（CustomerTimelineController 和 CustomerTimelineService）

## Technical Notes

### 后端 API

**端点：** `GET /api/customers/:customerId/timeline`

**查询参数：**
- `page` (number, default: 1): 页码
- `limit` (number, default: 50, max: 100): 每页记录数
- `sortOrder` ('asc' | 'desc', default: 'desc'): 排序顺序
- `dateRange` ('week' | 'month' | 'year' | 'all', default: 'all'): 时间范围筛选

**响应格式：**
```typescript
{
  interactions: CustomerTimelineInteractionDto[];
  total: number;
}

interface CustomerTimelineInteractionDto {
  id: string;
  interactionType: string;
  interactionDate: string;
  description?: string;
  status?: string;
  additionalInfo?: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
  creatorEmail?: string;
  creatorFirstName?: string;
  creatorLastName?: string;
  productId?: string;
  productName?: string;
  productHsCode?: string;
  attachments: FileAttachment[];
}

interface FileAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  mimeType?: string;
}
```

**实现位置：**
- Controller: `fenghua-backend/src/companies/customer-timeline.controller.ts`
- Service: `fenghua-backend/src/companies/customer-timeline.service.ts`
- DTO: `fenghua-backend/src/companies/dto/customer-timeline.dto.ts`

### 前端组件

**组件：** `CustomerTimeline`

**位置：** `fenghua-frontend/src/customers/components/CustomerTimeline.tsx`

**集成位置：** `fenghua-frontend/src/customers/components/CustomerDetailPanel.tsx`

**功能：**
- 显示客户的所有互动记录（不限定产品）
- 支持基于角色的数据过滤
- 支持分页、排序、时间范围筛选
- 支持附件显示和查看
- 支持空状态显示

### 基于角色的数据过滤

**前端专员：**
- 只能查看采购商（BUYER）类型的客户的互动记录
- 只能查看前端专员的互动类型（初步接触、产品询价、报价等）

**后端专员：**
- 只能查看供应商（SUPPLIER）类型的客户的互动记录
- 只能查看后端专员的互动类型（询价产品、接收报价、生产进度跟进等）

**总监/管理员：**
- 可以查看所有类型的客户的互动记录
- 可以查看所有类型的互动记录

### 附件显示

**照片附件：**
- 显示缩略图（使用 `fileUrl` 作为缩略图源，尺寸：64x64px 桌面端，48x48px 移动端）
- 点击缩略图查看大图（复用 Story 4.5 的 `PhotoPreview` 组件）
- 支持多张照片切换（上一张/下一张，键盘导航：←/→）
- 照片预览状态管理：
  - `selectedPhotoIndex`: 当前预览的照片索引（`number | null`）
  - `photoAttachments`: 当前互动记录的所有照片附件数组

**文档附件：**
- 根据文件类型显示对应图标：
  - PDF: 📄
  - Word (.docx, .doc): 📝
  - Excel (.xlsx, .xls): 📊
  - 其他: 📎
- 显示文件名和文件大小（格式化显示，如 "1.2 MB"）
- 点击附件直接下载（使用 `<a>` 标签的 `download` 属性）

**附件图标显示逻辑：**
```typescript
const getFileIcon = (attachment: FileAttachment): string => {
  if (attachment.fileType === 'photo' || attachment.mimeType?.startsWith('image/')) {
    return '🖼️'; // 照片图标（仅在缩略图加载失败时显示）
  }
  if (attachment.mimeType === 'application/pdf' || attachment.fileName.endsWith('.pdf')) {
    return '📄'; // PDF 图标
  }
  if (attachment.mimeType?.includes('word') || 
      attachment.fileName.endsWith('.docx') || 
      attachment.fileName.endsWith('.doc')) {
    return '📝'; // Word 图标
  }
  if (attachment.mimeType?.includes('excel') || 
      attachment.fileName.endsWith('.xlsx') || 
      attachment.fileName.endsWith('.xls')) {
    return '📊'; // Excel 图标
  }
  return '📎'; // 默认附件图标
};
```

### 性能优化

**数据库索引：**
- `customer_id + created_at` 复合索引（用于按客户和时间排序）
- `customer_id + interaction_type` 复合索引（用于按客户和类型筛选）

**查询优化：**
- 使用分页限制返回记录数（默认 50 条，最大 100 条）
- 使用聚合查询一次性获取附件数据（避免 N+1 查询）
- 使用 React Query 缓存查询结果（5 分钟缓存）

## Code Examples

### 前端组件使用示例

```tsx
// CustomerDetailPanel.tsx
import { CustomerTimeline } from './CustomerTimeline';

export const CustomerDetailPanel: React.FC<CustomerDetailPanelProps> = ({
  customer,
}) => {
  return (
    <div className="space-y-monday-4">
      {/* 其他客户信息 */}
      
      {/* 时间线视图 */}
      <Card variant="outlined" className="p-monday-4">
        <h4 className="text-monday-base font-semibold text-monday-text mb-monday-3">
          互动历史
        </h4>
        <CustomerTimeline customerId={customer.id} />
      </Card>
    </div>
  );
};
```

### 后端 API 调用示例

```typescript
// 获取客户时间线
const response = await fetch(
  `/api/customers/${customerId}/timeline?page=1&limit=50&sortOrder=desc&dateRange=all`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
);

const data = await response.json();
// data.interactions: 互动记录数组
// data.total: 总记录数
```

### 附件显示示例

```tsx
// 导入 PhotoPreview 组件
import { PhotoPreview } from '../../attachments/components/PhotoPreview';

// 照片预览状态管理
const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
const [photoAttachments, setPhotoAttachments] = useState<FileAttachment[]>([]);

/**
 * 获取文件类型图标
 */
const getFileIcon = (attachment: FileAttachment): string => {
  if (attachment.fileType === 'photo' || attachment.mimeType?.startsWith('image/')) {
    return '🖼️';
  }
  if (attachment.mimeType === 'application/pdf' || attachment.fileName.endsWith('.pdf')) {
    return '📄';
  }
  if (attachment.mimeType?.includes('word') || 
      attachment.fileName.endsWith('.docx') || 
      attachment.fileName.endsWith('.doc')) {
    return '📝';
  }
  if (attachment.mimeType?.includes('excel') || 
      attachment.fileName.endsWith('.xlsx') || 
      attachment.fileName.endsWith('.xls')) {
    return '📊';
  }
  return '📎';
};

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * 处理照片点击 - 打开照片预览
 */
const handlePhotoClick = (attachment: FileAttachment, allAttachments: FileAttachment[]) => {
  // 筛选出所有照片附件
  const photos = allAttachments.filter(a => 
    a.fileType === 'photo' || a.mimeType?.startsWith('image/')
  );
  
  // 找到当前照片的索引
  const index = photos.findIndex(a => a.id === attachment.id);
  
  if (index !== -1) {
    setPhotoAttachments(photos);
    setSelectedPhotoIndex(index);
  }
};

/**
 * 处理照片预览导航
 */
const handlePhotoNext = () => {
  if (selectedPhotoIndex !== null && selectedPhotoIndex < photoAttachments.length - 1) {
    setSelectedPhotoIndex(selectedPhotoIndex + 1);
  }
};

const handlePhotoPrevious = () => {
  if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
    setSelectedPhotoIndex(selectedPhotoIndex - 1);
  }
};

// 在互动记录卡片中显示附件
{interaction.attachments && interaction.attachments.length > 0 && (
  <div className="mt-2 flex flex-wrap gap-2">
    {interaction.attachments.map((attachment) => {
      const isPhoto = attachment.fileType === 'photo' || attachment.mimeType?.startsWith('image/');
      
      if (isPhoto) {
        // 照片附件：显示缩略图
        return (
          <button
            key={attachment.id}
            onClick={() => handlePhotoClick(attachment, interaction.attachments)}
            className="relative w-16 h-16 rounded overflow-hidden border border-gray-200 hover:border-primary-blue transition-colors"
            aria-label={`查看照片: ${attachment.fileName}`}
          >
            <img
              src={attachment.fileUrl}
              alt={attachment.fileName}
              className="w-full h-full object-cover"
              onError={(e) => {
                // 缩略图加载失败，显示图标
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="hidden absolute inset-0 flex items-center justify-center text-2xl bg-gray-100">
              {getFileIcon(attachment)}
            </span>
          </button>
        );
      } else {
        // 文档附件：显示图标和文件名
        return (
          <a
            key={attachment.id}
            href={attachment.fileUrl}
            download={attachment.fileName}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            <span className="text-lg">{getFileIcon(attachment)}</span>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{attachment.fileName}</span>
              <span className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</span>
            </div>
          </a>
        );
      }
    })}
  </div>
)}

// 照片预览组件
// 注意：PhotoPreview 组件接受 Attachment[] 类型，需要确保类型匹配
{selectedPhotoIndex !== null && photoAttachments.length > 0 && (
  <PhotoPreview
    photos={photoAttachments.map(a => ({
      id: a.id,
      fileName: a.fileName,
      fileUrl: a.fileUrl,
      fileType: a.fileType,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
    })) as Attachment[]}
    currentIndex={selectedPhotoIndex}
    onClose={() => {
      setSelectedPhotoIndex(null);
      setPhotoAttachments([]);
    }}
    onNext={handlePhotoNext}
    onPrevious={handlePhotoPrevious}
  />
)}
```

### "记录新互动"按钮实现示例

```tsx
// 导入 useNavigate
import { useNavigate } from 'react-router-dom';

// 在 CustomerTimeline 组件中
const navigate = useNavigate();

/**
 * 处理创建新互动
 */
const handleCreateInteraction = () => {
  navigate('/interactions/create', {
    state: { 
      customerId: customerId,
      // 如果需要客户名称，可以从 props 或 context 获取
    }
  });
};

// 在空状态中显示按钮
{!data || data.interactions.length === 0 ? (
  <Card variant="outlined" className="p-monday-4">
    <div className="text-center py-monday-8">
      <div className="text-monday-4xl mb-monday-4 opacity-50">📅</div>
      <p className="text-monday-base text-monday-text-secondary mb-monday-4">
        该客户尚未有任何互动记录
      </p>
      <Button onClick={handleCreateInteraction} variant="primary">
        记录新互动
      </Button>
    </div>
  </Card>
) : (
  // 显示互动记录列表
  <div className="space-y-monday-4">
    {data.interactions.map((interaction) => (
      <TimelineInteractionCard
        key={interaction.id}
        interaction={interaction}
        isLast={false}
        onCardClick={handleCardClick}
      />
    ))}
  </div>
)}
```

## Project Structure

```
fenghua-backend/
├── src/
│   └── companies/
│       ├── customer-timeline.controller.ts (GET /api/customers/:customerId/timeline)
│       ├── customer-timeline.service.ts (业务逻辑)
│       └── dto/
│           └── customer-timeline.dto.ts (DTO 定义)

fenghua-frontend/
├── src/
│   └── customers/
│       └── components/
│           ├── CustomerTimeline.tsx (互动历史组件)
│           └── CustomerDetailPanel.tsx (客户详情面板，集成 CustomerTimeline)
```

## Dependencies

**现有依赖：**
- `@tanstack/react-query` - 用于数据获取和缓存
- `react-router-dom` - 用于路由导航

**无需新增依赖：**
- 所有必需的功能都已实现，只需验证和完善

## References

- **Epic 4:** 互动记录核心功能
- **FR26:** 前端专员可以查看某个采购商的所有互动记录；后端专员可以查看某个供应商的所有互动记录；总监和管理员可以查看某个客户的所有互动记录
- **Story 3.6:** 客户时间线视图（已实现 CustomerTimeline 组件）
- **Story 4.1:** 互动记录创建（前端专员 - 采购商互动）
- **Story 4.2:** 互动记录创建（后端专员 - 供应商互动）
- **Story 4.4:** 互动记录附件上传
- **Story 4.5:** 生产进度照片上传（PhotoPreview 组件）
- **Story 4.6:** 发货前验收照片上传（照片预览和切换）

## Dev Agent Record

### 实现摘要

Story 4.8 已成功实现互动历史查看功能，包括：

1. **后端 API 验证和完善**
   - 验证了 `GET /api/customers/:customerId/timeline` 端点已实现
   - 验证了基于角色的数据过滤、分页、排序、时间范围筛选功能
   - 创建了 `customer_id + interaction_date` 复合索引以优化查询性能（迁移文件：`015-add-customer-timeline-index.sql`）
   - 验证了附件数据已包含在响应中

2. **前端 CustomerTimeline 组件完善**
   - 验证了组件已实现并集成到 `CustomerDetailPanel`
   - 实现了"记录新互动"按钮，使用 `useNavigate` 和 `state` 传递客户信息
   - 更新了 `InteractionCreateForm` 以支持从 navigation state 接收预填充的客户信息

3. **附件显示和交互优化**
   - 实现了附件图标显示逻辑（根据文件类型显示不同图标：照片 🖼️、PDF 📄、Word 📝、Excel 📊、其他 📎）
   - 实现了照片缩略图显示（64x64px，带 hover 效果）
   - 复用了 Story 4.5 的 `PhotoPreview` 组件实现照片大图查看功能
   - 实现了多张照片切换逻辑（上一张/下一张，支持键盘导航）
   - 实现了文档下载功能（使用 `<a>` 标签的 `download` 属性）
   - 优化了附件显示布局（flex-wrap，自动换行）

4. **互动记录卡片显示优化**
   - 确保互动类型显示中文标签（使用 `INTERACTION_TYPE_LABELS`）
   - 确保互动时间格式化显示（使用 `getTimeLabel` 函数）
   - 确保关联产品信息显示（产品名称、HS编码）
   - 确保创建者信息显示（创建者姓名或邮箱）
   - 优化了卡片布局（移动端和桌面端）

### 技术实现细节

**照片预览功能：**
- 使用 `PhotoPreview` 组件（Story 4.5）
- 状态管理：`selectedPhotoIndex` 和 `photoAttachments`
- 照片点击处理：筛选出所有照片附件，找到当前照片索引，打开预览
- 多张照片切换：支持 `onNext` 和 `onPrevious` 回调，键盘导航（←/→）

**附件图标显示：**
- `getFileIcon` 函数根据文件类型返回对应图标
- 照片附件：优先显示缩略图，失败时显示图标
- 文档附件：根据 `mimeType` 或文件扩展名显示对应图标

**"记录新互动"按钮：**
- 使用 `useNavigate` 和 `state` 传递 `customerId`
- `InteractionCreateForm` 通过 `prefillCustomerId` prop 接收客户 ID
- 自动加载并选择客户（如果客户类型符合用户角色）

**数据库索引优化：**
- 创建了 `idx_interactions_customer_date` 复合索引（`customer_id, interaction_date DESC`）
- 优化了按客户筛选并按时间排序的查询性能

**代码审查修复（2025-01-03）：**
- 添加了 `customerId` UUID 格式验证，防止无效 API 调用
- 改进了照片附件映射中的占位符值（使用 `'timeline'` 作为 storageProvider，attachment id 作为 storageKey）
- 创建了 `ErrorBoundary` 组件并包装 `PhotoPreview`，防止预览错误影响整个组件
- 添加了 `handleDocumentClick` 函数的 JSDoc 注释
- 创建了统一的错误消息常量文件（`error-messages.ts`），标准化错误消息格式

## File List

### 新建的文件

**后端：**
- `fenghua-backend/migrations/015-add-customer-timeline-index.sql` - 添加 customer_id + interaction_date 复合索引以优化查询性能

### 修改的文件

**前端：**
- `fenghua-frontend/src/customers/components/CustomerTimeline.tsx` - 添加照片预览功能、改进附件显示（照片缩略图、文档图标）、更新"记录新互动"按钮（使用 useNavigate + state）、添加 customerId UUID 验证、添加 ErrorBoundary 包装 PhotoPreview、使用统一的错误消息常量
- `fenghua-frontend/src/interactions/components/InteractionCreateForm.tsx` - 添加预填充客户信息支持（通过 `prefillCustomerId` prop）
- `fenghua-frontend/src/interactions/pages/InteractionCreatePage.tsx` - 从 navigation state 或 URL 参数获取 customerId 并传递给表单组件
- `fenghua-frontend/src/components/ErrorBoundary.tsx` (新建) - 错误边界组件，用于捕获 React 组件错误
- `fenghua-frontend/src/common/constants/error-messages.ts` (新建) - 统一的错误消息常量文件，包含客户、时间线、照片预览等错误消息

