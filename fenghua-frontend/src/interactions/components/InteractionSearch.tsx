/**
 * Interaction Search Component
 * 
 * Advanced search component for interaction records with multi-select filtering
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { MultiSelect, MultiSelectOption } from '../../components/ui/MultiSelect';
import { CustomerSelect } from '../../customers/components/CustomerSelect';
import { ProductSelect } from '../../products/components/ProductSelect';
import { Customer, customersService } from '../../customers/customers.service';
import { Product, productsService } from '../../products/products.service';
import {
  InteractionSearchFilters,
  FrontendInteractionType,
  BackendInteractionType,
  InteractionStatus,
} from '../services/interactions.service';
import { getInteractionTypeLabel } from '../constants/interaction-types';
import { categoriesService, Category } from '../../product-categories/categories.service';
import { getUsers, User } from '../../users/users.service';
import { useQuery } from '@tanstack/react-query';

interface InteractionSearchProps {
  onSearch: (filters: InteractionSearchFilters) => void;
  initialFilters?: InteractionSearchFilters;
  /** 排序字段（由页面 toolbar 控制） */
  sortBy?: InteractionSearchFilters['sortBy'];
  /** 排序方向（由页面 toolbar 控制） */
  sortOrder?: 'asc' | 'desc';
  loading?: boolean;
  userRole?: string;
}

/**
 * Get all interaction type options
 */
const getInteractionTypeOptions = (): MultiSelectOption[] => {
  const frontendTypes = Object.values(FrontendInteractionType).map((type) => ({
    value: type,
    label: getInteractionTypeLabel(type),
  }));
  const backendTypes = Object.values(BackendInteractionType).map((type) => ({
    value: type,
    label: getInteractionTypeLabel(type),
  }));
  return [...frontendTypes, ...backendTypes];
};

/**
 * Get interaction status options
 */
const getStatusOptions = (): MultiSelectOption[] => {
  return Object.values(InteractionStatus).map((status) => ({
    value: status,
    label: {
      [InteractionStatus.IN_PROGRESS]: '进行中',
      [InteractionStatus.COMPLETED]: '已完成',
      [InteractionStatus.CANCELLED]: '已取消',
      [InteractionStatus.NEEDS_FOLLOW_UP]: '需要跟进',
    }[status] || status,
  }));
};

export const InteractionSearch: React.FC<InteractionSearchProps> = ({
  onSearch,
  initialFilters = {},
  sortBy = initialFilters.sortBy ?? '',
  sortOrder = initialFilters.sortOrder ?? '',
  loading = false,
  userRole,
}) => {
  const [interactionTypes, setInteractionTypes] = useState<string[]>(
    initialFilters.interactionTypes || []
  );
  const [statuses, setStatuses] = useState<string[]>(initialFilters.statuses || []);
  const [startDate, setStartDate] = useState(initialFilters.startDate || '');
  const [endDate, setEndDate] = useState(initialFilters.endDate || '');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<string[]>(initialFilters.categories || []);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onSearchRef = useRef(onSearch);

  // Load categories
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
  });

  // Load users for creator filter
  const { data: usersData = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  });

  // Keep onSearch ref up to date
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Load customer and product from initialFilters if provided
  useEffect(() => {
    if (initialFilters.customerId && initialFilters.customerId.trim()) {
      customersService
        .getCustomer(initialFilters.customerId)
        .then((customer) => {
          setSelectedCustomer(customer);
        })
        .catch((error) => {
          console.error('Failed to load customer from initialFilters', error);
          // Don't set customer if fetch fails
        });
    }
  }, [initialFilters.customerId]);

  useEffect(() => {
    if (initialFilters.productId && initialFilters.productId.trim()) {
      productsService
        .getProduct(initialFilters.productId)
        .then((product) => {
          setSelectedProduct(product);
        })
        .catch((error) => {
          console.error('Failed to load product from initialFilters', error);
          // Don't set product if fetch fails
        });
    }
  }, [initialFilters.productId]);

  useEffect(() => {
    if (initialFilters.createdBy && initialFilters.createdBy.trim() && usersData.length > 0) {
      const user = usersData.find((u) => u.id === initialFilters.createdBy);
      if (user) {
        setSelectedUser(user);
      }
    }
  }, [initialFilters.createdBy, usersData]);

  // Build search filters from current state
  const buildFilters = useCallback((): InteractionSearchFilters => {
    const filters: InteractionSearchFilters = {};

    if (interactionTypes.length > 0) {
      filters.interactionTypes = interactionTypes as any[];
    }
    if (statuses.length > 0) {
      filters.statuses = statuses as InteractionStatus[];
    }
    if (startDate && startDate.trim()) {
      filters.startDate = startDate;
    }
    if (endDate && endDate.trim()) {
      filters.endDate = endDate;
    }
    // Only include customerId if customer is selected and has valid ID
    if (selectedCustomer && selectedCustomer.id) {
      filters.customerId = selectedCustomer.id;
    }
    // Only include productId if product is selected and has valid ID
    if (selectedProduct && selectedProduct.id) {
      filters.productId = selectedProduct.id;
    }
    if (categories.length > 0) {
      filters.categories = categories;
    }
    // Only include createdBy if user is selected and has valid ID
    if (selectedUser && selectedUser.id) {
      filters.createdBy = selectedUser.id;
    }
    filters.sortBy = (sortBy && String(sortBy).trim()) ? (sortBy as InteractionSearchFilters['sortBy']) : undefined;
    filters.sortOrder = (sortOrder && String(sortOrder).trim()) ? (sortOrder as 'asc' | 'desc') : undefined;
    return filters;
  }, [
    interactionTypes,
    statuses,
    startDate,
    endDate,
    selectedCustomer,
    selectedProduct,
    categories,
    selectedUser,
    sortBy,
    sortOrder,
  ]);

  // Debounced search - trigger onSearch when filters change
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      onSearchRef.current(buildFilters());
    }, 500); // 500ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [buildFilters]);

  const handleClear = () => {
    setInteractionTypes([]);
    setStatuses([]);
    setStartDate('');
    setEndDate('');
    setSelectedCustomer(null);
    setSelectedProduct(null);
    setCategories([]);
    setSelectedUser(null);
    /* 排序 sortBy/sortOrder 由页面 toolbar 控制，清除筛选不重置 */
  };

  const hasActiveFilters =
    interactionTypes.length > 0 ||
    statuses.length > 0 ||
    startDate ||
    endDate ||
    selectedCustomer ||
    selectedProduct ||
    categories.length > 0 ||
    selectedUser;

  // Category options
  const categoryOptions: MultiSelectOption[] = categoriesData.map((cat: Category) => ({
    value: cat.name,
    label: cat.name,
  }));

  // User options for creator filter
  const userOptions: MultiSelectOption[] = usersData.map((user: User) => ({
    value: user.id,
    label: user.email,
  }));

  return (
    <div className="space-y-monday-3">
      {/* 8 个搜索条件：两行排布（每行 4 个），排序已移至页面 toolbar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-monday-3">
        {/* Interaction Types Multi-Select */}
        <div>
          <MultiSelect
            options={getInteractionTypeOptions()}
            selectedValues={interactionTypes}
            onChange={setInteractionTypes}
            placeholder="选择互动类型..."
            label="互动类型"
            disabled={loading}
          />
        </div>

        {/* Statuses Multi-Select */}
        <div>
          <MultiSelect
            options={getStatusOptions()}
            selectedValues={statuses}
            onChange={setStatuses}
            placeholder="选择状态..."
            label="状态"
            disabled={loading}
          />
        </div>

        {/* Categories Multi-Select */}
        <div>
          <MultiSelect
            options={categoryOptions}
            selectedValues={categories}
            onChange={setCategories}
            placeholder="选择产品类别..."
            label="产品类别"
            disabled={loading}
          />
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
            开始日期
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={loading}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
            结束日期
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={loading}
            className="w-full"
          />
        </div>

        {/* Customer Select */}
        <div>
          <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
            客户
          </label>
          <CustomerSelect
            selectedCustomer={selectedCustomer}
            onChange={setSelectedCustomer}
            userRole={userRole}
            placeholder="选择客户..."
            disabled={loading}
          />
        </div>

        {/* Product Select */}
        <div>
          <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
            产品
          </label>
          <ProductSelect
            selectedProduct={selectedProduct}
            onChange={setSelectedProduct}
            placeholder="选择产品..."
            disabled={loading}
          />
        </div>

        {/* Creator Select (simplified - using MultiSelect for now) */}
        <div>
          <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
            创建者
          </label>
          <MultiSelect
            options={userOptions}
            selectedValues={selectedUser ? [selectedUser.id] : []}
            onChange={(values) => {
              if (values.length > 0) {
                const user = usersData.find((u) => u.id === values[0]);
                setSelectedUser(user || null);
              } else {
                setSelectedUser(null);
              }
            }}
            placeholder="选择创建者..."
            disabled={loading}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-monday-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={loading}
            className="text-monday-text-secondary hover:text-monday-text"
          >
            清除所有筛选
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-monday-2 text-monday-sm text-monday-text-secondary">
          <span className="animate-spin">⏳</span>
          <span>正在搜索...</span>
        </div>
      )}
    </div>
  );
};

