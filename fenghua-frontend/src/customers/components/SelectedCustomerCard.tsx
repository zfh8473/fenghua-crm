/**
 * SelectedCustomerCard
 *
 * 选中客户后以卡片展示，风格与联系人卡片区分：灰底、企业图标、左侧色条，突出「客户/公司」与「联系人」的差异。
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { Customer } from '../customers.service';

export interface SelectedCustomerCardProps {
  /** 选中的客户 */
  customer: Customer;
  /** 点击移除时回调 */
  onRemove: () => void;
  /** 可选 className */
  className?: string;
}

/** 企业/办公楼图标（与项目 HomeModuleIcons 风格一致，24×24 outline） */
const BuildingOfficeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
  </svg>
);

export const SelectedCustomerCard: React.FC<SelectedCustomerCardProps> = ({
  customer,
  onRemove,
  className = '',
}) => {
  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg border border-slate-200 border-l-4 border-l-indigo-500
        bg-slate-50 text-gray-900
        ${className}
      `}
      role="region"
      aria-label={`已选客户：${customer.name}`}
    >
      {/* 左侧：圆形内企业图标（靛蓝底，与项目风格一致） */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center"
        aria-hidden
      >
        {BuildingOfficeIcon}
      </div>

      {/* 中间：客户名称，第二行客户代码 */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-monday-base text-gray-900 truncate">
          {customer.name}
        </div>
        {customer.customerCode && (
          <p className="text-monday-sm text-slate-600 truncate mt-0.5">
            {customer.customerCode}
          </p>
        )}
      </div>

      {/* 右侧：移除按钮 */}
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        aria-label={`移除 ${customer.name}`}
      >
        <span className="sr-only">移除</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
