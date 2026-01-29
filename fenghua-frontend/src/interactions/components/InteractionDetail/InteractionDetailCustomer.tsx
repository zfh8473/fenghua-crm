/**
 * InteractionDetailCustomer
 *
 * 客户信息卡片：客户公司 + 关联联系人
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ContactMethodIcon } from '../../../people/components/ContactMethodIcon';
import { getPersonName } from '../../../people/utils/person-utils';
import type { Person } from '../../../people/people.service';

export interface CustomerSummary {
  id: string;
  name: string;
  customerType?: string;
  customerCode?: string;
}

export interface InteractionDetailCustomerProps {
  customer: CustomerSummary | null;
  person: Person | null;
  customerLoading: boolean;
  personLoading: boolean;
}

const BuildingIcon = (
  <svg className="w-5 h-5 text-uipro-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

export const InteractionDetailCustomer: React.FC<InteractionDetailCustomerProps> = ({
  customer,
  person,
  customerLoading,
  personLoading,
}) => {
  return (
    <div className="bg-monday-surface rounded-monday-lg shadow-monday-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-uipro-text font-uipro-heading mb-4 flex items-center gap-2">
        {BuildingIcon}
        客户信息
      </h2>

      {customerLoading ? (
        <p className="text-sm text-uipro-secondary">加载中...</p>
      ) : !customer ? (
        <p className="text-sm text-uipro-secondary">未知客户</p>
      ) : (
        <>
          <div className="mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 bg-uipro-cta rounded-monday-lg flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                  {customer.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <Link
                    to={`/customers?customerId=${customer.id}`}
                    className="text-uipro-cta font-semibold text-lg hover:underline cursor-pointer transition-colors duration-200"
                  >
                    {customer.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        customer.customerType === 'BUYER'
                          ? 'bg-uipro-cta/15 text-uipro-cta'
                          : 'bg-semantic-success/15 text-semantic-success'
                      }`}
                    >
                      {customer.customerType === 'BUYER' ? '采购商' : '供应商'}
                    </span>
                    {customer.customerCode && (
                      <span className="text-xs text-uipro-secondary">编号: {customer.customerCode}</span>
                    )}
                  </div>
                </div>
              </div>
              <Link
                to={`/customers?customerId=${customer.id}`}
                className="text-sm text-uipro-cta hover:underline flex-shrink-0 cursor-pointer transition-colors duration-200"
              >
                查看客户详情 →
              </Link>
            </div>
          </div>

          {personLoading ? (
            <p className="text-sm text-gray-500">加载联系人...</p>
          ) : person ? (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-uipro-secondary rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                {getPersonName(person).charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-uipro-text">{getPersonName(person)}</span>
                  {person.isImportant && (
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                </div>
                {(person.jobTitle || person.department) && (
                  <div className="text-sm text-uipro-secondary">
                    {[person.jobTitle, person.department].filter(Boolean).join(' · ')}
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <ContactMethodIcon type="phone" hasValue={!!person.phone} value={person.phone} onClick={person.phone ? () => window.open(`tel:${person.phone}`, '_blank') : undefined} />
                  <ContactMethodIcon type="mobile" hasValue={!!person.mobile} value={person.mobile} onClick={person.mobile ? () => window.open(`tel:${person.mobile}`, '_blank') : undefined} />
                  <ContactMethodIcon type="email" hasValue={!!person.email} value={person.email} onClick={person.email ? () => window.open(`mailto:${person.email}`, '_blank') : undefined} />
                  <ContactMethodIcon type="wechat" hasValue={!!person.wechat} value={person.wechat} />
                  <ContactMethodIcon type="whatsapp" hasValue={!!person.whatsapp} value={person.whatsapp} />
                  <ContactMethodIcon type="linkedin" hasValue={!!person.linkedinUrl} value={person.linkedinUrl} onClick={person.linkedinUrl ? () => window.open(person.linkedinUrl!, '_blank') : undefined} />
                  <ContactMethodIcon type="facebook" hasValue={!!person.facebook} value={person.facebook} onClick={person.facebook ? () => window.open(person.facebook!, '_blank') : undefined} />
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};
