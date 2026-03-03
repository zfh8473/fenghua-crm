/**
 * EmptyState Component (Interactions)
 *
 * Displays empty state when no interaction records found.
 * Uses the shared EmptyState component.
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { EmptyState as SharedEmptyState } from '../../components/ui/EmptyState';

interface EmptyStateProps {
  searchQuery?: string;
  onClearSearch?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  searchQuery,
  onClearSearch,
  className = '',
}) => {
  const description = searchQuery
    ? `没有找到与 "${searchQuery}" 匹配的互动记录`
    : '请尝试使用不同的搜索关键词或筛选条件';

  return (
    <SharedEmptyState
      icon="search"
      title="未找到匹配的互动记录"
      description={description}
      suggestions={[
        '检查拼写是否正确',
        '尝试使用更通用的关键词',
        '使用客户名称、产品名称或互动内容搜索',
        '尝试选择不同的筛选条件',
      ]}
      secondaryAction={
        onClearSearch && searchQuery
          ? { label: '清除搜索条件', onClick: onClearSearch }
          : undefined
      }
      primaryAction={{ label: '记录新互动', to: '/interactions/create' }}
      className={className}
    />
  );
};
