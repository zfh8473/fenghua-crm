/**
 * CSV Exporter Service
 * 
 * Handles CSV format data export
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger } from '@nestjs/common';
import { stringify } from 'csv-stringify/sync';
import * as fs from 'fs';
import * as path from 'path';
import { ExportRecord } from '../types/export-record.types';

@Injectable()
export class CsvExporterService {
  private readonly logger = new Logger(CsvExporterService.name);

  /**
   * Export data to CSV file
   * @param data Array of records to export
   * @param filePath Output file path
   * @param selectedFields Optional array of field names to maintain order
   * @param displayNames Optional array of display names for headers (Chinese names)
   */
  async exportToFile(
    data: ExportRecord[],
    filePath: string,
    selectedFields?: string[],
    displayNames?: string[],
  ): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Determine headers (use displayNames if provided, otherwise use selectedFields, otherwise use object keys)
      const csvHeaders = displayNames || selectedFields || (data.length > 0 ? Object.keys(data[0]) : []);
      
      if (data.length === 0) {
        // Create empty CSV file with headers only
        fs.writeFileSync(filePath, csvHeaders.join(',') + '\n', 'utf-8');
        this.logger.log(`Exported empty CSV file with headers: ${filePath}`);
        return;
      }

      // Use selectedFields to maintain order, or use object keys
      const fieldOrder = selectedFields || Object.keys(data[0]);

      // Convert data to CSV format
      const csvData = data.map(record => {
        return fieldOrder.map(field => {
          const value = record[field];
          // Handle null/undefined
          if (value === null || value === undefined) {
            return '';
          }
          // Handle objects/arrays (convert to JSON string)
          if (typeof value === 'object') {
            return JSON.stringify(value);
          }
          // Handle strings with commas or newlines (wrap in quotes)
          if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        });
      });

      // Generate CSV content
      const csvContent = stringify([csvHeaders, ...csvData], {
        header: false,
        quoted: true,
        quoted_empty: true,
      });

      // Write CSV file
      fs.writeFileSync(filePath, csvContent, 'utf-8');

      this.logger.log(`Exported ${data.length} records to CSV file: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to export CSV file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Export data to CSV stream (for large datasets)
   * @param dataStream Stream of records
   * @param filePath Output file path
   * @param headers Optional custom headers
   */
  async exportToStream(
    dataStream: AsyncIterable<ExportRecord>,
    filePath: string,
    headers?: string[],
  ): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const writeStream = fs.createWriteStream(filePath, { encoding: 'utf-8' });

      let recordCount = 0;
      let csvHeaders: string[] | null = null;

      // Write data records
      for await (const record of dataStream) {
        // Determine headers from first record
        if (!csvHeaders) {
          csvHeaders = headers || Object.keys(record);
          // Write headers
          const headerLine = stringify([csvHeaders], {
            header: false,
            quoted: true,
          });
          writeStream.write(headerLine);
        }

        // Convert record to CSV row
        const row = csvHeaders.map(header => {
          const value = record[header];
          if (value === null || value === undefined) {
            return '';
          }
          if (typeof value === 'object') {
            return JSON.stringify(value);
          }
          if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        });

        const rowLine = stringify([row], {
          header: false,
          quoted: true,
        });
        writeStream.write(rowLine);
        recordCount++;
      }

      writeStream.end();

      // Wait for stream to finish
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
      });

      this.logger.log(`Exported ${recordCount} records to CSV file (stream): ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to export CSV file (stream): ${filePath}`, error);
      throw error;
    }
  }
}

