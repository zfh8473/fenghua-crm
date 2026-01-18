import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionModule } from './permission/permission.module';
import { AuditModule } from './audit/audit.module';
import { SettingsModule } from './settings/settings.module';
import { MonitoringModule } from './monitoring/monitoring.module';
// import { LogsModule } from './logs/logs.module'; // TODO: LogsModule not implemented yet
import { BackupModule } from './backup/backup.module';
import { RestoreModule } from './restore/restore.module';
import { ProductsModule } from './products/products.module';
import { CompaniesModule } from './companies/companies.module';
import { ProductCategoriesModule } from './product-categories/product-categories.module';
import { InteractionsModule } from './interactions/interactions.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { CustomersImportModule } from './import/customers/customers-import.module';
import { ProductsImportModule } from './import/products/products-import.module';
import { InteractionsImportModule } from './import/interactions/interactions-import.module';
import { ExportModule } from './export/export.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EncryptionModule } from './encryption/encryption.module';
import { SecurityModule } from './security/security.module';
import { GdprModule } from './gdpr/gdpr.module';
import { DataRetentionModule } from './data-retention/data-retention.module';
// Note: ProductCustomerAssociationManagementModule is now deprecated
// ProductCustomerAssociationManagementController is in ProductsModule
// CustomerProductAssociationManagementController is in CompaniesModule

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      ignoreEnvFile: false,
    }),
    ScheduleModule.forRoot(), // For scheduled tasks (key rotation, backups, etc.)
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionModule,
    AuditModule,
    SettingsModule,
    MonitoringModule,
    // LogsModule, // TODO: LogsModule not implemented yet
    BackupModule,
    RestoreModule,
    ProductCategoriesModule,
    ProductsModule,
    CompaniesModule,
    InteractionsModule,
    AttachmentsModule,
    CustomersImportModule,
    ProductsImportModule,
    InteractionsImportModule,
    ExportModule,
    DashboardModule,
    EncryptionModule, // For data encryption and key management
    SecurityModule, // For HTTPS redirect and security headers (HSTS, etc.)
    GdprModule, // For GDPR data export requests
    DataRetentionModule, // For data retention policy and automatic cleanup
    // Note: ProductCustomerAssociationManagementModule is deprecated, controllers are in ProductsModule and CompaniesModule
  ],
})
export class AppModule {}

