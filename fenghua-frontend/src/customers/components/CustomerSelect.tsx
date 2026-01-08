/**
 * Customer Select Component
 * 
 * Single-select customer search and selection component
 * Similar to ProductMultiSelect but for single customer selection
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '../../components/ui/Input';
import { Customer, customersService } from '../customers.service';
import { isFrontendSpecialist, isBackendSpecialist } from '../../common/constants/roles';

interface CustomerSelectProps {
  selectedCustomer: Customer | null;
  onChange: (customer: Customer | null) => void;
  userRole?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  /** Customer IDs to exclude from search results */
  excludeIds?: string[];
}

export const CustomerSelect: React.FC<CustomerSelectProps> = ({
  selectedCustomer,
  onChange,
  userRole,
  placeholder = '搜索客户名称或客户代码...',
  disabled = false,
  error = false,
  errorMessage,
  excludeIds = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const excludeIdsRef = useRef<string[]>(excludeIds);

  // Determine fixed customer type for specialists
  const fixedCustomerType = userRole && isFrontendSpecialist(userRole)
    ? 'BUYER'
    : userRole && isBackendSpecialist(userRole)
    ? 'SUPPLIER'
    : undefined;

  // Keep excludeIds ref up to date
  useEffect(() => {
    excludeIdsRef.current = excludeIds;
  }, [excludeIds]);

  /**
   * Search customers with debounce
   *
   * @param query - Search query string
   */
  const searchCustomers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setLoading(true);
    setSearchError(null);
    try {
      const response = await customersService.getCustomers({
        search: query.trim(),
        customerType: fixedCustomerType as 'BUYER' | 'SUPPLIER' | undefined,
        limit: 20,
      });
      // Filter out excluded IDs using ref to avoid dependency
      const filtered = response.customers.filter(
        (customer) => !excludeIdsRef.current.includes(customer.id),
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Failed to search customers:', error);
      setSearchError('搜索客户失败，请重试');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [fixedCustomerType]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchCustomers(searchQuery);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchCustomers]);

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
        if (!searchQuery && selectedCustomer) {
          onChange(null);
        }
        break;
    }
  };

  /**
   * Handle customer selection
   */
  const handleSelect = (customer: Customer) => {
    onChange(customer);
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
      if (selectedCustomer) {
        // If customer is selected, clicking input clears selection
        onChange(null);
        setSearchQuery('');
        setIsOpen(true);
      } else {
        setIsOpen(true);
        if (searchQuery.trim()) {
          searchCustomers(searchQuery);
        }
      }
    }
  };

  /**
   * Handle remove selected customer
   */
  const handleRemove = () => {
    onChange(null);
    setSearchQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Display value: show selected customer name or search query
  const displayValue = selectedCustomer ? selectedCustomer.name : searchQuery;

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={selectedCustomer ? selectedCustomer.name : placeholder}
        error={error}
        errorMessage={errorMessage || searchError}
        disabled={disabled}
        rightIcon={
          loading ? (
            <span className="text-monday-text-secondary animate-spin">⏳</span>
          ) : selectedCustomer ? (
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
        aria-label="选择客户"
        onFocus={selectedCustomer ? undefined : handleInputFocus}
      />

      {/* Selected customer display */}
      {selectedCustomer && (
        <div className="mt-monday-2 p-monday-2 bg-primary-blue/10 border border-primary-blue/20 rounded-monday-md flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-monday-sm font-medium text-monday-text truncate">
              {selectedCustomer.name}
            </p>
            {selectedCustomer.customerCode && (
              <p className="text-monday-xs text-monday-text-secondary truncate">
                {selectedCustomer.customerCode}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="ml-monday-2 text-primary-blue hover:text-primary-blue-dark flex-shrink-0"
            aria-label={`移除 ${selectedCustomer.name}`}
          >
            ✕
          </button>
        </div>
      )}

      {/* Search results dropdown */}
      {isOpen && !selectedCustomer && (
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
              未找到匹配的客户
            </div>
          ) : searchResults.length > 0 ? (
            <ul role="listbox" className="py-monday-1">
              {searchResults.map((customer, index) => (
                <li
                  key={customer.id}
                  role="option"
                  aria-selected={highlightedIndex === index}
                  className={`
                    px-monday-3 py-monday-2 cursor-pointer transition-colors
                    ${highlightedIndex === index
                      ? 'bg-primary-blue/10 text-primary-blue'
                      : 'hover:bg-monday-bg-secondary text-monday-text'
                    }
                  `}
                  onClick={() => handleSelect(customer)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-monday-sm font-medium truncate">{customer.name}</p>
                      {customer.customerCode && (
                        <p className="text-monday-xs text-monday-text-secondary truncate">
                          {customer.customerCode}
                        </p>
                      )}
                    </div>
                    {customer.customerType && (
                      <span className="ml-monday-2 px-monday-1 py-monday-0.5 text-monday-xs bg-monday-bg-secondary rounded text-monday-text-secondary flex-shrink-0">
                        {customer.customerType === 'BUYER' ? '采购商' : '供应商'}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-monday-4 text-center text-monday-text-secondary">
              输入客户名称或代码开始搜索
            </div>
          )}
        </div>
      )}
    </div>
  );
};

