/**
 * Interaction Search Results Component
 * 
 * Displays search results for interaction records
 * All custom code is proprietary and not open source.
 */

import { Interaction } from '../services/interactions.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getInteractionTypeLabel } from '../constants/interaction-types';
import { Link } from 'react-router-dom';

interface InteractionSearchResultsProps {
  interactions: Interaction[];
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onInteractionClick?: (interaction: Interaction) => void;
  loading?: boolean;
}

/**
 * Format date for display
 */
const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Get status label in Chinese
 */
const getStatusLabel = (status?: string): string => {
  if (!status) return '未知';
  const statusMap: Record<string, string> = {
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
    needs_follow_up: '需要跟进',
  };
  return statusMap[status] || status;
};

/**
 * Get status color class
 */
const getStatusColor = (status?: string): string => {
  if (!status) return 'bg-gray-100 text-gray-800 border border-gray-200';
  const colorMap: Record<string, string> = {
    in_progress: 'bg-blue-100 text-blue-800 border border-blue-200',
    completed: 'bg-green-100 text-green-800 border border-green-200',
    cancelled: 'bg-gray-100 text-gray-800 border border-gray-200',
    needs_follow_up: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
};

/**
 * Get interaction type color class
 * Based on Story 19.3: Use uipro-* / semantic-* colors, avoid purple/pink
 */
const getInteractionTypeColor = (type: string): string => {
  const buyerTypes = [
    'initial_contact', 'product_inquiry', 'quotation', 'quotation_accepted', 'quotation_rejected',
    'order_signed', 'order_follow_up', 'order_completed',
  ];
  const supplierTypes = [
    'product_inquiry_supplier', 'quotation_received', 'specification_confirmed',
    'production_progress', 'pre_shipment_inspection', 'shipped',
  ];
  if (buyerTypes.includes(type)) return 'bg-uipro-cta/15 text-uipro-cta border border-uipro-cta/25';
  if (supplierTypes.includes(type)) return 'bg-uipro-secondary/15 text-uipro-secondary border border-uipro-secondary/25';
  return 'bg-uipro-secondary/15 text-uipro-secondary border border-gray-200';
};

export const InteractionSearchResults: React.FC<InteractionSearchResultsProps> = ({
  interactions,
  total,
  currentPage,
  pageSize,
  onPageChange,
  onInteractionClick,
  loading,
}) => {
  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-24 bg-gray-100 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (interactions.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">没有找到互动记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {interactions.map((interaction) => (
        <Card
          key={interaction.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onInteractionClick?.(interaction)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(interaction.status)}`}>
                  {getStatusLabel(interaction.status)}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getInteractionTypeColor(interaction.interactionType)}`}>
                  {getInteractionTypeLabel(interaction.interactionType)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDate(interaction.interactionDate)}
                </span>
              </div>
              
              <div className="mb-2">
                <span className="text-sm text-gray-500">客户：</span>
                <Link 
                  to={`/customers/${interaction.customerId}`}
                  className="text-sm font-medium text-blue-600 hover:underline ml-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {interaction.customerName || '未知客户'}
                </Link>
              </div>

              {/* Products Display: Tag Cloud + Collapse */}
              <div className="mb-2">
                <span className="text-sm text-gray-500">产品：</span>
                <div className="inline-flex flex-wrap gap-1 ml-1 align-middle">
                  {interaction.products && interaction.products.length > 0 ? (
                    <>
                      {interaction.products.slice(0, 5).map((product) => (
                        <Link
                          key={product.id}
                          to={`/products?productId=${product.id}`}
                          className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {product.name}
                        </Link>
                      ))}
                      {interaction.products.length > 5 && (
                        <span 
                          className="inline-block px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded cursor-help"
                          title={interaction.products.slice(5).map(p => p.name).join('\n')}
                        >
                          +{interaction.products.length - 5}
                        </span>
                      )}
                    </>
                  ) : (
                    // Fallback for legacy data or if products array is empty but productName exists
                    interaction.productName ? (
                      <span className="text-sm text-gray-900">{interaction.productName}</span>
                    ) : (
                      <span className="text-sm text-gray-400">无关联产品</span>
                    )
                  )}
                </div>
              </div>

              {interaction.personName && (
                <div className="mb-2">
                  <span className="text-sm text-gray-500">联系人：</span>
                  <span className="text-sm text-gray-900 ml-1">{interaction.personName}</span>
                </div>
              )}

              {interaction.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                  {interaction.description}
                </p>
              )}
            </div>
            
            <Button variant="ghost" size="sm">
              查看详情
            </Button>
          </div>
        </Card>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            上一页
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            第 {currentPage} 页 / 共 {totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
};
