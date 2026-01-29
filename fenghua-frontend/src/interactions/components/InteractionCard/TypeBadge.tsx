/**
 * TypeBadge Component
 * 
 * Displays interaction type badge with color coding
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { InteractionType } from '../../services/interactions.service';
import { getInteractionTypeLabel } from '../../constants/interaction-types';

interface TypeBadgeProps {
  type: InteractionType;
  className?: string;
}

/**
 * Get color classes for interaction type badge
 * Based on Story 20.9 color mapping
 * Maps all 14 interaction types to appropriate colors
 */
const getTypeColorClasses = (type: InteractionType): string => {
  // 初步接触：蓝色（uipro-cta）
  const initialContactTypes = [
    'initial_contact',           // 初步接触
    'product_inquiry',            // 产品询价
    'product_inquiry_supplier',   // 询价产品（供应商）
  ];
  
  // 需求讨论/产品演示：紫色（uipro-secondary）
  const discussionTypes = [
    'product_demo',              // 产品演示（如果存在）
    'requirement_discussion',     // 需求讨论（如果存在）
    'specification_confirmed',    // 产品规格确认
    'production_progress',        // 生产进度跟进
    'pre_shipment_inspection',   // 发货前验收
    'order_follow_up',           // 进度跟进
  ];
  
  // 报价：橙色（semantic-warning）
  const quotationTypes = [
    'quotation',                  // 客户报价
    'quotation_received',         // 接收报价
    'quotation_rejected',         // 拒绝报价
  ];
  
  // 签约：绿色（semantic-success）
  const contractTypes = [
    'order_signed',               // 签署订单
    'quotation_accepted',          // 接受报价
    'order_completed',            // 完成订单
    'shipped',                    // 已发货
  ];

  if (initialContactTypes.includes(type)) {
    return 'bg-uipro-cta/15 text-uipro-cta border border-uipro-cta/25';
  }
  if (discussionTypes.includes(type)) {
    return 'bg-uipro-secondary/15 text-uipro-secondary border border-uipro-secondary/25';
  }
  if (quotationTypes.includes(type)) {
    return 'bg-semantic-warning/15 text-semantic-warning border border-semantic-warning/25';
  }
  if (contractTypes.includes(type)) {
    return 'bg-semantic-success/15 text-semantic-success border border-semantic-success/25';
  }
  
  // Default: purple (uipro-secondary) - fallback for any unmapped types
  return 'bg-uipro-secondary/15 text-uipro-secondary border border-uipro-secondary/25';
};

export const TypeBadge: React.FC<TypeBadgeProps> = ({ type, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-monday-2 py-monday-1 rounded-monday-md text-monday-xs font-medium ${getTypeColorClasses(type)} ${className}`}
    >
      {getInteractionTypeLabel(type)}
    </span>
  );
};
