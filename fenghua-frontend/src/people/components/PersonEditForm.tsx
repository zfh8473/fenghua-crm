/**
 * Person Edit Form Component
 * 
 * Form for editing an existing person (contact)
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect } from 'react';
import { Person, UpdatePersonDto, peopleService } from '../people.service';
import { CustomerSelect } from '../../customers/components/CustomerSelect';
import { Customer } from '../../customers/customers.service';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../auth/AuthContext';
import { toast } from 'react-toastify';
import { getErrorMessage } from '../../utils/error-handling';

interface PersonEditFormProps {
  person: Person;
  onSubmit: (data: UpdatePersonDto) => Promise<void>;
  onCancel: () => void;
}

export const PersonEditForm: React.FC<PersonEditFormProps> = ({
  person,
  onSubmit,
  onCancel,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<UpdatePersonDto>({
    firstName: person.firstName,
    lastName: person.lastName,
    email: person.email,
    phone: person.phone,
    mobile: person.mobile,
    jobTitle: person.jobTitle,
    department: person.department,
    linkedinUrl: person.linkedinUrl,
    wechat: person.wechat,
    whatsapp: person.whatsapp,
    facebook: person.facebook,
    notes: person.notes,
    companyId: person.companyId,
    isImportant: person.isImportant,
  });

  const [selectedCompany, setSelectedCompany] = useState<Customer | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load company information
  useEffect(() => {
    if (person.company) {
      setSelectedCompany({
        id: person.company.id,
        name: person.company.name,
        customerCode: person.company.customerCode || '',
        customerType: person.company.customerType || 'BUYER',
      } as Customer);
    }
  }, [person.company]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name: if either firstName or lastName is being changed, at least one must be provided
    if (formData.firstName !== undefined || formData.lastName !== undefined) {
      const firstNameTrimmed = (formData.firstName ?? person.firstName)?.trim() || '';
      const lastNameTrimmed = (formData.lastName ?? person.lastName)?.trim() || '';
      if (!firstNameTrimmed && !lastNameTrimmed) {
        newErrors.name = '姓名至少需要提供名字或姓氏中的一个';
      }
    }

    if (formData.firstName !== undefined && formData.firstName.trim().length > 100) {
      newErrors.firstName = '名字长度不能超过100个字符';
    }

    if (formData.lastName !== undefined && formData.lastName.trim().length > 100) {
      newErrors.lastName = '姓氏长度不能超过100个字符';
    }

    // Validate email format (if provided and changed)
    if (formData.email !== undefined && formData.email !== person.email) {
      if (formData.email && formData.email.trim().length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
          newErrors.email = '邮箱格式不正确';
        } else if (formData.email.trim().length > 255) {
          newErrors.email = '邮箱长度不能超过255个字符';
        }
      }
    }

    // Validate other optional fields length
    if (formData.phone !== undefined && formData.phone && formData.phone.length > 50) {
      newErrors.phone = '电话长度不能超过50个字符';
    }

    if (formData.mobile !== undefined && formData.mobile && formData.mobile.length > 50) {
      newErrors.mobile = '手机长度不能超过50个字符';
    }

    if (formData.jobTitle !== undefined && formData.jobTitle && formData.jobTitle.length > 100) {
      newErrors.jobTitle = '职位长度不能超过100个字符';
    }

    if (formData.department !== undefined && formData.department && formData.department.length > 100) {
      newErrors.department = '部门长度不能超过100个字符';
    }

    if (formData.linkedinUrl !== undefined && formData.linkedinUrl && formData.linkedinUrl.length > 255) {
      newErrors.linkedinUrl = 'LinkedIn URL 长度不能超过255个字符';
    }

    if (formData.wechat !== undefined && formData.wechat && formData.wechat.length > 100) {
      newErrors.wechat = '微信长度不能超过100个字符';
    }

    if (formData.whatsapp !== undefined && formData.whatsapp && formData.whatsapp.length > 100) {
      newErrors.whatsapp = 'WhatsApp 长度不能超过100个字符';
    }

    if (formData.facebook !== undefined && formData.facebook && formData.facebook.length > 255) {
      newErrors.facebook = 'Facebook 长度不能超过255个字符';
    }

    if (formData.notes !== undefined && formData.notes && formData.notes.length > 5000) {
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
      const submitData: UpdatePersonDto = {
        firstName: formData.firstName?.trim() || undefined,
        lastName: formData.lastName?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        mobile: formData.mobile?.trim() || undefined,
        jobTitle: formData.jobTitle?.trim() || undefined,
        department: formData.department?.trim() || undefined,
        linkedinUrl: formData.linkedinUrl?.trim() || undefined,
        wechat: formData.wechat?.trim() || undefined,
        whatsapp: formData.whatsapp?.trim() || undefined,
        facebook: formData.facebook?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        companyId: formData.companyId || undefined,
        isImportant: formData.isImportant,
      };

      await peopleService.updatePerson(person.id, submitData);
      toast.success('联系人更新成功');
      await onSubmit(submitData);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, '更新联系人失败');
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof UpdatePersonDto, value: UpdatePersonDto[keyof UpdatePersonDto]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCompanyChange = (customer: Customer | null) => {
    setSelectedCompany(customer);
    setFormData((prev) => ({ ...prev, companyId: customer?.id || undefined }));
    if (errors.companyId) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.companyId;
        return newErrors;
      });
    }
  };

  // Validate name on blur (if name fields are being changed)
  const handleNameBlur = () => {
    if (formData.firstName !== undefined || formData.lastName !== undefined) {
      const firstNameTrimmed = (formData.firstName ?? person.firstName)?.trim() || '';
      const lastNameTrimmed = (formData.lastName ?? person.lastName)?.trim() || '';
      if (!firstNameTrimmed && !lastNameTrimmed) {
        setErrors((prev) => ({ ...prev, name: '姓名至少需要提供名字或姓氏中的一个' }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.name;
          return newErrors;
        });
      }
    }
  };

  // Validate email on blur (if email is being changed)
  const handleEmailBlur = () => {
    if (formData.email !== undefined && formData.email !== person.email) {
      if (formData.email && formData.email.trim().length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
          setErrors((prev) => ({ ...prev, email: '邮箱格式不正确' }));
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.email;
            return newErrors;
          });
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-monday-6">
      {/* Basic Information Section */}
      <div>
        <h3 className="text-monday-lg font-semibold text-uipro-text mb-monday-4 font-uipro-heading">基本信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-monday-6">
          <Input
            id="firstName"
            label="名字"
            type="text"
            value={formData.firstName || ''}
            onChange={(e) => handleChange('firstName', e.target.value)}
            onBlur={handleNameBlur}
            error={!!errors.firstName || !!errors.name}
            errorMessage={errors.firstName || errors.name}
            maxLength={100}
          />

          <Input
            id="lastName"
            label="姓氏"
            type="text"
            value={formData.lastName || ''}
            onChange={(e) => handleChange('lastName', e.target.value)}
            onBlur={handleNameBlur}
            error={!!errors.lastName || !!errors.name}
            errorMessage={errors.lastName || errors.name}
            maxLength={100}
          />

          <div className="md:col-span-2">
            <label className="block text-monday-sm font-semibold text-uipro-text mb-monday-2">
              关联客户
            </label>
            <CustomerSelect
              selectedCustomer={selectedCompany}
              onChange={handleCompanyChange}
              userRole={user?.role}
              placeholder="搜索客户名称或客户代码..."
              disabled={isSubmitting}
              error={!!errors.companyId}
              errorMessage={errors.companyId}
            />
          </div>

          <Input
            id="jobTitle"
            label="职位"
            type="text"
            value={formData.jobTitle || ''}
            onChange={(e) => handleChange('jobTitle', e.target.value)}
            error={!!errors.jobTitle}
            errorMessage={errors.jobTitle}
            maxLength={100}
          />

          <Input
            id="department"
            label="部门"
            type="text"
            value={formData.department || ''}
            onChange={(e) => handleChange('department', e.target.value)}
            error={!!errors.department}
            errorMessage={errors.department}
            maxLength={100}
          />
        </div>
      </div>

      {/* Contact Information Section */}
      <div>
        <h3 className="text-monday-lg font-semibold text-uipro-text mb-monday-4 font-uipro-heading">联系方式</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-monday-6">
          <Input
            id="phone"
            label="电话"
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            error={!!errors.phone}
            errorMessage={errors.phone}
            maxLength={50}
          />

          <Input
            id="mobile"
            label="手机"
            type="tel"
            value={formData.mobile || ''}
            onChange={(e) => handleChange('mobile', e.target.value)}
            error={!!errors.mobile}
            errorMessage={errors.mobile}
            maxLength={50}
          />

          <Input
            id="email"
            label="邮箱"
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={handleEmailBlur}
            error={!!errors.email}
            errorMessage={errors.email}
            maxLength={255}
            placeholder="example@company.com"
          />

          <Input
            id="wechat"
            label="微信"
            type="text"
            value={formData.wechat || ''}
            onChange={(e) => handleChange('wechat', e.target.value)}
            error={!!errors.wechat}
            errorMessage={errors.wechat}
            maxLength={100}
          />

          <Input
            id="whatsapp"
            label="WhatsApp"
            type="text"
            value={formData.whatsapp || ''}
            onChange={(e) => handleChange('whatsapp', e.target.value)}
            error={!!errors.whatsapp}
            errorMessage={errors.whatsapp}
            maxLength={100}
          />

          <Input
            id="linkedinUrl"
            label="LinkedIn URL"
            type="url"
            value={formData.linkedinUrl || ''}
            onChange={(e) => handleChange('linkedinUrl', e.target.value)}
            error={!!errors.linkedinUrl}
            errorMessage={errors.linkedinUrl}
            maxLength={255}
            placeholder="https://www.linkedin.com/in/username"
          />

          <Input
            id="facebook"
            label="Facebook"
            type="url"
            value={formData.facebook || ''}
            onChange={(e) => handleChange('facebook', e.target.value)}
            error={!!errors.facebook}
            errorMessage={errors.facebook}
            maxLength={255}
            placeholder="https://www.facebook.com/username"
          />
        </div>
      </div>

      {/* Other Information Section */}
      <div>
        <h3 className="text-monday-lg font-semibold text-uipro-text mb-monday-4 font-uipro-heading">其他信息</h3>
        <div className="space-y-monday-6">
          <div>
            <label htmlFor="notes" className="block text-monday-sm font-semibold text-monday-text mb-monday-2">
              备注
            </label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              maxLength={5000}
              className={`w-full px-monday-3 py-monday-2 border rounded-monday-md focus:outline-none focus:ring-2 focus:ring-uipro-cta/50 transition-colors duration-200 ${
                errors.notes ? 'border-semantic-error' : 'border-gray-300'
              }`}
            />
            {errors.notes && (
              <p className="text-monday-xs text-semantic-error mt-monday-1">{errors.notes}</p>
            )}
          </div>

          <div className="flex items-center gap-monday-2">
            <input
              type="checkbox"
              id="isImportant"
              checked={formData.isImportant || false}
              onChange={(e) => handleChange('isImportant', e.target.checked)}
              disabled={isSubmitting}
              className="w-4 h-4 text-uipro-cta border-gray-300 rounded focus:ring-uipro-cta cursor-pointer transition-colors duration-200"
            />
            <label htmlFor="isImportant" className="text-monday-sm font-medium text-uipro-text cursor-pointer">
              标记为重要联系人
            </label>
          </div>
        </div>
      </div>

      {errors.submit && (
        <div className="bg-semantic-error/10 border border-semantic-error text-semantic-error px-monday-4 py-monday-3 rounded-monday-md" role="alert">
          {errors.submit}
        </div>
      )}

      <div className="flex justify-end gap-monday-4">
        <Button type="button" variant="outline" onClick={onCancel} className="cursor-pointer transition-colors duration-200">
          取消
        </Button>
        <Button type="submit" disabled={isSubmitting} variant="primary">
          {isSubmitting ? '更新中...' : '更新联系人'}
        </Button>
      </div>
    </form>
  );
};
