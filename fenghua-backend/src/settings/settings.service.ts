/**
 * Settings Service
 * 
 * Manages system settings storage and retrieval
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UpdateSettingsDto, SettingsResponseDto, DEFAULT_SETTINGS } from './dto/settings.dto';
import { AuditService } from '../audit/audit.service';

/**
 * In-memory settings storage for MVP
 * 
 * NOTE: This is a temporary solution for MVP stage.
 * - Database migration script (004-create-system-settings-table.sql) has been created
 * - In production, this should be replaced with database storage using TypeORM
 * - Current implementation: Settings are stored in memory and will be lost on service restart
 * - TODO: Implement database storage using SettingsEntity and SettingsRepository
 */
interface SettingsStorage {
  [key: string]: {
    value: any;
    updatedAt: Date;
    updatedBy?: string;
  };
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private settingsCache: SettingsStorage = {};
  private cacheInitialized = false;

  constructor(private readonly auditService: AuditService) {
    this.initializeDefaultSettings();
  }

  /**
   * Initialize default settings if not present
   */
  private initializeDefaultSettings(): void {
    if (this.cacheInitialized) {
      return;
    }

    const defaultKeys = Object.keys(DEFAULT_SETTINGS);
    for (const key of defaultKeys) {
      if (!this.settingsCache[key]) {
        this.settingsCache[key] = {
          value: DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS],
          updatedAt: new Date(),
        };
      }
    }

    this.cacheInitialized = true;
    this.logger.log('Default settings initialized');
  }

  /**
   * Get all settings
   */
  async getAllSettings(): Promise<SettingsResponseDto> {
    this.initializeDefaultSettings();

    return {
      dataRetentionDays: this.getSettingValue('dataRetentionDays', DEFAULT_SETTINGS.dataRetentionDays),
      backupFrequency: this.getSettingValue('backupFrequency', DEFAULT_SETTINGS.backupFrequency),
      backupRetentionDays: this.getSettingValue('backupRetentionDays', DEFAULT_SETTINGS.backupRetentionDays),
      emailNotificationsEnabled: this.getSettingValue('emailNotificationsEnabled', DEFAULT_SETTINGS.emailNotificationsEnabled),
      notificationRecipients: this.getSettingValue('notificationRecipients', DEFAULT_SETTINGS.notificationRecipients),
      logLevel: this.getSettingValue('logLevel', DEFAULT_SETTINGS.logLevel),
      customerDataRetentionDays: this.getSettingValue('customerDataRetentionDays', DEFAULT_SETTINGS.customerDataRetentionDays),
      productDataRetentionDays: this.getSettingValue('productDataRetentionDays', DEFAULT_SETTINGS.productDataRetentionDays),
      interactionDataRetentionDays: this.getSettingValue('interactionDataRetentionDays', DEFAULT_SETTINGS.interactionDataRetentionDays),
      auditLogRetentionDays: this.getSettingValue('auditLogRetentionDays', DEFAULT_SETTINGS.auditLogRetentionDays),
      updatedAt: this.getLatestUpdateTime(),
      updatedBy: this.getLatestUpdater(),
    };
  }

  /**
   * Get a single setting value
   */
  async getSetting(key: string): Promise<any> {
    this.initializeDefaultSettings();

    if (this.settingsCache[key]) {
      return this.settingsCache[key].value;
    }

    // Return default value if not found
    const defaultKey = key as keyof typeof DEFAULT_SETTINGS;
    if (defaultKey in DEFAULT_SETTINGS) {
      return DEFAULT_SETTINGS[defaultKey];
    }

    throw new NotFoundException(`Setting ${key} not found`);
  }

  /**
   * Update settings
   */
  async updateSettings(
    updateDto: UpdateSettingsDto,
    operatorId: string,
  ): Promise<SettingsResponseDto> {
    this.initializeDefaultSettings();

    const oldSettings = await this.getAllSettings();
    const updates: Array<{ key: string; oldValue: any; newValue: any }> = [];

    // Update each provided setting
    if (updateDto.dataRetentionDays !== undefined) {
      const oldValue = oldSettings.dataRetentionDays;
      this.setSetting('dataRetentionDays', updateDto.dataRetentionDays, operatorId);
      updates.push({ key: 'dataRetentionDays', oldValue, newValue: updateDto.dataRetentionDays });
    }

    if (updateDto.backupFrequency !== undefined) {
      const oldValue = oldSettings.backupFrequency;
      this.setSetting('backupFrequency', updateDto.backupFrequency, operatorId);
      updates.push({ key: 'backupFrequency', oldValue, newValue: updateDto.backupFrequency });
    }

    if (updateDto.backupRetentionDays !== undefined) {
      const oldValue = oldSettings.backupRetentionDays;
      this.setSetting('backupRetentionDays', updateDto.backupRetentionDays, operatorId);
      updates.push({ key: 'backupRetentionDays', oldValue, newValue: updateDto.backupRetentionDays });
    }

    if (updateDto.emailNotificationsEnabled !== undefined) {
      const oldValue = oldSettings.emailNotificationsEnabled;
      this.setSetting('emailNotificationsEnabled', updateDto.emailNotificationsEnabled, operatorId);
      updates.push({ key: 'emailNotificationsEnabled', oldValue, newValue: updateDto.emailNotificationsEnabled });
    }

    if (updateDto.notificationRecipients !== undefined) {
      const oldValue = oldSettings.notificationRecipients;
      this.setSetting('notificationRecipients', updateDto.notificationRecipients, operatorId);
      updates.push({ key: 'notificationRecipients', oldValue, newValue: updateDto.notificationRecipients });
    }

    if (updateDto.logLevel !== undefined) {
      const oldValue = oldSettings.logLevel;
      this.setSetting('logLevel', updateDto.logLevel, operatorId);
      updates.push({ key: 'logLevel', oldValue, newValue: updateDto.logLevel });
    }

    if (updateDto.customerDataRetentionDays !== undefined) {
      const oldValue = oldSettings.customerDataRetentionDays;
      if (updateDto.customerDataRetentionDays < -1) {
        throw new Error('客户数据保留天数必须 >= -1（-1 表示永久保留）');
      }
      this.setSetting('customerDataRetentionDays', updateDto.customerDataRetentionDays, operatorId);
      updates.push({ key: 'customerDataRetentionDays', oldValue, newValue: updateDto.customerDataRetentionDays });
    }

    if (updateDto.productDataRetentionDays !== undefined) {
      const oldValue = oldSettings.productDataRetentionDays;
      if (updateDto.productDataRetentionDays < -1) {
        throw new Error('产品数据保留天数必须 >= -1（-1 表示永久保留）');
      }
      this.setSetting('productDataRetentionDays', updateDto.productDataRetentionDays, operatorId);
      updates.push({ key: 'productDataRetentionDays', oldValue, newValue: updateDto.productDataRetentionDays });
    }

    if (updateDto.interactionDataRetentionDays !== undefined) {
      const oldValue = oldSettings.interactionDataRetentionDays;
      if (updateDto.interactionDataRetentionDays < -1) {
        throw new Error('互动记录保留天数必须 >= -1（-1 表示永久保留）');
      }
      this.setSetting('interactionDataRetentionDays', updateDto.interactionDataRetentionDays, operatorId);
      updates.push({ key: 'interactionDataRetentionDays', oldValue, newValue: updateDto.interactionDataRetentionDays });
    }

    if (updateDto.auditLogRetentionDays !== undefined) {
      const oldValue = oldSettings.auditLogRetentionDays;
      if (updateDto.auditLogRetentionDays < -1) {
        throw new Error('审计日志保留天数必须 >= -1（-1 表示永久保留）');
      }
      this.setSetting('auditLogRetentionDays', updateDto.auditLogRetentionDays, operatorId);
      updates.push({ key: 'auditLogRetentionDays', oldValue, newValue: updateDto.auditLogRetentionDays });
    }

    // Log audit for retention policy changes (for Task 6.2)
    const retentionPolicyUpdates = updates.filter(
      (u) =>
        u.key === 'customerDataRetentionDays' ||
        u.key === 'productDataRetentionDays' ||
        u.key === 'interactionDataRetentionDays' ||
        u.key === 'auditLogRetentionDays',
    );
    if (retentionPolicyUpdates.length > 0) {
      for (const update of retentionPolicyUpdates) {
        try {
          await this.auditService.log({
            action: 'DATA_RETENTION_POLICY_UPDATED',
            entityType: 'SYSTEM_SETTINGS',
            entityId: update.key,
            oldValue: update.oldValue,
            newValue: update.newValue,
            userId: operatorId,
            operatorId: operatorId,
            timestamp: new Date(),
            metadata: {
              actionType: 'DATA_RETENTION_POLICY_UPDATED',
            },
          });
        } catch (error) {
          this.logger.error(`Failed to log audit for retention policy ${update.key}`, error);
        }
      }
    }

    // Log audit for each setting change (non-blocking)
    for (const update of updates) {
      try {
        await this.auditService.log({
          action: 'SETTING_UPDATE',
          entityType: 'SYSTEM_SETTINGS',
          entityId: update.key,
          oldValue: update.oldValue,
          newValue: update.newValue,
          userId: operatorId,
          operatorId: operatorId,
          timestamp: new Date(),
          metadata: {
            actionType: 'SETTING_UPDATE',
          },
        });
      } catch (error) {
        this.logger.error(`Failed to log audit for setting ${update.key}`, error);
        // Continue with other updates - audit logging should not block settings update
      }
    }

    this.logger.log(`Settings updated by ${operatorId}: ${updates.map(u => u.key).join(', ')}`);

    // Return updated settings
    return this.getAllSettings();
  }

  /**
   * Get setting value from cache or default
   */
  private getSettingValue(key: string, defaultValue: any): any {
    if (this.settingsCache[key]) {
      return this.settingsCache[key].value;
    }
    return defaultValue;
  }

  /**
   * Set setting value
   */
  private setSetting(key: string, value: any, updatedBy: string): void {
    this.settingsCache[key] = {
      value,
      updatedAt: new Date(),
      updatedBy,
    };
  }

  /**
   * Get latest update time across all settings
   */
  private getLatestUpdateTime(): Date | undefined {
    const times = Object.values(this.settingsCache)
      .map(s => s.updatedAt)
      .filter(Boolean) as Date[];

    if (times.length === 0) {
      return undefined;
    }

    return new Date(Math.max(...times.map(t => t.getTime())));
  }

  /**
   * Get latest updater based on timestamp
   */
  private getLatestUpdater(): string | undefined {
    const entries = Object.entries(this.settingsCache)
      .filter(([_, s]) => s.updatedBy)
      .sort(([_, a], [__, b]) => b.updatedAt.getTime() - a.updatedAt.getTime());

    if (entries.length === 0) {
      return undefined;
    }

    // Return the updater with the most recent timestamp
    return entries[0][1].updatedBy;
  }

  /**
   * Clear cache (for testing or manual cache invalidation)
   */
  clearCache(): void {
    this.settingsCache = {};
    this.cacheInitialized = false;
    this.initializeDefaultSettings();
  }
}

