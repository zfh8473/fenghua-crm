/**
 * Product Association Analysis Page
 * 
 * Page for displaying product association analysis with conversion rates
 * All custom code is proprietary and not open source.
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { isAdmin, isDirector } from '../../common/constants/roles';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  getProductAssociationAnalysis,
  getConversionRateTrend,
  getProductCategories,
  ProductAssociationAnalysisQuery,
} from '../services/product-association-analysis.service';
import { ProductAssociationTable } from '../components/ProductAssociationTable';
import { ConversionRateTrendChart } from '../components/ConversionRateTrendChart';
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

export const ProductAssociationAnalysisPage: React.FC = () => {
  const { token, user } = useAuth();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [filters, setFilters] = useState<ProductAssociationAnalysisQuery>({
    page: 1,
    limit: 20,
  });
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const hasAccess = isAdmin(user?.role) || isDirector(user?.role);

  // Fetch product categories
  const { data: categoriesData } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => {
      if (!token) {
        throw new Error('未登录，请先登录');
      }
      return getProductCategories(token);
    },
    enabled: !!token && hasAccess,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  useEffect(() => {
    if (categoriesData?.categories) {
      setCategoryOptions(categoriesData.categories);
    }
  }, [categoriesData]);

  // Fetch product association analysis
  const {
    data: analysisData,
    isLoading: isLoadingAnalysis,
    error: analysisError,
    refetch: refetchAnalysis,
  } = useQuery({
    queryKey: ['product-association-analysis', filters, selectedCategory],
    queryFn: () => {
      if (!token) {
        throw new Error('未登录，请先登录');
      }
      return getProductAssociationAnalysis(token, {
        ...filters,
        categoryName: selectedCategory || undefined,
      });
    },
    enabled: !!token && hasAccess,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (React Query 5.x)
  });

  // Fetch conversion rate trend
  const {
    data: trendData,
    isLoading: isLoadingTrend,
    error: trendError,
  } = useQuery({
    queryKey: ['conversion-rate-trend', selectedCategory, filters.startDate, filters.endDate],
    queryFn: () => {
      if (!token) {
        throw new Error('未登录，请先登录');
      }
      return getConversionRateTrend(
        token,
        selectedCategory || undefined,
        filters.startDate,
        filters.endDate,
      );
    },
    enabled: !!token && hasAccess,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const handleFilterChange = (key: keyof ProductAssociationAnalysisQuery, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
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

  if (!hasAccess) {
    return (
      <MainLayout title="产品关联分析">
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
      <MainLayout title="产品关联分析">
        <PageSkeleton />
      </MainLayout>
    );
  }

  if (analysisError && !analysisData) {
    return (
      <MainLayout title="产品关联分析">
        <Card variant="default" className="max-w-7xl mx-auto">
          <div className="p-monday-6">
            <div className="bg-primary-red/20 border border-primary-red text-primary-red p-monday-4 rounded-monday-md mb-monday-4" role="alert">
              {analysisError instanceof Error ? analysisError.message : '获取产品关联分析数据失败'}
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
    <MainLayout title="产品关联分析">
      <div className="space-y-monday-6">
        {/* Filters */}
        <Card variant="default" className="p-monday-6">
          <h2 className="text-monday-lg font-semibold text-monday-text mb-monday-4">
            筛选条件
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-monday-4">
            {/* Category Filter */}
            <div>
              <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
                产品类别
              </label>
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="w-full rounded-monday-md border border-gray-300 px-monday-3 py-monday-2 text-monday-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
              >
                <option value="">全部类别</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
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
                  setFilters({ page: 1, limit: 20 });
                  setSelectedCategory('');
                }}
                className="w-full"
              >
                清除筛选
              </Button>
            </div>
          </div>
        </Card>

        {/* Conversion Rate Trend Chart */}
        <Card variant="default" className="p-monday-6">
          <h2 className="text-monday-lg font-semibold text-monday-text mb-monday-4">
            订单转化率趋势
          </h2>
          <div id="conversion-rate-chart">
            <ConversionRateTrendChart
              data={trendData?.trends || []}
              loading={isLoadingTrend}
            />
          </div>
        </Card>

        {/* Product Association Table */}
        <Card variant="default" className="p-monday-6">
          <div className="flex items-center justify-between mb-monday-4">
            <h2 className="text-monday-lg font-semibold text-monday-text">
              产品关联分析
            </h2>
            <div className="flex items-center gap-monday-4">
              {analysisData && (
                <div className="text-monday-sm text-monday-text-secondary">
                  共 {analysisData.total} 个产品
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
          <ProductAssociationTable
            data={analysisData?.products || []}
            loading={isLoadingAnalysis}
          />

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

      {/* Export Dialog */}
      {token && (
        <AnalysisExportDialog
          analysisType="product-association"
          queryParams={{
            categoryName: selectedCategory || undefined,
            startDate: filters.startDate,
            endDate: filters.endDate,
          }}
          chartElementIds={['conversion-rate-chart']}
          isOpen={isExportDialogOpen}
          onClose={() => setIsExportDialogOpen(false)}
          token={token}
        />
      )}
    </MainLayout>
  );
};

