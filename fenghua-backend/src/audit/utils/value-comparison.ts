/**
 * Value Comparison Utilities
 * 
 * Utilities for comparing old and new values to identify changed fields
 * All custom code is proprietary and not open source.
 */

/**
 * Compare two values and determine if they are different
 * Handles various data types including nested objects and arrays
 */
export function areValuesDifferent(oldValue: any, newValue: any): boolean {
  // Handle null/undefined cases
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
  if (oldValue instanceof Date || newValue instanceof Date) {
    return true; // One is Date, other is not
  }

  // Handle arrays
  if (Array.isArray(oldValue) || Array.isArray(newValue)) {
    if (Array.isArray(oldValue) !== Array.isArray(newValue)) {
      return true;
    }
    if (oldValue.length !== newValue.length) {
      return true;
    }
    for (let i = 0; i < oldValue.length; i++) {
      if (areValuesDifferent(oldValue[i], newValue[i])) {
        return true;
      }
    }
    return false;
  }

  // Handle objects
  const oldKeys = Object.keys(oldValue);
  const newKeys = Object.keys(newValue);

  if (oldKeys.length !== newKeys.length) {
    return true;
  }

  for (const key of oldKeys) {
    if (!(key in newValue)) {
      return true;
    }
    if (areValuesDifferent(oldValue[key], newValue[key])) {
      return true;
    }
  }

  return false;
}

/**
 * Identify changed fields between old and new values
 * Returns an array of field names that have changed
 */
export function identifyChangedFields(
  oldValue: any,
  newValue: any,
  patchFields?: string[] // For PATCH requests, only check these fields
): string[] {
  const changedFields: string[] = [];

  // Handle null/undefined cases
  if (oldValue === null || oldValue === undefined) {
    if (newValue !== null && newValue !== undefined && typeof newValue === 'object') {
      return Object.keys(newValue);
    }
    return [];
  }
  if (newValue === null || newValue === undefined) {
    if (oldValue !== null && oldValue !== undefined && typeof oldValue === 'object') {
      return Object.keys(oldValue);
    }
    return [];
  }

  // Handle non-object types
  if (typeof oldValue !== 'object' || typeof newValue !== 'object') {
    return areValuesDifferent(oldValue, newValue) ? ['value'] : [];
  }

  // Handle Date objects
  if (oldValue instanceof Date && newValue instanceof Date) {
    return oldValue.getTime() !== newValue.getTime() ? ['timestamp'] : [];
  }

  // Handle arrays - compare element by element
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    const maxLength = Math.max(oldValue.length, newValue.length);
    for (let i = 0; i < maxLength; i++) {
      if (areValuesDifferent(oldValue[i], newValue[i])) {
        changedFields.push(`[${i}]`);
      }
    }
    return changedFields;
  }

  // Handle objects
  const allKeys = new Set([
    ...Object.keys(oldValue),
    ...Object.keys(newValue),
  ]);

  const fieldsToCheck = patchFields || Array.from(allKeys);

  for (const key of fieldsToCheck) {
    const oldVal = oldValue[key];
    const newVal = newValue[key];

    // Check if field was added
    if (!(key in oldValue) && key in newValue) {
      changedFields.push(key);
      continue;
    }

    // Check if field was removed
    if (key in oldValue && !(key in newValue)) {
      changedFields.push(key);
      continue;
    }

    // Check if field value changed
    if (areValuesDifferent(oldVal, newVal)) {
      changedFields.push(key);
    }
  }

  return changedFields;
}

/**
 * Get field-level old and new values for changed fields
 * Returns an object mapping field names to { oldValue, newValue }
 */
export function getFieldLevelChanges(
  oldValue: any,
  newValue: any,
  changedFields: string[]
): Record<string, { oldValue: any; newValue: any }> {
  const fieldChanges: Record<string, { oldValue: any; newValue: any }> = {};

  for (const field of changedFields) {
    // Handle array indices like "[0]"
    if (field.startsWith('[') && field.endsWith(']')) {
      const index = parseInt(field.slice(1, -1), 10);
      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        fieldChanges[field] = {
          oldValue: oldValue[index],
          newValue: newValue[index],
        };
      }
    } else {
      fieldChanges[field] = {
        oldValue: oldValue?.[field],
        newValue: newValue?.[field],
      };
    }
  }

  return fieldChanges;
}

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
