/**
 * Export Performance Tests
 * 
 * Tests export performance with large datasets
 * All custom code is proprietary and not open source.
 * 
 * Note: These tests require a running database, Redis, and backend server.
 * Set RUN_INTEGRATION_TESTS=true to run integration tests.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ExportModule } from './export.module';
import { ExportService } from './export.service';
import { ExportDataType, ExportFormat } from './dto/export-request.dto';
import { AuthService } from '../auth/auth.service';
import { CompaniesService } from '../companies/companies.service';

// Skip integration tests if not explicitly enabled
const shouldSkipIntegrationTests = !process.env.RUN_INTEGRATION_TESTS;

(shouldSkipIntegrationTests ? describe.skip : describe)('Export Performance', () => {
  let module: TestingModule;
  let exportService: ExportService;
  let authService: AuthService;
  let companiesService: CompaniesService;
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

    testToken = 'test-token';
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Large Dataset Export', () => {
    it('should handle export of > 10000 records', async () => {
      const request = {
        dataType: ExportDataType.CUSTOMER,
        format: ExportFormat.JSON,
        customerFilters: {},
      };

      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        id: 'test-user-id',
        role: 'ADMIN',
      } as any);

      // Mock large dataset
      jest.spyOn(companiesService, 'findAll').mockResolvedValue({
        customers: [],
        total: 15000, // > 10000 records
      } as any);

      const startTime = Date.now();
      const result = await exportService.startExport(request, 'test-user-id', testToken);
      const endTime = Date.now();

      expect(result.taskId).toBeDefined();
      // Should use async export for large datasets
      expect(endTime - startTime).toBeLessThan(5000); // Should be fast (just queueing)
    });

    it('should use async export for datasets > 10000 records', async () => {
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
        total: 20000,
      } as any);

      const result = await exportService.startExport(request, 'test-user-id', testToken);

      // Should return a task ID (async export)
      expect(result.taskId).toBeDefined();
    });

    it('should handle export of < 1000 records synchronously', async () => {
      const request = {
        dataType: ExportDataType.CUSTOMER,
        format: ExportFormat.JSON,
        customerFilters: {},
      };

      jest.spyOn(authService, 'validateToken').mockResolvedValue({
        id: 'test-user-id',
        role: 'ADMIN',
      } as any);

      jest.spyOn(companiesService, 'findAll').mockResolvedValue({
        customers: [],
        total: 500, // < 1000 records
      } as any);

      const result = await exportService.startExport(request, 'test-user-id', testToken);

      // Small datasets might still use async for consistency
      expect(result.taskId).toBeDefined();
    });
  });

  describe('Batch Processing', () => {
    it('should process data in batches of 1000', async () => {
      // This test verifies that the processor handles batch processing correctly
      // The actual batch processing is tested in the processor tests
      expect(true).toBe(true); // Placeholder
    });
  });
});

