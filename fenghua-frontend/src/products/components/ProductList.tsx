/**
 * Product List Component
 * 
 * Displays a list of products in a table
 * All custom code is proprietary and not open source.
 */

import { Product } from '../products.service';
import { Table, Column } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../auth/AuthContext';
import { isAdmin } from '../../common/constants/roles';
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
        <mark key={index} className="bg-yellow-200 text-linear-text font-semibold px-linear-0.5 rounded">
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
  const { user } = useAuth();
  const userIsAdmin = isAdmin(user?.role);

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
      <div className="text-center p-linear-12 text-linear-text-secondary text-linear-base">加载中...</div>
    );
  }

  if (products.length === 0) {
    // Show empty state with search suggestions if searching
    if (searchQuery) {
      return (
        <div className="flex flex-col items-center justify-center py-linear-12 px-linear-4">
          <div className="text-center max-w-md">
            <div className="text-linear-4xl mb-linear-4 opacity-50">
              🔍
            </div>
            <h3 className="text-linear-lg font-semibold text-linear-text mb-linear-2">
              未找到匹配的产品
            </h3>
            <p className="text-linear-sm text-linear-text-secondary mb-linear-4">
              没有找到与 "<span className="font-semibold text-linear-text">{searchQuery}</span>" 匹配的产品
            </p>
            <div className="bg-linear-surface rounded-linear-md p-linear-3">
              <p className="text-linear-xs font-semibold text-linear-text mb-linear-1">
                💡 搜索建议：
              </p>
              <ul className="text-linear-xs text-linear-text-secondary space-y-linear-0.5 text-left list-disc list-inside">
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
        <div className="rounded-linear-lg overflow-hidden bg-linear-surface border border-gray-200">
          <table className="w-full" aria-label="产品列表（空）">
            <thead>
              <tr className="bg-linear-surface border-b border-gray-200">
                {['产品名称', 'HS编码', '类别', '状态', '描述', '创建时间', ...(userIsAdmin ? ['操作'] : [])].map((header) => (
                  <th key={header} className="p-linear-2 px-linear-4 text-left text-linear-sm font-semibold text-linear-text">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={userIsAdmin ? 7 : 6} className="p-linear-12 text-center text-linear-text-secondary">
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
        <span className={`px-linear-2 py-linear-1 rounded-linear-sm text-linear-xs font-medium ${
          status === 'active' ? 'bg-primary-green text-white' :
          status === 'inactive' ? 'bg-primary-red text-white' :
          'bg-gray-100 text-linear-text-secondary'
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
        <div className="flex gap-linear-2">
          {userIsAdmin && (
            <>
              <Button
                onClick={() => onEdit(product)}
                variant="secondary"
                size="sm"
                title="编辑"
                className="bg-primary-blue/10 border-primary-blue/30 text-primary-blue hover:bg-primary-blue/20 hover:border-primary-blue/50 hover:text-primary-blue font-medium shadow-linear-sm"
              >
                ✏️ 编辑
              </Button>
              <Button
                onClick={() => onDelete(product)}
                variant="ghost"
                size="sm"
                title="删除"
                className="bg-primary-red/10 text-primary-red hover:bg-primary-red/20 hover:text-primary-red font-medium border border-primary-red/20 hover:border-primary-red/40 shadow-linear-sm"
              >
                🗑️ 删除
              </Button>
            </>
          )}
          {!userIsAdmin && (
            <span className="text-linear-xs text-linear-text-placeholder">仅查看</span>
          )}
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

