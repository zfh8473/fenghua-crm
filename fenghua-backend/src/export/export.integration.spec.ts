/**
 * Export Integration Tests
 * 
 * Tests the complete export workflow
 * All custom code is proprietary and not open source.
 * 
 * Note: These tests require a running database, Redis, and backend server.
 * Set RUN_INTEGRATION_TESTS=true to run integration tests.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ExportModule } from './export.module';
import { ExportService } from './export.service';
import { ExportDataType, ExportFormat } from './dto/export-request.dto';
import { AuthService } from '../auth/auth.service';
import { CompaniesService } from '../companies/companies.service';
import { ProductsService } from '../products/products.service';
import { InteractionsService } from '../interactions/interactions.service';

// Skip integration tests if not explicitly enabled
const shouldSkipIntegrationTests = !process.env.RUN_INTEGRATION_TESTS;

(shouldSkipIntegrationTests ? describe.skip : describe)('Export Integration', () => {
  let module: TestingModule;
  let exportService: ExportService;
  let authService: AuthService;
  let companiesService: CompaniesService;
  let productsService: ProductsService;
  let interactionsService: InteractionsService;
  let testToken: string;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        ExportModule,
      ],
    }).compile();

    exportService = module.get<ExportService>(ExportService);
    authService = module.get<AuthService>(AuthService);
    companiesService = module.get<CompaniesService>(CompaniesService);
    productsService = module.get<ProductsService>(ProductsService);
    interactionsService = module.get<InteractionsService>(InteractionsService);

    // Create a test token (this would normally be done through login)
    // For testing, we'll use a mock token
    testToken = 'test-token';
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Customer Export Workflow', () => {
    it('should export customer data to JSON', async () => {
      const request = {
        dataType: ExportDataType.CUSTOMER,
        format: ExportFormat.JSON,
        customerFilters: {},
      };

      // Mock user authentication
      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        id: 'test-user-id',
        role: 'ADMIN',
      } as any);

      // Mock customer data
      jest.spyOn(companiesService, 'findAll').mockResolvedValue({
        customers: [
          {
            id: 'customer-1',
            name: 'Test Customer',
            customerCode: 'BUYER001',
            customerType: 'BUYER',
          },
        ],
        total: 1,
      } as any);

      const result = await exportService.startExport(request, 'test-user-id', testToken);

      expect(result.taskId).toBeDefined();
    });

    it('should export customer data to CSV', async () => {
      const request = {
        dataType: ExportDataType.CUSTOMER,
        format: ExportFormat.CSV,
        customerFilters: {},
      };

      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        id: 'test-user-id',
        role: 'ADMIN',
      } as any);

      jest.spyOn(companiesService, 'findAll').mockResolvedValue({
        customers: [],
        total: 0,
      } as any);

      const result = await exportService.startExport(request, 'test-user-id', testToken);

      expect(result.taskId).toBeDefined();
    });

    it('should export customer data to Excel', async () => {
      const request = {
        dataType: ExportDataType.CUSTOMER,
        format: ExportFormat.EXCEL,
        customerFilters: {},
      };

      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        id: 'test-user-id',
        role: 'ADMIN',
      } as any);

      jest.spyOn(companiesService, 'findAll').mockResolvedValue({
        customers: [],
        total: 0,
      } as any);

      const result = await exportService.startExport(request, 'test-user-id', testToken);

      expect(result.taskId).toBeDefined();
    });
  });

  describe('Product Export Workflow', () => {
    it('should export product data to JSON', async () => {
      const request = {
        dataType: ExportDataType.PRODUCT,
        format: ExportFormat.JSON,
        productFilters: {},
      };

      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        id: 'test-user-id',
        role: 'ADMIN',
      } as any);

      jest.spyOn(productsService, 'findAll').mockResolvedValue({
        products: [],
        total: 0,
      } as any);

      const result = await exportService.startExport(request, 'test-user-id', testToken);

      expect(result.taskId).toBeDefined();
    });
  });

  describe('Interaction Export Workflow', () => {
    it('should export interaction data to JSON', async () => {
      const request = {
        dataType: ExportDataType.INTERACTION,
        format: ExportFormat.JSON,
        interactionFilters: {},
      };

      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        id: 'test-user-id',
        role: 'ADMIN',
      } as any);

      jest.spyOn(interactionsService, 'findAll').mockResolvedValue({
        interactions: [],
        total: 0,
      } as any);

      const result = await exportService.startExport(request, 'test-user-id', testToken);

      expect(result.taskId).toBeDefined();
    });
  });
});

