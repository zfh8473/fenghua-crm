/**
 * Category Form Component
 * 
 * Form for creating or editing a product category
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect } from 'react';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../categories.service';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: CreateCategoryDto | UpdateCategoryDto) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<CreateCategoryDto>({
    name: '',
    hsCode: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        hsCode: category.hsCode,
        description: category.description || '',
      });
    }
  }, [category]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const trimmedName = formData.name?.trim() || '';
    if (trimmedName.length === 0) {
      newErrors.name = '类别名称不能为空';
    } else if (trimmedName.length > 255) {
      newErrors.name = '类别名称长度不能超过255个字符';
    }

    const trimmedHsCode = formData.hsCode?.trim() || '';
    if (trimmedHsCode.length === 0) {
      newErrors.hsCode = 'HS编码不能为空';
    } else if (!/^[0-9]{6,10}(-[0-9]{2,4})*$/.test(trimmedHsCode)) {
      newErrors.hsCode = 'HS编码格式不正确，应为6-10位数字，可包含连字符';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = '类别描述长度不能超过1000个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '操作失败';
      setErrors({ submit: errorMessage });
    }
  };

  const handleChange = (field: keyof CreateCategoryDto, value: CreateCategoryDto[keyof CreateCategoryDto]) => {
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
          label="类别名称"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={!!errors.name}
          errorMessage={errors.name}
          maxLength={255}
          required
          disabled={isSubmitting}
        />

        <Input
          id="hsCode"
          label="HS编码"
          type="text"
          value={formData.hsCode}
          onChange={(e) => handleChange('hsCode', e.target.value)}
          error={!!errors.hsCode}
          errorMessage={errors.hsCode}
          placeholder="例如: 123456 或 1234-56-78"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="flex flex-col gap-monday-2">
        <label htmlFor="description" className="text-monday-sm font-semibold text-monday-text">
          类别描述
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className={`w-full p-monday-3 px-monday-4 text-monday-base text-monday-text bg-monday-surface border rounded-monday-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue placeholder:text-monday-text-secondary resize-y ${
            errors.description ? 'border-primary-red focus:ring-primary-red' : 'border-gray-200'
          }`}
          rows={4}
          maxLength={1000}
          disabled={isSubmitting}
        />
        {errors.description && (
          <span className="text-monday-sm text-primary-red mt-monday-1">{errors.description}</span>
        )}
      </div>

      {errors.submit && (
        <div className="bg-primary-red/20 border border-primary-red text-primary-red p-monday-3 rounded-monday-md" role="alert">
          {errors.submit}
        </div>
      )}

      <div className="flex justify-end gap-monday-3 pt-monday-6 border-t border-gray-200">
        <Button type="button" onClick={onCancel} disabled={isSubmitting} variant="outline">
          取消
        </Button>
        <Button type="submit" isLoading={isSubmitting} variant="primary">
          {category ? '更新类别' : '创建类别'}
        </Button>
      </div>
    </form>
  );
};

