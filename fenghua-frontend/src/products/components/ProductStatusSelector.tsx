/**
 * Product Status Selector Component
 * 
 * Provides product status selection with radio buttons and color-coded options
 * All custom code is proprietary and not open source.
 */

import React from 'react';

export type ProductStatus = 'active' | 'inactive' | 'archived';

interface ProductStatusSelectorProps {
  value?: ProductStatus;
  onChange: (status: ProductStatus) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

// Status color mapping
const getStatusColorClasses = (status: ProductStatus): string => {
  const colorMap: Record<ProductStatus, string> = {
    active: 'bg-primary-green text-white border-primary-green',
    inactive: 'bg-primary-red text-white border-primary-red',
    archived: 'bg-gray-400 text-white border-gray-400',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-600 border-gray-300';
};

// Status labels in Chinese
const getStatusLabel = (status: ProductStatus): string => {
  const labelMap: Record<ProductStatus, string> = {
    active: '活跃',
    inactive: '已停用',
    archived: '已归档',
  };
  return labelMap[status] || status;
};

const STATUS_OPTIONS: ProductStatus[] = ['active', 'inactive', 'archived'];

export const ProductStatusSelector: React.FC<ProductStatusSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  error,
  required = false,
}) => {
  const handleChange = (status: ProductStatus) => {
    if (!disabled) {
      onChange(status);
    }
  };

  return (
    <div className="flex flex-col gap-monday-2">
      {/* Radio Button Options */}
      <div className="grid grid-cols-3 gap-monday-3">
        {STATUS_OPTIONS.map((status) => {
          const isSelected = value === status;
          const colorClasses = getStatusColorClasses(status);
          const bgColor = colorClasses.split(' ')[0]; // Extract background color
          
          return (
            <label
              key={status}
              className={`
                relative flex items-center justify-center gap-monday-2 p-monday-3 rounded-monday-md border-2 cursor-pointer transition-all
                ${isSelected ? `${colorClasses} shadow-monday-md scale-[1.02]` : 'bg-monday-surface border-gray-200 hover:border-gray-300 hover:bg-monday-bg'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                type="radio"
                name="product-status"
                value={status}
                checked={isSelected}
                onChange={() => handleChange(status)}
                disabled={disabled}
                required={required}
                className="sr-only"
              />
              <div className={`
                w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                ${isSelected ? 'border-white bg-white' : 'border-gray-300 bg-white'}
              `}>
                {isSelected && (
                  <div className={`w-2.5 h-2.5 rounded-full ${bgColor}`} />
                )}
              </div>
              <span className={`text-monday-sm font-medium ${isSelected ? 'text-white' : 'text-monday-text'}`}>
                {getStatusLabel(status)}
              </span>
            </label>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <span className="text-monday-sm text-primary-red mt-monday-1">{error}</span>
      )}
    </div>
  );
};

