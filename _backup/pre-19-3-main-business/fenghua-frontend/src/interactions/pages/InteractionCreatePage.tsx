/**
 * Interaction Create Page
 * 
 * Page for creating a new interaction record
 * All custom code is proprietary and not open source.
 */

import { useLocation, useSearchParams } from 'react-router-dom';
import { InteractionCreateForm } from '../components/InteractionCreateForm';
import { MainLayout } from '../../components/layout';
import { Card } from '../../components/ui/Card';

export const InteractionCreatePage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // 从 navigation state 或 URL 参数获取 customerId 和 productId
  const customerIdFromState = (location.state as { customerId?: string })?.customerId;
  const customerIdFromQuery = searchParams.get('customerId');
  const productIdFromQuery = searchParams.get('productId'); // NEW: 添加 productId 支持
  const prefillCustomerId = customerIdFromState || customerIdFromQuery || undefined;
  const prefillProductId = productIdFromQuery || undefined; // NEW: 添加 prefillProductId

  return (
    <MainLayout title="创建互动记录">
      <Card variant="default" className="w-full">
        <div className="p-monday-6">
          <h2 className="text-monday-2xl font-semibold text-monday-text mb-monday-6">
            创建互动记录
          </h2>
          <InteractionCreateForm
            prefillCustomerId={prefillCustomerId}
            prefillProductId={prefillProductId}
          />
        </div>
      </Card>
    </MainLayout>
  );
};

