/**
 * Product Customer Association Component
 * 
 * Displays a summary card for product-customer associations with a button to open the management modal
 * All custom code is proprietary and not open source.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { isFrontendSpecialist, isBackendSpecialist } from '../../common/constants/roles';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { HomeModuleIcon } from '../../components/icons/HomeModuleIcons';
import { Product, productsService } from '../products.service';
import { ProductAssociationManagementModal } from './ProductAssociationManagementModal';
import { ProductCustomerAssociationResponseDto } from '../types/product-customer-association-response.dto';

interface ProductCustomerAssociationProps {
  productId: string;
  product: Product;
}

// Use the proper DTO type from the service
type CustomerAssociation = ProductCustomerAssociationResponseDto;

/**
 * Main Component
 * 
 * Displays a summary card with statistics and a button to open the management modal
 */
export const ProductCustomerAssociation: React.FC<ProductCustomerAssociationProps> = ({
  productId,
  product,
}) => {
  const { user, token } = useAuth();
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);

  // 根据角色显示标题
  const getTitle = () => {
    if (isFrontendSpecialist(user?.role)) return '关联的采购商';
    if (isBackendSpecialist(user?.role)) return '关联的供应商';
    return '关联的客户';
  };

  // 获取关联统计信息（获取足够多的数据用于准确统计）
  const { data, isLoading, error, refetch } = useQuery<{
    customers: CustomerAssociation[];
    total: number;
  }>({
    queryKey: ['product-associations-summary', productId],
    queryFn: async () => {
      // 获取足够大的 limit (100) 来确保能统计所有客户
      // 如果总数超过 100，buyers 和 suppliers 的统计可能不准确，但这种情况很少见
      return await productsService.getProductAssociations(productId, 1, 100);
    },
    enabled: !!productId && !!token,
    staleTime: 5 * 60 * 1000, // 5 分钟缓存
  });

  // 计算统计信息
  // 注意：如果总数超过 100，buyers 和 suppliers 的统计可能不准确
  // 但大多数情况下，100 个客户已经足够多了
  const stats = {
    total: data?.total || 0,
    buyers: data?.customers?.filter((c) => c.customerType === 'BUYER').length || 0,
    suppliers: data?.customers?.filter((c) => c.customerType === 'SUPPLIER').length || 0,
    withInteractions: data?.customers?.filter((c) => c.interactionCount > 0).length || 0,
  };

  // 根据角色显示统计信息
  const getStatsDisplay = () => {
    if (isFrontendSpecialist(user?.role)) {
      return `共 ${stats.total} 个采购商`;
    }
    if (isBackendSpecialist(user?.role)) {
      return `共 ${stats.total} 个供应商`;
    }
    return `共 ${stats.total} 个客户（采购商: ${stats.buyers}, 供应商: ${stats.suppliers}）`;
  };

  if (isLoading) {
    return (
      <Card variant="outlined" className="p-monday-4">
        <div className="flex items-center justify-center py-monday-4">
          <span className="animate-spin">⏳</span>
          <span className="ml-monday-2 text-monday-sm text-monday-text-secondary">加载中...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" className="p-monday-4">
        <div className="text-center py-monday-4">
          <p className="text-monday-sm text-primary-red mb-monday-2">
            {error instanceof Error ? error.message : '加载失败'}
          </p>
          <Button size="sm" onClick={() => refetch()}>
            重试
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card variant="outlined" className="p-monday-4">
        <div className="flex items-center justify-between mb-monday-3">
          <h4 className="text-monday-base font-semibold text-gray-900">
            {getTitle()}
          </h4>
        </div>

        {/* 统计信息 */}
        <div className="space-y-monday-2 mb-monday-4">
          <p className="text-monday-sm text-gray-900 font-medium">
            {stats.total === 0 ? (
              <span>该产品尚未与任何客户关联</span>
            ) : (
              <span>{getStatsDisplay()}</span>
            )}
          </p>
          {stats.total > 0 && stats.withInteractions > 0 && (
            <p className="text-monday-xs text-monday-text-placeholder">
              {stats.withInteractions} 个客户有互动记录
            </p>
          )}
        </div>

        {/* 显示关联客户按钮（与详情页编辑/删除统一：outline、uipro-cta、图标） */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsManagementModalOpen(true)}
          title={stats.total === 0 ? '添加关联客户' : '显示关联客户'}
          aria-label={stats.total === 0 ? '添加关联客户' : '显示关联客户'}
          leftIcon={<HomeModuleIcon name="users" className="w-4 h-4 flex-shrink-0" />}
          className="w-full text-uipro-cta hover:bg-uipro-cta/10 cursor-pointer transition-colors duration-200"
        >
          {stats.total === 0 ? '添加关联客户' : '显示关联客户'}
        </Button>
      </Card>

      {/* Association Management Modal */}
      <ProductAssociationManagementModal
        productId={productId}
        isOpen={isManagementModalOpen}
        onClose={() => setIsManagementModalOpen(false)}
        onAssociationChange={() => {
          // Refetch associations when modal closes
          refetch();
        }}
      />
    </>
  );
};

