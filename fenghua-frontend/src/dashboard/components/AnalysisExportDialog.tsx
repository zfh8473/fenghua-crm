/**
 * Analysis Export Dialog Component
 * 
 * Dialog for selecting export format and options
 * All custom code is proprietary and not open source.
 */

import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { exportAnalysis, AnalysisType, ExportFormat } from '../services/analysis-export.service';
import { exportChartToImage, exportMultipleChartsToImage } from '../utils/chart-export';

export interface AnalysisExportDialogProps {
  /**
   * Analysis type
   */
  analysisType: AnalysisType;

  /**
   * Current query parameters
   */
  queryParams?: Record<string, any>;

  /**
   * Chart element IDs for image export
   */
  chartElementIds?: string[];

  /**
   * Whether dialog is open
   */
  isOpen: boolean;

  /**
   * Callback when dialog is closed
   */
  onClose: () => void;

  /**
   * User authentication token
   */
  token: string;
}

/**
 * Analysis Export Dialog
 */
export const AnalysisExportDialog: React.FC<AnalysisExportDialogProps> = ({
  analysisType,
  queryParams,
  chartElementIds = [],
  isOpen,
  onClose,
  token,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [includeCharts, setIncludeCharts] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      // For image formats, use frontend export
      if (selectedFormat === 'png' || selectedFormat === 'jpeg') {
        if (chartElementIds.length === 0) {
          throw new Error('没有可导出的图表');
        }

        if (chartElementIds.length === 1) {
          await exportChartToImage(
            chartElementIds[0],
            selectedFormat,
            `${analysisType}_${new Date().toISOString().split('T')[0]}.${selectedFormat}`,
          );
        } else {
          await exportMultipleChartsToImage(
            chartElementIds,
            selectedFormat,
            `${analysisType}_${new Date().toISOString().split('T')[0]}.${selectedFormat}`,
          );
        }
      } else {
        // For other formats, call backend API
        await exportAnalysis(token, {
          analysisType,
          format: selectedFormat,
          queryParams,
          includeCharts: selectedFormat === 'pdf' ? includeCharts : undefined,
        });
      }

      // Success - close dialog
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '导出失败，请稍后重试';
      setError(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const formatLabels: Record<ExportFormat, string> = {
    csv: 'CSV 格式（数据表格）',
    excel: 'Excel 格式（数据表格）',
    pdf: 'PDF 格式（完整报告）',
    png: 'PNG 图片（图表）',
    jpeg: 'JPEG 图片（图表）',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-monday-6 max-w-md w-full mx-monday-4">
        <h2 className="text-monday-xl font-semibold text-monday-text mb-monday-4">
          导出分析结果
        </h2>

        {/* Format Selection */}
        <div className="mb-monday-6">
          <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
            选择导出格式
          </label>
          <div className="space-y-monday-2">
            {(['csv', 'excel', 'pdf', 'png', 'jpeg'] as ExportFormat[]).map((format) => (
              <label
                key={format}
                className="flex items-center space-x-monday-2 cursor-pointer hover:bg-gray-50 p-monday-2 rounded transition-colors duration-200"
              >
                <input
                  type="radio"
                  name="exportFormat"
                  value={format}
                  checked={selectedFormat === format}
                  onChange={() => setSelectedFormat(format)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-monday-sm text-monday-text">
                  {formatLabels[format]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Options for PDF */}
        {selectedFormat === 'pdf' && (
          <div className="mb-monday-6">
            <label className="flex items-center space-x-monday-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCharts}
                onChange={(e) => setIncludeCharts(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-monday-sm text-monday-text">
                包含图表（注意：图表导出由前端处理）
              </span>
            </label>
          </div>
        )}

        {/* Image format notice */}
        {(selectedFormat === 'png' || selectedFormat === 'jpeg') && (
          <div className="mb-monday-6 p-monday-3 bg-blue-50 rounded text-monday-sm text-blue-700">
            {chartElementIds.length === 0
              ? '没有可导出的图表'
              : chartElementIds.length === 1
                ? '将导出当前页面的图表'
                : `将导出 ${chartElementIds.length} 个图表`}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-monday-4 p-monday-3 bg-red-50 rounded text-monday-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-monday-3">
          <Button variant="secondary" onClick={onClose} disabled={isExporting}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? '导出中...' : '导出'}
          </Button>
        </div>
      </div>
    </div>
  );
};

