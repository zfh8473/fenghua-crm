/**
 * Interactions Page
 * 
 * Page for listing and searching interaction records with advanced filtering
 * All custom code is proprietary and not open source.
 */

import { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { isAdmin, isDirector } from '../../common/constants/roles';
import { InteractionSearch } from '../components/InteractionSearch';
import { InteractionSearchResults } from '../components/InteractionSearchResults';
import { useInteractionSearch } from '../hooks/useInteractionSearch';
import { InteractionSearchFilters } from '../services/interactions.service';

export const InteractionsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const userIsAdmin = isAdmin(currentUser?.role);
  const userIsDirector = isDirector(currentUser?.role);

  const interactionPageSize = 20;
  const interactionPage = parseInt(searchParams.get('page') || '1', 10);

  /** 排序默认：占位「排序字段」「排序方向」；空值时 API 使用 interactionDate、desc */
  const [sortBy, setSortBy] = useState<InteractionSearchFilters['sortBy'] | ''>(
    () => (searchParams.get('sortBy') as InteractionSearchFilters['sortBy']) || ''
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | ''>(
    () => (searchParams.get('sortOrder') as 'asc' | 'desc') || ''
  );

  // Parse initial filters from URL
  const initialFilters: InteractionSearchFilters = {
    search: searchParams.get('q') || '',
    interactionTypes: searchParams.get('interactionTypes')?.split(',').filter(Boolean) as any[] || [],
    statuses: searchParams.get('statuses')?.split(',').filter(Boolean) as any[] || [],
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
    customerId: searchParams.get('customerId')?.trim() || undefined,
    productId: searchParams.get('productId')?.trim() || undefined,
    createdBy: searchParams.get('createdBy')?.trim() || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    sortBy: sortBy || undefined,
    sortOrder: sortOrder || undefined,
    limit: interactionPageSize,
    offset: 0,
  };

  // Use the search hook
  const {
    interactions,
    total,
    isLoading,
    error,
    filters: currentFilters,
    hasActiveFilters,
  } = useInteractionSearch({
    initialFilters: { ...initialFilters, page: interactionPage, limit: interactionPageSize },
    pageSize: interactionPageSize,
  });

  // Handle search filter changes
  const handleSearch = useCallback((filters: InteractionSearchFilters) => {
    const params = new URLSearchParams(searchParams);
    
    // Update URL params
    if (filters.search) {
      params.set('q', filters.search);
    } else {
      params.delete('q');
    }
    if (filters.interactionTypes && filters.interactionTypes.length > 0) {
      params.set('interactionTypes', filters.interactionTypes.join(','));
    } else {
      params.delete('interactionTypes');
    }
    if (filters.statuses && filters.statuses.length > 0) {
      params.set('statuses', filters.statuses.join(','));
    } else {
      params.delete('statuses');
    }
    if (filters.categories && filters.categories.length > 0) {
      params.set('categories', filters.categories.join(','));
    } else {
      params.delete('categories');
    }
    if (filters.customerId) {
      params.set('customerId', filters.customerId);
    } else {
      params.delete('customerId');
    }
    if (filters.productId) {
      params.set('productId', filters.productId);
    } else {
      params.delete('productId');
    }
    if (filters.createdBy) {
      params.set('createdBy', filters.createdBy);
    } else {
      params.delete('createdBy');
    }
    if (filters.startDate) {
      params.set('startDate', filters.startDate);
    } else {
      params.delete('startDate');
    }
    if (filters.endDate) {
      params.set('endDate', filters.endDate);
    } else {
      params.delete('endDate');
    }
    if (filters.sortBy && filters.sortBy.trim()) {
      params.set('sortBy', filters.sortBy);
    } else {
      params.delete('sortBy');
    }
    if (filters.sortOrder && filters.sortOrder.trim()) {
      params.set('sortOrder', filters.sortOrder);
    } else {
      params.delete('sortOrder');
    }
    params.set('page', '1');

    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  // Handle interaction click - navigate to detail page (not edit page)
  const handleInteractionClick = useCallback((interaction: any) => {
    navigate(`/interactions/${interaction.id}`);
  }, [navigate]);

  const handlePageChange = useCallback(
    (p: number) => {
      setSearchParams((prev) => {
        const n = new URLSearchParams(prev);
        n.set('page', String(p));
        return n;
      }, { replace: true });
    },
    [setSearchParams]
  );

  /** 排序控件样式与产品管理页下拉一致 */
  const selectClass =
    'px-monday-4 py-monday-3 text-monday-base text-uipro-text bg-monday-surface border border-gray-200 rounded-monday-md focus:outline-none focus:ring-2 focus:ring-uipro-cta/50 focus:border-uipro-cta transition-colors duration-200 font-semibold cursor-pointer';

  /** 排序默认：互动时间、降序；排序置于批量导入左侧 */
  const headerToolbar = (
    <div className="flex items-center gap-monday-3 flex-shrink-0 flex-wrap">
      {/* 排序字段、排序方向：占位为默认，空值时 API 使用 interactionDate、desc */}
      <div className="flex items-center gap-monday-2">
        <select
          value={sortBy}
          onChange={(e) => setSortBy((e.target.value || '') as InteractionSearchFilters['sortBy'] | '')}
          className={selectClass}
          aria-label="排序字段"
        >
          <option value="">排序字段</option>
          <option value="interactionDate">互动时间</option>
          <option value="customerName">客户名称</option>
          <option value="productName">产品名称</option>
          <option value="productHsCode">产品HS编码</option>
          <option value="interactionType">互动类型</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder((e.target.value || '') as 'asc' | 'desc' | '')}
          className={selectClass}
          aria-label="排序方向"
        >
          <option value="">排序方向</option>
          <option value="desc">降序</option>
          <option value="asc">升序</option>
        </select>
      </div>
      <div className="flex items-center gap-monday-3 ml-auto">
        {(userIsAdmin || userIsDirector) && (
          <Link to="/interactions/import">
            <Button variant="primary" size="md" className="whitespace-nowrap w-[8.5rem]">
              批量导入
            </Button>
          </Link>
        )}
        <Link to="/interactions/create">
          <Button variant="primary" size="md" className="whitespace-nowrap w-[8.5rem]">
            记录新互动
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <MainLayout title="互动记录" toolbar={headerToolbar}>
      <div className="space-y-monday-6">
        {/* 筛选区：单独卡片，排序已移至 toolbar；8 个搜索条件两行排布 */}
        <Card variant="default" className="p-monday-4">
          <InteractionSearch
            onSearch={handleSearch}
            initialFilters={currentFilters}
            sortBy={sortBy}
            sortOrder={sortOrder}
            loading={isLoading}
            userRole={currentUser?.role}
          />
        </Card>

        {/* Error Display */}
        {error && (
          <Card variant="default" className="p-monday-4">
            <p className="text-semantic-error" role="alert">搜索失败: {error.message}</p>
          </Card>
        )}

        {/* Search Results */}
        <InteractionSearchResults
          interactions={interactions}
          total={total}
          currentPage={interactionPage}
          pageSize={interactionPageSize}
          onPageChange={handlePageChange}
          onInteractionClick={handleInteractionClick}
          loading={isLoading}
        />
      </div>
    </MainLayout>
  );
};

