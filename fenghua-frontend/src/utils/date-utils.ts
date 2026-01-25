/**
 * Date Utility Functions
 * 
 * Shared utility functions for date formatting and manipulation
 * All custom code is proprietary and not open source.
 */

/**
 * Format date for display
 * 
 * Formats a date (Date object or string) into a localized Chinese string.
 * Format: YYYY-MM-DD HH:mm
 * 
 * @param date - Date object or date string
 * @returns Formatted date string in Chinese locale
 * 
 * @example
 * ```ts
 * formatDate(new Date()) // "2026-01-22 14:30"
 * formatDate("2026-01-22T14:30:00Z") // "2026-01-22 14:30"
 * ```
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
