/**
 * Input Component
 * 
 * A styled input component with Monday.com style design tokens.
 * Features clean borders, focus effects, and multiple states.
 * Supports labels, error messages, and helper text.
 * 
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   placeholder="Enter your email"
 * />
 * 
 * <Input
 *   label="Password"
 *   type="password"
 *   error={true}
 *   errorMessage="Password is required"
 * />
 * ```
 * 
 * All custom code is proprietary and not open source.
 */

import React, { useId } from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Input size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Show error state
   * @default false
   */
  error?: boolean;
  
  /**
   * Error message to display
   */
  errorMessage?: string;
  
  /**
   * Label text
   */
  label?: string;
  
  /**
   * Helper text to display below input
   */
  helperText?: string;
  
  /**
   * Icon to display on the left side
   */
  leftIcon?: React.ReactNode;
  
  /**
   * Icon to display on the right side
   */
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      error = false,
      errorMessage,
      label,
      helperText,
      leftIcon,
      rightIcon,
      className = '',
      id,
      size = 'md',
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = errorMessage ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;
    
    // Base classes
    const baseClasses = 'w-full rounded-monday-md border bg-monday-surface text-monday-text placeholder:text-monday-text-placeholder focus:outline-none transition-all duration-200';
    
    // State classes
    const stateClasses = error
      ? 'border-primary-red focus:ring-2 focus:ring-primary-red focus:border-primary-red'
      : 'border-gray-200 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue';
    
    // Size classes
    const sizeClasses = {
      sm: 'p-monday-2 px-monday-3 text-monday-sm',
      md: 'p-monday-3 px-monday-4 text-monday-base',
      lg: 'p-monday-4 px-monday-5 text-monday-lg',
    };
    
    // Disabled classes
    const disabledClasses = props.disabled ? 'opacity-50 cursor-not-allowed' : '';
    
    const inputClasses = `${baseClasses} ${stateClasses} ${sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md} ${disabledClasses} ${className}`.trim();
    
    return (
      <div className="w-full">
        {label && (
          <label
            id={`${inputId}-label`}
            htmlFor={inputId}
            className="block text-monday-sm font-medium text-monday-text mb-monday-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-monday-3 top-1/2 transform -translate-y-1/2 text-monday-text-placeholder">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`${inputClasses} ${leftIcon ? 'pl-monday-10' : ''} ${rightIcon ? 'pr-monday-10' : ''}`}
            aria-invalid={error}
            aria-describedby={describedBy}
            aria-labelledby={label ? `${inputId}-label` : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-monday-3 top-1/2 transform -translate-y-1/2 text-monday-text-placeholder">
              {rightIcon}
            </div>
          )}
        </div>
        {errorMessage && (
          <p
            id={errorId}
            className="mt-monday-1 text-monday-sm text-primary-red"
            role="alert"
          >
            {errorMessage}
          </p>
        )}
        {helperText && !errorMessage && (
          <p
            id={helperId}
            className="mt-monday-1 text-monday-sm text-monday-text-secondary"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

