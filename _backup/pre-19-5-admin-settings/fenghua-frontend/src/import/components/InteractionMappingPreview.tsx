/**
 * Interaction Mapping Preview Component
 * 
 * Displays and allows editing of column mappings for interaction import
 * All custom code is proprietary and not open source.
 */

import { useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ColumnMapping } from '../interactions-import.service';

export interface InteractionMappingPreviewProps {
  columns: ColumnMapping[];
  sampleData: Record<string, any>[];
  onNext: () => void;
  onBack?: () => void;
  onChange?: (mappings: ColumnMapping[]) => void;
}

/**
 * CRM fields for interactions
 */
const CRM_FIELDS = [
  { value: 'customerName', label: '客户名称', required: true },
  { value: 'customerCode', label: '客户代码', required: false },
  { value: 'customerId', label: '客户ID', required: false },
  { value: 'productName', label: '产品名称', required: true },
  { value: 'productHsCode', label: '产品HS编码', required: false },
  { value: 'productIds', label: '产品ID（多个）', required: false },
  { value: 'interactionType', label: '互动类型', required: true },
  { value: 'interactionDate', label: '互动时间', required: true },
  { value: 'description', label: '互动描述', required: false },
  { value: 'status', label: '状态', required: false },
  { value: 'additionalInfo', label: '额外信息', required: false },
];

export const InteractionMappingPreview: React.FC<InteractionMappingPreviewProps> = ({
  columns,
  sampleData,
  onNext,
  onBack,
  onChange,
}) => {
  const [mappings, setMappings] = useState<ColumnMapping[]>(columns);

  const handleMappingChange = (excelColumn: string, crmField: string | undefined) => {
    const updated = mappings.map(m =>
      m.excelColumn === excelColumn ? { ...m, crmField } : m,
    );
    setMappings(updated);
    onChange?.(updated);
  };

  const hasRequiredMappings = useMemo(() => {
    const mappedFields = mappings.filter((col) => col.crmField).map((col) => col.crmField);
    return (
      (mappedFields.includes('customerName') || mappedFields.includes('customerCode') || mappedFields.includes('customerId')) &&
      (mappedFields.includes('productName') || mappedFields.includes('productHsCode') || mappedFields.includes('productIds')) &&
      mappedFields.includes('interactionType') &&
      mappedFields.includes('interactionDate')
    );
  }, [mappings]);

  return (
    <Card variant="default" className="w-full">
      <div className="p-monday-6">
        <h2 className="text-monday-2xl font-bold mb-monday-4">列映射配置</h2>
        <p className="text-monday-base text-monday-gray-600 mb-monday-6">
          请将 Excel 列映射到 CRM 字段。标记为 <span className="text-red-500">*</span> 的字段为必填项。
        </p>

        <div className="overflow-x-auto mb-monday-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-monday-gray-100">
                <th className="border border-monday-gray-300 p-monday-3 text-left">Excel 列</th>
                <th className="border border-monday-gray-300 p-monday-3 text-left">CRM 字段</th>
                <th className="border border-monday-gray-300 p-monday-3 text-left">建议字段</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((column, index) => (
                <tr key={index} className="hover:bg-monday-gray-50">
                  <td className="border border-monday-gray-300 p-monday-3">{column.excelColumn}</td>
                  <td className="border border-monday-gray-300 p-monday-3">
                    <select
                      value={column.crmField || ''}
                      onChange={(e) => handleMappingChange(column.excelColumn, e.target.value || undefined)}
                      className="w-full p-monday-2 border border-monday-gray-300 rounded"
                    >
                      <option value="">-- 选择字段 --</option>
                      {CRM_FIELDS.map((field) => (
                        <option key={field.value} value={field.value}>
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-monday-gray-300 p-monday-3 text-monday-gray-500">
                    {column.suggestedField || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sampleData.length > 0 && (
          <div className="mb-monday-6">
            <h3 className="text-monday-lg font-semibold mb-monday-3">数据预览（前 5 行）</h3>
            <div className="overflow-x-auto border border-monday-gray-300 rounded">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-monday-gray-100">
                    {Object.keys(sampleData[0] || {}).map((key) => (
                      <th key={key} className="border border-monday-gray-300 p-monday-2 text-left text-sm">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleData.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.entries(row).map(([key, value]) => (
                        <td key={key} className="border border-monday-gray-300 p-monday-2 text-sm">
                          {String(value || '-')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              上一步
            </Button>
          )}
          <Button variant="primary" onClick={onNext} disabled={!hasRequiredMappings}>
            下一步：验证数据
          </Button>
        </div>
      </div>
    </Card>
  );
};


