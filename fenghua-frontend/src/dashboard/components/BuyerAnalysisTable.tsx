/**
 * Buyer Analysis Table Component
 *
 * Displays buyer follow-up status: name, last interaction date, days since last contact
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

const getDaysSinceColor = (days: number): string => {
  if (days <= 30) return 'text-green-600 font-medium';
  if (days <= 60) return 'text-yellow-600 font-medium';
  if (days <= 90) return 'text-orange-500 font-medium';
  return 'text-red-600 font-semibold';
};

const getDaysSinceLabel = (days: number): string => {
  if (days <= 30) return '近期';
  if (days <= 60) return '偏久';
  if (days <= 90) return '较长';
  return '需跟进';
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
    e.stopPropagation();
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
      key: 'lastInteractionDate',
      header: '最后互动日期',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString('zh-CN'),
    },
    {
      key: 'daysSinceLastInteraction',
      header: '距离最后互动',
      sortable: true,
      render: (value) => (
        <span className={getDaysSinceColor(value)}>
          {value} 天&nbsp;
          <span className="text-monday-xs">({getDaysSinceLabel(value)})</span>
        </span>
      ),
    },
  ];

  if (loading) {
    const colCount = 3;
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
        aria-label="采购商联系跟进表格"
      />
    </div>
  );
};
