/**
 * InteractionDetailRelated
 *
 * 相关互动：同客户其他记录列表
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { getInteractionTypeLabel } from '../../constants/interaction-types';
import type { Interaction } from '../../services/interactions.service';

export interface InteractionDetailRelatedProps {
  interactions: Interaction[];
  currentId: string;
  total?: number;
  formatDate: (date: Date | string) => string;
}

const LinkIcon = (
  <svg className="w-5 h-5 text-uipro-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

/** 与 TypeBadge 一致的类型色（uipro-* / semantic-*，不引入紫/粉） */
const getTypeBg = (type: string): string => {
  const warning = ['quotation', 'quotation_received', 'quotation_rejected'];
  const cta = ['initial_contact', 'product_inquiry', 'product_inquiry_supplier'];
  const secondary = ['specification_confirmed', 'production_progress', 'pre_shipment_inspection', 'order_follow_up'];
  const success = ['quotation_accepted', 'order_signed', 'order_completed', 'shipped'];
  if (warning.includes(type)) return 'bg-semantic-warning/15 text-semantic-warning';
  if (cta.includes(type)) return 'bg-uipro-cta/15 text-uipro-cta';
  if (secondary.includes(type)) return 'bg-uipro-secondary/15 text-uipro-secondary';
  if (success.includes(type)) return 'bg-semantic-success/15 text-semantic-success';
  return 'bg-uipro-secondary/10 text-uipro-secondary';
};

export const InteractionDetailRelated: React.FC<InteractionDetailRelatedProps> = ({
  interactions,
  currentId,
  total = 0,
  formatDate,
}) => {
  const list = interactions.filter((i) => i.id !== currentId).slice(0, 5);
  const displayTotal = total > 0 ? total : list.length;

  return (
    <div className="bg-monday-surface rounded-monday-lg shadow-monday-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-uipro-text font-uipro-heading mb-4 flex items-center gap-2">
        {LinkIcon}
        相关互动
      </h2>
      <div className="text-xs text-uipro-secondary mb-3">与此客户的其他记录</div>
      <div className="space-y-3">
        {list.map((item) => (
          <Link
            key={item.id}
            to={`/interactions/${item.id}`}
            className="block p-3 border border-gray-200 rounded-monday-lg hover:border-uipro-cta/50 transition-colors duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-xs ${getTypeBg(item.interactionType)}`}>
                {getInteractionTypeLabel(item.interactionType)}
              </span>
              <span className="text-xs text-uipro-secondary">{formatDate(item.interactionDate)}</span>
            </div>
            <div className="text-sm text-uipro-text font-medium">
              {item.description ? item.description.slice(0, 30) + (item.description.length > 30 ? '…' : '') : '无描述'}
            </div>
          </Link>
        ))}
        {displayTotal > list.length && (
          <Link
            to={`/interactions?customerId=${interactions[0]?.customerId}`}
            className="block py-2 text-sm text-uipro-cta hover:bg-uipro-cta/10 rounded-monday-md text-center cursor-pointer transition-colors duration-200"
          >
            查看全部{displayTotal}条互动 →
          </Link>
        )}
      </div>
    </div>
  );
};
