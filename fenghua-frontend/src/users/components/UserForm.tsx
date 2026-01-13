import { useState, useEffect } from 'react';
import { User, CreateUserData, UpdateUserData } from '../users.service';
import { RoleSelector } from '../../roles/components/RoleSelector';
import { UserRole } from '../../roles/role-descriptions';
import { Input, Button } from '../../components/ui';

interface UserFormProps {
  user?: User;
  onSubmit: (data: CreateUserData | UpdateUserData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  user,
  onSubmit,
  onCancel,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<CreateUserData | UpdateUserData>({
    email: user?.email || '',
    password: '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    role: (user?.role as UserRole) || 'FRONTEND_SPECIALIST', // Default role for new users
    department: user?.department || '',
    phone: user?.phone || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: (user.role as UserRole) || 'FRONTEND_SPECIALIST', // Default to FRONTEND_SPECIALIST if no role
        department: user.department || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = '邮箱地址不能为空';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    // Password validation
    if (!isEditing) {
      // Creating new user: password is required and must be at least 6 characters
      if (!('password' in formData) || !formData.password || formData.password.length < 6) {
        newErrors.password = '密码长度不能少于6个字符';
      }
    } else {
      // Editing user: if password is provided, it must be at least 6 characters
      if ('password' in formData && formData.password && formData.password.length < 6) {
        newErrors.password = '密码长度不能少于6个字符';
      }
    }

    if (!formData.role) {
      newErrors.role = '角色不能为空';
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
      // Remove password if editing and password is empty
      const submitData = isEditing && 'password' in formData && !formData.password
        ? { ...formData, password: undefined }
        : formData;
      
      await onSubmit(submitData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '操作失败';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof (CreateUserData | UpdateUserData) | 'password', value: string | UserRole) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-linear-6">
      {errors.submit && (
        <div className="p-linear-4 bg-primary-red/20 border border-primary-red rounded-linear-md text-primary-red text-linear-sm" role="alert">
          {errors.submit}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-linear-6">
        {/* 邮箱地址 - 最重要，使用semibold */}
        <div className="flex flex-col gap-linear-2">
          <label htmlFor="email" className="text-linear-sm font-semibold text-linear-text">
            邮箱地址 <span className="text-primary-red">*</span>
          </label>
          <Input
            id="email"
            label=""
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            required
            disabled={isSubmitting}
            error={!!errors.email}
            errorMessage={errors.email}
            className="font-normal"
          />
        </div>

        {/* 密码 - 最重要，使用semibold */}
        {!isEditing && (
          <div className="flex flex-col gap-linear-2">
            <label htmlFor="password" className="text-linear-sm font-semibold text-linear-text">
              密码 <span className="text-primary-red">*</span>
            </label>
            <Input
              id="password"
              label=""
              type="password"
              value={'password' in formData ? formData.password || '' : ''}
              onChange={(e) => handleChange('password', e.target.value)}
              required
              disabled={isSubmitting}
              error={!!errors.password}
              errorMessage={errors.password}
              minLength={6}
              className="font-normal"
            />
          </div>
        )}

        {isEditing && (
          <div className="flex flex-col gap-linear-2">
            <label htmlFor="newPassword" className="text-linear-sm font-medium text-linear-text">
              新密码（留空则不修改）
            </label>
            <Input
              id="newPassword"
              label=""
              type="password"
              value={'password' in formData ? formData.password || '' : ''}
              onChange={(e) => handleChange('password', e.target.value)}
              disabled={isSubmitting}
              error={!!errors.password}
              errorMessage={errors.password}
              minLength={6}
              className="font-normal"
            />
          </div>
        )}

        {/* 名字 - 次要，使用medium */}
        <div className="flex flex-col gap-linear-2">
          <label htmlFor="firstName" className="text-linear-sm font-medium text-linear-text">
            名字
          </label>
          <Input
            id="firstName"
            label=""
            type="text"
            value={formData.firstName || ''}
            onChange={(e) => handleChange('firstName', e.target.value)}
            disabled={isSubmitting}
            className="font-normal"
          />
        </div>

        {/* 姓氏 - 次要，使用medium */}
        <div className="flex flex-col gap-linear-2">
          <label htmlFor="lastName" className="text-linear-sm font-medium text-linear-text">
            姓氏
          </label>
          <Input
            id="lastName"
            label=""
            type="text"
            value={formData.lastName || ''}
            onChange={(e) => handleChange('lastName', e.target.value)}
            disabled={isSubmitting}
            className="font-normal"
          />
        </div>
      </div>

      {/* 角色 - 最重要，使用semibold */}
      <div>
        <div className="block text-linear-sm font-semibold text-linear-text mb-linear-2">
          角色 <span className="text-primary-red">*</span>
        </div>
        <RoleSelector
          value={formData.role as UserRole}
          onChange={(role) => handleChange('role', role)}
          disabled={isSubmitting}
          error={errors.role}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-linear-6">
        {/* 部门 - 次要，使用medium */}
        <div className="flex flex-col gap-linear-2">
          <label htmlFor="department" className="text-linear-sm font-medium text-linear-text">
            部门
          </label>
          <Input
            id="department"
            label=""
            type="text"
            value={formData.department || ''}
            onChange={(e) => handleChange('department', e.target.value)}
            disabled={isSubmitting}
            className="font-normal"
          />
        </div>

        {/* 联系方式 - 次要，使用medium */}
        <div className="flex flex-col gap-linear-2">
          <label htmlFor="phone" className="text-linear-sm font-medium text-linear-text">
            联系方式
          </label>
          <Input
            id="phone"
            label=""
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            disabled={isSubmitting}
            className="font-normal"
          />
        </div>
      </div>

      <div className="flex justify-end gap-linear-3 pt-linear-6 border-t border-gray-200">
        <Button 
          type="button" 
          variant="outline" 
          size="md" 
          onClick={onCancel} 
          disabled={isSubmitting}
          className="bg-gray-50 hover:bg-gray-100 border-gray-300 text-linear-text"
        >
          取消
        </Button>
        <Button 
          type="submit" 
          variant="primary" 
          size="md" 
          disabled={isSubmitting} 
          isLoading={isSubmitting}
        >
          {!isSubmitting && (isEditing ? '更新' : '创建')}
        </Button>
      </div>
    </form>
  );
};

