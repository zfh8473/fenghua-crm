/**
 * Customer Analysis Table Component
 * 
 * Displays customer analysis data in a table format
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { Table, Column } from '../../components/ui/Table';
import { CustomerAnalysisItem } from '../services/customer-analysis.service';
import { useNavigate } from 'react-router-dom';

interface CustomerAnalysisTableProps {
  data: CustomerAnalysisItem[];
  loading?: boolean;
}

/**
 * Churn risk color mapping
 */
const getChurnRiskColor = (risk: CustomerAnalysisItem['churnRisk']): string => {
  switch (risk) {
    case 'HIGH':
      return 'text-red-600 font-semibold';
    case 'MEDIUM':
      return 'text-orange-600 font-semibold';
    case 'LOW':
      return 'text-yellow-600 font-semibold';
    case 'NONE':
      return 'text-green-600 font-semibold';
    default:
      return 'text-monday-text';
  }
};

/**
 * Get value color based on order amount (high value customers)
 */
const getValueColor = (amount: number): string => {
  // High value: > 10000, Medium: 1000-10000, Low: < 1000
  if (amount > 10000) {
    return 'text-green-600 font-semibold';
  } else if (amount > 1000) {
    return 'text-blue-600';
  }
  return 'text-monday-text';
};

export const CustomerAnalysisTable: React.FC<CustomerAnalysisTableProps> = ({
  data,
  loading = false,
}) => {
  const navigate = useNavigate();

  const handleRowClick = (row: CustomerAnalysisItem) => {
    navigate(`/customers?customerId=${row.customerId}`);
  };

  const handleCustomerNameClick = (row: CustomerAnalysisItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click event
    navigate(`/customers?customerId=${row.customerId}`);
  };

  const columns: Column<CustomerAnalysisItem>[] = [
    {
      key: 'customerName',
      header: '客户名称',
      sortable: true,
      render: (value, row) => (
        <span
          className="text-primary-blue hover:underline cursor-pointer"
          onClick={(e) => handleCustomerNameClick(row, e)}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'customerType',
      header: '客户类型',
      sortable: true,
      render: (value) => value === 'BUYER' ? '采购商' : '供应商',
    },
    {
      key: 'orderCount',
      header: '订单量',
      sortable: true,
      render: (value) => value.toLocaleString(),
    },
    {
      key: 'orderAmount',
      header: '订单金额',
      sortable: true,
      render: (value) => (
        <span className={getValueColor(value)}>
          ¥{value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'orderFrequency',
      header: '订单频率',
      sortable: true,
      render: (value) => `${value.toFixed(2)} 单/天`,
    },
    {
      key: 'lastInteractionDate',
      header: '最后互动日期',
      sortable: true,
      render: (value) => {
        const date = new Date(value);
        return date.toLocaleDateString('zh-CN');
      },
    },
    {
      key: 'daysSinceLastInteraction',
      header: '距离最后互动天数',
      sortable: true,
      render: (value) => `${value} 天`,
    },
    {
      key: 'churnRisk',
      header: '流失风险',
      sortable: true,
      render: (value) => {
        const riskLabels = {
          HIGH: '高风险',
          MEDIUM: '中风险',
          LOW: '低风险',
          NONE: '无风险',
        };
        return (
          <span className={getChurnRiskColor(value as CustomerAnalysisItem['churnRisk'])}>
            {riskLabels[value as keyof typeof riskLabels] || value}
          </span>
        );
      },
    },
    {
      key: 'lifetimeValue',
      header: '生命周期价值',
      sortable: true,
      render: (value) => value 
        ? `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : 'N/A',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-monday-12">
        <div className="animate-pulse text-monday-text-secondary">加载中...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-monday-12 text-monday-text-secondary">
        暂无数据
      </div>
    );
  }

  return (
    <div className="w-full">
      <Table
        columns={columns}
        data={data}
        onRowClick={handleRowClick}
        sortable={true}
        rowKey={(row) => row.customerId}
        className="w-full"
        aria-label="客户分析表格"
      />
    </div>
  );
};

