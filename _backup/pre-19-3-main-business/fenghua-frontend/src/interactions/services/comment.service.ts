/**
 * Comment Service
 * 
 * Handles comment API calls for interaction records
 * All custom code is proprietary and not open source.
 */

// Use relative path /api to leverage Vite proxy in development
// In production, set VITE_API_BASE_URL to the full backend URL
const API_URL = (import.meta.env?.VITE_API_BASE_URL as string) || (import.meta.env?.VITE_BACKEND_URL as string) || '/api';

export interface Comment {
  id: string;
  interactionId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  isEdited?: boolean;
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
}

export interface CreateCommentDto {
  content: string;
}

export interface CommentListResponse {
  data: Comment[];
  total: number;
  page: number;
  limit: number;
}

class CommentService {
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
      
      let errorMessage: string;
      
      // Handle different error response formats
      if (Array.isArray(errorData.message)) {
        const messages = errorData.message.map((err: any) => {
          if (err.constraints) {
            return Object.values(err.constraints).join(', ');
          }
          return err.property ? `${err.property}: ${err.toString()}` : err.toString();
        });
        errorMessage = messages.join('; ');
      } else if (typeof errorData.message === 'string') {
        errorMessage = errorData.message;
      } else if (errorData.message && typeof errorData.message === 'object') {
        if (errorData.message.message) {
          errorMessage = errorData.message.message;
        } else {
          errorMessage = JSON.stringify(errorData.message);
        }
      } else if (errorData.message) {
        errorMessage = JSON.stringify(errorData.message);
      } else {
        errorMessage = `请求失败: ${response.status} ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  /**
   * Create a new comment on an interaction record
   */
  async createComment(
    interactionId: string,
    data: CreateCommentDto
  ): Promise<Comment> {
    return this.request<Comment>(`/interactions/${interactionId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get all comments for an interaction record
   * 
   * @param interactionId - Interaction record ID
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 20)
   * @param since - ISO 8601 timestamp to fetch only comments created after this time (optional)
   */
  async getComments(
    interactionId: string,
    page: number = 1,
    limit: number = 20,
    since?: string
  ): Promise<CommentListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    if (since) {
      queryParams.append('since', since);
    }

    return this.request<CommentListResponse>(
      `/interactions/${interactionId}/comments?${queryParams.toString()}`
    );
  }

  /**
   * Get a single comment by ID
   */
  async getComment(
    interactionId: string,
    commentId: string
  ): Promise<Comment> {
    return this.request<Comment>(
      `/interactions/${interactionId}/comments/${commentId}`
    );
  }

  /**
   * Update an existing comment
   */
  async updateComment(
    interactionId: string,
    commentId: string,
    content: string
  ): Promise<Comment> {
    return this.request<Comment>(`/interactions/${interactionId}/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  /**
   * Delete a comment (soft delete)
   */
  async deleteComment(
    interactionId: string,
    commentId: string
  ): Promise<void> {
    return this.request<void>(`/interactions/${interactionId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }
}

export const commentService = new CommentService();
