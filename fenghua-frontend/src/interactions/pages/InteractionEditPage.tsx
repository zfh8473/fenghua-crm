/**
 * Interaction Edit Page
 * 
 * Page for editing an existing interaction record
 * All custom code is proprietary and not open source.
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { InteractionEditForm } from '../components/InteractionEditForm';
import { MainLayout } from '../../components/layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CommentList } from '../components/CommentList';
import { CommentInput } from '../components/CommentInput';
import { commentService } from '../services/comment.service';
import { interactionsService } from '../services/interactions.service';
import { useAuth } from '../../auth/AuthContext';
import { isAdmin, isDirector } from '../../common/constants/roles';
import { useState } from 'react';
import { INTERACTION_EDIT_ERRORS } from '../../common/constants/error-messages';

export const InteractionEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [commentRefreshKey, setCommentRefreshKey] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const userIsAdmin = isAdmin(user?.role);
  const userIsDirector = isDirector(user?.role);
  const canDelete = userIsAdmin || userIsDirector;

  if (!id) {
    return (
      <MainLayout title="编辑互动记录">
        <Card variant="default" className="w-full">
          <div className="p-monday-6">
            <div className="text-center py-monday-8">
              <p className="text-monday-sm text-semantic-error">
                {INTERACTION_EDIT_ERRORS.INVALID_ID}
              </p>
            </div>
          </div>
        </Card>
      </MainLayout>
    );
  }

  const handleCommentSubmit = async (content: string) => {
    try {
      await commentService.createComment(id, { content });
      // Trigger comment list refresh by updating key
      setCommentRefreshKey((prev) => prev + 1);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('提交评论失败');
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      await interactionsService.deleteInteraction(id);
      navigate('/interactions');
    } catch (err) {
      console.error('Failed to delete interaction:', err);
      alert(err instanceof Error ? err.message : '删除互动记录失败');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <MainLayout title="编辑互动记录">
      <div className="space-y-6">
        {/* 19.7 AC1：编辑页返回列表；AC2 同款：查看详情 uipro-cta、删除 semantic-error，无 emoji */}
        <div className="flex items-center justify-between">
          <Link to="/interactions">
            <Button variant="outline" size="sm" className="cursor-pointer transition-colors duration-200">
              ← 返回列表
            </Button>
          </Link>
          <div className="flex space-x-2">
            <Link to={`/interactions/${id}`}>
              <Button variant="outline" size="sm" className="text-uipro-cta hover:bg-uipro-cta/10 cursor-pointer transition-colors duration-200">
                查看详情
              </Button>
            </Link>
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-semantic-error hover:bg-semantic-error/10 cursor-pointer transition-colors duration-200"
                disabled={isDeleting}
              >
                删除
              </Button>
            )}
          </div>
        </div>

        {/* Edit Form */}
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

        {/* Comments Section */}
        <Card variant="default" className="w-full">
          <div className="p-6 space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">评论</h3>
            
            {/* Comment Input */}
            <div className="border-t border-gray-200 pt-6">
              <CommentInput
                onSubmit={handleCommentSubmit}
                placeholder="添加评论..."
              />
            </div>

            {/* Comment List */}
            <div className="border-t border-gray-200 pt-6">
              <CommentList
                key={commentRefreshKey}
                interactionId={id}
                currentUserId={user?.id}
              />
            </div>
          </div>
        </Card>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteConfirm(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowDeleteConfirm(false);
              }
            }}
            role="presentation"
            tabIndex={-1}
          >
            <Card variant="default" className="max-w-md w-full" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
              <h3 id="delete-confirm-title" className="text-xl font-semibold text-gray-900 mb-4">确认删除</h3>
              <p className="text-base text-gray-700 mb-6">
                确定要删除这条互动记录吗？
              </p>
              <p className="text-sm text-gray-500 mb-6">
                此操作将执行软删除，数据保留用于审计。
              </p>
              <div className="flex justify-end gap-3">
                <Button onClick={() => setShowDeleteConfirm(false)} variant="outline" disabled={isDeleting}>
                  取消
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="primary"
                  className="!bg-semantic-error hover:!bg-semantic-error/90 cursor-pointer transition-colors duration-200"
                  disabled={isDeleting}
                >
                  {isDeleting ? '删除中...' : '确认删除'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

