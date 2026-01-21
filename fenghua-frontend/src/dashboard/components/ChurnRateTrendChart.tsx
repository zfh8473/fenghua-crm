/**
 * Churn Rate Trend Chart Component
 * 
 * Displays churn rate trend using Recharts
 * All custom code is proprietary and not open source.
 */

import React, { Suspense, lazy } from 'react';
import { ChurnRateTrendItem } from '../services/customer-analysis.service';
import { CHART_SEMANTIC } from '../utils/chart-colors';

// Lazy load LineChart component for better performance
const LineChartComponent = lazy(() => 
  import('./LineChart').then(module => ({
    default: module.LineChartComponent,
  }))
);

interface ChurnRateTrendChartProps {
  data: ChurnRateTrendItem[];
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

export const ChurnRateTrendChart: React.FC<ChurnRateTrendChartProps> = ({
  data,
  loading = false,
}) => {
  if (loading) {
    return <ChartSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full text-center text-uipro-secondary py-monday-8">
        <p>暂无数据</p>
      </div>
    );
  }

  // Transform data for LineChart
  const chartData = data.map((item) => ({
    name: item.period,
    churnRate: item.churnRate,
    totalCustomers: item.totalCustomers,
    churnedCustomers: item.churnedCustomers,
  }));

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <LineChartComponent
        data={chartData}
        dataKeys={['churnRate']}
        colors={[CHART_SEMANTIC.error]}
      />
    </Suspense>
  );
};

