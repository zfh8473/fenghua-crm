/**
 * Interactions Service
 * 
 * Handles interaction API calls
 * All custom code is proprietary and not open source.
 */

// Use relative path /api to leverage Vite proxy in development
// In production, set VITE_API_BASE_URL to the full backend URL
const API_URL = (import.meta.env?.VITE_API_BASE_URL as string) || (import.meta.env?.VITE_BACKEND_URL as string) || '/api';

export enum FrontendInteractionType {
  INITIAL_CONTACT = 'initial_contact', // 初步接触
  PRODUCT_INQUIRY = 'product_inquiry', // 产品询价
  QUOTATION = 'quotation', // 报价
  QUOTATION_ACCEPTED = 'quotation_accepted', // 接受报价
  QUOTATION_REJECTED = 'quotation_rejected', // 拒绝报价
  ORDER_SIGNED = 'order_signed', // 签署订单
  ORDER_FOLLOW_UP = 'order_follow_up', // 进度跟进
  ORDER_COMPLETED = 'order_completed', // 完成订单
}

export enum BackendInteractionType {
  PRODUCT_INQUIRY_SUPPLIER = 'product_inquiry_supplier', // 询价产品
  QUOTATION_RECEIVED = 'quotation_received', // 接收报价
  SPECIFICATION_CONFIRMED = 'specification_confirmed', // 产品规格确认
  PRODUCTION_PROGRESS = 'production_progress', // 生产进度跟进
  PRE_SHIPMENT_INSPECTION = 'pre_shipment_inspection', // 发货前验收
  SHIPPED = 'shipped', // 已发货
}

/**
 * Union type for all interaction types
 */
export type InteractionType = FrontendInteractionType | BackendInteractionType;

/**
 * Interaction status enum
 * Note: All enum values must match backend InteractionStatus enum
 */
export enum InteractionStatus {
  IN_PROGRESS = 'in_progress',        // 进行中
  COMPLETED = 'completed',            // 已完成
  CANCELLED = 'cancelled',            // 已取消
  NEEDS_FOLLOW_UP = 'needs_follow_up' // 需要跟进
}

export interface Interaction {
  id: string;
  productId: string;
  customerId: string;
  interactionType: InteractionType;
  interactionDate: Date;
  description?: string;
  status?: InteractionStatus;
  additionalInfo?: Record<string, unknown>;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
  /** All created interaction IDs (when multiple products are selected) */
  createdInteractionIds?: string[];
}

export interface CreateInteractionDto {
  productIds: string[]; // Support multiple products
  customerId: string;
  interactionType: InteractionType;
  interactionDate: string; // ISO 8601 date string
  description?: string;
  status?: InteractionStatus;
  additionalInfo?: Record<string, unknown>;
}

export interface UpdateInteractionDto {
  interactionType?: InteractionType; // Allow updating interaction type
  description?: string;
  interactionDate?: string; // ISO 8601 date string
  status?: InteractionStatus;
  additionalInfo?: Record<string, unknown>;
}

/**
 * Interaction search filters
 * 
 * Supports multi-select filtering and advanced search options
 */
export interface InteractionSearchFilters {
  /** Array of interaction types to filter by (multi-select) */
  interactionTypes?: InteractionType[];
  /** Array of interaction statuses to filter by (multi-select) */
  statuses?: InteractionStatus[];
  /** Start date for date range filter (ISO 8601 format) */
  startDate?: string;
  /** End date for date range filter (ISO 8601 format) */
  endDate?: string;
  /** Filter by specific customer ID */
  customerId?: string;
  /** Filter by specific product ID */
  productId?: string;
  /** Array of product categories to filter by (multi-select) */
  categories?: string[];
  /** Filter by creator user ID */
  createdBy?: string;
  /** Field to sort by */
  sortBy?: 'interactionDate' | 'customerName' | 'productName' | 'productHsCode' | 'interactionType';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
  /** Number of results per page */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

export interface FileAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  mimeType?: string;
}

export interface InteractionWithAttachments extends Interaction {
  attachments?: FileAttachment[];
}

class InteractionsService {
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

    // Ensure endpoint doesn't start with /api to avoid double /api/api
    const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.replace(/^\/api/, '') : endpoint;
    const url = `${API_URL}${cleanEndpoint}`;
    
    // Debug log (remove in production)
    if (import.meta.env.DEV) {
      console.log('[InteractionsService] Request URL:', url, 'Endpoint:', endpoint, 'API_URL:', API_URL);
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Log detailed error information in development
      if (import.meta.env.DEV) {
        console.error('[InteractionsService] Request failed:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          errorData: errorData,
        });
        // Also log the error data separately for easier debugging
        console.error('[InteractionsService] Error response data:', JSON.stringify(errorData, null, 2));
      }
      
      // Extract validation errors if present (NestJS ValidationPipe format)
      let errorMessage: string;
      
      // Handle different error response formats
      if (Array.isArray(errorData.message)) {
        // ValidationPipe returns array of error objects
        const messages = errorData.message.map((err: any) => {
          if (err.constraints) {
            return Object.values(err.constraints).join(', ');
          }
          return err.property ? `${err.property}: ${err.toString()}` : err.toString();
        });
        errorMessage = messages.join('; ');
      } else if (typeof errorData.message === 'string') {
        // Simple string message
        errorMessage = errorData.message;
      } else if (errorData.message && typeof errorData.message === 'object') {
        // BadRequestException with object format: { message: string, code: string }
        if (errorData.message.message) {
          errorMessage = errorData.message.message;
        } else {
          errorMessage = JSON.stringify(errorData.message);
        }
      } else if (errorData.message) {
        // Fallback for other message formats
        errorMessage = JSON.stringify(errorData.message);
      } else {
        // No message, use status text
        errorMessage = `请求失败: ${response.status} ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      // No Content response
      return undefined as T;
    }

    return response.json();
  }

  /**
   * Create a new interaction record
   */
  async create(data: CreateInteractionDto): Promise<Interaction> {
    return this.request<Interaction>('/interactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get a single interaction record by ID
   */
  async getInteraction(id: string): Promise<InteractionWithAttachments> {
    return this.request<InteractionWithAttachments>(`/interactions/${id}`, {
      method: 'GET',
    });
  }

  /**
   * Update an interaction record
   */
  async updateInteraction(
    id: string,
    data: UpdateInteractionDto,
  ): Promise<Interaction> {
    return this.request<Interaction>(`/interactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete an interaction record (soft delete)
   */
  async deleteInteraction(id: string): Promise<void> {
    return this.request<void>(`/interactions/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Search interaction records with advanced filtering
   * 
   * Supports filtering by:
   * - interactionTypes: Array of interaction types (multi-select)
   * - statuses: Array of interaction statuses (multi-select)
   * - categories: Array of product categories (multi-select)
   * - createdBy: Creator user ID
   * - customerId: Specific customer
   * - productId: Specific product
   * - startDate/endDate: Date range
   * 
   * Also supports sorting and pagination.
   */
  async searchInteractions(
    filters: InteractionSearchFilters,
  ): Promise<{ interactions: Interaction[]; total: number }> {
    const queryParams = new URLSearchParams();
    
    // Multi-select filters (arrays) - only add if array is not empty
    if (filters.interactionTypes && filters.interactionTypes.length > 0) {
      filters.interactionTypes.forEach((type) => {
        if (type && type.trim()) {
          queryParams.append('interactionTypes', type);
        }
      });
    }
    if (filters.statuses && filters.statuses.length > 0) {
      filters.statuses.forEach((status) => {
        if (status && status.trim()) {
          queryParams.append('statuses', status);
        }
      });
    }
    if (filters.categories && filters.categories.length > 0) {
      filters.categories.forEach((category) => {
        if (category && category.trim()) {
          queryParams.append('categories', category);
        }
      });
    }
    
    // Single value filters - only add if value exists and is not empty
    if (filters.startDate && filters.startDate.trim()) {
      queryParams.append('startDate', filters.startDate);
    }
    if (filters.endDate && filters.endDate.trim()) {
      queryParams.append('endDate', filters.endDate);
    }
    // Only add UUID fields if they are valid (non-empty strings)
    if (filters.customerId && filters.customerId.trim()) {
      queryParams.append('customerId', filters.customerId.trim());
    }
    if (filters.productId && filters.productId.trim()) {
      queryParams.append('productId', filters.productId.trim());
    }
    if (filters.createdBy && filters.createdBy.trim()) {
      queryParams.append('createdBy', filters.createdBy.trim());
    }
    
    // Sorting - always include defaults
    queryParams.append('sortBy', filters.sortBy || 'interactionDate');
    queryParams.append('sortOrder', filters.sortOrder || 'desc');
    
    // Pagination - always include
    queryParams.append('limit', (filters.limit || 20).toString());
    queryParams.append('offset', (filters.offset || 0).toString());

    const queryString = queryParams.toString();
    const endpoint = `/interactions/search${queryString ? `?${queryString}` : ''}`;

    return this.request<{ interactions: Interaction[]; total: number }>(endpoint);
  }
}

export const interactionsService = new InteractionsService();

