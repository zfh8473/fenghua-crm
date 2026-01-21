/**
 * Metric Card Component
 * 
 * Displays a single metric with optional trend indicator
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { Card } from '../../components/ui/Card';

export interface MetricCardProps {
  /**
   * Metric title
   */
  title: string;
  
  /**
   * Metric value
   */
  value: number | string;
  
  /**
   * Optional trend indicator (e.g., "+10%", "-5%")
   */
  trend?: string;
  
  /**
   * Optional icon or visual element
   */
  icon?: React.ReactNode;
  
  /**
   * Optional click handler
   */
  onClick?: () => void;
  
  /**
   * Optional link to detailed view
   */
  href?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  icon,
  onClick,
  href,
}) => {
  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString('zh-CN')
    : value;

  const content = (
    <div className={`flex items-center justify-between transition-colors duration-200 ${onClick || href ? 'cursor-pointer' : ''}`}>
      <div className="flex-1">
        <p className="text-monday-sm text-uipro-secondary mb-monday-2">{title}</p>
        <div className="flex items-baseline gap-monday-2">
          <p className="text-monday-2xl font-semibold text-uipro-text">{formattedValue}</p>
          {trend && (
            <span className={`text-monday-sm ${
              trend.startsWith('+') ? 'text-semantic-success' :
              trend.startsWith('-') ? 'text-semantic-error' :
              'text-uipro-secondary'
            }`}>
              {trend}
            </span>
          )}
        </div>
      </div>
      {icon && (
        <div className="ml-monday-4 text-uipro-secondary">
          {icon}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Card variant="default" hoverable className="h-full">
        <a href={href} className="block cursor-pointer">
          {content}
        </a>
      </Card>
    );
  }

  return (
    <Card 
      variant="default" 
      hoverable={!!onClick}
      onClick={onClick}
      className="h-full"
    >
      {content}
    </Card>
  );
};

