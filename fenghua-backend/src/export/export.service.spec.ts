/**
 * Export Service Tests
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import { ExportService } from './export.service';
import { JsonExporterService } from './services/json-exporter.service';
import { CsvExporterService } from './services/csv-exporter.service';
import { ExcelExporterService } from './services/excel-exporter.service';
import { CompaniesService } from '../companies/companies.service';
import { ProductsService } from '../products/products.service';
import { InteractionsService } from '../interactions/interactions.service';
import { AuthService } from '../auth/auth.service';
import { ExportDataType, ExportFormat } from './dto/export-request.dto';
import { Queue } from 'bullmq';

describe('ExportService', () => {
  let service: ExportService;
  let mockQueue: jest.Mocked<Queue>;
  let mockCompaniesService: jest.Mocked<CompaniesService>;
  let mockProductsService: jest.Mocked<ProductsService>;
  let mockInteractionsService: jest.Mocked<InteractionsService>;
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'test-task-id' }),
    } as any;

    mockCompaniesService = {
      findAll: jest.fn().mockResolvedValue({ customers: [], total: 0 }),
    } as any;

    mockProductsService = {
      findAll: jest.fn().mockResolvedValue({ products: [], total: 0 }),
    } as any;

    mockInteractionsService = {
      findAll: jest.fn().mockResolvedValue({ interactions: [], total: 0 }),
    } as any;

    mockAuthService = {
      validateToken: jest.fn().mockResolvedValue({
        id: 'user-id',
        role: 'ADMIN',
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'EXPORT_STORAGE_PATH') return '/tmp/exports';
              if (key === 'DATABASE_URL') return 'postgresql://user:pass@host:5432/testdb';
              return defaultValue;
            }),
          },
        },
        {
          provide: getQueueToken('export-queue'),
          useValue: mockQueue,
        },
        {
          provide: JsonExporterService,
          useValue: {
            exportToFile: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: CsvExporterService,
          useValue: {
            exportToFile: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ExcelExporterService,
          useValue: {
            exportToFile: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: CompaniesService,
          useValue: mockCompaniesService,
        },
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        {
          provide: InteractionsService,
          useValue: mockInteractionsService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
  });

  describe('startExport', () => {
    it('should start async export for large datasets', async () => {
      mockCompaniesService.findAll.mockResolvedValue({
        customers: [],
        total: 15000, // Large dataset
      });

      const request = {
        dataType: ExportDataType.CUSTOMER,
        format: ExportFormat.JSON,
        customerFilters: {},
      };

      const result = await service.startExport(request, 'user-id', 'token');

      expect(result.taskId).toBe('test-task-id');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'export-job',
        expect.objectContaining({
          exportType: ExportDataType.CUSTOMER,
          format: ExportFormat.JSON,
        }),
        expect.objectContaining({
          jobId: expect.any(String),
        }),
      );
    });

    it('should reject non-admin users', async () => {
      mockAuthService.validateToken.mockResolvedValue({
        id: 'user-id',
        role: 'FRONTEND_SPECIALIST',
      });

      const request = {
        dataType: ExportDataType.CUSTOMER,
        format: ExportFormat.JSON,
      };

      await expect(
        service.startExport(request, 'user-id', 'token'),
      ).rejects.toThrow('只有总监和管理员可以导出数据');
    });
  });

  describe('getExportTaskStatus', () => {
    it('should get export task status', async () => {
      const mockJob = {
        id: 'test-task-id',
        data: {
          exportType: ExportDataType.CUSTOMER,
          format: ExportFormat.JSON,
        },
        timestamp: Date.now(),
        finishedOn: null,
        getState: jest.fn().mockResolvedValue('processing'),
        progress: {
          processed: 100,
          total: 1000,
        },
      };

      mockQueue.getJob = jest.fn().mockResolvedValue(mockJob);

      const result = await service.getExportTaskStatus('test-task-id');

      expect(result.taskId).toBe('test-task-id');
      expect(result.dataType).toBe(ExportDataType.CUSTOMER);
      expect(result.format).toBe(ExportFormat.JSON);
    });
  });

  describe('generateFileName', () => {
    it('should generate file name with correct format', () => {
      const fileName = service.generateFileName(ExportDataType.CUSTOMER, ExportFormat.JSON);
      expect(fileName).toMatch(/^customer-.*\.json$/);
    });

    it('should generate Excel file name with .xlsx extension', () => {
      const fileName = service.generateFileName(ExportDataType.PRODUCT, ExportFormat.EXCEL);
      expect(fileName).toMatch(/^product-.*\.xlsx$/);
    });
  });
});


