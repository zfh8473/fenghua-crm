/**
 * Product Detail Panel Component
 * 
 * Displays detailed product information in a side panel
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useRef } from 'react';
import { Product } from '../products.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../auth/AuthContext';
import { isAdmin } from '../../common/constants/roles';
import { ProductStatus } from './ProductStatusSelector';
import { ProductCustomerAssociation } from './ProductCustomerAssociation';

interface ProductDetailPanelProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export const ProductDetailPanel: React.FC<ProductDetailPanelProps> = ({
  product,
  onEdit,
  onDelete,
}) => {
  const { user: currentUser } = useAuth();
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Reset image error when imageUrl changes (M2 Fix)
  useEffect(() => {
    setImageError(false);
  }, [product.imageUrl]);

  // Handle ESC key to close modal and focus trap
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showImageModal) {
        setShowImageModal(false);
        return;
      }

      // Focus trap: prevent tabbing outside modal
      if (showImageModal && event.key === 'Tab') {
        const modal = modalRef.current;
        if (!modal) return;

        const focusableElements = modal.querySelectorAll<HTMLElement>(
          'button:not([tabindex="-1"]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement || document.activeElement === modal) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    if (showImageModal) {
      // Store previous focus element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      document.addEventListener('keydown', handleKeyDown);
      // Focus on close button when modal opens
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 0);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showImageModal]);

  // Return focus to trigger button when modal closes (H1 Fix)
  useEffect(() => {
    if (!showImageModal && previousFocusRef.current) {
      // Return focus to the button that triggered the modal
      imageButtonRef.current?.focus();
      previousFocusRef.current = null;
    }
  }, [showImageModal]);

  const getStatusLabel = (status: ProductStatus | string): string => {
    const statusMap: Record<ProductStatus, string> = {
      active: '活跃',
      inactive: '已停用',
      archived: '已归档',
    };
    return statusMap[status as ProductStatus] || status;
  };

  const getStatusColor = (status: ProductStatus | string): string => {
    const colorMap: Record<ProductStatus, string> = {
      active: 'bg-primary-green text-white',
      inactive: 'bg-primary-red text-white',
      archived: 'bg-gray-100 text-monday-text-secondary',
    };
    return colorMap[status as ProductStatus] || 'bg-gray-100 text-monday-text-secondary';
  };

  const handleImageClick = () => {
    if (product.imageUrl && !imageError) {
      setShowImageModal(true);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleCloseModal = () => {
    setShowImageModal(false);
  };

  const userIsAdmin = isAdmin(currentUser?.role);

  return (
    <>
      <div className="space-y-monday-4">
        {/* Product Header */}
        <div>
          <h3 className="text-monday-xl font-bold text-monday-text mb-monday-2">{product.name}</h3>
          <div className="flex items-center gap-monday-2">
            <span className={`px-monday-3 py-monday-1 rounded-full text-monday-xs font-semibold ${getStatusColor(product.status)}`}>
              {getStatusLabel(product.status)}
            </span>
          </div>
        </div>

        {/* Basic Information */}
        <Card variant="outlined" className="p-monday-4">
          <h4 className="text-monday-base font-semibold text-monday-text mb-monday-3">基本信息</h4>
          <div className="space-y-monday-3">
            <div>
              <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">HS编码</div>
              <p className="text-monday-base text-monday-text font-mono mt-monday-1">{product.hsCode}</p>
            </div>
            <div>
              <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">产品类别</div>
              <p className="text-monday-base text-monday-text mt-monday-1">{product.category || '-'}</p>
            </div>
            {product.description ? (
              <div>
                <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">产品描述</div>
                <p className="text-monday-base text-monday-text mt-monday-1 whitespace-pre-wrap">{product.description}</p>
              </div>
            ) : null}
          </div>
        </Card>

        {/* Specifications */}
        {product.specifications && Object.keys(product.specifications).length > 0 ? (
          <Card variant="outlined" className="p-monday-4">
            <h4 className="text-monday-base font-semibold text-monday-text mb-monday-3">产品规格</h4>
            <div className="space-y-monday-2">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between items-start py-monday-2 border-b border-gray-100 last:border-0">
                  <span className="text-monday-sm font-medium text-monday-text-secondary flex-shrink-0 w-24">
                    {key}:
                  </span>
                  <span className="text-monday-sm text-monday-text flex-1 text-right break-words">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {/* Additional Information */}
        <Card variant="outlined" className="p-monday-4">
          <h4 className="text-monday-base font-semibold text-monday-text mb-monday-3">其他信息</h4>
          <div className="space-y-monday-3">
            {product.imageUrl ? (
              <div>
                <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">产品图片</div>
                <div className="mt-monday-2">
                  {!imageError ? (
                    <button
                      ref={imageButtonRef}
                      type="button"
                      onClick={handleImageClick}
                      className="w-full focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2 rounded-monday-md"
                      aria-label={`查看 ${product.name} 的产品图片`}
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-auto rounded-monday-md border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                        onError={handleImageError}
                      />
                    </button>
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-monday-md border border-gray-200 flex items-center justify-center">
                      <span className="text-monday-sm text-monday-text-secondary">图片加载失败</span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
            <div>
              <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">创建时间</div>
              <p className="text-monday-sm text-monday-text mt-monday-1">
                {product.createdAt ? new Date(product.createdAt).toLocaleString('zh-CN') : '-'}
              </p>
            </div>
            {product.updatedAt ? (
              <div>
                <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">更新时间</div>
                <p className="text-monday-sm text-monday-text mt-monday-1">
                  {new Date(product.updatedAt).toLocaleString('zh-CN')}
                </p>
              </div>
            ) : null}
          </div>
        </Card>

        {/* 关联的客户 */}
        <ProductCustomerAssociation productId={product.id} product={product} />

        {/* Edit/Delete Buttons (Admin Only) */}
        {userIsAdmin && onEdit && onDelete ? (
          <div className="flex gap-monday-2 mt-monday-4">
            <Button
              onClick={() => onEdit(product)}
              variant="secondary"
              size="sm"
              aria-label="编辑产品"
              className="bg-primary-blue/10 border-primary-blue/30 text-primary-blue hover:bg-primary-blue/20 hover:border-primary-blue/50"
              leftIcon={<span>✏️</span>}
            >
              编辑
            </Button>
            <Button
              onClick={() => onDelete(product)}
              variant="ghost"
              size="sm"
              aria-label="删除产品"
              className="text-primary-red hover:text-primary-red hover:bg-primary-red/10 border border-transparent hover:border-primary-red/20"
              leftIcon={<span>🗑️</span>}
            >
              删除
            </Button>
          </div>
        ) : null}
      </div>

      {/* Image Modal */}
      {showImageModal && product.imageUrl && !imageError ? (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-monday-4"
          role="presentation"
        >
          {/* Clickable overlay to close modal */}
          <button
            type="button"
            onClick={handleCloseModal}
            className="absolute inset-0 w-full h-full cursor-default"
            aria-label="关闭图片"
            tabIndex={-1}
          />
          <div
            ref={modalRef}
            className="relative max-w-4xl max-h-[90vh] w-full bg-monday-surface rounded-monday-lg shadow-monday-lg overflow-hidden z-10"
            role="dialog"
            aria-modal="true"
            aria-label="产品图片"
          >
            {/* Close Button */}
            <button
              ref={closeButtonRef}
              onClick={handleCloseModal}
              className="absolute top-monday-4 right-monday-4 z-10 p-monday-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              aria-label="关闭图片"
              tabIndex={0}
            >
              <span className="text-monday-xl">✕</span>
            </button>

            {/* Image Container */}
            <div className="relative w-full h-full flex items-center justify-center p-monday-4">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="max-w-full max-h-[85vh] object-contain rounded-monday-md"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
