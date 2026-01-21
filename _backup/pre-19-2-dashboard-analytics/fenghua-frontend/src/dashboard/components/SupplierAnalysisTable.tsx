/**
 * Supplier Analysis Table Component
 * 
 * Displays supplier analysis data in a table format
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { Table, Column } from '../../components/ui/Table';
import { SupplierAnalysisItem } from '../services/supplier-analysis.service';
import { useNavigate } from 'react-router-dom';

interface SupplierAnalysisTableProps {
  data: SupplierAnalysisItem[];
  loading?: boolean;
}

/**
 * Stability rating color mapping
 */
const getStabilityRatingColor = (rating: SupplierAnalysisItem['stabilityRating']): string => {
  switch (rating) {
    case 'HIGH':
      return 'text-green-600 font-semibold';
    case 'MEDIUM':
      return 'text-blue-600 font-semibold';
    case 'LOW':
      return 'text-yellow-600 font-semibold';
    case 'RISK':
      return 'text-red-600 font-semibold';
    default:
      return 'text-monday-text';
  }
};

/**
 * Get value color based on order amount (high value suppliers)
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

export const SupplierAnalysisTable: React.FC<SupplierAnalysisTableProps> = ({
  data,
  loading = false,
}) => {
  const navigate = useNavigate();

  const handleRowClick = (row: SupplierAnalysisItem) => {
    navigate(`/customers?customerId=${row.supplierId}`);
  };

  const handleSupplierNameClick = (row: SupplierAnalysisItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click event
    navigate(`/customers?customerId=${row.supplierId}`);
  };

  const columns: Column<SupplierAnalysisItem>[] = [
    {
      key: 'supplierName',
      header: '供应商名称',
      sortable: true,
      render: (value, row) => (
        <span
          className="text-primary-blue hover:underline cursor-pointer"
          onClick={(e) => handleSupplierNameClick(row, e)}
        >
          {value}
        </span>
      ),
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
      key: 'cooperationFrequency',
      header: '合作频率',
      sortable: true,
      render: (value) => `${value.toFixed(4)} 单/天`,
    },
    {
      key: 'lastCooperationDate',
      header: '最后合作日期',
      sortable: true,
      render: (value) => {
        const date = new Date(value);
        return date.toLocaleDateString('zh-CN');
      },
    },
    {
      key: 'daysSinceLastCooperation',
      header: '距离最后合作天数',
      sortable: true,
      render: (value) => `${value} 天`,
    },
    {
      key: 'stabilityRating',
      header: '合作稳定性',
      sortable: true,
      render: (value) => {
        const ratingLabels = {
          HIGH: '高',
          MEDIUM: '中',
          LOW: '低',
          RISK: '风险',
        };
        return (
          <span className={getStabilityRatingColor(value as SupplierAnalysisItem['stabilityRating'])}>
            {ratingLabels[value as keyof typeof ratingLabels] || value}
          </span>
        );
      },
    },
    {
      key: 'lifetimeValue',
      header: '生命周期价值',
      sortable: true,
      render: (value) => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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
        rowKey={(row) => row.supplierId}
        className="w-full"
        aria-label="供应商分析表格"
      />
    </div>
  );
};

