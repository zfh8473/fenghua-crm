/**
 * InteractionDetailProducts
 *
 * 关联产品卡片列表：产品名称、状态、查看详情
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import type { ProductSummary } from '../../services/interactions.service';

export interface InteractionDetailProductsProps {
  products: ProductSummary[];
  legacyProductName?: string;
}

const CubeIcon = (
  <svg className="w-5 h-5 text-uipro-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

export const InteractionDetailProducts: React.FC<InteractionDetailProductsProps> = ({
  products,
  legacyProductName,
}) => {
  const list = products.length > 0 ? products : legacyProductName ? [{ id: '', name: legacyProductName, status: undefined }] : [];

  if (list.length === 0) {
    return (
      <div className="bg-monday-surface rounded-monday-lg shadow-monday-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-uipro-text font-uipro-heading mb-4 flex items-center gap-2">
          {CubeIcon}
          关联产品
          <span className="text-sm font-normal text-uipro-secondary">(0个)</span>
        </h2>
        <p className="text-sm text-uipro-secondary">无关联产品</p>
      </div>
    );
  }

  return (
    <div className="bg-monday-surface rounded-monday-lg shadow-monday-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-uipro-text font-uipro-heading mb-4 flex items-center gap-2">
        {CubeIcon}
        关联产品
        <span className="text-sm font-normal text-uipro-secondary">({list.length}个)</span>
      </h2>
      <div className="space-y-3">
        {list.map((product) => (
          <div
            key={product.id || product.name}
            className="border border-gray-200 rounded-monday-lg p-4 hover:border-uipro-cta/50 transition-colors duration-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-uipro-text">{product.name}</h3>
                  {product.status && (
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        product.status === 'active'
                          ? 'bg-semantic-success/15 text-semantic-success'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {product.status === 'active' ? '活跃' : product.status}
                    </span>
                  )}
                </div>
              </div>
              {product.id && (
                <Link
                  to={`/products?productId=${product.id}`}
                  className="text-sm text-uipro-cta hover:underline flex-shrink-0 cursor-pointer transition-colors duration-200"
                >
                  查看详情 →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
