/**
 * Buyer Analysis Table Component
 * 
 * Displays buyer analysis data in a table format
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { Table, Column } from '../../components/ui/Table';
import { BuyerAnalysisItem } from '../services/buyer-analysis.service';
import { useNavigate } from 'react-router-dom';

interface BuyerAnalysisTableProps {
  data: BuyerAnalysisItem[];
  loading?: boolean;
}

/**
 * Activity rating color mapping
 */
const getActivityRatingColor = (rating: BuyerAnalysisItem['activityRating']): string => {
  switch (rating) {
    case 'HIGH':
      return 'text-green-600 font-semibold';
    case 'MEDIUM':
      return 'text-blue-600 font-semibold';
    case 'LOW':
      return 'text-yellow-600 font-semibold';
    default:
      return 'text-monday-text';
  }
};

/**
 * Churn risk color mapping
 */
const getChurnRiskColor = (risk: BuyerAnalysisItem['churnRisk']): string => {
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
 * Get value color based on order amount (high value buyers)
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

export const BuyerAnalysisTable: React.FC<BuyerAnalysisTableProps> = ({
  data,
  loading = false,
}) => {
  const navigate = useNavigate();

  const handleRowClick = (row: BuyerAnalysisItem) => {
    navigate(`/customers?customerId=${row.buyerId}`);
  };

  const handleBuyerNameClick = (row: BuyerAnalysisItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click event
    navigate(`/customers?customerId=${row.buyerId}`);
  };

  const columns: Column<BuyerAnalysisItem>[] = [
    {
      key: 'buyerName',
      header: '采购商名称',
      sortable: true,
      render: (value, row) => (
        <span
          className="text-uipro-cta hover:underline cursor-pointer transition-colors duration-200"
          onClick={(e) => handleBuyerNameClick(row, e)}
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
      key: 'orderFrequency',
      header: '订单频率',
      sortable: true,
      render: (value) => `${value.toFixed(4)} 单/天`,
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
      key: 'activityLevel',
      header: '活跃度',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span>{value.toFixed(2)}%</span>
          <span className={getActivityRatingColor(row.activityRating)}>
            ({row.activityRating === 'HIGH' ? '高' : row.activityRating === 'MEDIUM' ? '中' : '低'})
          </span>
        </div>
      ),
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
          <span className={getChurnRiskColor(value as BuyerAnalysisItem['churnRisk'])}>
            {riskLabels[value as keyof typeof riskLabels] || value}
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
    const colCount = 9;
    return (
      <div className="w-full rounded-monday-lg overflow-hidden bg-monday-surface border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-monday-bg border-b border-gray-200">
                {Array.from({ length: colCount }).map((_, i) => (
                  <th key={i} className="p-monday-2 p-monday-4 text-left">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((r) => (
                <tr key={r} className="border-b border-gray-200">
                  {Array.from({ length: colCount }).map((_, c) => (
                    <td key={c} className="p-monday-2 p-monday-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-full max-w-[120px]" />
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

  if (data.length === 0) {
    return (
      <div className="text-center py-monday-12 text-uipro-secondary">暂无数据</div>
    );
  }

  return (
    <div className="w-full">
      <Table
        columns={columns}
        data={data}
        onRowClick={handleRowClick}
        sortable={true}
        rowKey={(row) => row.buyerId}
        striped
        className="w-full"
        aria-label="采购商分析表格"
      />
    </div>
  );
};

