/**
 * Type definitions for system settings
 * All custom code is proprietary and not open source.
 */

export enum BackupFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface SettingsResponseDto {
  dataRetentionDays: number;
  backupFrequency: BackupFrequency;
  backupRetentionDays: number;
  emailNotificationsEnabled: boolean;
  notificationRecipients: string[];
  logLevel: LogLevel;
  customerDataRetentionDays: number;
  productDataRetentionDays: number;
  interactionDataRetentionDays: number;
  auditLogRetentionDays: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface UpdateSettingsDto {
  dataRetentionDays?: number;
  backupFrequency?: BackupFrequency;
  backupRetentionDays?: number;
  emailNotificationsEnabled?: boolean;
  notificationRecipients?: string[];
  logLevel?: LogLevel;
  customerDataRetentionDays?: number;
  productDataRetentionDays?: number;
  interactionDataRetentionDays?: number;
  auditLogRetentionDays?: number;
}

