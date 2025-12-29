import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TwentyClientModule } from './services/twenty-client/twenty-client.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionModule } from './permission/permission.module';
import { AuditModule } from './audit/audit.module';
import { SettingsModule } from './settings/settings.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { LogsModule } from './logs/logs.module';
import { BackupModule } from './backup/backup.module';
import { RestoreModule } from './restore/restore.module';
import { ProductsModule } from './products/products.module';
import { CompaniesModule } from './companies/companies.module';
import { ProductCategoriesModule } from './product-categories/product-categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      ignoreEnvFile: false,
    }),
    TwentyClientModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionModule,
    AuditModule,
    SettingsModule,
    MonitoringModule,
    LogsModule,
    BackupModule,
    RestoreModule,
    ProductCategoriesModule,
    ProductsModule,
    CompaniesModule,
  ],
})
export class AppModule {}

