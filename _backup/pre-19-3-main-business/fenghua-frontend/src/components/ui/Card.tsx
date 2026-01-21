/**
 * Card Component
 * 
 * A card component with Monday.com style design tokens.
 * Features subtle shadows, clean borders, and multiple variants.
 * 
 * @example
 * ```tsx
 * <Card title="Card Title" variant="default">
 *   <p>Card content goes here</p>
 * </Card>
 * 
 * <Card variant="elevated" hoverable>
 *   <p>Elevated card with hover effect</p>
 * </Card>
 * ```
 * 
 * All custom code is proprietary and not open source.
 */

import React from 'react';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /**
   * Card variant style
   * @default 'default'
   */
  variant?: 'default' | 'elevated' | 'outlined';
  
  /**
   * Card title (displayed at the top)
   */
  title?: React.ReactNode;
  
  /**
   * Card footer (displayed at the bottom)
   */
  footer?: React.ReactNode;
  
  /**
   * Enable hover effect
   * @default false
   */
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  title,
  footer,
  hoverable = false,
  children,
  className = '',
  ...props
}) => {
  // Base classes
  const baseClasses = 'rounded-monday-lg p-monday-6';
  
  // Variant classes
  const variantClasses = {
    default: 'bg-monday-surface shadow-monday-sm border border-gray-200',
    elevated: 'bg-monday-surface shadow-monday-md border border-gray-200',
    outlined: 'bg-monday-surface border border-gray-300',
  };
  
  // Hover classes
  const hoverClasses = hoverable ? 'hover:shadow-monday-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer' : '';
  
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`.trim();
  
  return (
    <div
      className={combinedClasses}
      role={title ? 'article' : undefined}
      aria-label={typeof title === 'string' ? title : undefined}
      {...props}
    >
      {title && (
        <div className="mb-monday-4">
          {typeof title === 'string' ? (
            <h3 className="text-monday-xl font-semibold text-monday-text">{title}</h3>
          ) : (
            title
          )}
        </div>
      )}
      <div className="text-monday-text">{children}</div>
      {footer && (
        <div className="mt-monday-4 pt-monday-4 border-t border-gray-200">{footer}</div>
      )}
    </div>
  );
};

