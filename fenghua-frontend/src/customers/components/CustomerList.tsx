/**
 * Customer List Component
 * 
 * Displays a table of customers with actions
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { Customer } from '../customers.service';
import { Table, Column } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { HomeModuleIcon } from '../../components/icons/HomeModuleIcons';

interface CustomerListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onSelect: (customer: Customer) => void;
  loading?: boolean;
  searchQuery?: string;
}

const highlightText = (text: string, query?: string): React.ReactNode => {
  if (!query || !text) return text;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, index) => {
    if (part.toLowerCase() === query.toLowerCase()) {
      return (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-monday-0.5 rounded">
          {part}
        </mark>
      );
    }
    return part;
  });
};

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onEdit,
  onDelete,
  onSelect,
  loading = false,
  searchQuery
}) => {
  const getCustomerTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      BUYER: '采购商',
      SUPPLIER: '供应商',
    };
    return typeMap[type] || type;
  };

  /** 19.3 main-business：加载用 skeleton，禁止空白/纯文字 */
  if (loading) {
    const colCount = 5;
    return (
      <div className="w-full rounded-monday-lg overflow-hidden bg-monday-surface border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-monday-bg border-b border-gray-200">
                {Array.from({ length: colCount }).map((_, i) => (
                  <th key={i} className="p-monday-2 p-monday-4 text-left">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map((r) => (
                <tr key={r} className="border-b border-gray-200">
                  {Array.from({ length: colCount }).map((_, c) => (
                    <td key={c} className="p-monday-2 p-monday-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-full max-w-[140px]" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /** 19.3 main-business：无 emoji，用 SVG 或纯文字 */
  if (customers.length === 0) {
    if (searchQuery) {
      return (
        <div className="flex flex-col items-center justify-center py-monday-12 px-monday-4">
          <div className="text-center max-w-md">
            <h3 className="text-monday-lg font-semibold text-uipro-text mb-monday-2">
              未找到匹配的客户
            </h3>
            <p className="text-monday-sm text-uipro-secondary mb-monday-4">
              没有找到与 &quot;<span className="font-semibold text-uipro-text">{searchQuery}</span>&quot; 匹配的客户
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="rounded-monday-lg overflow-hidden bg-monday-surface border border-gray-200">
          <div className="text-center p-monday-12">
            <h3 className="text-monday-lg font-semibold text-uipro-text mb-monday-2">暂无客户</h3>
            <p className="text-monday-sm text-uipro-secondary">
              点击「创建新客户」按钮添加第一个客户
            </p>
          </div>
        </div>
      </div>
    );
  }

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: '客户名称',
      width: '38%',
      render: (value, customer) => (
        <div className="font-semibold text-gray-900">
          {highlightText(customer.name, searchQuery)}
        </div>
      ),
    },
    {
      key: 'customerCode',
      header: '客户代码',
      width: '11%',
      render: (value, customer) => (
        <div className="text-gray-900 text-monday-sm font-medium">
          {highlightText(customer.customerCode, searchQuery)}
        </div>
      ),
    },
    {
      key: 'customerType',
      header: '客户类型',
      minWidth: '5rem',
      render: (value, customer) => (
        <span className={`inline-block whitespace-nowrap px-monday-2 py-monday-1 rounded-monday-sm text-monday-xs font-medium transition-colors duration-200 ${
          customer.customerType === 'BUYER'
            ? 'bg-uipro-cta/15 text-uipro-cta'
            : 'bg-semantic-success/15 text-semantic-success'
        }`}>
          {getCustomerTypeLabel(customer.customerType)}
        </span>
      ),
    },
    {
      key: 'contact',
      header: '联系方式',
      minWidth: '9rem',
      render: (value, customer) => (
        <span className="text-gray-900 text-monday-sm font-medium inline-block max-w-full truncate" title={String(customer.phone || customer.website || '-')}>
          {customer.phone || customer.website || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      /* 19.7 AC2：与 UserList、ProductList 统一 outline、uipro-cta/semantic-error、pencilSquare/trash；编辑在左、删除在右 */
      render: (value, customer) => (
        <div className="flex gap-monday-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(customer);
            }}
            title="编辑"
            leftIcon={<HomeModuleIcon name="pencilSquare" className="w-4 h-4 flex-shrink-0" />}
            className="text-uipro-cta hover:bg-uipro-cta/10 cursor-pointer transition-colors duration-200"
          >
            编辑
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(customer);
            }}
            title="删除"
            leftIcon={<HomeModuleIcon name="trash" className="w-4 h-4 flex-shrink-0" />}
            className="text-semantic-error hover:bg-semantic-error/10 cursor-pointer transition-colors duration-200"
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Table
      data={customers}
      columns={columns}
      onRowClick={onSelect}
      rowKey={(row) => row.id}
      striped
    />
  );
};
