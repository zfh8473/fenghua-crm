/**
 * Product List Component
 * 
 * Displays a list of products in a table
 * All custom code is proprietary and not open source.
 */

import { Product } from '../products.service';
import { Table, Column } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
// import './ProductList.css'; // Removed

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onSelect?: (product: Product) => void;
  loading?: boolean;
  searchQuery?: string; // Add search query for highlighting
}

/**
 * Highlight matching keywords in text
 */
const highlightText = (text: string, keyword?: string): React.ReactNode => {
  if (!keyword || !text) return text;
  
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    if (regex.test(part)) {
      return (
        <mark key={index} className="bg-yellow-200 text-monday-text font-semibold px-monday-0.5 rounded">
          {part}
        </mark>
      );
    }
    return part;
  });
};

export const ProductList: React.FC<ProductListProps> = ({
  products,
  onEdit,
  onDelete,
  onSelect,
  loading = false,
  searchQuery,
}) => {
  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      active: '活跃',
      inactive: '已停用',
      archived: '已归档',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="text-center p-monday-12 text-monday-text-secondary text-monday-base">加载中...</div>
    );
  }

  if (products.length === 0) {
    // Show empty state with search suggestions if searching
    if (searchQuery) {
      return (
        <div className="flex flex-col items-center justify-center py-monday-12 px-monday-4">
          <div className="text-center max-w-md">
            <div className="text-monday-4xl mb-monday-4 opacity-50">
              🔍
            </div>
            <h3 className="text-monday-lg font-semibold text-monday-text mb-monday-2">
              未找到匹配的产品
            </h3>
            <p className="text-monday-sm text-monday-text-secondary mb-monday-4">
              没有找到与 "<span className="font-semibold text-monday-text">{searchQuery}</span>" 匹配的产品
            </p>
            <div className="bg-monday-bg rounded-monday-md p-monday-3">
              <p className="text-monday-xs font-semibold text-monday-text mb-monday-1">
                💡 搜索建议：
              </p>
              <ul className="text-monday-xs text-monday-text-secondary space-y-monday-0.5 text-left list-disc list-inside">
                <li>检查拼写是否正确</li>
                <li>尝试使用更通用的关键词</li>
                <li>使用产品名称或HS编码搜索</li>
                <li>尝试选择不同的产品类别</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }
    
    // Show default empty state if not searching
    return (
      <div className="w-full">
        <div className="rounded-monday-lg overflow-hidden bg-monday-surface border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="bg-monday-bg border-b border-gray-200">
                {['产品名称', 'HS编码', '类别', '状态', '描述', '创建时间', '操作'].map((header) => (
                  <th key={header} className="p-monday-2 px-monday-4 text-left text-monday-sm font-semibold text-monday-text">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} className="p-monday-12 text-center text-monday-text-secondary">
                  暂无产品
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const columns: Column<Product>[] = [
    { 
      key: 'name', 
      header: '产品名称',
      render: (value) => searchQuery ? highlightText(value as string, searchQuery) : value
    },
    { 
      key: 'hsCode', 
      header: 'HS编码', 
      render: (value) => (
        <span className="font-mono">
          {searchQuery ? highlightText(value as string, searchQuery) : value}
        </span>
      )
    },
    { key: 'category', header: '类别', render: (value) => value || '-' },
    {
      key: 'status',
      header: '状态',
      render: (status) => (
        <span className={`px-monday-2 py-monday-1 rounded-monday-sm text-monday-xs font-medium ${
          status === 'active' ? 'bg-primary-green text-white' :
          status === 'inactive' ? 'bg-primary-red text-white' :
          'bg-gray-100 text-monday-text-secondary'
        }`}>
          {getStatusLabel(status)}
        </span>
      ),
    },
    {
      key: 'description',
      header: '描述',
      render: (value) => {
        const displayValue = value ? (value.length > 50 ? `${value.substring(0, 50)}...` : value) : '-';
        return (
          <span className="max-w-[300px] block truncate">
            {searchQuery && value ? highlightText(displayValue as string, searchQuery) : displayValue}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: '创建时间',
      render: (value) => value ? new Date(value).toLocaleDateString('zh-CN') : '-',
    },
    {
      key: 'actions',
      header: '操作',
      render: (_, product) => (
        <div className="flex gap-monday-2">
          <Button
            onClick={() => onEdit(product)}
            variant="secondary"
            size="sm"
            title="编辑"
            className="bg-primary-blue/10 border-primary-blue/30 text-primary-blue hover:bg-primary-blue/20 hover:border-primary-blue/50 hover:text-primary-blue font-medium shadow-monday-sm"
          >
            ✏️ 编辑
          </Button>
          <Button
            onClick={() => onDelete(product)}
            variant="ghost"
            size="sm"
            title="删除"
            className="bg-primary-red/10 text-primary-red hover:bg-primary-red/20 hover:text-primary-red font-medium border border-primary-red/20 hover:border-primary-red/40 shadow-monday-sm"
          >
            🗑️ 删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      <Table
        columns={columns}
        data={products}
        sortable={false}
        aria-label="产品列表"
        rowKey={(row) => row.id}
        onRowClick={onSelect}
      />
    </div>
  );
};

