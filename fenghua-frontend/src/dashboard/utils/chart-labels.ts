/**
 * Chart Label Mappings
 * 
 * Maps data keys to Chinese labels for chart display
 * All custom code is proprietary and not open source.
 */

/**
 * Chinese label mappings for dashboard charts
 */
export const CHART_LABELS: Record<string, string> = {
  // Business Trend Analysis
  orderCount: '订单量',
  customerGrowth: '客户增长',
  salesAmount: '销售额',
  
  // Product Association Analysis
  conversionRate: '转化率',
  
  // Customer Analysis
  churnRate: '客户流失率',
  
  // Supplier Analysis
  cooperationFrequency: '供应商合作频率',
  
  // Buyer Analysis
  averageActivityLevel: '平均活跃度',
  
  // Common metrics
  totalCustomers: '总客户数',
  churnedCustomers: '流失客户数',
  totalSuppliers: '总供应商数',
  activeSuppliers: '活跃供应商数',
  totalOrders: '总订单数',
  totalBuyers: '总采购商数',
  activeBuyers: '活跃采购商数',
  churnedBuyers: '流失采购商数',
  totalInteractions: '总互动数',
  
  // Dashboard
  customers: '客户数',
  interactions: '互动数',
};

/**
 * Get Chinese label for a data key
 * @param key Data key
 * @returns Chinese label or the key itself if not found
 */
export function getChartLabel(key: string): string {
  return CHART_LABELS[key] || key;
}

/**
 * Get Chinese labels for multiple data keys
 * @param keys Array of data keys
 * @returns Object mapping keys to Chinese labels
 */
export function getChartLabels(keys: string[]): Record<string, string> {
  const labels: Record<string, string> = {};
  keys.forEach(key => {
    labels[key] = getChartLabel(key);
  });
  return labels;
}

