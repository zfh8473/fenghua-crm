/**
 * Buyer Analysis Service
 * 
 * Service for fetching buyer analysis data from the backend API
 * All custom code is proprietary and not open source.
 */

export interface BuyerAnalysisItem {
  buyerId: string;
  buyerName: string;
  orderCount: number;
  orderAmount: number;
  orderFrequency: number; // Orders per day
  lastInteractionDate: string; // ISO 8601 format
  daysSinceLastInteraction: number;
  activityLevel: number; // Activity percentage (0-100)
  activityRating: 'HIGH' | 'MEDIUM' | 'LOW';
  churnRisk: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  lifetimeValue: number;
}

export interface BuyerAnalysis {
  buyers: BuyerAnalysisItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ActivityTrendItem {
  period: string; // Time period (e.g., "2026-01" or "2026-W01")
  totalBuyers: number;
  activeBuyers: number;
  averageActivityLevel: number; // Average activity level (0-100)
}

export interface ActivityTrend {
  trends: ActivityTrendItem[];
}

export interface ChurnTrendItem {
  period: string; // Time period (e.g., "2026-01" or "2026-W01")
  totalBuyers: number;
  churnedBuyers: number;
  churnRate: number; // Churn rate percentage (0-100)
}

export interface ChurnTrend {
  trends: ChurnTrendItem[];
}

export interface BuyerAnalysisQuery {
  startDate?: string;
  endDate?: string;
  categoryName?: string;
  page?: number;
  limit?: number;
}

/**
 * Get buyer analysis data
 */
export async function getBuyerAnalysis(
  token: string,
  query: BuyerAnalysisQuery = {},
): Promise<BuyerAnalysis> {
  const apiBaseUrl = (import.meta.env?.VITE_API_BASE_URL as string) || 
                    (import.meta.env?.VITE_BACKEND_URL as string) || 
                    '/api';
  
  const params = new URLSearchParams();
  if (query.startDate) {
    params.append('startDate', query.startDate);
  }
  if (query.endDate) {
    params.append('endDate', query.endDate);
  }
  if (query.categoryName) {
    params.append('categoryName', query.categoryName);
  }
  if (query.page) {
    params.append('page', query.page.toString());
  }
  if (query.limit) {
    params.append('limit', query.limit.toString());
  }

  const url = `${apiBaseUrl}/dashboard/buyer-analysis${params.toString() ? `?${params.toString()}` : ''}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('认证失败，请重新登录');
    }
    if (response.status === 403) {
      throw new Error('您没有权限查看采购商分析');
    }
    if (response.status >= 500) {
      throw new Error('服务器错误，请稍后重试');
    }
    const errorBody = await response.json();
    throw new Error(errorBody.message || '获取采购商分析数据失败');
  }

  return response.json();
}

/**
 * Get activity trend data
 */
export async function getActivityTrend(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<ActivityTrend> {
  const apiBaseUrl = (import.meta.env?.VITE_API_BASE_URL as string) || 
                    (import.meta.env?.VITE_BACKEND_URL as string) || 
                    '/api';
  
  const params = new URLSearchParams();
  if (startDate) {
    params.append('startDate', startDate);
  }
  if (endDate) {
    params.append('endDate', endDate);
  }

  const url = `${apiBaseUrl}/dashboard/buyer-analysis/activity-trend${params.toString() ? `?${params.toString()}` : ''}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('认证失败，请重新登录');
    }
    if (response.status === 403) {
      throw new Error('您没有权限查看采购商活跃度趋势');
    }
    if (response.status >= 500) {
      throw new Error('服务器错误，请稍后重试');
    }
    const errorBody = await response.json();
    throw new Error(errorBody.message || '获取采购商活跃度趋势数据失败');
  }

  return response.json();
}

/**
 * Get churn trend data
 */
export async function getChurnTrend(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<ChurnTrend> {
  const apiBaseUrl = (import.meta.env?.VITE_API_BASE_URL as string) || 
                    (import.meta.env?.VITE_BACKEND_URL as string) || 
                    '/api';
  
  const params = new URLSearchParams();
  if (startDate) {
    params.append('startDate', startDate);
  }
  if (endDate) {
    params.append('endDate', endDate);
  }

  const url = `${apiBaseUrl}/dashboard/buyer-analysis/churn-trend${params.toString() ? `?${params.toString()}` : ''}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('认证失败，请重新登录');
    }
    if (response.status === 403) {
      throw new Error('您没有权限查看采购商流失率趋势');
    }
    if (response.status >= 500) {
      throw new Error('服务器错误，请稍后重试');
    }
    const errorBody = await response.json();
    throw new Error(errorBody.message || '获取采购商流失率趋势数据失败');
  }

  return response.json();
}

