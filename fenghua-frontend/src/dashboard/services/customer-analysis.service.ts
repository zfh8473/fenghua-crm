/**
 * Customer Analysis Service
 * 
 * Service for fetching customer analysis data from the backend API
 * All custom code is proprietary and not open source.
 */

export interface CustomerAnalysisItem {
  customerId: string;
  customerName: string;
  customerType: 'BUYER' | 'SUPPLIER';
  orderCount: number;
  orderAmount: number;
  orderFrequency: number;
  lastInteractionDate: string; // ISO 8601 format
  daysSinceLastInteraction: number;
  churnRisk: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  lifetimeValue?: number;
}

export interface CustomerAnalysis {
  customers: CustomerAnalysisItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ChurnRateTrendItem {
  period: string; // 时间周期（如 "2026-01" 或 "2026-W01"）
  totalCustomers: number;
  churnedCustomers: number;
  churnRate: number; // 0-100
}

export interface ChurnRateTrend {
  trends: ChurnRateTrendItem[];
}

export interface CustomerAnalysisQuery {
  customerType?: 'BUYER' | 'SUPPLIER';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Get customer analysis data
 */
export async function getCustomerAnalysis(
  token: string,
  query: CustomerAnalysisQuery = {},
): Promise<CustomerAnalysis> {
  const apiBaseUrl = (import.meta.env?.VITE_API_BASE_URL as string) || 
                    (import.meta.env?.VITE_BACKEND_URL as string) || 
                    '/api';
  
  const params = new URLSearchParams();
  if (query.customerType) {
    params.append('customerType', query.customerType);
  }
  if (query.startDate) {
    params.append('startDate', query.startDate);
  }
  if (query.endDate) {
    params.append('endDate', query.endDate);
  }
  if (query.page) {
    params.append('page', query.page.toString());
  }
  if (query.limit) {
    params.append('limit', query.limit.toString());
  }

  const url = `${apiBaseUrl}/dashboard/customer-analysis${params.toString() ? `?${params.toString()}` : ''}`;
  
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
      throw new Error('您没有权限查看客户分析');
    }
    if (response.status >= 500) {
      throw new Error('服务器错误，请稍后重试');
    }
    const errorBody = await response.json();
    throw new Error(errorBody.message || '获取客户分析数据失败');
  }

  return response.json();
}

/**
 * Get churn rate trend data
 */
export async function getChurnRateTrend(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<ChurnRateTrend> {
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

  const url = `${apiBaseUrl}/dashboard/customer-analysis/trend${params.toString() ? `?${params.toString()}` : ''}`;
  
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
      throw new Error('您没有权限查看客户流失率趋势');
    }
    if (response.status >= 500) {
      throw new Error('服务器错误，请稍后重试');
    }
    const errorBody = await response.json();
    throw new Error(errorBody.message || '获取客户流失率趋势数据失败');
  }

  return response.json();
}

