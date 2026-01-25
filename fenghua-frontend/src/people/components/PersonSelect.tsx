/**
 * Person Select Component
 * 
 * Single-select person (contact) search and selection component
 * Similar to CustomerSelect but for person selection
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '../../components/ui/Input';
import { Person, peopleService } from '../people.service';
import { getPersonName } from '../utils/person-utils';

interface PersonSelectProps {
  selectedPerson: Person | null;
  onChange: (person: Person | null) => void;
  /** Company ID to filter people by (optional, if provided only shows people from this company) */
  companyId?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  /** Person IDs to exclude from search results */
  excludeIds?: string[];
}

export const PersonSelect: React.FC<PersonSelectProps> = ({
  selectedPerson,
  onChange,
  companyId,
  placeholder = '搜索联系人（姓名、邮箱、职位）...',
  disabled = false,
  error = false,
  errorMessage,
  excludeIds = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const excludeIdsRef = useRef<string[]>(excludeIds);

  // Keep excludeIds ref up to date
  useEffect(() => {
    excludeIdsRef.current = excludeIds;
  }, [excludeIds]);

  /**
   * Search people with debounce
   *
   * @param query - Search query string
   */
  const searchPeople = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setLoading(true);
    setSearchError(null);
    try {
      const response = await peopleService.getPeople({
        companyId,
        search: query.trim(),
        limit: 20,
      });
      // Filter out excluded IDs using ref to avoid dependency
      const filtered = response.people.filter(
        (person) => !excludeIdsRef.current.includes(person.id),
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Failed to search people:', error);
      setSearchError('搜索联系人失败，请重试');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchPeople(searchQuery);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchPeople]);

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
        if (!searchQuery && selectedPerson) {
          onChange(null);
        }
        break;
    }
  };

  /**
   * Handle person selection
   */
  const handleSelect = (person: Person) => {
    onChange(person);
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
      if (selectedPerson) {
        // If person is selected, clicking input clears selection
        onChange(null);
        setSearchQuery('');
        setIsOpen(true);
      } else {
        setIsOpen(true);
        if (searchQuery.trim()) {
          searchPeople(searchQuery);
        }
      }
    }
  };

  /**
   * Handle remove selected person
   */
  const handleRemove = () => {
    onChange(null);
    setSearchQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Display value: show selected person name or search query
  const displayValue = selectedPerson ? getPersonName(selectedPerson) : searchQuery;

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={selectedPerson ? undefined : handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={selectedPerson ? getPersonName(selectedPerson) : placeholder}
        error={error}
        errorMessage={errorMessage || searchError}
        disabled={disabled}
        rightIcon={
          loading ? (
            <span className="text-monday-text-secondary animate-spin">⏳</span>
          ) : selectedPerson ? (
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
        aria-label="选择联系人"
      />

      {/* Selected person display */}
      {selectedPerson && (
        <div className="mt-monday-2 p-monday-2 bg-primary-blue/10 border border-primary-blue/20 rounded-monday-md flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-monday-sm font-medium text-monday-text truncate">
              {getPersonName(selectedPerson)}
              {selectedPerson.isImportant && (
                <span className="ml-monday-1 text-yellow-500" title="重要联系人">★</span>
              )}
            </p>
            {(selectedPerson.jobTitle || selectedPerson.email) && (
              <p className="text-monday-xs text-monday-text-secondary truncate">
                {selectedPerson.jobTitle && selectedPerson.department
                  ? `${selectedPerson.jobTitle} · ${selectedPerson.department}`
                  : selectedPerson.jobTitle || selectedPerson.email}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="ml-monday-2 text-primary-blue hover:text-primary-blue-dark flex-shrink-0"
            aria-label={`移除 ${getPersonName(selectedPerson)}`}
          >
            ✕
          </button>
        </div>
      )}

      {/* Search results dropdown */}
      {isOpen && !selectedPerson && (
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
              未找到匹配的联系人
            </div>
          ) : searchResults.length > 0 ? (
            <ul role="listbox" className="py-monday-1">
              {searchResults.map((person, index) => (
                <li
                  key={person.id}
                  role="option"
                  aria-selected={highlightedIndex === index}
                  className={`
                    px-monday-3 py-monday-2 cursor-pointer transition-colors
                    ${highlightedIndex === index
                      ? 'bg-primary-blue/10 text-primary-blue'
                      : 'hover:bg-monday-bg-secondary text-monday-text'
                    }
                  `}
                  onClick={() => handleSelect(person)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-monday-sm font-medium truncate">
                        {getPersonName(person)}
                        {person.isImportant && (
                          <span className="ml-monday-1 text-yellow-500" title="重要联系人">★</span>
                        )}
                      </p>
                      {(person.jobTitle || person.email) && (
                        <p className="text-monday-xs text-monday-text-secondary truncate">
                          {person.jobTitle && person.department
                            ? `${person.jobTitle} · ${person.department}`
                            : person.jobTitle || person.email}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-monday-4 text-center text-monday-text-secondary">
              输入联系人姓名、邮箱或职位开始搜索
            </div>
          )}
        </div>
      )}
    </div>
  );
};
