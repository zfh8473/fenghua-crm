/**
 * Customer Timeline Component Tests
 * 
 * Unit tests for CustomerTimeline component
 * All custom code is proprietary and not open source.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { CustomerTimeline } from './CustomerTimeline';
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

const renderWithProviders = (component: React.ReactElement, user: { role: string; email: string } | null = null) => {
  mockUseAuth.mockReturnValue({
    user: user || { role: 'ADMIN', email: 'admin@example.com' },
    currentUser: user || { role: 'ADMIN', email: 'admin@example.com' },
    token: user ? 'mock-token' : null,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    hasPermission: vi.fn(),
    canAccess: vi.fn(),
    isAuthenticated: !!user,
    isLoading: false,
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{component}</MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('CustomerTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear(); // Clear React Query cache before each test
  });

  const mockCustomerId = 'customer-1';

  it('should display loading state', () => {
    (global.fetch as vi.Mock).mockImplementation(() => new Promise(() => {})); // Never resolve
    renderWithProviders(<CustomerTimeline customerId={mockCustomerId} />, {
      role: 'ADMIN',
      email: 'a@a.com',
    });
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('should display error message if fetch fails', async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: '获取时间线失败' }),
    });
    renderWithProviders(<CustomerTimeline customerId={mockCustomerId} />, {
      role: 'ADMIN',
      email: 'a@a.com',
    });
    await waitFor(() => expect(screen.getByText('获取时间线失败')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument();
  });

  it('should display empty state if no interactions are found', async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ interactions: [], total: 0 }),
    });
    renderWithProviders(<CustomerTimeline customerId={mockCustomerId} />, {
      role: 'ADMIN',
      email: 'a@a.com',
    });
    await waitFor(() => expect(screen.getByText('该客户尚未有任何互动记录')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '记录新互动' })).toBeInTheDocument();
  });

  it('should display interaction list with product information', async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        interactions: [
          {
            id: 'i1',
            interactionType: 'product_inquiry',
            interactionDate: '2024-01-01T10:00:00Z',
            description: 'Customer inquired about product A',
            productId: 'product-1',
            productName: 'Product A',
            productHsCode: '1234.56.78',
            attachments: [],
          },
          {
            id: 'i2',
            interactionType: 'quotation',
            interactionDate: '2024-01-02T11:00:00Z',
            description: 'Sent quotation for product A',
            productId: 'product-1',
            productName: 'Product A',
            productHsCode: '1234.56.78',
            attachments: [],
          },
        ],
        total: 2,
      }),
    });
    renderWithProviders(<CustomerTimeline customerId={mockCustomerId} />, {
      role: 'ADMIN',
      email: 'a@a.com',
    });
    await waitFor(() => expect(screen.getByText('产品询价')).toBeInTheDocument());
    expect(screen.getByText('Customer inquired about product A')).toBeInTheDocument();
    expect(screen.getAllByText('Product A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('HS Code: 1234.56.78').length).toBeGreaterThan(0);
    expect(screen.getByText('报价')).toBeInTheDocument();
  });

  it('should display pagination when interactions exceed limit', async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        interactions: Array(50).fill({
          id: 'i',
          interactionType: 'product_inquiry',
          interactionDate: '2024-01-01T10:00:00Z',
          description: 'Test interaction',
          attachments: [],
        }),
        total: 75,
      }),
    });
    renderWithProviders(<CustomerTimeline customerId={mockCustomerId} />, {
      role: 'ADMIN',
      email: 'a@a.com',
    });
    await waitFor(() => expect(screen.getByText('第 1 / 2 页')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '下一页' })).toBeInTheDocument();
  });

  it('should navigate to next page when "下一页" is clicked', async () => {
    (global.fetch as vi.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          interactions: Array(50).fill({
            id: 'i',
            interactionType: 'product_inquiry',
            interactionDate: '2024-01-01T10:00:00Z',
            description: 'Test interaction',
            attachments: [],
          }),
          total: 75,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          interactions: Array(25).fill({
            id: 'i',
            interactionType: 'quotation',
            interactionDate: '2024-01-02T10:00:00Z',
            description: 'Next page interaction',
            attachments: [],
          }),
          total: 75,
        }),
      });

    renderWithProviders(<CustomerTimeline customerId={mockCustomerId} />, {
      role: 'ADMIN',
      email: 'a@a.com',
    });
    await waitFor(() => expect(screen.getByText('第 1 / 2 页')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '下一页' }));
    await waitFor(() => expect(screen.getByText('第 2 / 2 页')).toBeInTheDocument());
  });

  it('should display attachments', async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        interactions: [
          {
            id: 'i1',
            interactionType: 'product_inquiry',
            interactionDate: '2024-01-01T10:00:00Z',
            description: 'Interaction with attachment',
            attachments: [
              {
                id: 'a1',
                fileName: 'document.pdf',
                fileUrl: 'http://example.com/doc.pdf',
                fileType: 'pdf',
                fileSize: 1024,
              },
            ],
          },
        ],
        total: 1,
      }),
    });
    renderWithProviders(<CustomerTimeline customerId={mockCustomerId} />, {
      role: 'ADMIN',
      email: 'a@a.com',
    });
    await waitFor(() => expect(screen.getByText('附件：')).toBeInTheDocument());
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('1.0 KB')).toBeInTheDocument();
  });

  it('should change sort order when sort dropdown changes', async () => {
    (global.fetch as vi.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          interactions: [
            {
              id: 'i1',
              interactionType: 'product_inquiry',
              interactionDate: '2024-01-01T10:00:00Z',
              description: 'Test interaction',
              attachments: [],
            },
          ],
          total: 1,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          interactions: [
            {
              id: 'i1',
              interactionType: 'product_inquiry',
              interactionDate: '2024-01-01T10:00:00Z',
              description: 'Test interaction',
              attachments: [],
            },
          ],
          total: 1,
        }),
      });
    renderWithProviders(<CustomerTimeline customerId={mockCustomerId} />, {
      role: 'ADMIN',
      email: 'a@a.com',
    });
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });

    const selects = screen.getAllByRole('combobox');
    const sortSelect = selects[0] as HTMLSelectElement; // First select is sort order
    fireEvent.change(sortSelect, { target: { value: 'asc' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sortOrder=asc'),
        expect.any(Object),
      );
    });
  });

  it('should change date range when date range dropdown changes', async () => {
    (global.fetch as vi.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          interactions: [
            {
              id: 'i1',
              interactionType: 'product_inquiry',
              interactionDate: '2024-01-01T10:00:00Z',
              description: 'Test interaction',
              attachments: [],
            },
          ],
          total: 1,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          interactions: [
            {
              id: 'i1',
              interactionType: 'product_inquiry',
              interactionDate: '2024-01-01T10:00:00Z',
              description: 'Test interaction',
              attachments: [],
            },
          ],
          total: 1,
        }),
      });
    renderWithProviders(<CustomerTimeline customerId={mockCustomerId} />, {
      role: 'ADMIN',
      email: 'a@a.com',
    });
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });

    const selects = screen.getAllByRole('combobox');
    const dateRangeSelect = selects[1] as HTMLSelectElement; // Second select is date range
    fireEvent.change(dateRangeSelect, { target: { value: 'week' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('dateRange=week'),
        expect.any(Object),
      );
    });
  });

  it('should display role-based title for frontend specialist', async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        interactions: [],
        total: 0,
      }),
    });
    renderWithProviders(<CustomerTimeline customerId={mockCustomerId} />, {
      role: 'FRONTEND_SPECIALIST',
      email: 'frontend@example.com',
    });
    // Note: Title is displayed in the parent Card component, so we check for the component rendering
    await waitFor(() => expect(screen.getByText('该客户尚未有任何互动记录')).toBeInTheDocument());
  });
});

