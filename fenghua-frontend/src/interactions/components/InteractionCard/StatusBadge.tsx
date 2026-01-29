/**
 * StatusBadge Component
 * 
 * Displays interaction status badge with color coding
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { InteractionStatus } from '../../services/interactions.service';

interface StatusBadgeProps {
  status?: InteractionStatus;
  className?: string;
}

/**
 * Get status label in Chinese
 */
const getStatusLabel = (status?: InteractionStatus): string => {
  if (!status) return '未知';
  const statusMap: Record<InteractionStatus, string> = {
    [InteractionStatus.IN_PROGRESS]: '进行中',
    [InteractionStatus.COMPLETED]: '已完成',
    [InteractionStatus.CANCELLED]: '已取消',
    [InteractionStatus.NEEDS_FOLLOW_UP]: '待跟进',
  };
  return statusMap[status] || status;
};

/**
 * Get color classes for status badge
 * Based on Story 20.9 color mapping
 */
const getStatusColorClasses = (status?: InteractionStatus): string => {
  if (!status) {
    return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
  
  switch (status) {
    case InteractionStatus.COMPLETED:
      return 'bg-semantic-success/15 text-semantic-success';
    case InteractionStatus.IN_PROGRESS:
      return 'bg-uipro-cta/15 text-uipro-cta';
    case InteractionStatus.NEEDS_FOLLOW_UP:
      return 'bg-semantic-warning/15 text-semantic-warning';
    case InteractionStatus.CANCELLED:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-monday-2 py-monday-1 rounded-monday-md text-monday-xs font-medium ${getStatusColorClasses(status)} ${className}`}
    >
      {getStatusLabel(status)}
    </span>
  );
};
