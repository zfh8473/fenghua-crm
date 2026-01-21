/**
 * Conversion Rate Trend Chart Component
 * 
 * Displays conversion rate trend using Recharts
 * All custom code is proprietary and not open source.
 */

import React, { Suspense, lazy } from 'react';
import { ConversionRateTrendItem } from '../services/product-association-analysis.service';

// Lazy load LineChart component for better performance
const LineChartComponent = lazy(() => 
  import('./LineChart').then(module => ({
    default: module.LineChartComponent,
  }))
);

interface ConversionRateTrendChartProps {
  data: ConversionRateTrendItem[];
  loading?: boolean;
}

/**
 * Loading fallback for chart
 */
const ChartSkeleton: React.FC = () => (
  <div className="flex items-center justify-center h-[300px]">
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

export const ConversionRateTrendChart: React.FC<ConversionRateTrendChartProps> = ({
  data,
  loading = false,
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

  // Transform data for LineChart
  const chartData = data.map((item) => ({
    name: item.period,
    conversionRate: item.conversionRate,
    orderCount: item.orderCount,
    totalInteractions: item.totalInteractions,
  }));

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <LineChartComponent
        data={chartData}
        dataKeys={['conversionRate']}
        colors={['#3b82f6']}
      />
    </Suspense>
  );
};

