/**
 * Multi-Select Component
 * 
 * Generic multi-select searchable dropdown component
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from './Input';
import { Button } from './Button';

/**
 * Generic option type for MultiSelect
 */
export interface MultiSelectOption {
  value: string;
  label: string;
}

/**
 * Props for MultiSelect component
 */
interface MultiSelectProps {
  /** List of available options */
  options: MultiSelectOption[];
  /** List of currently selected option values */
  selectedValues: string[];
  /** Callback function when selection changes */
  onChange: (values: string[]) => void;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Label for the select */
  label?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether to show error state */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Whether the dropdown is open by default */
  defaultOpen?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = '搜索或选择...',
  label,
  disabled = false,
  error = false,
  errorMessage,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedValuesRef = useRef<string[]>(selectedValues);

  // Keep selectedValues ref up to date
  useEffect(() => {
    selectedValuesRef.current = selectedValues;
  }, [selectedValues]);

  // Filter options based on search query
  const filteredOptions = options.filter((option) => {
    if (!searchQuery.trim()) return true;
    const queryLower = searchQuery.trim().toLowerCase();
    return (
      option.label.toLowerCase().includes(queryLower) ||
      option.value.toLowerCase().includes(queryLower)
    );
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const option = filteredOptions[highlightedIndex];
          toggleSelection(option.value);
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        }
        break;
    }
  }, [isOpen, highlightedIndex, filteredOptions, disabled]);

  // Toggle selection of an option
  const toggleSelection = (value: string) => {
    const current = selectedValuesRef.current;
    if (current.includes(value)) {
      onChange(current.filter((v) => v !== value));
    } else {
      onChange([...current, value]);
    }
  };

  // Remove selected option
  const removeSelection = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = selectedValuesRef.current;
    onChange(current.filter((v) => v !== value));
  };

  // Clear all selections
  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  // Get selected option labels
  const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value));

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
          {label}
        </label>
      )}
      <div className="relative">
        <div
          className={`
            flex items-center gap-monday-2 p-monday-2 border rounded-monday-md
            bg-white cursor-pointer min-h-[40px]
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
            ${isOpen ? 'border-primary-blue ring-2 ring-primary-blue ring-opacity-20' : ''}
          `}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          tabIndex={disabled ? -1 : 0}
        >
          <div className="flex-1 flex flex-wrap gap-monday-1 items-center">
            {selectedOptions.length === 0 ? (
              <span className="text-monday-text-secondary text-monday-sm px-monday-2">
                {placeholder}
              </span>
            ) : (
              selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-monday-1 bg-primary-blue bg-opacity-10 text-primary-blue px-monday-2 py-monday-1 rounded text-monday-sm"
                >
                  {option.label}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => removeSelection(option.value, e)}
                      className="hover:bg-primary-blue hover:bg-opacity-20 rounded-full p-monday-0.5"
                      aria-label={`移除 ${option.label}`}
                    >
                      ×
                    </button>
                  )}
                </span>
              ))
            )}
          </div>
          <div className="flex items-center gap-monday-1">
            {selectedOptions.length > 0 && !disabled && (
              <button
                type="button"
                onClick={clearAll}
                className="text-monday-text-secondary hover:text-monday-text p-monday-1"
                aria-label="清除所有选择"
              >
                ×
              </button>
            )}
            <span className="text-monday-text-secondary">▼</span>
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-monday-1 bg-white border border-gray-300 rounded-monday-md shadow-monday-lg max-h-60 overflow-auto">
            <div className="p-monday-2 border-b border-gray-200">
              <Input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(-1);
                }}
                placeholder="搜索..."
                className="w-full"
                autoFocus
              />
            </div>
            <div role="listbox" className="py-monday-1">
              {filteredOptions.length === 0 ? (
                <div className="px-monday-4 py-monday-2 text-monday-text-secondary text-monday-sm">
                  未找到匹配项
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = selectedValues.includes(option.value);
                  const isHighlighted = index === highlightedIndex;
                  return (
                    <div
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      className={`
                        px-monday-4 py-monday-2 cursor-pointer flex items-center gap-monday-2
                        ${isHighlighted ? 'bg-primary-blue bg-opacity-10' : ''}
                        ${isSelected ? 'bg-primary-blue bg-opacity-5' : 'hover:bg-gray-100'}
                      `}
                      onClick={() => toggleSelection(option.value)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="cursor-pointer"
                        tabIndex={-1}
                      />
                      <span className="flex-1">{option.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      {error && errorMessage && (
        <p className="mt-monday-1 text-monday-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
};

