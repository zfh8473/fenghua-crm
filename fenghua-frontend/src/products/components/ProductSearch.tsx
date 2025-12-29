/**
 * Product Search Component
 * 
 * Search input with category filter and debounce
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useRef } from 'react';
import { Category } from '../../product-categories/categories.service';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export interface ProductSearchFilters {
  search?: string;
  category?: string;
}

interface ProductSearchProps {
  categories: Category[];
  onSearch: (filters: ProductSearchFilters) => void;
  initialFilters?: ProductSearchFilters;
  loading?: boolean;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  categories,
  onSearch,
  initialFilters = {},
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || '');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onSearchRef = useRef(onSearch);

  // Keep onSearch ref up to date
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Debounced search - trigger onSearch when search query or category changes
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      const filters: ProductSearchFilters = {};
      
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }
      
      if (selectedCategory) {
        filters.category = selectedCategory;
      }

      onSearchRef.current(filters);
    }, 500); // 500ms debounce

    // Cleanup on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedCategory]);

  const handleClear = () => {
    setSearchQuery('');
    setSelectedCategory('');
    // Clear search immediately
    onSearch({});
  };

  const hasActiveFilters = searchQuery.trim() || selectedCategory;

  return (
    <div className="space-y-monday-4">
      <div className="flex flex-col sm:flex-row gap-monday-3 items-start sm:items-center">
        <div className="flex-1 w-full sm:w-auto min-w-0">
          <Input
            type="text"
            placeholder="搜索产品名称或HS编码..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

        <div className="w-full sm:w-auto min-w-[200px]">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={loading}
            className="w-full px-monday-3 py-monday-2 text-monday-sm text-monday-text bg-monday-surface border border-gray-200 rounded-monday-md focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-colors font-normal hover:border-gray-300"
          >
            <option value="">所有类别</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

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

