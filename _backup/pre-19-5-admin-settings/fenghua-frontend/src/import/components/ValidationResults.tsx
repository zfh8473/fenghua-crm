/**
 * Validation Results Component
 * 
 * Component for displaying data validation results, errors, cleaning suggestions, and duplicates
 * All custom code is proprietary and not open source.
 */

import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import {
  ValidationResult,
  ValidationErrorDetail,
  DataCleaningSuggestion,
  DuplicateDetection,
} from '../customers-import.service';

export interface ValidationResultsProps {
  validationResult: ValidationResult;
  onConfirm: () => void;
  onBack: () => void;
  onApplyCleaning?: (suggestions: DataCleaningSuggestion[]) => void;
}

export const ValidationResults: React.FC<ValidationResultsProps> = ({
  validationResult,
  onConfirm,
  onBack,
  onApplyCleaning,
}) => {
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());
  const [expandedDuplicates, setExpandedDuplicates] = useState<Set<number>>(new Set());
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<number>>(new Set());
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<number>>(new Set());

  const toggleError = (row: number) => {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(row)) {
        next.delete(row);
      } else {
        next.add(row);
      }
      return next;
    });
  };

  const toggleDuplicate = (row: number) => {
    setExpandedDuplicates((prev) => {
      const next = new Set(prev);
      if (next.has(row)) {
        next.delete(row);
      } else {
        next.add(row);
      }
      return next;
    });
  };

  const toggleSuggestion = (row: number) => {
    setExpandedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(row)) {
        next.delete(row);
      } else {
        next.add(row);
      }
      return next;
    });
  };

  const handleApplySuggestion = (suggestion: DataCleaningSuggestion) => {
    if (onApplyCleaning) {
      onApplyCleaning([suggestion]);
      setAppliedSuggestions((prev) => new Set(prev).add(suggestion.row));
    }
  };

  const handleApplyAllSuggestions = () => {
    if (onApplyCleaning && validationResult.cleaningSuggestions) {
      onApplyCleaning(validationResult.cleaningSuggestions);
      setAppliedSuggestions(
        new Set(validationResult.cleaningSuggestions.map((s) => s.row)),
      );
    }
  };

  const errorTableColumns = [
    {
      key: 'row',
      header: '行号',
      render: (value: number) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'errors',
      header: '错误信息',
      render: (value: string[], row: ValidationErrorDetail) => (
        <div className="space-y-monday-1">
          <div className="text-monday-sm text-primary-red">
            {value.length} 个错误
          </div>
          {expandedErrors.has(row.row) && (
            <div className="mt-monday-2 space-y-monday-1">
              {value.map((error, idx) => (
                <div key={idx} className="text-monday-sm text-monday-text-secondary">
                  • {error}
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (_: any, row: ValidationErrorDetail) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleError(row.row)}
        >
          {expandedErrors.has(row.row) ? '收起' : '展开'}
        </Button>
      ),
    },
  ];

  const duplicateTableColumns = [
    {
      key: 'row',
      header: '行号',
      render: (value: number) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'field',
      header: '字段',
      render: (value: string) => <span className="text-monday-sm">{value}</span>,
    },
    {
      key: 'value',
      header: '值',
      render: (value: string) => <span className="text-monday-sm">{value}</span>,
    },
    {
      key: 'existing',
      header: '已存在客户',
      render: (_: any, row: DuplicateDetection) =>
        row.existingCustomerName ? (
          <span className="text-monday-sm text-monday-text-secondary">
            {row.existingCustomerName}
          </span>
        ) : (
          <span className="text-monday-sm text-monday-text-placeholder">未知</span>
        ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (_: any, row: DuplicateDetection) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleDuplicate(row.row)}
        >
          {expandedDuplicates.has(row.row) ? '收起' : '详情'}
        </Button>
      ),
    },
  ];

  const suggestionTableColumns = [
    {
      key: 'row',
      header: '行号',
      render: (value: number) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'field',
      header: '字段',
      render: (value: string) => <span className="text-monday-sm">{value}</span>,
    },
    {
      key: 'originalValue',
      header: '原始值',
      render: (value: string) => (
        <span className="text-monday-sm text-monday-text-secondary">{value}</span>
      ),
    },
    {
      key: 'suggestedValue',
      header: '建议值',
      render: (value: string) => (
        <span className="text-monday-sm text-primary-blue font-medium">{value}</span>
      ),
    },
    {
      key: 'reason',
      header: '原因',
      render: (value: string) => <span className="text-monday-sm">{value}</span>,
    },
    {
      key: 'actions',
      header: '操作',
      render: (_: any, row: DataCleaningSuggestion) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleApplySuggestion(row)}
          disabled={appliedSuggestions.has(row.row)}
        >
          {appliedSuggestions.has(row.row) ? '已应用' : '应用'}
        </Button>
      ),
    },
  ];

  const canProceed = validationResult.validRecords > 0;

  return (
    <div className="space-y-monday-6">
      {/* Summary Card */}
      <Card title="验证结果摘要" variant="default">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-monday-4">
          <div className="text-center">
            <div className="text-monday-2xl font-bold text-monday-text">
              {validationResult.totalRecords}
            </div>
            <div className="text-monday-sm text-monday-text-secondary">总记录数</div>
          </div>
          <div className="text-center">
            <div className="text-monday-2xl font-bold text-green-600">
              {validationResult.validRecords}
            </div>
            <div className="text-monday-sm text-monday-text-secondary">有效记录</div>
          </div>
          <div className="text-center">
            <div className="text-monday-2xl font-bold text-primary-red">
              {validationResult.invalidRecords}
            </div>
            <div className="text-monday-sm text-monday-text-secondary">无效记录</div>
          </div>
          <div className="text-center">
            <div className="text-monday-2xl font-bold text-orange-600">
              {validationResult.duplicates?.length || 0}
            </div>
            <div className="text-monday-sm text-monday-text-secondary">重复记录</div>
          </div>
        </div>
      </Card>

      {/* Errors */}
      {validationResult.hasErrors && validationResult.errors && (
        <Card title="验证错误" variant="default">
          <div className="space-y-monday-4">
            <p className="text-monday-sm text-monday-text-secondary">
              发现 {validationResult.errors.length} 条记录存在验证错误，请修复后重新上传。
            </p>
            <Table columns={errorTableColumns} data={validationResult.errors} />
          </div>
        </Card>
      )}

      {/* Duplicates */}
      {validationResult.hasDuplicates && validationResult.duplicates && (
        <Card title="重复检测" variant="default">
          <div className="space-y-monday-4">
            <p className="text-monday-sm text-monday-text-secondary">
              发现 {validationResult.duplicates.length} 条记录可能与现有客户重复。
            </p>
            <Table columns={duplicateTableColumns} data={validationResult.duplicates} />
          </div>
        </Card>
      )}

      {/* Cleaning Suggestions */}
      {validationResult.hasCleaningSuggestions && validationResult.cleaningSuggestions && (
        <Card title="数据清洗建议" variant="default">
          <div className="space-y-monday-4">
            <div className="flex items-center justify-between">
              <p className="text-monday-sm text-monday-text-secondary">
                发现 {validationResult.cleaningSuggestions.length} 条数据清洗建议。
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleApplyAllSuggestions}
                disabled={
                  validationResult.cleaningSuggestions.every((s) =>
                    appliedSuggestions.has(s.row),
                  )
                }
              >
                应用所有建议
              </Button>
            </div>
            <Table columns={suggestionTableColumns} data={validationResult.cleaningSuggestions} />
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between gap-monday-4">
        <Button variant="outline" onClick={onBack}>
          上一步
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={!canProceed}
        >
          {canProceed ? '确认导入' : '无法导入（无有效记录）'}
        </Button>
      </div>
    </div>
  );
};

