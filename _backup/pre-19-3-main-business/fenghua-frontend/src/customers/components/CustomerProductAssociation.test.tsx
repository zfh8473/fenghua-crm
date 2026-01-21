/**
 * CustomerProductAssociation Component Tests
 *
 * Tests for customer product association component including display, empty fields, and permissions
 * All custom code is proprietary and not open source.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { CustomerProductAssociation } from './CustomerProductAssociation';
import { Customer } from '../customers.service';
import { useAuth } from '../../auth/AuthContext';
import { useQuery } from '@tanstack/react-query';

// Mock useAuth hook
vi.mock('../../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;

const mockCustomer: Customer = {
  id: 'customer-123',
  name: 'Test Customer',
  customerType: 'BUYER',
  address: '123 Test St',
  city: 'Test City',
  state: 'Test State',
  country: 'Test Country',
  postalCode: '12345',
  phone: '123-456-7890',
  website: 'https://test.com',
  domainName: 'test.com',
  industry: 'Technology',
  employees: 100,
  customerCode: 'CUST001',
};

const renderWithAuth = (component: React.ReactElement, user: { role: string; email: string } | null = null) => {
  mockUseAuth.mockReturnValue({
    user,
    currentUser: user,
    token: user ? 'mock-token' : null,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    hasPermission: vi.fn(),
    canAccess: vi.fn(),
    isAuthenticated: !!user,
    isLoading: false,
  });

  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('CustomerProductAssociation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderWithAuth(
      <CustomerProductAssociation customerId={mockCustomer.id} customer={mockCustomer} />,
      { role: 'ADMIN', email: 'admin@test.com' },
    );

    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('should display error state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('加载失败'),
      refetch: vi.fn(),
    });

    renderWithAuth(
      <CustomerProductAssociation customerId={mockCustomer.id} customer={mockCustomer} />,
      { role: 'ADMIN', email: 'admin@test.com' },
    );

    expect(screen.getByText('加载失败')).toBeInTheDocument();
    expect(screen.getByText('重试')).toBeInTheDocument();
  });

  it('should display empty state when no products', () => {
    mockUseQuery.mockReturnValue({
      data: { products: [], total: 0 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithAuth(
      <CustomerProductAssociation customerId={mockCustomer.id} customer={mockCustomer} />,
      { role: 'ADMIN', email: 'admin@test.com' },
    );

    expect(screen.getByText('关联的产品')).toBeInTheDocument();
    expect(screen.getByText('该客户尚未与任何产品关联')).toBeInTheDocument();
    expect(screen.getByText('记录互动时关联产品，即可建立关联关系')).toBeInTheDocument();
  });

  it('should display product list', () => {
    const mockProducts = [
      {
        id: 'product-1',
        name: 'Product 1',
        hsCode: '123456',
        interactionCount: 5,
      },
      {
        id: 'product-2',
        name: 'Product 2',
        hsCode: '789012',
        interactionCount: 3,
      },
    ];

    mockUseQuery.mockReturnValue({
      data: { products: mockProducts, total: 2 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithAuth(
      <CustomerProductAssociation customerId={mockCustomer.id} customer={mockCustomer} />,
      { role: 'ADMIN', email: 'admin@test.com' },
    );

    expect(screen.getByText('关联的产品')).toBeInTheDocument();
    expect(screen.getByText('共 2 个产品')).toBeInTheDocument();
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('HS: 123456')).toBeInTheDocument();
    expect(screen.getByText('HS: 789012')).toBeInTheDocument();
    expect(screen.getByText('5 次互动')).toBeInTheDocument();
    expect(screen.getByText('3 次互动')).toBeInTheDocument();
  });

  it('should display pagination when products exceed limit', () => {
    const mockProducts = Array.from({ length: 10 }, (_, i) => ({
      id: `product-${i}`,
      name: `Product ${i}`,
      hsCode: `12345${i}`,
      interactionCount: i + 1,
    }));

    mockUseQuery.mockReturnValue({
      data: { products: mockProducts, total: 25 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithAuth(
      <CustomerProductAssociation customerId={mockCustomer.id} customer={mockCustomer} />,
      { role: 'ADMIN', email: 'admin@test.com' },
    );

    expect(screen.getByText('第 1 页，共 3 页')).toBeInTheDocument();
    expect(screen.getByText('上一页')).toBeInTheDocument();
    expect(screen.getByText('下一页')).toBeInTheDocument();
  });

  it('should disable previous button on first page', () => {
    const mockProducts = Array.from({ length: 10 }, (_, i) => ({
      id: `product-${i}`,
      name: `Product ${i}`,
      hsCode: `12345${i}`,
      interactionCount: i + 1,
    }));

    mockUseQuery.mockReturnValue({
      data: { products: mockProducts, total: 25 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithAuth(
      <CustomerProductAssociation customerId={mockCustomer.id} customer={mockCustomer} />,
      { role: 'ADMIN', email: 'admin@test.com' },
    );

    const prevButton = screen.getByText('上一页').closest('button');
    expect(prevButton).toBeDisabled();
  });

  it('should use correct query key', () => {
    mockUseQuery.mockReturnValue({
      data: { products: [], total: 0 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithAuth(
      <CustomerProductAssociation customerId={mockCustomer.id} customer={mockCustomer} />,
      { role: 'ADMIN', email: 'admin@test.com' },
    );

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['customer-products', mockCustomer.id, 1, 10],
        enabled: true,
        staleTime: 5 * 60 * 1000,
      }),
    );
  });
});

