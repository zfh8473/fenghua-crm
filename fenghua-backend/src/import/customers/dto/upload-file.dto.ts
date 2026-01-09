/**
 * DTOs for customer import file upload
 * All custom code is proprietary and not open source.
 */

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * DTO for file upload response
 */
export class UploadFileResponseDto {
  @IsString()
  @IsNotEmpty()
  fileId: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsOptional()
  tempFilePath?: string;
}

