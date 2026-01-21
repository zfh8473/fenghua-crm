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
/** 19.3 main-business：状态徽章 uipro-* / semantic-* */
const getStatusBadgeColor = (status?: string): string => {
  if (!status) return 'bg-uipro-secondary/15 text-uipro-secondary';
  const colorMap: Record<string, string> = {
    in_progress: 'bg-uipro-cta/15 text-uipro-cta',
    completed: 'bg-semantic-success/15 text-semantic-success',
    cancelled: 'bg-semantic-error/15 text-semantic-error',
    needs_follow_up: 'bg-semantic-warning/15 text-semantic-warning',
  };
  return colorMap[status] || 'bg-uipro-secondary/15 text-uipro-secondary';
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

  /** 19.3 main-business：加载 skeleton，空态无 emoji */
  if (loading) {
    return (
      <Card variant="default" className="p-monday-8">
        <div className="space-y-monday-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-monday-4 rounded-monday-lg border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-monday-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (interactions.length === 0) {
    return (
      <Card variant="default" className="p-monday-8">
        <div className="text-center py-monday-12">
          <h3 className="text-monday-xl font-semibold text-uipro-text mb-monday-2">未找到匹配的互动记录</h3>
          <p className="text-uipro-secondary">请尝试调整搜索条件或筛选器</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-monday-4">
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-monday-sm text-uipro-secondary">
          找到 <span className="font-semibold text-uipro-text">{total}</span> 条互动记录
        </p>
      </div>

      {/* Results List */}
      <div className="space-y-monday-3">
        {interactions.map((interaction) => (
          <Card
            key={interaction.id}
            variant="default"
            className="p-monday-4 hover:shadow-monday-md transition-all duration-200 cursor-pointer"
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
                    className="text-uipro-cta hover:underline cursor-pointer transition-colors duration-200"
                  >
                    查看客户
                  </Link>
                  <Link
                    to={`/products/${interaction.productId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-uipro-cta hover:underline cursor-pointer transition-colors duration-200"
                  >
                    查看产品
                  </Link>
                  <Link
                    to={`/interactions/${interaction.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-uipro-cta hover:underline cursor-pointer transition-colors duration-200"
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
            className="cursor-pointer transition-colors duration-200"
          >
            上一页
          </Button>
          <span className="text-monday-sm text-uipro-secondary">
            第 {currentPage} 页，共 {totalPages} 页
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="cursor-pointer transition-colors duration-200"
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
};

