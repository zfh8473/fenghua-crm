/**
 * InteractionSearch Component Tests
 * 
 * Unit tests for InteractionSearch component including quick search and advanced filters
 * All custom code is proprietary and not open source.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InteractionSearch } from './InteractionSearch';
import { InteractionSearchFilters } from '../services/interactions.service';

// Mock services
vi.mock('../../product-categories/categories.service', () => ({
  categoriesService: {
    getAll: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../users/users.service', () => ({
  getUsers: vi.fn().mockResolvedValue([]),
}));

describe('InteractionSearch', () => {
  let queryClient: QueryClient;
  let onSearch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    onSearch = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const renderComponent = (initialFilters?: InteractionSearchFilters) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <InteractionSearch onSearch={onSearch} initialFilters={initialFilters} />
      </QueryClientProvider>
    );
  };

  it('should render quick search input', () => {
    renderComponent();
    expect(screen.getByPlaceholderText('快速搜索客户、产品或互动内容...')).toBeInTheDocument();
  });

  it('should render advanced filter button', () => {
    renderComponent();
    expect(screen.getByText('高级筛选')).toBeInTheDocument();
  });

  it('should toggle advanced filters when button is clicked', () => {
    const { container } = renderComponent();
    const button = screen.getByText('高级筛选');
    
    // Initially collapsed - check that advanced filters container has max-h-0
    const advancedFiltersContainer = container.querySelector('[class*="max-h-0"]');
    expect(advancedFiltersContainer).toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(button);
    vi.advanceTimersByTime(350); // Wait for animation
    
    // After expansion, the container should have max-h-[1000px]
    const expandedContainer = container.querySelector('[class*="max-h-\\[1000px\\]"]');
    expect(expandedContainer).toBeInTheDocument();
  });

  it('should debounce quick search input (300ms)', () => {
    renderComponent();
    const input = screen.getByPlaceholderText('快速搜索客户、产品或互动内容...');
    
    fireEvent.change(input, { target: { value: 'test' } });
    
    // Should not call onSearch immediately
    expect(onSearch).not.toHaveBeenCalled();
    
    // Advance timer by 300ms
    vi.advanceTimersByTime(300);
    
    // onSearch should be called after debounce
    expect(onSearch).toHaveBeenCalled();
  });

  it('should call onSearch with search filter when quick search changes', () => {
    renderComponent();
    const input = screen.getByPlaceholderText('快速搜索客户、产品或互动内容...');
    
    fireEvent.change(input, { target: { value: 'test query' } });
    vi.advanceTimersByTime(300);
    
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'test query',
      })
    );
  });

  it('should display reset button when filters are active', () => {
    renderComponent({ search: 'test' });
    expect(screen.getByText('重置')).toBeInTheDocument();
  });

  it('should clear all filters when reset button is clicked', () => {
    renderComponent({ search: 'test', interactionTypes: ['initial_contact'] });
    
    const resetButton = screen.getByText('重置');
    fireEvent.click(resetButton);
    
    vi.advanceTimersByTime(300);
    
    // onSearch should be called with cleared filters
    expect(onSearch).toHaveBeenCalled();
    const lastCall = onSearch.mock.calls[onSearch.mock.calls.length - 1][0];
    // After clearing, search should be empty string or undefined
    expect(lastCall.search === '' || lastCall.search === undefined).toBe(true);
  });

  it('should initialize quick search from initialFilters', () => {
    renderComponent({ search: 'initial query' });
    const input = screen.getByPlaceholderText('快速搜索客户、产品或互动内容...') as HTMLInputElement;
    expect(input.value).toBe('initial query');
  });

  it('should render all 8 advanced filter fields when expanded', () => {
    renderComponent();
    const button = screen.getByText('高级筛选');
    fireEvent.click(button);
    vi.advanceTimersByTime(350); // Wait for animation
    
    expect(screen.getByText('互动类型')).toBeInTheDocument();
    expect(screen.getByText('状态')).toBeInTheDocument();
    expect(screen.getByText('产品类别')).toBeInTheDocument();
    expect(screen.getByText('开始日期')).toBeInTheDocument();
    expect(screen.getByText('结束日期')).toBeInTheDocument();
    expect(screen.getByText('客户')).toBeInTheDocument();
    expect(screen.getByText('产品')).toBeInTheDocument();
    expect(screen.getByText('创建者')).toBeInTheDocument();
  });
});
