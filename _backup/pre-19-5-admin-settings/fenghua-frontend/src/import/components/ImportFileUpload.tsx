/**
 * Import File Upload Component
 * 
 * Component for uploading files for customer data import
 * Supports drag and drop, file size validation, and file type validation
 * All custom code is proprietary and not open source.
 */

import { useState, useRef, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { toast } from 'react-toastify';

export interface ImportFileUploadProps {
  onFileSelected: (file: File) => void;
  maxFileSize?: number; // bytes, default 50MB
  allowedFileTypes?: string[];
  disabled?: boolean;
}

const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB
const DEFAULT_ALLOWED_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export const ImportFileUpload: React.FC<ImportFileUploadProps> = ({
  onFileSelected,
  maxFileSize = DEFAULT_MAX_SIZE,
  allowedFileTypes = DEFAULT_ALLOWED_TYPES,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > maxFileSize) {
        return `文件大小不能超过 ${formatFileSize(maxFileSize)}`;
      }

      // Check file extension
      const fileName = file.name.toLowerCase();
      const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
      if (!hasValidExtension) {
        return `不支持的文件格式，仅支持 ${ALLOWED_EXTENSIONS.join(', ')} 格式`;
      }

      // Check MIME type (optional, as some browsers may not report correct MIME type)
      if (allowedFileTypes.length > 0 && !allowedFileTypes.includes(file.type)) {
        // Don't fail if MIME type is empty (some browsers don't report it)
        if (file.type) {
          return '不支持的文件类型';
        }
      }

      return null;
    },
    [maxFileSize, allowedFileTypes],
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }

      setSelectedFile(file);
      onFileSelected(file);
    },
    [validateFile, onFileSelected],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [disabled, handleFileSelect],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect],
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <Card variant="outlined" className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-monday-lg p-monday-8 transition-all duration-200 ${
          isDragging
            ? 'border-primary-blue bg-primary-blue/5'
            : selectedFile
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-300 bg-monday-surface hover:border-primary-blue/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={!selectedFile && !disabled ? handleBrowseClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-monday-4">
            <div className="flex items-center gap-monday-3">
              <svg
                className="w-12 h-12 text-primary-blue"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-monday-base font-medium text-monday-text truncate">
                  {selectedFile.name}
                </p>
                <p className="text-monday-sm text-monday-text-secondary">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
            >
              移除文件
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-monday-4 text-center">
            <svg
              className="w-16 h-16 text-monday-text-placeholder"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <div>
              <p className="text-monday-base font-medium text-monday-text mb-monday-1">
                拖拽文件到此处或{' '}
                <span className="text-primary-blue hover:underline">点击选择文件</span>
              </p>
              <p className="text-monday-sm text-monday-text-secondary">
                支持 CSV、XLSX、XLS 格式，最大 {formatFileSize(maxFileSize)}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

