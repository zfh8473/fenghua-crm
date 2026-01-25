/**
 * Person Detail Panel Component
 * 
 * Displays detailed person (contact) information in a side panel
 * All custom code is proprietary and not open source.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Person, peopleService, PersonInteraction, UpdatePersonDto } from '../people.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { HomeModuleIcon } from '../../components/icons/HomeModuleIcons';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getErrorMessage } from '../../utils/error-handling';
import { getInteractionTypeLabel } from '../../interactions/constants/interaction-types';
import { getPersonName } from '../utils/person-utils';
import { formatDate } from '../../utils/date-utils';

interface PersonDetailPanelProps {
  person: Person;
  onEdit?: (person: Person) => void;
  onDelete?: (person: Person) => void;
}

/**
 * Star icon component for important contacts
 */
const StarIcon: React.FC<{ filled?: boolean; className?: string }> = ({ filled = false, className = 'w-5 h-5' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
};

/**
 * Contact method display component
 */
const ContactMethodDisplay: React.FC<{ 
  label: string;
  value?: string;
  type?: 'phone' | 'mobile' | 'email' | 'wechat' | 'whatsapp' | 'linkedin' | 'facebook';
}> = ({ label, value, type }) => {
  if (!value) return null;

  const getLink = (): string | null => {
    if (!type || !value) return null;
    switch (type) {
      case 'phone':
      case 'mobile':
        return `tel:${value}`;
      case 'email':
        return `mailto:${value}`;
      case 'linkedin':
        return value.startsWith('http') ? value : `https://www.linkedin.com/in/${value}`;
      case 'facebook':
        return value.startsWith('http') ? value : `https://www.facebook.com/${value}`;
      case 'whatsapp':
        return `whatsapp://send?phone=${value.replace(/[^0-9]/g, '')}`;
      case 'wechat':
        return `weixin://`;
      default:
        return null;
    }
  };

  const link = getLink();
  const displayValue = value;

  return (
    <div>
      <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">{label}</div>
      {link ? (
        <a
          href={link}
          target={type === 'email' || type === 'linkedin' || type === 'facebook' ? '_blank' : undefined}
          rel={type === 'email' || type === 'linkedin' || type === 'facebook' ? 'noopener noreferrer' : undefined}
          className="text-monday-base text-uipro-cta hover:underline cursor-pointer transition-colors duration-200 font-medium mt-monday-1 block"
        >
          {displayValue}
        </a>
      ) : (
        <p className="text-monday-base text-gray-900 font-medium mt-monday-1">{displayValue}</p>
      )}
    </div>
  );
};

export const PersonDetailPanel: React.FC<PersonDetailPanelProps> = ({
  person,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [interactions, setInteractions] = useState<PersonInteraction[]>([]);
  const [interactionsLoading, setInteractionsLoading] = useState(false);
  const [interactionsTotal, setInteractionsTotal] = useState(0);
  const [showInteractions, setShowInteractions] = useState(false);
  const [localPerson, setLocalPerson] = useState<Person>(person);
  const [interactionsPage, setInteractionsPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Update local person when prop changes
  useEffect(() => {
    setLocalPerson(person);
  }, [person]);

  // Toggle important status mutation
  const toggleImportantMutation = useMutation({
    mutationFn: async (isImportant: boolean) => {
      return await peopleService.updatePerson(localPerson.id, { isImportant });
    },
    onMutate: async (isImportant: boolean) => {
      // Optimistic update: immediately update local state
      const previousPerson = localPerson;
      setLocalPerson({ ...localPerson, isImportant });
      return { previousPerson };
    },
    onSuccess: (updatedPerson) => {
      // Update local state with server response
      setLocalPerson(updatedPerson);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['person', localPerson.id] });
      toast.success(updatedPerson.isImportant ? '已标记为重要联系人' : '已取消重要联系人标记');
    },
    onError: (error, isImportant, context) => {
      // Rollback optimistic update
      if (context?.previousPerson) {
        setLocalPerson(context.previousPerson);
      }
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || '更新重要标记失败，请重试');
    },
  });


  const loadInteractions = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!showInteractions) return;
    
    if (append) {
      setLoadingMore(true);
    } else {
      setInteractionsLoading(true);
    }
    
    try {
      const limit = 20;
      const offset = (page - 1) * limit;
      const response = await peopleService.getPersonInteractions(localPerson.id, limit, offset);
      
      if (append) {
        setInteractions((prev) => [...prev, ...response.interactions]);
      } else {
        setInteractions(response.interactions);
      }
      setInteractionsTotal(response.total);
    } catch (error) {
      console.error('Failed to load interactions:', error);
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setInteractionsLoading(false);
      }
    }
  }, [showInteractions, localPerson.id]);

  const handleLoadMore = useCallback(() => {
    const nextPage = interactionsPage + 1;
    setInteractionsPage(nextPage);
    loadInteractions(nextPage, true);
  }, [interactionsPage, loadInteractions]);

  useEffect(() => {
    if (showInteractions) {
      setInteractionsPage(1);
      loadInteractions(1, false);
    } else {
      // Reset when hiding interactions
      setInteractions([]);
      setInteractionsPage(1);
    }
  }, [showInteractions, loadInteractions]);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(localPerson);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(localPerson);
    }
  };

  return (
    <div className="space-y-monday-4">
      {/* Person Header */}
      {/* 优化：编辑/删除按钮移至头部，提升可见性和操作便利性 */}
      <div>
        <div className="flex items-start justify-between gap-monday-4 mb-monday-2">
          <div className="flex-1">
            <div className="flex items-center gap-monday-2 mb-monday-2">
              <button
                onClick={() => {
                  if (!toggleImportantMutation.isPending) {
                    toggleImportantMutation.mutate(!localPerson.isImportant);
                  }
                }}
                disabled={toggleImportantMutation.isPending}
                className={`flex-shrink-0 transition-all duration-200 ${
                  toggleImportantMutation.isPending
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:scale-110'
                }`}
                aria-label={localPerson.isImportant ? '取消重要联系人标记' : '标记为重要联系人'}
                title={localPerson.isImportant ? '取消重要联系人标记' : '标记为重要联系人'}
              >
                <StarIcon
                  filled={localPerson.isImportant}
                  className={`w-5 h-5 ${
                    localPerson.isImportant ? 'text-yellow-500' : 'text-gray-400'
                  }`}
                />
              </button>
              <h3 className="text-monday-xl font-bold text-gray-900 font-uipro-heading">{getPersonName(localPerson)}</h3>
            </div>
            {localPerson.company && (
              <div className="flex items-center gap-monday-2">
                <span className={`px-monday-3 py-monday-1 rounded-full text-monday-xs font-semibold transition-colors duration-200 ${
                  localPerson.company.customerType === 'BUYER'
                    ? 'bg-uipro-cta/15 text-uipro-cta'
                    : 'bg-semantic-success/15 text-semantic-success'
                }`}>
                  {localPerson.company.customerType === 'BUYER' ? '采购商' : '供应商'}
                </span>
                {localPerson.company.customerCode && (
                  <span className="text-monday-sm text-gray-900 font-medium font-mono">
                    {localPerson.company.customerCode}
                  </span>
                )}
              </div>
            )}
          </div>
          {/* Edit/Delete Buttons in Header - 统一为填充样式（白字+颜色填充，无图标） */}
          {onEdit && onDelete ? (
            <div className="flex gap-monday-2 flex-shrink-0">
              <Button
                onClick={handleEdit}
                variant="primary"
                size="sm"
                title="编辑"
                aria-label="编辑联系人"
              >
                编辑
              </Button>
              <Button
                onClick={handleDelete}
                variant="danger"
                size="sm"
                title="删除"
                aria-label="删除联系人"
              >
                删除
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Basic Information */}
      <Card variant="outlined" className="p-monday-4 transition-colors duration-200">
        <h4 className="text-monday-base font-semibold text-gray-900 mb-monday-3 font-uipro-heading">基本信息</h4>
        <div className="space-y-monday-3">
          <div>
            <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">职位</div>
            <p className="text-monday-base text-gray-900 font-medium mt-monday-1">{localPerson.jobTitle || '-'}</p>
          </div>
          <div>
            <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">部门</div>
            <p className="text-monday-base text-gray-900 font-medium mt-monday-1">{localPerson.department || '-'}</p>
          </div>
          <div>
            <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">所属客户</div>
            {localPerson.company ? (
              <button
                onClick={() => navigate(`/customers?customerId=${localPerson.companyId}`)}
                className="text-uipro-cta hover:underline cursor-pointer transition-colors duration-200 text-monday-base font-medium mt-monday-1 block"
              >
                {localPerson.company.name}
              </button>
            ) : (
              <p className="text-monday-base text-gray-900 font-medium mt-monday-1">-</p>
            )}
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card variant="outlined" className="p-monday-4 transition-colors duration-200">
        <h4 className="text-monday-base font-semibold text-gray-900 mb-monday-3 font-uipro-heading">联系方式</h4>
        <div className="space-y-monday-3">
          <ContactMethodDisplay label="电话" value={localPerson.phone} type="phone" />
          <ContactMethodDisplay label="手机" value={localPerson.mobile} type="mobile" />
          <ContactMethodDisplay label="邮箱" value={localPerson.email} type="email" />
          <ContactMethodDisplay label="微信" value={localPerson.wechat} type="wechat" />
          <ContactMethodDisplay label="WhatsApp" value={localPerson.whatsapp} type="whatsapp" />
          <ContactMethodDisplay label="LinkedIn" value={localPerson.linkedinUrl} type="linkedin" />
          <ContactMethodDisplay label="Facebook" value={localPerson.facebook} type="facebook" />
        </div>
      </Card>

      {/* Notes */}
      {localPerson.notes && (
        <Card variant="outlined" className="p-monday-4 transition-colors duration-200">
          <h4 className="text-monday-base font-semibold text-gray-900 mb-monday-3 font-uipro-heading">备注</h4>
          <p className="text-monday-base text-gray-900 font-medium whitespace-pre-wrap">{localPerson.notes}</p>
        </Card>
      )}

      {/* Interactions History (Optional) */}
      <Card variant="outlined" className="p-monday-4 transition-colors duration-200">
        <div className="flex items-center justify-between mb-monday-3">
          <h4 className="text-monday-base font-semibold text-gray-900 font-uipro-heading">互动历史</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInteractions(!showInteractions)}
            className="text-uipro-cta hover:bg-uipro-cta/10 cursor-pointer transition-colors duration-200"
          >
            {showInteractions ? '隐藏' : '查看'}
          </Button>
        </div>
        {showInteractions && (
          <div className="space-y-monday-2">
            {interactionsLoading ? (
              <div className="text-center py-monday-4">
                <span className="text-monday-sm text-monday-text-secondary">加载中...</span>
              </div>
            ) : interactionsTotal === 0 ? (
              <div className="text-center py-monday-8">
                <p className="text-monday-sm text-monday-text-secondary mb-monday-4">
                  暂无互动记录
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/interactions/create?personId=${localPerson.id}`)}
                  className="text-uipro-cta hover:bg-uipro-cta/10 cursor-pointer transition-colors duration-200"
                >
                  创建互动记录
                </Button>
              </div>
            ) : (
              <div className="space-y-monday-2">
                {interactions.map((interaction) => (
                  <div
                    key={interaction.id}
                    onClick={() => navigate(`/interactions/${interaction.id}`)}
                    className="p-monday-3 bg-monday-bg rounded-monday-md border border-gray-200 hover:border-uipro-cta/50 cursor-pointer transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between mb-monday-1">
                      <div className="flex items-center gap-monday-2">
                        <span className="text-monday-sm font-semibold text-gray-900">
                          {getInteractionTypeLabel(interaction.interactionType)}
                        </span>
                        {interaction.productName && (
                          <span className="text-monday-xs text-gray-600">
                            · {interaction.productName}
                          </span>
                        )}
                      </div>
                      <span className="text-monday-xs text-gray-600">
                        {formatDate(interaction.interactionDate)}
                      </span>
                    </div>
                    {interaction.customerName && (
                      <div className="text-monday-xs text-gray-600 mb-monday-1">
                        客户：{interaction.customerName}
                      </div>
                    )}
                    {interaction.description && (
                      <p className="text-monday-sm text-gray-700 mt-monday-1 line-clamp-2">
                        {interaction.description}
                      </p>
                    )}
                  </div>
                ))}
                {interactionsTotal > interactions.length && (
                  <div className="text-center pt-monday-4">
                    <p className="text-monday-xs text-monday-text-secondary mb-monday-2">
                      显示 {interactions.length} / {interactionsTotal} 条记录
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="text-uipro-cta hover:bg-uipro-cta/10 cursor-pointer transition-colors duration-200"
                    >
                      {loadingMore ? '加载中...' : '加载更多'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
