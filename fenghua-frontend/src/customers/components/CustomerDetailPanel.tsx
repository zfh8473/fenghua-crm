/**
 * Customer Detail Panel Component
 * 
 * Displays detailed customer information in a side panel
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { Customer } from '../customers.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../auth/AuthContext';
import { isAdmin, isDirector, isFrontendSpecialist, isBackendSpecialist } from '../../common/constants/roles';
import { CustomerProductAssociation } from './CustomerProductAssociation';
import { CustomerTimelineSummary } from './CustomerTimelineSummary';
import { HomeModuleIcon } from '../../components/icons/HomeModuleIcons';

interface CustomerDetailPanelProps {
  customer: Customer;
  onEdit?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
}

/**
 * Customer Detail Panel Component
 * 
 * Displays customer information in a side panel with role-based edit/delete buttons
 * 
 * @param customer - The customer object to display
 * @param onEdit - Optional callback when edit button is clicked
 * @param onDelete - Optional callback when delete button is clicked
 */
export const CustomerDetailPanel: React.FC<CustomerDetailPanelProps> = ({
  customer,
  onEdit,
  onDelete,
}) => {
  const { user: currentUser } = useAuth();

  // Permission check: determine if user can edit/delete this customer
  const canEdit = 
    isAdmin(currentUser?.role) || 
    isDirector(currentUser?.role) ||
    (isFrontendSpecialist(currentUser?.role) && customer.customerType === 'BUYER') ||
    (isBackendSpecialist(currentUser?.role) && customer.customerType === 'SUPPLIER');

  const handleEdit = () => {
    if (onEdit) {
      onEdit(customer);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(customer);
    }
  };

  return (
    <div className="space-y-monday-4">
      {/* Customer Header（19.3 main-business：uipro-* 徽章、标题） */}
      <div>
        <h3 className="text-monday-xl font-bold text-gray-900 mb-monday-2 font-uipro-heading">{customer.name}</h3>
        <div className="flex items-center gap-monday-2">
          <span className={`px-monday-3 py-monday-1 rounded-full text-monday-xs font-semibold transition-colors duration-200 ${
            customer.customerType === 'BUYER'
              ? 'bg-uipro-cta/15 text-uipro-cta'
              : 'bg-semantic-success/15 text-semantic-success'
          }`}>
            {customer.customerType === 'BUYER' ? '采购商' : '供应商'}
          </span>
          {customer.customerCode && (
            <span className="text-monday-sm text-gray-900 font-medium font-mono">
              {customer.customerCode}
            </span>
          )}
        </div>
      </div>

      {/* Basic Information（19.3：信息分组、uipro-text） */}
      <Card variant="outlined" className="p-monday-4 transition-colors duration-200">
        <h4 className="text-monday-base font-semibold text-gray-900 mb-monday-3 font-uipro-heading">基本信息</h4>
        <div className="space-y-monday-3">
          <div>
            <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">地址</div>
            <p className="text-monday-base text-gray-900 font-medium mt-monday-1">{customer.address || '-'}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-monday-3">
            <div>
              <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">城市</div>
              <p className="text-monday-base text-gray-900 font-medium mt-monday-1">{customer.city || '-'}</p>
            </div>
            <div>
              <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">州/省</div>
              <p className="text-monday-base text-gray-900 font-medium mt-monday-1">{customer.state || '-'}</p>
            </div>
            <div>
              <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">国家</div>
              <p className="text-monday-base text-gray-900 font-medium mt-monday-1">{customer.country || '-'}</p>
            </div>
            <div>
              <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">邮编</div>
              <p className="text-monday-base text-gray-900 font-medium mt-monday-1">{customer.postalCode || '-'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card variant="outlined" className="p-monday-4 transition-colors duration-200">
        <h4 className="text-monday-base font-semibold text-gray-900 mb-monday-3 font-uipro-heading">联系信息</h4>
        <div className="space-y-monday-3">
          <div>
            <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">电话</div>
            <p className="text-monday-base text-gray-900 font-medium mt-monday-1">{customer.phone || '-'}</p>
          </div>
          {customer.website ? (
            <div>
              <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">网站</div>
              <p className="text-monday-base text-gray-900 font-medium mt-monday-1">
                <a
                  href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-uipro-cta hover:underline cursor-pointer transition-colors duration-200"
                >
                  {customer.website}
                </a>
              </p>
            </div>
          ) : (
            <div>
              <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">网站</div>
              <p className="text-monday-base text-gray-900 font-medium mt-monday-1">-</p>
            </div>
          )}
          <div>
            <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">域名</div>
            <p className="text-monday-base text-gray-900 font-medium mt-monday-1 font-mono">{customer.domainName || '-'}</p>
          </div>
        </div>
      </Card>

      {/* Business Information */}
      <Card variant="outlined" className="p-monday-4 transition-colors duration-200">
        <h4 className="text-monday-base font-semibold text-gray-900 mb-monday-3 font-uipro-heading">业务信息</h4>
        <div className="space-y-monday-3">
          <div>
            <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">行业</div>
            <p className="text-monday-base text-gray-900 font-medium mt-monday-1">{customer.industry || '-'}</p>
          </div>
          <div>
            <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">规模（员工数）</div>
            <p className="text-monday-base text-gray-900 font-medium mt-monday-1">
              {customer.employees !== undefined && customer.employees !== null 
                ? customer.employees.toLocaleString() 
                : '-'}
            </p>
          </div>
          {customer.notes ? (
            <div>
              <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">备注</div>
              <p className="text-monday-base text-gray-900 font-medium mt-monday-1 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          ) : (
            <div>
              <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">备注</div>
              <p className="text-monday-base text-gray-900 font-medium mt-monday-1">-</p>
            </div>
          )}
        </div>
      </Card>

      {/* 关联的产品 */}
      <CustomerProductAssociation customerId={customer.id} customer={customer} />

      {/* 时间线视图 */}
      <CustomerTimelineSummary customerId={customer.id} />

      {/* Edit/Delete Buttons（与 CustomerList 统一：outline、uipro-cta/semantic-error、pencilSquare/trash 图标、居中） */}
      {canEdit && onEdit && onDelete ? (
        <div className="flex justify-center gap-monday-2 mt-monday-4">
          <Button
            onClick={handleEdit}
            variant="outline"
            size="sm"
            title="编辑"
            leftIcon={<HomeModuleIcon name="pencilSquare" className="w-4 h-4 flex-shrink-0" />}
            aria-label="编辑客户"
            className="text-uipro-cta hover:bg-uipro-cta/10 cursor-pointer transition-colors duration-200"
          >
            编辑
          </Button>
          <Button
            onClick={handleDelete}
            variant="outline"
            size="sm"
            title="删除"
            leftIcon={<HomeModuleIcon name="trash" className="w-4 h-4 flex-shrink-0" />}
            aria-label="删除客户"
            className="text-semantic-error hover:bg-semantic-error/10 cursor-pointer transition-colors duration-200"
          >
            删除
          </Button>
        </div>
      ) : null}
    </div>
  );
};

