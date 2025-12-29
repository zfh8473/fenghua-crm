/**
 * Product Search Results Component
 * 
 * Displays search results with keyword highlighting
 * All custom code is proprietary and not open source.
 */

import { Product } from '../../products/products.service';
import { Card } from '../../components/ui/Card';
import { Link } from 'react-router-dom';

interface ProductSearchResultsProps {
  products: Product[];
  searchQuery?: string;
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onProductClick?: (product: Product) => void;
  loading?: boolean;
}

/**
 * Highlight matching keywords in text
 */
const highlightText = (text: string, keyword?: string): React.ReactNode => {
  if (!keyword || !text) return text;
  
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    if (regex.test(part)) {
      return (
        <mark key={index} className="bg-yellow-200 text-monday-text font-semibold px-monday-0.5 rounded">
          {part}
        </mark>
      );
    }
    return part;
  });
};

export const ProductSearchResults: React.FC<ProductSearchResultsProps> = ({
  products,
  searchQuery,
  total,
  currentPage,
  pageSize,
  onPageChange,
  onProductClick,
  loading = false,
}) => {
  const totalPages = Math.ceil(total / pageSize);

  const handleProductClick = (product: Product) => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-monday-12">
        <div className="text-center">
          <div className="text-monday-4xl mb-monday-4 animate-spin">⏳</div>
          <p className="text-monday-base text-monday-text-secondary">正在加载搜索结果...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null; // EmptySearchResults component will handle this
  }

  return (
    <div className="space-y-monday-4">
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-monday-sm text-monday-text-secondary">
          共找到 <span className="font-semibold text-monday-text">{total}</span> 个产品
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
        {products.map((product) => (
          <Card
            key={product.id}
            variant="default"
            hoverable
            className="p-monday-4 transition-all duration-200 hover:shadow-monday-md cursor-pointer"
            onClick={() => handleProductClick(product)}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-monday-4">
              {/* Left: Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-monday-3 mb-monday-2">
                  <h3 className="text-monday-lg font-semibold text-monday-text truncate">
                    {searchQuery ? highlightText(product.name, searchQuery) : product.name}
                  </h3>
                  {product.status === 'active' && (
                    <span className="inline-flex items-center px-monday-2 py-monday-1 rounded-full text-monday-xs font-semibold bg-primary-green/10 text-primary-green">
                      活跃
                    </span>
                  )}
                  {product.status === 'inactive' && (
                    <span className="inline-flex items-center px-monday-2 py-monday-1 rounded-full text-monday-xs font-semibold bg-gray-200 text-monday-text-secondary">
                      已停用
                    </span>
                  )}
                  {product.status === 'archived' && (
                    <span className="inline-flex items-center px-monday-2 py-monday-1 rounded-full text-monday-xs font-semibold bg-gray-300 text-monday-text">
                      已归档
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-monday-4 text-monday-sm text-monday-text-secondary">
                  <div className="flex items-center gap-monday-1.5">
                    <span className="font-semibold">HS编码：</span>
                    <span className="font-mono">
                      {searchQuery ? highlightText(product.hsCode, searchQuery) : product.hsCode}
                    </span>
                  </div>
                  
                  {product.category && (
                    <div className="flex items-center gap-monday-1.5">
                      <span className="font-semibold">类别：</span>
                      <span>{product.category}</span>
                    </div>
                  )}
                </div>

                {product.description && (
                  <p className="text-monday-sm text-monday-text-secondary mt-monday-2 line-clamp-2">
                    {searchQuery ? highlightText(product.description, searchQuery) : product.description}
                  </p>
                )}
              </div>

              {/* Right: Action */}
              <div className="flex-shrink-0">
                <Link
                  to={`/products/${product.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-primary-blue hover:text-primary-blue-hover font-medium text-monday-sm"
                >
                  查看详情 →
                </Link>
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

