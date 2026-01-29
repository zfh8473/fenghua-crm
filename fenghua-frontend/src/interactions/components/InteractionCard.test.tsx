/**
 * InteractionCard Component Tests
 * 
 * Unit tests for InteractionCard component
 * All custom code is proprietary and not open source.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { InteractionCard } from './InteractionCard';
import { Interaction, InteractionStatus, FrontendInteractionType } from '../services/interactions.service';

// Mock useQuery
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

import { useQuery } from '@tanstack/react-query';

const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;

describe('InteractionCard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
    
    // Mock useQuery to return empty users array by default
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
  });

  const mockInteraction: Interaction = {
    id: '1',
    customerId: 'customer-1',
    customerName: 'Test Customer',
    interactionType: FrontendInteractionType.INITIAL_CONTACT,
    interactionDate: new Date().toISOString(),
    description: 'Test interaction description',
    status: InteractionStatus.IN_PROGRESS,
    createdAt: new Date().toISOString(),
    createdBy: 'user-1',
    products: [
      { id: 'product-1', name: 'Product 1' },
      { id: 'product-2', name: 'Product 2' },
    ],
    personName: 'John Doe',
  };

  const renderComponent = (interaction: Interaction, onInteractionClick?: (interaction: Interaction) => void) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <InteractionCard interaction={interaction} onInteractionClick={onInteractionClick} />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('should render interaction card with all information', () => {
    renderComponent(mockInteraction);
    
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
    expect(screen.getByText('Test interaction description')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
  });

  it('should display interaction type badge', () => {
    renderComponent(mockInteraction);
    expect(screen.getByText('初步接触')).toBeInTheDocument();
  });

  it('should display status badge', () => {
    renderComponent(mockInteraction);
    expect(screen.getByText('进行中')).toBeInTheDocument();
  });

  it('should display relative time', async () => {
    renderComponent(mockInteraction);
    await waitFor(() => {
      expect(screen.getByText('刚刚')).toBeInTheDocument();
    });
  });

  it('should display product tags with "+N" when more than 2 products', () => {
    const interactionWithManyProducts = {
      ...mockInteraction,
      products: [
        { id: 'product-1', name: 'Product 1' },
        { id: 'product-2', name: 'Product 2' },
        { id: 'product-3', name: 'Product 3' },
      ],
    };
    
    renderComponent(interactionWithManyProducts);
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('+1个')).toBeInTheDocument();
  });

  it('should call onInteractionClick when card is clicked', () => {
    const handleClick = vi.fn();
    const { container } = renderComponent(mockInteraction, handleClick);
    
    const card = container.querySelector('[class*="cursor-pointer"]');
    card?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
    expect(handleClick).toHaveBeenCalledWith(mockInteraction);
  });

  it('should handle interaction without description', () => {
    const interactionWithoutDescription = {
      ...mockInteraction,
      description: undefined,
    };
    
    renderComponent(interactionWithoutDescription);
    expect(screen.queryByText('Test interaction description')).not.toBeInTheDocument();
  });

  it('should handle interaction without person name', () => {
    const interactionWithoutPerson = {
      ...mockInteraction,
      personName: undefined,
    };
    
    renderComponent(interactionWithoutPerson);
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('should handle interaction without products', () => {
    const interactionWithoutProducts = {
      ...mockInteraction,
      products: undefined,
    };
    
    renderComponent(interactionWithoutProducts);
    expect(screen.queryByText('Product 1')).not.toBeInTheDocument();
  });
});
