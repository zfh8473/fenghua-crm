/**
 * Business Trend Chart Component
 * 
 * Displays business trend analysis using Recharts with support for multiple metrics
 * All custom code is proprietary and not open source.
 */

import React, { Suspense, lazy, useMemo } from 'react';
import { BusinessTrendItem } from '../services/business-trend-analysis.service';

// Lazy load LineChart component for better performance
const LineChartComponent = lazy(() => 
  import('./LineChart').then(module => ({
    default: module.LineChartComponent,
  }))
);

interface BusinessTrendChartProps {
  data: BusinessTrendItem[];
  loading?: boolean;
  selectedMetrics?: ('orderCount' | 'customerGrowth' | 'salesAmount')[];
}

/**
 * Loading fallback for chart
 */
const ChartSkeleton: React.FC = () => (
  <div className="flex items-center justify-center h-[400px]">
    <div className="animate-pulse">
      <div className="h-64 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

export const BusinessTrendChart: React.FC<BusinessTrendChartProps> = ({
  data,
  loading = false,
  selectedMetrics = ['orderCount', 'customerGrowth', 'salesAmount'],
}) => {
  if (loading) {
    return <ChartSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full text-center text-monday-text-secondary py-monday-8">
        <p>暂无数据</p>
      </div>
    );
  }

  // Transform data for LineChart with selected metrics
  const chartData = useMemo(() => {
    return data.map((item) => {
      const chartItem: any = {
        name: item.period,
      };
      
      if (selectedMetrics.includes('orderCount')) {
        chartItem.orderCount = item.orderCount;
      }
      if (selectedMetrics.includes('customerGrowth')) {
        chartItem.customerGrowth = item.customerGrowth;
      }
      if (selectedMetrics.includes('salesAmount')) {
        // Format sales amount for display (divide by 1000 for readability)
        chartItem.salesAmount = item.salesAmount / 1000;
      }
      
      return chartItem;
    });
  }, [data, selectedMetrics]);

  // Determine data keys and colors based on selected metrics
  const dataKeys = useMemo(() => {
    const keys: string[] = [];
    if (selectedMetrics.includes('orderCount')) {
      keys.push('orderCount');
    }
    if (selectedMetrics.includes('customerGrowth')) {
      keys.push('customerGrowth');
    }
    if (selectedMetrics.includes('salesAmount')) {
      keys.push('salesAmount');
    }
    return keys;
  }, [selectedMetrics]);

  const colors = useMemo(() => {
    const colorMap: Record<string, string> = {
      orderCount: '#3b82f6', // Blue
      customerGrowth: '#10b981', // Green
      salesAmount: '#f59e0b', // Amber
    };
    return dataKeys.map(key => colorMap[key] || '#6b7280');
  }, [dataKeys]);

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <LineChartComponent
        data={chartData}
        dataKeys={dataKeys}
        colors={colors}
      />
    </Suspense>
  );
};

