/**
 * Customer Timeline Component
 * 
 * Displays customer timeline (all interactions for a customer) with role-based filtering
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  isFrontendSpecialist,
  isBackendSpecialist,
  isDirector,
  isAdmin,
} from '../../common/constants/roles';
import { PhotoPreview } from '../../attachments/components/PhotoPreview';
import { Attachment } from '../../attachments/services/attachments.service';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { HomeModuleIcon } from '../../components/icons/HomeModuleIcons';
import { TIMELINE_ERRORS, CUSTOMER_ERRORS, PHOTO_PREVIEW_ERRORS, GENERIC_ERRORS, INTERACTION_EDIT_ERRORS } from '../../common/constants/error-messages';
import { interactionsService } from '../../interactions/services/interactions.service';
import { toast } from 'react-toastify';

interface CustomerTimelineProps {
  customerId: string;
}

interface FileAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  mimeType?: string;
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
  creatorEmail?: string;
  creatorFirstName?: string;
  creatorLastName?: string;
  productId?: string;
  productName?: string;
  productHsCode?: string;
  attachments: FileAttachment[];
}

// 互动类型中文标签映射（必须与 Story 3.5 完全一致）
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

/**
 * Get interaction type color class based on interaction type
 * 
 * @param type - Interaction type string
 * @returns Tailwind CSS class string for background and text color
 */
const getInteractionTypeColor = (type: string): string => {
  const buyerTypes = [
    'initial_contact',
    'product_inquiry',
    'quotation',
    'quotation_accepted',
    'quotation_rejected',
    'order_signed',
    'order_completed',
  ];
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
 * Get file type icon based on attachment type
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
 * Format file size to human-readable string
 * 
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Timeline Interaction Card Component
 * 
 * Displays a single interaction in the timeline with click-to-view-details functionality
 * 
 * @param interaction - Interaction data to display
 * @param isLast - Whether this is the last interaction in the timeline
 * @param onCardClick - Callback when card is clicked to show detail modal
 * @param onPhotoClick - Callback when photo attachment is clicked to show photo preview
 */
const TimelineInteractionCard: React.FC<{
  interaction: Interaction;
  isLast: boolean;
  onCardClick: (interaction: Interaction) => void;
  onPhotoClick: (attachment: FileAttachment, allAttachments: FileAttachment[]) => void;
  currentUserId?: string;
  onDelete?: (interactionId: string) => void;
}> = ({ interaction, isLast, onCardClick, onPhotoClick, currentUserId, onDelete }) => {
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
    <div className="flex items-start gap-monday-4">
      {/* Timeline line and dot */}
      <div className="flex flex-col items-center">
        <div
          className={`w-monday-10 h-monday-10 rounded-full flex items-center justify-center text-monday-xs font-semibold ${getInteractionTypeColor(
            interaction.interactionType,
          )}`}
        >
          <span>●</span>
        </div>
        {!isLast && (
          <div className="w-0.5 h-full min-h-monday-8 bg-gray-300 mt-monday-2" />
        )}
      </div>

      {/* Interaction card */}
      <div className="flex-1 pb-monday-6">
        <Card
          variant="outlined"
          className="p-monday-4 cursor-pointer hover:shadow-monday-sm transition-shadow"
          onClick={() => onCardClick(interaction)}
          role="button"
          aria-label={`查看互动详情：${INTERACTION_TYPE_LABELS[interaction.interactionType] || interaction.interactionType}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onCardClick(interaction);
            }
          }}
        >
          <div className="flex items-start justify-between mb-monday-3">
            <div className="flex items-center gap-monday-2">
              <span
                className={`px-monday-2 py-monday-0.5 rounded-full text-monday-xs font-semibold ${getInteractionTypeColor(
                  interaction.interactionType,
                )}`}
              >
                {INTERACTION_TYPE_LABELS[interaction.interactionType] ||
                  interaction.interactionType}
              </span>
              {interaction.status && (
                <span className="text-monday-xs text-monday-text-secondary">
                  {interaction.status}
                </span>
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

          {/* Product information */}
          {interaction.productName && (
            <div className="mb-monday-3">
              <Link
                to={`/products?productId=${interaction.productId}`}
                className="text-monday-sm font-semibold text-primary-blue hover:underline"
              >
                {interaction.productName}
              </Link>
              {interaction.productHsCode && (
                <span className="text-monday-xs text-monday-text-secondary ml-monday-2 font-mono">
                  HS Code: {interaction.productHsCode}
                </span>
              )}
            </div>
          )}

          {interaction.description && (
            <p className="text-monday-sm text-monday-text mb-monday-3">
              {interaction.description}
            </p>
          )}

          {/* 附件列表 */}
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
                        onClick={(e) => {
                          e.stopPropagation(); // 防止触发卡片点击
                          onPhotoClick(attachment, interaction.attachments);
                        }}
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
                          e.stopPropagation(); // 防止触发卡片点击
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
          {interaction.creatorFirstName && (
            <div className="mt-monday-3 pt-monday-3 border-t border-gray-200">
              <span className="text-monday-xs text-monday-text-secondary">
                创建者：{interaction.creatorFirstName} {interaction.creatorLastName} (
                {interaction.creatorEmail})
              </span>
            </div>
          )}

          {/* 编辑和删除按钮（只在当前用户是创建者时显示） */}
          {interaction.createdBy && currentUserId && interaction.createdBy === currentUserId && (
            <div className="mt-monday-3 pt-monday-3 border-t border-gray-200 flex gap-monday-2">
              <Link
                to={`/interactions/${interaction.id}/edit`}
                onClick={(e) => e.stopPropagation()}
                className="flex-1"
              >
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full"
                >
                  编辑
                </Button>
              </Link>
              {onDelete && (
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(interaction.id);
                  }}
                  className="flex-1"
                >
                  删除
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

/**
 * Main Component
 * 
 * Customer Timeline component that displays all interactions for a customer in timeline format
 * Supports role-based filtering, sorting, date range filtering, and pagination
 * 
 * @param customerId - UUID of the customer to display timeline for
 */
export const CustomerTimeline: React.FC<CustomerTimelineProps> = ({ customerId }) => {
  // Validate customerId format (UUID)
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId);
  
  if (!isValidUUID) {
    return (
      <Card variant="outlined" className="p-monday-4">
        <div className="text-center py-monday-8">
          <p className="text-monday-sm text-primary-red">{CUSTOMER_ERRORS.INVALID_ID}</p>
        </div>
      </Card>
    );
  }

  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year' | 'all'>('all');
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  // 照片预览状态
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
      // 刷新时间线数据
      queryClient.invalidateQueries({ queryKey: ['customer-timeline', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customer-interactions'] });
      queryClient.invalidateQueries({ queryKey: ['product-interactions'] });
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

  // Determine title based on role
  let title = '客户时间线';
  if (user) {
    if (isFrontendSpecialist(user.role)) {
      title = '采购商时间线';
    } else if (isBackendSpecialist(user.role)) {
      title = '供应商时间线';
    } else if (isDirector(user.role) || isAdmin(user.role)) {
      title = '客户时间线';
    }
  }

  /**
   * Handle interaction card click - show detail modal
   * 
   * @param interaction - Interaction to show details for
   */
  const handleCardClick = (interaction: Interaction) => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    setSelectedInteraction(interaction);
    setShowDetailModal(true);
  };

  /**
   * Handle modal close - restore focus
   */
  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedInteraction(null);
    // Restore focus to previous element
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  };

  /**
   * Handle photo click - open photo preview
   * 
   * @param attachment - Photo attachment that was clicked
   * @param allAttachments - All attachments for the interaction
   */
  const handlePhotoClick = (attachment: FileAttachment, allAttachments: FileAttachment[]) => {
    // 筛选出所有照片附件
    const photos = allAttachments.filter(
      (a) => a.fileType === 'photo' || a.mimeType?.startsWith('image/'),
    );

    // 找到当前照片的索引
    const index = photos.findIndex((a) => a.id === attachment.id);

    if (index !== -1) {
      // 转换为 Attachment 类型（PhotoPreview 需要的格式）
      // 注意：PhotoPreview 组件只需要 id, fileName, fileUrl, fileSize, fileType, mimeType
      // storageProvider, storageKey, createdAt, createdBy 是 Attachment 接口的必需字段，
      // 但 PhotoPreview 实际上不使用这些字段，所以使用合理的默认值
      const photoAttachmentsAsAttachment: Attachment[] = photos.map((p) => ({
        id: p.id,
        fileName: p.fileName,
        fileUrl: p.fileUrl,
        fileSize: p.fileSize,
        fileType: p.fileType,
        mimeType: p.mimeType,
        // 这些字段在 PhotoPreview 中不使用，但为了满足 Attachment 接口要求，使用默认值
        storageProvider: 'timeline', // 标识来源为 timeline API
        storageKey: p.id, // 使用 attachment id 作为 storageKey
        createdAt: new Date(), // 使用当前时间作为默认值
        createdBy: '', // 从 timeline API 返回的数据可能没有这个字段
      }));

      setPhotoAttachments(photoAttachmentsAsAttachment);
      setSelectedPhotoIndex(index);
    }
  };

  /**
   * Handle photo preview navigation - next photo
   */
  const handlePhotoNext = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < photoAttachments.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  /**
   * Handle photo preview navigation - previous photo
   */
  const handlePhotoPrevious = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  /**
   * Handle create interaction button click
   */
  const handleCreateInteraction = () => {
    navigate('/interactions/create', {
      state: {
        customerId: customerId,
      },
    });
  };

  // Handle ESC key to close modal and focus trap
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showDetailModal) {
        handleCloseModal();
        return;
      }

      // Focus trap: prevent tabbing outside modal
      if (showDetailModal && event.key === 'Tab') {
        const modal = modalRef.current;
        if (!modal) return;

        const focusableElements = modal.querySelectorAll<HTMLElement>(
          'button:not([tabindex="-1"]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement || document.activeElement === modal) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    if (showDetailModal) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus close button when modal opens
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 0);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDetailModal]);

  const { data, isLoading, error, refetch } = useQuery<{
    interactions: Interaction[];
    total: number;
  }>({
    queryKey: ['customer-timeline', customerId, page, limit, sortOrder, dateRange],
    queryFn: async () => {
      // Use relative path /api to leverage Vite proxy in development
      // In production, set VITE_API_BASE_URL to the full backend URL
      const apiBaseUrl = (import.meta.env?.VITE_API_BASE_URL as string) || 
                        (import.meta.env?.VITE_BACKEND_URL as string) || 
                        '/api';
      const response = await fetch(
        `${apiBaseUrl}/customers/${customerId}/timeline?page=${page}&limit=${limit}&sortOrder=${sortOrder}&dateRange=${dateRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(TIMELINE_ERRORS.NO_PERMISSION);
        }
        if (response.status === 404) {
          throw new Error(TIMELINE_ERRORS.NOT_FOUND);
        }
        throw new Error(TIMELINE_ERRORS.LOAD_FAILED);
      }
      return response.json();
    },
    enabled: !!customerId && !!token,
    staleTime: 5 * 60 * 1000, // 5 分钟缓存
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

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

  if (error) {
    return (
      <Card variant="outlined" className="p-monday-4">
        <div className="text-center py-monday-8">
          <p className="text-monday-sm text-primary-red mb-monday-4">
            {error instanceof Error ? error.message : GENERIC_ERRORS.LOAD_FAILED}
          </p>
          <div className="flex gap-monday-2 justify-center">
            <Button size="sm" onClick={() => refetch()} variant="secondary">
              重试
            </Button>
            <Button onClick={handleCreateInteraction} variant="primary">
              记录新互动
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!data || data.interactions.length === 0) {
    return (
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
    );
  }

  return (
    <>
      <div className="space-y-monday-4">
        {/* Filters and controls */}
        <Card variant="outlined" className="p-monday-4">
          <h4 className="text-monday-base font-semibold text-monday-text mb-monday-3">{title}</h4>
          <div className="flex flex-wrap items-center gap-monday-4">
          <div className="flex items-center gap-monday-2">
            <label className="text-monday-sm text-monday-text-secondary">排序：</label>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as 'asc' | 'desc');
                setPage(1); // Reset to first page when changing sort
              }}
              className="px-monday-2 py-monday-1 border border-gray-300 rounded-monday-md text-monday-sm"
            >
              <option value="desc">最新的在前</option>
              <option value="asc">最旧的在前</option>
            </select>
          </div>
          <div className="flex items-center gap-monday-2">
            <label className="text-monday-sm text-monday-text-secondary">时间范围：</label>
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value as 'week' | 'month' | 'year' | 'all');
                setPage(1); // Reset to first page when changing date range
              }}
              className="px-monday-2 py-monday-1 border border-gray-300 rounded-monday-md text-monday-sm"
            >
              <option value="all">全部</option>
              <option value="week">最近一周</option>
              <option value="month">最近一月</option>
              <option value="year">最近一年</option>
            </select>
          </div>
          <div className="text-monday-sm text-monday-text-secondary">
            共 {data.total} 条记录
          </div>
        </div>
      </Card>

        {/* Timeline */}
        <div className="space-y-0">
          {data.interactions.map((interaction, index) => (
            <TimelineInteractionCard
              key={interaction.id}
              interaction={interaction}
              isLast={index === data.interactions.length - 1}
              onCardClick={handleCardClick}
              onPhotoClick={handlePhotoClick}
              currentUserId={user?.id}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-monday-4">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
            >
              上一页
            </Button>
            <span className="text-monday-sm text-monday-text-secondary">
              第 {page} / {totalPages} 页
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
            >
              下一页
            </Button>
          </div>
        )}
      </div>

      {/* Interaction Detail Modal */}
      {showDetailModal && selectedInteraction && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-monday-4"
          role="presentation"
        >
          {/* Clickable overlay to close modal */}
          <button
            type="button"
            onClick={handleCloseModal}
            className="absolute inset-0 w-full h-full cursor-default"
            aria-label="关闭详情"
            tabIndex={-1}
          />
          <div
            ref={modalRef}
            className="relative max-w-2xl max-h-[90vh] w-full bg-monday-surface rounded-monday-lg shadow-monday-lg overflow-y-auto z-10"
            role="dialog"
            aria-modal="true"
            aria-label="互动详情"
          >
            {/* Close Button */}
            <button
              ref={closeButtonRef}
              onClick={handleCloseModal}
              className="absolute top-monday-4 right-monday-4 z-10 p-monday-2 bg-black/50 hover:bg-black/70 border border-white/30 rounded text-white transition-colors"
              aria-label="关闭详情"
              tabIndex={0}
            >
              <HomeModuleIcon name="xMark" className="w-5 h-5 text-white" />
            </button>

            {/* Modal Content */}
            <div className="p-monday-6">
              <h3 className="text-monday-xl font-bold text-monday-text mb-monday-4">
                互动详情
              </h3>

              <div className="space-y-monday-4">
                {/* Interaction Type and Status */}
                <div className="flex items-center gap-monday-2">
                  <span
                    className={`px-monday-3 py-monday-1 rounded-full text-monday-sm font-semibold ${getInteractionTypeColor(
                      selectedInteraction.interactionType,
                    )}`}
                  >
                    {INTERACTION_TYPE_LABELS[selectedInteraction.interactionType] ||
                      selectedInteraction.interactionType}
                  </span>
                  {selectedInteraction.status && (
                    <span className="text-monday-sm text-monday-text-secondary">
                      {selectedInteraction.status}
                    </span>
                  )}
                </div>

                {/* Interaction Date */}
                <div>
                  <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider mb-monday-1">
                    互动时间
                  </div>
                  <p className="text-monday-base text-monday-text">
                    {new Date(selectedInteraction.interactionDate).toLocaleString('zh-CN')}
                  </p>
                </div>

                {/* Product Information */}
                {selectedInteraction.productName && (
                  <div>
                    <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider mb-monday-1">
                      关联产品
                    </div>
                    <div className="flex items-center gap-monday-2">
                      <Link
                        to={`/products?productId=${selectedInteraction.productId}`}
                        className="text-monday-base font-semibold text-primary-blue hover:underline"
                      >
                        {selectedInteraction.productName}
                      </Link>
                      {selectedInteraction.productHsCode && (
                        <span className="text-monday-sm text-monday-text-secondary font-mono">
                          HS Code: {selectedInteraction.productHsCode}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedInteraction.description && (
                  <div>
                    <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider mb-monday-1">
                      描述
                    </div>
                    <p className="text-monday-base text-monday-text whitespace-pre-wrap">
                      {selectedInteraction.description}
                    </p>
                  </div>
                )}

                {/* Additional Info */}
                {selectedInteraction.additionalInfo &&
                  Object.keys(selectedInteraction.additionalInfo).length > 0 && (
                    <div>
                      <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider mb-monday-1">
                        附加信息
                      </div>
                      <pre className="text-monday-sm text-monday-text bg-gray-50 p-monday-2 rounded-monday-md overflow-x-auto">
                        {JSON.stringify(selectedInteraction.additionalInfo, null, 2)}
                      </pre>
                    </div>
                  )}

                {/* Attachments */}
                {selectedInteraction.attachments &&
                  selectedInteraction.attachments.length > 0 && (
                    <div>
                      <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider mb-monday-2">
                        附件 ({selectedInteraction.attachments.length})
                      </div>
                      <div className="flex flex-wrap gap-monday-2">
                        {selectedInteraction.attachments.map((attachment) => {
                          const isPhoto =
                            attachment.fileType === 'photo' ||
                            attachment.mimeType?.startsWith('image/');

                          if (isPhoto) {
                            // 照片附件：显示缩略图
                            return (
                              <button
                                key={attachment.id}
                                onClick={() =>
                                  handlePhotoClick(attachment, selectedInteraction.attachments)
                                }
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
                                className="flex items-center gap-monday-2 px-monday-3 py-monday-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                              >
                                <span className="text-lg">{getFileIcon(attachment)}</span>
                                <div className="flex flex-col">
                                  <span className="text-monday-xs font-medium">
                                    {attachment.fileName}
                                  </span>
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

                {/* Creator Information */}
                {selectedInteraction.creatorFirstName && (
                  <div>
                    <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider mb-monday-1">
                      创建者
                    </div>
                    <p className="text-monday-base text-monday-text">
                      {selectedInteraction.creatorFirstName} {selectedInteraction.creatorLastName} (
                      {selectedInteraction.creatorEmail})
                    </p>
                  </div>
                )}

                {/* Created At */}
                <div>
                  <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider mb-monday-1">
                    创建时间
                  </div>
                  <p className="text-monday-base text-monday-text">
                    {new Date(selectedInteraction.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
            </div>
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
                    {PHOTO_PREVIEW_ERRORS.LOAD_FAILED}
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
          onError={(error) => {
            console.error('PhotoPreview error:', error);
          }}
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
    </>
  );
};

