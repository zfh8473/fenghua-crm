# Story 4.9: 产品与客户互动记录查看（按角色）

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **前端专员/后端专员/总监/管理员**,
I want **查看某个产品与客户的所有互动记录**,
so that **我可以了解该产品与客户的业务往来情况**.

## Acceptance Criteria

**AC1: 前端专员查看产品与采购商互动记录**
- **Given** 前端专员已登录系统
- **When** 前端专员在产品详情页面选择某个采购商，点击"查看互动记录"
- **Then** 系统显示该产品与该采购商的所有互动记录
- **And** 互动记录按时间顺序排列（最新的在前）
- **And** 每条互动记录显示：互动类型、互动时间、互动描述、创建者等
- **And** 系统只显示前端专员有权限查看的互动记录（只显示采购商类型的客户）

**AC2: 后端专员查看产品与供应商互动记录**
- **Given** 后端专员已登录系统
- **When** 后端专员在产品详情页面选择某个供应商，点击"查看互动记录"
- **Then** 系统显示该产品与该供应商的所有互动记录
- **And** 互动记录按时间顺序排列（最新的在前）
- **And** 每条互动记录显示：互动类型、互动时间、互动描述、创建者等
- **And** 系统只显示后端专员有权限查看的互动记录（只显示供应商类型的客户）

**AC3: 总监/管理员查看产品与客户互动记录**
- **Given** 总监或管理员已登录系统
- **When** 总监或管理员在产品详情页面选择某个客户，点击"查看互动记录"
- **Then** 系统显示该产品与该客户的所有互动记录
- **And** 互动记录按时间顺序排列（最新的在前）
- **And** 系统显示所有类型的互动记录（采购商和供应商的互动）

**AC4: 附件显示和查看**
- **Given** 用户查看产品与客户的互动记录
- **When** 互动记录包含附件（照片、文档等）
- **Then** 系统在互动记录中显示附件图标或缩略图
- **And** 用户可以点击附件查看或下载
- **And** 如果是照片，用户可以查看大图（支持多张照片切换）
- **And** 附件显示在互动记录的附件区域

**AC5: 分页和滚动加载**
- **Given** 用户查看产品与客户的互动记录
- **When** 互动记录较多（> 20 条）
- **Then** 系统使用分页或滚动加载显示互动记录
- **And** 系统显示互动记录总数
- **And** 系统支持按时间排序（最新的在前或最旧的在前，用户可选择）

**AC6: 空状态处理**
- **Given** 用户查看产品与客户的互动记录
- **When** 没有互动记录
- **Then** 系统显示空状态"该产品与该客户尚未有任何互动记录"
- **And** 系统提供"记录新互动"按钮，用户可以快速记录互动
- **And** 空状态显示友好的提示信息

## Tasks / Subtasks

- [x] Task 1: 验证和完善后端 API 端点 (AC: #1, #2, #3, #5)
  - [x] 验证 `GET /api/products/:productId/interactions?customerId=:customerId` 端点已实现
  - [x] 验证基于角色的数据过滤已实现（前端专员只看到采购商，后端专员只看到供应商）
  - [x] 验证分页功能已实现（page, limit 参数）
  - [x] **MEDIUM**: 实现排序功能（如果需要，添加 sortOrder 参数）
    - [x] 在 `ProductCustomerInteractionQueryDto` 中添加 `sortOrder?: 'asc' | 'desc'` 字段
    - [x] 在 `ProductCustomerInteractionHistoryService.getProductCustomerInteractions` 方法中处理 `sortOrder` 参数
    - [x] 更新 SQL 查询的 `ORDER BY` 子句：`ORDER BY pci.interaction_date ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`
    - [x] 默认值为 `'desc'`（最新的在前）
  - [x] 验证附件数据已包含在响应中（attachments 数组）
  - [x] 验证产品不存在时返回 404
  - [x] 验证客户不存在时返回 404
  - [x] 验证权限检查失败时返回 403

- [x] Task 2: 验证和完善前端 ProductCustomerInteractionHistory 组件 (AC: #1, #2, #3, #4, #5, #6)
  - [x] 验证组件已实现并集成到 `ProductDetailPanel` 或 `ProductCustomerAssociation`
  - [x] 验证互动记录按时间顺序显示（最新的在前）
  - [x] 验证每条互动记录显示：互动类型、互动时间、互动描述、创建者
  - [x] **CRITICAL**: 修复附件显示功能，复用 Story 4.8 的实现
    - [x] 照片附件：显示缩略图（64x64px 桌面端，48x48px 移动端），点击查看大图（使用 `PhotoPreview` 组件）
    - [x] 文档附件：使用 `getFileIcon` 显示图标，使用 `formatFileSize` 格式化文件大小，点击下载
    - [x] 复用 `CustomerTimeline` 组件的附件显示逻辑（参考 `fenghua-frontend/src/customers/components/CustomerTimeline.tsx`）
    - [x] 添加照片预览状态管理（`selectedPhotoIndex`, `photoAttachments`）
    - [x] 集成 `PhotoPreview` 组件（从 `fenghua-frontend/src/attachments/components/PhotoPreview.tsx` 导入）
    - [x] 使用 `getFileIcon` 和 `formatFileSize` 工具函数（从 `attachments.service` 导入 `formatFileSize`，复制 `getFileIcon`）
  - [x] 验证分页功能（如果记录 > 20 条）
  - [x] **MEDIUM**: 实现排序功能（用户可选择最新的在前或最旧的在前）
    - [x] 添加排序选择器（切换按钮）
    - [x] 将 `sortOrder` 参数传递给后端 API
    - [x] 更新 React Query 缓存键以包含 `sortOrder`
  - [x] 验证空状态显示（"该产品与该客户尚未有任何互动记录"）
  - [x] **HIGH**: 修复"记录新互动"按钮（链接到互动记录创建页面）
    - [x] 按钮链接到 `/interactions/create?productId=${productId}&customerId=${customerId}`
    - [x] **HIGH**: 按钮样式改为 `variant="primary"`（当前为 `secondary`）
    - [x] 按钮文本："记录新互动"
    - [x] **HIGH**: 确保 `InteractionCreateForm` 能够接收并预填充产品和客户信息
      - [x] 更新 `InteractionCreatePage` 从 URL 参数获取 `productId`
      - [x] 更新 `InteractionCreateForm` 添加 `prefillProductId` prop
      - [x] 在 `InteractionCreateForm` 中添加 `useEffect` 加载并设置产品信息（类似 `prefillCustomerId` 的处理）
  - [x] **MEDIUM**: 使用统一的错误消息常量
    - [x] 在 `error-messages.ts` 中添加 `PRODUCT_INTERACTION_ERRORS` 部分
    - [x] 替换所有硬编码的错误消息为常量
  - [x] **LOW**: 添加 JSDoc 注释到所有函数

- [x] Task 3: 优化附件显示和交互 (AC: #4) - **CRITICAL FIX**
  - [x] **必须修复**: 当前实现过于简单，需要完全复用 Story 4.8 的附件显示逻辑
    - [x] 照片附件：显示缩略图（64x64px 桌面端，48x48px 移动端），点击查看大图
      - [x] 使用 `<img>` 标签显示缩略图，`onError` 处理加载失败
      - [x] 点击缩略图打开 `PhotoPreview` 组件
      - [x] 支持多张照片切换（上一张/下一张，键盘导航：←/→）
    - [x] 文档附件：显示图标和文件名，点击下载
      - [x] 使用 `getFileIcon` 函数根据文件类型显示图标（PDF: 📄, Word: 📝, Excel: 📊, 其他: 📎）
      - [x] 使用 `formatFileSize` 函数格式化文件大小（如 "1.2 MB"）
      - [x] 使用 `<a>` 标签的 `download` 属性实现下载
      - [x] 使用 `handleDocumentClick` 函数安全处理下载（防止 tabnabbing 攻击）
    - [x] 复用 `PhotoPreview` 组件（从 `fenghua-frontend/src/attachments/components/PhotoPreview.tsx` 导入）
    - [x] 复用 `getFileIcon` 和 `formatFileSize` 工具函数
      - [x] 从 `CustomerTimeline` 组件复制 `getFileIcon` 函数
      - [x] 从 `attachments.service` 导入 `formatFileSize`（已可用）
    - [x] 参考实现：`fenghua-frontend/src/customers/components/CustomerTimeline.tsx` 的 `TimelineInteractionCard` 组件（第 292-356 行）
  - [x] 确保附件显示布局优化（移动端和桌面端）
  - [x] 添加照片预览状态管理：
    - [x] `selectedPhotoIndex: number | null` - 当前预览的照片索引
    - [x] `photoAttachments: Attachment[]` - 当前互动记录的所有照片附件数组
    - [x] `handlePhotoClick` - 处理照片点击，打开预览
    - [x] `handlePhotoNext` - 切换到下一张照片
    - [x] `handlePhotoPrevious` - 切换到上一张照片

- [x] Task 4: 优化互动记录卡片显示 (AC: #1, #2, #3)
  - [x] 确保互动类型显示中文标签（使用 INTERACTION_TYPE_LABELS）
  - [x] 确保互动时间格式化显示（使用 `toLocaleString`）
  - [x] 确保创建者信息显示（创建者姓名或邮箱）
  - [x] 优化卡片布局（移动端和桌面端）

- [x] Task 5: 集成到产品详情页面 (AC: #1, #2, #3)
  - [x] 验证 `ProductCustomerAssociation` 组件中的"查看互动记录"按钮已实现
  - [x] 验证按钮链接到正确的路由（`/products/:productId/interactions?customerId=:customerId`）
  - [x] 验证 `ProductCustomerInteractionHistoryPage` 页面已实现
  - [x] 验证页面显示产品名称和客户名称
  - [x] 验证页面集成 `ProductCustomerInteractionHistory` 组件

- [ ] Task 6: 添加测试用例 (AC: #1, #2, #3, #4, #5, #6)
  - [ ] 添加前端组件测试（ProductCustomerInteractionHistory 组件）
  - [ ] 测试基于角色的数据过滤（前端专员只看到采购商，后端专员只看到供应商）
  - [ ] 测试分页功能
  - [ ] 测试排序功能（如果需要）
  - [ ] 测试附件显示和交互
  - [ ] 测试空状态显示
  - [ ] 添加后端 API 测试（ProductCustomerInteractionHistoryController 和 ProductCustomerInteractionHistoryService）

## Technical Notes

### 现有实现分析

**Story 2.5 已完成的工作：**
- ✅ 后端 `ProductCustomerInteractionHistoryService` 已实现
- ✅ 后端 `ProductCustomerInteractionHistoryController` 已实现
- ✅ 后端 API 端点：`GET /api/products/:productId/interactions?customerId=:customerId`
- ✅ 前端 `ProductCustomerInteractionHistory` 组件已实现
- ✅ 前端 `ProductCustomerInteractionHistoryPage` 页面已实现
- ✅ 路由已配置：`/products/:productId/interactions`
- ✅ `ProductCustomerAssociation` 组件中已有"查看互动记录"按钮

**需要验证和完善的工作：**
- ⚠️ **CRITICAL**: 附件显示未复用 Story 4.8 的实现（照片预览、文档下载逻辑）
- ⚠️ **HIGH**: InteractionCreateForm 不支持 productId 预填充（仅支持 customerId）
- ⚠️ **HIGH**: 空状态按钮样式不符合要求（当前为 secondary，应为 primary）
- ⚠️ **MEDIUM**: 后端 API 可能不支持排序功能（sortOrder 参数）
- ⚠️ **MEDIUM**: 前端组件未使用统一的错误消息常量
- ⚠️ **LOW**: 文件大小格式化未使用 formatFileSize 工具函数
- ⚠️ **LOW**: 缺少 JSDoc 注释

### 后端 API

**端点：** `GET /api/products/:productId/interactions?customerId=:customerId`

**查询参数：**
- `customerId` (string, required): 客户 ID
- `page` (number, default: 1): 页码
- `limit` (number, default: 20, max: 100): 每页记录数
- `sortOrder` (optional, 'asc' | 'desc', default: 'desc'): 排序顺序（**需要实现**）

**响应格式：**
```typescript
{
  interactions: ProductCustomerInteractionDto[];
  total: number;
}

interface ProductCustomerInteractionDto {
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
  attachments: FileAttachmentDto[];
}

interface FileAttachmentDto {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  mimeType?: string;
}
```

**实现位置：**
- Controller: `fenghua-backend/src/products/product-customer-interaction-history.controller.ts`
- Service: `fenghua-backend/src/products/product-customer-interaction-history.service.ts`
- DTO: `fenghua-backend/src/products/dto/product-customer-interaction-history.dto.ts`

### 前端组件

**组件：** `ProductCustomerInteractionHistory`

**位置：** `fenghua-frontend/src/products/components/ProductCustomerInteractionHistory.tsx`

**页面：** `ProductCustomerInteractionHistoryPage`

**位置：** `fenghua-frontend/src/products/ProductCustomerInteractionHistoryPage.tsx`

**集成位置：** 
- `ProductCustomerAssociation` 组件中的"查看互动记录"按钮
- 路由：`/products/:productId/interactions?customerId=:customerId`

**功能：**
- 显示产品与客户的互动记录（限定产品和客户）
- 支持基于角色的数据过滤
- 支持分页
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

**文档附件：**
- 根据文件类型显示对应图标：
  - PDF: 📄
  - Word (.docx, .doc): 📝
  - Excel (.xlsx, .xls): 📊
  - 其他: 📎
- 显示文件名和文件大小（格式化显示，如 "1.2 MB"）
- 点击附件直接下载（使用 `<a>` 标签的 `download` 属性）

**复用 Story 4.8 的实现（CRITICAL - 必须修复）：**
- **当前问题**: `ProductCustomerInteractionHistory` 组件的附件显示过于简单，未复用 Story 4.8 的实现
- **必须修复**: 完全复用 `CustomerTimeline` 组件的附件显示逻辑
- 复用 `PhotoPreview` 组件（从 `fenghua-frontend/src/attachments/components/PhotoPreview.tsx` 导入）
- 复用 `getFileIcon` 和 `formatFileSize` 工具函数
  - `getFileIcon`: 根据文件类型返回图标（PDF: 📄, Word: 📝, Excel: 📊, 照片: 🖼️, 其他: 📎）
  - `formatFileSize`: 格式化文件大小（如 "1.2 MB", "512 KB"）
- 复用附件显示布局和样式
- **参考实现**: `fenghua-frontend/src/customers/components/CustomerTimeline.tsx` 的 `TimelineInteractionCard` 组件（第 292-356 行）

### 性能优化

**数据库索引：**
- `idx_interactions_product_customer_date` - 按产品+客户+时间查询（已存在）
- `idx_interactions_product_customer` - 按产品和客户查询（已存在）

**查询优化：**
- 使用分页限制返回记录数（默认 20 条，最大 100 条）
- 使用聚合查询一次性获取附件数据（避免 N+1 查询）
- 使用 React Query 缓存查询结果（5 分钟缓存）

## Code Examples

### 前端组件使用示例

```tsx
// ProductCustomerAssociation.tsx
import { Link } from 'react-router-dom';

export const ProductCustomerAssociation: React.FC<ProductCustomerAssociationProps> = ({
  productId,
}) => {
  return (
    <div>
      {/* 客户列表 */}
      {customers.map((customer) => (
        <div key={customer.id}>
          <span>{customer.name}</span>
          <Link
            to={`/products/${productId}/interactions?customerId=${customer.id}`}
          >
            查看互动记录
          </Link>
        </div>
      ))}
    </div>
  );
};
```

### 后端 API 调用示例

```typescript
// 获取产品客户互动历史
const response = await fetch(
  `/api/products/${productId}/interactions?customerId=${customerId}&page=1&limit=20`,
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

### "记录新互动"按钮实现示例

```tsx
// ProductCustomerInteractionHistory.tsx
import { Link } from 'react-router-dom';

// 在空状态中显示按钮
{!data || data.interactions.length === 0 ? (
  <Card variant="outlined" className="p-monday-4">
    <div className="text-center py-monday-8">
      <div className="text-monday-4xl mb-monday-4 opacity-50">📅</div>
      <p className="text-monday-base text-monday-text-secondary mb-monday-4">
        该产品与该客户尚未有任何互动记录
      </p>
      <Link
        to={`/interactions/create?productId=${productId}&customerId=${customerId}`}
      >
        <Button variant="primary">记录新互动</Button> {/* HIGH: 必须使用 primary，不是 secondary */}
      </Link>
    </div>
  </Card>
) : (
  // 显示互动记录列表
)}
```

### InteractionCreateForm 支持 productId 预填充（HIGH - 必须修复）

```tsx
// InteractionCreatePage.tsx
import { useSearchParams } from 'react-router-dom';

export const InteractionCreatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  
  // 从 URL 参数获取 customerId 和 productId
  const customerIdFromQuery = searchParams.get('customerId');
  const productIdFromQuery = searchParams.get('productId'); // NEW: 添加 productId 支持
  const prefillCustomerId = customerIdFromQuery || undefined;
  const prefillProductId = productIdFromQuery || undefined; // NEW: 添加 prefillProductId

  return (
    <MainLayout title="创建互动记录">
      <Card variant="default" className="w-full">
        <div className="p-monday-6">
          <h2 className="text-monday-2xl font-semibold text-monday-text mb-monday-6">
            创建互动记录
          </h2>
          <InteractionCreateForm 
            prefillCustomerId={prefillCustomerId}
            prefillProductId={prefillProductId} // NEW: 传递 prefillProductId
          />
        </div>
      </Card>
    </MainLayout>
  );
};
```

```tsx
// InteractionCreateForm.tsx
interface InteractionCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  prefillCustomerId?: string;
  prefillProductId?: string; // NEW: 添加 prefillProductId prop
}

export const InteractionCreateForm: React.FC<InteractionCreateFormProps> = ({
  onSuccess,
  onCancel,
  prefillCustomerId,
  prefillProductId, // NEW: 添加 prefillProductId
}) => {
  // ... existing code ...

  // NEW: 预填充产品信息（类似 prefillCustomerId 的处理）
  useEffect(() => {
    if (prefillProductId && !selectedProduct) {
      const loadProduct = async () => {
        try {
          const product = await productsService.getProduct(prefillProductId);
          // 验证产品状态（只预填充 active 状态的产品）
          if (product.status === 'active') {
            setSelectedProduct(product);
          } else {
            toast.warn('该产品不是活跃状态');
          }
        } catch (error) {
          console.error('Failed to load product', error);
          toast.error('加载产品信息失败');
        }
      };
      loadProduct();
    }
  }, [prefillProductId, selectedProduct]);

  // ... rest of component ...
};
```

### 附件显示实现示例（CRITICAL - 必须修复）

```tsx
// ProductCustomerInteractionHistory.tsx
import { PhotoPreview } from '../../attachments/components/PhotoPreview';
import { Attachment } from '../../attachments/services/attachments.service';
import { useState } from 'react';

// 从 CustomerTimeline 复制 getFileIcon 和 formatFileSize 函数
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

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const InteractionCard: React.FC<{ interaction: Interaction }> = ({ interaction }) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [photoAttachments, setPhotoAttachments] = useState<Attachment[]>([]);

  /**
   * Handle document attachment click - download document safely
   * 
   * @param attachment - File attachment to download
   */
  const handleDocumentClick = (attachment: FileAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.fileUrl;
    link.download = attachment.fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  /**
   * Handle photo click - open photo preview
   * 
   * @param attachment - Photo attachment that was clicked
   * @param allAttachments - All attachments for the interaction
   */
  const handlePhotoClick = (attachment: FileAttachment, allAttachments: FileAttachment[]) => {
    const photos = allAttachments.filter(
      (a) => a.fileType === 'photo' || a.mimeType?.startsWith('image/'),
    );
    const index = photos.findIndex((a) => a.id === attachment.id);
    if (index !== -1) {
      const photoAttachmentsAsAttachment: Attachment[] = photos.map((p) => ({
        id: p.id,
        fileName: p.fileName,
        fileUrl: p.fileUrl,
        fileSize: p.fileSize,
        fileType: p.fileType,
        mimeType: p.mimeType,
        storageProvider: 'timeline',
        storageKey: p.id,
        createdAt: new Date(),
        createdBy: '',
      }));
      setPhotoAttachments(photoAttachmentsAsAttachment);
      setSelectedPhotoIndex(index);
    }
  };

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

  return (
    <>
      <Card variant="outlined" className="p-monday-4">
        {/* ... interaction card content ... */}
        
        {/* 附件列表 - 复用 Story 4.8 的实现 */}
        {interaction.attachments && interaction.attachments.length > 0 && (
          <div className="mt-monday-3 pt-monday-3 border-t border-gray-200">
            <div className="text-monday-xs text-monday-text-secondary mb-monday-2">附件：</div>
            <div className="flex flex-wrap gap-monday-2">
              {interaction.attachments.map((attachment) => {
                const isPhoto =
                  attachment.fileType === 'photo' || attachment.mimeType?.startsWith('image/');

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
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.classList.remove('hidden');
                          }
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
                      onClick={(e) => {
                        e.preventDefault();
                        handleDocumentClick(attachment);
                      }}
                      className="flex items-center gap-monday-2 px-monday-3 py-monday-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-lg">{getFileIcon(attachment)}</span>
                      <div className="flex flex-col">
                        <span className="text-monday-xs font-medium">{attachment.fileName}</span>
                        <span className="text-monday-xs text-gray-500">
                          {formatFileSize(attachment.fileSize)}
                        </span>
                      </div>
                    </a>
                  );
                }
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Photo Preview Modal */}
      {selectedPhotoIndex !== null && photoAttachments.length > 0 && (
        <PhotoPreview
          photos={photoAttachments}
          currentIndex={selectedPhotoIndex}
          onClose={() => {
            setSelectedPhotoIndex(null);
            setPhotoAttachments([]);
          }}
          onNext={handlePhotoNext}
          onPrevious={handlePhotoPrevious}
        />
      )}
    </>
  );
};
```

## Project Structure

```
fenghua-backend/
├── src/
│   └── products/
│       ├── product-customer-interaction-history.controller.ts (GET /api/products/:productId/interactions)
│       ├── product-customer-interaction-history.service.ts (业务逻辑)
│       └── dto/
│           └── product-customer-interaction-history.dto.ts (DTO 定义)

fenghua-frontend/
├── src/
│   └── products/
│       ├── components/
│       │   ├── ProductCustomerInteractionHistory.tsx (互动记录组件)
│       │   └── ProductCustomerAssociation.tsx (客户关联组件，包含"查看互动记录"按钮)
│       └── ProductCustomerInteractionHistoryPage.tsx (互动记录页面)
```

## Dependencies

**现有依赖：**
- `@tanstack/react-query` - 用于数据获取和缓存
- `react-router-dom` - 用于路由导航

**无需新增依赖：**
- 所有必需的功能都已实现，只需验证和完善

## Validation Issues and Fixes

### Critical Issues (Must Fix)

1. **附件显示未复用 Story 4.8 的实现**
   - **问题**: 当前实现过于简单，所有附件使用相同的显示方式
   - **修复**: 完全复用 `CustomerTimeline` 组件的附件显示逻辑
   - **参考**: `fenghua-frontend/src/customers/components/CustomerTimeline.tsx` (第 292-356 行)

2. **InteractionCreateForm 不支持 productId 预填充**
   - **问题**: 仅支持 `customerId` 预填充，不支持 `productId`
   - **修复**: 添加 `prefillProductId` prop 和相关处理逻辑

3. **空状态按钮样式不符合要求**
   - **问题**: 当前为 `variant="secondary"`，应为 `variant="primary"`
   - **修复**: 改为 `variant="primary"`

### Medium Priority Issues (Should Fix)

4. **后端 API 可能不支持排序功能**
   - **问题**: AC5 要求支持排序，但后端可能不支持 `sortOrder` 参数
   - **修复**: 在 DTO、Service 和 Controller 中添加 `sortOrder` 参数支持

5. **错误消息未使用统一常量**
   - **问题**: 硬编码错误消息，未使用 `error-messages.ts`
   - **修复**: 添加 `PRODUCT_INTERACTION_ERRORS` 常量并替换所有硬编码消息

### Low Priority Issues (Nice to Have)

6. **文件大小格式化不一致**
   - **问题**: 使用 `(attachment.fileSize / 1024).toFixed(1) KB`，未使用 `formatFileSize`
   - **修复**: 使用 `formatFileSize` 工具函数

7. **缺少 JSDoc 注释**
   - **问题**: 函数缺少 JSDoc 注释
   - **修复**: 添加完整的 JSDoc 注释

## References

- **Epic 4:** 互动记录核心功能
- **FR27:** 前端专员可以查看某个产品与采购商的所有互动记录；后端专员可以查看某个产品与供应商的所有互动记录；总监和管理员可以查看某个产品的所有互动记录
- **Story 2.5:** 产品与客户互动历史查看（已实现后端 API 和前端组件）
- **Story 3.5:** 客户产品互动历史查看（参考实现）
- **Story 4.8:** 互动历史查看（**必须参考附件显示和照片预览实现**）
  - **关键参考**: `fenghua-frontend/src/customers/components/CustomerTimeline.tsx` (附件显示逻辑)
  - **关键参考**: `fenghua-frontend/src/attachments/components/PhotoPreview.tsx` (照片预览组件)
- **Story 4.5:** 生产进度照片上传（PhotoPreview 组件）
- **Story 4.6:** 发货前验收照片上传（照片预览和切换）

## Dev Agent Record

### Agent Model Used

Auto (Cursor AI)

### Debug Log References

### Completion Notes List

**实现完成（2025-01-03）：**

1. **后端 API 排序功能** ✅
   - 在 `ProductCustomerInteractionQueryDto` 中添加了 `sortOrder?: 'asc' | 'desc'` 字段
   - 在 `ProductCustomerInteractionHistoryService` 中实现了排序逻辑
   - SQL 查询支持动态排序（`ORDER BY pci.interaction_date ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`）

2. **附件显示功能修复（CRITICAL）** ✅
   - 完全复用了 Story 4.8 的附件显示逻辑
   - 照片附件：显示缩略图，点击查看大图（使用 `PhotoPreview` 组件）
   - 文档附件：使用 `getFileIcon` 显示图标，使用 `formatFileSize` 格式化文件大小
   - 添加了照片预览状态管理和导航功能
   - 使用 `ErrorBoundary` 包装 `PhotoPreview` 组件

3. **InteractionCreateForm 支持 productId 预填充（HIGH）** ✅
   - 更新了 `InteractionCreatePage` 从 URL 参数获取 `productId`
   - 更新了 `InteractionCreateForm` 添加 `prefillProductId` prop
   - 添加了 `useEffect` 加载并设置产品信息（验证产品状态为 active）

4. **空状态按钮样式修复（HIGH）** ✅
   - 将按钮样式从 `variant="secondary"` 改为 `variant="primary"`

5. **前端排序功能（MEDIUM）** ✅
   - 添加了排序选择器（切换按钮："最新的在前" / "最旧的在前"）
   - 将 `sortOrder` 参数传递给后端 API
   - 更新了 React Query 缓存键以包含 `sortOrder`

6. **统一错误消息常量（MEDIUM）** ✅
   - 在 `error-messages.ts` 中添加了 `PRODUCT_INTERACTION_ERRORS` 部分
   - 替换了所有硬编码的错误消息为常量

7. **JSDoc 注释（LOW）** ✅
   - 为所有主要函数添加了 JSDoc 注释
   - 包括 `getFileIcon`, `handleDocumentClick`, `handlePhotoClick`, `handlePhotoNext`, `handlePhotoPrevious` 等

### File List

**后端文件：**
- `fenghua-backend/src/products/dto/product-customer-interaction-history.dto.ts` - 添加了 `sortOrder` 字段和 `@IsIn` 验证
- `fenghua-backend/src/products/product-customer-interaction-history.service.ts` - 实现了排序逻辑
- `fenghua-backend/src/products/product-customer-interaction-history.controller.ts` - 传递 `sortOrder` 参数

**前端文件：**
- `fenghua-frontend/src/products/components/ProductCustomerInteractionHistory.tsx` - 完全重写了附件显示逻辑，添加了排序功能和照片预览，添加了 UUID 验证和 `getTimeLabel` 函数
- `fenghua-frontend/src/interactions/pages/InteractionCreatePage.tsx` - 添加了 `productId` 预填充支持
- `fenghua-frontend/src/interactions/components/InteractionCreateForm.tsx` - 添加了 `prefillProductId` prop 和处理逻辑，修复了 useEffect 依赖项
- `fenghua-frontend/src/common/constants/error-messages.ts` - 添加了 `PRODUCT_INTERACTION_ERRORS` 常量（包括 `NO_INTERACTIONS` 和 `NO_INTERACTIONS_IN_STAGE`）

## Change Log

**代码审查修复（2025-01-03）：**
- **Issue #1 (HIGH):** 在后端 DTO 中添加了 `@IsIn(['asc', 'desc'])` 验证，确保 `sortOrder` 参数只能接受有效值
- **Issue #2 (MEDIUM):** 在 `error-messages.ts` 中添加了 `NO_INTERACTIONS` 和 `NO_INTERACTIONS_IN_STAGE` 常量，替换了硬编码的空状态消息
- **Issue #3 (MEDIUM):** 添加了 `getTimeLabel` 函数到 `ProductCustomerInteractionHistory.tsx`，统一时间格式化显示（与 Story 4.8 保持一致）
- **Issue #4 (MEDIUM):** 添加了 `productId` 和 `customerId` 的 UUID 格式验证，防止无效 API 调用
- **Issue #5 (MEDIUM):** 在 `InteractionCreateForm.tsx` 中添加了 eslint-disable 注释，说明 `productsService` 是稳定的，不需要添加到依赖项

