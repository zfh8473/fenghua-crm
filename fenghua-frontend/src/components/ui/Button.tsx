/**
 * Button Component
 * 
 * A versatile button component with Monday.com style design tokens.
 * Supports multiple variants (primary, secondary, outline, ghost) and sizes (sm, md, lg).
 * Includes micro-animations and accessibility features.
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click Me
 * </Button>
 * 
 * <Button variant="secondary" size="sm" leftIcon={<Icon />}>
 *   With Icon
 * </Button>
 * ```
 * 
 * All custom code is proprietary and not open source.
 */

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button variant style
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  
  /**
   * Button size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Show loading state
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Icon to display on the left side
   */
  leftIcon?: React.ReactNode;
  
  /**
   * Icon to display on the right side
   */
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Base classes (Monday.com style: 8px rounded)
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-monday-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2 focus:ring-offset-monday-bg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';
    
    // Variant classes - all buttons have borders for consistency
    const variantClasses = {
      primary: 'bg-primary-blue text-white hover:bg-primary-blue-hover border border-primary-blue shadow-monday-sm hover:shadow-monday-md px-monday-6 py-monday-3',
      secondary: 'border border-primary-blue text-primary-blue bg-transparent hover:bg-primary-blue/10 px-monday-6 py-monday-3',
      outline: 'border border-gray-300 text-monday-text bg-transparent hover:bg-monday-bg px-monday-6 py-monday-3',
      ghost: 'border border-transparent text-monday-text bg-transparent hover:bg-monday-bg hover:border-gray-200 px-monday-4 py-monday-2',
    };
    
    // Special variant for navigation (transparent with hover)
    if (className.includes('hover:bg-white/10')) {
      // This is handled by className override
    }
    
    // Size classes
    const sizeClasses = {
      sm: 'text-monday-sm px-monday-4 py-monday-2',
      md: 'text-monday-base px-monday-6 py-monday-3',
      lg: 'text-monday-lg px-monday-8 py-monday-4',
    };
    
    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();
    
    return (
      <button
        ref={ref}
        type="button"
        className={combinedClasses}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        aria-label={props['aria-label'] || (typeof children === 'string' ? children : undefined)}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-monday-2 inline-flex shrink-0 items-center">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-monday-2 inline-flex shrink-0 items-center">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

