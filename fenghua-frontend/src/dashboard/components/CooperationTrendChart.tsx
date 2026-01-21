/**
 * Cooperation Trend Chart Component
 * 
 * Displays supplier cooperation frequency trends using Recharts
 * All custom code is proprietary and not open source.
 */

import React, { Suspense, lazy } from 'react';
import { CooperationTrendItem } from '../services/supplier-analysis.service';
import { CHART_COLORS } from '../utils/chart-colors';

const LineChartComponent = lazy(() =>
  import('./LineChart').then(module => ({
    default: module.LineChartComponent,
  }))
);

interface CooperationTrendChartProps {
  data: CooperationTrendItem[];
  loading?: boolean;
}

const ChartSkeleton: React.FC = () => (
  <div className="flex items-center justify-center h-[300px]">
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

export const CooperationTrendChart: React.FC<CooperationTrendChartProps> = ({
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

  const chartData = data.map((item) => ({
    name: item.period,
    cooperationFrequency: item.cooperationFrequency,
    totalSuppliers: item.totalSuppliers,
    activeSuppliers: item.activeSuppliers,
    totalOrders: item.totalOrders,
  }));

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <LineChartComponent
        data={chartData}
        dataKeys={['cooperationFrequency']}
        colors={[CHART_COLORS[0]]}
      />
    </Suspense>
  );
};

