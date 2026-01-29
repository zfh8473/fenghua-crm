/**
 * Interactions Service
 * 
 * Handles interaction API calls
 * All custom code is proprietary and not open source.
 */

import { authService } from '../../auth/auth.service';

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

export interface ProductSummary {
  id: string;
  name: string;
  status?: string;
}

export interface Interaction {
  id: string;
  /** @deprecated Use products array instead */
  productId?: string;
  customerId: string;
  interactionType: InteractionType;
  interactionDate: string;
  description?: string;
  status?: InteractionStatus;
  additionalInfo?: Record<string, unknown>;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  attachments?: any[];
  customerName?: string;
  /** @deprecated Use products array instead */
  productName?: string;
  personId?: string;
  personName?: string;
  
  /** List of associated products */
  products?: ProductSummary[];
}

/** Alias for Interaction when attachments are present (e.g. detail page) */
export type InteractionWithAttachments = Interaction;

export interface CreateInteractionDto {
  productIds: string[];
  customerId: string;
  interactionType: InteractionType;
  interactionDate: string;
  description?: string;
  status?: InteractionStatus;
  additionalInfo?: Record<string, unknown>;
  personId?: string;
}

export interface UpdateInteractionDto {
  interactionType?: InteractionType;
  description?: string;
  interactionDate?: string;
  status?: InteractionStatus;
  additionalInfo?: Record<string, unknown>;
  personId?: string;
  productIds?: string[];
}

export interface InteractionSearchFilters {
  search?: string;
  customerId?: string;
  productId?: string;
  interactionTypes?: InteractionType[];
  statuses?: InteractionStatus[];
  categories?: string[];
  createdBy?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InteractionSearchResults {
  interactions: Interaction[];
  total: number;
}

class InteractionsService {
  private getHeaders() {
    const token = authService.getToken();
    if (!token) {
      throw new Error('未登录，请先登录');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Create a new interaction record
   */
  async createInteraction(data: CreateInteractionDto): Promise<Interaction> {
    const response = await fetch(`${API_URL}/interactions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create interaction');
    }

    return response.json();
  }

  /**
   * Get interaction by ID
   */
  async getInteraction(id: string): Promise<Interaction> {
    const response = await fetch(`${API_URL}/interactions/${id}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch interaction');
    }

    return response.json();
  }

  /**
   * Search interactions
   */
  async searchInteractions(filters: InteractionSearchFilters): Promise<InteractionSearchResults> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('q', filters.search);
    if (filters.customerId) params.append('customerId', filters.customerId);
    if (filters.productId) params.append('productId', filters.productId);
    if (filters.interactionTypes?.length) params.append('interactionTypes', filters.interactionTypes.join(','));
    if (filters.statuses?.length) params.append('statuses', filters.statuses.join(','));
    if (filters.categories?.length) params.append('categories', filters.categories.join(','));
    if (filters.createdBy) params.append('createdBy', filters.createdBy);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await fetch(`${API_URL}/interactions/search?${params.toString()}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to search interactions');
    }

    return response.json();
  }

  /**
   * Update interaction
   */
  async updateInteraction(id: string, data: UpdateInteractionDto): Promise<Interaction> {
    const response = await fetch(`${API_URL}/interactions/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update interaction');
    }

    return response.json();
  }

  /**
   * Delete interaction
   */
  async deleteInteraction(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/interactions/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete interaction');
    }
  }
}

export const interactionsService = new InteractionsService();
