/**
 * Error Handling Utilities
 * 
 * Provides utility functions for handling errors in a type-safe way
 * All custom code is proprietary and not open source.
 */

/**
 * Extracts error message from unknown error type
 * 
 * @param error - The error to extract message from
 * @param defaultMessage - Default message if error cannot be extracted
 * @returns Error message string
 */
export function getErrorMessage(error: unknown, defaultMessage: string = '操作失败'): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    // Check for axios-like error structure
    if ('response' in error && error.response && typeof error.response === 'object') {
      const response = error.response as { status?: number; data?: unknown };
      if (typeof response.status === 'number') {
        const status = response.status;
        if (status === 401) return '认证失败，请重新登录';
        if (status === 403) return '权限不足';
        if (status >= 500) return '服务器错误，请稍后重试';
      }
      if (response.data && typeof response.data === 'object') {
        const data = response.data as { message?: unknown };
        if (typeof data.message === 'string') {
          return data.message;
        }
      }
    }
  }
  return defaultMessage;
}

/**
 * Extracts error from unknown type with type guard
 * 
 * @param error - The error to check
 * @returns Error instance or null
 */
export function getError(error: unknown): Error | null {
  if (error instanceof Error) {
    return error;
  }
  return null;
}

/**
 * Checks if error has response property (for axios-like errors)
 */
export function hasResponse(error: unknown): error is { response: { status?: number; data?: unknown } } {
  return error !== null && typeof error === 'object' && 'response' in error;
}
