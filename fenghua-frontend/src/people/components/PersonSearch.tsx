/**
 * Person Search Component
 * 
 * Search input with filters (company, importance) and debounce
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { CustomerSelect } from '../../customers/components/CustomerSelect';
import { Customer } from '../../customers/customers.service';
import { HomeModuleIcon } from '../../components/icons/HomeModuleIcons';

export interface PersonSearchFilters {
  search?: string;
  companyId?: string;
  isImportant?: boolean;
}

interface PersonSearchProps {
  onSearch: (filters: PersonSearchFilters) => void;
  initialFilters?: PersonSearchFilters;
  loading?: boolean;
  userRole?: string;
}

export const PersonSearch: React.FC<PersonSearchProps> = ({
  onSearch,
  initialFilters = {},
  loading = false,
  userRole,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [selectedCompany, setSelectedCompany] = useState<Customer | null>(null);
  const [isImportant, setIsImportant] = useState<boolean | undefined>(initialFilters.isImportant);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onSearchRef = useRef(onSearch);

  // Keep onSearch ref up to date
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  /**
   * Build search filters from current state
   */
  const buildFilters = useCallback((): PersonSearchFilters => {
    const filters: PersonSearchFilters = {};
    
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    
    if (selectedCompany) {
      filters.companyId = selectedCompany.id;
    }
    
    if (isImportant !== undefined) {
      filters.isImportant = isImportant;
    }
    
    return filters;
  }, [searchQuery, selectedCompany, isImportant]);

  // Debounced search - trigger onSearch when search query or filters change
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
  }, [searchQuery, selectedCompany, isImportant, buildFilters]);

  const handleClear = () => {
    setSearchQuery('');
    setSelectedCompany(null);
    setIsImportant(undefined);
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

  const hasActiveFilters = searchQuery.trim() || selectedCompany || isImportant !== undefined;

  return (
    <div className="space-y-monday-4">
      <div className="flex flex-col sm:flex-row gap-monday-3 items-start sm:items-center">
        <div className="flex-1 w-full sm:w-auto min-w-0">
          <Input
            type="text"
            placeholder="搜索联系人姓名、邮箱、职位或部门..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full"
            disabled={loading}
            rightIcon={
              loading ? (
                <HomeModuleIcon name="arrowPath" className="w-4 h-4 text-monday-text-secondary animate-spin" />
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-monday-text-secondary hover:text-monday-text cursor-pointer transition-colors duration-200"
                  aria-label="清除搜索"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <HomeModuleIcon name="magnifyingGlass" className="w-4 h-4 text-monday-text-secondary" />
              )
            }
          />
        </div>

        <div className="w-full sm:w-auto min-w-[200px]">
          <CustomerSelect
            selectedCustomer={selectedCompany}
            onChange={setSelectedCompany}
            userRole={userRole}
            placeholder="筛选客户..."
            disabled={loading}
          />
        </div>

        <div className="flex items-center gap-monday-2">
          <input
            type="checkbox"
            id="isImportant"
            checked={isImportant === true}
            onChange={(e) => setIsImportant(e.target.checked ? true : undefined)}
            disabled={loading}
            className="w-4 h-4 text-uipro-cta border-gray-300 rounded focus:ring-uipro-cta cursor-pointer transition-colors duration-200"
          />
          <label htmlFor="isImportant" className="text-monday-sm font-medium text-uipro-text cursor-pointer">
            仅显示重要联系人
          </label>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={loading}
            className="text-monday-text-secondary hover:text-monday-text cursor-pointer transition-colors duration-200"
          >
            清除
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-monday-2 text-monday-sm text-monday-text-secondary">
          <HomeModuleIcon name="arrowPath" className="w-4 h-4 animate-spin" />
          <span>正在搜索...</span>
        </div>
      )}
    </div>
  );
};
