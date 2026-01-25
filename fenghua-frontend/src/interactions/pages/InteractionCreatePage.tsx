/**
 * Interaction Create Page
 * 
 * Page for creating a new interaction record
 * All custom code is proprietary and not open source.
 */

import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { InteractionCreateForm } from '../components/InteractionCreateForm';
import { MainLayout } from '../../components/layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const InteractionCreatePage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // 从 navigation state 或 URL 参数获取 customerId 和 productId
  const customerIdFromState = (location.state as { customerId?: string })?.customerId;
  const customerIdFromQuery = searchParams.get('customerId');
  const productIdFromQuery = searchParams.get('productId'); // NEW: 添加 productId 支持
  const initialCustomerId = customerIdFromState || customerIdFromQuery || undefined;
  const initialProductId = productIdFromQuery || undefined; // NEW: 添加 initialProductId

  return (
    <MainLayout title="创建互动记录">
      <div className="space-y-monday-6">
        {/* 19.7 AC1：从列表进入的表单页，在标题区提供返回列表入口 */}
        <Link to="/interactions">
          <Button variant="outline" size="sm" className="cursor-pointer transition-colors duration-200">
            ← 返回互动记录列表
          </Button>
        </Link>
      <Card variant="default" className="w-full">
        <div className="p-monday-6">
          <h2 className="text-monday-2xl font-semibold text-monday-text mb-monday-6">
            创建互动记录
          </h2>
          <InteractionCreateForm
            initialCustomerId={initialCustomerId}
            initialProductId={initialProductId}
          />
        </div>
      </Card>
      </div>
    </MainLayout>
  );
};

