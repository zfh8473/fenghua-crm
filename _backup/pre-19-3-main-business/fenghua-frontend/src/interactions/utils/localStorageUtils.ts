/**
 * LocalStorage Utilities
 * 
 * Utility functions for managing recent customers and products in localStorage
 * All custom code is proprietary and not open source.
 */

const STORAGE_KEYS = {
  RECENT_CUSTOMERS: 'recentCustomers',
  RECENT_PRODUCTS: 'recentProducts',
} as const;

export interface RecentCustomer {
  id: string;
  name: string;
  customerCode: string;
  customerType: 'BUYER' | 'SUPPLIER';
  timestamp: number;
}

export interface RecentProduct {
  id: string;
  name: string;
  hsCode: string;
  status: 'active' | 'inactive' | 'archived';
  timestamp: number;
}

/**
 * Get recent customers from localStorage
 * @returns Array of recent customers, or empty array if none or error
 */
export const getRecentCustomers = (): RecentCustomer[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RECENT_CUSTOMERS);
    if (!data) return [];

    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    // 验证数据格式
    return parsed.filter((item): item is RecentCustomer => {
      return (
        item &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.customerCode === 'string' &&
        (item.customerType === 'BUYER' || item.customerType === 'SUPPLIER') &&
        typeof item.timestamp === 'number' &&
        item.timestamp > 0
      );
    });
  } catch (error) {
    console.error('Failed to load recent customers from localStorage', error);
    // 清理损坏的数据
    try {
      localStorage.removeItem(STORAGE_KEYS.RECENT_CUSTOMERS);
    } catch {
      // 忽略清理错误
    }
    return [];
  }
};

/**
 * Save a customer to recent customers list
 * @param customer - Customer to save
 */
export const saveRecentCustomer = (customer: {
  id: string;
  name: string;
  customerCode: string;
  customerType: 'BUYER' | 'SUPPLIER';
}): void => {
  try {
    const recent = getRecentCustomers();
    const updated = [
      {
        id: customer.id,
        name: customer.name,
        customerCode: customer.customerCode,
        customerType: customer.customerType,
        timestamp: Date.now(),
      },
      ...recent.filter((c) => c.id !== customer.id),
    ].slice(0, 10); // 最多保存 10 个

    localStorage.setItem(STORAGE_KEYS.RECENT_CUSTOMERS, JSON.stringify(updated));
  } catch (error) {
    // 处理配额超限或其他错误
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, clearing old data');
      // 清理最旧的数据
      const recent = getRecentCustomers();
      const trimmed = recent.slice(0, 5); // 只保留最新的 5 个
      try {
        localStorage.setItem(STORAGE_KEYS.RECENT_CUSTOMERS, JSON.stringify(trimmed));
      } catch {
        // 如果还是失败，放弃保存
        console.error('Failed to save recent customer after quota cleanup');
      }
    } else {
      console.error('Failed to save recent customer', error);
    }
  }
};

/**
 * Update timestamp for a recent customer
 * @param customerId - ID of the customer to update
 */
export const updateRecentCustomerTimestamp = (customerId: string): void => {
  try {
    const recent = getRecentCustomers();
    const updated = recent
      .map((c) => (c.id === customerId ? { ...c, timestamp: Date.now() } : c))
      .sort((a, b) => b.timestamp - a.timestamp);
    localStorage.setItem(STORAGE_KEYS.RECENT_CUSTOMERS, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to update recent customer timestamp', error);
  }
};

/**
 * Remove a customer from recent customers list
 * @param customerId - ID of the customer to remove
 */
export const removeRecentCustomer = (customerId: string): void => {
  try {
    const recent = getRecentCustomers();
    const updated = recent.filter((c) => c.id !== customerId);
    localStorage.setItem(STORAGE_KEYS.RECENT_CUSTOMERS, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to remove recent customer', error);
  }
};

/**
 * Get recent products from localStorage
 * @returns Array of recent products, or empty array if none or error
 */
export const getRecentProducts = (): RecentProduct[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RECENT_PRODUCTS);
    if (!data) return [];

    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    // 验证数据格式
    return parsed.filter((item): item is RecentProduct => {
      return (
        item &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.hsCode === 'string' &&
        ['active', 'inactive', 'archived'].includes(item.status) &&
        typeof item.timestamp === 'number' &&
        item.timestamp > 0
      );
    });
  } catch (error) {
    console.error('Failed to load recent products from localStorage', error);
    // 清理损坏的数据
    try {
      localStorage.removeItem(STORAGE_KEYS.RECENT_PRODUCTS);
    } catch {
      // 忽略清理错误
    }
    return [];
  }
};

/**
 * Save a product to recent products list
 * @param product - Product to save
 */
export const saveRecentProduct = (product: {
  id: string;
  name: string;
  hsCode: string;
  status: 'active' | 'inactive' | 'archived';
}): void => {
  try {
    const recent = getRecentProducts();
    const updated = [
      {
        id: product.id,
        name: product.name,
        hsCode: product.hsCode,
        status: product.status,
        timestamp: Date.now(),
      },
      ...recent.filter((p) => p.id !== product.id),
    ].slice(0, 10); // 最多保存 10 个

    localStorage.setItem(STORAGE_KEYS.RECENT_PRODUCTS, JSON.stringify(updated));
  } catch (error) {
    // 处理配额超限或其他错误
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, clearing old data');
      // 清理最旧的数据
      const recent = getRecentProducts();
      const trimmed = recent.slice(0, 5); // 只保留最新的 5 个
      try {
        localStorage.setItem(STORAGE_KEYS.RECENT_PRODUCTS, JSON.stringify(trimmed));
      } catch {
        // 如果还是失败，放弃保存
        console.error('Failed to save recent product after quota cleanup');
      }
    } else {
      console.error('Failed to save recent product', error);
    }
  }
};

/**
 * Update timestamp for a recent product
 * @param productId - ID of the product to update
 */
export const updateRecentProductTimestamp = (productId: string): void => {
  try {
    const recent = getRecentProducts();
    const updated = recent
      .map((p) => (p.id === productId ? { ...p, timestamp: Date.now() } : p))
      .sort((a, b) => b.timestamp - a.timestamp);
    localStorage.setItem(STORAGE_KEYS.RECENT_PRODUCTS, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to update recent product timestamp', error);
  }
};

/**
 * Remove a product from recent products list
 * @param productId - ID of the product to remove
 */
export const removeRecentProduct = (productId: string): void => {
  try {
    const recent = getRecentProducts();
    const updated = recent.filter((p) => p.id !== productId);
    localStorage.setItem(STORAGE_KEYS.RECENT_PRODUCTS, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to remove recent product', error);
  }
};

