/**
 * Customers Import Controller
 * 
 * Handles HTTP requests for customer data import
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ValidationPipe,
  Req,
  Res,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { CustomersImportService } from './customers-import.service';
import { UploadFileResponseDto } from './dto/upload-file.dto';
import { MappingPreviewRequestDto, MappingPreviewResponseDto } from './dto/mapping-preview.dto';
import { ValidationResultDto } from './dto/validation-result.dto';
import { ImportResultDto } from './dto/import-result.dto';
import { StartImportDto } from './dto/start-import.dto';
import { ImportHistoryQueryDto, ImportHistoryResponseDto } from './dto/import-history.dto';
import { ImportTaskDetailDto } from './dto/import-task-detail.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../users/guards/admin.guard';
import { Token } from '../../common/decorators/token.decorator';

@Controller('import/customers')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CustomersImportController {
  private readonly logger = new Logger(CustomersImportController.name);

  constructor(private readonly importService: CustomersImportService) {}

  /**
   * Upload import file
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Token() token: string,
  ): Promise<UploadFileResponseDto> {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    return this.importService.uploadFile(file);
  }

  /**
   * Get mapping preview
   */
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  async getMappingPreview(
    @Body(ValidationPipe) dto: MappingPreviewRequestDto,
    @Token() token: string,
  ): Promise<MappingPreviewResponseDto> {
    return this.importService.getMappingPreview(dto.fileId, dto.customMappings);
  }

  /**
   * Validate import data
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateImportData(
    @Body(ValidationPipe) dto: MappingPreviewRequestDto,
    @Token() token: string,
  ): Promise<ValidationResultDto> {
    return this.importService.validateImportData(dto.fileId, dto.customMappings || [], token);
  }

  /**
   * Start import task
   */
  @Post('start')
  @HttpCode(HttpStatus.ACCEPTED)
  async startImport(
    @Body(ValidationPipe) dto: StartImportDto,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<{ taskId: string }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('无法获取用户ID');
    }

    return this.importService.startImportTask(
      dto.fileId,
      dto.columnMappings || [],
      userId,
      token,
    );
  }

  /**
   * Get import task status
   */
  @Get('tasks/:taskId')
  @HttpCode(HttpStatus.OK)
  async getImportTaskStatus(
    @Param('taskId') taskId: string,
    @Token() token: string,
  ): Promise<ImportResultDto> {
    return this.importService.getImportTaskStatus(taskId);
  }

  /**
   * Get import history
   */
  @Get('history')
  @HttpCode(HttpStatus.OK)
  async getImportHistory(
    @Query(ValidationPipe) query: ImportHistoryQueryDto,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<ImportHistoryResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('无法获取用户ID');
    }

    const result = await this.importService.getImportHistory(
      userId,
      query.limit,
      query.offset,
      query.status,
      query.startDate,
      query.endDate,
      query.importType,
      query.search,
    );

    return {
      total: result.total,
      limit: query.limit || 20,
      offset: query.offset || 0,
      items: result.items,
    };
  }

  /**
   * Get import task detail
   */
  @Get('tasks/:taskId/details')
  @HttpCode(HttpStatus.OK)
  async getImportTaskDetail(
    @Param('taskId') taskId: string,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<ImportTaskDetailDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('无法获取用户ID');
    }

    return this.importService.getImportTaskDetail(taskId, userId);
  }

  /**
   * Get error details for an import task
   */
  @Get('tasks/:taskId/errors')
  @HttpCode(HttpStatus.OK)
  async getErrorDetails(
    @Param('taskId') taskId: string,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ items: any[]; total: number; limit: number; offset: number }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('无法获取用户ID');
    }

    const result = await this.importService.getErrorDetails(
      taskId,
      userId,
      limit || 100,
      offset || 0,
    );

    return {
      ...result,
      limit: limit || 100,
      offset: offset || 0,
    };
  }

  /**
   * Get import history statistics
   */
  @Get('history/stats')
  @HttpCode(HttpStatus.OK)
  async getImportHistoryStats(
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    total: number;
    completed: number;
    failed: number;
    partial: number;
    processing: number;
  }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('无法获取用户ID');
    }

    return this.importService.getImportHistoryStats(userId, startDate, endDate);
  }

  /**
   * Retry import with failed records
   */
  @Post('retry/:taskId')
  @HttpCode(HttpStatus.ACCEPTED)
  async retryImport(
    @Param('taskId') taskId: string,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<{ taskId: string }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('无法获取用户ID');
    }

    return this.importService.retryImport(taskId, userId, token);
  }

  /**
   * Download error report
   */
  @Get('reports/:taskId')
  async downloadErrorReport(
    @Param('taskId') taskId: string,
    @Token() token: string,
    @Res() res: Response,
    @Req() req: Request & { user?: { id: string } },
    @Query('format') format?: string,
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('无法获取用户ID');
    }

    // Get task detail to access error details
    const taskDetail = await this.importService.getImportTaskDetail(taskId, userId);
    
    if (!taskDetail.errorDetails || taskDetail.errorDetails.length === 0) {
      throw new NotFoundException('该导入任务没有错误记录');
    }

    // Validate format parameter
    const reportFormat = (format === 'csv' || format === 'xlsx') ? format : 'xlsx';
    if (format && format !== 'csv' && format !== 'xlsx') {
      throw new BadRequestException('无效的文件格式，仅支持 xlsx 或 csv');
    }
    
    // Generate report file on-the-fly if needed
    let reportPath: string;
    if (reportFormat === 'csv') {
      // Generate CSV from error_details
      const errorDetails = taskDetail.errorDetails;
      const csvContent = this.generateCsvFromErrorDetails(errorDetails);
      const tempFilePath = path.join(process.cwd(), 'tmp', `import-error-${taskId}-${Date.now()}.csv`);
      
      // Ensure tmp directory exists
      const tmpDir = path.dirname(tempFilePath);
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      
      fs.writeFileSync(tempFilePath, csvContent, 'utf8');
      reportPath = tempFilePath;
    } else {
      // Use existing Excel report or generate from error_details
      const existingPath = await this.importService.getErrorReportPath(taskId);
      if (existingPath && fs.existsSync(existingPath)) {
        reportPath = existingPath;
      } else {
        // Generate Excel from error_details
        const errorDetails = taskDetail.errorDetails;
        const tempFilePath = await this.generateExcelFromErrorDetails(taskId, errorDetails);
        reportPath = tempFilePath;
      }
    }

    if (!reportPath || !fs.existsSync(reportPath)) {
      throw new NotFoundException('错误报告文件生成失败');
    }

    const fileName = path.basename(reportPath);
    const contentType = reportFormat === 'csv' 
      ? 'text/csv' 
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

    const fileStream = fs.createReadStream(reportPath);
    
    // Track if this is a temporary file that needs cleanup
    // For CSV, always temporary. For XLSX, temporary if no existing report was found
    const existingReportPath = reportFormat === 'xlsx' ? await this.importService.getErrorReportPath(taskId) : null;
    const isTemporaryFile = reportPath.includes('tmp') && (reportFormat === 'csv' || (!existingReportPath && reportFormat === 'xlsx'));
    
    fileStream.on('error', (error) => {
      this.logger.error('Error streaming file', error);
      if (isTemporaryFile) {
        // Clean up on error
        setTimeout(() => {
          try {
            if (fs.existsSync(reportPath)) {
              fs.unlinkSync(reportPath);
            }
          } catch (cleanupError) {
            this.logger.warn('Failed to cleanup temporary file on error', cleanupError);
          }
        }, 1000);
      }
    });
    
    fileStream.pipe(res);
    
    // Clean up temporary file after streaming completes
    res.on('finish', () => {
      if (isTemporaryFile) {
        // Use longer delay to ensure file is fully written and streamed
        setTimeout(() => {
          try {
            if (fs.existsSync(reportPath)) {
              fs.unlinkSync(reportPath);
              this.logger.debug(`Cleaned up temporary file: ${reportPath}`);
            }
          } catch (error) {
            this.logger.warn(`Failed to cleanup temporary file: ${reportPath}`, error);
          }
        }, 2000);
      }
    });
  }

  /**
   * Generate CSV content from error details
   */
  private generateCsvFromErrorDetails(errorDetails: any[]): string {
    if (errorDetails.length === 0) {
      return '';
    }

    // Get all unique keys from error details
    const allKeys = new Set<string>();
    errorDetails.forEach(detail => {
      Object.keys(detail.data || {}).forEach(key => allKeys.add(key));
      allKeys.add('_row_number');
      allKeys.add('_error_message');
      allKeys.add('_error_fields');
    });

    const headers = Array.from(allKeys);
    
    const rows = errorDetails.map(detail => {
      const row: string[] = [];
      headers.forEach(header => {
        let value = '';
        if (header === '_row_number') {
          value = String(detail.row);
        } else if (header === '_error_message') {
          value = detail.errors?.map((e: any) => `${e.field}: ${e.message}`).join('; ') || '';
        } else if (header === '_error_fields') {
          value = detail.errors?.map((e: any) => e.field).join(',') || '';
        } else {
          value = detail.data?.[header] || '';
        }
        // Escape CSV values
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${String(value).replace(/"/g, '""')}"`;
        }
        row.push(value);
      });
      return row.join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Generate Excel file from error details
   */
  private async generateExcelFromErrorDetails(taskId: string, errorDetails: any[]): Promise<string> {
    const reportData = errorDetails.map(detail => {
      const row: Record<string, any> = {
        '_row_number': detail.row,
        ...detail.data,
      };
      const errorMessages = detail.errors?.map((e: any) => `${e.field}: ${e.message}`).join('; ') || '';
      const errorFields = detail.errors?.map((e: any) => e.field).join(',') || '';
      row['_error_message'] = errorMessages;
      row['_error_fields'] = errorFields;
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '失败记录');

    const tempFilePath = path.join(process.cwd(), 'tmp', `import-error-${taskId}-${Date.now()}.xlsx`);
    const tmpDir = path.dirname(tempFilePath);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    XLSX.writeFile(workbook, tempFilePath);
    return tempFilePath;
  }
}

