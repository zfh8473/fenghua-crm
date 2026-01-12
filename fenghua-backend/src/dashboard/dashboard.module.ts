import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PermissionModule } from '../permission/permission.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ProductAssociationAnalysisController } from './product-association-analysis.controller';
import { ProductAssociationAnalysisService } from './product-association-analysis.service';
import { CustomerAnalysisController } from './customer-analysis.controller';
import { CustomerAnalysisService } from './customer-analysis.service';

@Module({
  imports: [
    ConfigModule,
    PermissionModule,
    UsersModule, // For DirectorOrAdminGuard
    AuthModule, // For JwtAuthGuard
  ],
  controllers: [
    DashboardController,
    ProductAssociationAnalysisController,
    CustomerAnalysisController,
  ],
  providers: [
    DashboardService,
    ProductAssociationAnalysisService,
    CustomerAnalysisService,
  ],
  exports: [
    DashboardService,
    ProductAssociationAnalysisService,
    CustomerAnalysisService,
  ],
})
export class DashboardModule {}

