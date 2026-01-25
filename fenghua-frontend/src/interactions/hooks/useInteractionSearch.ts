/**
 * useInteractionSearch Hook
 *
 * Custom hook for fetching and managing interaction search results.
 * Integrates with React Query for data fetching and caching, and
 * synchronizes search filters with URL query parameters.
 * All custom code is proprietary and not open source.
 */

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  interactionsService,
  InteractionSearchFilters,
  InteractionSearchResults,
  InteractionType,
  InteractionStatus,
} from '../services/interactions.service';
import { useCallback, useMemo } from 'react';

interface UseInteractionSearchOptions {
  initialFilters?: InteractionSearchFilters;
  pageSize?: number;
  enabled?: boolean; // Whether the query should be enabled
}

export const useInteractionSearch = (options?: UseInteractionSearchOptions) => {
  const [searchParams] = useSearchParams();
  const pageSize = options?.pageSize || 20;

  // Parse filters from URL params（sortBy/sortOrder 由页面 toolbar 控制，不从这里取以免覆盖父级状态）
  const filtersFromUrl: InteractionSearchFilters = useMemo(() => {
    const q = searchParams.get('q') || '';
    const customerId = searchParams.get('customerId') || undefined;
    const productId = searchParams.get('productId') || undefined;
    const interactionTypes = searchParams.get('interactionTypes')?.split(',') as InteractionType[] || undefined;
    const statuses = searchParams.get('statuses')?.split(',') as InteractionStatus[] || undefined;
    const categories = searchParams.get('categories')?.split(',') || undefined;
    const createdBy = searchParams.get('createdBy') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);

    return {
      search: q,
      customerId,
      productId,
      interactionTypes,
      statuses,
      categories,
      createdBy,
      startDate,
      endDate,
      page,
      limit: pageSize,
    };
  }, [searchParams, pageSize]);

  // Combine initial filters with URL filters, giving URL precedence
  const currentFilters: InteractionSearchFilters = useMemo(() => ({
    ...options?.initialFilters,
    ...filtersFromUrl,
  }), [options?.initialFilters, filtersFromUrl]);

  const {
    data: searchData,
    isLoading,
    error,
    refetch,
  } = useQuery<InteractionSearchResults, Error>({
    queryKey: ['interaction-search', currentFilters],
    queryFn: () => interactionsService.searchInteractions(currentFilters),
    staleTime: 30 * 1000, // 30 seconds
    enabled: options?.enabled !== false, // Allow disabling the query
  });

  const hasActiveFilters = useCallback(() => {
    return Object.values(currentFilters).some(
      (value) =>
        (Array.isArray(value) && value.length > 0) ||
        (typeof value === 'string' && value.trim() !== '' && value !== 'interaction_date' && value !== 'desc') ||
        (typeof value === 'number' && value !== 1 && value !== pageSize)
    );
  }, [currentFilters, pageSize]);

  return {
    interactions: searchData?.interactions || [],
    total: searchData?.total || 0,
    isLoading,
    error,
    filters: currentFilters,
    refetch,
    hasActiveFilters,
  };
};

