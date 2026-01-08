/**
 * Interactions Page
 * 
 * Page for listing interaction records
 * All custom code is proprietary and not open source.
 */

import { MainLayout } from '../../components/layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

export const InteractionsPage: React.FC = () => {
  return (
    <MainLayout title="互动记录">
      <Card variant="default" className="w-full">
        <div className="p-monday-6">
          <div className="flex items-center justify-between mb-monday-6">
            <h2 className="text-monday-2xl font-semibold text-monday-text">
              互动记录
            </h2>
            <Link to="/interactions/create">
              <Button>记录新互动</Button>
            </Link>
          </div>
          <div className="text-center py-monday-12 text-monday-text-secondary">
            <p>互动记录列表功能将在后续 story 中实现</p>
          </div>
        </div>
      </Card>
    </MainLayout>
  );
};

