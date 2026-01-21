/**
 * HS Code Select Component
 * 
 * Searchable dropdown for selecting HS codes from product categories
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useRef } from 'react';
import { Category } from '../../product-categories/categories.service';
import { Input } from './Input';

interface HsCodeSelectProps {
  value: string;
  onChange: (hsCode: string) => void;
  categories: Category[];
  onSelect?: (category: Category) => void; // Callback when a category is selected
  error?: boolean;
  errorMessage?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export const HsCodeSelect: React.FC<HsCodeSelectProps> = ({
  value,
  onChange,
  categories,
  onSelect,
  error = false,
  errorMessage,
  placeholder = '搜索或选择HS编码...',
  required = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get unique HS codes from categories
  const hsCodes = categories.map(cat => ({
    hsCode: cat.hsCode,
    category: cat,
  }));

  // Filter HS codes based on search query
  const filteredHsCodes = searchQuery.trim()
    ? hsCodes.filter(item => 
        item.hsCode.includes(searchQuery) || 
        item.category.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : hsCodes;

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

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < filteredHsCodes.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && filteredHsCodes[highlightedIndex]) {
          handleSelect(filteredHsCodes[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelect = (item: { hsCode: string; category: Category }) => {
    onChange(item.hsCode);
    if (onSelect) {
      onSelect(item.category);
    }
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
    
    // If user types a valid HS code directly, update value
    if (/^[0-9]{6,10}(-[0-9]{2,4})*$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        error={error}
        errorMessage={errorMessage}
        required={required}
        disabled={disabled}
        rightIcon={
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
          >
            {isOpen ? '▲' : '▼'}
          </button>
        }
      />
      
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-monday-surface border border-gray-200 rounded-monday-md shadow-monday-lg max-h-60 overflow-auto">
          {filteredHsCodes.length === 0 ? (
            <div className="p-monday-3 text-monday-sm text-monday-text-secondary text-center">
              未找到匹配的HS编码
            </div>
          ) : (
            <ul className="py-monday-1">
              {filteredHsCodes.map((item, index) => (
                <li
                  key={item.hsCode}
                  onClick={() => handleSelect(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(item);
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
                  <div className="font-mono font-semibold">{item.hsCode}</div>
                  <div className={`text-monday-xs ${
                    index === highlightedIndex ? 'text-white/80' : 'text-monday-text-secondary'
                  }`}>
                    {item.category.name}
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

