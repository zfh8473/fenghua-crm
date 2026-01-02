/**
 * Customers Service
 * 
 * Handles customer API calls
 * All custom code is proprietary and not open source.
 */

const API_URL = (import.meta.env?.VITE_API_BASE_URL as string) || (import.meta.env?.VITE_BACKEND_URL as string) || 'http://localhost:3001';

export interface Customer {
  id: string;
  name: string;
  customerCode: string;
  customerType: 'BUYER' | 'SUPPLIER';
  domainName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  industry?: string;
  employees?: number;
  website?: string;
  phone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateCustomerDto {
  name: string;
  customerCode: string;
  customerType: 'BUYER' | 'SUPPLIER';
  domainName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  industry?: string;
  employees?: number;
  website?: string;
  phone?: string;
  notes?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  customerCode?: string;
  domainName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  industry?: string;
  employees?: number;
  website?: string;
  phone?: string;
  notes?: string;
}

export interface CustomerQueryParams {
  customerType?: 'BUYER' | 'SUPPLIER';
  name?: string;
  customerCode?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CustomerListResponse {
  customers: Customer[];
  total: number;
}

class CustomersService {
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
   * Get all customers with pagination and filters
   */
  async getCustomers(params?: CustomerQueryParams): Promise<CustomerListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.customerType) queryParams.append('customerType', params.customerType);
    if (params?.name) queryParams.append('name', params.name);
    if (params?.customerCode) queryParams.append('customerCode', params.customerCode);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/customers${queryString ? `?${queryString}` : ''}`;

    return this.request<CustomerListResponse>(endpoint);
  }

  /**
   * Get one customer by ID
   */
  async getCustomer(id: string): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`);
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: CreateCustomerDto): Promise<Customer> {
    return this.request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a customer
   */
  async updateCustomer(id: string, data: UpdateCustomerDto): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(id: string): Promise<void> {
    return this.request<void>(`/customers/${id}`, {
      method: 'DELETE',
    });
  }
}

export const customersService = new CustomersService();

