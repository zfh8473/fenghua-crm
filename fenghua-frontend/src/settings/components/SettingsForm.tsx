/**
 * Settings Form Component
 * 
 * Form for updating system settings
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect } from 'react';
import {
  SettingsResponseDto,
  UpdateSettingsDto,
  BackupFrequency,
  LogLevel,
} from '../types/settings.types';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { getErrorMessage, hasResponse } from '../../utils/error-handling';
// import './SettingsForm.css'; // Removed

interface SettingsFormProps {
  settings: SettingsResponseDto;
  onSubmit: (settings: UpdateSettingsDto) => Promise<void>;
  isLoading?: boolean;
}

export function SettingsForm({ settings, onSubmit, isLoading = false }: SettingsFormProps) {
  const [formData, setFormData] = useState<UpdateSettingsDto>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    // Initialize form with current settings
    setFormData({
      dataRetentionDays: settings.dataRetentionDays,
      backupFrequency: settings.backupFrequency,
      backupRetentionDays: settings.backupRetentionDays,
      emailNotificationsEnabled: settings.emailNotificationsEnabled,
      notificationRecipients: settings.notificationRecipients,
      logLevel: settings.logLevel,
      customerDataRetentionDays: settings.customerDataRetentionDays,
      productDataRetentionDays: settings.productDataRetentionDays,
      interactionDataRetentionDays: settings.interactionDataRetentionDays,
      auditLogRetentionDays: settings.auditLogRetentionDays,
    });
  }, [settings]);

  // Removed client-side validation - relying on backend validation
  // Backend will return validation errors which will be displayed to the user

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrors({});

    try {
      await onSubmit(formData);
      setSuccessMessage('系统设置已更新');
      // Clear form changes after successful update
      setFormData({});
    } catch (error: unknown) {
      // Display backend validation errors
      const errorMessage = getErrorMessage(error, '更新设置失败');
      setErrors({ submit: errorMessage });
      
      // If backend returns structured validation errors, parse and display them
      if (hasResponse(error) && error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
        const backendErrors = error.response.data.message;
        if (Array.isArray(backendErrors)) {
          const parsedErrors: Record<string, string> = {};
          backendErrors.forEach((err: unknown) => {
            const errStr = typeof err === 'string' ? err : String(err);
            // Parse validation error messages (e.g., "dataRetentionDays must be a number")
            if (errStr.includes('dataRetentionDays')) {
              parsedErrors.dataRetentionDays = errStr;
            } else if (errStr.includes('backupRetentionDays')) {
              parsedErrors.backupRetentionDays = errStr;
            } else if (errStr.includes('notificationRecipients')) {
              parsedErrors.notificationRecipients = errStr;
            }
          });
          setErrors({ ...parsedErrors, submit: errorMessage });
        } else {
          const backendErrorMsg = typeof backendErrors === 'string' ? backendErrors : String(backendErrors);
          setErrors({ submit: backendErrorMsg });
        }
      }
    }
  };

  const handleAddRecipient = () => {
    const recipients = formData.notificationRecipients || settings.notificationRecipients || [];
    if (recipients.length >= 50) {
      setErrors({ notificationRecipients: '通知接收人不能超过 50 个' });
      return;
    }
    setFormData({
      ...formData,
      notificationRecipients: [...recipients, ''],
    });
  };

  const handleRemoveRecipient = (index: number) => {
    const recipients = formData.notificationRecipients || settings.notificationRecipients || [];
    setFormData({
      ...formData,
      notificationRecipients: recipients.filter((_, i) => i !== index),
    });
  };

  const handleRecipientChange = (index: number, value: string) => {
    const recipients = formData.notificationRecipients || settings.notificationRecipients || [];
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setFormData({
      ...formData,
      notificationRecipients: newRecipients,
    });
  };

  const currentDataRetentionDays = formData.dataRetentionDays ?? settings.dataRetentionDays;
  const currentBackupRetentionDays = formData.backupRetentionDays ?? settings.backupRetentionDays;
  const currentEmailNotifications = formData.emailNotificationsEnabled ?? settings.emailNotificationsEnabled;
  const currentRecipients = formData.notificationRecipients ?? settings.notificationRecipients ?? [];
  const currentBackupFrequency = formData.backupFrequency ?? settings.backupFrequency;
  const currentLogLevel = formData.logLevel ?? settings.logLevel;

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-monday-6">
      <div className="mb-monday-6 p-monday-6 bg-monday-surface rounded-monday-lg border border-gray-200">
        <h3 className="text-monday-xl font-semibold text-monday-text mb-monday-4">数据保留策略</h3>
        <div className="mb-monday-6">
          <div className="flex flex-col gap-monday-2">
            <label htmlFor="dataRetentionDays" className="text-monday-sm font-semibold text-monday-text">
              数据保留天数（默认 2555 天/7年，符合财务记录要求）
            </label>
            <Input
              id="dataRetentionDays"
              label=""
              type="number"
              min="1"
              max="3650"
              value={currentDataRetentionDays?.toString() || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dataRetentionDays: parseInt(e.target.value, 10) || undefined,
                })
              }
              error={!!errors.dataRetentionDays}
              errorMessage={errors.dataRetentionDays}
              className="font-normal"
            />
            <span className="text-monday-xs text-monday-text-placeholder">
              用于配置业务数据的保留期限，超过保留期的数据将被自动清理
            </span>
          </div>
        </div>

        <div className="mb-monday-6">
          <div className="flex flex-col gap-monday-2">
            <label htmlFor="customerDataRetentionDays" className="text-monday-sm font-semibold text-monday-text">
              客户数据保留天数（默认 2555 天/7年，-1 表示永久保留）
            </label>
            <Input
              id="customerDataRetentionDays"
              label=""
              type="number"
              min="-1"
              value={(formData.customerDataRetentionDays ?? settings.customerDataRetentionDays)?.toString() || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  customerDataRetentionDays: parseInt(e.target.value, 10) || undefined,
                })
              }
              error={!!errors.customerDataRetentionDays}
              errorMessage={errors.customerDataRetentionDays}
              className="font-normal"
            />
            <span className="text-monday-xs text-monday-text-placeholder">
              用于配置客户数据的保留期限，超过保留期的客户数据将被自动清理
            </span>
          </div>
        </div>

        <div className="mb-monday-6">
          <div className="flex flex-col gap-monday-2">
            <label htmlFor="productDataRetentionDays" className="text-monday-sm font-semibold text-monday-text">
              产品数据保留天数（默认 -1 表示永久保留）
            </label>
            <Input
              id="productDataRetentionDays"
              label=""
              type="number"
              min="-1"
              value={(formData.productDataRetentionDays ?? settings.productDataRetentionDays)?.toString() || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  productDataRetentionDays: parseInt(e.target.value, 10) || undefined,
                })
              }
              error={!!errors.productDataRetentionDays}
              errorMessage={errors.productDataRetentionDays}
              className="font-normal"
            />
            <span className="text-monday-xs text-monday-text-placeholder">
              用于配置产品数据的保留期限，-1 表示永久保留，超过保留期的产品数据将被自动清理
            </span>
          </div>
        </div>

        <div className="mb-monday-6">
          <div className="flex flex-col gap-monday-2">
            <label htmlFor="interactionDataRetentionDays" className="text-monday-sm font-semibold text-monday-text">
              互动记录保留天数（默认 2555 天/7年，-1 表示永久保留）
            </label>
            <Input
              id="interactionDataRetentionDays"
              label=""
              type="number"
              min="-1"
              value={(formData.interactionDataRetentionDays ?? settings.interactionDataRetentionDays)?.toString() || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  interactionDataRetentionDays: parseInt(e.target.value, 10) || undefined,
                })
              }
              error={!!errors.interactionDataRetentionDays}
              errorMessage={errors.interactionDataRetentionDays}
              className="font-normal"
            />
            <span className="text-monday-xs text-monday-text-placeholder">
              用于配置互动记录的保留期限，超过保留期的互动记录将被自动清理
            </span>
          </div>
        </div>

        <div className="mb-monday-6">
          <div className="flex flex-col gap-monday-2">
            <label htmlFor="auditLogRetentionDays" className="text-monday-sm font-semibold text-monday-text">
              审计日志保留天数（默认 3650 天/10年，-1 表示永久保留）
            </label>
            <Input
              id="auditLogRetentionDays"
              label=""
              type="number"
              min="-1"
              value={(formData.auditLogRetentionDays ?? settings.auditLogRetentionDays)?.toString() || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  auditLogRetentionDays: parseInt(e.target.value, 10) || undefined,
                })
              }
              error={!!errors.auditLogRetentionDays}
              errorMessage={errors.auditLogRetentionDays}
              className="font-normal"
            />
            <span className="text-monday-xs text-monday-text-placeholder">
              用于配置审计日志的保留期限，超过保留期的审计日志将被自动清理
            </span>
          </div>
        </div>
      </div>

      <div className="mb-monday-6 p-monday-6 bg-monday-surface rounded-monday-lg border border-gray-200">
        <h3 className="text-monday-xl font-semibold text-monday-text mb-monday-4">备份策略</h3>
        <div className="mb-monday-6">
          <div className="flex flex-col gap-monday-2">
            <label htmlFor="backupFrequency" className="text-monday-sm font-semibold text-monday-text">
              备份频率
            </label>
            <select
              id="backupFrequency"
              value={currentBackupFrequency}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  backupFrequency: e.target.value as BackupFrequency,
                })
              }
              className="w-full p-monday-3 px-monday-4 text-monday-base text-monday-text bg-monday-surface border border-gray-200 rounded-monday-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-uipro-cta/50 focus:border-uipro-cta font-semibold cursor-pointer"
            >
              <option value={BackupFrequency.DAILY}>每日</option>
              <option value={BackupFrequency.WEEKLY}>每周</option>
              <option value={BackupFrequency.MONTHLY}>每月</option>
            </select>
            <span className="text-monday-xs text-monday-text-placeholder">
              用于配置系统自动备份的频率
            </span>
          </div>
        </div>

        <div className="mb-monday-6">
          <div className="flex flex-col gap-monday-2">
            <label htmlFor="backupRetentionDays" className="text-monday-sm font-semibold text-monday-text">
              备份保留天数（默认 30 天）
            </label>
            <Input
              id="backupRetentionDays"
              label=""
              type="number"
              min="1"
              max="365"
              value={currentBackupRetentionDays?.toString() || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  backupRetentionDays: parseInt(e.target.value, 10) || undefined,
                })
              }
              error={!!errors.backupRetentionDays}
              errorMessage={errors.backupRetentionDays}
              className="font-normal"
            />
            <span className="text-monday-xs text-monday-text-placeholder">
              用于配置备份文件的保留期限
            </span>
          </div>
        </div>
      </div>

      <div className="mb-monday-6 p-monday-6 bg-monday-surface rounded-monday-lg border border-gray-200">
        <h3 className="text-monday-xl font-semibold text-monday-text mb-monday-4">系统通知设置</h3>
        <div className="mb-monday-6">
          <label className="flex items-center gap-monday-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentEmailNotifications}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  emailNotificationsEnabled: e.target.checked,
                })
              }
              className="w-4 h-4 text-uipro-cta bg-monday-surface border-gray-300 rounded-monday-sm focus:ring-2 focus:ring-uipro-cta/50 cursor-pointer"
            />
            <span className="text-monday-base text-monday-text font-medium">启用邮件通知</span>
          </label>
          <span className="block mt-monday-1 text-monday-xs text-monday-text-placeholder">用于配置系统告警和重要事件的邮件通知</span>
        </div>

        {currentEmailNotifications && (
          <div className="mb-monday-6">
            <div className="block text-monday-sm font-semibold text-monday-text mb-monday-2">通知接收人邮箱列表</div>
            {currentRecipients.map((email, index) => (
              <div key={index} className="flex gap-monday-2 mb-monday-2">
                <Input
                  id={`notification-recipient-${index}`}
                  type="email"
                  value={email}
                  onChange={(e) => handleRecipientChange(index, e.target.value)}
                  placeholder="输入邮箱地址"
                  aria-label={`通知接收人邮箱 ${index + 1}`}
                  onBlur={(e) => {
                    // Validate empty email on blur
                    if (!e.target.value.trim()) {
                      setErrors({
                        ...errors,
                        notificationRecipients: '邮箱地址不能为空',
                      });
                    }
                  }}
                  className="flex-1 font-normal"
                />
                <Button
                  type="button"
                  onClick={() => handleRemoveRecipient(index)}
                  variant="ghost"
                  size="sm"
                  className="text-semantic-error hover:bg-semantic-error/10 border border-transparent hover:border-semantic-error/20 cursor-pointer transition-colors duration-200"
                >
                  删除
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={handleAddRecipient}
              variant="outline"
              size="sm"
              disabled={currentRecipients.length >= 50}
              className="bg-gray-50 hover:bg-gray-100 border-gray-300"
            >
              添加接收人 {currentRecipients.length >= 50 && '(最多 50 个)'}
            </Button>
            {errors.notificationRecipients && (
              <p className="mt-monday-1 text-monday-sm text-semantic-error" role="alert">{errors.notificationRecipients}</p>
            )}
          </div>
        )}
      </div>

      <div className="mb-monday-6 p-monday-6 bg-monday-surface rounded-monday-lg border border-gray-200">
        <h3 className="text-monday-xl font-semibold text-monday-text mb-monday-4">日志级别设置</h3>
        <div className="mb-monday-6">
          <div className="flex flex-col gap-monday-2">
            <label htmlFor="logLevel" className="text-monday-sm font-semibold text-monday-text">
              日志级别（默认 info）
            </label>
            <select
              id="logLevel"
              value={currentLogLevel}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  logLevel: e.target.value as LogLevel,
                })
              }
              className="w-full p-monday-3 px-monday-4 text-monday-base text-monday-text bg-monday-surface border border-gray-200 rounded-monday-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-uipro-cta/50 focus:border-uipro-cta font-semibold cursor-pointer"
            >
              <option value={LogLevel.ERROR}>Error</option>
              <option value={LogLevel.WARN}>Warn</option>
              <option value={LogLevel.INFO}>Info</option>
              <option value={LogLevel.DEBUG}>Debug</option>
            </select>
            <span className="text-monday-xs text-monday-text-placeholder">
              用于配置系统日志记录的详细程度，影响日志文件的大小和系统性能
            </span>
          </div>
        </div>
      </div>

      {errors.submit && (
        <div className="bg-semantic-error/10 border border-semantic-error text-semantic-error p-monday-3 rounded-monday-md" role="alert">
          {errors.submit}
        </div>
      )}
      {successMessage && (
        <div className="bg-semantic-success/10 border border-semantic-success text-semantic-success p-monday-3 rounded-monday-md" role="alert">
          {successMessage}
        </div>
      )}

      <div className="mt-monday-8 flex justify-end gap-monday-3">
        <Button type="submit" disabled={isLoading} isLoading={isLoading} variant="primary" size="md">
          保存设置
        </Button>
      </div>
    </form>
  );
}

