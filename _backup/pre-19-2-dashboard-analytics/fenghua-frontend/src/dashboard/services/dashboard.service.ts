/**
 * Dashboard Service
 * 
 * Service for fetching dashboard data
 * All custom code is proprietary and not open source.
 */

export interface DashboardOverview {
  totalCustomers: number;
  totalBuyers: number;
  totalSuppliers: number;
  totalProducts: number;
  totalInteractions: number;
  newCustomersThisMonth: number;
  newInteractionsThisMonth: number;
}

/**
 * Get dashboard overview data
 */
export async function getDashboardOverview(token: string): Promise<DashboardOverview> {
  const apiBaseUrl = (import.meta.env?.VITE_API_BASE_URL as string) || 
                    (import.meta.env?.VITE_BACKEND_URL as string) || 
                    '/api';
  
  const response = await fetch(`${apiBaseUrl}/dashboard/overview`, {
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
      throw new Error('您没有权限查看仪表板');
    }
    if (response.status >= 500) {
      throw new Error('服务器错误，请稍后重试');
    }
    throw new Error('获取仪表板数据失败');
  }

  return response.json();
}

