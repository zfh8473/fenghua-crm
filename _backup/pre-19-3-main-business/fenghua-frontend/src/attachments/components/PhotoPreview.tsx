/**
 * Photo Preview Component
 * 
 * Modal component for previewing photos in full screen
 * All custom code is proprietary and not open source.
 */

import { useEffect, useState, useRef } from 'react';
import { Attachment, formatFileSize } from '../services/attachments.service';

interface PhotoPreviewProps {
  photos: Attachment[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

/**
 * Photo Preview Component
 * Displays a full-screen modal for previewing photos with keyboard navigation
 */
export const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  photos,
  currentIndex,
  onClose,
  onNext,
  onPrevious,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  // Use refs to store latest callbacks to avoid re-creating event listeners
  const onCloseRef = useRef(onClose);
  const onNextRef = useRef(onNext);
  const onPreviousRef = useRef(onPrevious);

  // Update refs when callbacks change
  useEffect(() => {
    onCloseRef.current = onClose;
    onNextRef.current = onNext;
    onPreviousRef.current = onPrevious;
  }, [onClose, onNext, onPrevious]);

  // Boundary check for currentIndex
  const validIndex = currentIndex >= 0 && currentIndex < photos.length ? currentIndex : null;
  const currentPhoto = validIndex !== null ? photos[validIndex] : null;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      } else if (e.key === 'ArrowLeft' && validIndex !== null && validIndex > 0) {
        onPreviousRef.current();
      } else if (e.key === 'ArrowRight' && validIndex !== null && validIndex < photos.length - 1) {
        onNextRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [validIndex, photos.length]);

  // Reset image state when switching photos
  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
  }, [validIndex]);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  if (!currentPhoto) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-full p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>加载中...</p>
            </div>
          </div>
        )}
        {imageError ? (
          <div className="bg-gray-800 p-8 rounded text-white text-center min-w-[300px]">
            <p className="text-lg mb-2">图片加载失败</p>
            <p className="text-sm text-gray-400 mb-4">{currentPhoto.fileName}</p>
            <a
              href={currentPhoto.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 inline-block underline"
            >
              在新窗口打开
            </a>
          </div>
        ) : (
          <img
            src={currentPhoto.fileUrl}
            alt={currentPhoto.fileName}
            className="max-w-full max-h-screen object-contain"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: imageLoading ? 'none' : 'block' }}
          />
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
          aria-label="关闭预览"
        >
          ×
        </button>

        {/* Previous button */}
        {validIndex !== null && validIndex > 0 && (
          <button
            onClick={onPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
            aria-label="上一张"
          >
            ‹
          </button>
        )}

        {/* Next button */}
        {validIndex !== null && validIndex < photos.length - 1 && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
            aria-label="下一张"
          >
            ›
          </button>
        )}

        {/* Photo info */}
        {validIndex !== null && currentPhoto && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 rounded px-4 py-2 text-white text-center">
            <div className="text-sm">
              {validIndex + 1} / {photos.length}
            </div>
            <div className="text-xs text-gray-300 mt-1">
              {currentPhoto.fileName} ({formatFileSize(currentPhoto.fileSize)})
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

