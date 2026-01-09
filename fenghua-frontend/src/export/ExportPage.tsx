/**
 * Export Page
 * 
 * Main page for data export functionality
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ExportDataType, ExportFormat, startExport, getExportTaskStatus, downloadExportFile, getAvailableFields, FieldDefinition } from './export.service';
import { ExportProgress } from './components/ExportProgress';
import { ExportHistory } from './components/ExportHistory';
import { FieldSelector } from './components/FieldSelector';
import { toast } from 'react-toastify';
import { customersService } from '../customers/customers.service';
import { productsService } from '../products/products.service';
import { getSavedFieldSelection, saveFieldSelection, clearFieldSelection } from './utils/fieldSelectionStorage';

type Step = 'select' | 'exporting' | 'result' | 'history';

export const ExportPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('select');
  const [dataType, setDataType] = useState<ExportDataType>(ExportDataType.CUSTOMER);
  const [format, setFormat] = useState<ExportFormat>(ExportFormat.JSON);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableFields, setAvailableFields] = useState<FieldDefinition[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [estimatedSize, setEstimatedSize] = useState<string>('');
  const [loadingFields, setLoadingFields] = useState(false);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Load available fields and record count when data type changes
  useEffect(() => {
    const loadFields = async () => {
      setLoadingFields(true);
      try {
        const fields = await getAvailableFields(dataType);
        setAvailableFields(fields);
        
        // Try to load saved field selection, otherwise select all fields by default
        const savedSelection = getSavedFieldSelection(dataType);
        if (savedSelection && savedSelection.length > 0) {
          // Validate saved selection against available fields
          const availableFieldNames = new Set(fields.map(f => f.fieldName));
          const validSelection = savedSelection.filter(field => availableFieldNames.has(field));
          if (validSelection.length > 0) {
            setSelectedFields(validSelection);
          } else {
            // If saved selection is invalid, use all fields
            setSelectedFields(fields.map(f => f.fieldName));
          }
        } else {
          // No saved selection, select all fields by default
          setSelectedFields(fields.map(f => f.fieldName));
        }
      } catch (error) {
        console.error('Failed to load fields:', error);
        toast.error('加载字段列表失败');
        setAvailableFields([]);
        setSelectedFields([]);
      } finally {
        setLoadingFields(false);
      }
    };

    const loadRecordCount = async () => {
      try {
        let total = 0;
        switch (dataType) {
          case ExportDataType.CUSTOMER:
            const customersResult = await customersService.getCustomers({ limit: 1, offset: 0 });
            total = customersResult.total;
            break;
          case ExportDataType.PRODUCT:
            const productsResult = await productsService.getProducts({ limit: 1, offset: 0 });
            total = productsResult.total;
            break;
          case ExportDataType.INTERACTION:
            // For interactions, we'll use a default estimate since there's no direct count API
            // The export processor will fetch the actual count during export
            total = 0; // Will use default estimate
            break;
        }
        setTotalRecords(total);
      } catch (error) {
        console.error('Failed to load record count:', error);
        // Don't show error toast, just use default (0)
        setTotalRecords(0);
      }
    };

    if (currentStep === 'select') {
      loadFields();
      loadRecordCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataType, currentStep]);

  const handleStartExport = async () => {
    setLoading(true);
    try {
      const typeMap: Record<ExportDataType, 'customers' | 'products' | 'interactions'> = {
        [ExportDataType.CUSTOMER]: 'customers',
        [ExportDataType.PRODUCT]: 'products',
        [ExportDataType.INTERACTION]: 'interactions',
      };

      const request = {
        dataType,
        format,
        customerFilters: dataType === ExportDataType.CUSTOMER ? {} : undefined,
        productFilters: dataType === ExportDataType.PRODUCT ? {} : undefined,
        interactionFilters: dataType === ExportDataType.INTERACTION ? {} : undefined,
        selectedFields: selectedFields.length > 0 ? selectedFields : undefined,
      };

      const response = await startExport(typeMap[dataType], request);
      setTaskId(response.taskId);
      setCurrentStep('exporting');
      toast.success('导出任务已启动');
    } catch (error) {
      console.error('Failed to start export:', error);
      toast.error(error instanceof Error ? error.message : '导出任务启动失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExportComplete = (completedFileId: string, completedFileName: string) => {
    setFileId(completedFileId);
    setFileName(completedFileName);
    setCurrentStep('result');
    toast.success('导出完成！');
  };

  const handleDownload = async () => {
    if (!fileId) {
      toast.error('文件 ID 不存在，无法下载');
      return;
    }

    try {
      setLoading(true);
      await downloadExportFile(fileId);
      toast.success('文件下载成功');
    } catch (error) {
      console.error('Failed to download file:', error);
      toast.error(error instanceof Error ? error.message : '文件下载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentStep('select');
    setTaskId(null);
  };

  const handleViewHistory = () => {
    setCurrentStep('history');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'select':
        return (
          <Card title="数据导出" variant="default">
            <div className="space-y-monday-6">
              <div>
                <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
                  选择数据类型
                </label>
                <select
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value as ExportDataType)}
                  className="w-full px-monday-3 py-monday-2 border border-monday-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green"
                >
                  <option value={ExportDataType.CUSTOMER}>客户数据</option>
                  <option value={ExportDataType.PRODUCT}>产品数据</option>
                  <option value={ExportDataType.INTERACTION}>互动记录</option>
                </select>
              </div>

              <div>
                <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
                  选择导出格式
                </label>
                <div className="space-y-monday-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value={ExportFormat.JSON}
                      checked={format === ExportFormat.JSON}
                      onChange={(e) => setFormat(e.target.value as ExportFormat)}
                      className="mr-monday-2"
                    />
                    <span>JSON - 适用于程序处理、API 集成、数据迁移</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value={ExportFormat.CSV}
                      checked={format === ExportFormat.CSV}
                      onChange={(e) => setFormat(e.target.value as ExportFormat)}
                      className="mr-monday-2"
                    />
                    <span>CSV - 适用于 Excel 打开、数据分析、简单导入导出</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value={ExportFormat.EXCEL}
                      checked={format === ExportFormat.EXCEL}
                      onChange={(e) => setFormat(e.target.value as ExportFormat)}
                      className="mr-monday-2"
                    />
                    <span>Excel - 适用于复杂数据分析、多工作表、格式化显示</span>
                  </label>
                </div>
              </div>

              {loadingFields ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">加载字段列表...</p>
                </div>
              ) : (
                <div>
                  <FieldSelector
                    dataType={dataType}
                    availableFields={availableFields}
                    selectedFields={selectedFields}
                    onSelectionChange={setSelectedFields}
                    onEstimatedSizeChange={setEstimatedSize}
                    format={format}
                    totalRecords={totalRecords}
                    onSaveConfig={() => {
                      const success = saveFieldSelection(dataType, selectedFields);
                      if (success) {
                        toast.success('字段选择配置已保存');
                      } else {
                        toast.error('保存配置失败，请检查浏览器存储空间');
                      }
                    }}
                    onResetConfig={() => {
                      clearFieldSelection(dataType);
                      // Reset to all fields
                      setSelectedFields(availableFields.map(f => f.fieldName));
                      toast.success('已重置为默认配置（全选所有字段）');
                    }}
                  />
                  {estimatedSize && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        预计文件大小：约 {estimatedSize}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-monday-3">
                <Button
                  onClick={handleStartExport}
                  disabled={loading}
                  variant="primary"
                >
                  {loading ? '启动中...' : '开始导出'}
                </Button>
                <Button onClick={handleViewHistory} variant="secondary">
                  查看导出历史
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'exporting':
        return taskId ? (
          <ExportProgress
            taskId={taskId}
            onComplete={handleExportComplete}
            onCancel={handleBack}
          />
        ) : null;

      case 'result':
        return (
          <Card title="导出完成" variant="default">
            <div className="space-y-monday-4">
              <div className="space-y-monday-2">
                <p className="text-monday-sm text-monday-text">
                  导出任务已完成，您可以下载导出文件。
                </p>
                {fileName && (
                  <p className="text-monday-sm text-monday-text-secondary">
                    文件名: {fileName}
                  </p>
                )}
              </div>
              <div className="flex gap-monday-3">
                {fileId && (
                  <Button onClick={handleDownload} variant="primary" disabled={loading}>
                    {loading ? '下载中...' : '下载文件'}
                  </Button>
                )}
                <Button onClick={handleBack} variant="secondary" disabled={loading}>
                  返回
                </Button>
                <Button onClick={handleViewHistory} variant="secondary" disabled={loading}>
                  查看导出历史
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'history':
        return (
          <ExportHistory onBack={handleBack} />
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout title="数据导出">
      <div className="w-full max-w-4xl mx-auto">
        {renderStep()}
      </div>
    </MainLayout>
  );
};

