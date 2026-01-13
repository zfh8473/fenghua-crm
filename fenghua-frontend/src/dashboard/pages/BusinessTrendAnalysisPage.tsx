/**
 * Business Trend Analysis Page
 * 
 * Page for displaying business trend analysis with order trends, customer growth trends, and sales trends
 * All custom code is proprietary and not open source.
 */

import React, { useState, Suspense, lazy, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { isAdmin, isDirector } from '../../common/constants/roles';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  getBusinessTrendAnalysis,
  BusinessTrendAnalysisQuery,
  TimeGranularity,
  TrendMetric,
} from '../services/business-trend-analysis.service';

// Lazy load components for better performance
const BusinessTrendChart = lazy(() => 
  import('../components/BusinessTrendChart').then(module => ({
    default: module.BusinessTrendChart,
  }))
);

const TrendSummaryComponent = lazy(() => 
  import('../components/TrendSummary').then(module => ({
    default: module.TrendSummaryComponent,
  }))
);

import { AnalysisExportDialog } from '../components/AnalysisExportDialog';

/**
 * Skeleton loading component
 */
const PageSkeleton: React.FC = () => {
  return (
    <div className="space-y-monday-6">
      <Card variant="default" className="p-monday-6">
        <div className="animate-pulse space-y-monday-4">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded w-full"></div>
          <div className="h-8 bg-gray-200 rounded w-full"></div>
        </div>
      </Card>
      <Card variant="default" className="p-monday-6">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Card>
    </div>
  );
};

export const BusinessTrendAnalysisPage: React.FC = () => {
  const { token, user } = useAuth();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Default time range: last 12 months
  const defaultEndDate = new Date().toISOString().split('T')[0];
  const defaultStartDate = new Date();
  defaultStartDate.setMonth(defaultStartDate.getMonth() - 12);
  const defaultStartDateStr = defaultStartDate.toISOString().split('T')[0];

  const [filters, setFilters] = useState<BusinessTrendAnalysisQuery>({
    startDate: defaultStartDateStr,
    endDate: defaultEndDate,
    timeGranularity: 'month' as TimeGranularity,
    metrics: ['orderCount', 'customerGrowth', 'salesAmount'] as TrendMetric[],
  });

  const hasAccess = isAdmin(user?.role) || isDirector(user?.role);

  // Constants for cache configuration
  const CACHE_STALE_TIME = 5 * 60 * 1000; // 5 minutes
  const CACHE_GC_TIME = 10 * 60 * 1000; // 10 minutes

  // Fetch business trend analysis
  const {
    data: trendData,
    isLoading: isLoadingTrend,
    error: trendError,
    refetch: refetchTrend,
  } = useQuery({
    queryKey: ['business-trend-analysis', filters],
    queryFn: () => {
      if (!token) {
        throw new Error('未登录，请先登录');
      }
      return getBusinessTrendAnalysis(token, filters);
    },
    enabled: !!token && hasAccess,
    staleTime: CACHE_STALE_TIME,
    gcTime: CACHE_GC_TIME,
    retry: (failureCount, error) => {
      // 对于认证和权限错误，不重试
      if (error instanceof Error && (error.message.includes('认证失败') || error.message.includes('没有权限'))) {
        return false;
      }
      // 其他错误最多重试 3 次
      return failureCount < 3;
    },
  });

  const handleFilterChange = (key: keyof BusinessTrendAnalysisQuery, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTimeGranularityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleFilterChange('timeGranularity', e.target.value as TimeGranularity);
  };

  const handleMetricToggle = (metric: TrendMetric) => {
    setFilters((prev) => {
      const currentMetrics = prev.metrics || [];
      const newMetrics = currentMetrics.includes(metric)
        ? currentMetrics.filter(m => m !== metric)
        : [...currentMetrics, metric];
      return {
        ...prev,
        metrics: newMetrics.length > 0 ? newMetrics : ['orderCount'],
      };
    });
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: defaultStartDateStr,
      endDate: defaultEndDate,
      timeGranularity: 'month' as TimeGranularity,
      metrics: ['orderCount', 'customerGrowth', 'salesAmount'] as TrendMetric[],
    });
  };


  if (!hasAccess) {
    return (
      <MainLayout title="业务趋势分析">
        <Card variant="default" className="p-monday-6">
          <div className="text-center text-monday-text-secondary">
            <p>只有总监和管理员可以访问此页面</p>
          </div>
        </Card>
      </MainLayout>
    );
  }

  if (isLoadingTrend && !trendData) {
    return (
      <MainLayout title="业务趋势分析">
        <PageSkeleton />
      </MainLayout>
    );
  }

  if (trendError && !trendData) {
    return (
      <MainLayout title="业务趋势分析">
        <Card variant="default" className="p-monday-6">
          <div className="text-center">
            <p className="text-red-600 mb-monday-4">
              {trendError instanceof Error ? trendError.message : '获取业务趋势分析数据失败'}
            </p>
            <Button onClick={() => refetchTrend()}>重试</Button>
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="业务趋势分析">
      <div className="space-y-monday-6">
        {/* Filters */}
        <Card variant="default" className="p-monday-6">
          <h2 className="text-monday-lg font-semibold text-monday-text mb-monday-4">筛选条件</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-monday-4">
            <div>
              <label className="block text-monday-sm font-medium text-monday-text-secondary mb-monday-2">
                开始日期
              </label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-monday-sm font-medium text-monday-text-secondary mb-monday-2">
                结束日期
              </label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-monday-sm font-medium text-monday-text-secondary mb-monday-2">
                时间粒度
              </label>
              <select
                className="w-full px-monday-3 py-monday-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.timeGranularity || 'month'}
                onChange={handleTimeGranularityChange}
              >
                <option value="day">按天</option>
                <option value="week">按周</option>
                <option value="month">按月</option>
                <option value="quarter">按季度</option>
                <option value="year">按年</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleClearFilters} variant="outline">
                清除筛选
              </Button>
            </div>
          </div>

          {/* Metric Selection */}
          <div className="mt-monday-4">
            <label className="block text-monday-sm font-medium text-monday-text-secondary mb-monday-2">
              选择指标
            </label>
            <div className="flex flex-wrap gap-monday-2">
              {(['orderCount', 'customerGrowth', 'salesAmount'] as TrendMetric[]).map((metric) => {
                const isSelected = filters.metrics?.includes(metric);
                const labels: Record<TrendMetric, string> = {
                  orderCount: '订单量',
                  customerGrowth: '客户增长',
                  salesAmount: '销售额',
                };
                return (
                  <button
                    key={metric}
                    type="button"
                    onClick={() => handleMetricToggle(metric)}
                    className={`px-monday-3 py-monday-2 rounded-md text-monday-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {labels[metric]}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Trend Summary */}
        {trendData?.summary && (
          <Suspense fallback={<div className="animate-pulse h-32 bg-gray-200 rounded"></div>}>
            <TrendSummaryComponent summary={trendData.summary} loading={isLoadingTrend} />
          </Suspense>
        )}

        {/* Trend Chart */}
        <Card variant="default" className="p-monday-6">
          <div className="flex items-center justify-between mb-monday-4">
            <h2 className="text-monday-lg font-semibold text-monday-text">业务趋势图</h2>
            <Button onClick={() => setIsExportDialogOpen(true)} disabled={isLoadingTrend || !trendData}>
              导出
            </Button>
          </div>
          <div id="business-trend-chart">
            <Suspense fallback={<div className="animate-pulse h-64 bg-gray-200 rounded"></div>}>
              <BusinessTrendChart
                data={trendData?.trends || []}
                loading={isLoadingTrend}
                selectedMetrics={filters.metrics}
              />
            </Suspense>
          </div>
        </Card>
      </div>

      {/* Export Dialog */}
      {token && (
        <AnalysisExportDialog
          analysisType="business-trend"
          queryParams={{
            startDate: filters.startDate,
            endDate: filters.endDate,
            timeGranularity: filters.timeGranularity,
            metrics: filters.metrics,
          }}
          chartElementIds={['business-trend-chart']}
          isOpen={isExportDialogOpen}
          onClose={() => setIsExportDialogOpen(false)}
          token={token}
        />
      )}
    </MainLayout>
  );
};

