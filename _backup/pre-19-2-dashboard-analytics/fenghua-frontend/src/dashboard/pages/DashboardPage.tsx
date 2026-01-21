/**
 * Dashboard Page
 * 
 * Business dashboard overview page for directors and administrators
 * All custom code is proprietary and not open source.
 */

import React, { Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { isAdmin, isDirector } from '../../common/constants/roles';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getDashboardOverview, DashboardOverview } from '../services/dashboard.service';
import { MetricCard } from '../components/MetricCard';
import { DashboardErrorBoundary } from '../components/ErrorBoundary';

// Lazy load chart components for better performance
// Using dynamic import with proper type handling
const LineChartComponent = lazy(() => 
  import('../components/LineChart').then(module => ({
    default: module.LineChartComponent,
  }))
);
const PieChartComponent = lazy(() => 
  import('../components/PieChart').then(module => ({
    default: module.PieChartComponent,
  }))
);

/**
 * Loading fallback for chart components
 */
const ChartSkeleton: React.FC = () => (
  <div className="flex items-center justify-center h-[300px]">
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

/**
 * Skeleton loading component for dashboard
 */
const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-monday-6">
      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-monday-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} variant="default" className="h-24">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-monday-4">
        {[1, 2].map((i) => (
          <Card key={i} variant="default" className="h-64">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const { token, user } = useAuth();

  // Check if user has access (admin or director)
  const hasAccess = isAdmin(user?.role) || isDirector(user?.role);

  // Fetch dashboard data with React Query
  const {
    data: overview,
    isLoading,
    error,
    refetch,
  } = useQuery<DashboardOverview>({
    queryKey: ['dashboard-overview'],
    queryFn: () => {
      if (!token) {
        throw new Error('未登录，请先登录');
      }
      return getDashboardOverview(token);
    },
    enabled: !!token && hasAccess,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchIntervalInBackground: false, // Stop polling when page is not visible
    retry: 3, // Retry up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes (React Query 5.x)
  });

  // Access denied
  if (!hasAccess) {
    return (
      <MainLayout title="业务仪表板">
        <Card variant="default" className="max-w-7xl mx-auto">
          <div className="p-monday-4 bg-primary-red/20 border border-primary-red rounded-monday-md text-primary-red text-monday-base" role="alert">
            只有总监和管理员可以访问此页面
          </div>
        </Card>
      </MainLayout>
    );
  }

  // Loading state with skeleton
  if (isLoading && !overview) {
    return (
      <MainLayout title="业务仪表板">
        <DashboardSkeleton />
      </MainLayout>
    );
  }

  // Error state
  if (error && !overview) {
    return (
      <MainLayout title="业务仪表板">
        <Card variant="default" className="max-w-7xl mx-auto">
          <div className="p-monday-6">
            <div className="bg-primary-red/20 border border-primary-red text-primary-red p-monday-4 rounded-monday-md mb-monday-4" role="alert">
              {error instanceof Error ? error.message : '获取仪表板数据失败'}
            </div>
            <Button
              onClick={() => refetch()}
              variant="primary"
            >
              重试
            </Button>
          </div>
        </Card>
      </MainLayout>
    );
  }

  // No data
  if (!overview) {
    return (
      <MainLayout title="业务仪表板">
        <Card variant="default" className="max-w-7xl mx-auto">
          <div className="p-monday-6 text-center text-monday-text-secondary">
            暂无数据
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="业务仪表板">
      <DashboardErrorBoundary>
        <div className="space-y-monday-6">
        {/* Error banner (if error occurred but we have cached data) */}
        {error && overview && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-monday-4 rounded-monday-md" role="alert">
            <div className="flex items-center justify-between">
              <span>数据可能不是最新的，正在刷新...</span>
              <Button
                onClick={() => refetch()}
                variant="secondary"
                className="ml-monday-4"
              >
                立即刷新
              </Button>
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-monday-4">
          <MetricCard
            title="客户总数"
            value={overview.totalCustomers}
            icon="👥"
          />
          <MetricCard
            title="采购商"
            value={overview.totalBuyers}
            icon="🛒"
          />
          <MetricCard
            title="供应商"
            value={overview.totalSuppliers}
            icon="🏭"
          />
          <MetricCard
            title="产品总数"
            value={overview.totalProducts}
            icon="📦"
          />
          <MetricCard
            title="互动记录"
            value={overview.totalInteractions}
            icon="💬"
          />
          <MetricCard
            title="本月新增客户"
            value={overview.newCustomersThisMonth}
            icon="✨"
          />
          <MetricCard
            title="本月新增互动"
            value={overview.newInteractionsThisMonth}
            icon="📈"
          />
          {/* Note: "待处理任务数" (Pending Tasks) is marked as optional in AC3 and not implemented in this story */}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-monday-4">
          {/* Trend Chart - Monthly New Customers and Interactions */}
          {/* Note: This chart currently displays estimated weekly distribution based on monthly totals */}
          {/* TODO: Replace with real historical weekly data when API endpoint is available */}
          <Card variant="default" title="本月新增趋势（示例数据）">
            <div className="mb-monday-2">
              <p className="text-monday-sm text-monday-text-secondary italic">
                注：当前显示为基于本月总数的估算分布，实际历史数据功能开发中
              </p>
            </div>
            <Suspense fallback={<ChartSkeleton />}>
              <LineChartComponent
                data={[
                  { name: '第1周', customers: Math.floor(overview.newCustomersThisMonth * 0.3), interactions: Math.floor(overview.newInteractionsThisMonth * 0.25) },
                  { name: '第2周', customers: Math.floor(overview.newCustomersThisMonth * 0.25), interactions: Math.floor(overview.newInteractionsThisMonth * 0.3) },
                  { name: '第3周', customers: Math.floor(overview.newCustomersThisMonth * 0.25), interactions: Math.floor(overview.newInteractionsThisMonth * 0.25) },
                  { name: '第4周', customers: Math.floor(overview.newCustomersThisMonth * 0.2), interactions: Math.floor(overview.newInteractionsThisMonth * 0.2) },
                ]}
                dataKeys={['customers', 'interactions']}
                colors={['#3b82f6', '#10b981']}
              />
            </Suspense>
          </Card>

          {/* Distribution Chart - Customer Type */}
          <Card variant="default" title="客户类型分布">
            <Suspense fallback={<ChartSkeleton />}>
              <PieChartComponent
                data={[
                  { name: '采购商', value: overview.totalBuyers },
                  { name: '供应商', value: overview.totalSuppliers },
                ]}
                colors={['#3b82f6', '#10b981']}
                innerRadius={40}
              />
            </Suspense>
          </Card>
        </div>
        </div>
      </DashboardErrorBoundary>
    </MainLayout>
  );
};

