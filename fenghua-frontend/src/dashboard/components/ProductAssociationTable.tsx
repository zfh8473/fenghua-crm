/**
 * Product Association Table Component
 * 
 * Displays product association analysis data in a table format
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { Table, Column } from '../../components/ui/Table';
import { ProductAssociationAnalysisItem } from '../services/product-association-analysis.service';
import { useNavigate } from 'react-router-dom';

interface ProductAssociationTableProps {
  data: ProductAssociationAnalysisItem[];
  loading?: boolean;
}

/**
 * Conversion rate thresholds for color coding
 */
const CONVERSION_RATE_THRESHOLDS = {
  HIGH: 20,
  LOW: 5,
} as const;

/**
 * Get conversion rate color based on value
 */
const getConversionRateColor = (rate: number): string => {
  if (rate >= CONVERSION_RATE_THRESHOLDS.HIGH) {
    return 'text-green-600 font-semibold'; // High conversion rate
  } else if (rate < CONVERSION_RATE_THRESHOLDS.LOW) {
    return 'text-red-600 font-semibold'; // Low conversion rate
  }
  return 'text-monday-text'; // Normal
};

export const ProductAssociationTable: React.FC<ProductAssociationTableProps> = ({
  data,
  loading = false,
}) => {
  const navigate = useNavigate();

  const handleRowClick = (row: ProductAssociationAnalysisItem) => {
    navigate(`/products/${row.productId}`);
  };

  const columns: Column<ProductAssociationAnalysisItem>[] = [
    {
      key: 'productName',
      header: '产品名称',
      sortable: true,
    },
    {
      key: 'categoryName',
      header: '产品类别',
      render: (value) => value || '未分类',
    },
    {
      key: 'totalCustomers',
      header: '关联客户数',
      sortable: true,
      render: (value) => value.toLocaleString(),
    },
    {
      key: 'buyerCount',
      header: '采购商',
      sortable: true,
      render: (value) => value.toLocaleString(),
    },
    {
      key: 'supplierCount',
      header: '供应商',
      sortable: true,
      render: (value) => value.toLocaleString(),
    },
    {
      key: 'totalInteractions',
      header: '互动记录数',
      sortable: true,
      render: (value) => value.toLocaleString(),
    },
    {
      key: 'orderCount',
      header: '订单数',
      sortable: true,
      render: (value) => value.toLocaleString(),
    },
    {
      key: 'conversionRate',
      header: '转化率',
      sortable: true,
      render: (value) => (
        <span className={getConversionRateColor(value)}>
          {value.toFixed(2)}%
        </span>
      ),
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
        rowKey={(row) => row.productId}
        className="w-full"
        aria-label="产品关联分析表格"
      />
    </div>
  );
};

