/**
 * Excel Exporter Service
 * 
 * Handles Excel format data export
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { ExportRecord } from '../types/export-record.types';

@Injectable()
export class ExcelExporterService {
  private readonly logger = new Logger(ExcelExporterService.name);

  /**
   * Export data to Excel file
   * @param data Array of records to export
   * @param filePath Output file path
   * @param exportType Export data type (for sheet name)
   * @param selectedFields Optional array of field names to maintain order
   * @param displayNames Optional array of display names for headers (Chinese names)
   */
  async exportToFile(
    data: ExportRecord[],
    filePath: string,
    exportType?: string,
    selectedFields?: string[],
    displayNames?: string[],
  ): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Determine sheet name based on export type
      const sheetName = exportType === 'CUSTOMER' ? '客户' 
        : exportType === 'PRODUCT' ? '产品' 
        : exportType === 'INTERACTION' ? '互动记录' 
        : 'Sheet1';

      // Determine headers (use displayNames if provided, otherwise use selectedFields, otherwise use object keys)
      const excelHeaders = displayNames || selectedFields || (data.length > 0 ? Object.keys(data[0]) : []);
      
      if (data.length === 0) {
        // Create empty Excel file with headers only
        const worksheet = XLSX.utils.aoa_to_sheet([excelHeaders]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, filePath);
        this.logger.log(`Exported empty Excel file with headers: ${filePath}`);
        return;
      }

      // Use selectedFields to maintain order, or use object keys
      const fieldOrder = selectedFields || Object.keys(data[0]);

      // Prepare data for Excel (convert objects/arrays to JSON strings)
      const excelData = data.map(record => {
        return fieldOrder.map(field => {
          const value = record[field];
          if (value === null || value === undefined) {
            return '';
          }
          if (typeof value === 'object') {
            return JSON.stringify(value);
          }
          return value;
        });
      });

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet([excelHeaders, ...excelData]);

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Write Excel file
      XLSX.writeFile(workbook, filePath);

      this.logger.log(`Exported ${data.length} records to Excel file: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to export Excel file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Export data to Excel stream (for large datasets)
   * Note: XLSX library doesn't support true streaming, so we batch process
   * @param dataStream Stream of records
   * @param filePath Output file path
   * @param sheetName Optional sheet name
   * @param headers Optional custom headers
   * @param batchSize Batch size for processing (default: 1000)
   */
  async exportToStream(
    dataStream: AsyncIterable<ExportRecord>,
    filePath: string,
    sheetName: string = 'Sheet1',
    headers?: string[],
    batchSize: number = 1000,
  ): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let recordCount = 0;
      let excelHeaders: string[] | null = null;
      const batches: ExportRecord[][] = [];
      let currentBatch: ExportRecord[] = [];

      // Collect data in batches
      for await (const record of dataStream) {
        if (!excelHeaders) {
          excelHeaders = headers || Object.keys(record);
        }

        currentBatch.push(record);
        recordCount++;

        if (currentBatch.length >= batchSize) {
          batches.push(currentBatch);
          currentBatch = [];
        }
      }

      // Add remaining records
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
      }

      if (!excelHeaders) {
        excelHeaders = [];
      }

      // Process batches and create Excel file
      const allData: (string | number | boolean | null)[][] = [excelHeaders];

      for (const batch of batches) {
        const batchData: (string | number | boolean | null)[][] = batch.map(record => {
          return excelHeaders!.map(header => {
            const value = record[header];
            if (value === null || value === undefined) {
              return '';
            }
            if (typeof value === 'object') {
              return JSON.stringify(value);
            }
            return value as string | number | boolean | null;
          });
        });
        allData.push(...batchData);
      }

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(allData);

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Write Excel file
      XLSX.writeFile(workbook, filePath);

      this.logger.log(`Exported ${recordCount} records to Excel file (stream): ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to export Excel file (stream): ${filePath}`, error);
      throw error;
    }
  }
}

