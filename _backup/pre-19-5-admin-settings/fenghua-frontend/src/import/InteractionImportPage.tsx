/**
 * Interaction Import Page
 * 
 * Main page for interaction data bulk import
 * All custom code is proprietary and not open source.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ImportFileUpload } from './components/ImportFileUpload';
import { InteractionMappingPreview } from './components/InteractionMappingPreview';
import { ValidationResults } from './components/ValidationResults';
import { ImportProgress } from './components/ImportProgress';
import {
  uploadImportFile,
  getMappingPreview,
  validateImportData,
  startImport,
  ColumnMapping,
  MappingPreviewResponse,
  ValidationResult,
  ImportResult,
} from './interactions-import.service';
import { toast } from 'react-toastify';

type Step = 'upload' | 'mapping' | 'validation' | 'importing' | 'result' | 'history';

export const InteractionImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [fileId, setFileId] = useState<string | null>(null);
  const [mappingPreview, setMappingPreview] = useState<MappingPreviewResponse | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelected = async (file: File) => {
    setLoading(true);

    try {
      // Upload file
      const uploadResponse = await uploadImportFile(file);
      setFileId(uploadResponse.fileId);

      // Get mapping preview
      const preview = await getMappingPreview({
        fileId: uploadResponse.fileId,
      });
      setMappingPreview(preview);
      setColumnMappings(preview.columns);

      setCurrentStep('mapping');
      toast.success('文件上传成功，请配置列映射');
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast.error(error instanceof Error ? error.message : '文件上传失败');
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (mappings: ColumnMapping[]) => {
    setColumnMappings(mappings);
  };

  const handleNextFromMapping = async () => {
    if (!fileId) return;

    setLoading(true);
    try {
      // Validate import data
      const validation = await validateImportData({
        fileId,
        columnMappings,
      });
      setValidationResult(validation);
      setCurrentStep('validation');
      toast.success('数据验证完成');
    } catch (error) {
      console.error('Failed to validate data:', error);
      toast.error(error instanceof Error ? error.message : '数据验证失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!fileId || !validationResult || validationResult.validRecords === 0) {
      toast.error('没有有效记录可以导入');
      return;
    }

    setLoading(true);
    try {
      // Start import task
      const startResponse = await startImport({
        fileId,
        columnMappings,
      });
      setTaskId(startResponse.taskId);
      setCurrentStep('importing');
      toast.success('导入任务已启动');
    } catch (error) {
      console.error('Failed to start import:', error);
      toast.error(error instanceof Error ? error.message : '启动导入任务失败');
    } finally {
      setLoading(false);
    }
  };

  const handleImportComplete = (result: ImportResult) => {
    setImportResult(result);
    setCurrentStep('result');
  };

  const handleBack = () => {
    if (currentStep === 'mapping') {
      setCurrentStep('upload');
      setFileId(null);
      setMappingPreview(null);
      setColumnMappings([]);
    } else if (currentStep === 'validation') {
      setCurrentStep('mapping');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <Card title="步骤 1: 上传文件" variant="default">
            <div className="space-y-monday-4">
              <p className="text-monday-sm text-monday-text-secondary">
                请上传包含互动记录数据的 Excel 或 CSV 文件。文件大小不能超过 50MB。
              </p>
              <ImportFileUpload
                onFileSelected={handleFileSelected}
                disabled={loading}
              />
            </div>
          </Card>
        );

      case 'mapping':
        return mappingPreview ? (
          <InteractionMappingPreview
            columns={columnMappings}
            sampleData={mappingPreview.sampleData || []}
            onNext={handleNextFromMapping}
            onBack={handleBack}
            onChange={handleMappingChange}
          />
        ) : null;

      case 'validation':
        return validationResult ? (
          <ValidationResults
            validationResult={validationResult}
            onConfirm={handleConfirmImport}
            onBack={handleBack}
          />
        ) : null;

      case 'importing':
        return taskId ? (
          <ImportProgress taskId={taskId} onComplete={handleImportComplete} importType="interaction" />
        ) : null;

      case 'result':
        return importResult ? (
          <Card title="导入完成" variant="default">
            <div className="space-y-monday-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-monday-4">
                <div className="text-center">
                  <div className="text-monday-2xl font-bold text-monday-text">
                    {importResult.totalRecords}
                  </div>
                  <div className="text-monday-sm text-monday-text-secondary">总记录数</div>
                </div>
                <div className="text-center">
                  <div className="text-monday-2xl font-bold text-green-600">
                    {importResult.successRecords}
                  </div>
                  <div className="text-monday-sm text-monday-text-secondary">成功</div>
                </div>
                <div className="text-center">
                  <div className="text-monday-2xl font-bold text-primary-red">
                    {importResult.failedRecords}
                  </div>
                  <div className="text-monday-sm text-monday-text-secondary">失败</div>
                </div>
                <div className="text-center">
                  <div className="text-monday-2xl font-bold text-orange-600">
                    {importResult.errors?.length || 0}
                  </div>
                  <div className="text-monday-sm text-monday-text-secondary">错误数</div>
                </div>
              </div>
              <div className="flex justify-end gap-monday-4 pt-monday-4">
                <Button variant="outline" onClick={() => setCurrentStep('history')}>
                  查看导入历史
                </Button>
                <Button variant="primary" onClick={() => navigate('/interactions')}>
                  返回互动记录
                </Button>
              </div>
            </div>
          </Card>
        ) : null;

      case 'history':
        return (
          <div className="space-y-monday-6">
            <Card title="导入历史" variant="default">
              <p className="text-monday-sm text-monday-text-secondary">
                导入历史功能开发中...
              </p>
            </Card>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                返回导入
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout title="互动记录数据批量导入">
      <div className="space-y-monday-6">
        {/* Progress Indicator */}
        <Card variant="outlined">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-monday-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 'upload' || currentStep === 'mapping' || currentStep === 'validation'
                    ? 'bg-primary-blue text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                1
              </div>
              <span className="text-monday-sm font-medium">上传文件</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-monday-4" />
            <div className="flex items-center gap-monday-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 'mapping' || currentStep === 'validation'
                    ? 'bg-primary-blue text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                2
              </div>
              <span className="text-monday-sm font-medium">配置映射</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-monday-4" />
            <div className="flex items-center gap-monday-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 'validation' || currentStep === 'importing' || currentStep === 'result'
                    ? 'bg-primary-blue text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                3
              </div>
              <span className="text-monday-sm font-medium">验证数据</span>
            </div>
            {(currentStep === 'importing' || currentStep === 'result') && (
              <>
                <div className="flex-1 h-0.5 bg-gray-200 mx-monday-4" />
                <div className="flex items-center gap-monday-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep === 'importing' || currentStep === 'result'
                        ? 'bg-primary-blue text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    4
                  </div>
                  <span className="text-monday-sm font-medium">导入中</span>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Main Content */}
        {loading ? (
          <Card variant="default">
            <div className="flex items-center justify-center py-monday-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto mb-monday-4" />
                <p className="text-monday-base text-monday-text-secondary">处理中...</p>
              </div>
            </div>
          </Card>
        ) : (
          renderStep()
        )}

        {/* Back Button */}
        {currentStep !== 'upload' && currentStep !== 'history' && (
          <div className="flex justify-start">
            <Button variant="ghost" onClick={() => navigate('/interactions')}>
              ← 返回互动记录
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};


