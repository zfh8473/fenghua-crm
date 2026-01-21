/**
 * Customer Management Page
 * 
 * Main page for customer management with role-based filtering
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { customersService, Customer, CreateCustomerDto, UpdateCustomerDto, CustomerQueryParams } from './customers.service';
import { CustomerList } from './components/CustomerList';
import { CustomerCreateForm } from './components/CustomerCreateForm';
import { CustomerEditForm } from './components/CustomerEditForm';
import { CustomerSearch, CustomerSearchFilters } from './components/CustomerSearch';
import { CustomerSearchResults } from './components/CustomerSearchResults';
import { CustomerDetailPanel } from './components/CustomerDetailPanel';
import { MainLayout } from '../components/layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { isFrontendSpecialist, isBackendSpecialist, isDirector, isAdmin } from '../common/constants/roles';
import { getErrorMessage } from '../utils/error-handling';

type ViewMode = 'list' | 'create' | 'edit';

export const CustomerManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasAutoSelectedCustomer = useRef(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<CustomerQueryParams>({
    limit: 20,
    offset: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchFilters, setSearchFilters] = useState<CustomerSearchFilters>({});
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; customer: Customer | null }>({
    show: false,
    customer: null,
  });
  /** 用于忽略过期请求：只有最新一次 loadData 的结果会更新 error/loading/列表，避免 401/400 覆盖已成功的列表 */
  const loadIdRef = useRef(0);

  // Unified data loading function
  const loadData = useCallback(async () => {
    const myId = ++loadIdRef.current;
    try {
      setLoading(true);
      setError(null);

      let queryParams: CustomerQueryParams;

      if (isSearchMode) {
        queryParams = {
          limit: 20,
          offset: (searchPage - 1) * 20,
          search: searchFilters.search,
          customerType: searchFilters.customerType,
        };
      } else {
        queryParams = { ...filters };
      }

      const response = await customersService.getCustomers(queryParams);
      if (myId !== loadIdRef.current) return;
      setCustomers(response.customers);
      setTotal(response.total);
      setError(null);
    } catch (err: unknown) {
      if (myId !== loadIdRef.current) return;
      setError(getErrorMessage(err) || (isSearchMode ? '搜索失败' : '加载客户列表失败'));
    } finally {
      if (myId === loadIdRef.current) setLoading(false);
    }
  }, [filters, isSearchMode, searchFilters, searchPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-select customer from URL query parameter
  useEffect(() => {
    const customerIdFromUrl = searchParams.get('customerId');
    
    // Only auto-select if:
    // 1. There's a customerId in URL
    // 2. Customers are loaded (or loading is complete)
    // 3. We haven't already auto-selected (to avoid re-selecting on re-renders)
    // 4. No customer is currently selected
    if (
      customerIdFromUrl &&
      !loading &&
      !hasAutoSelectedCustomer.current &&
      !selectedCustomer
    ) {
      // First, try to find the customer in the current list
      let customerToSelect = customers.find(c => c.id === customerIdFromUrl);
      
      // If customer is not in current list, load it separately
      if (!customerToSelect) {
        customersService.getCustomer(customerIdFromUrl)
          .then((customer) => {
            setSelectedCustomer(customer);
            setShowDetailPanel(true);
            hasAutoSelectedCustomer.current = true;
            
            // Remove customerId from URL to clean it up
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('customerId');
            setSearchParams(newSearchParams, { replace: true });
          })
          .catch((err) => {
            console.error('Failed to load customer:', err);
            // Remove invalid customerId from URL
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('customerId');
            setSearchParams(newSearchParams, { replace: true });
          });
      } else {
        // Customer found in current list, select it
        setSelectedCustomer(customerToSelect);
        setShowDetailPanel(true);
        hasAutoSelectedCustomer.current = true;
        
        // Remove customerId from URL to clean it up
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('customerId');
        setSearchParams(newSearchParams, { replace: true });
      }
    }
    
    // Reset the flag when customerId changes or customers change
    if (customerIdFromUrl !== searchParams.get('customerId')) {
      hasAutoSelectedCustomer.current = false;
    }
  }, [searchParams, customers, loading, selectedCustomer, setSearchParams]);

  // Handle search
  const handleSearch = useCallback((filters: CustomerSearchFilters) => {
    const isSearching = !!(filters.search || filters.customerType);
    
    setSearchFilters(filters);
    setIsSearchMode(isSearching);
    setSearchPage(1);
    
    if (isSearching) {
      // Search mode: update search filters only, don't update main filters
      // loadData will use searchFilters when isSearchMode is true
    } else {
      // Clear search: reset to normal list mode
      setFilters({ limit: 20, offset: 0 });
      setCurrentPage(1);
    }
  }, []);

  const handleCreate = () => {
    setViewMode('create');
    setError(null);
    setSuccessMessage(null);
  };

  const handleSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailPanel(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setSelectedCustomer(null);
    setShowDetailPanel(false);
    setViewMode('edit');
    setError(null);
    setSuccessMessage(null);
  };

  const handleDelete = (customer: Customer) => {
    setDeleteConfirm({ show: true, customer });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, customer: null });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.customer) return;

    try {
      await customersService.deleteCustomer(deleteConfirm.customer.id);
      setSuccessMessage(`客户 "${deleteConfirm.customer.name}" 删除成功`);
      setDeleteConfirm({ show: false, customer: null });
      await loadData();
    } catch (err: unknown) {
      setError((err as Error).message || '删除客户失败');
      setDeleteConfirm({ show: false, customer: null });
    }
  };

  const handleSubmit = async (data: CreateCustomerDto | UpdateCustomerDto) => {
    try {
      setError(null);
      if (viewMode === 'create') {
        // Note: CustomerCreateForm already creates the customer and associations
        // This callback is called after creation for consistency
        // We don't create the customer again here to avoid duplicate creation
        setSuccessMessage('客户创建成功');
      } else {
        if (!editingCustomer) return;
        await customersService.updateCustomer(editingCustomer.id, data as UpdateCustomerDto);
        setSuccessMessage('客户更新成功');
      }
      setViewMode('list');
      setSelectedCustomer(null);
      setShowDetailPanel(false);
      await loadData();
    } catch (err: unknown) {
      setError((err as Error).message || `${viewMode === 'create' ? '创建' : '更新'}客户失败`);
      throw err;
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setEditingCustomer(null);
    setError(null);
    setSuccessMessage(null);
  };

  const handleFilterChange = (key: keyof CustomerQueryParams, value: CustomerQueryParams[keyof CustomerQueryParams]) => {
    setFilters((prev) => ({ ...prev, [key]: value, offset: 0 }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (isSearchMode) {
      setSearchPage(page);
    } else {
      const limit = filters.limit || 20;
      setFilters((prev) => ({ ...prev, offset: (page - 1) * limit }));
      setCurrentPage(page);
    }
  };

  const handleSearchPageChange = (page: number) => {
    setSearchPage(page);
  };

  const handleCustomerClick = (customer: Customer) => {
    handleSelect(customer);
  };

  const handleCloseDetailPanel = () => {
    setShowDetailPanel(false);
    setSelectedCustomer(null);
  };

  const totalPages = Math.ceil(total / (filters.limit || 20));

  // Get button text based on user role
  const getCreateButtonText = () => {
    if (isFrontendSpecialist(currentUser?.role)) return '创建新采购商';
    if (isBackendSpecialist(currentUser?.role)) return '创建新供应商';
    return '创建新客户';
  };

  // Check if user can see customer type filter (Director/Admin only)
  const canFilterByType = isDirector(currentUser?.role) || isAdmin(currentUser?.role);
  
  // Toolbar component
  const toolbar = viewMode === 'list' ? (
    <Card variant="default" className="w-full p-monday-4">
      <div className="flex items-center gap-monday-3 flex-wrap">
        <div className="flex-1 min-w-[300px]">
          <CustomerSearch
            onSearch={handleSearch}
            initialFilters={searchFilters}
            loading={loading}
            userRole={currentUser?.role}
          />
        </div>
        <div className="flex items-center gap-monday-3 flex-shrink-0">
          {(isAdmin(currentUser?.role) || isDirector(currentUser?.role)) && (
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/customers/import')}
              className="!bg-uipro-cta hover:!bg-uipro-cta/90 font-semibold whitespace-nowrap cursor-pointer transition-colors duration-200"
            >
              批量导入
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={handleCreate}
            className="!bg-uipro-cta hover:!bg-uipro-cta/90 font-semibold whitespace-nowrap cursor-pointer transition-colors duration-200"
          >
            {getCreateButtonText()}
          </Button>
        </div>
      </div>
    </Card>
  ) : null;

  return (
    <MainLayout 
      title="客户管理"
      detailPanel={
        selectedCustomer ? (
          <CustomerDetailPanel
            customer={selectedCustomer}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : undefined
      }
      detailPanelTitle="客户详情"
      showDetailPanel={showDetailPanel && viewMode === 'list'}
      onCloseDetailPanel={handleCloseDetailPanel}
    >
      {viewMode === 'list' ? (
        <div className="space-y-monday-4">
          {/* Toolbar Card */}
          {toolbar}

          {/* Customer List Card */}
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

            {isSearchMode ? (
              <>
                <h2 className="text-monday-2xl font-bold text-uipro-text mb-monday-6 tracking-tight font-uipro-heading">搜索结果</h2>
                {customers.length === 0 ? (
                  <div className="text-center p-monday-12">
                    <p className="text-monday-lg font-semibold text-uipro-text mb-monday-2">未找到匹配的客户</p>
                    <p className="text-monday-sm text-uipro-secondary">尝试使用不同的搜索关键词</p>
                  </div>
                ) : (
                  <CustomerSearchResults
                    customers={customers}
                    searchQuery={searchFilters.search}
                    total={total}
                    currentPage={searchPage}
                    pageSize={20}
                    onPageChange={handleSearchPageChange}
                    onCustomerClick={handleCustomerClick}
                    loading={loading}
                  />
                )}
              </>
            ) : (
              <>
                <h2 className="text-monday-2xl font-bold text-uipro-text mb-monday-6 tracking-tight font-uipro-heading">客户列表</h2>
                <CustomerList
                  customers={customers}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSelect={handleSelect}
                  loading={loading}
                />
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-monday-4 mt-monday-6 pt-monday-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="cursor-pointer transition-colors duration-200"
                    >
                      上一页
                    </Button>
                    <span className="text-monday-base text-uipro-text">
                      第 {currentPage} 页，共 {totalPages} 页（共 {total} 条）
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="cursor-pointer transition-colors duration-200"
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
          <h2 className="text-monday-2xl font-semibold text-monday-text mb-monday-6">
            {viewMode === 'create' ? '创建新客户' : '编辑客户'}
          </h2>
          {viewMode === 'create' ? (
            <CustomerCreateForm
              onSubmit={handleSubmit as (data: CreateCustomerDto) => Promise<void>}
              onCancel={handleCancel}
            />
          ) : editingCustomer ? (
            <CustomerEditForm
              customer={editingCustomer}
              onSubmit={handleSubmit as (data: UpdateCustomerDto) => Promise<void>}
              onCancel={handleCancel}
            />
          ) : null}
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && deleteConfirm.customer && (
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
              确定要删除客户 <strong>{deleteConfirm.customer.name}</strong> 吗？
              {deleteConfirm.customer.customerType === 'BUYER' ? '（采购商）' : '（供应商）'}
            </p>
            <p className="text-monday-sm text-monday-text-secondary mb-monday-6">
              如果客户有关联的互动记录，将执行软删除以保留历史数据。
            </p>
            <div className="flex justify-end gap-monday-3">
              <Button onClick={cancelDelete} variant="outline">
                取消
              </Button>
              <Button onClick={confirmDelete} variant="primary" className="bg-red-600 hover:bg-red-700">
                确认删除
              </Button>
            </div>
          </Card>
        </div>
      )}
    </MainLayout>
  );
};

