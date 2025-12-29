/**
 * Product Business Process Component
 * 
 * Displays product-customer business process timeline view
 * All custom code is proprietary and not open source.
 */

import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface ProductBusinessProcessProps {
  productId: string;
  customerId: string;
}

interface BusinessProcessStage {
  stageName: string;
  stageKey: string;
  status: 'completed' | 'in-progress' | 'not-started';
  completedAt?: string;
  interactionIds: string[];
  interactionCount: number;
}

interface BusinessProcessData {
  customerType: 'BUYER' | 'SUPPLIER';
  processType: 'buyer' | 'supplier';
  stages: BusinessProcessStage[];
  totalInteractions: number;
}

/**
 * Get stage status color classes
 */
const getStageStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-500 text-white';
    case 'in-progress':
      return 'bg-yellow-500 text-white';
    case 'not-started':
      return 'bg-gray-200 text-gray-600';
    default:
      return 'bg-gray-200 text-gray-600';
  }
};

/**
 * Get stage status icon
 */
const getStageStatusIcon = (status: string): string => {
  switch (status) {
    case 'completed':
      return '✓';
    case 'in-progress':
      return '⟳';
    case 'not-started':
      return '○';
    default:
      return '○';
  }
};

/**
 * Stage Card Component
 */
const StageCard: React.FC<{
  stage: BusinessProcessStage;
  productId: string;
  customerId: string;
  isLast: boolean;
}> = ({ stage, productId, customerId, isLast }) => {
  const navigate = useNavigate();

  const handleStageClick = () => {
    if (stage.interactionCount > 0) {
      // 跳转到互动历史页面，URL参数包含阶段过滤
      navigate(
        `/products/${productId}/interactions?customerId=${customerId}&stage=${stage.stageKey}`,
      );
    }
  };

  return (
    <div className="flex items-start gap-monday-4">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div
          className={`w-monday-10 h-monday-10 rounded-full flex items-center justify-center text-monday-sm font-semibold ${getStageStatusColor(
            stage.status,
          )}`}
        >
          {getStageStatusIcon(stage.status)}
        </div>
        {!isLast && (
          <div className="w-0.5 h-full min-h-monday-8 bg-gray-300 mt-monday-2" />
        )}
      </div>

      {/* Stage content */}
      <div className="flex-1 pb-monday-6">
        <Card
          variant="outlined"
          className={`p-monday-4 transition-shadow ${
            stage.interactionCount > 0
              ? 'cursor-pointer hover:shadow-monday-sm'
              : 'opacity-60 cursor-not-allowed'
          }`}
          onClick={handleStageClick}
          role={stage.interactionCount > 0 ? 'button' : undefined}
          aria-label={
            stage.interactionCount > 0
              ? `查看 ${stage.stageName} 阶段的互动记录`
              : `${stage.stageName} 阶段暂无互动记录`
          }
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-monday-base font-semibold text-monday-text mb-monday-2">
                {stage.stageName}
              </h3>
              {stage.completedAt && (
                <p className="text-monday-xs text-monday-text-secondary mb-monday-2">
                  完成时间：{new Date(stage.completedAt).toLocaleString('zh-CN')}
                </p>
              )}
              <p className="text-monday-xs text-monday-text-secondary">
                {stage.interactionCount > 0
                  ? `${stage.interactionCount} 条互动记录`
                  : '暂无互动记录'}
              </p>
            </div>
            {stage.interactionCount > 0 && (
              <Button size="sm" variant="ghost" className="text-monday-xs">
                查看详情 →
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

/**
 * Main Component
 */
export const ProductBusinessProcess: React.FC<ProductBusinessProcessProps> = ({
  productId,
  customerId,
}) => {
  const { token } = useAuth();

  const { data, isLoading, error, refetch } = useQuery<BusinessProcessData>({
    queryKey: ['product-business-process', productId, customerId],
    queryFn: async () => {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_BACKEND_URL ||
        'http://localhost:3006';
      const response = await fetch(
        `${apiBaseUrl}/api/products/${productId}/business-process?customerId=${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('您没有权限查看业务流程');
        }
        if (response.status === 404) {
          throw new Error('产品或客户不存在');
        }
        throw new Error('获取业务流程失败');
      }
      return response.json();
    },
    enabled: !!productId && !!customerId && !!token,
    staleTime: 5 * 60 * 1000, // 5 分钟缓存
  });

  // 缓存失效逻辑：当互动记录创建/更新时，需要在相应的 mutation 成功后调用：
  // queryClient.invalidateQueries(['product-business-process', productId, customerId])
  // 这应该在互动记录创建/更新的 mutation 中实现，不在本组件中

  if (isLoading) {
    return (
      <Card variant="outlined" className="p-monday-4">
        <div className="flex items-center justify-center py-monday-8">
          <span className="animate-spin">⏳</span>
          <span className="ml-monday-2 text-monday-sm text-monday-text-secondary">加载中...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" className="p-monday-4">
        <div className="text-center py-monday-8">
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

  if (!data || data.stages.length === 0) {
    return (
      <Card variant="outlined" className="p-monday-4">
        <div className="text-center py-monday-8">
          <div className="text-monday-4xl mb-monday-4 opacity-50">📋</div>
          <p className="text-monday-base text-monday-text-secondary mb-monday-2">
            该产品与该客户尚未开始业务流程
          </p>
          <p className="text-monday-sm text-monday-text-secondary mb-monday-4">
            记录第一次互动以开始业务流程
          </p>
          <Link to={`/interactions/create?productId=${productId}&customerId=${customerId}`}>
            <Button size="sm" variant="secondary">
              记录新互动
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-monday-2">
      <div className="mb-monday-4">
        <p className="text-monday-sm text-monday-text-secondary">
          共 {data.totalInteractions} 条互动记录
        </p>
      </div>
      {data.stages.map((stage, index) => (
        <StageCard
          key={stage.stageKey}
          stage={stage}
          productId={productId}
          customerId={customerId}
          isLast={index === data.stages.length - 1}
        />
      ))}
    </div>
  );
};

