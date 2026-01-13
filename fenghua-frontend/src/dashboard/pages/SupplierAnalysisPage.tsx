/**
 * Supplier Analysis Page Component
 * 
 * Main page for displaying supplier analysis data
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
  getSupplierAnalysis,
  getCooperationTrend,
  SupplierAnalysisQuery,
} from '../services/supplier-analysis.service';

// Lazy load components for better performance
const SupplierAnalysisTable = lazy(() =>
  import('../components/SupplierAnalysisTable').then(module => ({
    default: module.SupplierAnalysisTable,
  }))
);
const CooperationTrendChart = lazy(() =>
  import('../components/CooperationTrendChart').then(module => ({
    default: module.CooperationTrendChart,
  }))
);

import { AnalysisExportDialog } from '../components/AnalysisExportDialog';

// Constants
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_PAGE = 1;
const CACHE_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const CACHE_GC_TIME = 10 * 60 * 1000; // 10 minutes

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

export const SupplierAnalysisPage: React.FC = () => {
  const { token, user } = useAuth();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const [filters, setFilters] = useState<SupplierAnalysisQuery>({
    page: DEFAULT_PAGE,
    limit: DEFAULT_PAGE_SIZE,
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const hasAccess = isAdmin(user?.role) || isDirector(user?.role);

  // Fetch supplier analysis
  const {
    data: analysisData,
    isLoading: isLoadingAnalysis,
    error: analysisError,
    refetch: refetchAnalysis,
  } = useQuery({
    queryKey: ['supplier-analysis', filters, selectedCategory],
    queryFn: () => {
      if (!token) {
        throw new Error('未登录，请先登录');
      }
      return getSupplierAnalysis(token, {
        ...filters,
        categoryName: selectedCategory || undefined,
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

  // Fetch cooperation trend
  const {
    data: trendData,
    isLoading: isLoadingTrend,
  } = useQuery({
    queryKey: ['cooperation-trend', filters.startDate, filters.endDate],
    queryFn: () => {
      if (!token) {
        throw new Error('未登录，请先登录');
      }
      return getCooperationTrend(
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

  const handleFilterChange = (key: keyof SupplierAnalysisQuery, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: DEFAULT_PAGE,
    }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedCategory(e.target.value);
    setFilters((prev) => ({
      ...prev,
      page: DEFAULT_PAGE,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };


  if (!hasAccess) {
    return (
      <MainLayout title="供应商分析">
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
      <MainLayout title="供应商分析">
        <PageSkeleton />
      </MainLayout>
    );
  }

  if (analysisError && !analysisData) {
    return (
      <MainLayout title="供应商分析">
        <Card variant="default" className="max-w-7xl mx-auto">
          <div className="p-monday-6">
            <div className="bg-primary-red/20 border border-primary-red text-primary-red p-monday-4 rounded-monday-md mb-monday-4" role="alert">
              {analysisError instanceof Error ? analysisError.message : '获取供应商分析数据失败'}
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
    ? Math.ceil(analysisData.total / (filters.limit || DEFAULT_PAGE_SIZE))
    : 0;

  return (
    <MainLayout title="供应商分析">
      <div className="space-y-monday-6">
        <Card variant="default" className="p-monday-6">
          <h2 className="text-monday-lg font-semibold text-monday-text mb-monday-4">
            筛选条件
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-monday-4">
            <div>
              <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
                产品类别
              </label>
              <Input
                type="text"
                value={selectedCategory}
                onChange={handleCategoryChange}
                placeholder="输入产品类别名称"
                className="w-full"
              />
            </div>

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

            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setFilters({ page: DEFAULT_PAGE, limit: DEFAULT_PAGE_SIZE });
                  setSelectedCategory('');
                }}
                className="w-full"
              >
                清除筛选
              </Button>
            </div>
          </div>
        </Card>

        <Card variant="default" className="p-monday-6">
          <h2 className="text-monday-lg font-semibold text-monday-text mb-monday-4">
            供应商合作频率趋势
          </h2>
          <div id="cooperation-trend-chart">
            <Suspense fallback={<PageSkeleton />}>
              <CooperationTrendChart
                data={trendData?.trends || []}
                loading={isLoadingTrend}
              />
            </Suspense>
          </div>
        </Card>

        <Card variant="default" className="p-monday-6">
          <div className="flex items-center justify-between mb-monday-4">
            <h2 className="text-monday-lg font-semibold text-monday-text">
              供应商分析
            </h2>
            <div className="flex items-center gap-monday-4">
              {analysisData && (
                <div className="text-monday-sm text-monday-text-secondary">
                  共 {analysisData.total} 个供应商
                </div>
              )}
              <Button
                variant="primary"
                onClick={() => setIsExportDialogOpen(true)}
                disabled={isLoadingAnalysis || !analysisData}
              >
                导出
              </Button>
            </div>
          </div>
          <Suspense fallback={<PageSkeleton />}>
            <SupplierAnalysisTable
              data={analysisData?.suppliers || []}
              loading={isLoadingAnalysis}
            />
          </Suspense>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-monday-6 pt-monday-4 border-t border-gray-200">
              <div className="text-monday-sm text-monday-text-secondary">
                第 {filters.page || DEFAULT_PAGE} 页，共 {totalPages} 页
              </div>
              <div className="flex gap-monday-2">
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange((filters.page || DEFAULT_PAGE) - 1)}
                  disabled={(filters.page || DEFAULT_PAGE) <= 1}
                >
                  上一页
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange((filters.page || DEFAULT_PAGE) + 1)}
                  disabled={(filters.page || DEFAULT_PAGE) >= totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Export Dialog */}
      {token && (
        <AnalysisExportDialog
          analysisType="supplier"
          queryParams={{
            categoryName: selectedCategory || undefined,
            startDate: filters.startDate,
            endDate: filters.endDate,
          }}
          chartElementIds={['cooperation-trend-chart']}
          isOpen={isExportDialogOpen}
          onClose={() => setIsExportDialogOpen(false)}
          token={token}
        />
      )}
    </MainLayout>
  );
};

