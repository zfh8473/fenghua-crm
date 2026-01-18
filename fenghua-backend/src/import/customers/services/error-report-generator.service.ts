/**
 * Error Report Generator Service
 * 
 * Generates Excel files for failed import records
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { createWriteStream } from 'fs';

export interface FailedRecord {
  row: number;
  data: Record<string, any>;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

@Injectable()
export class ErrorReportGeneratorService {
  private readonly logger = new Logger(ErrorReportGeneratorService.name);
  private readonly reportsDir: string;

  constructor(private readonly configService: ConfigService) {
    const isVercel = process.env.VERCEL === '1' || process.env.DEPLOYMENT_PLATFORM === 'vercel';
    this.reportsDir = isVercel
      ? '/tmp/import-reports'
      : this.configService.get<string>('IMPORT_ERROR_REPORTS_DIR', path.join(process.cwd(), 'tmp', 'import-reports'));
    this.ensureReportsDirExists(isVercel);
  }

  /**
   * Ensure reports directory exists
   * @param isVercel - on Vercel, do not throw on mkdir failure (only /tmp is writable)
   */
  private ensureReportsDirExists(isVercel = false): void {
    try {
      if (!fs.existsSync(this.reportsDir)) {
        fs.mkdirSync(this.reportsDir, { recursive: true });
        this.logger.log(`Created error reports directory: ${this.reportsDir}`);
      }
    } catch (e) {
      if (isVercel) {
        this.logger.warn(`Could not create reports dir ${this.reportsDir}, error reports may fail: ${(e as Error)?.message}`);
      } else {
        throw e;
      }
    }
  }

  /**
   * Generate error report Excel file
   */
  async generateErrorReport(
    taskId: string,
    failedRecords: FailedRecord[],
  ): Promise<string> {
    if (failedRecords.length === 0) {
      throw new Error('No failed records to generate report');
    }

    // Prepare data for Excel
    const reportData = failedRecords.map(record => {
      const row: Record<string, any> = {
        '行号': record.row,
        ...record.data,
      };

      // Add error messages column
      const errorMessages = record.errors.map(e => `${e.field}: ${e.message}`).join('; ');
      row['错误信息'] = errorMessages;

      return row;
    });

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '失败记录');

    // Generate file path
    const fileName = `import-error-${taskId}-${Date.now()}.xlsx`;
    const filePath = path.join(this.reportsDir, fileName);

    // Write file
    XLSX.writeFile(workbook, filePath);

    this.logger.log(`Generated error report: ${filePath}`);

    return filePath;
  }

  /**
   * Generate error report CSV file
   */
  async generateErrorReportCsv(
    taskId: string,
    failedRecords: FailedRecord[],
  ): Promise<string> {
    if (failedRecords.length === 0) {
      throw new Error('No failed records to generate report');
    }

    // Prepare data for CSV
    const reportData = failedRecords.map(record => {
      const row: Record<string, any> = {
        '_row_number': record.row,
        ...record.data,
      };

      // Add error messages column
      const errorMessages = record.errors.map(e => `${e.field}: ${e.message}`).join('; ');
      const errorFields = record.errors.map(e => e.field).join(',');
      row['_error_message'] = errorMessages;
      row['_error_fields'] = errorFields;

      return row;
    });

    // Generate file path
    const fileName = `import-error-${taskId}-${Date.now()}.csv`;
    const filePath = path.join(this.reportsDir, fileName);

    // Write CSV file
    const headers = Object.keys(reportData[0]);
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape CSV values
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      ),
    ].join('\n');

    fs.writeFileSync(filePath, csvContent, 'utf8');

    this.logger.log(`Generated error report CSV: ${filePath}`);

    return filePath;
  }

  /**
   * Get error report file path
   */
  getErrorReportPath(taskId: string, format: 'xlsx' | 'csv' = 'xlsx'): string | null {
    const extension = format === 'csv' ? '.csv' : '.xlsx';
    const files = fs.readdirSync(this.reportsDir).filter(f => 
      f.startsWith(`import-error-${taskId}-`) && f.endsWith(extension)
    );
    if (files.length === 0) {
      return null;
    }
    // Return the most recent file
    const sortedFiles = files.sort().reverse();
    return path.join(this.reportsDir, sortedFiles[0]);
  }

  /**
   * Clean up old error reports (older than 7 days)
   */
  async cleanupOldReports(): Promise<void> {
    const files = fs.readdirSync(this.reportsDir);
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(this.reportsDir, file);
      const stats = fs.statSync(filePath);
      if (stats.mtimeMs < sevenDaysAgo) {
        try {
          fs.unlinkSync(filePath);
          this.logger.log(`Cleaned up old error report: ${filePath}`);
        } catch (error) {
          this.logger.warn(`Failed to cleanup error report: ${filePath}`, error);
        }
      }
    }
  }
}

