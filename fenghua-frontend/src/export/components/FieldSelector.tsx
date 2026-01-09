/**
 * Field Selector Component
 * 
 * Component for selecting fields to export
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useMemo } from 'react';
import { FieldDefinition, ExportDataType } from '../export.service';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface FieldSelectorProps {
  dataType: ExportDataType;
  availableFields: FieldDefinition[];
  selectedFields: string[];
  onSelectionChange: (selectedFields: string[]) => void;
  onEstimatedSizeChange?: (estimatedSize: string) => void;
  totalRecords?: number;
  format?: 'JSON' | 'CSV' | 'EXCEL';
  onSaveConfig?: () => void;
  onResetConfig?: () => void;
}

export const FieldSelector: React.FC<FieldSelectorProps> = ({
  dataType,
  availableFields,
  selectedFields,
  onSelectionChange,
  onEstimatedSizeChange,
  totalRecords = 0,
  format = 'JSON',
  onSaveConfig,
  onResetConfig,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Group fields by category
  const fieldsByCategory = useMemo(() => {
    const grouped: Record<string, FieldDefinition[]> = {};
    availableFields.forEach(field => {
      if (!grouped[field.category]) {
        grouped[field.category] = [];
      }
      grouped[field.category].push(field);
    });
    return grouped;
  }, [availableFields]);

  // Filter fields based on search query
  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableFields;
    }
    const query = searchQuery.toLowerCase();
    return availableFields.filter(
      field =>
        field.fieldName.toLowerCase().includes(query) ||
        field.displayName.toLowerCase().includes(query) ||
        field.category.toLowerCase().includes(query),
    );
  }, [availableFields, searchQuery]);

  // Filtered fields by category
  const filteredFieldsByCategory = useMemo(() => {
    const grouped: Record<string, FieldDefinition[]> = {};
    filteredFields.forEach(field => {
      if (!grouped[field.category]) {
        grouped[field.category] = [];
      }
      grouped[field.category].push(field);
    });
    return grouped;
  }, [filteredFields]);

  // Expand all categories by default
  useEffect(() => {
    const allCategories = new Set(Object.keys(fieldsByCategory));
    setExpandedCategories(allCategories);
  }, [fieldsByCategory]);

  // Select all fields by default when availableFields change
  useEffect(() => {
    if (selectedFields.length === 0 && availableFields.length > 0) {
      onSelectionChange(availableFields.map(f => f.fieldName));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableFields.length]);

  // Calculate estimated file size
  useEffect(() => {
    if (onEstimatedSizeChange) {
      // Use a default record count for estimation if totalRecords is 0
      const recordCount = totalRecords > 0 ? totalRecords : 100;
      const estimatedSize = estimateFileSize(selectedFields.length, recordCount, format);
      onEstimatedSizeChange(estimatedSize);
    }
  }, [selectedFields.length, totalRecords, format, onEstimatedSizeChange]);

  const handleToggleField = (fieldName: string) => {
    if (selectedFields.includes(fieldName)) {
      onSelectionChange(selectedFields.filter(f => f !== fieldName));
    } else {
      // Maintain order: add to the end
      onSelectionChange([...selectedFields, fieldName]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(availableFields.map(f => f.fieldName));
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  const handleToggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleCategoryFields = (category: string, select: boolean) => {
    const categoryFields = fieldsByCategory[category] || [];
    const categoryFieldNames = categoryFields.map(f => f.fieldName);
    
    if (select) {
      // Add category fields that are not already selected, maintaining order
      const newSelected = [...selectedFields];
      categoryFieldNames.forEach(fieldName => {
        if (!newSelected.includes(fieldName)) {
          newSelected.push(fieldName);
        }
      });
      onSelectionChange(newSelected);
    } else {
      // Remove category fields
      onSelectionChange(selectedFields.filter(f => !categoryFieldNames.includes(f)));
    }
  };

  const estimateFileSize = (fieldCount: number, recordCount: number, format: string): string => {
    if (recordCount === 0) {
      return '0 B';
    }

    // Improved estimation based on actual data characteristics
    // Average field size varies by data type and format
    let avgBytesPerField = 50; // Base estimate for string fields
    
    // Adjust for different formats
    let sizeMultiplier = 1;
    switch (format) {
      case 'JSON':
        // JSON has structure overhead (quotes, commas, brackets)
        avgBytesPerField = 60; // Slightly higher for JSON structure
        sizeMultiplier = 1.2; // Additional overhead for JSON structure
        break;
      case 'CSV':
        // CSV has separators and optional quotes
        avgBytesPerField = 55;
        sizeMultiplier = 1.15; // Separators and quotes
        break;
      case 'EXCEL':
        // Excel files are significantly larger due to:
        // - XML-based format (OpenXML)
        // - Cell formatting metadata
        // - Styles and themes
        // - Worksheet structure overhead
        // - Compression (but still larger than CSV/JSON)
        avgBytesPerField = 80; // Higher base for Excel cell structure
        sizeMultiplier = 2.5; // Excel format overhead is much higher
        break;
    }
    
    // Calculate base size
    const baseSize = fieldCount * recordCount * avgBytesPerField;
    
    // Apply format multiplier
    const estimatedBytes = baseSize * sizeMultiplier;
    
    // Format output
    if (estimatedBytes < 1024) {
      return `${Math.round(estimatedBytes)} B`;
    } else if (estimatedBytes < 1024 * 1024) {
      return `${(estimatedBytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(estimatedBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">选择导出字段</h3>
          <p className="text-sm text-gray-500">
            已选择 {selectedFields.length} / {availableFields.length} 个字段
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSelectAll} variant="secondary" size="sm">
            全选
          </Button>
          <Button onClick={handleDeselectAll} variant="secondary" size="sm">
            全不选
          </Button>
        </div>
      </div>

      {/* Save and Reset Configuration Buttons */}
      {(onSaveConfig || onResetConfig) && (
        <div className="flex gap-2 justify-end border-t pt-3">
          {onSaveConfig && (
            <Button onClick={onSaveConfig} variant="secondary" size="sm">
              保存配置
            </Button>
          )}
          {onResetConfig && (
            <Button onClick={onResetConfig} variant="secondary" size="sm">
              重置为默认
            </Button>
          )}
        </div>
      )}

      <div>
        <Input
          type="text"
          placeholder="搜索字段名称或类别..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md p-4 space-y-4">
        {Object.entries(filteredFieldsByCategory).map(([category, fields]) => (
          <div key={category} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => handleToggleCategory(category)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <span>{expandedCategories.has(category) ? '▼' : '▶'}</span>
                <span>{category}</span>
                <span className="text-gray-500 text-xs">
                  ({fields.filter(f => selectedFields.includes(f.fieldName)).length} / {fields.length})
                </span>
              </button>
              <div className="flex gap-2">
                <Button
                  onClick={() => toggleCategoryFields(category, true)}
                  variant="secondary"
                  size="sm"
                  disabled={fields.every(f => selectedFields.includes(f.fieldName))}
                >
                  全选
                </Button>
                <Button
                  onClick={() => toggleCategoryFields(category, false)}
                  variant="secondary"
                  size="sm"
                  disabled={fields.every(f => !selectedFields.includes(f.fieldName))}
                >
                  全不选
                </Button>
              </div>
            </div>
            {expandedCategories.has(category) && (
              <div className="space-y-2 pl-6">
                {fields.map(field => (
                  <label
                    key={field.fieldName}
                    className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field.fieldName)}
                      onChange={() => handleToggleField(field.fieldName)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {field.displayName}
                        </span>
                        {field.isRequired && (
                          <span className="text-xs text-red-500">必填</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {field.fieldName} ({field.dataType})
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

