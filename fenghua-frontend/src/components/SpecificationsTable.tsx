/**
 * Specifications Table Component
 * 
 * Table-based input for product specifications
 * Allows dynamic adding/removing rows with key-value pairs
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface SpecificationRow {
  id: string; // For React key
  key: string; // Property name
  value: string; // Property value
}

interface SpecificationsTableProps {
  value: Record<string, unknown> | undefined; // JSON format specifications
  onChange: (specs: Record<string, unknown> | undefined) => void;
  error?: boolean;
  errorMessage?: string;
}

export const SpecificationsTable: React.FC<SpecificationsTableProps> = ({
  value,
  onChange,
  error = false,
  errorMessage,
}) => {
  // Convert JSON to table rows
  const jsonToRows = (json: Record<string, unknown> | undefined): SpecificationRow[] => {
    if (!json || Object.keys(json).length === 0) {
      return [{ id: '1', key: '', value: '' }]; // At least one empty row
    }
    return Object.entries(json).map(([key, value], index) => ({
      id: `row-${index}`,
      key: key,
      value: String(value), // Ensure it's a string
    }));
  };

  // Convert table rows to JSON
  const rowsToJson = (rows: SpecificationRow[]): Record<string, unknown> | undefined => {
    const filtered = rows.filter(row => row.key.trim() && row.value.trim());
    if (filtered.length === 0) {
      return undefined;
    }
    const result: Record<string, unknown> = {};
    filtered.forEach(row => {
      result[row.key.trim()] = row.value.trim();
    });
    return result;
  };

  const [rows, setRows] = useState<SpecificationRow[]>(() => jsonToRows(value));
  const isInternalUpdateRef = useRef(false);
  const prevValueRef = useRef<string>(JSON.stringify(value || {}));

  // Update rows when external value changes (edit mode)
  // Only update if the change is from external (not from our own onChange)
  useEffect(() => {
    const currentValueStr = JSON.stringify(value || {});
    if (!isInternalUpdateRef.current && currentValueStr !== prevValueRef.current) {
      const newRows = jsonToRows(value);
      setRows(newRows);
      prevValueRef.current = currentValueStr;
    }
    isInternalUpdateRef.current = false;
  }, [value]);

  // Notify parent when rows change (only if change is from user input)
  useEffect(() => {
    if (isInternalUpdateRef.current) {
      const json = rowsToJson(rows);
      const newValueStr = JSON.stringify(json || {});
      
      // Only call onChange if value actually changed
      if (newValueStr !== prevValueRef.current) {
        prevValueRef.current = newValueStr;
        onChange(json);
      }
      isInternalUpdateRef.current = false;
    }
  }, [rows, onChange]);

  const handleAddRow = () => {
    isInternalUpdateRef.current = true;
    setRows(prev => [
      ...prev,
      { id: `row-${Date.now()}`, key: '', value: '' }
    ]);
  };

  const handleDeleteRow = (id: string) => {
    isInternalUpdateRef.current = true;
    setRows(prev => {
      const newRows = prev.filter(row => row.id !== id);
      // If no rows left, keep at least one empty row
      return newRows.length === 0 
        ? [{ id: '1', key: '', value: '' }]
        : newRows;
    });
  };

  const handleRowChange = (id: string, field: 'key' | 'value', newValue: string) => {
    isInternalUpdateRef.current = true;
    setRows(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: newValue } : row
    ));
  };

  // Check for duplicate keys
  const getDuplicateKeys = (): Set<string> => {
    const keys = rows.map(row => row.key.trim()).filter(Boolean);
    const duplicates = new Set<string>();
    const seen = new Set<string>();
    keys.forEach(key => {
      if (seen.has(key)) {
        duplicates.add(key);
      } else {
        seen.add(key);
      }
    });
    return duplicates;
  };

  const duplicateKeys = getDuplicateKeys();

  return (
    <div className="space-y-monday-2">
      <div className="border border-gray-200 rounded-monday-md overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-monday-bg">
            <tr>
              <th className="p-monday-3 text-left text-monday-sm font-semibold text-monday-text border-b border-gray-200">
                属性名
              </th>
              <th className="p-monday-3 text-left text-monday-sm font-semibold text-monday-text border-b border-gray-200">
                属性值
              </th>
              <th className="p-monday-3 text-left text-monday-sm font-semibold text-monday-text border-b border-gray-200 w-20">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isDuplicate = duplicateKeys.has(row.key.trim());
              const isEmpty = !row.key.trim() && !row.value.trim();
              
              return (
                <tr 
                  key={row.id}
                  className={`border-b border-gray-200 ${
                    isEmpty ? 'bg-blue-50/30' : 'hover:bg-monday-bg'
                  } transition-colors`}
                >
                  <td className="p-monday-2">
                    <Input
                      value={row.key}
                      onChange={(e) => handleRowChange(row.id, 'key', e.target.value)}
                      placeholder="例如: 重量"
                      className={isDuplicate ? 'border-primary-red' : ''}
                      error={isDuplicate}
                      errorMessage={isDuplicate ? '属性名重复' : undefined}
                    />
                  </td>
                  <td className="p-monday-2">
                    <Input
                      value={row.value}
                      onChange={(e) => handleRowChange(row.id, 'value', e.target.value)}
                      placeholder="例如: 10kg"
                    />
                  </td>
                  <td className="p-monday-2">
                    {rows.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRow(row.id)}
                        className="text-primary-red hover:text-primary-red hover:bg-primary-red/10"
                        aria-label="删除行"
                      >
                        🗑️
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddRow}
          leftIcon={<span>+</span>}
        >
          添加规格
        </Button>
        {duplicateKeys.size > 0 && (
          <span className="text-monday-sm text-primary-red">
            ⚠️ 有 {duplicateKeys.size} 个重复的属性名
          </span>
        )}
      </div>

      {error && errorMessage && (
        <span className="text-monday-sm text-primary-red">{errorMessage}</span>
      )}
    </div>
  );
};

