/**
 * Product Create Form Component
 * 
 * Form for creating a new product
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateProductDto, productsService } from '../products.service';
import { Category, categoriesService } from '../../product-categories/categories.service';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { SpecificationsTable } from '../../components/SpecificationsTable';
import { HsCodeSelect } from '../../components/ui/HsCodeSelect';
import { CustomerMultiSelect } from '../../customers/components/CustomerMultiSelect';
import { Customer } from '../../customers/customers.service';
import { useAuth } from '../../auth/AuthContext';
import { toast } from 'react-toastify';
import {
  PRODUCT_CREATE_SUCCESS,
  PRODUCT_CREATE_WITH_ASSOCIATIONS_SUCCESS,
  PRODUCT_CREATE_ASSOCIATIONS_PARTIAL_FAILURE,
  PRODUCT_CREATE_ASSOCIATIONS_ALL_FAILURE,
  MANAGE_ASSOCIATIONS_IN_DETAIL,
} from '../../common/constants/error-messages';
import { AssociationType } from '../types/association-types';
// import './ProductCreateForm.css'; // Removed

interface ProductCreateFormProps {
  onSubmit: (data: CreateProductDto) => Promise<void>;
  onCancel: () => void;
}

export const ProductCreateForm: React.FC<ProductCreateFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<CreateProductDto>({
    name: '',
    hsCode: '',
    category: '',
    description: '',
    specifications: undefined,
    imageUrl: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [hsCodeLookupTimeout, setHsCodeLookupTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  
  // Association state
  const [isAssociationExpanded, setIsAssociationExpanded] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);

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

  // Select category → Auto-fill HS code (synchronous)
  const handleCategoryChange = useCallback((categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    if (category) {
      setFormData(prev => ({
        ...prev,
        category: category.name,
        hsCode: category.hsCode, // Auto-sync
      }));
      // Clear errors
      if (errors.hsCode) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.hsCode;
          return newErrors;
        });
      }
    }
  }, [categories, errors.hsCode]);

  // Select HS code → Auto-find category
  const handleHsCodeSelect = useCallback((category: Category) => {
    setFormData(prev => ({
      ...prev,
      category: category.name, // Auto-sync
      hsCode: category.hsCode,
    }));
    // Clear errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.hsCode;
      delete newErrors.category;
      return newErrors;
    });
  }, []);

  // Handle HS code input change (when user types directly)
  const handleHsCodeChange = useCallback((hsCode: string) => {
    setFormData(prev => ({ ...prev, hsCode }));
    
    // Clear previous timeout
    if (hsCodeLookupTimeout) {
      clearTimeout(hsCodeLookupTimeout);
    }

    // Validate format first
    if (!hsCode || !/^[0-9]{6,10}(-[0-9]{2,4})*$/.test(hsCode)) {
      // Clear category if format is invalid
      if (hsCode.length > 0) {
        setFormData(prev => ({ ...prev, category: '' }));
      }
      return;
    }

    // Debounced lookup for manually entered HS codes
    const timeout = setTimeout(async () => {
      setSyncInProgress(true);
      try {
        const category = await categoriesService.getByHsCode(hsCode);
        if (category) {
          setFormData(prev => ({
            ...prev,
            category: category.name,
            hsCode: category.hsCode,
          }));
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.hsCode;
            delete newErrors.category;
            return newErrors;
          });
        } else {
          setFormData(prev => ({ ...prev, category: '' }));
          setErrors(prev => ({
            ...prev,
            hsCode: '该HS编码未绑定任何产品类别，请先创建对应的类别',
          }));
        }
      } catch (error) {
        console.error('Failed to lookup category by HS code:', error);
        setErrors(prev => ({
          ...prev,
          hsCode: '查询类别失败，请稍后重试',
        }));
      } finally {
        setSyncInProgress(false);
      }
    }, 500);

    setHsCodeLookupTimeout(timeout);
  }, [hsCodeLookupTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hsCodeLookupTimeout) {
        clearTimeout(hsCodeLookupTimeout);
      }
    };
  }, [hsCodeLookupTimeout]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const trimmedName = formData.name?.trim() || '';
    if (trimmedName.length === 0) {
      newErrors.name = '产品名称不能为空';
    } else if (trimmedName.length > 255) {
      newErrors.name = '产品名称长度不能超过255个字符';
    }

    const trimmedHsCode = formData.hsCode?.trim() || '';
    if (trimmedHsCode.length === 0) {
      newErrors.hsCode = 'HS编码不能为空';
    } else if (!/^[0-9]{6,10}(-[0-9]{2,4})*$/.test(trimmedHsCode)) {
      newErrors.hsCode = 'HS编码格式不正确，应为6-10位数字，可包含连字符';
    }

    if (!formData.category) {
      newErrors.category = '产品类别不能为空';
    }

    if (formData.description && formData.description.length > 5000) {
      newErrors.description = '产品描述长度不能超过5000个字符';
    }

    // Validate specifications for duplicate keys
    if (formData.specifications) {
      const keys = Object.keys(formData.specifications);
      const uniqueKeys = new Set(keys);
      if (keys.length !== uniqueKeys.size) {
        newErrors.specifications = '产品规格中存在重复的属性名';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: CreateProductDto = {
        ...formData,
        // specifications is already in the correct format from SpecificationsTable
      };
      
      // First, create the product
      const createdProduct = await productsService.createProduct(submitData);
      
      // Then, create associations if customers are selected
      if (selectedCustomers.length > 0) {
        const associationPromises = selectedCustomers.map(async (customer) => {
          // Determine association type based on customer type
          const associationType: AssociationType =
            customer.customerType === 'BUYER'
              ? 'POTENTIAL_BUYER'
              : 'POTENTIAL_SUPPLIER';
          
          try {
            await productsService.createProductCustomerAssociation(
              createdProduct.id,
              customer.id,
              associationType,
            );
            return { customer, success: true, error: null };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            console.error(`Failed to create association for customer ${customer.name}:`, error);
            return { customer, success: false, error: errorMessage };
          }
        });

        // Use Promise.allSettled to allow partial failures
        const results = await Promise.allSettled(associationPromises);
        const successful = results
          .filter((r) => r.status === 'fulfilled' && r.value.success)
          .map((r) => (r.status === 'fulfilled' ? r.value.customer : null))
          .filter(Boolean) as Customer[];
        const failed = results
          .filter((r) => r.status === 'fulfilled' && !r.value.success)
          .map((r) => (r.status === 'fulfilled' ? r.value : null))
          .filter(Boolean) as Array<{ customer: Customer; error: string }>;
        const successCount = successful.length;
        const failureCount = failed.length;

        // Log failed associations for debugging
        if (failed.length > 0) {
          console.warn('Failed associations:', failed.map((f) => ({
            customer: f.customer.name,
            error: f.error,
          })));
        }

        // Show appropriate message based on results
        if (failureCount === 0) {
          // All associations succeeded
          toast.success(PRODUCT_CREATE_WITH_ASSOCIATIONS_SUCCESS(selectedCustomers.length));
        } else if (successCount > 0) {
          // Partial failure
          toast.warning(PRODUCT_CREATE_ASSOCIATIONS_PARTIAL_FAILURE(successCount, failureCount), {
            autoClose: 6000,
          });
          // Show navigation button immediately (no delay)
          toast.info(
            <div className="flex flex-col gap-2">
              <p>{MANAGE_ASSOCIATIONS_IN_DETAIL}</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/products/${createdProduct.id}`)}
                className="w-full"
              >
                前往产品详情页
              </Button>
            </div>,
            {
              autoClose: 10000,
              closeButton: true,
            },
          );
        } else {
          // All associations failed
          toast.warning(PRODUCT_CREATE_ASSOCIATIONS_ALL_FAILURE, {
            autoClose: 6000,
          });
          // Show navigation button immediately (no delay)
          toast.info(
            <div className="flex flex-col gap-2">
              <p>{MANAGE_ASSOCIATIONS_IN_DETAIL}</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/products/${createdProduct.id}`)}
                className="w-full"
              >
                前往产品详情页
              </Button>
            </div>,
            {
              autoClose: 10000,
              closeButton: true,
            },
          );
        }
      } else {
        // No associations to create
        toast.success(PRODUCT_CREATE_SUCCESS);
      }

      // Call the parent's onSubmit callback for consistency (it will handle navigation/state)
      // Note: Product is already created, so parent's handleSubmit should not create it again
      await onSubmit(submitData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '创建产品失败';
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
      // Re-throw to let parent handle it
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof CreateProductDto, value: CreateProductDto[keyof CreateProductDto]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-monday-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-monday-6">
        <Input
          id="name"
          label="产品名称"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={!!errors.name}
          errorMessage={errors.name}
          maxLength={255}
          required
        />

        <div className="flex flex-col gap-monday-2">
          <label htmlFor="hsCode" className="text-monday-sm font-semibold text-monday-text">
            HS编码 <span className="text-primary-red">*</span>
          </label>
          <HsCodeSelect
            value={formData.hsCode}
            onChange={handleHsCodeChange}
            categories={categories}
            onSelect={handleHsCodeSelect}
            error={!!errors.hsCode}
            errorMessage={errors.hsCode}
            placeholder="搜索或选择HS编码..."
            required
            disabled={syncInProgress || categories.length === 0}
          />
          {syncInProgress && formData.hsCode && !formData.category && (
            <span className="text-monday-xs text-monday-text-secondary">
              正在查找对应类别...
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-monday-2">
        <label htmlFor="category" className="text-monday-sm font-semibold text-monday-text">
          产品类别 <span className="text-primary-red">*</span>
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          disabled={syncInProgress || categories.length === 0}
          className={`w-full p-monday-3 px-monday-4 text-monday-base text-monday-text bg-monday-surface border rounded-monday-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue ${
            errors.category ? 'border-semantic-error focus:ring-semantic-error/50' : 'border-gray-200 focus:ring-uipro-cta/50'
          } ${syncInProgress ? 'opacity-50 cursor-wait' : ''}`}
          required
        >
          <option value="">请选择类别</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
        {syncInProgress && formData.category && (
          <span className="text-monday-xs text-monday-text-secondary">
            正在同步HS编码...
          </span>
        )}
        {errors.category && (
          <span className="text-monday-sm text-semantic-error mt-monday-1">{errors.category}</span>
        )}
      </div>

      <div className="flex flex-col gap-monday-2">
        <label htmlFor="description" className="text-monday-sm font-semibold text-monday-text">
          产品描述
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className={`w-full p-monday-3 px-monday-4 text-monday-base text-monday-text bg-monday-surface border rounded-monday-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue placeholder:text-monday-text-secondary resize-y ${
            errors.description ? 'border-semantic-error focus:ring-semantic-error/50' : 'border-gray-200 focus:ring-uipro-cta/50'
          }`}
          rows={4}
          maxLength={5000}
        />
        {errors.description && (
          <span className="text-monday-sm text-semantic-error mt-monday-1">{errors.description}</span>
        )}
      </div>

      <div className="flex flex-col gap-monday-2">
        <label htmlFor="specifications" className="text-monday-sm font-semibold text-monday-text">
          产品规格
        </label>
        <SpecificationsTable
          value={formData.specifications}
          onChange={(specs) => {
            setFormData(prev => ({ ...prev, specifications: specs }));
            if (errors.specifications) {
              setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.specifications;
                return newErrors;
              });
            }
          }}
          error={!!errors.specifications}
          errorMessage={errors.specifications}
        />
        <span className="text-monday-xs text-monday-text-placeholder">
          可以添加多个规格属性，每行一个属性
        </span>
      </div>

      <div className="flex flex-col gap-monday-2">
        <label htmlFor="imageUrl" className="text-monday-sm font-semibold text-monday-text">
          产品图片URL
        </label>
        <Input
          id="imageUrl"
          type="url"
          value={formData.imageUrl}
          onChange={(e) => handleChange('imageUrl', e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      {/* Association Section - Collapsible */}
      <div className="border border-gray-200 rounded-monday-md p-monday-4">
        <button
          type="button"
          onClick={() => setIsAssociationExpanded(!isAssociationExpanded)}
          className="w-full flex items-center justify-between text-monday-base font-semibold text-monday-text hover:text-primary-blue transition-colors"
          aria-expanded={isAssociationExpanded}
          aria-controls="association-section"
        >
          <span>关联客户（可选）</span>
          <span className="text-monday-text-secondary">
            {isAssociationExpanded ? '▼' : '▶'}
          </span>
        </button>
        
        {isAssociationExpanded && (
          <div
            id="association-section"
            className="mt-monday-4 transition-all duration-200"
          >
            <div className="flex flex-col gap-monday-2">
              <label className="text-monday-sm font-semibold text-monday-text">
                选择要关联的客户
              </label>
              <CustomerMultiSelect
                selectedCustomers={selectedCustomers}
                onChange={setSelectedCustomers}
                userRole={user?.role}
                placeholder="搜索客户名称或代码..."
                disabled={isSubmitting}
              />
              <span className="text-monday-xs text-monday-text-placeholder">
                创建产品后，系统将自动为选中的客户建立关联关系
              </span>
            </div>
          </div>
        )}
      </div>

      {errors.submit && (
        <div className="bg-semantic-error/10 border border-semantic-error text-semantic-error p-monday-3 rounded-monday-md" role="alert">
          {errors.submit}
        </div>
      )}

      <div className="flex justify-end gap-monday-3 pt-monday-6 border-t border-gray-200">
        <Button type="button" onClick={onCancel} disabled={isSubmitting} variant="outline" className="cursor-pointer transition-colors duration-200">
          取消
        </Button>
        <Button type="submit" isLoading={isSubmitting} variant="primary">
          创建产品
        </Button>
      </div>
    </form>
  );
};

