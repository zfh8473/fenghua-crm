/**
 * EmptyState Component Tests
 * 
 * Unit tests for EmptyState component
 * All custom code is proprietary and not open source.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('should render empty state message', () => {
    render(
      <MemoryRouter>
        <EmptyState />
      </MemoryRouter>
    );
    
    expect(screen.getByText('未找到匹配的互动记录')).toBeInTheDocument();
    expect(screen.getByText('请尝试使用不同的搜索关键词或筛选条件')).toBeInTheDocument();
  });

  it('should display search query when provided', () => {
    render(
      <MemoryRouter>
        <EmptyState searchQuery="test query" />
      </MemoryRouter>
    );
    
    expect(screen.getByText(/没有找到与/)).toBeInTheDocument();
    expect(screen.getByText('test query')).toBeInTheDocument();
  });

  it('should display suggestions list', () => {
    render(
      <MemoryRouter>
        <EmptyState />
      </MemoryRouter>
    );
    
    expect(screen.getByText('搜索建议：')).toBeInTheDocument();
    expect(screen.getByText('检查拼写是否正确')).toBeInTheDocument();
    expect(screen.getByText('尝试使用更通用的关键词')).toBeInTheDocument();
  });

  it('should display "记录新互动" button', () => {
    render(
      <MemoryRouter>
        <EmptyState />
      </MemoryRouter>
    );
    
    const button = screen.getByText('记录新互动');
    expect(button).toBeInTheDocument();
    expect(button.closest('a')).toHaveAttribute('href', '/interactions/create');
  });

  it('should call onClearSearch when clear button is clicked', () => {
    const handleClear = vi.fn();
    render(
      <MemoryRouter>
        <EmptyState searchQuery="test" onClearSearch={handleClear} />
      </MemoryRouter>
    );
    
    const clearButton = screen.getByText('清除搜索条件');
    clearButton.click();
    
    expect(handleClear).toHaveBeenCalled();
  });

  it('should not display clear button when no search query', () => {
    render(
      <MemoryRouter>
        <EmptyState />
      </MemoryRouter>
    );
    
    expect(screen.queryByText('清除搜索条件')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <MemoryRouter>
        <EmptyState className="custom-class" />
      </MemoryRouter>
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
