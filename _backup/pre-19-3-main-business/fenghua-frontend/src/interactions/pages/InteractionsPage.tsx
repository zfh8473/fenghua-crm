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
    sortBy: (searchParams.get('sortBy') as InteractionSearchFilters['sortBy']) || 'interactionDate',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    limit: 20,
    offset: 0,
  };

  const [interactionPage, setInteractionPage] = useState(1);
  const interactionPageSize = 20;

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
    if (filters.sortBy && filters.sortBy !== 'interactionDate') {
      params.set('sortBy', filters.sortBy);
    } else {
      params.delete('sortBy');
    }
    if (filters.sortOrder && filters.sortOrder !== 'desc') {
      params.set('sortOrder', filters.sortOrder);
    } else {
      params.delete('sortOrder');
    }

    setSearchParams(params, { replace: true });
    setInteractionPage(1); // Reset to first page on new search
  }, [searchParams, setSearchParams]);

  // Handle interaction click - navigate to detail page (not edit page)
  const handleInteractionClick = useCallback((interaction: any) => {
    navigate(`/interactions/${interaction.id}`);
  }, [navigate]);

  return (
    <MainLayout title="互动记录">
      <div className="space-y-monday-6">
        {/* Header with Actions */}
        <Card variant="default" className="w-full">
          <div className="p-monday-6">
            <div className="flex items-center justify-between mb-monday-6">
              <h2 className="text-monday-2xl font-semibold text-monday-text">
                互动记录
              </h2>
              <div className="flex items-center gap-monday-3">
                {(userIsAdmin || userIsDirector) && (
                  <Link to="/interactions/import">
                    <Button 
                      variant="primary" 
                      size="md" 
                      className="bg-gradient-to-r from-primary-green to-primary-green-hover hover:from-primary-green-hover hover:to-primary-green shadow-monday-md hover:shadow-monday-lg font-semibold whitespace-nowrap"
                    >
                      <span className="mr-monday-2">📥</span>
                      批量导入
                    </Button>
                  </Link>
                )}
                <Link to="/interactions/create">
                  <Button 
                    variant="primary" 
                    size="md" 
                    className="bg-gradient-to-r from-primary-blue to-primary-blue-hover hover:from-primary-blue-hover hover:to-primary-blue shadow-monday-md hover:shadow-monday-lg font-semibold"
                  >
                    <span className="mr-monday-2">✨</span>
                    记录新互动
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        {/* Advanced Search */}
        <Card variant="default" className="p-monday-6">
          <InteractionSearch
            onSearch={handleSearch}
            initialFilters={currentFilters}
            loading={isLoading}
            userRole={currentUser?.role}
          />
        </Card>

        {/* Error Display */}
        {error && (
          <Card variant="default" className="p-monday-4">
            <p className="text-red-600">搜索失败: {error.message}</p>
          </Card>
        )}

        {/* Search Results */}
        <InteractionSearchResults
          interactions={interactions}
          total={total}
          currentPage={interactionPage}
          pageSize={interactionPageSize}
          onPageChange={setInteractionPage}
          onInteractionClick={handleInteractionClick}
          loading={isLoading}
        />
      </div>
    </MainLayout>
  );
};

