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
import { SupplierAnalysisController } from './supplier-analysis.controller';
import { SupplierAnalysisService } from './supplier-analysis.service';
import { BuyerAnalysisController } from './buyer-analysis.controller';
import { BuyerAnalysisService } from './buyer-analysis.service';
import { BusinessTrendAnalysisController } from './business-trend-analysis.controller';
import { BusinessTrendAnalysisService } from './business-trend-analysis.service';
import { AnalysisExportController } from './analysis-export.controller';
import { AnalysisExportService } from './analysis-export.service';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [
    ConfigModule,
    PermissionModule,
    UsersModule, // For DirectorOrAdminGuard
    AuthModule, // For JwtAuthGuard
    ExportModule, // For ExcelExporterService and CsvExporterService
  ],
  controllers: [
    DashboardController,
    ProductAssociationAnalysisController,
    CustomerAnalysisController,
    SupplierAnalysisController,
    BuyerAnalysisController,
    BusinessTrendAnalysisController,
    AnalysisExportController,
  ],
  providers: [
    DashboardService,
    ProductAssociationAnalysisService,
    CustomerAnalysisService,
    SupplierAnalysisService,
    BuyerAnalysisService,
    BusinessTrendAnalysisService,
    AnalysisExportService,
  ],
  exports: [
    DashboardService,
    ProductAssociationAnalysisService,
    CustomerAnalysisService,
    SupplierAnalysisService,
    BuyerAnalysisService,
    BusinessTrendAnalysisService,
    AnalysisExportService,
  ],
})
export class DashboardModule {}

