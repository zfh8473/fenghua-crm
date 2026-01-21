/**
 * Interaction Detail Page
 * 
 * Page for viewing interaction record details with comments
 * All custom code is proprietary and not open source.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
import { getInteractionTypeLabel } from '../constants/interaction-types';
import { productsService } from '../../products/products.service';
import { customersService } from '../../customers/customers.service';

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

  // Fetch product information
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', interaction?.productId],
    queryFn: () => productsService.getProduct(interaction!.productId),
    enabled: !!interaction?.productId,
  });

  // Fetch customer information
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', interaction?.customerId],
    queryFn: () => customersService.getCustomer(interaction!.customerId),
    enabled: !!interaction?.customerId,
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

  const handleDelete = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      await interactionsService.deleteInteraction(id);
      navigate('/interactions');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除互动记录失败';
      setError(errorMessage);
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

  /**
   * Get interaction type color class based on interaction type
   * 
   * @param type - Interaction type string
   * @returns Tailwind CSS class string for background and text color
   */
  /** 19.3 main-business：类型色 uipro-* / semantic-*，不引入紫/粉 */
  const getInteractionTypeColor = (type: string): string => {
    const buyerTypes = [
      'initial_contact', 'product_inquiry', 'quotation', 'quotation_accepted', 'quotation_rejected',
      'order_signed', 'order_follow_up', 'order_completed',
    ];
    const supplierTypes = [
      'product_inquiry_supplier', 'quotation_received', 'specification_confirmed',
      'production_progress', 'pre_shipment_inspection', 'shipped',
    ];
    if (buyerTypes.includes(type)) return 'bg-uipro-cta/15 text-uipro-cta border border-uipro-cta/25';
    if (supplierTypes.includes(type)) return 'bg-uipro-secondary/15 text-uipro-secondary border border-uipro-secondary/25';
    return 'bg-uipro-secondary/15 text-uipro-secondary border border-gray-200';
  };

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
          <div className="py-8 text-center text-semantic-error" role="alert">{error || '互动记录不存在'}</div>
          <div className="text-center mt-4">
            <Button onClick={() => navigate('/interactions')} variant="outline" className="cursor-pointer transition-colors duration-200">
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
            <Button variant="outline" size="sm" className="cursor-pointer transition-colors duration-200">
              ← 返回列表
            </Button>
          </Link>
          <div className="flex space-x-2">
            <Link to={`/interactions/${id}/edit`}>
              <Button variant="primary" size="sm" className="!bg-uipro-cta hover:!bg-uipro-cta/90 cursor-pointer transition-colors duration-200">
                编辑
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

        {/* Interaction Details */}
        <Card>
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">互动记录详情</h2>
            
            {/* Customer and Product Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-200">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 block">客户</label>
                {customerLoading ? (
                  <p className="text-base text-gray-500">加载中...</p>
                ) : customer ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/customers?customerId=${customer.id}`}
                        className="text-base text-uipro-cta hover:underline font-medium cursor-pointer transition-colors duration-200"
                      >
                        {customer.name}
                      </Link>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          customer.customerType === 'BUYER'
                            ? 'bg-uipro-cta/15 text-uipro-cta border border-uipro-cta/25'
                            : 'bg-semantic-success/15 text-semantic-success border border-semantic-success/25'
                        }`}
                      >
                        {customer.customerType === 'BUYER' ? '采购商' : '供应商'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-base text-gray-500">未知客户</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 block">产品</label>
                {productLoading ? (
                  <p className="text-base text-gray-500">加载中...</p>
                ) : product ? (
                  <div className="space-y-1">
                    <Link
                      to={`/products?productId=${product.id}`}
                      className="text-base text-uipro-cta hover:underline font-medium block cursor-pointer transition-colors duration-200"
                    >
                      {product.name}
                    </Link>
                    {product.hsCode && (
                      <p className="text-sm text-gray-500">HS Code: {product.hsCode}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-base text-gray-500">未知产品</p>
                )}
              </div>
            </div>

            {/* Interaction Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 block">互动类型</label>
                <div className="pt-1">
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold ${getInteractionTypeColor(interaction.interactionType)}`}
                  >
                    {getInteractionTypeLabel(interaction.interactionType)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">互动日期</label>
                <p className="text-base text-gray-900">{formatDate(interaction.interactionDate)}</p>
              </div>
              {interaction.status && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">状态</label>
                  <p className="text-base text-gray-900">{interaction.status}</p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">创建时间</label>
                <p className="text-base text-gray-900">{formatDate(interaction.createdAt)}</p>
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
                      className="block text-uipro-cta hover:underline cursor-pointer transition-colors duration-200"
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
                <Button onClick={() => setShowDeleteConfirm(false)} variant="outline" disabled={isDeleting} className="cursor-pointer transition-colors duration-200">
                  取消
                </Button>
                <Button onClick={handleDelete} variant="primary" className="!bg-semantic-error hover:!bg-semantic-error/90 cursor-pointer transition-colors duration-200" disabled={isDeleting}>
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
