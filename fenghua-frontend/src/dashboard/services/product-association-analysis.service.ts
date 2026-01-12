/**
 * Product Association Analysis Service
 * 
 * Service for fetching product association analysis data
 * All custom code is proprietary and not open source.
 */

export interface ProductAssociationAnalysisItem {
  productId: string;
  productName: string;
  categoryName?: string;
  totalCustomers: number;
  buyerCount: number;
  supplierCount: number;
  totalInteractions: number;
  orderCount: number;
  conversionRate: number; // 0-100
}

export interface ProductAssociationAnalysis {
  products: ProductAssociationAnalysisItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ConversionRateTrendItem {
  period: string; // 时间周期（如 "2026-01" 或 "2026-W01"）
  totalInteractions: number;
  orderCount: number;
  conversionRate: number; // 0-100
}

export interface ConversionRateTrend {
  trends: ConversionRateTrendItem[];
}

export interface ProductCategories {
  categories: string[];
}

export interface ProductAssociationAnalysisQuery {
  categoryName?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Get product association analysis data
 */
export async function getProductAssociationAnalysis(
  token: string,
  query: ProductAssociationAnalysisQuery = {},
): Promise<ProductAssociationAnalysis> {
  const apiBaseUrl = (import.meta.env?.VITE_API_BASE_URL as string) || 
                    (import.meta.env?.VITE_BACKEND_URL as string) || 
                    '/api';
  
  const params = new URLSearchParams();
  if (query.categoryName) {
    params.append('categoryName', query.categoryName);
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

  const url = `${apiBaseUrl}/dashboard/product-association-analysis${params.toString() ? `?${params.toString()}` : ''}`;
  
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
      throw new Error('您没有权限查看产品关联分析');
    }
    if (response.status >= 500) {
      throw new Error('服务器错误，请稍后重试');
    }
    throw new Error('获取产品关联分析数据失败');
  }

  return response.json();
}

/**
 * Get conversion rate trend data
 */
export async function getConversionRateTrend(
  token: string,
  categoryName?: string,
  startDate?: string,
  endDate?: string,
): Promise<ConversionRateTrend> {
  const apiBaseUrl = (import.meta.env?.VITE_API_BASE_URL as string) || 
                    (import.meta.env?.VITE_BACKEND_URL as string) || 
                    '/api';
  
  const params = new URLSearchParams();
  if (categoryName) {
    params.append('categoryName', categoryName);
  }
  if (startDate) {
    params.append('startDate', startDate);
  }
  if (endDate) {
    params.append('endDate', endDate);
  }

  const url = `${apiBaseUrl}/dashboard/product-association-analysis/trend${params.toString() ? `?${params.toString()}` : ''}`;
  
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
      throw new Error('您没有权限查看转化率趋势');
    }
    if (response.status >= 500) {
      throw new Error('服务器错误，请稍后重试');
    }
    throw new Error('获取转化率趋势数据失败');
  }

  return response.json();
}

/**
 * Get product categories list
 */
export async function getProductCategories(token: string): Promise<ProductCategories> {
  const apiBaseUrl = (import.meta.env?.VITE_API_BASE_URL as string) || 
                    (import.meta.env?.VITE_BACKEND_URL as string) || 
                    '/api';
  
  const response = await fetch(`${apiBaseUrl}/dashboard/product-association-analysis/categories`, {
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
      throw new Error('您没有权限查看产品类别列表');
    }
    if (response.status >= 500) {
      throw new Error('服务器错误，请稍后重试');
    }
    throw new Error('获取产品类别列表失败');
  }

  return response.json();
}

