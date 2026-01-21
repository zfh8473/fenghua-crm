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

  if (loading) {
    return (
      <div className="text-center p-monday-12 text-monday-text-secondary text-monday-base">加载中...</div>
    );
  }

  if (customers.length === 0) {
    if (searchQuery) {
      return (
        <div className="flex flex-col items-center justify-center py-monday-12 px-monday-4">
          <div className="text-center max-w-md">
            <div className="text-monday-4xl mb-monday-4 opacity-50">🔍</div>
            <h3 className="text-monday-lg font-semibold text-monday-text mb-monday-2">
              未找到匹配的客户
            </h3>
            <p className="text-monday-sm text-monday-text-secondary mb-monday-4">
              没有找到与 "<span className="font-semibold text-monday-text">{searchQuery}</span>" 匹配的客户
            </p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="w-full">
        <div className="rounded-monday-lg overflow-hidden bg-monday-surface border border-gray-200">
          <div className="text-center p-monday-12">
            <div className="text-monday-4xl mb-monday-4 opacity-50">📋</div>
            <h3 className="text-monday-lg font-semibold text-monday-text mb-monday-2">
              暂无客户
            </h3>
            <p className="text-monday-sm text-monday-text-secondary">
              点击"创建新客户"按钮添加第一个客户
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
      render: (value, customer) => (
        <div className="font-medium text-monday-text">
          {highlightText(customer.name, searchQuery)}
        </div>
      ),
    },
    {
      key: 'customerCode',
      header: '客户代码',
      render: (value, customer) => (
        <div className="text-monday-text-secondary text-monday-sm">
          {highlightText(customer.customerCode, searchQuery)}
        </div>
      ),
    },
    {
      key: 'customerType',
      header: '客户类型',
      render: (value, customer) => (
        <span className={`inline-flex items-center px-monday-2 py-monday-1 rounded-monday-sm text-monday-xs font-medium ${
          customer.customerType === 'BUYER' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {getCustomerTypeLabel(customer.customerType)}
        </span>
      ),
    },
    {
      key: 'contact',
      header: '联系方式',
      render: (value, customer) => (
        <div className="text-monday-text-secondary text-monday-sm">
          {customer.phone || customer.website || '-'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (value, customer) => (
        <div className="flex gap-monday-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(customer);
            }}
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
            className="text-red-600 hover:text-red-700"
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
    />
  );
};
