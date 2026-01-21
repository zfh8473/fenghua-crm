/**
 * Product Multi-Select Component
 *
 * Multi-select searchable dropdown for selecting products
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Product, productsService } from '../products.service';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

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
}

export const ProductMultiSelect: React.FC<ProductMultiSelectProps> = ({
  selectedProducts,
  onChange,
  placeholder = '搜索产品名称、HS编码或类别...',
  disabled = false,
  error = false,
  errorMessage,
  excludeIds = [],
  allowedProducts,
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
  const selectedProductsRef = useRef<Product[]>(selectedProducts);
  const excludeIdsRef = useRef<string[]>(excludeIds);
  const allowedProductsRef = useRef<Product[] | undefined>(allowedProducts);

  // Keep selectedProducts, excludeIds, and allowedProducts refs up to date
  useEffect(() => {
    selectedProductsRef.current = selectedProducts;
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
    if (selectedProducts.some((p) => p.id === product.id)) {
      return; // Already selected
    }
    onChange([...selectedProducts, product]);
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
    onChange(selectedProducts.filter((p) => p.id !== productId));
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

  return (
    <div ref={containerRef} className="relative">
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
      {selectedProducts.length > 0 && (
        <div className="mt-monday-2 text-monday-xs text-monday-text-secondary">
          已选择 {selectedProducts.length} 个产品
        </div>
      )}

      {/* Selected products tags */}
      {selectedProducts.length > 0 && (
        <div className="mt-monday-2 flex flex-wrap gap-monday-2">
          {selectedProducts.map((product) => (
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
    </div>
  );
};

