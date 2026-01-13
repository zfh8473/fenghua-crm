/**
 * Trend Summary Component
 * 
 * Displays trend summary statistics including growth rates and totals
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { TrendSummary } from '../services/business-trend-analysis.service';
import { Card } from '../../components/ui/Card';

interface TrendSummaryProps {
  summary: TrendSummary;
  loading?: boolean;
}

export const TrendSummaryComponent: React.FC<TrendSummaryProps> = ({
  summary,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-monday-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} variant="default" className="p-monday-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toLocaleString('zh-CN');
  };

  const formatCurrency = (num: number): string => {
    if (num >= 1000000) {
      return `¥${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `¥${(num / 1000).toFixed(2)}K`;
    }
    return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getGrowthRateColor = (rate: number): string => {
    if (rate > 0) {
      return 'text-green-600';
    }
    if (rate < 0) {
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-monday-4">
      <Card variant="default" className="p-monday-4">
        <h3 className="text-monday-sm font-medium text-monday-text-secondary mb-monday-2">
          总订单量
        </h3>
        <p className="text-monday-2xl font-semibold text-monday-text">
          {formatNumber(summary.totalOrderCount)}
        </p>
      </Card>

      <Card variant="default" className="p-monday-4">
        <h3 className="text-monday-sm font-medium text-monday-text-secondary mb-monday-2">
          新增客户数
        </h3>
        <p className="text-monday-2xl font-semibold text-monday-text">
          {formatNumber(summary.totalCustomerGrowth)}
        </p>
      </Card>

      <Card variant="default" className="p-monday-4">
        <h3 className="text-monday-sm font-medium text-monday-text-secondary mb-monday-2">
          总销售额
        </h3>
        <p className="text-monday-2xl font-semibold text-monday-text">
          {formatCurrency(summary.totalSalesAmount)}
        </p>
      </Card>

      <Card variant="default" className="p-monday-4">
        <h3 className="text-monday-sm font-medium text-monday-text-secondary mb-monday-2">
          平均增长率
        </h3>
        <p className={`text-monday-2xl font-semibold ${getGrowthRateColor(summary.averageGrowthRate)}`}>
          {summary.averageGrowthRate >= 0 ? '+' : ''}{summary.averageGrowthRate.toFixed(2)}%
        </p>
      </Card>
    </div>
  );
};

