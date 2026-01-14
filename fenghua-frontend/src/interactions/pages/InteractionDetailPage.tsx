/**
 * Interaction Detail Page
 * 
 * Page for viewing interaction record details with comments
 * All custom code is proprietary and not open source.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { interactionsService, InteractionWithAttachments } from '../services/interactions.service';
import { commentService } from '../services/comment.service';
import { CommentList } from '../components/CommentList';
import { CommentInput } from '../components/CommentInput';
import { useAuth } from '../../auth/AuthContext';

export const InteractionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interaction, setInteraction] = useState<InteractionWithAttachments | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentRefreshKey, setCommentRefreshKey] = useState(0);

  useEffect(() => {
    if (!id) {
      setError('互动记录ID无效');
      setIsLoading(false);
      return;
    }

    const loadInteraction = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await interactionsService.getInteraction(id);
        setInteraction(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '加载互动记录失败';
        setError(errorMessage);
        console.error('Failed to load interaction:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInteraction();
  }, [id]);

  const handleCommentSubmit = async (content: string) => {
    if (!id) {
      throw new Error('互动记录ID无效');
    }

    try {
      await commentService.createComment(id, { content });
      // Trigger comment list refresh by updating key
      setCommentRefreshKey((prev) => prev + 1);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('提交评论失败');
      throw error;
    }
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <MainLayout title="互动记录详情">
        <Card>
          <div className="py-8 text-center text-gray-500">加载中...</div>
        </Card>
      </MainLayout>
    );
  }

  if (error || !interaction) {
    return (
      <MainLayout title="互动记录详情">
        <Card>
          <div className="py-8 text-center text-red-600">{error || '互动记录不存在'}</div>
          <div className="text-center mt-4">
            <Button onClick={() => navigate('/interactions')} variant="secondary">
              返回列表
            </Button>
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="互动记录详情">
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <Link to="/interactions">
            <Button variant="ghost" size="sm">
              ← 返回列表
            </Button>
          </Link>
          <div className="flex space-x-2">
            <Link to={`/interactions/${id}/edit`}>
              <Button variant="outline" size="sm">
                编辑
              </Button>
            </Link>
          </div>
        </div>

        {/* Interaction Details */}
        <Card>
          <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">互动记录详情</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">互动类型</label>
                <p className="mt-1 text-base text-gray-900">{interaction.interactionType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">互动日期</label>
                <p className="mt-1 text-base text-gray-900">{formatDate(interaction.interactionDate)}</p>
              </div>
              {interaction.status && (
                <div>
                  <label className="text-sm font-medium text-gray-500">状态</label>
                  <p className="mt-1 text-base text-gray-900">{interaction.status}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">创建时间</label>
                <p className="mt-1 text-base text-gray-900">{formatDate(interaction.createdAt)}</p>
              </div>
            </div>

            {interaction.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">描述</label>
                <p className="mt-1 text-base text-gray-900 whitespace-pre-wrap">{interaction.description}</p>
              </div>
            )}

            {interaction.attachments && interaction.attachments.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">附件</label>
                <div className="mt-2 space-y-2">
                  {interaction.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-600 hover:text-blue-800"
                    >
                      {attachment.fileName}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Comments Section */}
        <Card>
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
      </div>
    </MainLayout>
  );
};
