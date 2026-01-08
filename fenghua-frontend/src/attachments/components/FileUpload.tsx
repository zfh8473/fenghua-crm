/**
 * File Upload Component
 * 
 * Component for uploading files with progress tracking
 * All custom code is proprietary and not open source.
 */

import { useState, useRef, useEffect } from 'react';
import { uploadFile, deleteAttachment, formatFileSize, Attachment } from '../services/attachments.service';
import { toast } from 'react-toastify';
import imageCompression from 'browser-image-compression';
import { PhotoPreview } from './PhotoPreview';
import { useMediaQuery } from '../../interactions/hooks/useMediaQuery';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FileUploadProps {
  onFilesUploaded: (attachments: Attachment[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // bytes
  allowedFileTypes?: string[];
  initialAttachments?: Attachment[];
  photoOnly?: boolean; // 仅允许照片模式
}

const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const PHOTO_ONLY_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUploaded,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedFileTypes = DEFAULT_ALLOWED_TYPES,
  initialAttachments = [],
  photoOnly = false,
}) => {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Attachment[]>(initialAttachments);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<{ fileId: string; annotation: string } | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'checking'>(
    typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline'
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadAreaRef = useRef<HTMLDivElement | null>(null);
  const retryToastShownRef = useRef<Set<string>>(new Set());

  // 移动端检测
  const isMobile = useMediaQuery('(max-width: 767px)');

  // 批量上传并发控制
  const MAX_CONCURRENT_UPLOADS = 3;
  const uploadQueueRef = useRef<File[]>([]);
  const activeUploadsRef = useRef(0);

  // 根据 activeUploadsRef 和队列状态计算 uploading
  const uploading = activeUploadsRef.current > 0 || uploadQueueRef.current.length > 0;

  // 根据 photoOnly 模式确定允许的文件类型
  const effectiveAllowedTypes = photoOnly ? PHOTO_ONLY_TYPES : allowedFileTypes;

  // 检测是否支持拖拽（移动端不支持）
  const supportsDragDrop = typeof window !== 'undefined' && 'draggable' in document.createElement('div') && !isMobile;

  // 网络状态检测
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setNetworkStatus('online');
      toast.success('网络连接已恢复');
    };

    const handleOffline = () => {
      setNetworkStatus('offline');
      toast.warn('网络连接已断开');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 拖拽排序传感器（使用 @dnd-kit）
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 移动 8px 后才开始拖拽，避免误触
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 同步 initialAttachments 变化（使用深度比较避免无限循环）
  const prevInitialAttachmentsRef = useRef<Attachment[]>(initialAttachments);
  const initialAttachmentsStringRef = useRef<string>('');
  
  useEffect(() => {
    // 使用 JSON.stringify 进行深度比较，避免引用变化导致的无限循环
    const currentString = JSON.stringify(initialAttachments.map(a => ({ id: a.id, fileName: a.fileName })));
    
    if (currentString !== initialAttachmentsStringRef.current) {
      setUploadedFiles([...initialAttachments]); // 创建新数组避免引用问题
      prevInitialAttachmentsRef.current = initialAttachments;
      initialAttachmentsStringRef.current = currentString;
    }
  }, [initialAttachments]);

  // 组件卸载时清理编辑状态
  useEffect(() => {
    return () => {
      setEditingAnnotation(null);
    };
  }, []);

  /**
   * 获取照片在照片列表中的索引
   * @param fileId - 文件 ID
   * @returns 照片索引，如果未找到返回 null
   */
  const getPhotoIndex = (fileId: string): number | null => {
    const photoFiles = uploadedFiles.filter((f) => f.fileType === 'photo');
    const photoIndex = photoFiles.findIndex((f) => f.id === fileId);
    return photoIndex !== -1 ? photoIndex : null;
  };

  /**
   * 验证文件
   */
  const validateFiles = (files: File[]): File[] => {
    const validFiles: File[] = [];
    const maxSizeMB = (maxFileSize / 1024 / 1024).toFixed(0);
    for (const file of files) {
      if (file.size > maxFileSize) {
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        const errorMsg = `文件大小 ${fileSizeMB}MB 超过限制（最大 ${maxSizeMB}MB）`;
        setErrors((prev) => ({
          ...prev,
          [file.name]: errorMsg,
        }));
        toast.error(`${file.name}: ${errorMsg}`);
        continue;
      }
      if (!effectiveAllowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          [file.name]: '不支持的文件类型',
        }));
        toast.error(`${file.name}: 不支持的文件类型`);
        continue;
      }
      validFiles.push(file);
    }
    return validFiles;
  };

  /**
   * 处理文件（验证并添加到上传队列）
   */
  const handleFiles = (files: File[]) => {
    // Check max files limit
    if (uploadedFiles.length + files.length > maxFiles) {
      toast.error(`最多只能上传 ${maxFiles} 个文件`);
      return;
    }

    // Validate files
    const validFiles = validateFiles(files);
    if (validFiles.length === 0) {
      return;
    }

    // 添加到上传队列
    uploadQueueRef.current.push(...validFiles);

    // 开始处理队列
    processUploadQueue();
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    handleFiles(files);

    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  /**
   * 处理上传队列（并发控制）
   */
  const processUploadQueue = async () => {
    while (uploadQueueRef.current.length > 0 && activeUploadsRef.current < MAX_CONCURRENT_UPLOADS) {
      const file = uploadQueueRef.current.shift();
      if (file) {
        activeUploadsRef.current++;
        uploadSingleFile(file)
          .then(() => {
            activeUploadsRef.current--;
            // 使用 setTimeout 避免同步递归，防止调用栈溢出
            setTimeout(() => processUploadQueue(), 0);
          })
          .catch((error) => {
            activeUploadsRef.current--;
            // 错误已在 uploadSingleFile 中处理
            // 使用 setTimeout 避免同步递归
            setTimeout(() => processUploadQueue(), 0);
          });
      }
    }
  };

  /**
   * 压缩图片文件（如果文件大于 2MB）
   * @param file - 要压缩的图片文件
   * @returns 压缩后的文件（如果压缩失败或文件小于 2MB，返回原文件）
   * @throws {Error} 如果文件超过 10MB 且压缩失败，抛出错误
   */
  const compressImage = async (file: File): Promise<File> => {
    // 如果文件已经小于 2MB，跳过压缩
    if (file.size <= 2 * 1024 * 1024) {
      return file;
    }

    // 只压缩图片文件
    if (!file.type.startsWith('image/')) {
      return file;
    }

    const options = {
      maxSizeMB: 2, // 压缩后目标大小 2MB
      maxWidthOrHeight: 1920, // 最大宽度或高度 1920px
      useWebWorker: true, // 使用 Web Worker 加速压缩
      fileType: file.type, // 保持原始文件类型
      initialQuality: 0.8, // 初始质量 80%
    };

    try {
      // 显示压缩提示
      toast.info(`正在压缩照片: ${file.name}...`);

      const compressedFile = await imageCompression(file, options);

      // 验证压缩后的文件大小（确保不超过限制）
      if (compressedFile.size > 10 * 1024 * 1024) {
        toast.warn(`照片压缩后仍超过 10MB，将使用原文件: ${file.name}`);
        return file;
      }

      // 显示压缩结果
      const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
      const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
      toast.success(
        `照片压缩完成: ${file.name} (${originalSizeMB}MB → ${compressedSizeMB}MB)`,
      );

      return compressedFile;
    } catch (error) {
      console.error('照片压缩失败', error);
      toast.warn(`照片压缩失败，将使用原文件: ${file.name}`);
      // 如果压缩失败，返回原文件（但需要验证文件大小）
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('照片文件过大且压缩失败，无法上传');
      }
      return file;
    }
  };

  /**
   * Upload a single file with retry mechanism
   * @param file - File to upload
   * @param retryCount - Current retry attempt (default: 0)
   */
  const uploadSingleFile = async (file: File, retryCount: number = 0): Promise<void> => {
    const MAX_RETRIES = 3;
    const BASE_DELAY = 1000; // 1秒

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[file.name];
      return newErrors;
    });

    try {
      // 检测网络状态（使用 navigator.onLine 作为初步检查）
      // 注意：navigator.onLine 只能检测设备是否连接到网络，不能检测是否能访问互联网
      // 实际的网络连接状态会在上传请求失败时通过重试机制处理
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setNetworkStatus('offline');
        throw new Error('网络连接不可用');
      }

      // 如果是照片模式，先压缩照片
      let fileToUpload = file;
      if (photoOnly && file.type.startsWith('image/')) {
        try {
          fileToUpload = await compressImage(file);
        } catch (compressError) {
          // 压缩失败且文件过大，提供更详细的错误信息
          if (file.size > 10 * 1024 * 1024) {
            const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
            throw new Error(
              `照片 "${file.name}" 过大（${fileSizeMB}MB）且压缩失败，无法上传。请先压缩照片后再上传。`
            );
          }
          // 如果文件不大，继续使用原文件
          throw compressError;
        }
      }

      const attachment = await uploadFile(fileToUpload, (progress) => {
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: progress,
        }));
      });

      setUploadedFiles((prev) => {
        const newFiles = [...prev, attachment];
        onFilesUploaded(newFiles);
        return newFiles;
      });

      // Clear progress after upload
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[file.name];
        return newProgress;
      });

      toast.success(`${file.name} 上传成功`);
      // 清除重试提示标记（如果存在）
      retryToastShownRef.current.delete(file.name);
    } catch (error) {
      // 如果还有重试次数，进行重试
      if (retryCount < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retryCount); // 指数退避：1s, 2s, 4s

        // 只在第一次重试时显示提示，避免多个文件同时失败时 toast 过多
        if (!retryToastShownRef.current.has(file.name)) {
          toast.info(
            `${file.name} 上传失败，正在重试... (${retryCount + 1}/${MAX_RETRIES})`,
            {
              autoClose: 3000,
            }
          );
          retryToastShownRef.current.add(file.name);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        return uploadSingleFile(file, retryCount + 1);
      }

      // 重试次数用尽，清除重试提示标记
      retryToastShownRef.current.delete(file.name);

      // 重试次数用尽，显示错误
      const errorMessage = error instanceof Error ? error.message : '文件上传失败';
      setErrors((prev) => ({
        ...prev,
        [file.name]: errorMessage,
      }));
      toast.error(
        `${file.name}: ${errorMessage}。上传失败，请稍后重试或稍后在办公室完成记录。`,
        {
          autoClose: 5000,
        }
      );
    }
  };

  /**
   * Handle file deletion
   */
  const handleDelete = async (attachmentId: string, fileName: string) => {
    if (!confirm(`确定要删除文件 "${fileName}" 吗？`)) {
      return;
    }

    try {
      await deleteAttachment(attachmentId);
      setUploadedFiles((prev) => {
        const newFiles = prev.filter((f) => f.id !== attachmentId);
        onFilesUploaded(newFiles);
        return newFiles;
      });
      toast.success('文件删除成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '文件删除失败';
      toast.error(errorMessage);
    }
  };

  /**
   * 拖拽上传处理
   */
  const handleDragEnter = (e: React.DragEvent) => {
    // 检查事件目标，避免与照片排序拖拽冲突
    // 只在上传区域（不包括照片网格）处理文件拖拽
    const target = e.target as Node;
    if (!uploadAreaRef.current?.contains(target)) {
      return;
    }
    // 检查是否在照片网格区域内（通过检查父元素）
    const photoGrid = (target as Element)?.closest('.grid');
    if (photoGrid) {
      // 在照片网格内，不处理文件拖拽（让照片排序处理）
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // 检查是否真的离开了上传区域
    if (!uploadAreaRef.current?.contains(e.relatedTarget as Node)) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    // 检查事件目标，避免与照片排序拖拽冲突
    // 只在上传区域（不包括照片网格）处理文件拖拽
    const target = e.target as Node;
    if (!uploadAreaRef.current?.contains(target)) {
      return;
    }
    // 检查是否在照片网格区域内（通过检查父元素）
    const photoGrid = (target as Element)?.closest('.grid');
    if (photoGrid) {
      // 在照片网格内，不处理文件拖拽（让照片排序处理）
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  /**
   * 照片拖拽排序处理
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setUploadedFiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        // 更新 onFilesUploaded 回调，通知父组件顺序变化
        onFilesUploaded(newItems);
        return newItems;
      });
    }
  };

  /**
   * 照片标注处理
   */
  const MAX_ANNOTATION_LENGTH = 50;

  const handleAnnotationEdit = (fileId: string) => {
    const file = uploadedFiles.find((f) => f.id === fileId);
    setEditingAnnotation({
      fileId,
      annotation: file?.metadata?.annotation || '',
    });
  };

  const handleAnnotationSave = (fileId: string, annotation: string) => {
    // 验证字符限制
    if (annotation.length > MAX_ANNOTATION_LENGTH) {
      toast.error(`标注不能超过 ${MAX_ANNOTATION_LENGTH} 个字符`);
      return;
    }

    setUploadedFiles((prev) => {
      const newFiles = prev.map((file) => {
        if (file.id === fileId) {
          return {
            ...file,
            metadata: {
              ...(file.metadata || {}),
              annotation: annotation.trim() || undefined,
            },
          };
        }
        return file;
      });
      onFilesUploaded(newFiles);
      return newFiles;
    });
    setEditingAnnotation(null);
  };

  const handleAnnotationDelete = (fileId: string) => {
    setUploadedFiles((prev) => {
      const newFiles = prev.map((file) => {
        if (file.id === fileId) {
          const metadata = { ...(file.metadata || {}) };
          delete (metadata as any).annotation;
          return {
            ...file,
            metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
          };
        }
        return file;
      });
      onFilesUploaded(newFiles);
      return newFiles;
    });
  };

  // 计算总体进度
  // 总文件数 = 已上传的文件数 + 队列中剩余的文件数
  const totalFiles = uploadedFiles.length + uploadQueueRef.current.length;
  const completedFiles = uploadedFiles.length;
  const progressPercentage = totalFiles > 0
    ? ((completedFiles / totalFiles) * 100)
    : 0;

  return (
    <div className="space-y-monday-4">
      {/* File Input with Drag and Drop */}
      <div
        ref={uploadAreaRef}
        onDragEnter={supportsDragDrop ? handleDragEnter : undefined}
        onDragLeave={supportsDragDrop ? handleDragLeave : undefined}
        onDragOver={supportsDragDrop ? handleDragOver : undefined}
        onDrop={supportsDragDrop ? handleDrop : undefined}
        className={isDragging
          ? 'border-2 border-dashed border-primary-blue bg-blue-50 p-4 rounded-monday-md transition-colors'
          : 'border-2 border-dashed border-gray-300 p-4 rounded-monday-md transition-colors'}
      >
        <label className="block text-monday-sm font-semibold text-monday-text mb-monday-2">
          {photoOnly ? '照片上传' : '附件上传'}
        </label>
        
        {/* 移动端：自定义按钮触发文件选择 */}
        {isMobile && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || uploadedFiles.length >= maxFiles}
            className="w-full min-h-[48px] px-4 py-3 bg-primary-blue text-white rounded-monday-md hover:bg-primary-blue-dark disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-monday-sm mb-2"
          >
            {photoOnly ? '选择照片' : '选择文件'}
          </button>
        )}

        {/* 文件输入框（移动端隐藏，桌面端显示） */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={photoOnly ? 'image/jpeg,image/png,image/gif' : 'image/*,.pdf,.doc,.docx,.xls,.xlsx'}
          onChange={handleFileSelect}
          disabled={uploading || uploadedFiles.length >= maxFiles}
          className={`block w-full text-monday-sm text-monday-text file:mr-monday-4 file:py-monday-2 file:px-monday-4 file:rounded-monday-md file:border-0 file:text-monday-sm file:font-semibold file:bg-primary-blue file:text-white hover:file:bg-primary-blue-dark disabled:opacity-50 disabled:cursor-not-allowed ${isMobile ? 'hidden' : ''}`}
        />
        
        {/* 网络状态提示 */}
        {networkStatus === 'offline' && (
          <div className="mb-2 p-2 bg-yellow-100 border border-yellow-400 rounded text-monday-xs text-yellow-800">
            网络连接已断开，请检查网络后重试
          </div>
        )}
        {networkStatus === 'checking' && (
          <div className="mb-2 p-2 bg-blue-100 border border-blue-400 rounded text-monday-xs text-blue-800">
            网络连接中，请稍候...
          </div>
        )}
        
        <p className="mt-monday-1 text-monday-xs text-monday-text-secondary">
          {photoOnly
            ? `仅支持图片（JPG, PNG, GIF），单个文件最大 10MB，最多 ${maxFiles} 张照片${supportsDragDrop ? '，支持拖拽上传' : ''}`
            : `支持图片（JPG, PNG, GIF）、文档（PDF, DOC, DOCX, XLS, XLSX），单个文件最大 10MB，最多 ${maxFiles} 个文件${supportsDragDrop ? '，支持拖拽上传' : ''}`}
        </p>
      </div>

      {/* Overall Upload Progress */}
      {totalFiles > 0 && (
        <div className="space-y-monday-2">
          <div className="flex justify-between text-monday-sm text-monday-text-secondary">
            <span>总体进度：{completedFiles} / {totalFiles} 张</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-monday-bg-secondary rounded-full h-2">
            <div
              className="bg-primary-blue h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Individual Upload Progress */}
      {Object.entries(uploadProgress).length > 0 && (
        <div className="space-y-monday-2">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="space-y-monday-1">
              <div className="flex justify-between text-monday-xs text-monday-text-secondary">
                <span>{fileName}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-monday-bg-secondary rounded-full h-2">
                <div
                  className="bg-primary-blue h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-monday-2">
          <p className="text-monday-sm font-semibold text-monday-text">
            {photoOnly ? '已上传照片' : '已上传文件'}
          </p>
          {photoOnly ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={uploadedFiles.map((f) => f.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-monday-2">
                  {uploadedFiles.map((file) => (
                    <SortablePhotoItem
                      key={file.id}
                      file={file}
                      onPreview={() => {
                        const photoIndex = getPhotoIndex(file.id);
                        if (photoIndex !== null) {
                          setSelectedPhotoIndex(photoIndex);
                        }
                      }}
                      onDelete={() => handleDelete(file.id, file.fileName)}
                      onEditAnnotation={() => handleAnnotationEdit(file.id)}
                      onDeleteAnnotation={() => handleAnnotationDelete(file.id)}
                      editingAnnotation={editingAnnotation}
                      onSaveAnnotation={handleAnnotationSave}
                      onCancelAnnotation={() => setEditingAnnotation(null)}
                      onUpdateEditingAnnotation={(annotation: string) => {
                        if (editingAnnotation?.fileId === file.id) {
                          setEditingAnnotation({ ...editingAnnotation, annotation });
                        }
                      }}
                      uploading={uploading}
                      maxAnnotationLength={MAX_ANNOTATION_LENGTH}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="space-y-monday-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-monday-3 bg-monday-bg-secondary rounded-monday-md"
                >
                  {/* List layout for documents or mixed files */}
                  <>
                    <div className="flex items-center space-x-monday-3 flex-1 min-w-0">
                      {/* Preview for images */}
                      {file.fileType === 'photo' && (
                        <img
                          src={file.fileUrl}
                          alt={file.fileName}
                          className="w-12 h-12 object-cover rounded-monday-md flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            const photoIndex = getPhotoIndex(file.id);
                            if (photoIndex !== null) {
                              setSelectedPhotoIndex(photoIndex);
                            }
                          }}
                        />
                      )}
                      {/* Icon for documents */}
                      {file.fileType !== 'photo' && (
                        <div className="w-12 h-12 bg-monday-bg-tertiary rounded-monday-md flex items-center justify-center flex-shrink-0">
                          <span className="text-monday-lg">📄</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-monday-sm font-medium text-monday-text truncate">
                          {file.fileName}
                        </p>
                        <p className="text-monday-xs text-monday-text-secondary">
                          {formatFileSize(file.fileSize)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-monday-2 flex-shrink-0">
                      {/* View/Download Link */}
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-blue hover:text-primary-blue-dark text-monday-sm"
                      >
                        查看
                      </a>
                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(file.id, file.fileName)}
                        className="text-red-500 hover:text-red-700 text-monday-sm"
                        disabled={uploading}
                      >
                        删除
                      </button>
                    </div>
                  </>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Errors */}
      {Object.entries(errors).length > 0 && (
        <div className="space-y-monday-1">
          {Object.entries(errors).map(([fileName, error]) => (
            <p key={fileName} className="text-monday-xs text-red-500">
              {fileName}: {error}
            </p>
          ))}
        </div>
      )}

      {/* Photo Preview Modal */}
      {selectedPhotoIndex !== null && (
        <PhotoPreview
          photos={uploadedFiles.filter((f) => f.fileType === 'photo')}
          currentIndex={selectedPhotoIndex}
          onClose={() => setSelectedPhotoIndex(null)}
          onNext={() => {
            const photoFiles = uploadedFiles.filter((f) => f.fileType === 'photo');
            if (selectedPhotoIndex < photoFiles.length - 1) {
              setSelectedPhotoIndex(selectedPhotoIndex + 1);
            }
          }}
          onPrevious={() => {
            if (selectedPhotoIndex > 0) {
              setSelectedPhotoIndex(selectedPhotoIndex - 1);
            }
          }}
        />
      )}
    </div>
  );
};

/**
 * Sortable Photo Item Component
 * 可拖拽排序的照片项组件
 */
interface SortablePhotoItemProps {
  file: Attachment;
  onPreview: () => void;
  onDelete: () => void;
  onEditAnnotation: () => void;
  onDeleteAnnotation: () => void;
  editingAnnotation: { fileId: string; annotation: string } | null;
  onSaveAnnotation: (fileId: string, annotation: string) => void;
  onCancelAnnotation: () => void;
  onUpdateEditingAnnotation: (annotation: string) => void;
  uploading: boolean;
  maxAnnotationLength: number;
}

const SortablePhotoItem: React.FC<SortablePhotoItemProps> = ({
  file,
  onPreview,
  onDelete,
  onEditAnnotation,
  onDeleteAnnotation,
  editingAnnotation,
  onSaveAnnotation,
  onCancelAnnotation,
  onUpdateEditingAnnotation,
  uploading,
  maxAnnotationLength,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditing = editingAnnotation?.fileId === file.id;
  const annotation = file.metadata?.annotation;

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Photo thumbnail */}
      <img
        src={file.fileUrl}
        alt={file.fileName}
        className="w-full h-32 object-cover rounded-monday-md cursor-pointer hover:opacity-80 transition-opacity"
        onClick={onPreview}
        {...attributes}
        {...listeners}
      />
      
      {/* Action buttons (hover 时显示) */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        {/* Edit annotation button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEditAnnotation();
          }}
          className="bg-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-gray-100"
          disabled={uploading}
          aria-label="编辑标注"
          title="编辑标注"
        >
          ✏️
        </button>
        {/* Delete button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
          disabled={uploading}
          aria-label="删除照片"
        >
          ×
        </button>
      </div>

      {/* File name */}
      <div className="mt-monday-1 text-monday-xs text-monday-text-secondary truncate">
        {file.fileName}
      </div>

      {/* Annotation input or display */}
      {isEditing ? (
        <div className="mt-monday-1">
          <input
            type="text"
            value={editingAnnotation.annotation}
            onChange={(e) => {
              if (e.target.value.length <= maxAnnotationLength) {
                onUpdateEditingAnnotation(e.target.value);
              }
            }}
            onBlur={() => {
              if (editingAnnotation) {
                onSaveAnnotation(file.id, editingAnnotation.annotation);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && editingAnnotation) {
                onSaveAnnotation(file.id, editingAnnotation.annotation);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onCancelAnnotation();
              }
            }}
            maxLength={maxAnnotationLength}
            className="w-full text-monday-xs px-monday-1 py-monday-0.5 border border-monday-border rounded"
            autoFocus
          />
          <div className="text-monday-xs text-monday-text-secondary mt-0.5">
            {editingAnnotation.annotation.length} / {maxAnnotationLength}
          </div>
        </div>
      ) : (
        annotation && (
          <div className="mt-monday-1 flex items-center justify-between">
            <div className="text-monday-xs text-monday-text-secondary truncate flex-1">
              {annotation}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteAnnotation();
              }}
              className="text-red-500 hover:text-red-700 text-monday-xs ml-1"
              aria-label="删除标注"
            >
              ×
            </button>
          </div>
        )
      )}
    </div>
  );
};

