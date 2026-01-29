/**
 * Interaction Detail Page
 *
 * 互动记录详情页：改版布局（头部 + 左主右栏 + 底部），子组件拆分
 * All custom code is proprietary and not open source.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '../../components/layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { interactionsService, InteractionWithAttachments } from '../services/interactions.service';
import { commentService } from '../services/comment.service';
import { CommentList } from '../components/CommentList';
import { CommentInput } from '../components/CommentInput';
import { useAuth } from '../../auth/AuthContext';
import { isAdmin, isDirector } from '../../common/constants/roles';
import { customersService } from '../../customers/customers.service';
import { peopleService, Person } from '../../people/people.service';
import { getUserById } from '../../users/users.service';
import {
  InteractionDetailHeader,
  InteractionDetailOverview,
  InteractionDetailCustomer,
  InteractionDetailProducts,
  InteractionDetailContent,
  InteractionDetailAttachments,
  InteractionDetailActivity,
  InteractionDetailRelated,
  InteractionDetailFooter,
} from '../components/InteractionDetail';

export const InteractionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interaction, setInteraction] = useState<InteractionWithAttachments | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentRefreshKey, setCommentRefreshKey] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const userIsAdmin = isAdmin(user?.role);
  const userIsDirector = isDirector(user?.role);
  const canDelete = userIsAdmin || userIsDirector;

  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', interaction?.customerId],
    queryFn: () => customersService.getCustomer(interaction!.customerId),
    enabled: !!interaction?.customerId,
  });

  const { data: person, isLoading: personLoading } = useQuery<Person>({
    queryKey: ['person', interaction?.personId],
    queryFn: () => peopleService.getPerson(interaction!.personId!),
    enabled: !!interaction?.personId,
  });

  const { data: creator, isLoading: creatorLoading } = useQuery({
    queryKey: ['user', interaction?.createdBy],
    queryFn: () => getUserById(interaction!.createdBy),
    enabled: !!interaction?.createdBy,
  });

  const { data: relatedResult } = useQuery({
    queryKey: ['interactions-related', interaction?.customerId, id],
    queryFn: () =>
      interactionsService.searchInteractions({
        customerId: interaction!.customerId,
        limit: 20,
        sortBy: 'interactionDate',
        sortOrder: 'desc',
      }),
    enabled: !!interaction?.customerId && !!id,
  });

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
    if (!id) throw new Error('互动记录ID无效');
    await commentService.createComment(id, { content });
    setCommentRefreshKey((prev) => prev + 1);
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await interactionsService.deleteInteraction(id);
      navigate('/interactions');
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除互动记录失败');
      console.error('Failed to delete interaction:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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

  const creatorName =
    creator?.firstName && creator?.lastName
      ? `${creator.firstName} ${creator.lastName}`
      : creator?.firstName || creator?.lastName || creator?.email || undefined;

  const relatedList = relatedResult?.interactions ?? [];
  const relatedTotal = relatedResult?.total ?? 0;
  const currentIndex = id ? relatedList.findIndex((i) => i.id === id) : -1;
  const prevId = currentIndex >= 0 && currentIndex < relatedList.length - 1 ? relatedList[currentIndex + 1]?.id : null;
  const nextId = currentIndex > 0 ? relatedList[currentIndex - 1]?.id : null;

  if (isLoading) {
    return (
      <MainLayout title="互动记录详情">
        <Card>
          <div className="p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </Card>
      </MainLayout>
    );
  }

  if (error || !interaction) {
    return (
      <MainLayout title="互动记录详情">
        <Card>
          <div className="py-8 text-center text-semantic-error" role="alert">
            {error || '互动记录不存在'}
          </div>
          <div className="text-center mt-4">
            <Button onClick={() => navigate('/interactions')} variant="outline" className="cursor-pointer">
              返回列表
            </Button>
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="互动记录详情">
      <div className="min-h-screen bg-uipro-bg">
        <InteractionDetailHeader
          interaction={interaction}
          customerName={customer?.name ?? interaction.customerName}
          creatorName={creatorName}
          formatDate={formatDate}
          onDelete={() => setShowDeleteConfirm(true)}
          isDeleting={isDeleting}
          canDelete={canDelete}
        />

        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <InteractionDetailOverview
                interaction={interaction}
                creatorName={creatorName}
                formatDate={formatDate}
              />
              <InteractionDetailCustomer
                customer={customer ? { id: customer.id, name: customer.name, customerType: customer.customerType, customerCode: customer.customerCode } : null}
                person={person ?? null}
                customerLoading={customerLoading}
                personLoading={personLoading}
              />
              <InteractionDetailProducts
                products={interaction.products ?? []}
                legacyProductName={interaction.productName}
              />
              <InteractionDetailContent
                description={interaction.description}
                additionalInfo={interaction.additionalInfo}
              />
              <InteractionDetailAttachments attachments={interaction.attachments ?? []} />

              <div className="bg-monday-surface rounded-monday-lg shadow-monday-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-uipro-text font-uipro-heading mb-4">评论</h2>
                <div className="border-t border-gray-200 pt-6">
                  <CommentInput onSubmit={handleCommentSubmit} placeholder="添加评论..." />
                </div>
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <CommentList key={commentRefreshKey} interactionId={id!} currentUserId={user?.id} />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <InteractionDetailActivity
                createdAt={interaction.createdAt}
                updatedAt={interaction.updatedAt}
                creatorName={creatorName}
                formatDate={formatDate}
              />
              <InteractionDetailRelated
                interactions={relatedList}
                currentId={id!}
                total={relatedTotal}
                formatDate={formatDate}
              />
            </div>
          </div>

          <InteractionDetailFooter prevId={prevId} nextId={nextId} />
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowDeleteConfirm(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowDeleteConfirm(false)}
          role="presentation"
          tabIndex={-1}
        >
          <Card
            variant="default"
            className="max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
          >
            <h3 id="delete-confirm-title" className="text-xl font-semibold text-gray-900 mb-4">
              确认删除
            </h3>
            <p className="text-base text-gray-700 mb-6">确定要删除这条互动记录吗？</p>
            <p className="text-sm text-gray-500 mb-6">此操作将执行软删除，数据保留用于审计。</p>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                disabled={isDeleting}
                className="cursor-pointer"
              >
                取消
              </Button>
              <Button
                onClick={handleDelete}
                variant="danger"
                className="cursor-pointer"
                disabled={isDeleting}
              >
                {isDeleting ? '删除中...' : '确认删除'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </MainLayout>
  );
};
