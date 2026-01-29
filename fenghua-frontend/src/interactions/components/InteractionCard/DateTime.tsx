/**
 * DateTime Component
 * 
 * Displays full date and time
 * All custom code is proprietary and not open source.
 */

import React from 'react';

interface DateTimeProps {
  date: Date | string;
  className?: string;
}

/**
 * Format date and time for display
 */
const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const DateTime: React.FC<DateTimeProps> = ({ date, className = '' }) => {
  return (
    <span className={`text-monday-sm text-uipro-text ${className}`}>
      {formatDateTime(date)}
    </span>
  );
};
