/**
 * InteractionDetailActivity
 *
 * 活动历史（占位）：创建时间、更新时间；后续可接入审计接口
 * All custom code is proprietary and not open source.
 */

import React from 'react';

export interface InteractionDetailActivityProps {
  createdAt: string;
  updatedAt?: string;
  creatorName?: string;
  formatDate: (date: Date | string) => string;
}

const ClockIcon = (
  <svg className="w-5 h-5 text-uipro-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const InteractionDetailActivity: React.FC<InteractionDetailActivityProps> = ({
  createdAt,
  updatedAt,
  creatorName,
  formatDate,
}) => {
  return (
    <div className="bg-monday-surface rounded-monday-lg shadow-monday-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-uipro-text font-uipro-heading mb-4 flex items-center gap-2">
        {ClockIcon}
        活动历史
      </h2>
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 bg-uipro-cta rounded-full" />
            <div className="w-0.5 h-full bg-gray-200 mt-1 min-h-[20px]" />
          </div>
          <div className="flex-1 pb-4">
            <div className="text-sm font-medium text-uipro-text">
              {creatorName ? `${creatorName} 创建了此记录` : '创建了此记录'}
            </div>
            <div className="text-xs text-uipro-secondary mt-0.5">{formatDate(createdAt)}</div>
          </div>
        </div>
        {updatedAt && (
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 bg-uipro-secondary/50 rounded-full" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-uipro-secondary">更新了记录</div>
              <div className="text-xs text-uipro-secondary mt-0.5 opacity-80">{formatDate(updatedAt)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
