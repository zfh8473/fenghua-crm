/**
 * Customer Association Management Modal Component
 * 
 * Modal for managing customer-product associations
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { customersService } from '../customers.service';
import { CustomerProductAssociationResponseDto } from '../types/customer-product-association-response.dto';
import { AssociationType } from '../../products/types/association-types';
import type { Product } from '../../products/products.service';
import { ProductMultiSelect } from '../../products/components/ProductMultiSelect';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from 'react-toastify';
import {
  ASSOCIATION_CREATE_SUCCESS,
  ASSOCIATION_DELETE_SUCCESS,
  ASSOCIATION_CREATE_FAILED,
  ASSOCIATION_DELETE_FAILED,
  ASSOCIATION_ALREADY_EXISTS,
  ASSOCIATION_DELETE_CONFIRM,
  ASSOCIATION_DELETE_CONFIRM_MESSAGE,
  ASSOCIATION_NO_PERMISSION_CREATE,
  ASSOCIATION_NO_PERMISSION_DELETE,
  ASSOCIATION_PRODUCT_NOT_FOUND,
} from '../../common/constants/error-messages';

interface CustomerAssociationManagementModalProps {
  customerId: string;
  customerType: 'SUPPLIER' | 'BUYER';
  isOpen: boolean;
  onClose: () => void;
  onAssociationChange?: () => void;
}

/**
 * Product Association Card Component
 * 
 * Displays a single product association with interaction status and delete button
 * 
 * @param product - Product association data
 * @param customerId - Customer ID (for navigation links)
 * @param currentUserId - Current user ID (for permission check)
 * @param onDelete - Callback function when delete button is clicked
 * @param isDeleting - Whether the association is currently being deleted
 */
const ProductAssociationCard: React.FC<{
  product: CustomerProductAssociationResponseDto;
  customerId: string;
  currentUserId?: string;
  onDelete: (productId: string) => void;
  isDeleting: boolean;
}> = ({ product, customerId, currentUserId, onDelete, isDeleting }) => {
  // 只有当前用户创建的关联才能删除（权限控制）
  // 所有关联都是手动创建的，不存在"仅通过互动记录关联"的情况
  const canDelete = product.createdBy === currentUserId;

  return (
    <Card variant="outlined" className="p-monday-3 hover:shadow-monday-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <Link
            to={`/products?productId=${product.id}`}
            className="text-monday-base font-semibold text-monday-text hover:text-primary-blue transition-colors truncate block"
          >
            {product.name}
          </Link>
          <div className="flex items-center gap-monday-2 mt-monday-1">
            <span className="text-monday-xs text-monday-text-secondary font-mono">
              HS: {product.hsCode}
            </span>
            {product.interactionCount > 0 ? (
              <span className="px-monday-2 py-monday-0.5 rounded-full text-monday-xs font-semibold bg-primary-green/10 text-primary-green">
                有互动记录 ({product.interactionCount})
              </span>
            ) : (
              <span className="px-monday-2 py-monday-0.5 rounded-full text-monday-xs font-semibold bg-gray-100 text-monday-text-secondary">
                待互动
              </span>
            )}
          </div>
        </div>
        {canDelete && (
          <div className="ml-monday-4 flex items-center gap-monday-2">
            {isDeleting && (
              <span className="text-monday-xs text-monday-text-secondary animate-spin">⏳</span>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onDelete(product.id)}
              disabled={isDeleting}
              className="text-primary-red hover:text-primary-red hover:bg-primary-red/10 border border-transparent hover:border-primary-red/20"
              aria-label={`删除 ${product.name} 的关联`}
            >
              {isDeleting ? '删除中...' : '删除'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

/**
 * Customer Association Management Modal Component
 * 
 * Modal for managing customer-product associations. Allows users to:
 * - View all associations (explicit and from interactions)
 * - Search and filter associations
 * - Add new associations
 * - Delete explicit associations (only if created by current user)
 * 
 * @param customerId - UUID of the customer to manage associations for
 * @param customerType - Customer type (SUPPLIER or BUYER) for auto-setting association type
 * @param isOpen - Whether the modal is open
 * @param onClose - Callback function when modal is closed
 * @param onAssociationChange - Optional callback function when associations change
 */
export const CustomerAssociationManagementModal: React.FC<CustomerAssociationManagementModalProps> = ({
  customerId,
  customerType,
  isOpen,
  onClose,
  onAssociationChange,
}) => {
  // Validate customerId format (UUID)
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId);
  
  if (!isValidUUID) {
    return null; // Don't render modal if customerId is invalid
  }

  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with-interactions' | 'pending'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);

  // Store trigger button reference when modal opens
  useEffect(() => {
    if (isOpen) {
      triggerButtonRef.current = document.activeElement as HTMLButtonElement;
      // Reset search and filter when modal opens
      setSearchQuery('');
      setFilterType('all');
      setPage(1);
    }
  }, [isOpen]);

  // Reset page when search or filter changes
  useEffect(() => {
    if (isOpen) {
      setPage(1);
    }
  }, [searchQuery, filterType, isOpen]);

  // Handle ESC key and focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap: prevent tabbing outside modal
      if (event.key === 'Tab') {
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

    document.addEventListener('keydown', handleKeyDown);
    // Focus on close button when modal opens
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Return focus to trigger button when modal closes
  useEffect(() => {
    if (!isOpen && triggerButtonRef.current) {
      triggerButtonRef.current.focus();
      triggerButtonRef.current = null;
    }
  }, [isOpen]);

  // Fetch associations
  const {
    data: associationsData,
    isLoading: associationsLoading,
    error: associationsError,
    refetch: refetchAssociations,
  } = useQuery<{ products: CustomerProductAssociationResponseDto[]; total: number }>({
    queryKey: ['customer-associations', customerId, page, limit],
    queryFn: async () => {
      return await customersService.getCustomerAssociations(customerId, page, limit);
    },
    enabled: isOpen && !!customerId && !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Filtered and searched associations
  const filteredAssociations = useMemo(() => {
    if (!associationsData?.products) return [];

    let filtered = associationsData.products;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.hsCode.toLowerCase().includes(query) ||
          product.id.toLowerCase().includes(query)
      );
      // Note: Category search is handled by ProductMultiSelect component via backend API
      // Frontend filtering only applies to already loaded associations
    }

    // Apply interaction filter
    if (filterType === 'with-interactions') {
      filtered = filtered.filter((product) => product.interactionCount > 0);
    } else if (filterType === 'pending') {
      filtered = filtered.filter((product) => product.interactionCount === 0);
    }

    return filtered;
  }, [associationsData?.products, searchQuery, filterType]);

  // Statistics
  const stats = useMemo(() => {
    if (!associationsData) return { total: 0, withInteractions: 0, currentPageCount: 0 };
    const withInteractions = filteredAssociations.filter((p) => p.interactionCount > 0).length;
    return {
      total: associationsData.total,
      withInteractions,
      currentPageCount: filteredAssociations.length,
    };
  }, [associationsData, filteredAssociations]);

  // Get associated product IDs for exclusion
  const associatedProductIds = useMemo(() => {
    return associationsData?.products.map((p) => p.id) || [];
  }, [associationsData?.products]);

  // Create association mutation
  const createAssociationMutation = useMutation({
    mutationFn: async ({ productId, associationType }: { productId: string; associationType: AssociationType }) => {
      await customersService.createCustomerProductAssociation(customerId, productId, associationType);
    },
    onSuccess: () => {
      toast.success(ASSOCIATION_CREATE_SUCCESS);
      queryClient.invalidateQueries({ queryKey: ['customer-associations', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customer-products', customerId] });
      setSelectedProduct(null);
      if (onAssociationChange) {
        onAssociationChange();
      }
    },
    onError: (error: Error) => {
      const errorMessage = error.message || '未知错误';
      console.error('Failed to create association:', error);
      
      // Check for specific error patterns
      if (
        errorMessage.includes('已存在') ||
        errorMessage.includes('already exists') ||
        errorMessage.includes('duplicate') ||
        errorMessage.includes('重复')
      ) {
        toast.error(ASSOCIATION_ALREADY_EXISTS);
      } else if (errorMessage.includes('权限') || errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        toast.error(ASSOCIATION_NO_PERMISSION_CREATE);
      } else if (errorMessage.includes('不存在') || errorMessage.includes('not found')) {
        toast.error(ASSOCIATION_PRODUCT_NOT_FOUND);
      } else {
        toast.error(ASSOCIATION_CREATE_FAILED(errorMessage));
      }
    },
  });

  // Delete association mutation
  const deleteAssociationMutation = useMutation({
    mutationFn: async (productId: string) => {
      await customersService.deleteCustomerProductAssociation(customerId, productId);
    },
    onSuccess: () => {
      toast.success(ASSOCIATION_DELETE_SUCCESS);
      queryClient.invalidateQueries({ queryKey: ['customer-associations', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customer-products', customerId] });
      setIsDeleting(null);
      if (onAssociationChange) {
        onAssociationChange();
      }
    },
    onError: (error: Error) => {
      const errorMessage = error.message || '未知错误';
      console.error('Failed to delete association:', error);
      
      // Check for specific error patterns
      if (errorMessage.includes('权限') || errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        toast.error(ASSOCIATION_NO_PERMISSION_DELETE);
      } else if (errorMessage.includes('不存在') || errorMessage.includes('not found')) {
        toast.error('关联关系不存在或已被删除');
      } else {
        toast.error(ASSOCIATION_DELETE_FAILED(errorMessage));
      }
      setIsDeleting(null);
    },
  });

  /**
   * Handle delete association
   * 
   * Shows confirmation dialog and deletes the association if confirmed
   * 
   * @param productId - ID of the product association to delete
   */
  const handleDelete = (productId: string) => {
    const confirmed = window.confirm(
      `${ASSOCIATION_DELETE_CONFIRM}\n${ASSOCIATION_DELETE_CONFIRM_MESSAGE}`
    );
    if (confirmed) {
      setIsDeleting(productId);
      deleteAssociationMutation.mutate(productId);
    }
  };

  /**
   * Handle add association
   * 
   * Creates a new association between the customer and selected product
   * Association type is automatically determined based on customer type
   */
  const handleAddAssociation = () => {
    if (!selectedProduct) return;

    // Determine association type based on customer type
    const associationType: AssociationType =
      customerType === 'BUYER' ? 'POTENTIAL_BUYER' : 'POTENTIAL_SUPPLIER';

    createAssociationMutation.mutate({
      productId: selectedProduct.id,
      associationType,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-monday-4"
      role="presentation"
    >
      {/* Clickable overlay to close modal */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 w-full h-full cursor-default"
        aria-label="关闭"
        tabIndex={-1}
      />
      <div
        ref={modalRef}
        className="relative max-w-6xl max-h-[90vh] w-full bg-monday-surface rounded-monday-lg shadow-monday-lg overflow-hidden z-10 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="管理客户关联产品"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-monday-4 border-b border-gray-200">
          <h2 className="text-monday-xl font-semibold text-monday-text">管理客户关联产品</h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-monday-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="关闭"
            tabIndex={0}
          >
            <span className="text-monday-xl">✕</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left: Associations List */}
          <div className="flex-1 overflow-y-auto p-monday-4 border-r border-gray-200">
            {/* Search and Filter */}
            <div className="mb-monday-4 space-y-monday-2">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索产品名称、HS编码或类别..."
                className="w-full"
              />
              <div className="flex gap-monday-2">
                <Button
                  type="button"
                  size="sm"
                  variant={filterType === 'all' ? 'primary' : 'outline'}
                  onClick={() => setFilterType('all')}
                >
                  全部
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={filterType === 'with-interactions' ? 'primary' : 'outline'}
                  onClick={() => setFilterType('with-interactions')}
                >
                  有互动
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={filterType === 'pending' ? 'primary' : 'outline'}
                  onClick={() => setFilterType('pending')}
                >
                  待互动
                </Button>
              </div>
            </div>

            {/* Statistics */}
            {associationsData && (
              <div className="mb-monday-4">
                <div className="text-monday-sm text-monday-text-secondary">
                  {searchQuery.trim() || filterType !== 'all' ? (
                    <>
                      共 {stats.total} 个关联，当前筛选结果 {stats.currentPageCount} 个，其中 {stats.withInteractions} 个有互动记录
                    </>
                  ) : (
                    <>
                      共 {stats.total} 个关联，当前页 {stats.currentPageCount} 个，其中 {stats.withInteractions} 个有互动记录
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Loading State */}
            {associationsLoading && (
              <div className="flex items-center justify-center py-monday-8">
                <span className="animate-spin">⏳</span>
                <span className="ml-monday-2 text-monday-sm text-monday-text-secondary">加载中...</span>
              </div>
            )}

            {/* Error State */}
            {associationsError && (
              <div className="text-center py-monday-8">
                <p className="text-monday-sm text-primary-red mb-monday-2">
                  {associationsError instanceof Error ? associationsError.message : '加载失败'}
                </p>
                <Button size="sm" onClick={() => refetchAssociations()}>
                  重试
                </Button>
              </div>
            )}

            {/* Associations List */}
            {!associationsLoading && !associationsError && (
              <>
                {filteredAssociations.length === 0 ? (
                  <div className="text-center py-monday-8">
                    {searchQuery.trim() || filterType !== 'all' ? (
                      <p className="text-monday-sm text-monday-text-secondary">
                        未找到匹配的关联
                      </p>
                    ) : (
                      <>
                        <div className="text-monday-4xl mb-monday-4 opacity-50">📦</div>
                        <p className="text-monday-base text-monday-text-secondary mb-monday-2">
                          该客户尚未与任何产品关联
                        </p>
                        <p className="text-monday-sm text-monday-text-secondary">
                          记录互动时关联产品，即可建立关联关系
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-monday-2">
                    {filteredAssociations.map((product) => (
                      <ProductAssociationCard
                        key={product.id}
                        product={product}
                        customerId={customerId}
                        currentUserId={user?.id}
                        onDelete={handleDelete}
                        isDeleting={isDeleting === product.id}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {associationsData && associationsData.total > limit && (
                  <div className="flex items-center justify-between mt-monday-4 pt-monday-4 border-t border-gray-200">
                    <span className="text-monday-sm text-monday-text-secondary">
                      共 {associationsData.total} 个关联
                    </span>
                    <div className="flex gap-monday-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        上一页
                      </Button>
                      <span className="text-monday-sm text-monday-text-secondary flex items-center">
                        第 {page} 页，共 {Math.ceil(associationsData.total / limit)} 页
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= Math.ceil(associationsData.total / limit)}
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: Add Association */}
          <div className="w-full md:w-80 p-monday-4 border-t md:border-t-0 md:border-l border-gray-200 overflow-y-auto">
            <h3 className="text-monday-base font-semibold text-monday-text mb-monday-3">添加关联</h3>
            <div className="space-y-monday-4">
              <div className="relative">
                {createAssociationMutation.isPending && (
                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-monday-md">
                    <span className="text-monday-sm text-monday-text-secondary flex items-center gap-monday-2">
                      <span className="animate-spin">⏳</span>
                      <span>添加中...</span>
                    </span>
                  </div>
                )}
                <ProductMultiSelect
                  selectedProducts={selectedProduct ? [selectedProduct] : []}
                  onChange={(products) => setSelectedProduct(products[0] || null)}
                  placeholder="搜索产品名称、HS编码或类别..."
                  disabled={createAssociationMutation.isPending}
                  excludeIds={associatedProductIds}
                />
              </div>
              <Button
                type="button"
                onClick={handleAddAssociation}
                disabled={!selectedProduct || createAssociationMutation.isPending}
                className="w-full"
              >
                {createAssociationMutation.isPending ? (
                  <span className="flex items-center gap-monday-2">
                    <span className="animate-spin">⏳</span>
                    <span>添加中...</span>
                  </span>
                ) : (
                  '添加关联'
                )}
              </Button>
              <p className="text-monday-xs text-monday-text-placeholder">
                选择产品后，系统将根据客户类型自动设置关联类型
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

