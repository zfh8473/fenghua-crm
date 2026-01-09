/**
 * CSV Parser Service
 * 
 * Handles parsing of CSV files
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as csv from 'csv-parser';

export interface ParsedRow {
  [key: string]: any;
}

@Injectable()
export class CsvParserService {
  private readonly logger = new Logger(CsvParserService.name);

  /**
   * Parse CSV file and return rows
   */
  async parseFile(filePath: string): Promise<ParsedRow[]> {
    return new Promise((resolve, reject) => {
      // Check if file exists first
      if (!fs.existsSync(filePath)) {
        reject(new BadRequestException('无法解析 CSV 文件'));
        return;
      }

      const results: ParsedRow[] = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          // Filter out empty rows
          if (Object.keys(data).length > 0 && Object.values(data).some(v => v && String(v).trim())) {
            results.push(data);
          }
        })
        .on('end', () => resolve(results))
        .on('error', (error) => {
          this.logger.error(`Failed to parse CSV file: ${filePath}`, error);
          reject(new BadRequestException('无法解析 CSV 文件'));
        });
    });
  }

  /**
   * Get column names from CSV file
   */
  async getColumns(filePath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      // Check if file exists first
      if (!fs.existsSync(filePath)) {
        reject(new BadRequestException('无法读取 CSV 文件列名'));
        return;
      }

      const columns: string[] = [];
      let headersRead = false;
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headers: string[]) => {
          columns.push(...headers);
          headersRead = true;
          resolve(columns);
        })
        .on('data', (data) => {
          // If headers event didn't fire, get keys from first row
          if (!headersRead && columns.length === 0) {
            columns.push(...Object.keys(data));
            resolve(columns);
          }
        })
        .on('end', () => {
          if (columns.length === 0) {
            reject(new BadRequestException('无法读取 CSV 文件列名'));
          } else {
            resolve(columns);
          }
        })
        .on('error', (error) => {
          this.logger.error(`Failed to get columns from CSV file: ${filePath}`, error);
          reject(new BadRequestException('无法读取 CSV 文件列名'));
        });
    });
  }
}

