/**
 * InteractionDetailOverview
 *
 * 互动概览卡片：类型、日期、状态、创建者、创建时间、更新时间等
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { getInteractionTypeLabel, getStatusLabel } from '../../constants/interaction-types';
import type { Interaction } from '../../services/interactions.service';

export interface InteractionDetailOverviewProps {
  interaction: Interaction;
  creatorName?: string;
  formatDate: (date: Date | string) => string;
}

const ChartIcon = (
  <svg className="w-5 h-5 text-uipro-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const Item: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <div className="text-xs text-uipro-secondary mb-1">{label}</div>
    <div className="text-sm font-semibold text-uipro-text">{value}</div>
  </div>
);

export const InteractionDetailOverview: React.FC<InteractionDetailOverviewProps> = ({
  interaction,
  creatorName,
  formatDate,
}) => {
  const statusLabel = interaction.status ? getStatusLabel(interaction.status) : '—';
  const statusColor = interaction.status === 'completed' ? 'text-semantic-success' : 'text-uipro-text';

  return (
    <div className="bg-monday-surface rounded-monday-lg shadow-monday-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-uipro-text font-uipro-heading mb-4 flex items-center gap-2">
        {ChartIcon}
        互动概览
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Item label="互动类型" value={getInteractionTypeLabel(interaction.interactionType)} />
        <Item label="互动日期" value={formatDate(interaction.interactionDate)} />
        <Item label="状态" value={<span className={statusColor}>{statusLabel}</span>} />
        <Item label="创建者" value={creatorName ?? '—'} />
        <Item label="创建时间" value={formatDate(interaction.createdAt)} />
        {interaction.updatedAt && (
          <Item label="最后编辑" value={formatDate(interaction.updatedAt)} />
        )}
        {interaction.attachments && interaction.attachments.length > 0 && (
          <Item label="附件" value={`${interaction.attachments.length}个`} />
        )}
      </div>
    </div>
  );
};
