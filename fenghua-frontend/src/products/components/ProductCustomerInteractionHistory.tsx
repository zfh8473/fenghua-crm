/**
 * Product Customer Interaction History Component
 * 
 * Displays product-customer interaction history with role-based filtering
 * All custom code is proprietary and not open source.
 */

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PhotoPreview } from '../../attachments/components/PhotoPreview';
import { Attachment, formatFileSize } from '../../attachments/services/attachments.service';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import {
  PRODUCT_INTERACTION_ERRORS,
  GENERIC_ERRORS,
  INTERACTION_EDIT_ERRORS,
} from '../../common/constants/error-messages';
import { interactionsService } from '../../interactions/services/interactions.service';
import { toast } from 'react-toastify';

interface ProductCustomerInteractionHistoryProps {
  productId: string;
  customerId: string;
}

interface Interaction {
  id: string;
  interactionType: string;
  interactionDate: string;
  description?: string;
  status?: string;
  additionalInfo?: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
  creator?: {
    email?: string;
    firstName?: string;
    lastName?: string;
  };
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

/**
 * Stage to interaction types mapping (matching backend BUYER_STAGES and SUPPLIER_STAGES)
 */
/**
 * Stage to interaction types mapping (matching backend BUYER_STAGES and SUPPLIER_STAGES)
 * Note: This must be kept in sync with backend service definitions
 */
const STAGE_TO_INTERACTION_TYPES: Record<string, string[]> = {
  // Buyer stages (matching BUYER_STAGES in product-business-process.service.ts)
  initial_contact: ['initial_contact'],
  product_inquiry: ['product_inquiry'],
  quotation: ['quotation'],
  quotation_response: ['quotation_accepted', 'quotation_rejected'],
  order_signed: ['order_signed'],
  order_completed: ['order_completed'],
  // Supplier stages (matching SUPPLIER_STAGES in product-business-process.service.ts)
  product_inquiry_supplier: ['product_inquiry_supplier'],
  quotation_received: ['quotation_received'],
  specification_confirmed: ['specification_confirmed'],
  production_progress: ['production_progress'],
  pre_shipment_inspection: ['pre_shipment_inspection'],
  shipped: ['shipped'],
};

// 互动类型中文标签映射
const INTERACTION_TYPE_LABELS: Record<string, string> = {
  // 采购商互动类型
  initial_contact: '初步接触',
  product_inquiry: '产品询价',
  quotation: '报价',
  quotation_accepted: '接受报价',
  quotation_rejected: '拒绝报价',
  order_signed: '签署订单',
  order_completed: '完成订单',
  // 供应商互动类型
  product_inquiry_supplier: '询价产品',
  quotation_received: '接收报价',
  specification_confirmed: '产品规格确认',
  production_progress: '生产进度跟进',
  pre_shipment_inspection: '发货前验收',
  shipped: '已发货',
};

// 互动类型颜色映射
const getInteractionTypeColor = (type: string): string => {
  // 采购商互动类型（蓝色系）
  const buyerTypes = [
    'initial_contact',
    'product_inquiry',
    'quotation',
    'quotation_accepted',
    'quotation_rejected',
    'order_signed',
    'order_completed',
  ];
  // 供应商互动类型（紫色系）
  const supplierTypes = [
    'product_inquiry_supplier',
    'quotation_received',
    'specification_confirmed',
    'production_progress',
    'pre_shipment_inspection',
    'shipped',
  ];

  if (buyerTypes.includes(type)) {
    return 'bg-primary-blue/10 text-primary-blue';
  }
  if (supplierTypes.includes(type)) {
    return 'bg-primary-purple/10 text-primary-purple';
  }
  return 'bg-gray-100 text-monday-text-secondary';
};

/**
 * Format date string to human-readable time label
 * 
 * Formats dates as "今天", "昨天", "本周", "本月", or localized date string
 * 
 * @param dateString - ISO date string
 * @returns Formatted time label in Chinese
 */
const getTimeLabel = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - today.getDay()); // Start of the current week (Sunday)
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const interactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (interactionDate.getTime() === today.getTime()) return '今天';
  if (interactionDate.getTime() === yesterday.getTime()) return '昨天';
  if (interactionDate >= thisWeek) return '本周';
  if (interactionDate >= thisMonth) return '本月';
  return date.toLocaleDateString('zh-CN'); // Fallback for older dates
};

/**
 * Get file icon based on file type
 * 
 * @param attachment - File attachment
 * @returns Icon emoji string
 */
const getFileIcon = (attachment: FileAttachment): string => {
  if (attachment.fileType === 'photo' || attachment.mimeType?.startsWith('image/')) {
    return '🖼️';
  }
  if (attachment.mimeType === 'application/pdf' || attachment.fileName.endsWith('.pdf')) {
    return '📄';
  }
  if (
    attachment.mimeType?.includes('word') ||
    attachment.fileName.endsWith('.docx') ||
    attachment.fileName.endsWith('.doc')
  ) {
    return '📝';
  }
  if (
    attachment.mimeType?.includes('excel') ||
    attachment.fileName.endsWith('.xlsx') ||
    attachment.fileName.endsWith('.xls')
  ) {
    return '📊';
  }
  return '📎';
};

/**
 * InteractionCard Sub-component
 * 
 * Displays a single interaction with attachments support
 * 
 * @param interaction - Interaction data to display
 * @param onPhotoClick - Callback when photo attachment is clicked
 */
const InteractionCard: React.FC<{
  interaction: Interaction;
  onPhotoClick: (attachment: FileAttachment, allAttachments: FileAttachment[]) => void;
  currentUserId?: string;
  onDelete?: (interactionId: string) => void;
}> = ({ interaction, onPhotoClick, currentUserId, onDelete }) => {
  /**
   * Handle document attachment click - download document safely
   * 
   * Creates a temporary anchor element to trigger download while preventing
   * tabnabbing attacks by using safe link creation.
   * 
   * @param attachment - File attachment to download
   */
  const handleDocumentClick = (attachment: FileAttachment) => {
    // Use safe link creation to prevent tabnabbing attacks
    const link = document.createElement('a');
    link.href = attachment.fileUrl;
    link.download = attachment.fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  return (
    <Card variant="outlined" className="p-monday-4">
      <div className="flex items-start justify-between mb-monday-3">
        <div className="flex items-center gap-monday-2">
          <span
            className={`px-monday-2 py-monday-0.5 rounded-full text-monday-xs font-semibold ${getInteractionTypeColor(interaction.interactionType)}`}
          >
            {INTERACTION_TYPE_LABELS[interaction.interactionType] || interaction.interactionType}
          </span>
          {interaction.status && (
            <span className="text-monday-xs text-monday-text-secondary">{interaction.status}</span>
          )}
        </div>
        <div className="text-right">
          <div className="text-monday-xs text-monday-text-secondary">
            {getTimeLabel(interaction.interactionDate)}
          </div>
          <div className="text-monday-xs text-monday-text-secondary">
            {new Date(interaction.interactionDate).toLocaleString('zh-CN')}
          </div>
        </div>
      </div>

      {interaction.description && (
        <p className="text-monday-sm text-monday-text mb-monday-3">{interaction.description}</p>
      )}

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
                    onClick={() => onPhotoClick(attachment, interaction.attachments)}
                    className="relative w-16 h-16 rounded overflow-hidden border border-gray-200 hover:border-primary-blue transition-colors"
                    aria-label={`查看照片: ${attachment.fileName}`}
                  >
                    <img
                      src={attachment.fileUrl}
                      alt={attachment.fileName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // 缩略图加载失败，显示图标
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

      {/* 创建者信息 */}
      {interaction.creator && (
        <div className="mt-monday-3 pt-monday-3 border-t border-gray-200">
          <span className="text-monday-xs text-monday-text-secondary">
            创建者：{interaction.creator.firstName} {interaction.creator.lastName} (
            {interaction.creator.email})
          </span>
        </div>
      )}

      {/* 编辑和删除按钮（只在当前用户是创建者时显示） */}
      {interaction.createdBy && currentUserId && interaction.createdBy === currentUserId && (
        <div className="mt-monday-3 pt-monday-3 border-t border-gray-200 flex gap-monday-2">
          <Link
            to={`/interactions/${interaction.id}/edit`}
            className="flex-1"
          >
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full"
            >
              编辑
            </Button>
          </Link>
          {onDelete && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onDelete(interaction.id)}
              className="flex-1 text-primary-red hover:text-primary-red/80 hover:border-primary-red"
            >
              删除
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

/**
 * Main Component
 */
/**
 * Product Customer Interaction History Component
 * 
 * Displays product-customer interaction history with role-based filtering,
 * attachment display, and photo preview support
 * 
 * @param productId - Product ID
 * @param customerId - Customer ID
 */
export const ProductCustomerInteractionHistory: React.FC<ProductCustomerInteractionHistoryProps> = ({
  productId,
  customerId,
}) => {
  // Validate UUID format for productId and customerId
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isValidProductId = isValidUUID.test(productId);
  const isValidCustomerId = isValidUUID.test(customerId);

  if (!isValidProductId || !isValidCustomerId) {
    return (
      <Card variant="outlined" className="p-monday-4">
        <div className="text-center py-monday-8">
          <p className="text-monday-sm text-primary-red">
            {PRODUCT_INTERACTION_ERRORS.INVALID_ID}
          </p>
        </div>
      </Card>
    );
  }

  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const stage = searchParams.get('stage'); // Get stage filter from URL
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const limit = 20;
  
  // Photo preview states
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [photoAttachments, setPhotoAttachments] = useState<Attachment[]>([]);

  // 删除确认对话框状态
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    interactionId: string | null;
  }>({
    show: false,
    interactionId: null,
  });

  const queryClient = useQueryClient();

  // 删除互动记录的 mutation
  const deleteMutation = useMutation({
    mutationFn: (interactionId: string) => interactionsService.deleteInteraction(interactionId),
    onSuccess: () => {
      toast.success('互动记录删除成功');
      // 刷新互动历史数据
      queryClient.invalidateQueries({ queryKey: ['product-interactions', productId, customerId] });
      queryClient.invalidateQueries({ queryKey: ['customer-interactions'] });
      queryClient.invalidateQueries({ queryKey: ['customer-product-interactions'] });
      setDeleteConfirm({ show: false, interactionId: null });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || INTERACTION_EDIT_ERRORS.DELETE_FAILED;
      toast.error(errorMessage);
    },
  });

  /**
   * 处理删除按钮点击
   */
  const handleDeleteClick = (interactionId: string) => {
    setDeleteConfirm({ show: true, interactionId });
  };

  /**
   * 确认删除
   */
  const handleConfirmDelete = () => {
    if (deleteConfirm.interactionId) {
      deleteMutation.mutate(deleteConfirm.interactionId);
    }
  };

  /**
   * 取消删除
   */
  const handleCancelDelete = () => {
    setDeleteConfirm({ show: false, interactionId: null });
  };

  // 使用 React Query 获取互动历史
  const { data, isLoading, error, refetch } = useQuery<{
    interactions: Interaction[];
    total: number;
  }>({
    queryKey: ['product-interactions', productId, customerId, page, limit, sortOrder, stage],
    queryFn: async () => {
      const apiBaseUrl =
        import.meta.env?.VITE_API_BASE_URL ||
        import.meta.env?.VITE_BACKEND_URL ||
        '/api';
      const response = await fetch(
        `${apiBaseUrl}/products/${productId}/interactions?customerId=${customerId}&page=${page}&limit=${limit}&sortOrder=${sortOrder}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(PRODUCT_INTERACTION_ERRORS.NO_PERMISSION);
        }
        if (response.status === 404) {
          throw new Error(PRODUCT_INTERACTION_ERRORS.NOT_FOUND);
        }
        throw new Error(PRODUCT_INTERACTION_ERRORS.LOAD_FAILED);
      }
      const result = await response.json();
      // Backend returns Date objects which are serialized to ISO strings in JSON
      // Type definition uses string which is correct for JSON-serialized dates
      return result;
    },
    enabled: !!productId && !!customerId && !!token,
    staleTime: 5 * 60 * 1000, // 5 分钟缓存
  });

  // Filter interactions by stage if stage parameter is provided
  const filteredData = useMemo(() => {
    if (!data || !stage) {
      return data;
    }

    const allowedInteractionTypes = STAGE_TO_INTERACTION_TYPES[stage];
    if (!allowedInteractionTypes || allowedInteractionTypes.length === 0) {
      // Unknown stage, return all interactions
      return data;
    }

    const filteredInteractions = data.interactions.filter((interaction) =>
      allowedInteractionTypes.includes(interaction.interactionType),
    );

    return {
      interactions: filteredInteractions,
      total: filteredInteractions.length, // Update total to reflect filtered count
    };
  }, [data, stage]);

  if (isLoading) {
    return (
      <Card variant="outlined" className="p-monday-4">
        <div className="flex items-center justify-center py-monday-8">
          <span className="animate-spin">⏳</span>
          <span className="ml-monday-2 text-monday-sm text-monday-text-secondary">加载中...</span>
        </div>
      </Card>
    );
  }

  /**
   * Handle photo click - open photo preview
   * 
   * @param attachment - Photo attachment that was clicked
   * @param allAttachments - All attachments for the interaction
   */
  const handlePhotoClick = (attachment: FileAttachment, allAttachments: FileAttachment[]) => {
    // Filter out only photo attachments
    const photos = allAttachments.filter(
      (a) => a.fileType === 'photo' || a.mimeType?.startsWith('image/'),
    );

    // Find the index of the current photo
    const index = photos.findIndex((a) => a.id === attachment.id);

    if (index !== -1) {
      // 转换为 Attachment 类型（PhotoPreview 需要的格式）
      const photoAttachmentsAsAttachment: Attachment[] = photos.map((p) => ({
        id: p.id,
        fileName: p.fileName,
        fileUrl: p.fileUrl,
        fileSize: p.fileSize,
        fileType: p.fileType,
        mimeType: p.mimeType,
        storageProvider: 'product-interaction', // 标识来源
        storageKey: p.id, // 使用 attachment id 作为 storageKey
        createdAt: new Date(), // 使用当前时间作为默认值
        createdBy: '', // 从 API 返回的数据可能没有这个字段
      }));

      setPhotoAttachments(photoAttachmentsAsAttachment);
      setSelectedPhotoIndex(index);
    }
  };

  /**
   * Handle photo next - navigate to next photo
   */
  const handlePhotoNext = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < photoAttachments.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  /**
   * Handle photo previous - navigate to previous photo
   */
  const handlePhotoPrevious = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  if (error) {
    return (
      <Card variant="outlined" className="p-monday-4">
        <div className="text-center py-monday-8">
          <p className="text-monday-sm text-primary-red mb-monday-2">
            {error instanceof Error ? error.message : GENERIC_ERRORS.LOAD_FAILED}
          </p>
          <Button size="sm" onClick={() => refetch()}>
            重试
          </Button>
        </div>
      </Card>
    );
  }

  // Use filtered data if stage filter is active, otherwise use original data
  const displayData = filteredData || data;

  if (!displayData || displayData.interactions.length === 0) {
    return (
      <Card variant="outlined" className="p-monday-4">
        <div className="text-center py-monday-8">
          <div className="text-monday-4xl mb-monday-4 opacity-50">📋</div>
          <p className="text-monday-base text-monday-text-secondary mb-monday-2">
            {stage
              ? PRODUCT_INTERACTION_ERRORS.NO_INTERACTIONS_IN_STAGE
              : PRODUCT_INTERACTION_ERRORS.NO_INTERACTIONS}
          </p>
          <Link to={`/interactions/create?productId=${productId}&customerId=${customerId}`}>
            <Button size="sm" variant="primary">
              记录新互动
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-monday-4">
      {/* Stage filter indicator */}
      {stage && (
        <Card variant="outlined" className="p-monday-3 bg-primary-blue/5">
          <div className="flex items-center justify-between">
            <p className="text-monday-sm text-monday-text">
              正在查看阶段过滤：<span className="font-semibold">{stage}</span>
            </p>
            <Link to={`/products/${productId}/interactions?customerId=${customerId}`}>
              <Button size="sm" variant="ghost" className="text-monday-xs">
                清除过滤
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* 排序选择器 */}
      <div className="flex items-center justify-between mb-monday-4">
        <span className="text-monday-sm text-monday-text-secondary">
          共 {data?.total || 0} 条互动记录
        </span>
        <div className="flex items-center gap-monday-2">
          <span className="text-monday-xs text-monday-text-secondary">排序：</span>
          <Button
            size="sm"
            variant={sortOrder === 'desc' ? 'primary' : 'ghost'}
            onClick={() => setSortOrder('desc')}
          >
            最新的在前
          </Button>
          <Button
            size="sm"
            variant={sortOrder === 'asc' ? 'primary' : 'ghost'}
            onClick={() => setSortOrder('asc')}
          >
            最旧的在前
          </Button>
        </div>
      </div>

      {/* 互动记录列表 */}
      {displayData.interactions.map((interaction) => (
        <InteractionCard
          key={interaction.id}
          interaction={interaction}
          onPhotoClick={handlePhotoClick}
          currentUserId={user?.id}
          onDelete={handleDeleteClick}
        />
      ))}

      {/* 分页 */}
      {!stage && data && data.total > limit && (
        <div className="flex items-center justify-between mt-monday-4 pt-monday-4 border-t border-gray-200">
          <span className="text-monday-sm text-monday-text-secondary">
            共 {data.total} 条互动记录
            {stage && `（已过滤：${displayData.total} 条）`}
          </span>
          <div className="flex gap-monday-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              上一页
            </Button>
            <span className="text-monday-sm text-monday-text-secondary flex items-center">
              第 {page} 页
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * limit >= data.total}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {selectedPhotoIndex !== null && photoAttachments.length > 0 && (
        <ErrorBoundary
          fallback={
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-monday-4">
              <Card variant="outlined" className="p-monday-4 max-w-md">
                <div className="text-center">
                  <p className="text-monday-sm text-primary-red mb-monday-4">
                    {PRODUCT_INTERACTION_ERRORS.LOAD_FAILED}
                  </p>
                  <Button
                    onClick={() => {
                      setSelectedPhotoIndex(null);
                      setPhotoAttachments([]);
                    }}
                    variant="primary"
                  >
                    关闭
                  </Button>
                </div>
              </Card>
            </div>
          }
        >
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
        </ErrorBoundary>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && deleteConfirm.interactionId && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-monday-4 z-50" 
          onClick={handleCancelDelete}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleCancelDelete();
            }
          }}
          role="presentation"
          tabIndex={-1}
        >
          <Card variant="elevated" className="max-w-md w-full" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
            <h3 id="delete-confirm-title" className="text-monday-xl font-semibold text-monday-text mb-monday-4">确认删除</h3>
            <p className="text-monday-base text-monday-text mb-monday-6">
              确定要删除这条互动记录吗？
            </p>
            <p className="text-monday-sm text-monday-text-secondary mb-monday-6">
              此操作将执行软删除，数据保留用于审计。
            </p>
            <div className="flex justify-end gap-monday-3">
              <Button onClick={handleCancelDelete} variant="outline">
                取消
              </Button>
              <Button 
                onClick={handleConfirmDelete} 
                variant="primary" 
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? '删除中...' : '确认删除'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

