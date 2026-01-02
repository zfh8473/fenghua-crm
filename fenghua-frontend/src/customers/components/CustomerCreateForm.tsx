/**
 * Customer Create Form Component
 * 
 * Form for creating a new customer with role-based customer type restrictions
 * All custom code is proprietary and not open source.
 */

import { useState } from 'react';
import { CreateCustomerDto } from '../customers.service';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../auth/AuthContext';
import { isFrontendSpecialist, isBackendSpecialist, isDirector, isAdmin } from '../../common/constants/roles';

interface CustomerCreateFormProps {
  onSubmit: (data: CreateCustomerDto) => Promise<void>;
  onCancel: () => void;
}

export const CustomerCreateForm: React.FC<CustomerCreateFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateCustomerDto>({
    name: '',
    customerCode: '',
    customerType: isFrontendSpecialist(user?.role) ? 'BUYER' : isBackendSpecialist(user?.role) ? 'SUPPLIER' : 'BUYER',
    domainName: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    industry: '',
    employees: undefined,
    website: '',
    phone: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get available customer types based on user role
  const getAvailableCustomerTypes = (): ('BUYER' | 'SUPPLIER')[] => {
    if (isFrontendSpecialist(user?.role)) {
      return ['BUYER'];
    }
    if (isBackendSpecialist(user?.role)) {
      return ['SUPPLIER'];
    }
    if (isDirector(user?.role) || isAdmin(user?.role)) {
      return ['BUYER', 'SUPPLIER'];
    }
    return ['BUYER', 'SUPPLIER']; // Default
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const trimmedName = formData.name?.trim() || '';
    if (trimmedName.length === 0) {
      newErrors.name = '客户名称不能为空';
    } else if (trimmedName.length > 255) {
      newErrors.name = '客户名称长度不能超过255个字符';
    }

    const trimmedCustomerCode = formData.customerCode?.trim() || '';
    if (trimmedCustomerCode.length === 0) {
      newErrors.customerCode = '客户代码不能为空';
    } else if (!/^[a-zA-Z0-9]{1,50}$/.test(trimmedCustomerCode)) {
      newErrors.customerCode = '客户代码格式不正确，应为1-50个字母数字字符';
    }

    if (!formData.customerType) {
      newErrors.customerType = '客户类型不能为空';
    }

    if (formData.address && formData.address.length > 1000) {
      newErrors.address = '地址长度不能超过1000个字符';
    }

    if (formData.industry && formData.industry.length > 100) {
      newErrors.industry = '行业长度不能超过100个字符';
    }

    if (formData.employees !== undefined) {
      if (formData.employees < 1 || formData.employees > 1000000) {
        newErrors.employees = '员工数必须在1-1000000之间';
      }
    }

    if (formData.notes && formData.notes.length > 5000) {
      newErrors.notes = '备注长度不能超过5000个字符';
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
      const submitData: CreateCustomerDto = {
        ...formData,
        // Remove empty strings and convert to undefined
        domainName: formData.domainName?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        state: formData.state?.trim() || undefined,
        country: formData.country?.trim() || undefined,
        postalCode: formData.postalCode?.trim() || undefined,
        industry: formData.industry?.trim() || undefined,
        website: formData.website?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      };
      await onSubmit(submitData);
    } catch (error: unknown) {
      setErrors({ submit: (error as Error).message || '创建客户失败' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof CreateCustomerDto, value: CreateCustomerDto[keyof CreateCustomerDto]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const availableCustomerTypes = getAvailableCustomerTypes();

  return (
    <form onSubmit={handleSubmit} className="space-y-monday-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-monday-6">
        <Input
          id="name"
          label="客户名称"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={!!errors.name}
          errorMessage={errors.name}
          maxLength={255}
          required
        />

        <Input
          id="customerCode"
          label="客户代码"
          type="text"
          value={formData.customerCode}
          onChange={(e) => handleChange('customerCode', e.target.value.toUpperCase())}
          error={!!errors.customerCode}
          errorMessage={errors.customerCode}
          maxLength={50}
          required
          placeholder="字母数字组合，1-50字符"
        />

        <div className="flex flex-col gap-monday-2">
          <label htmlFor="customerType" className="text-monday-sm font-semibold text-monday-text">
            客户类型 <span className="text-red-500">*</span>
          </label>
          <select
            id="customerType"
            value={formData.customerType}
            onChange={(e) => handleChange('customerType', e.target.value as 'BUYER' | 'SUPPLIER')}
            disabled={availableCustomerTypes.length === 1}
            className={`px-monday-3 py-monday-2 border rounded-monday-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.customerType ? 'border-red-500' : 'border-gray-300'
            } ${availableCustomerTypes.length === 1 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            required
          >
            {availableCustomerTypes.map((type) => (
              <option key={type} value={type}>
                {type === 'BUYER' ? '采购商' : '供应商'}
              </option>
            ))}
          </select>
          {errors.customerType && (
            <p className="text-monday-xs text-red-500">{errors.customerType}</p>
          )}
        </div>

        <Input
          id="domainName"
          label="域名"
          type="text"
          value={formData.domainName || ''}
          onChange={(e) => handleChange('domainName', e.target.value)}
          maxLength={255}
        />

        <Input
          id="address"
          label="地址"
          type="text"
          value={formData.address || ''}
          onChange={(e) => handleChange('address', e.target.value)}
          error={!!errors.address}
          errorMessage={errors.address}
          maxLength={1000}
        />

        <Input
          id="city"
          label="城市"
          type="text"
          value={formData.city || ''}
          onChange={(e) => handleChange('city', e.target.value)}
          maxLength={100}
        />

        <Input
          id="state"
          label="州/省"
          type="text"
          value={formData.state || ''}
          onChange={(e) => handleChange('state', e.target.value)}
          maxLength={100}
        />

        <Input
          id="country"
          label="国家"
          type="text"
          value={formData.country || ''}
          onChange={(e) => handleChange('country', e.target.value)}
          maxLength={100}
        />

        <Input
          id="postalCode"
          label="邮编"
          type="text"
          value={formData.postalCode || ''}
          onChange={(e) => handleChange('postalCode', e.target.value)}
          maxLength={20}
        />

        <Input
          id="industry"
          label="行业"
          type="text"
          value={formData.industry || ''}
          onChange={(e) => handleChange('industry', e.target.value)}
          error={!!errors.industry}
          errorMessage={errors.industry}
          maxLength={100}
        />

        <Input
          id="employees"
          label="员工数"
          type="number"
          value={formData.employees?.toString() || ''}
          onChange={(e) => handleChange('employees', e.target.value ? parseInt(e.target.value, 10) : undefined)}
          error={!!errors.employees}
          errorMessage={errors.employees}
          min={1}
          max={1000000}
        />

        <Input
          id="website"
          label="网站"
          type="url"
          value={formData.website || ''}
          onChange={(e) => handleChange('website', e.target.value)}
          maxLength={255}
        />

        <Input
          id="phone"
          label="电话"
          type="tel"
          value={formData.phone || ''}
          onChange={(e) => handleChange('phone', e.target.value)}
          maxLength={50}
        />
      </div>

      <div>
        <label htmlFor="notes" className="text-monday-sm font-semibold text-monday-text block mb-monday-2">
          备注
        </label>
        <textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={4}
          maxLength={5000}
          className={`w-full px-monday-3 py-monday-2 border rounded-monday-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.notes ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.notes && (
          <p className="text-monday-xs text-red-500 mt-monday-1">{errors.notes}</p>
        )}
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-monday-4 py-monday-3 rounded-monday-md">
          {errors.submit}
        </div>
      )}

      <div className="flex justify-end gap-monday-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '创建中...' : '创建客户'}
        </Button>
      </div>
    </form>
  );
};

