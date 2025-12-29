/**
 * Products Service
 * 
 * Handles product API calls
 * All custom code is proprietary and not open source.
 */

const API_URL = (import.meta.env?.VITE_BACKEND_URL as string) || 'http://localhost:3001';

export interface Product {
  id: string;
  name: string;
  hsCode: string;
  description?: string;
  category?: string;
  status: 'active' | 'inactive' | 'archived';
  specifications?: Record<string, unknown>;
  imageUrl?: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateProductDto {
  name: string;
  hsCode: string;
  category: string;
  description?: string;
  specifications?: Record<string, unknown>;
  imageUrl?: string;
}

export interface UpdateProductDto {
  name?: string;
  hsCode?: string; // Add HS code to update DTO
  category?: string;
  description?: string;
  specifications?: Record<string, unknown>;
  imageUrl?: string;
  status?: 'active' | 'inactive' | 'archived';
}

export interface ProductQueryParams {
  status?: 'active' | 'inactive' | 'archived';
  category?: string;
  limit?: number;
  offset?: number;
  search?: string;
  includeInactive?: boolean; // Include inactive products in results
}

export interface ProductListResponse {
  products: Product[];
  total: number;
}

class ProductsService {
  private getAuthToken(): string | null {
    return localStorage.getItem('fenghua_auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('未登录，请先登录');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '请求失败' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    // Handle 204 No Content (empty response body)
    if (response.status === 204) {
      return undefined as T;
    }

    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      // If response body is empty, return undefined
      if (!text || text.trim() === '') {
        return undefined as T;
      }
      return JSON.parse(text);
    }

    // For non-JSON responses, return undefined
    return undefined as T;
  }

  /**
   * Get all products with pagination and filters
   */
  async getProducts(params?: ProductQueryParams): Promise<ProductListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.search) queryParams.append('search', params.search);
    // Include includeInactive parameter
    if (params?.includeInactive !== undefined) {
      queryParams.append('includeInactive', params.includeInactive.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ''}`;

    return this.request<ProductListResponse>(endpoint);
  }

  /**
   * Get one product by ID
   */
  async getProduct(id: string): Promise<Product> {
    return this.request<Product>(`/products/${id}`);
  }

  /**
   * Create a new product
   */
  async createProduct(data: CreateProductDto): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a product
   */
  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
    return this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: string): Promise<void> {
    return this.request<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  }
}

export const productsService = new ProductsService();

