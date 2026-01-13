/**
 * Product Categories Service
 * 
 * Frontend service for product category management
 * All custom code is proprietary and not open source.
 */

const API_URL = (import.meta.env?.VITE_BACKEND_URL as string) || 'http://localhost:3001';

export interface Category {
  id: string;
  name: string;
  hsCode: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  productCount?: number; // Optional: usage statistics
}

export interface CategoryWithStats extends Category {
  productCount: number; // Required: usage statistics
}

export interface CreateCategoryDto {
  name: string;
  hsCode: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  hsCode?: string;
  description?: string;
}

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('fenghua_auth_token');
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
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
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T; // No content
  }

  return response.json();
}

export const categoriesService = {
  /**
   * Get all categories
   */
  async getAll(includeStats = false): Promise<Category[]> {
    const query = includeStats ? '?includeStats=true' : '';
    return apiRequest<Category[]>(`/product-categories${query}`);
  },

  /**
   * Get one category by ID
   */
  async getById(id: string): Promise<Category> {
    return apiRequest<Category>(`/product-categories/${id}`);
  },

  /**
   * Get category by HS code
   */
  async getByHsCode(hsCode: string): Promise<Category | null> {
    try {
      return await apiRequest<Category>(`/product-categories/by-hs-code/${hsCode}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('404') || errorMessage.includes('不存在')) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Create a new category
   */
  async create(data: CreateCategoryDto): Promise<Category> {
    return apiRequest<Category>('/product-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a category
   */
  async update(id: string, data: UpdateCategoryDto): Promise<Category> {
    return apiRequest<Category>(`/product-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a category (soft delete)
   */
  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/product-categories/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get usage count for a category
   */
  async getUsageCount(id: string): Promise<number> {
    const result = await apiRequest<{ count: number }>(`/product-categories/${id}/usage-count`);
    return result.count;
  },
};

