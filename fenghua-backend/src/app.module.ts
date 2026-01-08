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
// import { LogsModule } from './logs/logs.module'; // TODO: LogsModule not implemented yet
import { BackupModule } from './backup/backup.module';
import { RestoreModule } from './restore/restore.module';
import { ProductsModule } from './products/products.module';
import { CompaniesModule } from './companies/companies.module';
import { PeopleModule } from './people/people.module';
import { ProductCategoriesModule } from './product-categories/product-categories.module';
import { InteractionsModule } from './interactions/interactions.module';
import { AttachmentsModule } from './attachments/attachments.module';
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
    TwentyClientModule,
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
    PeopleModule,
    InteractionsModule,
    AttachmentsModule,
    // Note: ProductCustomerAssociationManagementModule is deprecated, controllers are in ProductsModule and CompaniesModule
  ],
})
export class AppModule {}

