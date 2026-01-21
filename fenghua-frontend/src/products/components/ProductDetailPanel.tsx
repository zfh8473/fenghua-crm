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
import { HomeModuleIcon } from '../../components/icons/HomeModuleIcons';

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

  /** 19.3 main-business：状态徽章 uipro-* / semantic-* */
  const getStatusColor = (status: ProductStatus | string): string => {
    const colorMap: Record<ProductStatus, string> = {
      active: 'bg-semantic-success/15 text-semantic-success',
      inactive: 'bg-semantic-error/15 text-semantic-error',
      archived: 'bg-uipro-secondary/15 text-uipro-secondary',
    };
    return colorMap[status as ProductStatus] || 'bg-uipro-secondary/15 text-uipro-secondary';
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
        {/* Product Header（19.3 main-business） */}
        <div>
          <h3 className="text-monday-xl font-bold text-gray-900 mb-monday-2 font-uipro-heading">{product.name}</h3>
          <div className="flex items-center gap-monday-2">
            <span className={`px-monday-3 py-monday-1 rounded-full text-monday-xs font-semibold transition-colors duration-200 ${getStatusColor(product.status)}`}>
              {getStatusLabel(product.status)}
            </span>
          </div>
        </div>

        {/* Basic Information */}
        <Card variant="outlined" className="p-monday-4 transition-colors duration-200">
          <h4 className="text-monday-base font-semibold text-gray-900 mb-monday-3 font-uipro-heading">基本信息</h4>
          <div className="space-y-monday-3">
            <div>
              <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">HS编码</div>
              <p className="text-monday-base text-gray-900 font-medium font-mono mt-monday-1">{product.hsCode}</p>
            </div>
            <div>
              <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">产品类别</div>
              <p className="text-monday-base text-gray-900 font-medium mt-monday-1">{product.category || '-'}</p>
            </div>
            {product.description ? (
              <div>
                <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">产品描述</div>
                <p className="text-monday-base text-gray-900 font-medium mt-monday-1 whitespace-pre-wrap">{product.description}</p>
              </div>
            ) : null}
          </div>
        </Card>

        {/* Specifications */}
        {product.specifications && Object.keys(product.specifications).length > 0 ? (
          <Card variant="outlined" className="p-monday-4 transition-colors duration-200">
            <h4 className="text-monday-base font-semibold text-gray-900 mb-monday-3 font-uipro-heading">产品规格</h4>
            <div className="space-y-monday-2">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between items-start py-monday-2 border-b border-gray-100 last:border-0">
                  <span className="text-monday-sm font-medium text-monday-text-secondary flex-shrink-0 w-24">
                    {key}:
                  </span>
                  <span className="text-monday-sm text-gray-900 font-medium flex-1 text-right break-words">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {/* Additional Information */}
        <Card variant="outlined" className="p-monday-4 transition-colors duration-200">
          <h4 className="text-monday-base font-semibold text-gray-900 mb-monday-3 font-uipro-heading">其他信息</h4>
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
                      className="w-full focus:outline-none focus:ring-2 focus:ring-uipro-cta/50 focus:ring-offset-2 rounded-monday-md cursor-pointer transition-colors duration-200"
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
              <p className="text-monday-sm text-gray-900 font-medium mt-monday-1">
                {product.createdAt ? new Date(product.createdAt).toLocaleString('zh-CN') : '-'}
              </p>
            </div>
            {product.updatedAt ? (
              <div>
                <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">更新时间</div>
                <p className="text-monday-sm text-gray-900 font-medium mt-monday-1">
                  {new Date(product.updatedAt).toLocaleString('zh-CN')}
                </p>
              </div>
            ) : null}
          </div>
        </Card>

        {/* 关联的客户 */}
        <ProductCustomerAssociation productId={product.id} product={product} />

        {/* Edit/Delete Buttons（与 ProductList 统一：outline、uipro-cta/semantic-error、pencilSquare/trash 图标、居中） */}
        {userIsAdmin && onEdit && onDelete ? (
          <div className="flex justify-center gap-monday-2 mt-monday-4">
            <Button
              onClick={() => onEdit(product)}
              variant="outline"
              size="sm"
              title="编辑"
              leftIcon={<HomeModuleIcon name="pencilSquare" className="w-4 h-4 flex-shrink-0" />}
              aria-label="编辑产品"
              className="text-uipro-cta hover:bg-uipro-cta/10 cursor-pointer transition-colors duration-200"
            >
              编辑
            </Button>
            <Button
              onClick={() => onDelete(product)}
              variant="outline"
              size="sm"
              title="删除"
              leftIcon={<HomeModuleIcon name="trash" className="w-4 h-4 flex-shrink-0" />}
              aria-label="删除产品"
              className="text-semantic-error hover:bg-semantic-error/10 cursor-pointer transition-colors duration-200"
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
