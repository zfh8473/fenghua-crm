/**
 * CustomerSearch Component Unit Tests
 * 
 * Tests for customer search component including debounce, clear, and type filter
 * All custom code is proprietary and not open source.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerSearch, CustomerSearchFilters } from './CustomerSearch';
import { isFrontendSpecialist, isBackendSpecialist, isDirector, isAdmin } from '../../common/constants/roles';

// Mock role helper functions
vi.mock('../../common/constants/roles', () => ({
  isFrontendSpecialist: vi.fn(),
  isBackendSpecialist: vi.fn(),
  isDirector: vi.fn(),
  isAdmin: vi.fn(),
}));

describe('CustomerSearch', () => {
  const mockOnSearch = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Search Input', () => {
    it('should render search input with placeholder', () => {
      render(<CustomerSearch onSearch={mockOnSearch} onClear={mockOnClear} />);
      
      const input = screen.getByPlaceholderText('搜索客户名称或客户代码...');
      expect(input).toBeInTheDocument();
    });

    it('should call onSearch with debounce when typing', async () => {
      render(<CustomerSearch onSearch={mockOnSearch} onClear={mockOnClear} />);
      
      const input = screen.getByPlaceholderText('搜索客户名称或客户代码...');
      fireEvent.change(input, { target: { value: 'test' } });

      // Should not call immediately
      expect(mockOnSearch).not.toHaveBeenCalled();

      // Fast-forward 500ms
      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith({ search: 'test' });
      });
    });

    it('should clear debounce timeout when typing again', async () => {
      render(<CustomerSearch onSearch={mockOnSearch} onClear={mockOnClear} />);
      
      const input = screen.getByPlaceholderText('搜索客户名称或客户代码...');
      
      fireEvent.change(input, { target: { value: 'te' } });
      vi.advanceTimersByTime(300);
      
      fireEvent.change(input, { target: { value: 'test' } });
      vi.advanceTimersByTime(500);

      await waitFor(() => {
        // Should only be called once with final value
        expect(mockOnSearch).toHaveBeenCalledTimes(1);
        expect(mockOnSearch).toHaveBeenCalledWith({ search: 'test' });
      });
    });

    it('should trigger search immediately on Enter key', async () => {
      render(<CustomerSearch onSearch={mockOnSearch} onClear={mockOnClear} />);
      
      const input = screen.getByPlaceholderText('搜索客户名称或客户代码...');
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith({ search: 'test' });
      });
    });

    it('should clear search on Escape key', async () => {
      render(<CustomerSearch onSearch={mockOnSearch} onClear={mockOnClear} />);
      
      const input = screen.getByPlaceholderText('搜索客户名称或客户代码...');
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      await waitFor(() => {
        expect(mockOnClear).toHaveBeenCalled();
        expect(input).toHaveValue('');
      });
    });
  });

  describe('Clear Button', () => {
    it('should show clear button when search query exists', () => {
      render(
        <CustomerSearch 
          onSearch={mockOnSearch} 
          onClear={mockOnClear}
          initialFilters={{ search: 'test' }}
        />
      );
      
      const clearButton = screen.getByText('清除');
      expect(clearButton).toBeInTheDocument();
    });

    it('should call onClear when clear button is clicked', async () => {
      render(
        <CustomerSearch 
          onSearch={mockOnSearch} 
          onClear={mockOnClear}
          initialFilters={{ search: 'test' }}
        />
      );
      
      const clearButton = screen.getByText('清除');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(mockOnClear).toHaveBeenCalled();
      });
    });
  });

  describe('Role-Based Customer Type Filter', () => {
    it('should hide type filter for frontend specialist', () => {
      (isFrontendSpecialist as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (isBackendSpecialist as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (isDirector as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (isAdmin as ReturnType<typeof vi.fn>).mockReturnValue(false);

      render(
        <CustomerSearch 
          onSearch={mockOnSearch} 
          onClear={mockOnClear}
          userRole="FRONTEND_SPECIALIST"
        />
      );

      const typeFilter = screen.queryByText('全部类型');
      expect(typeFilter).not.toBeInTheDocument();
    });

    it('should hide type filter for backend specialist', () => {
      (isFrontendSpecialist as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (isBackendSpecialist as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (isDirector as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (isAdmin as ReturnType<typeof vi.fn>).mockReturnValue(false);

      render(
        <CustomerSearch 
          onSearch={mockOnSearch} 
          onClear={mockOnClear}
          userRole="BACKEND_SPECIALIST"
        />
      );

      const typeFilter = screen.queryByText('全部类型');
      expect(typeFilter).not.toBeInTheDocument();
    });

    it('should show type filter for director', () => {
      (isFrontendSpecialist as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (isBackendSpecialist as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (isDirector as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (isAdmin as ReturnType<typeof vi.fn>).mockReturnValue(false);

      render(
        <CustomerSearch 
          onSearch={mockOnSearch} 
          onClear={mockOnClear}
          userRole="DIRECTOR"
        />
      );

      const typeFilter = screen.getByText('全部类型');
      expect(typeFilter).toBeInTheDocument();
    });

    it('should show type filter for admin', () => {
      (isFrontendSpecialist as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (isBackendSpecialist as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (isDirector as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (isAdmin as ReturnType<typeof vi.fn>).mockReturnValue(true);

      render(
        <CustomerSearch 
          onSearch={mockOnSearch} 
          onClear={mockOnClear}
          userRole="ADMIN"
        />
      );

      const typeFilter = screen.getByText('全部类型');
      expect(typeFilter).toBeInTheDocument();
    });

    it('should call onSearch with customer type when type filter changes', async () => {
      (isDirector as ReturnType<typeof vi.fn>).mockReturnValue(true);

      render(
        <CustomerSearch 
          onSearch={mockOnSearch} 
          onClear={mockOnClear}
          userRole="DIRECTOR"
        />
      );

      const typeFilter = screen.getByText('全部类型');
      fireEvent.change(typeFilter, { target: { value: 'BUYER' } });

      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith({ customerType: 'BUYER' });
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      render(
        <CustomerSearch 
          onSearch={mockOnSearch} 
          onClear={mockOnClear}
          loading={true}
        />
      );

      const loadingText = screen.getByText('正在搜索...');
      expect(loadingText).toBeInTheDocument();
    });

    it('should disable input when loading', () => {
      render(
        <CustomerSearch 
          onSearch={mockOnSearch} 
          onClear={mockOnClear}
          loading={true}
        />
      );

      const input = screen.getByPlaceholderText('搜索客户名称或客户代码...');
      expect(input).toBeDisabled();
    });
  });
});

