/**
 * InteractionDetailContent
 *
 * 互动内容卡片：描述 + 可选 additionalInfo 解析（讨论要点、后续行动）
 * All custom code is proprietary and not open source.
 */

import React from 'react';

export interface InteractionDetailContentProps {
  description?: string;
  additionalInfo?: Record<string, unknown>;
}

const ChatIcon = (
  <svg className="w-5 h-5 text-uipro-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

export const InteractionDetailContent: React.FC<InteractionDetailContentProps> = ({
  description,
  additionalInfo,
}) => {
  const points = additionalInfo?.discussionPoints as string[] | undefined;
  const nextSteps = additionalInfo?.nextSteps as string[] | undefined;

  if (!description && !points?.length && !nextSteps?.length) {
    return (
      <div className="bg-monday-surface rounded-monday-lg shadow-monday-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-uipro-text font-uipro-heading mb-4 flex items-center gap-2">
          {ChatIcon}
          互动内容
        </h2>
        <p className="text-sm text-uipro-secondary">暂无描述</p>
      </div>
    );
  }

  return (
    <div className="bg-monday-surface rounded-monday-lg shadow-monday-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-uipro-text font-uipro-heading mb-4 flex items-center gap-2">
        {ChatIcon}
        互动内容
      </h2>
      <div className="prose max-w-none text-sm text-uipro-text leading-relaxed">
        {description && (
          <p className="mb-3 whitespace-pre-wrap">{description}</p>
        )}
        {Array.isArray(points) && points.length > 0 && (
          <>
            <p className="font-semibold text-uipro-text mb-2">讨论要点：</p>
            <ul className="list-disc list-inside mb-3 space-y-1">
              {points.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </>
        )}
        {Array.isArray(nextSteps) && nextSteps.length > 0 && (
          <>
            <p className="font-semibold text-uipro-text mb-2">后续行动：</p>
            <ul className="list-disc list-inside space-y-1">
              {nextSteps.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};
