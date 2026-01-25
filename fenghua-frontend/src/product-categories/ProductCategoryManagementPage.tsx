/**
 * Product Category Management Page
 * 
 * Main page for managing product categories
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useCallback } from 'react';
import { CategoryWithStats, categoriesService, CreateCategoryDto, UpdateCategoryDto } from './categories.service';
import { CategoryList } from './components/CategoryList';
import { CategoryForm } from './components/CategoryForm';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MainLayout } from '../components/layout';
import { getErrorMessage } from '../utils/error-handling';

type ViewMode = 'list' | 'create' | 'edit';

export const ProductCategoryManagementPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingCategory, setEditingCategory] = useState<CategoryWithStats | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ category: CategoryWithStats | null; show: boolean }>({
    category: null,
    show: false,
  });

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const cats = await categoriesService.getAll(true); // Include stats
      setCategories(cats as CategoryWithStats[]);
    } catch (err: unknown) {
      setError(getErrorMessage(err, '加载类别列表失败'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCreate = () => {
    setEditingCategory(null);
    setViewMode('create');
    setError(null);
    setSuccessMessage(null);
  };

  const handleEdit = (category: CategoryWithStats) => {
    setEditingCategory(category);
    setViewMode('edit');
    setError(null);
    setSuccessMessage(null);
  };

  const handleDelete = (category: CategoryWithStats) => {
    setDeleteConfirm({ category, show: true });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.category) return;

    try {
      await categoriesService.delete(deleteConfirm.category.id);
      setSuccessMessage('类别删除成功');
      setDeleteConfirm({ category: null, show: false });
      await loadCategories();
    } catch (err: unknown) {
      setError(getErrorMessage(err, '删除类别失败'));
      setDeleteConfirm({ category: null, show: false });
    }
  };

  const handleSubmit = async (data: CreateCategoryDto | UpdateCategoryDto) => {
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await categoriesService.update(editingCategory.id, data as UpdateCategoryDto);
        setSuccessMessage('类别更新成功');
      } else {
        await categoriesService.create(data as CreateCategoryDto);
        setSuccessMessage('类别创建成功');
      }
      setViewMode('list');
      setEditingCategory(null);
      await loadCategories();
    } catch (err: unknown) {
      setError(getErrorMessage(err, '操作失败'));
      throw err; // Re-throw to let form handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setEditingCategory(null);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <MainLayout title="">
      <div className="space-y-monday-4">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-semantic-success/10 border border-semantic-success text-semantic-success p-monday-3 rounded-monday-md" role="alert">
            {successMessage}
            <button onClick={() => setSuccessMessage(null)} className="float-right text-semantic-success hover:opacity-80 cursor-pointer transition-colors duration-200" aria-label="关闭">
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="bg-semantic-error/10 border border-semantic-error text-semantic-error p-monday-3 rounded-monday-md" role="alert">
            {error}
            <button onClick={() => setError(null)} className="float-right text-semantic-error hover:opacity-80 cursor-pointer transition-colors duration-200" aria-label="关闭">
              ×
            </button>
          </div>
        )}

        {viewMode === 'list' && (
          <>
            {/* Toolbar */}
            <Card variant="default" className="w-full">
              <div className="flex items-center justify-between">
                <h2 className="text-monday-2xl font-bold text-uipro-text tracking-tight font-uipro-heading">类别管理</h2>
                <Button onClick={handleCreate} variant="primary">
                  创建新类别
                </Button>
              </div>
            </Card>

            {/* Category List */}
            <Card variant="default" className="w-full">
              <CategoryList
                categories={categories}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loading={loading}
              />
            </Card>
          </>
        )}

        {(viewMode === 'create' || viewMode === 'edit') && (
          <Card variant="default" className="w-full">
            <h2 className="text-monday-2xl font-bold text-uipro-text mb-monday-6 tracking-tight font-uipro-heading">
              {editingCategory ? '编辑类别' : '创建新类别'}
            </h2>
            <CategoryForm
              category={editingCategory || undefined}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirm.show && deleteConfirm.category && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card variant="default" className="w-full max-w-md m-monday-4">
              <h3 className="text-monday-xl font-bold text-monday-text mb-monday-4">确认删除类别</h3>
              {deleteConfirm.category.productCount > 0 ? (
                <div className="bg-semantic-error/10 border border-semantic-error rounded-monday-md p-monday-4 mb-monday-4">
                  <p className="text-monday-sm text-semantic-error font-semibold mb-monday-2">
                    无法删除该类别
                  </p>
                  <p className="text-monday-sm text-monday-text">
                    该类别正在被 <strong>{deleteConfirm.category.productCount}</strong> 个产品使用。
                    请先删除或修改使用该类别的产品。
                  </p>
                </div>
              ) : (
                <p className="text-monday-sm text-monday-text mb-monday-4">
                  确定要删除类别 <strong>{deleteConfirm.category.name}</strong> 吗？此操作无法撤销。
                </p>
              )}
              <div className="flex justify-end gap-monday-3">
                <Button onClick={() => setDeleteConfirm({ category: null, show: false })} variant="outline" className="cursor-pointer transition-colors duration-200">
                  取消
                </Button>
                {deleteConfirm.category.productCount === 0 && (
                  <Button onClick={confirmDelete} variant="primary" className="!bg-semantic-error hover:!bg-semantic-error/90 cursor-pointer transition-colors duration-200">
                    确认删除
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

