/**
 * Excel Parser Service
 * 
 * Handles parsing of Excel files (.xlsx, .xls)
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';

export interface ParsedRow {
  [key: string]: any;
}

@Injectable()
export class ExcelParserService {
  private readonly logger = new Logger(ExcelParserService.name);

  /**
   * Parse Excel file and return rows
   */
  async parseFile(filePath: string): Promise<ParsedRow[]> {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });
      
      return data as ParsedRow[];
    } catch (error) {
      this.logger.error(`Failed to parse Excel file: ${filePath}`, error);
      throw new BadRequestException('无法解析 Excel 文件');
    }
  }

  /**
   * Get column names from Excel file
   */
  async getColumns(filePath: string): Promise<string[]> {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      
      const columns: string[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        const cell = worksheet[cellAddress];
        if (cell && cell.v) {
          columns.push(String(cell.v));
        }
      }
      
      return columns;
    } catch (error) {
      this.logger.error(`Failed to get columns from Excel file: ${filePath}`, error);
      throw new BadRequestException('无法读取 Excel 文件列名');
    }
  }
}

