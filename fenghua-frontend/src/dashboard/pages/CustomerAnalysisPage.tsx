/**
 * Customer Analysis Page
 * 
 * Page for displaying customer analysis with order statistics, churn rate, and customer lifetime value
 * All custom code is proprietary and not open source.
 */

import React, { useState, Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { isAdmin, isDirector } from '../../common/constants/roles';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  getCustomerAnalysis,
  getChurnRateTrend,
  CustomerAnalysisQuery,
} from '../services/customer-analysis.service';

// Lazy load components for better performance
const CustomerAnalysisTable = lazy(() => 
  import('../components/CustomerAnalysisTable').then(module => ({
    default: module.CustomerAnalysisTable,
  }))
);

const ChurnRateTrendChart = lazy(() => 
  import('../components/ChurnRateTrendChart').then(module => ({
    default: module.ChurnRateTrendChart,
  }))
);

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

export const CustomerAnalysisPage: React.FC = () => {
  const { token, user } = useAuth();
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Constants
  const DEFAULT_PAGE_SIZE = 20;
  const DEFAULT_PAGE = 1;

  const [filters, setFilters] = useState<CustomerAnalysisQuery>({
    page: DEFAULT_PAGE,
    limit: DEFAULT_PAGE_SIZE,
  });
  const [selectedCustomerType, setSelectedCustomerType] = useState<'BUYER' | 'SUPPLIER' | ''>('');

  const hasAccess = isAdmin(user?.role) || isDirector(user?.role);

  // Constants for cache configuration
  const CACHE_STALE_TIME = 5 * 60 * 1000; // 5 minutes
  const CACHE_GC_TIME = 10 * 60 * 1000; // 10 minutes

  // Fetch customer analysis
  const {
    data: analysisData,
    isLoading: isLoadingAnalysis,
    error: analysisError,
    refetch: refetchAnalysis,
  } = useQuery({
    queryKey: ['customer-analysis', filters, selectedCustomerType],
    queryFn: () => {
      if (!token) {
        throw new Error('未登录，请先登录');
      }
      return getCustomerAnalysis(token, {
        ...filters,
        customerType: selectedCustomerType || undefined,
      });
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

  // Fetch churn rate trend
  const {
    data: trendData,
    isLoading: isLoadingTrend,
  } = useQuery({
    queryKey: ['churn-rate-trend', filters.startDate, filters.endDate],
    queryFn: () => {
      if (!token) {
        throw new Error('未登录，请先登录');
      }
      return getChurnRateTrend(
        token,
        filters.startDate,
        filters.endDate,
      );
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

  const handleFilterChange = (key: keyof CustomerAnalysisQuery, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleCustomerTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCustomerType(e.target.value as 'BUYER' | 'SUPPLIER' | '');
    setFilters((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleExport = async () => {
    if (!token) {
      setExportError('未登录，请先登录');
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const apiBaseUrl = (import.meta.env?.VITE_API_BASE_URL as string) || 
                        (import.meta.env?.VITE_BACKEND_URL as string) || 
                        '/api';
      
      const params = new URLSearchParams();
      if (selectedCustomerType) {
        params.append('customerType', selectedCustomerType);
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
      params.append('format', 'csv');

      const url = `${apiBaseUrl}/dashboard/customer-analysis/export?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = '导出失败，请稍后重试';
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          }
        } catch {
          // If parsing fails, use default message
        }
        throw new Error(errorMessage);
      }

      // Download file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `客户分析_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Export failed:', error);
      setExportError(error instanceof Error ? error.message : '导出失败，请稍后重试');
    } finally {
      setIsExporting(false);
    }
  };

  if (!hasAccess) {
    return (
      <MainLayout title="客户分析">
        <Card variant="default" className="max-w-7xl mx-auto">
          <div className="p-monday-4 bg-primary-red/20 border border-primary-red rounded-monday-md text-primary-red text-monday-base" role="alert">
            只有总监和管理员可以访问此页面
          </div>
        </Card>
      </MainLayout>
    );
  }

  if (isLoadingAnalysis && !analysisData) {
    return (
      <MainLayout title="客户分析">
        <PageSkeleton />
      </MainLayout>
    );
  }

  if (analysisError && !analysisData) {
    return (
      <MainLayout title="客户分析">
        <Card variant="default" className="max-w-7xl mx-auto">
          <div className="p-monday-6">
            <div className="bg-primary-red/20 border border-primary-red text-primary-red p-monday-4 rounded-monday-md mb-monday-4" role="alert">
              {analysisError instanceof Error ? analysisError.message : '获取客户分析数据失败'}
            </div>
            <Button
              onClick={() => refetchAnalysis()}
              variant="primary"
            >
              重试
            </Button>
          </div>
        </Card>
      </MainLayout>
    );
  }

  const totalPages = analysisData
    ? Math.ceil(analysisData.total / (filters.limit || 20))
    : 0;

  return (
    <MainLayout title="客户分析">
      <div className="space-y-monday-6">
        {/* Filters */}
        <Card variant="default" className="p-monday-6">
          <h2 className="text-monday-lg font-semibold text-monday-text mb-monday-4">
            筛选条件
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-monday-4">
            {/* Customer Type Filter */}
            <div>
              <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
                客户类型
              </label>
              <select
                value={selectedCustomerType}
                onChange={handleCustomerTypeChange}
                className="w-full rounded-monday-md border border-gray-300 px-monday-3 py-monday-2 text-monday-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
              >
                <option value="">全部类型</option>
                <option value="BUYER">采购商</option>
                <option value="SUPPLIER">供应商</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
                开始日期
              </label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                className="w-full"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
                结束日期
              </label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
                className="w-full"
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setFilters({ page: DEFAULT_PAGE, limit: DEFAULT_PAGE_SIZE });
                  setSelectedCustomerType('');
                }}
                className="w-full"
              >
                清除筛选
              </Button>
            </div>
          </div>
        </Card>

        {/* Churn Rate Trend Chart */}
        <Card variant="default" className="p-monday-6">
          <h2 className="text-monday-lg font-semibold text-monday-text mb-monday-4">
            客户流失率趋势
          </h2>
          <Suspense fallback={
            <div className="flex items-center justify-center h-[300px]">
              <div className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          }>
            <ChurnRateTrendChart
              data={trendData?.trends || []}
              loading={isLoadingTrend}
            />
          </Suspense>
        </Card>

        {/* Customer Analysis Table */}
        <Card variant="default" className="p-monday-6">
          <div className="flex items-center justify-between mb-monday-4">
            <h2 className="text-monday-lg font-semibold text-monday-text">
              客户分析
            </h2>
            <div className="flex items-center gap-monday-4">
              {analysisData && (
                <div className="text-monday-sm text-monday-text-secondary">
                  共 {analysisData.total} 个客户
                </div>
              )}
              <Button
                variant="primary"
                onClick={handleExport}
                disabled={isLoadingAnalysis || !analysisData || isExporting}
              >
                {isExporting ? '导出中...' : '导出 CSV'}
              </Button>
            </div>
          </div>
          {exportError && (
            <div className="mb-monday-4 p-monday-3 bg-primary-red/20 border border-primary-red rounded-monday-md text-primary-red text-monday-sm" role="alert">
              {exportError}
            </div>
          )}
          <Suspense fallback={
            <div className="flex items-center justify-center py-monday-12">
              <div className="animate-pulse text-monday-text-secondary">加载中...</div>
            </div>
          }>
            <CustomerAnalysisTable
              data={analysisData?.customers || []}
              loading={isLoadingAnalysis}
            />
          </Suspense>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-monday-6 pt-monday-4 border-t border-gray-200">
              <div className="text-monday-sm text-monday-text-secondary">
                第 {filters.page || 1} 页，共 {totalPages} 页
              </div>
              <div className="flex gap-monday-2">
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange((filters.page || 1) - 1)}
                  disabled={(filters.page || 1) <= 1}
                >
                  上一页
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange((filters.page || 1) + 1)}
                  disabled={(filters.page || 1) >= totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
};

