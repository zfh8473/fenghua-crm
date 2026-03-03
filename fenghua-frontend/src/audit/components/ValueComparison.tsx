/**
 * Value Comparison Component
 * 
 * Displays old and new values side by side with highlighting for differences
 */

import React from 'react';
import { formatValueForDisplay, getFieldLevelChanges, getChangedFields } from '../utils/value-comparison';

interface ValueComparisonProps {
  oldValue?: any;
  newValue?: any;
  changedFields?: string[];
  metadata?: Record<string, any>;
}

export const ValueComparison: React.FC<ValueComparisonProps> = ({
  oldValue,
  newValue,
  changedFields: providedChangedFields,
  metadata,
}) => {
  // Get changed fields from metadata if not provided
  const changedFields = providedChangedFields || getChangedFields(metadata);

  if (changedFields.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-monday-4">
        <div>
          <div className="text-monday-sm font-semibold text-uipro-secondary mb-monday-2">修改前</div>
          <div className="text-monday-xs text-uipro-secondary bg-linear-surface p-monday-3 rounded-monday-md border border-gray-200 font-mono whitespace-pre-wrap break-all overflow-x-auto max-h-96 overflow-y-auto">
            {formatValueForDisplay(oldValue)}
          </div>
        </div>
        <div>
          <div className="text-monday-sm font-semibold text-uipro-secondary mb-monday-2">修改后</div>
          <div className="text-monday-xs text-uipro-secondary bg-linear-surface p-monday-3 rounded-monday-md border border-gray-200 font-mono whitespace-pre-wrap break-all overflow-x-auto max-h-96 overflow-y-auto">
            {formatValueForDisplay(newValue)}
          </div>
        </div>
      </div>
    );
  }

  // Show field-level comparison
  const fieldChanges = getFieldLevelChanges(oldValue, newValue, changedFields);

  return (
    <div className="space-y-monday-4">
      <div className="text-monday-sm font-semibold text-uipro-secondary mb-monday-2">
        修改字段 ({changedFields.length} 个)
      </div>
      <div className="space-y-monday-3">
        {fieldChanges.map((change, index) => {
          const oldValStr = formatValueForDisplay(change.oldValue);
          const newValStr = formatValueForDisplay(change.newValue);
          const isDifferent = oldValStr !== newValStr;

          return (
            <div key={index} className="border border-gray-200 rounded-monday-md p-monday-3">
              <div className="text-monday-sm font-semibold text-uipro-text mb-monday-2">{change.field}</div>
              <div className="grid grid-cols-2 gap-monday-3">
                <div>
                  <div className="text-monday-xs text-uipro-secondary mb-monday-1">修改前:</div>
                  <div className={`text-monday-xs font-mono whitespace-pre-wrap break-all p-monday-2 rounded-monday-md ${
                    isDifferent ? 'bg-semantic-error/10 border border-semantic-error/30' : 'bg-linear-surface'
                  }`}>
                    {oldValStr}
                  </div>
                </div>
                <div>
                  <div className="text-monday-xs text-uipro-secondary mb-monday-1">修改后:</div>
                  <div className={`text-monday-xs font-mono whitespace-pre-wrap break-all p-monday-2 rounded-monday-md ${
                    isDifferent ? 'bg-semantic-success/10 border border-semantic-success/30' : 'bg-linear-surface'
                  }`}>
                    {newValStr}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
