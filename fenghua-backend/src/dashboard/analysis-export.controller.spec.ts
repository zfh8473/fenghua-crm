/**
 * Analysis Export Controller Unit Tests
 * 
 * Tests for analysis export controller
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AnalysisExportController } from './analysis-export.controller';
import { AnalysisExportService } from './analysis-export.service';
import { AnalysisExportRequestDto, AnalysisType, ExportFormat } from './dto/analysis-export.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DirectorOrAdminGuard } from '../users/guards/director-or-admin.guard';

describe('AnalysisExportController', () => {
  let controller: AnalysisExportController;
  let service: jest.Mocked<AnalysisExportService>;

  const mockRequest = {
    headers: {
      authorization: 'Bearer mock-token',
    },
  };

  const mockResponse = {
    setHeader: jest.fn(),
    send: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisExportController],
      providers: [
        {
          provide: AnalysisExportService,
          useValue: {
            exportAnalysis: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(DirectorOrAdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AnalysisExportController>(AnalysisExportController);
    service = module.get(AnalysisExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exportAnalysis', () => {
    it('should export analysis results successfully', async () => {
      const requestDto: AnalysisExportRequestDto = {
        analysisType: AnalysisType.PRODUCT_ASSOCIATION,
        format: ExportFormat.CSV,
        queryParams: {},
      };

      const mockResult = {
        content: 'csv,content',
        contentType: 'text/csv; charset=utf-8',
        fileName: '产品关联分析_2025-01-01.csv',
      };

      service.exportAnalysis.mockResolvedValue(mockResult);

      await controller.exportAnalysis(requestDto, mockRequest, mockResponse);

      expect(service.exportAnalysis).toHaveBeenCalledWith(
        'mock-token',
        AnalysisType.PRODUCT_ASSOCIATION,
        ExportFormat.CSV,
        {},
        undefined,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', mockResult.contentType);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(mockResult.fileName)}"`,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(mockResult.content);
    });

    it('should handle buffer content', async () => {
      const requestDto: AnalysisExportRequestDto = {
        analysisType: AnalysisType.CUSTOMER,
        format: ExportFormat.EXCEL,
        queryParams: {},
      };

      const mockBuffer = Buffer.from('excel content');
      const mockResult = {
        content: mockBuffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileName: '客户分析_2025-01-01.xlsx',
      };

      service.exportAnalysis.mockResolvedValue(mockResult);

      await controller.exportAnalysis(requestDto, mockRequest, mockResponse);

      expect(mockResponse.send).toHaveBeenCalledWith(mockBuffer);
    });

    it('should handle BadRequestException', async () => {
      const requestDto: AnalysisExportRequestDto = {
        analysisType: AnalysisType.PRODUCT_ASSOCIATION,
        format: ExportFormat.CSV,
        queryParams: {},
      };

      const error = new BadRequestException('数据量过大');
      service.exportAnalysis.mockRejectedValue(error);

      await expect(
        controller.exportAnalysis(requestDto, mockRequest, mockResponse),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle missing analysis type or format', async () => {
      const requestDto = {
        format: ExportFormat.CSV,
      } as any;

      await expect(
        controller.exportAnalysis(requestDto, mockRequest, mockResponse),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle all export formats', async () => {
      const formats = [ExportFormat.CSV, ExportFormat.EXCEL, ExportFormat.PDF];

      for (const format of formats) {
        const requestDto: AnalysisExportRequestDto = {
          analysisType: AnalysisType.PRODUCT_ASSOCIATION,
          format,
          queryParams: {},
        };

        const mockResult = {
          content: format === ExportFormat.CSV ? 'csv' : Buffer.from('binary'),
          contentType: format === ExportFormat.CSV ? 'text/csv' : 'application/octet-stream',
          fileName: `test.${format === ExportFormat.EXCEL ? 'xlsx' : format}`,
        };

        service.exportAnalysis.mockResolvedValue(mockResult);

        await controller.exportAnalysis(requestDto, mockRequest, mockResponse);

        expect(service.exportAnalysis).toHaveBeenCalledWith(
          'mock-token',
          AnalysisType.PRODUCT_ASSOCIATION,
          format,
          {},
          undefined,
        );
      }
    });
  });
});

