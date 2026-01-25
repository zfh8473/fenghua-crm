/**
 * Interaction Type Constants
 * 
 * Centralized constants for interaction types and their labels
 * All custom code is proprietary and not open source.
 */

/**
 * Interaction type Chinese labels mapping
 * Must be consistent with Story 3.5
 */
export const INTERACTION_TYPE_LABELS: Record<string, string> = {
  // 采购商互动类型
  initial_contact: '初步接触',
  product_inquiry: '产品询价',
  quotation: '客户报价',
  quotation_accepted: '接受报价',
  quotation_rejected: '拒绝报价',
  order_signed: '签署订单',
  order_follow_up: '进度跟进',
  order_completed: '完成订单',
  // 供应商互动类型
  product_inquiry_supplier: '询价产品',
  quotation_received: '接收报价',
  specification_confirmed: '产品规格确认',
  production_progress: '生产进度跟进',
  pre_shipment_inspection: '发货前验收',
  shipped: '已发货',
};

/**
 * Get interaction type label
 * 
 * @param type - Interaction type string
 * @returns Chinese label for the interaction type, or the original type if not found
 */
export const getInteractionTypeLabel = (type: string): string => {
  return INTERACTION_TYPE_LABELS[type] || type;
};

/**
 * Interaction status Chinese labels mapping
 */
export const INTERACTION_STATUS_LABELS: Record<string, string> = {
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  needs_follow_up: '需要跟进',
};

/**
 * Get interaction status label
 *
 * @param status - Status string (e.g. in_progress)
 * @returns Chinese label for the status, or the original value if not found
 */
export const getStatusLabel = (status?: string): string => {
  if (!status) return '—';
  return INTERACTION_STATUS_LABELS[status] || status;
};

