/**
 * InteractionDetailHeader
 *
 * 详情页头部：返回、类型徽章 + 标题、日期/状态/创建者、编辑/删除
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { TypeBadge } from '../InteractionCard/TypeBadge';
import { StatusBadge } from '../InteractionCard/StatusBadge';
import type { Interaction, InteractionType, InteractionStatus } from '../../services/interactions.service';

export interface InteractionDetailHeaderProps {
  interaction: Interaction;
  customerName?: string;
  creatorName?: string;
  formatDate: (date: Date | string) => string;
  onDelete: () => void;
  isDeleting?: boolean;
  canDelete: boolean;
}

const ChevronLeftIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);
export const InteractionDetailHeader: React.FC<InteractionDetailHeaderProps> = ({
  interaction,
  customerName,
  creatorName,
  formatDate,
  onDelete,
  isDeleting = false,
  canDelete,
}) => {
  const navigate = useNavigate();
  const title = customerName ? `与${customerName}的互动` : '互动记录详情';

  return (
    <div className="bg-monday-surface border-b border-gray-200 px-6 py-4">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/interactions"
          className="inline-flex items-center gap-1 text-sm text-uipro-secondary hover:text-uipro-text mb-3 cursor-pointer transition-colors duration-200"
        >
          {ChevronLeftIcon}
          返回列表
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <TypeBadge type={interaction.interactionType as InteractionType} className="!px-3 !py-1 !rounded-lg !text-sm" />
              <h1 className="text-2xl font-bold text-uipro-text font-uipro-heading">{title}</h1>
            </div>
            <div className="flex items-center gap-3 text-sm text-uipro-secondary flex-wrap">
              <span>{formatDate(interaction.interactionDate)}</span>
              <span>•</span>
              <StatusBadge status={interaction.status as InteractionStatus} className="!rounded-full" />
              {creatorName && (
                <>
                  <span>•</span>
                  <span>创建者：{creatorName}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-monday-2 flex-shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/interactions/${interaction.id}/edit`)}
              title="编辑"
              aria-label="编辑互动记录"
              className="cursor-pointer"
            >
              编辑
            </Button>
            {canDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={onDelete}
                disabled={isDeleting}
                title="删除"
                aria-label="删除互动记录"
                className="cursor-pointer"
              >
                删除
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
