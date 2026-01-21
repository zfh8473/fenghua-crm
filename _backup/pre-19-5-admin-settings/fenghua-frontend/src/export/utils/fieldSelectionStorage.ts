/**
 * Field Selection Storage Utilities
 * 
 * Utility functions for managing field selection configurations in localStorage
 * All custom code is proprietary and not open source.
 */

import { ExportDataType } from '../export.service';

const STORAGE_KEY_PREFIX = 'exportFieldSelection_';

/**
 * Get storage key for a data type
 */
function getStorageKey(dataType: ExportDataType): string {
  return `${STORAGE_KEY_PREFIX}${dataType}`;
}

/**
 * Get saved field selection for a data type
 * @param dataType - Export data type
 * @returns Array of selected field names, or null if not saved
 */
export function getSavedFieldSelection(dataType: ExportDataType): string[] | null {
  try {
    const key = getStorageKey(dataType);
    const data = localStorage.getItem(key);
    if (!data) return null;

    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return null;

    // Validate that all items are strings
    const isValid = parsed.every((item) => typeof item === 'string');
    if (!isValid) {
      // Clean up invalid data
      localStorage.removeItem(key);
      return null;
    }

    return parsed;
  } catch (error) {
    console.error(`Failed to load saved field selection for ${dataType}:`, error);
    // Clean up corrupted data
    try {
      localStorage.removeItem(getStorageKey(dataType));
    } catch {
      // Ignore cleanup errors
    }
    return null;
  }
}

/**
 * Save field selection for a data type
 * @param dataType - Export data type
 * @param selectedFields - Array of selected field names
 * @returns true if saved successfully, false otherwise
 */
export function saveFieldSelection(dataType: ExportDataType, selectedFields: string[]): boolean {
  try {
    const key = getStorageKey(dataType);
    localStorage.setItem(key, JSON.stringify(selectedFields));
    return true;
  } catch (error) {
    // Handle quota exceeded or other errors
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, attempting to clear old data');
      // Try to clear old field selections to free up space
      try {
        Object.values(ExportDataType).forEach((dt) => {
          if (dt !== dataType) {
            localStorage.removeItem(getStorageKey(dt));
          }
        });
        // Retry saving
        localStorage.setItem(getStorageKey(dataType), JSON.stringify(selectedFields));
        return true;
      } catch (retryError) {
        console.error('Failed to save field selection after cleanup:', retryError);
        return false;
      }
    } else {
      console.error('Failed to save field selection:', error);
      return false;
    }
  }
}

/**
 * Clear saved field selection for a data type
 * @param dataType - Export data type
 */
export function clearFieldSelection(dataType: ExportDataType): void {
  try {
    const key = getStorageKey(dataType);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear field selection:', error);
  }
}

/**
 * Clear all saved field selections
 */
export function clearAllFieldSelections(): void {
  try {
    Object.values(ExportDataType).forEach((dataType) => {
      clearFieldSelection(dataType);
    });
  } catch (error) {
    console.error('Failed to clear all field selections:', error);
  }
}

