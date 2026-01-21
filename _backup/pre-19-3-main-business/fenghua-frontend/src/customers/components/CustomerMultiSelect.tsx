/**
 * Customer Multi-Select Component
 * 
 * Multi-select searchable dropdown for selecting customers
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Customer, customersService } from '../customers.service';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { isFrontendSpecialist, isBackendSpecialist } from '../../common/constants/roles';

interface CustomerMultiSelectProps {
  selectedCustomers: Customer[];
  onChange: (customers: Customer[]) => void;
  userRole?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  excludeIds?: string[]; // Customer IDs to exclude from search results
}

export const CustomerMultiSelect: React.FC<CustomerMultiSelectProps> = ({
  selectedCustomers,
  onChange,
  userRole,
  placeholder = '搜索客户名称或代码...',
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
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedCustomersRef = useRef<Customer[]>(selectedCustomers);
  const excludeIdsRef = useRef<string[]>(excludeIds);

  // Determine fixed customer type for specialists
  const fixedCustomerType = userRole && isFrontendSpecialist(userRole)
    ? 'BUYER'
    : userRole && isBackendSpecialist(userRole)
    ? 'SUPPLIER'
    : undefined;

  // Keep selectedCustomers and excludeIds refs up to date
  useEffect(() => {
    selectedCustomersRef.current = selectedCustomers;
  }, [selectedCustomers]);

  useEffect(() => {
    excludeIdsRef.current = excludeIds;
  }, [excludeIds]);

  /**
   * Search customers with debounce
   */
  const searchCustomers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await customersService.getCustomers({
        search: query.trim(),
        customerType: fixedCustomerType,
        limit: 20,
      });
      // Filter out already selected customers and excluded IDs using ref to avoid dependency
      const filtered = response.customers.filter(
        (customer) =>
          !selectedCustomersRef.current.some((selected) => selected.id === customer.id) &&
          !excludeIdsRef.current.includes(customer.id),
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Failed to search customers:', error);
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
   * Handle customer selection
   */
  const handleSelect = (customer: Customer) => {
    if (selectedCustomers.some((c) => c.id === customer.id)) {
      return; // Already selected
    }
    onChange([...selectedCustomers, customer]);
    setSearchQuery('');
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  /**
   * Handle customer removal
   */
  const handleRemove = (customerId: string) => {
    onChange(selectedCustomers.filter((c) => c.id !== customerId));
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
        aria-label="搜索客户"
      />

      {/* Selected customers count */}
      {selectedCustomers.length > 0 && (
        <div className="mt-monday-2 text-monday-xs text-monday-text-secondary">
          已选择 {selectedCustomers.length} 个客户
        </div>
      )}

      {/* Selected customers tags */}
      {selectedCustomers.length > 0 && (
        <div className="mt-monday-2 flex flex-wrap gap-monday-2">
          {selectedCustomers.map((customer) => (
            <div
              key={customer.id}
              className="p-monday-3 bg-monday-bg-secondary rounded-monday-md flex justify-between items-center gap-monday-2"
            >
              <div>
                <p className="text-monday-sm font-medium">{customer.name}</p>
                <p className="text-monday-xs text-monday-text-secondary">{customer.customerCode}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(customer.id)}
                className="text-red-500 hover:text-red-700 min-w-[32px] h-8 p-0"
                aria-label={`移除 ${customer.name}`}
              >
                X
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Dropdown results */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-monday-surface border border-gray-200 rounded-monday-md shadow-monday-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-monday-3 text-monday-sm text-monday-text-secondary text-center">
              <span className="animate-spin">⏳</span>
              <span className="ml-monday-2">正在搜索...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-monday-3 text-monday-sm text-monday-text-secondary text-center">
              {searchQuery.trim() ? '未找到匹配的客户' : '请输入搜索关键词'}
            </div>
          ) : (
            <ul className="py-monday-1" role="listbox">
              {searchResults.map((customer, index) => (
                <li
                  key={customer.id}
                  onClick={() => handleSelect(customer)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(customer);
                    }
                  }}
                  role="option"
                  tabIndex={0}
                  aria-selected={index === highlightedIndex}
                  className={`px-monday-3 py-monday-2 cursor-pointer text-monday-sm transition-colors ${
                    index === highlightedIndex
                      ? 'bg-primary-blue text-white'
                      : 'text-monday-text hover:bg-monday-bg'
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="font-medium">{customer.name}</div>
                  <div className={`text-monday-xs ${
                    index === highlightedIndex ? 'text-white/80' : 'text-monday-text-secondary'
                  }`}>
                    {customer.customerCode} ({customer.customerType === 'BUYER' ? '采购商' : '供应商'})
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

