/**
 * Value Comparison Utilities
 * 
 * Utilities for comparing and formatting old and new values for display
 */

/**
 * Format value for display (handles various types)
 */
export function formatValueForDisplay(value: any): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

/**
 * Get changed fields from metadata
 */
export function getChangedFields(metadata?: Record<string, any>): string[] {
  if (!metadata || !Array.isArray(metadata.changedFields)) {
    return [];
  }
  return metadata.changedFields;
}

/**
 * Get field-level changes (old and new values for each changed field)
 */
export function getFieldLevelChanges(
  oldValue: any,
  newValue: any,
  changedFields: string[]
): Array<{ field: string; oldValue: any; newValue: any }> {
  const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

  for (const field of changedFields) {
    changes.push({
      field,
      oldValue: oldValue?.[field],
      newValue: newValue?.[field],
    });
  }

  return changes;
}

/**
 * Check if a value is different (for highlighting)
 */
export function areValuesDifferent(oldValue: any, newValue: any): boolean {
  if (oldValue === null || oldValue === undefined) {
    return newValue !== null && newValue !== undefined;
  }
  if (newValue === null || newValue === undefined) {
    return true;
  }

  // Handle primitive types
  if (typeof oldValue !== 'object' || typeof newValue !== 'object') {
    return oldValue !== newValue;
  }

  // Handle Date objects
  if (oldValue instanceof Date && newValue instanceof Date) {
    return oldValue.getTime() !== newValue.getTime();
  }

  // For objects, do a simple JSON comparison
  try {
    return JSON.stringify(oldValue) !== JSON.stringify(newValue);
  } catch {
    return String(oldValue) !== String(newValue);
  }
}
