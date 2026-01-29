/**
 * InteractionDetailFooter
 *
 * 底部导航：上一条 / 下一条（与 ui-ux-pro-max 对齐）
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { Link } from 'react-router-dom';

export interface InteractionDetailFooterProps {
  prevId?: string | null;
  nextId?: string | null;
}

const ChevronLeft = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);
const ChevronRight = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export const InteractionDetailFooter: React.FC<InteractionDetailFooterProps> = ({
  prevId,
  nextId,
}) => {
  return (
    <div className="mt-6 flex items-center justify-between bg-monday-surface rounded-monday-lg shadow-monday-sm border border-gray-200 p-4">
      {prevId ? (
        <Link
          to={`/interactions/${prevId}`}
          className="flex items-center gap-2 px-4 py-2 text-uipro-text hover:bg-uipro-cta/10 rounded-monday-md text-sm font-medium cursor-pointer transition-colors duration-200"
        >
          {ChevronLeft}
          上一条
        </Link>
      ) : (
        <span className="flex items-center gap-2 px-4 py-2 text-uipro-secondary cursor-not-allowed text-sm opacity-60">
          {ChevronLeft}
          上一条
        </span>
      )}

      {nextId ? (
        <Link
          to={`/interactions/${nextId}`}
          className="flex items-center gap-2 px-4 py-2 text-uipro-text hover:bg-uipro-cta/10 rounded-monday-md text-sm font-medium cursor-pointer transition-colors duration-200"
        >
          下一条
          {ChevronRight}
        </Link>
      ) : (
        <span className="flex items-center gap-2 px-4 py-2 text-uipro-secondary cursor-not-allowed text-sm opacity-60">
          下一条
          {ChevronRight}
        </span>
      )}
    </div>
  );
};
