/**
 * People Service
 * 
 * Handles people (contact) API calls
 * All custom code is proprietary and not open source.
 */

// Use relative path /api to leverage Vite proxy in development
// In production, set VITE_API_BASE_URL to the full backend URL
const API_URL = (import.meta.env?.VITE_API_BASE_URL as string) || (import.meta.env?.VITE_BACKEND_URL as string) || '/api';

/**
 * Customer information in person response (optional)
 */
export interface PersonCompany {
  id: string;
  name: string;
  customerCode?: string;
  customerType?: 'BUYER' | 'SUPPLIER';
}

/**
 * Person (Contact) interface
 */
export interface Person {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  linkedinUrl?: string;
  wechat?: string;
  whatsapp?: string;
  facebook?: string;
  notes?: string;
  companyId: string;
  company?: PersonCompany; // Optional: include company information
  isImportant: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * DTO for creating a new person (contact)
 */
export interface CreatePersonDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  linkedinUrl?: string;
  wechat?: string;
  whatsapp?: string;
  facebook?: string;
  notes?: string;
  companyId: string;
  isImportant?: boolean;
}

/**
 * DTO for updating a person (contact)
 */
export interface UpdatePersonDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  linkedinUrl?: string;
  wechat?: string;
  whatsapp?: string;
  facebook?: string;
  notes?: string;
  companyId?: string;
  isImportant?: boolean;
}

/**
 * Query parameters for fetching people
 */
export interface PersonQueryParams {
  companyId?: string;
  search?: string;
  isImportant?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Response for people list
 */
export interface PersonListResponse {
  people: Person[];
  total: number;
}

/**
 * Interaction record interface (for person interactions)
 */
export interface PersonInteraction {
  id: string;
  productId: string;
  customerId: string;
  personId?: string;
  interactionType: string;
  interactionDate: Date;
  description?: string;
  status: string;
  additionalInfo?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  productName?: string;
  customerName?: string;
}

/**
 * Response for person interactions
 */
export interface PersonInteractionListResponse {
  interactions: PersonInteraction[];
  total: number;
}

/**
 * Person interaction statistics interface
 */
export interface PersonInteractionStats {
  lastContactDate: string | null; // ISO 8601 格式
  thisMonthCount: number;
}

class PeopleService {
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
   * Get all people (contacts) with pagination and filters
   */
  async getPeople(params?: PersonQueryParams): Promise<PersonListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.companyId) queryParams.append('companyId', params.companyId);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.isImportant !== undefined) queryParams.append('isImportant', params.isImportant.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/people${queryString ? `?${queryString}` : ''}`;

    return this.request<PersonListResponse>(endpoint);
  }

  /**
   * Get one person by ID
   */
  async getPerson(id: string): Promise<Person> {
    return this.request<Person>(`/people/${id}`);
  }

  /**
   * Create a new person (contact)
   */
  async createPerson(data: CreatePersonDto): Promise<Person> {
    return this.request<Person>('/people', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a person (contact)
   */
  async updatePerson(id: string, data: UpdatePersonDto): Promise<Person> {
    return this.request<Person>(`/people/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a person (contact)
   */
  async deletePerson(id: string): Promise<void> {
    return this.request<void>(`/people/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get interactions by person ID
   */
  async getPersonInteractions(
    personId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<PersonInteractionListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit.toString());
    queryParams.append('offset', offset.toString());

    return this.request<PersonInteractionListResponse>(
      `/people/${personId}/interactions?${queryParams.toString()}`,
    );
  }

  /**
   * Get interaction statistics for a single person
   */
  async getPersonInteractionStats(personId: string): Promise<PersonInteractionStats> {
    return this.request<PersonInteractionStats>(`/people/${personId}/interaction-stats`);
  }

  /**
   * Get interaction statistics for multiple persons (batch query)
   */
  async getMultiplePersonInteractionStats(
    personIds: string[],
  ): Promise<Map<string, PersonInteractionStats>> {
    const response = await this.request<{ stats: { [personId: string]: PersonInteractionStats } }>(
      '/people/interaction-stats/batch',
      {
        method: 'POST',
        body: JSON.stringify({ personIds }),
      },
    );

    // Convert object to Map
    const statsMap = new Map<string, PersonInteractionStats>();
    Object.entries(response.stats).forEach(([personId, stats]) => {
      statsMap.set(personId, stats);
    });

    return statsMap;
  }
}

export const peopleService = new PeopleService();
