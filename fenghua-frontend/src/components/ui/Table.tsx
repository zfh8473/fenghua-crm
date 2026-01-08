/**
 * Table Component
 * 
 * A table component with Monday.com style design tokens.
 * Features clean design, row hover effects, and responsive design.
 * Supports sorting, row click handlers, and keyboard navigation.
 * 
 * @example
 * ```tsx
 * const columns = [
 *   { key: 'name', header: 'Name', sortable: true },
 *   { key: 'email', header: 'Email' },
 * ];
 * 
 * const data = [
 *   { id: 1, name: 'John', email: 'john@example.com' },
 *   { id: 2, name: 'Jane', email: 'jane@example.com' },
 * ];
 * 
 * <Table
 *   columns={columns}
 *   data={data}
 *   onRowClick={(row) => console.log(row)}
 * />
 * ```
 * 
 * All custom code is proprietary and not open source.
 */

import React, { useState } from 'react';

export interface Column<T> {
  /**
   * Unique key for the column
   */
  key: string;
  
  /**
   * Header text
   */
  header: string;
  
  /**
   * Custom render function for cell content
   */
  render?: (value: any, row: T) => React.ReactNode;
  
  /**
   * Enable sorting for this column
   * @default false
   */
  sortable?: boolean;
  
  /**
   * Column width
   */
  width?: string | number;
}

export interface TableProps<T> {
  /**
   * Column definitions
   */
  columns: Column<T>[];
  
  /**
   * Table data
   */
  data: T[];
  
  /**
   * Row click handler
   */
  onRowClick?: (row: T) => void;
  
  /**
   * Enable sorting
   * @default false
   */
  sortable?: boolean;
  
  /**
   * Function to extract unique key from row data
   * If not provided, will use row index as fallback
   */
  rowKey?: (row: T, index: number) => string | number;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Table aria-label for accessibility
   */
  'aria-label'?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  sortable = false,
  rowKey,
  className = '',
  'aria-label': ariaLabel,
  ...props
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const handleSort = (columnKey: string) => {
    if (!sortable) return;
    
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };
  
  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortable) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection, sortable]);
  
  const handleRowClick = (row: T) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent, row: T) => {
    if (event.key === 'Enter' && onRowClick) {
      onRowClick(row);
    }
  };
  
  return (
    <div className={`rounded-monday-lg overflow-hidden bg-monday-surface border border-gray-200 ${className}`.trim()}>
      <div className="overflow-x-auto">
        <table
          className="w-full"
          role="table"
          aria-label={ariaLabel}
          {...props}
        >
          <thead>
            <tr className="bg-monday-bg border-b border-gray-200">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`p-monday-2 p-monday-4 text-left text-monday-sm font-semibold text-monday-text ${
                    column.sortable && sortable
                      ? 'cursor-pointer hover:bg-gray-100 select-none'
                      : ''
                  }`}
                  style={column.width ? { width: column.width } : undefined}
                  onClick={() => column.sortable && handleSort(column.key)}
                  aria-sort={
                    sortable && column.sortable && sortColumn === column.key
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  <div className="flex items-center gap-monday-2">
                    {column.header}
                    {column.sortable && sortable && sortColumn === column.key && (
                      <span className="text-monday-text-secondary" aria-hidden="true">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-monday-8 text-center text-monday-text-secondary">
                  No data available
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => {
                // Generate unique key: use rowKey function if provided, otherwise try row.id or first column value, fallback to index
                const uniqueKey = rowKey
                  ? rowKey(row, rowIndex)
                  : (row as any).id !== undefined
                  ? (row as any).id
                  : row[columns[0]?.key] !== undefined
                  ? `${row[columns[0].key]}-${rowIndex}`
                  : rowIndex;
                
                return (
                  <tr
                    key={uniqueKey}
                    className={`border-b border-gray-200 hover:bg-monday-bg transition-colors duration-150 ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => handleRowClick(row)}
                    onKeyDown={(e) => handleKeyDown(e, row)}
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? 'button' : undefined}
                    aria-label={onRowClick ? `Row ${rowIndex + 1}` : undefined}
                  >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="p-monday-2 p-monday-4 text-monday-sm text-monday-text"
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

