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
import { CustomerTimeline } from './CustomerTimeline';

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
      {/* Customer Header */}
      <div>
        <h3 className="text-monday-xl font-bold text-monday-text mb-monday-2">{customer.name}</h3>
        <div className="flex items-center gap-monday-2">
          <span className={`px-monday-3 py-monday-1 rounded-full text-monday-xs font-semibold ${
            customer.customerType === 'BUYER' 
              ? 'bg-primary-blue/10 text-primary-blue'
              : 'bg-primary-green/10 text-primary-green'
          }`}>
            {customer.customerType === 'BUYER' ? '采购商' : '供应商'}
          </span>
          {customer.customerCode && (
            <span className="text-monday-sm text-monday-text-secondary font-mono">
              {customer.customerCode}
            </span>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <Card variant="outlined" className="p-monday-4">
        <h4 className="text-monday-base font-semibold text-monday-text mb-monday-3">基本信息</h4>
        <div className="space-y-monday-3">
          <div>
            <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">地址</div>
            <p className="text-monday-base text-monday-text mt-monday-1">{customer.address || '-'}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-monday-3">
            <div>
              <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">城市</div>
              <p className="text-monday-base text-monday-text mt-monday-1">{customer.city || '-'}</p>
            </div>
            <div>
              <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">州/省</div>
              <p className="text-monday-base text-monday-text mt-monday-1">{customer.state || '-'}</p>
            </div>
            <div>
              <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">国家</div>
              <p className="text-monday-base text-monday-text mt-monday-1">{customer.country || '-'}</p>
            </div>
            <div>
              <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">邮编</div>
              <p className="text-monday-base text-monday-text mt-monday-1">{customer.postalCode || '-'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card variant="outlined" className="p-monday-4">
        <h4 className="text-monday-base font-semibold text-monday-text mb-monday-3">联系信息</h4>
        <div className="space-y-monday-3">
          <div>
            <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">电话</div>
            <p className="text-monday-base text-monday-text mt-monday-1">{customer.phone || '-'}</p>
          </div>
          {customer.website ? (
            <div>
              <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">网站</div>
              <p className="text-monday-base text-monday-text mt-monday-1">
                <a 
                  href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-blue hover:underline"
                >
                  {customer.website}
                </a>
              </p>
            </div>
          ) : (
            <div>
              <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">网站</div>
              <p className="text-monday-base text-monday-text mt-monday-1">-</p>
            </div>
          )}
          <div>
            <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">域名</div>
            <p className="text-monday-base text-monday-text mt-monday-1 font-mono">{customer.domainName || '-'}</p>
          </div>
        </div>
      </Card>

      {/* Business Information */}
      <Card variant="outlined" className="p-monday-4">
        <h4 className="text-monday-base font-semibold text-monday-text mb-monday-3">业务信息</h4>
        <div className="space-y-monday-3">
          <div>
            <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">行业</div>
            <p className="text-monday-base text-monday-text mt-monday-1">{customer.industry || '-'}</p>
          </div>
          <div>
            <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">规模（员工数）</div>
            <p className="text-monday-base text-monday-text mt-monday-1">
              {customer.employees !== undefined && customer.employees !== null 
                ? customer.employees.toLocaleString() 
                : '-'}
            </p>
          </div>
          {customer.notes ? (
            <div>
              <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">备注</div>
              <p className="text-monday-base text-monday-text mt-monday-1 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          ) : (
            <div>
              <div className="text-monday-xs text-monday-text-secondary uppercase tracking-wider">备注</div>
              <p className="text-monday-base text-monday-text mt-monday-1">-</p>
            </div>
          )}
        </div>
      </Card>

      {/* 关联的产品 */}
      <CustomerProductAssociation customerId={customer.id} customer={customer} />

      {/* 时间线视图 */}
      <Card variant="outlined" className="p-monday-4">
        <h4 className="text-monday-base font-semibold text-monday-text mb-monday-3">时间线视图</h4>
        <CustomerTimeline customerId={customer.id} />
      </Card>

      {/* Edit/Delete Buttons (Role-based) */}
      {canEdit && onEdit && onDelete ? (
        <div className="flex gap-monday-2 mt-monday-4">
          <Button
            onClick={handleEdit}
            variant="secondary"
            size="sm"
            aria-label="编辑客户"
            className="bg-primary-blue/10 border-primary-blue/30 text-primary-blue hover:bg-primary-blue/20 hover:border-primary-blue/50"
            leftIcon={<span>✏️</span>}
          >
            编辑
          </Button>
          <Button
            onClick={handleDelete}
            variant="ghost"
            size="sm"
            aria-label="删除客户"
            className="text-primary-red hover:text-primary-red hover:bg-primary-red/10 border border-transparent hover:border-primary-red/20"
            leftIcon={<span>🗑️</span>}
          >
            删除
          </Button>
        </div>
      ) : null}
    </div>
  );
};

