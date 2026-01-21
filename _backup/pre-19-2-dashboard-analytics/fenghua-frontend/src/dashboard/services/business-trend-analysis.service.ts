/**
 * Business Trend Analysis Service
 * 
 * Frontend service for fetching business trend analysis data
 */

const apiBaseUrl = (import.meta.env?.VITE_API_BASE_URL as string) || 
                  (import.meta.env?.VITE_BACKEND_URL as string) || 
                  '/api';

export interface BusinessTrendItem {
  period: string;
  orderCount: number;
  customerGrowth: number;
  salesAmount: number;
  growthRate?: number;
  yearOverYearGrowthRate?: number;
}

export interface TrendSummary {
  totalOrderCount: number;
  totalCustomerGrowth: number;
  totalSalesAmount: number;
  averageGrowthRate: number;
}

export interface BusinessTrendAnalysis {
  trends: BusinessTrendItem[];
  summary: TrendSummary;
}

export type TimeGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type TrendMetric = 'orderCount' | 'customerGrowth' | 'salesAmount';

export interface BusinessTrendAnalysisQuery {
  startDate?: string;
  endDate?: string;
  timeGranularity?: TimeGranularity;
  metrics?: TrendMetric[];
}

/**
 * Get business trend analysis data
 */
export async function getBusinessTrendAnalysis(
  token: string,
  query: BusinessTrendAnalysisQuery = {},
): Promise<BusinessTrendAnalysis> {
  const params = new URLSearchParams();
  
  if (query.startDate) {
    params.append('startDate', query.startDate);
  }
  if (query.endDate) {
    params.append('endDate', query.endDate);
  }
  if (query.timeGranularity) {
    params.append('timeGranularity', query.timeGranularity);
  }
  if (query.metrics && query.metrics.length > 0) {
    query.metrics.forEach(metric => {
      params.append('metrics', metric);
    });
  }

  const url = `${apiBaseUrl}/dashboard/business-trend-analysis${params.toString() ? `?${params.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = '获取业务趋势分析数据失败';
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

