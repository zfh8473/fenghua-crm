/**
 * Customer Product Interaction History Component Tests
 * 
 * Unit tests for CustomerProductInteractionHistory component
 * All custom code is proprietary and not open source.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { CustomerProductInteractionHistory } from './CustomerProductInteractionHistory';
import { useAuth } from '../../auth/AuthContext';

// Mock useAuth hook
vi.mock('../../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

// Mock fetch API
global.fetch = vi.fn();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  mockUseAuth.mockReturnValue({
    user: { role: 'ADMIN', email: 'admin@example.com' },
    currentUser: { role: 'ADMIN', email: 'admin@example.com' },
    token: 'mock-token',
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    hasPermission: vi.fn(),
    canAccess: vi.fn(),
    isAuthenticated: true,
    isLoading: false,
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{component}</MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('CustomerProductInteractionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear(); // Clear React Query cache before each test
  });

  const mockCustomerId = 'customer-1';
  const mockProductId = 'product-1';

  it('should display loading state', () => {
    (global.fetch as vi.Mock).mockImplementation(() => new Promise(() => {})); // Never resolve
    renderWithProviders(
      <CustomerProductInteractionHistory customerId={mockCustomerId} productId={mockProductId} />,
    );
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('should display error message if fetch fails', async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: '获取互动历史失败' }),
    });
    renderWithProviders(
      <CustomerProductInteractionHistory customerId={mockCustomerId} productId={mockProductId} />,
    );
    await waitFor(() => expect(screen.getByText('获取互动历史失败')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument();
  });

  it('should display permission error for 403', async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ message: '您没有权限查看互动历史' }),
    });
    renderWithProviders(
      <CustomerProductInteractionHistory customerId={mockCustomerId} productId={mockProductId} />,
    );
    await waitFor(() => expect(screen.getByText('您没有权限查看互动历史')).toBeInTheDocument());
  });

  it('should display not found error for 404', async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: '客户或产品不存在' }),
    });
    renderWithProviders(
      <CustomerProductInteractionHistory customerId={mockCustomerId} productId={mockProductId} />,
    );
    await waitFor(() => expect(screen.getByText('客户或产品不存在')).toBeInTheDocument());
  });

  it('should display empty state if no interactions exist', async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ interactions: [], total: 0 }),
    });
    renderWithProviders(
      <CustomerProductInteractionHistory customerId={mockCustomerId} productId={mockProductId} />,
    );
    await waitFor(() =>
      expect(screen.getByText('该客户与该产品尚未有任何互动记录')).toBeInTheDocument(),
    );
    expect(screen.getByText('记录新互动')).toBeInTheDocument();
  });

  it('should display interaction list', async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        interactions: [
          {
            id: 'interaction-1',
            interactionType: 'product_inquiry',
            interactionDate: '2024-01-01T00:00:00Z',
            description: 'Test interaction',
            status: 'active',
            createdAt: '2024-01-01T00:00:00Z',
            createdBy: 'user-1',
            creator: {
              email: 'user@example.com',
              firstName: 'John',
              lastName: 'Doe',
            },
            attachments: [],
          },
        ],
        total: 1,
      }),
    });
    renderWithProviders(
      <CustomerProductInteractionHistory customerId={mockCustomerId} productId={mockProductId} />,
    );
    await waitFor(() => expect(screen.getByText('产品询价')).toBeInTheDocument());
    expect(screen.getByText('Test interaction')).toBeInTheDocument();
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
  });

  it('should display attachments', async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        interactions: [
          {
            id: 'interaction-1',
            interactionType: 'product_inquiry',
            interactionDate: '2024-01-01T00:00:00Z',
            description: 'Test interaction',
            createdAt: '2024-01-01T00:00:00Z',
            attachments: [
              {
                id: 'attachment-1',
                fileName: 'test.pdf',
                fileUrl: 'https://example.com/test.pdf',
                fileType: 'pdf',
                fileSize: 1024,
              },
            ],
          },
        ],
        total: 1,
      }),
    });
    renderWithProviders(
      <CustomerProductInteractionHistory customerId={mockCustomerId} productId={mockProductId} />,
    );
    await waitFor(() => expect(screen.getByText('test.pdf')).toBeInTheDocument());
    expect(screen.getByText('(1.0 KB)')).toBeInTheDocument();
  });

  it('should display pagination when interactions exceed limit', async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        interactions: Array(20).fill({
          id: 'interaction',
          interactionType: 'product_inquiry',
          interactionDate: '2024-01-01T00:00:00Z',
          description: 'Test',
          createdAt: '2024-01-01T00:00:00Z',
          attachments: [],
        }),
        total: 25,
      }),
    });
    renderWithProviders(
      <CustomerProductInteractionHistory customerId={mockCustomerId} productId={mockProductId} />,
    );
    await waitFor(() => expect(screen.getByText(/共 25 条记录/)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '下一页' })).toBeInTheDocument();
  });

  it('should navigate to next page when "下一页" is clicked', async () => {
    (global.fetch as vi.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          interactions: Array(20).fill({
            id: 'interaction',
            interactionType: 'product_inquiry',
            interactionDate: '2024-01-01T00:00:00Z',
            description: 'Test',
            createdAt: '2024-01-01T00:00:00Z',
            attachments: [],
          }),
          total: 25,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          interactions: Array(5).fill({
            id: 'interaction',
            interactionType: 'product_inquiry',
            interactionDate: '2024-01-01T00:00:00Z',
            description: 'Test',
            createdAt: '2024-01-01T00:00:00Z',
            attachments: [],
          }),
          total: 25,
        }),
      });

    renderWithProviders(
      <CustomerProductInteractionHistory customerId={mockCustomerId} productId={mockProductId} />,
    );
    await waitFor(() => expect(screen.getByText(/第 1 页/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '下一页' }));
    await waitFor(() => expect(screen.getByText(/第 2 页/)).toBeInTheDocument());
  });

  it('should use correct query key', async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ interactions: [], total: 0 }),
    });
    renderWithProviders(
      <CustomerProductInteractionHistory customerId={mockCustomerId} productId={mockProductId} />,
    );
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        `/api/customers/${mockCustomerId}/interactions?productId=${mockProductId}&page=1&limit=20`,
      ),
      expect.any(Object),
    );
  });
});



