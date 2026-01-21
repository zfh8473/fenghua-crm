/**
 * Customer Search Results Component
 * 
 * Displays search results with keyword highlighting
 * All custom code is proprietary and not open source.
 */

import { Customer } from '../customers.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface CustomerSearchResultsProps {
  customers: Customer[];
  searchQuery?: string;
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onCustomerClick?: (customer: Customer) => void;
  loading?: boolean;
}

/**
 * Highlight matching keywords in text
 * 
 * @param text - The text to highlight keywords in
 * @param keyword - The keyword to highlight (optional)
 * @returns React node with highlighted text
 */
const highlightText = (text: string, keyword?: string): React.ReactNode => {
  if (!keyword || !text) return text;
  
  // Use non-global regex for testing to avoid lastIndex issues
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const splitRegex = new RegExp(`(${escapedKeyword})`, 'gi');
  const testRegex = new RegExp(escapedKeyword, 'i'); // Non-global for testing
  
  const parts = text.split(splitRegex);
  
  return parts.map((part, index) => {
    // Use non-global regex to avoid lastIndex modification issues
    if (testRegex.test(part)) {
      return (
        <mark key={index} className="bg-yellow-200 text-monday-text font-semibold px-monday-0.5 rounded">
          {part}
        </mark>
      );
    }
    return part;
  });
};

export const CustomerSearchResults: React.FC<CustomerSearchResultsProps> = ({
  customers,
  searchQuery,
  total,
  currentPage,
  pageSize,
  onPageChange,
  onCustomerClick,
  loading = false,
}) => {
  const totalPages = Math.ceil(total / pageSize);

  const handleCustomerClick = (customer: Customer) => {
    if (onCustomerClick) {
      onCustomerClick(customer);
    }
  };

  /** 19.3 main-business：加载用 skeleton，无 emoji */
  if (loading) {
    return (
      <div className="space-y-monday-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-monday-4 rounded-monday-lg border border-gray-200 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-monday-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-monday-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return null; // Empty state will be handled by parent component
  }

  return (
    <div className="space-y-monday-4">
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-monday-sm text-monday-text-secondary">
          共找到 <span className="font-semibold text-monday-text">{total}</span> 个客户
          {searchQuery && (
            <span className="ml-monday-2">
              （搜索关键词：<span className="font-semibold">{searchQuery}</span>）
            </span>
          )}
        </p>
        {totalPages > 1 && (
          <p className="text-monday-sm text-monday-text-secondary">
            第 {currentPage} / {totalPages} 页
          </p>
        )}
      </div>

      {/* Results List */}
      <div className="space-y-monday-3">
        {customers.map((customer) => (
          <Card
            key={customer.id}
            variant="default"
            hoverable
            className="p-monday-4 transition-all duration-200 hover:shadow-monday-md cursor-pointer"
            onClick={() => handleCustomerClick(customer)}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-monday-4">
              {/* Left: Customer Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-monday-3 mb-monday-2">
                  <h3 className="text-monday-lg font-semibold text-monday-text truncate">
                    {searchQuery ? highlightText(customer.name, searchQuery) : customer.name}
                  </h3>
                  <span className={`inline-flex items-center px-monday-2 py-monday-1 rounded-full text-monday-xs font-semibold transition-colors duration-200 ${
                    customer.customerType === 'BUYER'
                      ? 'bg-uipro-cta/15 text-uipro-cta'
                      : 'bg-semantic-success/15 text-semantic-success'
                  }`}>
                    {customer.customerType === 'BUYER' ? '采购商' : '供应商'}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-monday-4 text-monday-sm text-monday-text-secondary">
                  <div className="flex items-center gap-monday-1.5">
                    <span className="font-semibold">客户代码：</span>
                    <span className="font-mono">
                      {searchQuery ? highlightText(customer.customerCode, searchQuery) : customer.customerCode}
                    </span>
                  </div>
                  
                  {customer.industry && (
                    <div className="flex items-center gap-monday-1.5">
                      <span className="font-semibold">行业：</span>
                      <span>{customer.industry}</span>
                    </div>
                  )}

                  {customer.city && (
                    <div className="flex items-center gap-monday-1.5">
                      <span className="font-semibold">城市：</span>
                      <span>{customer.city}</span>
                    </div>
                  )}
                </div>

                {customer.address && (
                  <p className="text-monday-sm text-monday-text-secondary mt-monday-2 line-clamp-1">
                    {customer.address}
                  </p>
                )}
              </div>

              {/* Right: Action */}
              <div className="flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCustomerClick(customer);
                  }}
                  className="text-uipro-cta hover:underline font-medium text-monday-sm cursor-pointer transition-colors duration-200"
                >
                  查看详情 →
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-monday-2 pt-monday-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-monday-1"
          >
            <span>←</span>
            <span>上一页</span>
          </Button>

          <div className="flex items-center gap-monday-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="min-w-[40px]"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-monday-1"
          >
            <span>下一页</span>
            <span>→</span>
          </Button>
        </div>
      )}
    </div>
  );
};

