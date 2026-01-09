/**
 * JSON Exporter Service
 * 
 * Handles JSON format data export
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ExportRecord } from '../types/export-record.types';

export interface ExportMetadata {
  exportType: string;
  format: string;
  totalRecords: number;
  exportedAt: string;
  version: string;
}

@Injectable()
export class JsonExporterService {
  private readonly logger = new Logger(JsonExporterService.name);

  /**
   * Export data to JSON file
   * @param data Array of records to export
   * @param filePath Output file path
   * @param metadata Optional metadata to include in the file
   * @param selectedFields Optional array of field names to maintain order
   */
  async exportToFile(
    data: ExportRecord[],
    filePath: string,
    metadata?: Partial<ExportMetadata>,
    selectedFields?: string[],
  ): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Note: Field filtering is already done in ExportProcessor.filterFields()
      // This method receives pre-filtered data, so we just use it as-is
      // The selectedFields parameter is kept for backward compatibility but not used here
      const orderedData = data;

      // Prepare export data with metadata
      const exportData = {
        metadata: {
          exportType: metadata?.exportType || 'unknown',
          format: 'JSON',
          totalRecords: data.length,
          exportedAt: new Date().toISOString(),
          version: metadata?.version || '1.0',
        },
        data: orderedData,
      };

      // Write JSON file
      fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf-8');

      this.logger.log(`Exported ${data.length} records to JSON file: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to export JSON file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Export data to JSON stream (for large datasets)
   * @param dataStream Stream of records
   * @param filePath Output file path
   * @param metadata Optional metadata
   */
  async exportToStream(
    dataStream: AsyncIterable<ExportRecord>,
    filePath: string,
    metadata?: Partial<ExportMetadata>,
  ): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const writeStream = fs.createWriteStream(filePath, { encoding: 'utf-8' });

      // Write metadata
      writeStream.write('{\n');
      writeStream.write('  "metadata": ');
      writeStream.write(
        JSON.stringify(
          {
            exportType: metadata?.exportType || 'unknown',
            format: 'JSON',
            exportedAt: new Date().toISOString(),
            version: metadata?.version || '1.0',
          },
          null,
          2,
        ),
      );
      writeStream.write(',\n');
      writeStream.write('  "data": [\n');

      let recordCount = 0;
      let isFirst = true;

      // Write data records
      for await (const record of dataStream) {
        if (!isFirst) {
          writeStream.write(',\n');
        }
        writeStream.write('    ');
        writeStream.write(JSON.stringify(record));
        isFirst = false;
        recordCount++;
      }

      writeStream.write('\n  ]\n');
      writeStream.write('}\n');
      writeStream.end();

      // Wait for stream to finish
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
      });

      this.logger.log(`Exported ${recordCount} records to JSON file (stream): ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to export JSON file (stream): ${filePath}`, error);
      throw error;
    }
  }
}

