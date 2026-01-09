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
import { useAuth } from '../../auth/AuthContext';
import { isAdmin, isDirector } from '../../common/constants/roles';

export const InteractionsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const userIsAdmin = isAdmin(currentUser?.role);
  const userIsDirector = isDirector(currentUser?.role);

  return (
    <MainLayout title="互动记录">
      <Card variant="default" className="w-full">
        <div className="p-monday-6">
          <div className="flex items-center justify-between mb-monday-6">
            <h2 className="text-monday-2xl font-semibold text-monday-text">
              互动记录
            </h2>
            <div className="flex items-center gap-monday-3">
              {(userIsAdmin || userIsDirector) && (
                <Link to="/interactions/import">
                  <Button 
                    variant="primary" 
                    size="md" 
                    className="bg-gradient-to-r from-primary-green to-primary-green-hover hover:from-primary-green-hover hover:to-primary-green shadow-monday-md hover:shadow-monday-lg font-semibold whitespace-nowrap"
                  >
                    <span className="mr-monday-2">📥</span>
                    批量导入
                  </Button>
                </Link>
              )}
              <Link to="/interactions/create">
                <Button 
                  variant="primary" 
                  size="md" 
                  className="bg-gradient-to-r from-primary-blue to-primary-blue-hover hover:from-primary-blue-hover hover:to-primary-blue shadow-monday-md hover:shadow-monday-lg font-semibold"
                >
                  <span className="mr-monday-2">✨</span>
                  记录新互动
                </Button>
              </Link>
            </div>
          </div>
          <div className="text-center py-monday-12 text-monday-text-secondary">
            <p>互动记录列表功能将在后续 story 中实现</p>
          </div>
        </div>
      </Card>
    </MainLayout>
  );
};

