/**
 * Customer Product Interaction History Component
 * 
 * Displays customer-product interaction history with role-based filtering
 * All custom code is proprietary and not open source.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface CustomerProductInteractionHistoryProps {
  customerId: string;
  productId: string;
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
  const buyerTypes = ['initial_contact', 'product_inquiry', 'quotation', 'quotation_accepted', 'quotation_rejected', 'order_signed', 'order_completed'];
  const supplierTypes = ['product_inquiry_supplier', 'quotation_received', 'specification_confirmed', 'production_progress', 'pre_shipment_inspection', 'shipped'];
  if (buyerTypes.includes(type)) return 'bg-primary-blue/10 text-primary-blue';
  if (supplierTypes.includes(type)) return 'bg-primary-purple/10 text-primary-purple';
  return 'bg-gray-100 text-monday-text-secondary';
};

/**
 * InteractionCard Sub-component
 */
const InteractionCard: React.FC<{ interaction: Interaction }> = ({ interaction }) => {
  const handleAttachmentClick = (attachment: FileAttachment) => {
    // Use safe link creation to prevent tabnabbing attacks
    const link = document.createElement('a');
    link.href = attachment.fileUrl;
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
        <span className="text-monday-xs text-monday-text-secondary">
          {new Date(interaction.interactionDate).toLocaleString('zh-CN')}
        </span>
      </div>

      {interaction.description && (
        <p className="text-monday-sm text-monday-text mb-monday-3">{interaction.description}</p>
      )}

      {/* 附件列表 */}
      {interaction.attachments && interaction.attachments.length > 0 && (
        <div className="mt-monday-3 pt-monday-3 border-t border-gray-200">
          <div className="text-monday-xs text-monday-text-secondary mb-monday-2">附件：</div>
          <div className="flex flex-wrap gap-monday-2">
            {interaction.attachments.map((attachment) => (
              <button
                key={attachment.id}
                onClick={() => handleAttachmentClick(attachment)}
                className="flex items-center gap-monday-1 px-monday-2 py-monday-1 rounded-monday-md bg-gray-50 hover:bg-gray-100 text-monday-xs text-monday-text-secondary hover:text-monday-text transition-colors"
              >
                <span>📎</span>
                <span>{attachment.fileName}</span>
                <span className="text-monday-xs opacity-60">
                  ({(attachment.fileSize / 1024).toFixed(1)} KB)
                </span>
              </button>
            ))}
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
    </Card>
  );
};

/**
 * Main Component
 */
export const CustomerProductInteractionHistory: React.FC<CustomerProductInteractionHistoryProps> = ({
  customerId,
  productId,
}) => {
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  const limit = 20;

  // 使用 React Query 获取互动历史
  const { data, isLoading, error, refetch } = useQuery<{
    interactions: Interaction[];
    total: number;
  }>({
    queryKey: ['customer-interactions', customerId, productId, page, limit],
    queryFn: async () => {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_BACKEND_URL ||
        'http://localhost:3006';
      const response = await fetch(
        `${apiBaseUrl}/api/customers/${customerId}/interactions?productId=${productId}&page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('您没有权限查看互动历史');
        }
        if (response.status === 404) {
          throw new Error('客户或产品不存在');
        }
        throw new Error('获取互动历史失败');
      }
      const result = await response.json();
      // Backend returns Date objects which are serialized to ISO strings in JSON
      return result;
    },
    enabled: !!customerId && !!productId && !!token,
    staleTime: 5 * 60 * 1000, // 5 分钟缓存
  });

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
          <p className="text-monday-sm text-primary-red mb-monday-2">
            {error instanceof Error ? error.message : '加载失败'}
          </p>
          <Button size="sm" onClick={() => refetch()}>
            重试
          </Button>
        </div>
      </Card>
    );
  }

  if (!data || data.interactions.length === 0) {
    return (
      <Card variant="outlined" className="p-monday-4">
        <div className="text-center py-monday-8">
          <div className="text-monday-4xl mb-monday-4 opacity-50">📋</div>
          <p className="text-monday-base text-monday-text-secondary mb-monday-2">
            该客户与该产品尚未有任何互动记录
          </p>
          <Link to={`/interactions/create?customerId=${customerId}&productId=${productId}`}>
            <Button size="sm" variant="secondary">
              记录新互动
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-monday-4">
      {/* 互动记录列表 */}
      {data.interactions.map((interaction) => (
        <InteractionCard key={interaction.id} interaction={interaction} />
      ))}

      {/* 分页 */}
      {data.total > limit && (
        <div className="flex items-center justify-between pt-monday-4 border-t border-gray-200">
          <span className="text-monday-sm text-monday-text-secondary">
            共 {data.total} 条记录，第 {page} 页，共 {Math.ceil(data.total / limit)} 页
          </span>
          <div className="flex gap-monday-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              上一页
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage((p) => Math.min(Math.ceil(data.total / limit), p + 1))}
              disabled={page >= Math.ceil(data.total / limit)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

