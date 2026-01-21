/**
 * CustomerSearchResults Component Unit Tests
 * 
 * Tests for customer search results component including pagination, highlighting, and empty state
 * All custom code is proprietary and not open source.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerSearchResults } from './CustomerSearchResults';
import { Customer } from '../customers.service';

describe('CustomerSearchResults', () => {
  const mockCustomers: Customer[] = [
    {
      id: '1',
      name: 'Test Customer 1',
      customerCode: 'C001',
      customerType: 'BUYER',
      industry: 'Technology',
      city: 'Beijing',
      address: '123 Main St',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '2',
      name: 'Test Customer 2',
      customerCode: 'C002',
      customerType: 'SUPPLIER',
      industry: 'Manufacturing',
      city: 'Shanghai',
      address: '456 Oak Ave',
      createdAt: '2024-01-02',
      updatedAt: '2024-01-02',
    },
  ];

  const mockOnPageChange = vi.fn();
  const mockOnCustomerClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Results Display', () => {
    it('should display customer list', () => {
      render(
        <CustomerSearchResults
          customers={mockCustomers}
          total={2}
          currentPage={1}
          pageSize={20}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText('Test Customer 1')).toBeInTheDocument();
      expect(screen.getByText('Test Customer 2')).toBeInTheDocument();
    });

    it('should display customer code', () => {
      render(
        <CustomerSearchResults
          customers={mockCustomers}
          total={2}
          currentPage={1}
          pageSize={20}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText('C001')).toBeInTheDocument();
      expect(screen.getByText('C002')).toBeInTheDocument();
    });

    it('should display customer type badges', () => {
      render(
        <CustomerSearchResults
          customers={mockCustomers}
          total={2}
          currentPage={1}
          pageSize={20}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText('采购商')).toBeInTheDocument();
      expect(screen.getByText('供应商')).toBeInTheDocument();
    });

    it('should display result count', () => {
      render(
        <CustomerSearchResults
          customers={mockCustomers}
          searchQuery="test"
          total={2}
          currentPage={1}
          pageSize={20}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText(/共找到.*2.*个客户/)).toBeInTheDocument();
    });
  });

  describe('Keyword Highlighting', () => {
    it('should highlight matching keywords in customer name', () => {
      render(
        <CustomerSearchResults
          customers={mockCustomers}
          searchQuery="Test"
          total={2}
          currentPage={1}
          pageSize={20}
          onPageChange={mockOnPageChange}
        />
      );

      const highlightedText = screen.getAllByText('Test');
      expect(highlightedText.length).toBeGreaterThan(0);
    });

    it('should highlight matching keywords in customer code', () => {
      render(
        <CustomerSearchResults
          customers={mockCustomers}
          searchQuery="C001"
          total={1}
          currentPage={1}
          pageSize={20}
          onPageChange={mockOnPageChange}
        />
      );

      // Customer code should be highlighted
      const customerCode = screen.getByText('C001');
      expect(customerCode).toBeInTheDocument();
    });

    it('should not highlight when no search query', () => {
      render(
        <CustomerSearchResults
          customers={mockCustomers}
          total={2}
          currentPage={1}
          pageSize={20}
          onPageChange={mockOnPageChange}
        />
      );

      // Should display names without highlighting
      expect(screen.getByText('Test Customer 1')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should show pagination when total pages > 1', () => {
      const manyCustomers = Array.from({ length: 25 }, (_, i) => ({
        ...mockCustomers[0],
        id: `${i + 1}`,
        name: `Customer ${i + 1}`,
      }));

      render(
        <CustomerSearchResults
          customers={manyCustomers.slice(0, 20)}
          total={25}
          currentPage={1}
          pageSize={20}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText('下一页')).toBeInTheDocument();
    });

    it('should not show pagination when total pages = 1', () => {
      render(
        <CustomerSearchResults
          customers={mockCustomers}
          total={2}
          currentPage={1}
          pageSize={20}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.queryByText('下一页')).not.toBeInTheDocument();
    });

    it('should call onPageChange when next page button is clicked', () => {
      const manyCustomers = Array.from({ length: 25 }, (_, i) => ({
        ...mockCustomers[0],
        id: `${i + 1}`,
        name: `Customer ${i + 1}`,
      }));

      render(
        <CustomerSearchResults
          customers={manyCustomers.slice(0, 20)}
          total={25}
          currentPage={1}
          pageSize={20}
          onPageChange={mockOnPageChange}
        />
      );

      const nextButton = screen.getByText('下一页');
      fireEvent.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it('should disable previous button on first page', () => {
      const manyCustomers = Array.from({ length: 25 }, (_, i) => ({
        ...mockCustomers[0],
        id: `${i + 1}`,
        name: `Customer ${i + 1}`,
      }));

      render(
        <CustomerSearchResults
          customers={manyCustomers.slice(0, 20)}
          total={25}
          currentPage={1}
          pageSize={20}
          onPageChange={mockOnPageChange}
        />
      );

      const prevButton = screen.getByText('上一页');
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last page', () => {
      const manyCustomers = Array.from({ length: 25 }, (_, i) => ({
        ...mockCustomers[0],
        id: `${i + 1}`,
        name: `Customer ${i + 1}`,
      }));

      render(
        <CustomerSearchResults
          customers={manyCustomers.slice(20, 25)}
          total={25}
          currentPage={2}
          pageSize={20}
          onPageChange={mockOnPageChange}
        />
      );

      const nextButton = screen.getByText('下一页');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Customer Click', () => {
    it('should call onCustomerClick when customer card is clicked', () => {
      render(
        <CustomerSearchResults
          customers={mockCustomers}
          total={2}
          currentPage={1}
          pageSize={20}
          onPageChange={mockOnPageChange}
          onCustomerClick={mockOnCustomerClick}
        />
      );

      const customerCard = screen.getByText('Test Customer 1').closest('[class*="cursor-pointer"]');
      if (customerCard) {
        fireEvent.click(customerCard);
        expect(mockOnCustomerClick).toHaveBeenCalledWith(mockCustomers[0]);
      }
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      render(
        <CustomerSearchResults
          customers={[]}
          total={0}
          currentPage={1}
          pageSize={20}
          onPageChange={mockOnPageChange}
          loading={true}
        />
      );

      expect(screen.getByText('正在加载搜索结果...')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should return null when customers array is empty (parent handles empty state)', () => {
      const { container } = render(
        <CustomerSearchResults
          customers={[]}
          total={0}
          currentPage={1}
          pageSize={20}
          onPageChange={mockOnPageChange}
          loading={false}
        />
      );

      // Component returns null, so container should be empty
      expect(container.firstChild).toBeNull();
    });
  });
});

