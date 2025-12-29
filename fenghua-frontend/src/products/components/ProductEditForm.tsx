/**
 * Product Edit Form Component
 * 
 * Form for editing an existing product
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Product, UpdateProductDto } from '../products.service';
import { Category, categoriesService } from '../../product-categories/categories.service';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { SpecificationsTable } from '../../components/SpecificationsTable';
import { HsCodeSelect } from '../../components/ui/HsCodeSelect';
import { ProductStatusSelector } from './ProductStatusSelector';
// import './ProductEditForm.css'; // Removed

interface ProductEditFormProps {
  product: Product;
  onSubmit: (data: UpdateProductDto) => Promise<void>;
  onCancel: () => void;
}

export const ProductEditForm: React.FC<ProductEditFormProps> = ({
  product,
  onSubmit,
  onCancel,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<UpdateProductDto & { hsCode?: string }>({
    name: product.name,
    category: product.category,
    hsCode: product.hsCode, // Add HS code to form data
    description: product.description || '',
    specifications: product.specifications,
    imageUrl: product.imageUrl || '',
    status: product.status,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const hsCodeLookupTimeout = useRef<NodeJS.Timeout | null>(null);

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
      setSyncInProgress(true);
      setFormData(prev => ({
        ...prev,
        category: category.name,
        hsCode: category.hsCode, // Auto-sync HS code
      }));
      // Clear errors
      if (errors.category) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.category;
          return newErrors;
        });
      }
      if (errors.hsCode) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.hsCode;
          return newErrors;
        });
      }
      setSyncInProgress(false);
    } else {
      setFormData(prev => ({ ...prev, category: categoryName, hsCode: '' }));
    }
  }, [categories, errors.category, errors.hsCode]);

  // Handle HS code input change (when user types directly) - with debounce
  const handleHsCodeChange = useCallback((hsCode: string) => {
    setFormData(prev => ({ ...prev, hsCode }));
    
    // Clear previous timeout
    if (hsCodeLookupTimeout.current) {
      clearTimeout(hsCodeLookupTimeout.current);
    }

    // Clear HS code errors
    if (errors.hsCode) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.hsCode;
        return newErrors;
      });
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
    hsCodeLookupTimeout.current = setTimeout(async () => {
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
  }, [errors.hsCode]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hsCodeLookupTimeout.current) {
        clearTimeout(hsCodeLookupTimeout.current);
      }
    };
  }, []);

  // Update form data when product prop changes
  useEffect(() => {
    setFormData({
      name: product.name,
      category: product.category,
      hsCode: product.hsCode, // Include HS code
      description: product.description || '',
      specifications: product.specifications,
      imageUrl: product.imageUrl || '',
      status: product.status,
    });
  }, [product]);

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
      const submitData: UpdateProductDto = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        specifications: formData.specifications,
        imageUrl: formData.imageUrl,
        // Include HS code if it has changed
        ...(formData.hsCode !== product.hsCode && { hsCode: formData.hsCode }),
        // Include status if it has changed
        ...(formData.status !== product.status && { status: formData.status }),
      };
      await onSubmit(submitData);
    } catch (error: unknown) {
      setErrors({ submit: error.message || '更新产品失败' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof UpdateProductDto, value: UpdateProductDto[keyof UpdateProductDto]) => {
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
        {/* 产品名称 - 最重要，使用粗体和大字体 */}
        <div className="flex flex-col gap-monday-2">
          <label htmlFor="name" className="text-monday-sm font-semibold text-monday-text">
            产品名称
          </label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={!!errors.name}
            errorMessage={errors.name}
            maxLength={255}
            className="font-normal"
          />
        </div>

        {/* HS编码 - 重要，使用半粗体 */}
        <div className="flex flex-col gap-monday-2">
          <label htmlFor="hsCode" className="text-monday-sm font-semibold text-monday-text">
            HS编码
          </label>
          <HsCodeSelect
            id="hsCode"
            value={formData.hsCode || ''}
            onChange={handleHsCodeChange}
            onSelect={(category) => {
              setFormData(prev => ({
                ...prev,
                category: category.name,
                hsCode: category.hsCode,
              }));
              if (errors.hsCode || errors.category) {
                setErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors.hsCode;
                  delete newErrors.category;
                  return newErrors;
                });
              }
            }}
            categories={categories}
            error={!!errors.hsCode}
            errorMessage={errors.hsCode}
            placeholder="输入HS编码或选择类别自动填充"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-monday-6">
        {/* 产品类别 - 重要，使用半粗体 */}
        <div className="flex flex-col gap-monday-2">
          <label htmlFor="category" className="text-monday-sm font-semibold text-monday-text">
            产品类别
          </label>
          <select
            id="category"
            value={formData.category || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            disabled={syncInProgress || categories.length === 0}
            className={`w-full p-monday-3 px-monday-4 text-monday-base text-monday-text bg-monday-surface border rounded-monday-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue font-normal ${
              errors.category ? 'border-primary-red focus:ring-primary-red' : 'border-gray-200'
            } ${syncInProgress ? 'opacity-50 cursor-wait' : ''}`}
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
            <span className="text-monday-sm text-primary-red mt-monday-1">{errors.category}</span>
          )}
        </div>

        {/* 产品状态 - 次要，使用中等粗细 */}
        <div className="flex flex-col gap-monday-2">
          <div className="text-monday-sm font-medium text-monday-text">
            产品状态
          </div>
          <ProductStatusSelector
            value={formData.status as 'active' | 'inactive' | 'archived' | undefined}
            onChange={(status) => handleChange('status', status)}
            error={errors.status}
          />
        </div>
      </div>

      {/* 产品描述 - 次要，使用中等粗细 */}
      <div className="flex flex-col gap-monday-2">
        <label htmlFor="description" className="text-monday-sm font-medium text-monday-text">
          产品描述
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className={`w-full p-monday-3 px-monday-4 text-monday-base text-monday-text bg-monday-surface border rounded-monday-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue placeholder:text-monday-text-secondary resize-y font-normal ${
            errors.description ? 'border-primary-red focus:ring-primary-red' : 'border-gray-200'
          }`}
          rows={4}
          maxLength={5000}
        />
        {errors.description && (
          <span className="text-monday-sm text-primary-red mt-monday-1">{errors.description}</span>
        )}
      </div>

      {/* 产品规格 - 次要，使用中等粗细 */}
      <div className="flex flex-col gap-monday-2">
        <label htmlFor="specifications" className="text-monday-sm font-medium text-monday-text">
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

      {/* 产品图片URL - 最次要，使用正常粗细 */}
      <div className="flex flex-col gap-monday-2">
        <label htmlFor="imageUrl" className="text-monday-sm font-normal text-monday-text">
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

      {errors.submit && (
        <div className="bg-primary-red/20 border border-primary-red text-primary-red p-monday-3 rounded-monday-md" role="alert">
          {errors.submit}
        </div>
      )}

      <div className="flex justify-end gap-monday-3 pt-monday-6 border-t border-gray-200">
        <Button 
          type="button" 
          onClick={onCancel} 
          disabled={isSubmitting} 
          variant="outline"
          className="bg-gray-50 hover:bg-gray-100 border-gray-300 text-monday-text"
        >
          取消
        </Button>
        <Button type="submit" isLoading={isSubmitting} variant="primary">
          更新
        </Button>
      </div>
    </form>
  );
};

