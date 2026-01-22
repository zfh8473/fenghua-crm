/**
 * People Controller
 * 
 * Provides REST endpoints for people (contact) CRUD operations with role-based filtering
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Logger,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PeopleService } from './people.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonResponseDto } from './dto/person-response.dto';
import { PersonQueryDto } from './dto/person-query.dto';
import { Token } from '../common/decorators/token.decorator';
import { DataAccessAuditInterceptor } from '../audit/interceptors/data-access-audit.interceptor';
import { DataModificationAuditInterceptor } from '../audit/interceptors/data-modification-audit.interceptor';
import { EncryptionInterceptor } from '../encryption/interceptors/encryption.interceptor';
import { DecryptionInterceptor } from '../encryption/interceptors/decryption.interceptor';

@Controller('people')
@UseGuards(JwtAuthGuard)
@UseInterceptors(
  EncryptionInterceptor,           // 写入时：先加密（POST/PUT/PATCH）
  DataModificationAuditInterceptor, // 写入时：记录修改（数据已加密）
  DecryptionInterceptor,            // 读取时：先解密（GET）
  DataAccessAuditInterceptor        // 读取时：记录访问（数据已解密）
)
export class PeopleController {
  private readonly logger = new Logger(PeopleController.name);

  constructor(private readonly peopleService: PeopleService) {}

  /**
   * Create a new person (contact)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createPersonDto: CreatePersonDto,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<PersonResponseDto> {
    const userId = req.user?.id;
    return this.peopleService.create(createPersonDto, token, userId);
  }

  /**
   * Get all people (contacts) with pagination and role-based filtering
   */
  @Get()
  async findAll(
    @Query(ValidationPipe) query: PersonQueryDto,
    @Token() token: string,
  ): Promise<{ people: PersonResponseDto[]; total: number }> {
    try {
      this.logger.log(`[Controller] Received GET /people request with query: ${JSON.stringify(query)}`);
      const result = await this.peopleService.findAll(query, token);
      this.logger.log(`[Controller] Returning ${result.people.length} people`);
      return result;
    } catch (error) {
      this.logger.error('[Controller] Error in findAll', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        query: query,
      });
      throw error;
    }
  }

  /**
   * Get one person by ID
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Token() token: string,
  ): Promise<PersonResponseDto> {
    return this.peopleService.findOne(id, token, true);
  }

  /**
   * Update a person
   */
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updatePersonDto: UpdatePersonDto,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<PersonResponseDto> {
    const userId = req.user?.id;
    return this.peopleService.update(id, updatePersonDto, token, userId);
  }

  /**
   * Delete a person (soft delete)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<void> {
    const userId = req.user?.id;
    return this.peopleService.remove(id, token, userId);
  }

  /**
   * Get interactions by person ID
   */
  @Get(':id/interactions')
  async findInteractionsByPersonId(
    @Param('id', ParseUUIDPipe) id: string,
    @Token() token: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ interactions: any[]; total: number }> {
    const limitNum = limit ? parseInt(String(limit), 10) : 20;
    const offsetNum = offset ? parseInt(String(offset), 10) : 0;
    return this.peopleService.findInteractionsByPersonId(id, token, limitNum, offsetNum);
  }
}
