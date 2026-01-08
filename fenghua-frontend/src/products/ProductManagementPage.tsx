/**
 * Product Management Page
 * 
 * Main page for managing products
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  Product,
  productsService,
  CreateProductDto,
  UpdateProductDto,
  ProductQueryParams,
} from './products.service';
import { Category, categoriesService } from '../product-categories/categories.service';
import { ProductList } from './components/ProductList';
import { ProductCreateForm } from './components/ProductCreateForm';
import { ProductEditForm } from './components/ProductEditForm';
import { ProductDetailPanel } from './components/ProductDetailPanel';
import { isAdmin, isDirector, isFrontendSpecialist, isBackendSpecialist } from '../common/constants/roles';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MainLayout } from '../components/layout';
import { Input } from '../components/ui/Input';
import { Link } from 'react-router-dom';
// import './ProductManagementPage.css'; // Removed

type ViewMode = 'list' | 'create' | 'edit';

export const ProductManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductQueryParams>({
    limit: 20,
    offset: 0,
    includeInactive: false, // Default: don't show inactive products
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoSelectedProduct = useRef(false);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await categoriesService.getAll();
        setCategories(cats);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productsService.getProducts(filters);
      setProducts(response.products);
      setTotal(response.total);
    } catch (err: unknown) {
      setError(err.message || '加载产品列表失败');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Auto-select product from URL query parameter
  useEffect(() => {
    const productIdFromUrl = searchParams.get('productId');
    
    // Only auto-select if:
    // 1. There's a productId in URL
    // 2. Products are loaded (or loading is complete)
    // 3. We haven't already auto-selected (to avoid re-selecting on re-renders)
    // 4. No product is currently selected
    if (
      productIdFromUrl &&
      !loading &&
      !hasAutoSelectedProduct.current &&
      !selectedProduct
    ) {
      // First, try to find the product in the current list
      let productToSelect = products.find(p => p.id === productIdFromUrl);
      
      // If product is not in current list, load it separately
      if (!productToSelect) {
        productsService.getProduct(productIdFromUrl)
          .then((product) => {
            setSelectedProduct(product);
            setShowDetailPanel(true);
            hasAutoSelectedProduct.current = true;
            
            // Remove productId from URL to clean it up
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('productId');
            setSearchParams(newSearchParams, { replace: true });
          })
          .catch((err) => {
            console.error('Failed to load product:', err);
            // Remove invalid productId from URL
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('productId');
            setSearchParams(newSearchParams, { replace: true });
          });
      } else {
        // Product found in current list, select it
        setSelectedProduct(productToSelect);
        setShowDetailPanel(true);
        hasAutoSelectedProduct.current = true;
        
        // Remove productId from URL to clean it up
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('productId');
        setSearchParams(newSearchParams, { replace: true });
      }
    }
    
    // Reset the flag when productId changes or products change
    if (!productIdFromUrl) {
      hasAutoSelectedProduct.current = false;
    }
  }, [searchParams, loading, products, selectedProduct, setSearchParams]);

  // Debounced search
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        setFilters(prev => ({
          ...prev,
          search: searchQuery.trim(),
          offset: 0, // Reset to first page on search
        }));
        setCurrentPage(1);
      }, 500); // 500ms debounce
    } else {
      // Clear search if query is empty
      setFilters(prev => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { search, ...rest } = prev;
        return { ...rest, offset: 0 };
      });
      setCurrentPage(1);
    }

    // Cleanup on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleCreate = () => {
    setEditingProduct(null);
    setViewMode('create');
    setError(null);
    setSuccessMessage(null);
  };

  const handleSelect = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailPanel(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setSelectedProduct(null);
    setShowDetailPanel(false);
    setViewMode('edit');
    setError(null);
    setSuccessMessage(null);
  };

  const handleCloseDetailPanel = () => {
    setShowDetailPanel(false);
    setSelectedProduct(null);
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ product: Product | null; show: boolean }>({
    product: null,
    show: false,
  });

  const handleDelete = async (product: Product) => {
    setDeleteConfirm({ product, show: true });
    // Close detail panel when delete is triggered
    setShowDetailPanel(false);
    setSelectedProduct(null);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.product) return;

    try {
      await productsService.deleteProduct(deleteConfirm.product.id);
      setSuccessMessage('产品删除成功');
      setDeleteConfirm({ product: null, show: false });
      await loadProducts();
    } catch (err: unknown) {
      setError(err.message || '删除产品失败');
      setDeleteConfirm({ product: null, show: false });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ product: null, show: false });
  };

  const handleSubmit = async (data: CreateProductDto | UpdateProductDto) => {
    try {
      setError(null);
      if (viewMode === 'create') {
        // Note: ProductCreateForm already creates the product and associations
        // This callback is called after creation for consistency
        // We don't create the product again here to avoid duplicate creation
        setSuccessMessage('产品创建成功');
      } else {
        if (!editingProduct) return;
        await productsService.updateProduct(editingProduct.id, data);
        setSuccessMessage('产品更新成功');
      }
      setViewMode('list');
      setSelectedProduct(null);
      setShowDetailPanel(false);
      await loadProducts();
    } catch (err: unknown) {
      setError(err.message || '操作失败');
      throw err;
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setEditingProduct(null);
    setSelectedProduct(null);
    setShowDetailPanel(false);
    setError(null);
    setSuccessMessage(null);
  };


  const handleFilterChange = (key: keyof ProductQueryParams, value: ProductQueryParams[keyof ProductQueryParams]) => {
    setFilters((prev) => ({ ...prev, [key]: value, offset: 0 }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    const limit = filters.limit || 20;
    setFilters((prev) => ({ ...prev, offset: (page - 1) * limit }));
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(total / (filters.limit || 20));

  // Check user permissions
  const userIsAdmin = isAdmin(currentUser?.role);
  const userIsDirector = isDirector(currentUser?.role);
  const userIsFrontendSpecialist = isFrontendSpecialist(currentUser?.role);
  const userIsBackendSpecialist = isBackendSpecialist(currentUser?.role);

  // Allow access to admin, director, frontend specialist, and backend specialist
  // Frontend specialists need to view products for buyer associations
  // Backend specialists need to view products for supplier associations
  const canAccessProducts = userIsAdmin || userIsDirector || userIsFrontendSpecialist || userIsBackendSpecialist;

  if (!canAccessProducts) {
    return (
      <MainLayout title="产品管理">
        <Card variant="default" className="p-monday-8 text-center">
          <p className="text-semantic-error text-monday-lg">您没有权限访问此页面</p>
        </Card>
      </MainLayout>
    );
  }

  // Toolbar component - Monday.com style, all in one line, wrapped in card
  const toolbar = viewMode === 'list' ? (
    <Card variant="default" className="w-full p-monday-4">
      <div className="flex items-center gap-monday-3 flex-nowrap">
        <Input
          type="text"
          placeholder="搜索产品名称或HS编码..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64 min-w-[200px]"
        />
        <select
          value={filters.category || ''}
          onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
          className="px-monday-3 py-monday-2 text-monday-sm text-monday-text bg-monday-surface border border-gray-200 rounded-monday-md focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-colors font-semibold"
        >
          <option value="">所有类别</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={filters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
          className="px-monday-3 py-monday-2 text-monday-sm text-monday-text bg-monday-surface border border-gray-200 rounded-monday-md focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-colors font-semibold"
        >
          <option value="">所有状态</option>
          <option value="active">活跃</option>
          <option value="inactive">已停用</option>
          <option value="archived">已归档</option>
        </select>
        <Link to="/product-categories">
          <Button 
            variant="outline" 
            size="md"
            className="bg-gradient-to-r from-primary-purple/10 to-primary-blue/10 border-primary-purple/30 text-primary-purple hover:from-primary-purple/20 hover:to-primary-blue/20 hover:border-primary-purple/50 hover:text-primary-purple font-medium shadow-monday-sm"
          >
            <span className="mr-monday-2">🏷️</span>
            类别管理
          </Button>
        </Link>
        {userIsAdmin && (
          <Button 
            variant="primary" 
            size="md" 
            onClick={handleCreate}
            className="bg-gradient-to-r from-primary-blue to-primary-blue-hover hover:from-primary-blue-hover hover:to-primary-blue shadow-monday-md hover:shadow-monday-lg font-semibold"
          >
            <span className="mr-monday-2">✨</span>
            创建新产品
          </Button>
        )}
      </div>
    </Card>
  ) : null;


  return (
    <MainLayout
      title=""
      detailPanel={
        selectedProduct ? (
          <ProductDetailPanel
            product={selectedProduct}
            onEdit={userIsAdmin ? handleEdit : undefined}
            onDelete={userIsAdmin ? handleDelete : undefined}
          />
        ) : undefined
      }
      showDetailPanel={showDetailPanel && viewMode === 'list'}
      onCloseDetailPanel={handleCloseDetailPanel}
    >
      {viewMode === 'list' ? (
        <div className="space-y-monday-4">
          {/* Toolbar Card */}
          {toolbar}

          {/* Product List Card */}
          <Card variant="default" className="w-full">
            {successMessage && (
              <div className="mb-monday-4 p-monday-4 bg-primary-green/20 border border-primary-green rounded-monday-md text-primary-green text-monday-sm" role="alert">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="mb-monday-4 p-monday-4 bg-primary-red/20 border border-primary-red rounded-monday-md text-primary-red text-monday-sm" role="alert">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center p-monday-8 text-monday-text-secondary">加载中...</div>
            ) : (
              <>
                <h2 className="text-monday-2xl font-bold text-monday-text mb-monday-6 tracking-tight">产品列表</h2>
          <ProductList
            products={products}
            onEdit={userIsAdmin ? handleEdit : () => {}}
            onDelete={userIsAdmin ? handleDelete : () => {}}
            onSelect={handleSelect}
            loading={loading}
            searchQuery={filters.search}
          />
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-monday-4 mt-monday-6 pt-monday-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      上一页
                    </Button>
                    <span className="text-monday-base text-monday-text">
                      第 {currentPage} 页，共 {totalPages} 页（共 {total} 条）
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      下一页
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      ) : (
        <Card variant="default" className="max-w-3xl mx-auto">
          <h2 className="text-monday-2xl font-semibold text-monday-text mb-monday-6">{viewMode === 'create' ? '创建新产品' : '编辑产品'}</h2>
          {viewMode === 'create' ? (
            <ProductCreateForm
              onSubmit={handleSubmit as (data: CreateProductDto) => Promise<void>}
              onCancel={handleCancel}
            />
          ) : editingProduct ? (
            <ProductEditForm
              product={editingProduct}
              onSubmit={handleSubmit as (data: UpdateProductDto) => Promise<void>}
              onCancel={handleCancel}
            />
          ) : null}
        </Card>
      )}

      {deleteConfirm.show && deleteConfirm.product && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-monday-4 z-50" 
          onClick={cancelDelete}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              cancelDelete();
            }
          }}
          role="presentation"
          tabIndex={-1}
        >
          <Card variant="elevated" className="max-w-md w-full" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
            <h3 id="delete-confirm-title" className="text-monday-xl font-semibold text-monday-text mb-monday-4">确认删除</h3>
            <p className="text-monday-base text-monday-text mb-monday-6">
              确定要删除产品 <strong>{deleteConfirm.product.name}</strong> 吗？此操作无法撤销。
            </p>
            <div className="flex justify-end gap-monday-3">
              <Button onClick={cancelDelete} variant="outline">
                取消
              </Button>
              <Button onClick={confirmDelete} variant="primary">
                确认删除
              </Button>
            </div>
          </Card>
        </div>
      )}
    </MainLayout>
  );
};

