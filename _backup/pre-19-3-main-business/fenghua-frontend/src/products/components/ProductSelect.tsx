/**
 * Product Select Component
 * 
 * Single-select product search and selection component
 * Similar to CustomerSelect but for single product selection
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '../../components/ui/Input';
import { Product, productsService } from '../products.service';

interface ProductSelectProps {
  selectedProduct: Product | null;
  onChange: (product: Product | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  /** Product IDs to exclude from search results */
  excludeIds?: string[];
  /** Allowed products list - if provided, only these products can be selected */
  allowedProducts?: Product[];
}

export const ProductSelect: React.FC<ProductSelectProps> = ({
  selectedProduct,
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
  const excludeIdsRef = useRef<string[]>(excludeIds);
  const allowedProductsRef = useRef<Product[] | undefined>(allowedProducts);

  // Keep excludeIds and allowedProducts refs up to date
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
      
      // Filter out excluded IDs using ref to avoid dependency
      const filtered = products.filter(
        (product) => !excludeIdsRef.current.includes(product.id),
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Failed to search products:', error);
      setSearchError('搜索产品失败，请重试');
      setSearchResults([]);
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
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
        if (isOpen && highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
          handleSelect(searchResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;
      case 'Backspace':
        if (!searchQuery && selectedProduct) {
          onChange(null);
        }
        break;
    }
  };

  /**
   * Handle product selection
   */
  const handleSelect = (product: Product) => {
    onChange(product);
    setSearchQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
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
      if (selectedProduct) {
        // If product is selected, clicking input clears selection
        onChange(null);
        setSearchQuery('');
        setIsOpen(true);
      } else {
        setIsOpen(true);
        if (searchQuery.trim()) {
          searchProducts(searchQuery);
        }
      }
    }
  };

  /**
   * Handle remove selected product
   */
  const handleRemove = () => {
    onChange(null);
    setSearchQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Display value: show selected product name or search query
  const displayValue = selectedProduct ? selectedProduct.name : searchQuery;

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={selectedProduct ? selectedProduct.name : placeholder}
        error={error}
        errorMessage={errorMessage || searchError}
        disabled={disabled}
        rightIcon={
          loading ? (
            <span className="text-monday-text-secondary animate-spin">⏳</span>
          ) : selectedProduct ? (
            <button
              type="button"
              onClick={handleRemove}
              className="text-monday-text-secondary hover:text-red-500 cursor-pointer"
              aria-label="清除选择"
            >
              ✕
            </button>
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
        aria-label="选择产品"
      />

      {/* Selected product display */}
      {selectedProduct && (
        <div className="mt-monday-2 p-monday-2 bg-primary-blue/10 border border-primary-blue/20 rounded-monday-md flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-monday-sm font-medium text-monday-text truncate">
              {selectedProduct.name}
            </p>
            {selectedProduct.hsCode && (
              <p className="text-monday-xs text-monday-text-secondary truncate">
                HS编码: {selectedProduct.hsCode}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="ml-monday-2 text-primary-blue hover:text-primary-blue-dark flex-shrink-0"
            aria-label={`移除 ${selectedProduct.name}`}
          >
            ✕
          </button>
        </div>
      )}

      {/* Search results dropdown */}
      {isOpen && !selectedProduct && (
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

