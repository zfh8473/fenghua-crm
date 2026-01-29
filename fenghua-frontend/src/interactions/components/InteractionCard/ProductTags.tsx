/**
 * ProductTags Component
 * 
 * Displays product tags (first 2 products + "+N" if more)
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { ProductSummary } from '../../services/interactions.service';

interface ProductTagsProps {
  products?: ProductSummary[];
  className?: string;
}

// Product icon SVG (Heroicons style - shopping bag)
const productIcon = (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="w-4 h-4"
  >
    <path d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

export const ProductTags: React.FC<ProductTagsProps> = ({ products, className = '' }) => {
  if (!products || products.length === 0) {
    return null;
  }
  
  const displayProducts = products.slice(0, 2);
  const remainingCount = products.length - 2;
  
  return (
    <div className={`flex items-center gap-monday-2 flex-wrap ${className}`}>
      <span className="text-uipro-secondary flex-shrink-0">{productIcon}</span>
      <span className="text-monday-sm text-uipro-secondary">产品：</span>
      {displayProducts.map((product) => (
        <span
          key={product.id}
          className="inline-flex items-center px-monday-2 py-monday-1 rounded-monday-sm text-monday-xs font-medium bg-gray-100 text-gray-700"
        >
          {product.name}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="text-monday-sm text-uipro-secondary">
          +{remainingCount}个
        </span>
      )}
    </div>
  );
};
