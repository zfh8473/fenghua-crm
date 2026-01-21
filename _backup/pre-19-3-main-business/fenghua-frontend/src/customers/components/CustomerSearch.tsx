/**
 * Customer Search Component
 * 
 * Search input with customer type filter and debounce
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { isFrontendSpecialist, isBackendSpecialist, isDirector, isAdmin } from '../../common/constants/roles';

export interface CustomerSearchFilters {
  search?: string;
  customerType?: 'BUYER' | 'SUPPLIER';
}

interface CustomerSearchProps {
  onSearch: (filters: CustomerSearchFilters) => void;
  initialFilters?: CustomerSearchFilters;
  loading?: boolean;
  userRole?: string;
  inputMode?: 'search' | 'text' | 'none' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal';
}

export const CustomerSearch: React.FC<CustomerSearchProps> = ({
  onSearch,
  initialFilters = {},
  loading = false,
  userRole,
  inputMode = 'text',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [selectedCustomerType, setSelectedCustomerType] = useState<'BUYER' | 'SUPPLIER' | ''>(
    initialFilters.customerType || ''
  );
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onSearchRef = useRef(onSearch);

  // Keep onSearch ref up to date
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Determine if customer type filter should be visible
  const canFilterByType = userRole && (isDirector(userRole) || isAdmin(userRole));
  
  // Determine fixed customer type for specialists
  const fixedCustomerType = userRole && isFrontendSpecialist(userRole) 
    ? 'BUYER' 
    : userRole && isBackendSpecialist(userRole)
    ? 'SUPPLIER'
    : null;

  /**
   * Build search filters from current state
   */
  const buildFilters = useCallback((): CustomerSearchFilters => {
    const filters: CustomerSearchFilters = {};
    
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    
    const customerType = fixedCustomerType || (selectedCustomerType || undefined);
    if (customerType) {
      filters.customerType = customerType as 'BUYER' | 'SUPPLIER';
    }
    
    return filters;
  }, [searchQuery, selectedCustomerType, fixedCustomerType]);

  // Debounced search - trigger onSearch when search query or customer type changes
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      onSearchRef.current(buildFilters());
    }, 500); // 500ms debounce

    // Cleanup on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedCustomerType, fixedCustomerType, buildFilters]);

  const handleClear = () => {
    setSearchQuery('');
    setSelectedCustomerType('');
    // Clear search immediately
    onSearch({});
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Trigger search immediately if Enter is pressed
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      onSearch(buildFilters());
    } else if (e.key === 'Escape') {
      handleClear();
    }
  };

  const hasActiveFilters = searchQuery.trim() || selectedCustomerType;

  return (
    <div className="space-y-monday-4">
      <div className="flex flex-col sm:flex-row gap-monday-3 items-start sm:items-center">
        <div className="flex-1 w-full sm:w-auto min-w-0">
          <Input
            type="text"
            inputMode={inputMode}
            placeholder="搜索客户名称或客户代码..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full"
            disabled={loading}
            rightIcon={
              loading ? (
                <span className="text-monday-text-secondary animate-spin">⏳</span>
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-monday-text-secondary hover:text-monday-text cursor-pointer"
                  aria-label="清除搜索"
                >
                  ✕
                </button>
              ) : (
                <span className="text-monday-text-secondary">🔍</span>
              )
            }
          />
        </div>

        {canFilterByType && (
          <div className="w-full sm:w-auto min-w-[200px]">
            <select
              value={selectedCustomerType}
              onChange={(e) => setSelectedCustomerType(e.target.value ? (e.target.value as 'BUYER' | 'SUPPLIER') : '')}
              disabled={loading}
              className="w-full px-monday-3 py-monday-2 text-monday-sm text-monday-text bg-monday-surface border border-gray-200 rounded-monday-md focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-colors font-normal hover:border-gray-300"
            >
              <option value="">全部类型</option>
              <option value="BUYER">采购商</option>
              <option value="SUPPLIER">供应商</option>
            </select>
          </div>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={loading}
            className="text-monday-text-secondary hover:text-monday-text"
          >
            清除
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-monday-2 text-monday-sm text-monday-text-secondary">
          <span className="animate-spin">⏳</span>
          <span>正在搜索...</span>
        </div>
      )}
    </div>
  );
};

