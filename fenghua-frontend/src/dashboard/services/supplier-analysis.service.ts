/**
 * Supplier Analysis Service
 * 
 * Service for fetching supplier analysis data from the backend API
 * All custom code is proprietary and not open source.
 */

export interface SupplierAnalysisItem {
  supplierId: string;
  supplierName: string;
  orderCount: number;
  orderAmount: number;
  cooperationFrequency: number; // Orders per day
  lastCooperationDate: string; // ISO 8601 format
  daysSinceLastCooperation: number;
  stabilityRating: 'HIGH' | 'MEDIUM' | 'LOW' | 'RISK';
  lifetimeValue: number;
}

export interface SupplierAnalysis {
  suppliers: SupplierAnalysisItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CooperationTrendItem {
  period: string; // Time period (e.g., "2026-01" or "2026-W01")
  totalSuppliers: number;
  activeSuppliers: number;
  totalOrders: number;
  cooperationFrequency: number; // Average orders per day
}

export interface CooperationTrend {
  trends: CooperationTrendItem[];
}

export interface SupplierAnalysisQuery {
  startDate?: string;
  endDate?: string;
  categoryName?: string;
  page?: number;
  limit?: number;
}

/**
 * Get supplier analysis data
 */
export async function getSupplierAnalysis(
  token: string,
  query: SupplierAnalysisQuery = {},
): Promise<SupplierAnalysis> {
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

  const url = `${apiBaseUrl}/dashboard/supplier-analysis${params.toString() ? `?${params.toString()}` : ''}`;
  
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
      throw new Error('您没有权限查看供应商分析');
    }
    if (response.status >= 500) {
      throw new Error('服务器错误，请稍后重试');
    }
    const errorBody = await response.json();
    throw new Error(errorBody.message || '获取供应商分析数据失败');
  }

  return response.json();
}

/**
 * Get cooperation trend data
 */
export async function getCooperationTrend(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<CooperationTrend> {
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

  const url = `${apiBaseUrl}/dashboard/supplier-analysis/cooperation-trend${params.toString() ? `?${params.toString()}` : ''}`;
  
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
      throw new Error('您没有权限查看供应商合作趋势');
    }
    if (response.status >= 500) {
      throw new Error('服务器错误，请稍后重试');
    }
    const errorBody = await response.json();
    throw new Error(errorBody.message || '获取供应商合作趋势数据失败');
  }

  return response.json();
}

