/**
 * Category List Component
 * 
 * Displays a list of product categories with usage statistics
 * All custom code is proprietary and not open source.
 */

import { CategoryWithStats } from '../categories.service';
import { Button } from '../../components/ui/Button';

interface CategoryListProps {
  categories: CategoryWithStats[];
  onEdit: (category: CategoryWithStats) => void;
  onDelete: (category: CategoryWithStats) => void;
  loading?: boolean;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  onEdit,
  onDelete,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="p-monday-6 text-center text-monday-text-secondary">
        加载中...
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-monday-bg border-b border-gray-200">
              <th className="p-monday-3 text-left text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">
                类别名称
              </th>
              <th className="p-monday-3 text-left text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">
                HS编码
              </th>
              <th className="p-monday-3 text-left text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">
                使用统计
              </th>
              <th className="p-monday-3 text-left text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">
                描述
              </th>
              <th className="p-monday-3 text-left text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-monday-6 text-center text-monday-text-secondary text-monday-sm">
                  暂无类别
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr
                  key={category.id}
                  className="border-b border-gray-200 hover:bg-monday-bg transition-colors duration-150"
                >
                  <td className="p-monday-3 text-monday-sm text-monday-text font-medium">
                    {category.name}
                  </td>
                  <td className="p-monday-3 text-monday-sm text-monday-text font-mono">
                    {category.hsCode}
                  </td>
                  <td className="p-monday-3 text-monday-sm">
                    {category.productCount > 0 ? (
                      <span className="text-uipro-cta font-medium">
                        {category.productCount} 个产品
                      </span>
                    ) : (
                      <span className="text-monday-text-placeholder">
                        未使用
                      </span>
                    )}
                  </td>
                  <td className="p-monday-3 text-monday-sm text-monday-text-secondary">
                    {category.description || '-'}
                  </td>
                  <td className="p-monday-3">
                    <div className="flex items-center gap-monday-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onEdit(category)}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(category)}
                        disabled={category.productCount > 0}
                      >
                        删除
                      </Button>
                      {category.productCount > 0 && (
                        <span className="text-monday-xs text-monday-text-secondary ml-monday-2">
                          (无法删除，正在使用)
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

