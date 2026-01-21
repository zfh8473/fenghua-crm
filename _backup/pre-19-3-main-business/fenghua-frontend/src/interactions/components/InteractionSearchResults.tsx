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
 * Get status badge color
 */
const getStatusBadgeColor = (status?: string): string => {
  if (!status) return 'bg-gray-100 text-gray-600';
  const colorMap: Record<string, string> = {
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    needs_follow_up: 'bg-yellow-100 text-yellow-700',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-600';
};

export const InteractionSearchResults: React.FC<InteractionSearchResultsProps> = ({
  interactions,
  total,
  currentPage,
  pageSize,
  onPageChange,
  onInteractionClick,
  loading = false,
}) => {
  const totalPages = Math.ceil(total / pageSize);

  const handleInteractionClick = (interaction: Interaction) => {
    if (onInteractionClick) {
      onInteractionClick(interaction);
    }
  };

  if (loading) {
    return (
      <Card variant="default" className="p-monday-8">
        <div className="text-center py-monday-12">
          <span className="animate-spin text-2xl mb-monday-4 block">⏳</span>
          <p className="text-monday-text-secondary">正在加载搜索结果...</p>
        </div>
      </Card>
    );
  }

  if (interactions.length === 0) {
    return (
      <Card variant="default" className="p-monday-8">
        <div className="text-center py-monday-12">
          <span className="text-5xl mb-monday-4 block">🔍</span>
          <h3 className="text-monday-xl font-semibold mb-monday-2">未找到匹配的互动记录</h3>
          <p className="text-monday-text-secondary">
            请尝试调整搜索条件或筛选器
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-monday-4">
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-monday-sm text-monday-text-secondary">
          找到 <span className="font-semibold text-monday-text">{total}</span> 条互动记录
        </p>
      </div>

      {/* Results List */}
      <div className="space-y-monday-3">
        {interactions.map((interaction) => (
          <Card
            key={interaction.id}
            variant="default"
            className="p-monday-4 hover:shadow-monday-md transition-shadow cursor-pointer"
            onClick={() => handleInteractionClick(interaction)}
          >
            <div className="flex items-start justify-between gap-monday-4">
              <div className="flex-1 space-y-monday-2">
                <div className="flex items-center gap-monday-3">
                  <span className="text-monday-lg font-semibold text-monday-text">
                    {getInteractionTypeLabel(interaction.interactionType)}
                  </span>
                  {interaction.status && (
                    <span
                      className={`inline-flex items-center px-monday-2 py-monday-1 rounded-monday-sm text-monday-xs font-medium ${getStatusBadgeColor(
                        interaction.status
                      )}`}
                    >
                      {getStatusLabel(interaction.status)}
                    </span>
                  )}
                </div>
                <div className="text-monday-sm text-monday-text-secondary">
                  <span>时间：{formatDate(interaction.interactionDate)}</span>
                </div>
                {interaction.description && (
                  <p className="text-monday-sm text-monday-text line-clamp-2">
                    {interaction.description}
                  </p>
                )}
                <div className="flex items-center gap-monday-4 text-monday-xs text-monday-text-secondary">
                  <Link
                    to={`/customers/${interaction.customerId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-primary-blue"
                  >
                    查看客户
                  </Link>
                  <Link
                    to={`/products/${interaction.productId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-primary-blue"
                  >
                    查看产品
                  </Link>
                  <Link
                    to={`/interactions/${interaction.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-primary-blue"
                  >
                    查看详情
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-monday-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            上一页
          </Button>
          <span className="text-monday-sm text-monday-text-secondary">
            第 {currentPage} 页，共 {totalPages} 页
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
};

