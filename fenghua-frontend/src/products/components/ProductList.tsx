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
import { HomeModuleIcon } from '../../components/icons/HomeModuleIcons';
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
        <mark key={index} className="bg-yellow-200 text-uipro-text font-semibold px-monday-0.5 rounded">
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

  /** 19.3 main-business：加载用 skeleton，无 emoji */
  if (loading) {
    const colCount = userIsAdmin ? 7 : 6;
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

  if (products.length === 0) {
    if (searchQuery) {
      return (
        <div className="flex flex-col items-center justify-center py-monday-12 px-monday-4">
          <div className="text-center max-w-md">
            <h3 className="text-monday-lg font-semibold text-uipro-text mb-monday-2">未找到匹配的产品</h3>
            <p className="text-monday-sm text-uipro-secondary mb-monday-4">
              没有找到与 &quot;<span className="font-semibold text-uipro-text">{searchQuery}</span>&quot; 匹配的产品
            </p>
            <div className="bg-monday-surface rounded-monday-md p-monday-3 border border-gray-200">
              <p className="text-monday-xs font-semibold text-uipro-text mb-monday-1">搜索建议：</p>
              <ul className="text-monday-xs text-uipro-secondary space-y-monday-0.5 text-left list-disc list-inside">
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

    return (
      <div className="w-full">
        <div className="rounded-monday-lg overflow-hidden bg-monday-surface border border-gray-200">
          <div className="text-center p-monday-12">
            <h3 className="text-monday-lg font-semibold text-uipro-text mb-monday-2">暂无产品</h3>
            <p className="text-monday-sm text-uipro-secondary">点击「创建新产品」按钮添加第一个产品</p>
          </div>
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
      minWidth: '4.5rem',
      render: (status) => (
        <span className={`inline-block whitespace-nowrap px-monday-2 py-monday-1 rounded-monday-sm text-monday-xs font-medium transition-colors duration-200 ${
          status === 'active' ? 'bg-semantic-success/15 text-semantic-success' :
          status === 'inactive' ? 'bg-semantic-error/15 text-semantic-error' :
          'bg-uipro-secondary/15 text-uipro-secondary'
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
          {userIsAdmin && (
            <>
              {/* 19.7 AC2：与 UserList、CustomerList 统一：outline、uipro-cta/semantic-error、pencilSquare/trash 图标 */}
              <Button
                onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                variant="outline"
                size="sm"
                title="编辑"
                leftIcon={<HomeModuleIcon name="pencilSquare" className="w-4 h-4 flex-shrink-0" />}
                className="text-uipro-cta hover:bg-uipro-cta/10 cursor-pointer transition-colors duration-200"
              >
                编辑
              </Button>
              <Button
                onClick={(e) => { e.stopPropagation(); onDelete(product); }}
                variant="outline"
                size="sm"
                title="删除"
                leftIcon={<HomeModuleIcon name="trash" className="w-4 h-4 flex-shrink-0" />}
                className="text-semantic-error hover:bg-semantic-error/10 cursor-pointer transition-colors duration-200"
              >
                删除
              </Button>
            </>
          )}
          {!userIsAdmin && (
            <span className="text-monday-xs text-uipro-secondary">仅查看</span>
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
        striped
      />
    </div>
  );
};

