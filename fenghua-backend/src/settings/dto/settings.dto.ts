/**
 * DTOs for system settings
 * All custom code is proprietary and not open source.
 */

import {
  IsNumber,
  IsString,
  IsBoolean,
  IsArray,
  IsEnum,
  IsOptional,
  Min,
  Max,
  IsEmail,
  ValidateIf,
  ArrayMaxSize,
} from 'class-validator';

/**
 * Backup frequency enum
 */
export enum BackupFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

/**
 * Log level enum
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * DTO for updating system settings
 */
export class UpdateSettingsDto {
  @IsOptional()
  @IsNumber({}, { message: '数据保留天数必须是数字' })
  @Min(1, { message: '数据保留天数必须大于 0' })
  @Max(3650, { message: '数据保留天数不能超过 3650 天（10年）' })
  dataRetentionDays?: number;

  @IsOptional()
  @IsEnum(BackupFrequency, { message: '备份频率必须是 daily、weekly 或 monthly' })
  backupFrequency?: BackupFrequency;

  @IsOptional()
  @IsNumber({}, { message: '备份保留天数必须是数字' })
  @Min(1, { message: '备份保留天数必须大于 0' })
  @Max(365, { message: '备份保留天数不能超过 365 天' })
  backupRetentionDays?: number;

  @IsOptional()
  @IsBoolean({ message: '邮件通知开关必须是布尔值' })
  emailNotificationsEnabled?: boolean;

  @IsOptional()
  @IsArray({ message: '通知接收人必须是数组' })
  @ArrayMaxSize(50, { message: '通知接收人不能超过 50 个' })
  @IsEmail({}, { each: true, message: '通知接收人必须是有效的邮箱地址' })
  notificationRecipients?: string[];

  @IsOptional()
  @IsEnum(LogLevel, { message: '日志级别必须是 error、warn、info 或 debug' })
  logLevel?: LogLevel;

  @IsOptional()
  @IsNumber({}, { message: '客户数据保留天数必须是数字' })
  @Min(-1, { message: '客户数据保留天数必须 >= -1（-1 表示永久保留）' })
  customerDataRetentionDays?: number;

  @IsOptional()
  @IsNumber({}, { message: '产品数据保留天数必须是数字' })
  @Min(-1, { message: '产品数据保留天数必须 >= -1（-1 表示永久保留）' })
  productDataRetentionDays?: number;

  @IsOptional()
  @IsNumber({}, { message: '互动记录保留天数必须是数字' })
  @Min(-1, { message: '互动记录保留天数必须 >= -1（-1 表示永久保留）' })
  interactionDataRetentionDays?: number;

  @IsOptional()
  @IsNumber({}, { message: '审计日志保留天数必须是数字' })
  @Min(-1, { message: '审计日志保留天数必须 >= -1（-1 表示永久保留）' })
  auditLogRetentionDays?: number;
}

/**
 * DTO for system settings response
 */
export class SettingsResponseDto {
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
  updatedAt?: Date;
  updatedBy?: string;
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS = {
  dataRetentionDays: 2555, // 7 years
  backupFrequency: BackupFrequency.DAILY,
  backupRetentionDays: 30,
  emailNotificationsEnabled: false,
  notificationRecipients: [],
  logLevel: LogLevel.INFO,
  customerDataRetentionDays: 2555, // 7 years
  productDataRetentionDays: -1, // Permanent retention
  interactionDataRetentionDays: 2555, // 7 years
  auditLogRetentionDays: 3650, // 10 years
} as const;

