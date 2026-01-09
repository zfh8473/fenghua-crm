/**
 * Product Mapping Preview Component
 * 
 * Component for displaying and editing column mappings between Excel columns and product CRM fields
 * All custom code is proprietary and not open source.
 */

import { useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { ColumnMapping } from '../products-import.service';

export interface ProductMappingPreviewProps {
  columns: ColumnMapping[];
  sampleData: Record<string, any>[];
  onMappingChange: (mappings: ColumnMapping[]) => void;
  onNext: () => void;
  onBack: () => void;
}

// Available product CRM fields
const PRODUCT_CRM_FIELDS = [
  { value: 'name', label: '产品名称', required: true },
  { value: 'hsCode', label: 'HS编码', required: true },
  { value: 'category', label: '产品类别', required: true },
  { value: 'description', label: '产品描述', required: false },
  { value: 'specifications', label: '产品规格', required: false },
  { value: 'imageUrl', label: '产品图片URL', required: false },
];

export const ProductMappingPreview: React.FC<ProductMappingPreviewProps> = ({
  columns: initialColumns,
  sampleData,
  onMappingChange,
  onNext,
  onBack,
}) => {
  const [columns, setColumns] = useState<ColumnMapping[]>(initialColumns);

  const handleFieldChange = (excelColumn: string, crmField: string) => {
    const updated = columns.map((col) =>
      col.excelColumn === excelColumn ? { ...col, crmField: crmField || undefined } : col,
    );
    setColumns(updated);
    onMappingChange(updated);
  };

  const mappingTableColumns = useMemo(
    () => [
      {
        key: 'excelColumn',
        header: 'Excel 列名',
        render: (value: string) => <span className="font-medium">{value}</span>,
      },
      {
        key: 'crmField',
        header: 'CRM 字段',
        render: (value: string | undefined, row: ColumnMapping) => (
          <select
            className="w-full rounded-monday-md border border-gray-300 px-monday-3 py-monday-2 text-monday-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
            value={value || ''}
            onChange={(e) => handleFieldChange(row.excelColumn, e.target.value)}
          >
            <option value="">-- 不映射 --</option>
            {PRODUCT_CRM_FIELDS.map((field) => (
              <option key={field.value} value={field.value}>
                {field.label} {field.required ? '*' : ''}
              </option>
            ))}
          </select>
        ),
      },
      {
        key: 'suggestedField',
        header: '建议字段',
        render: (value: string | undefined) =>
          value ? (
            <span className="text-monday-sm text-monday-text-secondary">{value}</span>
          ) : (
            <span className="text-monday-sm text-monday-text-placeholder">无建议</span>
          ),
      },
    ],
    [columns],
  );

  const sampleTableColumns = useMemo(() => {
    if (sampleData.length === 0) return [];

    const excelColumns = columns.map((col) => col.excelColumn);
    return excelColumns.map((col) => ({
      key: col,
      header: col,
      render: (value: any) => (
        <span className="text-monday-sm text-monday-text">{String(value ?? '')}</span>
      ),
    }));
  }, [columns, sampleData]);

  const hasRequiredMappings = useMemo(() => {
    const mappedFields = columns.filter((col) => col.crmField).map((col) => col.crmField);
    return (
      mappedFields.includes('name') &&
      mappedFields.includes('hsCode') &&
      mappedFields.includes('category')
    );
  }, [columns]);

  return (
    <div className="space-y-monday-6">
      {/* Column Mapping Section */}
      <Card title="列映射配置" variant="default">
        <div className="space-y-monday-4">
          <p className="text-monday-sm text-monday-text-secondary">
            请将 Excel 列映射到产品 CRM 字段。至少需要映射"产品名称"、"HS编码"和"产品类别"字段（标记为 *）。
          </p>
          <Table columns={mappingTableColumns} data={columns} />
        </div>
      </Card>

      {/* Sample Data Preview */}
      {sampleData.length > 0 && (
        <Card title="数据样本预览（前 10 行）" variant="default">
          <div className="overflow-x-auto">
            <Table columns={sampleTableColumns} data={sampleData} />
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between gap-monday-4">
        <Button variant="outline" onClick={onBack}>
          上一步
        </Button>
        <Button variant="primary" onClick={onNext} disabled={!hasRequiredMappings}>
          下一步：验证数据
        </Button>
      </div>
    </div>
  );
};


