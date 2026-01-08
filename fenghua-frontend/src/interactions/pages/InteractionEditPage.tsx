/**
 * Interaction Edit Page
 * 
 * Page for editing an existing interaction record
 * All custom code is proprietary and not open source.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { InteractionEditForm } from '../components/InteractionEditForm';
import { MainLayout } from '../../components/layout';
import { Card } from '../../components/ui/Card';
import { INTERACTION_EDIT_ERRORS } from '../../common/constants/error-messages';

export const InteractionEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <MainLayout title="编辑互动记录">
        <Card variant="default" className="w-full">
          <div className="p-monday-6">
            <div className="text-center py-monday-8">
              <p className="text-monday-sm text-primary-red">
                {INTERACTION_EDIT_ERRORS.INVALID_ID}
              </p>
            </div>
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="编辑互动记录">
      <Card variant="default" className="w-full">
        <div className="p-monday-6">
          <h2 className="text-monday-2xl font-semibold text-monday-text mb-monday-6">
            编辑互动记录
          </h2>
          <InteractionEditForm
            interactionId={id}
            onSuccess={() => navigate(-1)}
            onCancel={() => navigate(-1)}
          />
        </div>
      </Card>
    </MainLayout>
  );
};

