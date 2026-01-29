/**
 * Product Multi-Select Component
 *
 * Multi-select searchable dropdown for selecting products
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Product, productsService } from '../products.service';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

/**
 * Story 20.9: Category color mapping for product category labels
 * Pill-shaped labels with color coding based on category type
 * Based on reference design: blue, purple, green, orange
 */
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  '汽车配件': { bg: 'bg-blue-100', text: 'text-blue-700' },
  '化工产品': { bg: 'bg-purple-100', text: 'text-purple-700' },
  '办公用品': { bg: 'bg-green-100', text: 'text-green-700' },
  '纺织品': { bg: 'bg-orange-100', text: 'text-orange-700' },
  '电子设备': { bg: 'bg-blue-100', text: 'text-blue-700' },
  '仪器设备': { bg: 'bg-purple-100', text: 'text-purple-700' },
  '原材料': { bg: 'bg-green-100', text: 'text-green-700' },
  '家居用品': { bg: 'bg-orange-100', text: 'text-orange-700' },
  '机械设备': { bg: 'bg-blue-100', text: 'text-blue-700' },
};

/**
 * Get category color classes, with default fallback for unknown categories
 */
const getCategoryColorClasses = (category?: string): { bg: string; text: string } => {
  if (!category) {
    return { bg: 'bg-gray-100', text: 'text-gray-700' };
  }
  return CATEGORY_COLORS[category] || { bg: 'bg-gray-100', text: 'text-gray-700' };
};

/**
 * Props for ProductMultiSelect component
 */
interface ProductMultiSelectProps {
  /** List of currently selected products */
  selectedProducts: Product[];
  /** Callback function when product selection changes */
  onChange: (products: Product[]) => void;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether to show error state */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Product IDs to exclude from search results */
  excludeIds?: string[];
  /** Allowed products list - if provided, only these products can be selected */
  allowedProducts?: Product[];
  /** Story 20.9: Optional label to display (for better layout control) */
  label?: string;
  /** Story 20.9: Whether label is required */
  required?: boolean;
}

export const ProductMultiSelect: React.FC<ProductMultiSelectProps> = ({
  selectedProducts = [],
  onChange,
  placeholder = '搜索产品名称、HS编码或类别...',
  disabled = false,
  error = false,
  errorMessage,
  excludeIds = [],
  allowedProducts,
  label,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedProductsRef = useRef<Product[]>(selectedProducts || []);
  const excludeIdsRef = useRef<string[]>(excludeIds || []);
  const allowedProductsRef = useRef<Product[] | undefined>(allowedProducts);

  // Keep selectedProducts, excludeIds, and allowedProducts refs up to date
  useEffect(() => {
    selectedProductsRef.current = selectedProducts || [];
  }, [selectedProducts]);

  useEffect(() => {
    excludeIdsRef.current = excludeIds;
  }, [excludeIds]);

  useEffect(() => {
    allowedProductsRef.current = allowedProducts;
  }, [allowedProducts]);

  /**
   * Search products with debounce
   * If allowedProducts is provided, search within that list only
   *
   * @param query - Search query string
   */
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setLoading(true);
    setSearchError(null);
    try {
      let products: Product[] = [];
      
      // If allowedProducts is provided, search within that list only
      if (allowedProductsRef.current && allowedProductsRef.current.length > 0) {
        const queryLower = query.trim().toLowerCase();
        products = allowedProductsRef.current.filter(
          (product) =>
            product.name.toLowerCase().includes(queryLower) ||
            product.hsCode?.toLowerCase().includes(queryLower) ||
            product.category?.toLowerCase().includes(queryLower),
        );
      } else {
        // Otherwise, use the API search
        const response = await productsService.getProducts({
          search: query.trim(),
          status: 'active', // Only show active products
          limit: 20,
        });
        products = response.products;
      }
      
      // Filter out already selected products and excluded IDs using ref to avoid dependency
      const filtered = products.filter(
        (product) =>
          !selectedProductsRef.current.some((selected) => selected.id === product.id) &&
          !excludeIdsRef.current.includes(product.id),
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Failed to search products:', error);
      setSearchResults([]);
      setSearchError('搜索失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchProducts(searchQuery);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchProducts]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            prev < searchResults.length - 1 ? prev + 1 : prev,
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && searchResults[highlightedIndex]) {
          handleSelect(searchResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;
    }
  };

  /**
   * Handle product selection
   *
   * @param product - The product to select
   */
  const handleSelect = (product: Product) => {
    const currentSelected = selectedProducts || [];
    if (currentSelected.some((p) => p.id === product.id)) {
      return; // Already selected
    }
    onChange([...currentSelected, product]);
    setSearchQuery('');
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  /**
   * Handle product removal
   *
   * @param productId - The ID of the product to remove
   */
  const handleRemove = (productId: string) => {
    const currentSelected = selectedProducts || [];
    onChange(currentSelected.filter((p) => p.id !== productId));
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  /**
   * Handle input focus
   */
  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  /**
   * Get available products (filtered allowed products or search results)
   * Story 20.9: Keep selected products in the list (only filter excluded IDs)
   */
  const getAvailableProducts = useCallback((): Product[] => {
    if (allowedProducts && allowedProducts.length > 0) {
      // Story 20.9: Only filter out excluded products, keep selected products visible
      return allowedProducts.filter(
        (product) => !excludeIds.includes(product.id),
      );
    }
    return searchResults;
  }, [allowedProducts, excludeIds, searchResults]);

  const availableProducts = getAvailableProducts();
  // Show card view when allowedProducts is provided (even if empty array)
  // Only show search dropdown when allowedProducts is undefined (free search mode)
  const showCardView = allowedProducts !== undefined;

  // Story 20.9: Filter products by search query
  const filteredProducts = availableProducts.filter((product) => {
    if (!searchQuery.trim()) return true;
    const queryLower = searchQuery.trim().toLowerCase();
    return (
      product.name.toLowerCase().includes(queryLower) ||
      product.hsCode?.toLowerCase().includes(queryLower) ||
      product.category?.toLowerCase().includes(queryLower)
    );
  });

  return (
    <div ref={containerRef} className="relative max-w-xl">
      {/* Card view - show when allowedProducts exist and count is reasonable */}
      {showCardView ? (
        <div className="space-y-monday-2">
          {/* Story 20.9: Header with label and selection badge - compact layout */}
          <div className="flex items-center justify-between mb-monday-2">
            <div className="flex items-center gap-monday-2 flex-wrap">
              {label && (
                <h3 className="text-sm font-semibold text-gray-900">
                  {label} {required && <span className="text-red-500">*</span>}
                </h3>
              )}
            </div>
            
            {/* Story 20.9: Clear button - compact */}
            {selectedProducts.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  // Clear all selections
                  onChange([]);
                }}
                className="text-xs text-gray-600 hover:text-red-600 underline"
              >
                清空
              </button>
            )}
          </div>

          {/* Story 20.9: Search input with icon - compact */}
          <div className="mb-monday-2 relative">
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder="搜索产品名称、HS编码或类别..."
              disabled={disabled}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none text-xs"
            />
          </div>

          {/* Story 20.9: Hint message removed - product cards are self-explanatory */}

          {/* Available products grid */}
          {/* Story 20.9: Responsive grid layout matching reference design */}
          {filteredProducts.length > 0 ? (
            <div 
              className="grid grid-cols-2 gap-2.5 max-h-[200px] md:max-h-[240px] overflow-y-auto will-change-transform"
              aria-label="产品选择列表"
              role="listbox"
            >
              {filteredProducts.map((product) => {
                const isSelected = selectedProducts.some((p) => p.id === product.id);
                const categoryColors = getCategoryColorClasses(product.category);
                
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSelected={isSelected}
                    disabled={disabled}
                    categoryColors={categoryColors}
                    onSelect={() => handleSelect(product)}
                    onRemove={() => handleRemove(product.id)}
                  />
                );
              })}
            </div>
          ) : searchQuery.trim() ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-2">没有找到匹配的产品</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  inputRef.current?.focus();
                }}
                className="text-sky-600 hover:text-sky-700 font-medium text-sm"
              >
                清空搜索
              </button>
            </div>
          ) : (
            <div className="p-monday-4 text-center text-monday-text-secondary border border-gray-200 rounded-monday-md">
              {/* Story 20.9: Error handling - Show friendly empty state */}
              {allowedProducts && allowedProducts.length === 0 ? (
                <div className="flex flex-col items-center gap-monday-2">
                  <span className="text-2xl opacity-50">📦</span>
                  <p className="text-monday-sm font-medium">该客户暂无关联产品</p>
                  <p className="text-monday-xs text-monday-text-placeholder">
                    请先在产品管理或客户管理界面创建关联
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-monday-2">
                  <span className="text-2xl opacity-50">🔍</span>
                  <p className="text-monday-sm font-medium">未找到匹配的产品</p>
                  <p className="text-monday-xs text-monday-text-placeholder">
                    请尝试其他搜索关键词
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Story 20.9: Stats + 错误提示放在控件底部 */}
          {(filteredProducts.length > 0 || (error && errorMessage)) && (
            <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
              {filteredProducts.length > 0 && (
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>显示 {filteredProducts.length} 个产品{searchQuery.trim() ? ' (已过滤)' : ''}</span>
                  {selectedProducts.length > 0 && (
                    <span className="font-medium text-sky-600">
                      已选择 {selectedProducts.length} / {allowedProducts?.length || 0}
                    </span>
                  )}
                </div>
              )}
              {error && errorMessage && (
                <p className="text-xs text-red-500 font-medium" role="alert">
                  {errorMessage}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Traditional search dropdown view */}
          <Input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            error={error}
            errorMessage={errorMessage}
            disabled={disabled}
            rightIcon={
              loading ? (
                <span className="text-monday-text-secondary animate-spin">⏳</span>
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsOpen(false);
                  }}
                  className="text-monday-text-secondary hover:text-monday-text cursor-pointer"
                  aria-label="清除搜索"
                >
                  ✕
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!disabled) {
                      setIsOpen(!isOpen);
                      inputRef.current?.focus();
                    }
                  }}
                  className="text-monday-text-secondary hover:text-monday-text cursor-pointer"
                  tabIndex={-1}
                  aria-label={isOpen ? '关闭下拉列表' : '打开下拉列表'}
                >
                  {isOpen ? '▲' : '▼'}
                </button>
              )
            }
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-label="搜索产品"
          />

          {/* Selected products count */}
          {(selectedProducts || []).length > 0 && (
            <div className="mt-monday-2 text-monday-xs text-monday-text-secondary">
              已选择 {(selectedProducts || []).length} 个产品
            </div>
          )}

          {/* Selected products tags */}
          {(selectedProducts || []).length > 0 && (
            <div className="mt-monday-2 flex flex-wrap gap-monday-2">
              {(selectedProducts || []).map((product) => (
                <div
                  key={product.id}
                  className="inline-flex items-center gap-monday-1 px-monday-2 py-monday-1 bg-primary-blue/10 border border-primary-blue/20 rounded-monday-md text-monday-sm"
                >
                  <span className="text-monday-text font-medium">{product.name}</span>
                  {product.hsCode && (
                    <span className="text-monday-text-secondary text-monday-xs">
                      ({product.hsCode})
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(product.id)}
                    className="text-primary-blue hover:text-primary-blue-dark ml-monday-1"
                    aria-label={`移除 ${product.name}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Dropdown results */}
          {isOpen && !disabled && (
            <div className="absolute z-50 w-full mt-monday-1 bg-white border border-monday-border rounded-monday-md shadow-lg max-h-[300px] overflow-y-auto">
              {loading && searchQuery ? (
                <div className="p-monday-4 text-center text-monday-text-secondary">
                  <span className="animate-spin">⏳</span> 搜索中...
                </div>
              ) : searchError ? (
                <div className="p-monday-4 text-center text-red-500">
                  {searchError}
                </div>
              ) : searchResults.length === 0 && searchQuery ? (
                <div className="p-monday-4 text-center text-monday-text-secondary">
                  未找到匹配的产品
                </div>
              ) : searchResults.length > 0 ? (
                <ul role="listbox" className="py-monday-1">
                  {searchResults.map((product, index) => (
                    <li
                      key={product.id}
                      role="option"
                      aria-selected={highlightedIndex === index}
                      className={`
                        px-monday-3 py-monday-2 cursor-pointer transition-colors
                        ${highlightedIndex === index
                          ? 'bg-primary-blue/10 text-primary-blue'
                          : 'hover:bg-monday-bg-secondary text-monday-text'
                        }
                      `}
                      onClick={() => handleSelect(product)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-monday-sm font-medium truncate">{product.name}</p>
                          {product.hsCode && (
                            <p className="text-monday-xs text-monday-text-secondary truncate">
                              HS编码: {product.hsCode}
                            </p>
                          )}
                        </div>
                        {product.category && (
                          <span className="ml-monday-2 px-monday-1 py-monday-0.5 text-monday-xs bg-monday-bg-secondary rounded text-monday-text-secondary flex-shrink-0">
                            {product.category}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-monday-4 text-center text-monday-text-secondary">
                  输入产品名称、HS编码或类别开始搜索
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

/**
 * Story 20.9: Product Card Component matching reference design
 * Uses button element instead of Card component for better interaction
 * Memoized for performance optimization when rendering many products
 */
interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  disabled: boolean;
  categoryColors: { bg: string; text: string };
  onSelect: () => void;
  onRemove: () => void;
}

const ProductCard: React.FC<ProductCardProps> = memo(({
  product,
  isSelected,
  disabled,
  categoryColors,
  onSelect,
  onRemove,
}) => {
  const handleClick = () => {
    if (!disabled) {
      if (isSelected) {
        onRemove();
      } else {
        onSelect();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    // Story 20.9: Keyboard navigation support (Tab to navigate, Enter/Space to select)
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Story 20.9: Responsive styling - use CSS classes for responsive behavior
  // 3 columns on desktop (lg), 2 columns on tablet (md), 1 column on mobile
  // Match reference design: smaller padding and text on 3-column, larger on 2-column

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={`
        relative text-left p-3 rounded-md border-2 transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1
        ${isSelected
          ? 'bg-sky-50 border-sky-500 shadow-sm'
          : 'bg-white border-gray-200 hover:border-sky-300 hover:bg-gray-50 shadow-sm hover:shadow'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      tabIndex={disabled ? -1 : 0}
      role="option"
      aria-selected={isSelected}
      aria-label={isSelected ? `已选择：${product.name}` : `未选择：${product.name}`}
    >
      {/* Story 20.9: Checkmark icon in top-right corner */}
      {isSelected && (
        <div className="absolute w-5 h-5 top-2 right-2 rounded-full bg-sky-500 flex items-center justify-center shadow-sm" aria-hidden="true">
          <svg className="text-white" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
      )}
      
      {/* Story 20.9: Content - larger layout */}
      <div className="pr-6">
        <h4 className={`font-semibold text-sm mb-1 ${isSelected ? 'text-sky-900' : 'text-gray-900'} leading-tight`}>
          {product.name}
        </h4>
        <div className="flex items-center gap-2 flex-wrap">
          {product.hsCode && (
            <p className={`text-xs ${isSelected ? 'text-sky-700' : 'text-gray-600'}`}>
              {product.hsCode}
            </p>
          )}
          {product.category && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${categoryColors.bg} ${categoryColors.text}`}>
              <span className="w-1 h-1 rounded-full bg-current"></span>
              {product.category}
            </span>
          )}
        </div>
      </div>
    </button>
  );
});

ProductCard.displayName = 'ProductCard';

