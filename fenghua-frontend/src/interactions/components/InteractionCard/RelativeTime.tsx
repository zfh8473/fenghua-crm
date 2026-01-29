/**
 * RelativeTime Component
 * 
 * Displays relative time (e.g., "刚刚", "2小时前", "昨天")
 * Enhanced version with hour-level granularity
 * All custom code is proprietary and not open source.
 */

import React from 'react';

/**
 * Format date to relative time with hour-level granularity
 * Enhanced version based on CommentItem.tsx implementation
 */
const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - targetDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Handle future dates (data error case)
  if (diffMs < 0) {
    return '未来时间';
  }

  if (diffMins < 1) {
    return '刚刚';
  } else if (diffMins < 60) {
    return `${diffMins}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    // Format as date if older than 7 days
    return targetDate.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
};

interface RelativeTimeProps {
  date: Date | string;
  className?: string;
}

export const RelativeTime: React.FC<RelativeTimeProps> = ({ date, className = '' }) => {
  return (
    <span className={`text-monday-sm text-uipro-secondary ${className}`}>
      {formatRelativeTime(date)}
    </span>
  );
};
