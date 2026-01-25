/**
 * People Service
 * 
 * Handles CRUD operations for people (contacts) with role-based data filtering
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PermissionService } from '../permission/permission.service';
import { PermissionAuditService } from '../permission/permission-audit.service';
import { AuditService } from '../audit/audit.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonResponseDto, PersonCompanyDto } from './dto/person-response.dto';
import { PersonQueryDto } from './dto/person-query.dto';

@Injectable()
export class PeopleService implements OnModuleDestroy {
  private readonly logger = new Logger(PeopleService.name);
  private pgPool: Pool | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly permissionService: PermissionService,
    private readonly permissionAuditService: PermissionAuditService,
    private readonly auditService: AuditService,
  ) {
    this.initializeDatabaseConnection();
  }

  /**
   * Initialize PostgreSQL connection pool
   */
  private initializeDatabaseConnection(): void {
    const databaseUrl =
      this.configService.get<string>('DATABASE_URL') ||
      this.configService.get<string>('PG_DATABASE_URL');

    if (!databaseUrl) {
      this.logger.warn('DATABASE_URL not configured, people operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10, // Connection pool size
      });
      this.logger.log('PostgreSQL connection pool initialized for PeopleService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  /**
   * Check if email is unique (globally unique, but can match company email)
   */
  private async checkEmailUnique(email: string, excludeId?: string): Promise<boolean> {
    if (!this.pgPool || !email) {
      return true; // If no email provided, skip uniqueness check
    }

    try {
      let query = 'SELECT COUNT(*) as count FROM people WHERE email = $1 AND deleted_at IS NULL';
      const params: (string | undefined)[] = [email];

      if (excludeId) {
        query += ' AND id != $2';
        params.push(excludeId);
      }

      const result = await this.pgPool.query(query, params);
      return parseInt(result.rows[0].count, 10) === 0;
    } catch (error) {
      this.logger.error('Failed to check email uniqueness', error);
      return false;
    }
  }

  /**
   * Validate that at least one name field is provided
   */
  private validateNameFields(firstName?: string, lastName?: string): void {
    const firstNameTrimmed = firstName?.trim();
    const lastNameTrimmed = lastName?.trim();
    if (!firstNameTrimmed && !lastNameTrimmed) {
      throw new BadRequestException('姓名至少需要提供名字或姓氏中的一个');
    }
  }

  /**
   * Create a new person (contact)
   */
  async create(createPersonDto: CreatePersonDto, token: string, userId: string): Promise<PersonResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // 1. Validate name fields
    this.validateNameFields(createPersonDto.firstName, createPersonDto.lastName);

    // 2. Get user permissions and data access filter
    const dataFilter = await this.permissionService.getDataAccessFilter(token);

    // 3. Check if user has permission to create contact for this company
    // First, check if company exists and get its customer type
    const companyResult = await this.pgPool.query(
      'SELECT id, customer_type FROM companies WHERE id = $1 AND deleted_at IS NULL',
      [createPersonDto.companyId]
    );

    if (companyResult.rows.length === 0) {
      throw new NotFoundException('关联的客户不存在');
    }

    const companyCustomerType = companyResult.rows[0].customer_type;

    // Apply permission filter based on company's customer type
    if (dataFilter?.customerType) {
      const allowedType = dataFilter.customerType.toUpperCase();
      if (companyCustomerType !== allowedType) {
        await this.permissionAuditService.logPermissionViolation(
          token,
          'PERSON',
          null,
          'CREATE',
          allowedType,
          companyCustomerType,
        );
        throw new ForbiddenException(
          `您没有权限为${companyCustomerType === 'BUYER' ? '采购商' : '供应商'}类型的客户创建联系人`
        );
      }
    }

    // 4. Validate email uniqueness (if provided)
    if (createPersonDto.email) {
      const isEmailUnique = await this.checkEmailUnique(createPersonDto.email);
      if (!isEmailUnique) {
        throw new ConflictException('邮箱已被使用');
      }
    }

    // 5. Validate userId format
    let validUserId: string | null = userId;
    if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      this.logger.warn(`Invalid userId format (not UUID): ${userId}, using null for created_by`);
      validUserId = null;
    }

    try {
      const result = await this.pgPool.query(
        `INSERT INTO people (
          first_name, last_name, email, phone, mobile, job_title, department,
          linkedin_url, wechat, whatsapp, facebook, notes, company_id, is_important, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          createPersonDto.firstName?.trim() || null,
          createPersonDto.lastName?.trim() || null,
          createPersonDto.email?.trim() || null,
          createPersonDto.phone?.trim() || null,
          createPersonDto.mobile?.trim() || null,
          createPersonDto.jobTitle?.trim() || null,
          createPersonDto.department?.trim() || null,
          createPersonDto.linkedinUrl?.trim() || null,
          createPersonDto.wechat?.trim() || null,
          createPersonDto.whatsapp?.trim() || null,
          createPersonDto.facebook?.trim() || null,
          createPersonDto.notes?.trim() || null,
          createPersonDto.companyId,
          createPersonDto.isImportant ?? false,
          validUserId,
        ]
      );

      const person = result.rows[0];
      const personDto = await this.mapToResponseDto(person, false);

      // 6. Audit log
      try {
        await this.auditService.log({
          action: 'CREATE',
          entityType: 'PERSON',
          entityId: personDto.id,
          userId: validUserId || 'system',
          operatorId: validUserId || 'system',
          timestamp: new Date(),
          metadata: {
            personName: `${personDto.firstName || ''} ${personDto.lastName || ''}`.trim(),
            companyId: personDto.companyId,
          },
        });
      } catch (error) {
        this.logger.warn('Failed to log audit entry for person create', error);
      }

      return personDto;
    } catch (error) {
      if (error instanceof ConflictException || error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to create person', error);
      throw new BadRequestException('创建联系人失败');
    }
  }

  /**
   * Find all people (contacts) with pagination and role-based filtering
   */
  async findAll(query: PersonQueryDto, token: string): Promise<{ people: PersonResponseDto[]; total: number }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    const limit = query.limit || 20;
    const offset = query.offset || 0;

    try {
      this.logger.log(`[findAll] Starting people query with params: ${JSON.stringify(query)}`);

      // 1. Get user permissions and data access filter
      let dataFilter;
      try {
        this.logger.log('[findAll] Getting data access filter...');
        dataFilter = await this.permissionService.getDataAccessFilter(token);
        this.logger.log(`[findAll] Data access filter: ${JSON.stringify(dataFilter)}`);
      } catch (permissionError) {
        this.logger.error('[findAll] Failed to get data access filter', {
          error: permissionError instanceof Error ? permissionError.message : String(permissionError),
        });
        throw new BadRequestException({
          message: `获取用户权限失败: ${permissionError instanceof Error ? permissionError.message : String(permissionError)}`,
          error: 'PERMISSION_CHECK_FAILED',
        });
      }

      // 2. Convert customer_type to uppercase
      const customerTypeFilter = dataFilter?.customerType
        ? dataFilter.customerType.toUpperCase()
        : null;

      // 3. Handle permission check failure
      if (dataFilter?.customerType === 'NONE') {
        await this.permissionAuditService.logPermissionViolation(token, 'PERSON', null, 'ACCESS', null, null);
        throw new ForbiddenException('您没有权限查看联系人信息');
      }

      // 4. Build query conditions
      let whereClause = 'WHERE p.deleted_at IS NULL AND c.deleted_at IS NULL';
      const params: (string | number | boolean)[] = [];
      let paramIndex = 1;

      // Apply role-based customer type filter (through company)
      if (customerTypeFilter) {
        whereClause += ` AND c.customer_type = $${paramIndex}`;
        params.push(customerTypeFilter);
        paramIndex++;
      }

      // Apply query parameter filters
      if (query.companyId) {
        whereClause += ` AND p.company_id = $${paramIndex}`;
        params.push(query.companyId);
        paramIndex++;
      }

      if (query.isImportant !== undefined) {
        whereClause += ` AND p.is_important = $${paramIndex}`;
        params.push(query.isImportant);
        paramIndex++;
      }

      if (query.search) {
        whereClause += ` AND (
          p.first_name ILIKE $${paramIndex} OR
          p.last_name ILIKE $${paramIndex} OR
          p.email ILIKE $${paramIndex} OR
          p.job_title ILIKE $${paramIndex} OR
          p.department ILIKE $${paramIndex}
        )`;
        params.push(`%${query.search}%`);
        paramIndex++;
      }

      // 5. Get total count
      const countResult = await this.pgPool.query(
        `SELECT COUNT(*) as total
         FROM people p
         INNER JOIN companies c ON c.id = p.company_id
         ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].total, 10);

      // 6. Get people list
      const allParams = [...params, limit, offset];
      const limitParamIndex = paramIndex;
      const offsetParamIndex = paramIndex + 1;

      const peopleResult = await this.pgPool.query(
        `SELECT p.*, c.id as company_id_from_join, c.name as company_name, c.customer_code, c.customer_type
         FROM people p
         INNER JOIN companies c ON c.id = p.company_id
         ${whereClause}
         ORDER BY p.created_at DESC
         LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
        allParams
      );

      const people = await Promise.all(
        peopleResult.rows.map(row => this.mapToResponseDto(row, true))
      );

      return { people, total };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('[findAll] Failed to find people', {
        error: error instanceof Error ? error.message : String(error),
        query: query,
      });
      throw new BadRequestException({
        message: `查询联系人列表失败: ${error instanceof Error ? error.message : String(error)}`,
        error: 'PEOPLE_QUERY_FAILED',
      });
    }
  }

  /**
   * Get a person by ID with role-based filtering
   */
  async findOne(id: string, token: string, includeCompany: boolean = true): Promise<PersonResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      // 1. Get user permissions and data access filter
      const dataFilter = await this.permissionService.getDataAccessFilter(token);

      // 2. Convert customer_type to uppercase
      const customerTypeFilter = dataFilter?.customerType
        ? dataFilter.customerType.toUpperCase()
        : null;

      // 3. Handle permission check failure
      if (dataFilter?.customerType === 'NONE') {
        await this.permissionAuditService.logPermissionViolation(token, 'PERSON', id, 'ACCESS', null, null);
        throw new ForbiddenException('您没有权限查看联系人信息');
      }

      // 4. Build query condition
      let whereClause = 'WHERE p.id = $1 AND p.deleted_at IS NULL AND c.deleted_at IS NULL';
      const params: string[] = [id];
      let paramIndex = 2;

      if (customerTypeFilter) {
        whereClause += ` AND c.customer_type = $${paramIndex}`;
        params.push(customerTypeFilter);
        paramIndex++;
      }

      const result = await this.pgPool.query(
        `SELECT p.*, c.id as company_id_from_join, c.name as company_name, c.customer_code, c.customer_type
         FROM people p
         INNER JOIN companies c ON c.id = p.company_id
         ${whereClause}`,
        params
      );

      if (result.rows.length === 0) {
        // Check if person exists but filtered out by permission
        const personCheck = await this.pgPool.query(
          `SELECT p.id, c.customer_type
           FROM people p
           INNER JOIN companies c ON c.id = p.company_id
           WHERE p.id = $1 AND p.deleted_at IS NULL`,
          [id]
        );
        if (personCheck.rows.length > 0) {
          const customerType = personCheck.rows[0].customer_type;
          await this.permissionAuditService.logPermissionViolation(
            token,
            'PERSON',
            id,
            'ACCESS',
            customerTypeFilter,
            customerType,
          );
          throw new ForbiddenException('您没有权限查看该联系人');
        }
        throw new NotFoundException('联系人不存在');
      }

      return await this.mapToResponseDto(result.rows[0], includeCompany);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Failed to query person', error);
      throw new BadRequestException('查询联系人信息失败');
    }
  }

  /**
   * Update a person with role-based permission check
   */
  async update(id: string, updatePersonDto: UpdatePersonDto, token: string, userId: string): Promise<PersonResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // 1. Check if person exists and get current person info
    const currentPerson = await this.findOne(id, token, false);

    // 2. Get user permissions and data access filter
    const dataFilter = await this.permissionService.getDataAccessFilter(token);

    // 3. Get company info to check permission
    const companyResult = await this.pgPool.query(
      'SELECT customer_type FROM companies WHERE id = $1 AND deleted_at IS NULL',
      [currentPerson.companyId]
    );

    if (companyResult.rows.length === 0) {
      throw new NotFoundException('关联的客户不存在');
    }

    const companyCustomerType = companyResult.rows[0].customer_type;

    // 4. Validate user has permission to edit this person (check company type)
    if (dataFilter?.customerType) {
      const allowedType = dataFilter.customerType.toUpperCase();
      if (companyCustomerType !== allowedType) {
        await this.permissionAuditService.logPermissionViolation(
          token,
          'PERSON',
          id,
          'UPDATE',
          allowedType,
          companyCustomerType,
        );
        throw new ForbiddenException(
          `您没有权限编辑${companyCustomerType === 'BUYER' ? '采购商' : '供应商'}类型的联系人`
        );
      }
    }

    // 5. Validate name fields if both are being updated
    if (updatePersonDto.firstName !== undefined || updatePersonDto.lastName !== undefined) {
      const firstName = updatePersonDto.firstName ?? currentPerson.firstName;
      const lastName = updatePersonDto.lastName ?? currentPerson.lastName;
      this.validateNameFields(firstName, lastName);
    }

    // 6. Validate email uniqueness if email is being changed
    if (updatePersonDto.email !== undefined && updatePersonDto.email !== currentPerson.email) {
      const isEmailUnique = await this.checkEmailUnique(updatePersonDto.email, id);
      if (!isEmailUnique) {
        throw new ConflictException('邮箱已被使用');
      }
    }

    // 7. Validate userId format
    let validUserId: string | null = userId;
    if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      this.logger.warn(`Invalid userId format (not UUID): ${userId}, using null for updated_by`);
      validUserId = null;
    }

    try {
      const updateFields: string[] = [];
      const values: (string | number | boolean | null)[] = [];
      let paramIndex = 1;

      if (updatePersonDto.firstName !== undefined) {
        updateFields.push(`first_name = $${paramIndex}`);
        values.push(updatePersonDto.firstName?.trim() || null);
        paramIndex++;
      }

      if (updatePersonDto.lastName !== undefined) {
        updateFields.push(`last_name = $${paramIndex}`);
        values.push(updatePersonDto.lastName?.trim() || null);
        paramIndex++;
      }

      if (updatePersonDto.email !== undefined) {
        updateFields.push(`email = $${paramIndex}`);
        values.push(updatePersonDto.email?.trim() || null);
        paramIndex++;
      }

      if (updatePersonDto.phone !== undefined) {
        updateFields.push(`phone = $${paramIndex}`);
        values.push(updatePersonDto.phone?.trim() || null);
        paramIndex++;
      }

      if (updatePersonDto.mobile !== undefined) {
        updateFields.push(`mobile = $${paramIndex}`);
        values.push(updatePersonDto.mobile?.trim() || null);
        paramIndex++;
      }

      if (updatePersonDto.jobTitle !== undefined) {
        updateFields.push(`job_title = $${paramIndex}`);
        values.push(updatePersonDto.jobTitle?.trim() || null);
        paramIndex++;
      }

      if (updatePersonDto.department !== undefined) {
        updateFields.push(`department = $${paramIndex}`);
        values.push(updatePersonDto.department?.trim() || null);
        paramIndex++;
      }

      if (updatePersonDto.linkedinUrl !== undefined) {
        updateFields.push(`linkedin_url = $${paramIndex}`);
        values.push(updatePersonDto.linkedinUrl?.trim() || null);
        paramIndex++;
      }

      if (updatePersonDto.wechat !== undefined) {
        updateFields.push(`wechat = $${paramIndex}`);
        values.push(updatePersonDto.wechat?.trim() || null);
        paramIndex++;
      }

      if (updatePersonDto.whatsapp !== undefined) {
        updateFields.push(`whatsapp = $${paramIndex}`);
        values.push(updatePersonDto.whatsapp?.trim() || null);
        paramIndex++;
      }

      if (updatePersonDto.facebook !== undefined) {
        updateFields.push(`facebook = $${paramIndex}`);
        values.push(updatePersonDto.facebook?.trim() || null);
        paramIndex++;
      }

      if (updatePersonDto.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex}`);
        values.push(updatePersonDto.notes?.trim() || null);
        paramIndex++;
      }

      if (updatePersonDto.companyId !== undefined) {
        // Validate new company exists and user has permission
        const newCompanyResult = await this.pgPool.query(
          'SELECT customer_type FROM companies WHERE id = $1 AND deleted_at IS NULL',
          [updatePersonDto.companyId]
        );

        if (newCompanyResult.rows.length === 0) {
          throw new NotFoundException('关联的客户不存在');
        }

        const newCompanyCustomerType = newCompanyResult.rows[0].customer_type;
        if (dataFilter?.customerType) {
          const allowedType = dataFilter.customerType.toUpperCase();
          if (newCompanyCustomerType !== allowedType) {
            throw new ForbiddenException(
              `您没有权限将联系人关联到${newCompanyCustomerType === 'BUYER' ? '采购商' : '供应商'}类型的客户`
            );
          }
        }

        updateFields.push(`company_id = $${paramIndex}`);
        values.push(updatePersonDto.companyId);
        paramIndex++;
      }

      if (updatePersonDto.isImportant !== undefined) {
        updateFields.push(`is_important = $${paramIndex}`);
        values.push(updatePersonDto.isImportant);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return currentPerson; // No fields to update
      }

      // Add updated_by
      updateFields.push(`updated_by = $${paramIndex}`);
      values.push(validUserId);
      paramIndex++;

      // Add id parameter
      values.push(id);

      const result = await this.pgPool.query(
        `UPDATE people SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      const person = result.rows[0];
      const personDto = await this.mapToResponseDto(person, false);

      // 8. Audit log
      try {
        await this.auditService.log({
          action: 'UPDATE',
          entityType: 'PERSON',
          entityId: personDto.id,
          userId: validUserId || 'system',
          operatorId: validUserId || 'system',
          timestamp: new Date(),
          metadata: {
            personName: `${personDto.firstName || ''} ${personDto.lastName || ''}`.trim(),
            changes: updateFields,
          },
        });
      } catch (error) {
        this.logger.warn('Failed to log audit entry for person update', error);
      }

      return personDto;
    } catch (error) {
      if (error instanceof ConflictException || error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to update person', error);
      throw new BadRequestException('更新联系人失败');
    }
  }

  /**
   * Delete a person (soft delete)
   */
  async remove(id: string, token: string, userId: string): Promise<void> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // 1. Check if person exists and get current person info
    const currentPerson = await this.findOne(id, token, false);

    // 2. Get user permissions and data access filter
    const dataFilter = await this.permissionService.getDataAccessFilter(token);

    // 3. Get company info to check permission
    const companyResult = await this.pgPool.query(
      'SELECT customer_type FROM companies WHERE id = $1 AND deleted_at IS NULL',
      [currentPerson.companyId]
    );

    if (companyResult.rows.length === 0) {
      throw new NotFoundException('关联的客户不存在');
    }

    const companyCustomerType = companyResult.rows[0].customer_type;

    // 4. Validate user has permission to delete this person
    if (dataFilter?.customerType) {
      const allowedType = dataFilter.customerType.toUpperCase();
      if (companyCustomerType !== allowedType) {
        await this.permissionAuditService.logPermissionViolation(
          token,
          'PERSON',
          id,
          'DELETE',
          allowedType,
          companyCustomerType,
        );
        throw new ForbiddenException(
          `您没有权限删除${companyCustomerType === 'BUYER' ? '采购商' : '供应商'}类型的联系人`
        );
      }
    }

    // 5. Validate userId format
    let validUserId: string | null = userId;
    if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      this.logger.warn(`Invalid userId format (not UUID): ${userId}, using null for updated_by`);
      validUserId = null;
    }

    try {
      // Soft delete: set deleted_at
      await this.pgPool.query(
        'UPDATE people SET deleted_at = CURRENT_TIMESTAMP, updated_by = $1 WHERE id = $2',
        [validUserId, id]
      );

      // 6. Audit log
      try {
        await this.auditService.log({
          action: 'DELETE',
          entityType: 'PERSON',
          entityId: id,
          userId: validUserId || 'system',
          operatorId: validUserId || 'system',
          timestamp: new Date(),
          metadata: {
            personName: `${currentPerson.firstName || ''} ${currentPerson.lastName || ''}`.trim(),
          },
        });
      } catch (error) {
        this.logger.warn('Failed to log audit entry for person delete', error);
      }
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to delete person', error);
      throw new BadRequestException('删除联系人失败');
    }
  }

  /**
   * Find interactions by person ID
   */
  async findInteractionsByPersonId(
    personId: string,
    token: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ interactions: any[]; total: number }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      // 1. Verify person exists and user has permission
      await this.findOne(personId, token, false);

      // 2. Get total count
      const countResult = await this.pgPool.query(
        `SELECT COUNT(*) as total
         FROM product_customer_interactions pci
         WHERE pci.person_id = $1 AND pci.deleted_at IS NULL`,
        [personId]
      );
      const total = parseInt(countResult.rows[0].total, 10);

      // 3. Get interactions with products aggregated
      const interactionsResult = await this.pgPool.query(
        `SELECT
          pci.id,
          pci.customer_id,
          pci.person_id,
          pci.interaction_type,
          pci.interaction_date,
          pci.description,
          pci.status,
          pci.additional_info,
          pci.created_at,
          pci.updated_at,
          c.name as customer_name,
          COALESCE(
            json_agg(jsonb_build_object('id', p.id, 'name', p.name)) 
            FILTER (WHERE p.id IS NOT NULL), 
            '[]'::json
          ) as products
         FROM product_customer_interactions pci
         LEFT JOIN interaction_products ip ON ip.interaction_id = pci.id
         LEFT JOIN products p ON p.id = ip.product_id AND p.deleted_at IS NULL
         LEFT JOIN companies c ON c.id = pci.customer_id AND c.deleted_at IS NULL
         WHERE pci.person_id = $1 AND pci.deleted_at IS NULL
         GROUP BY pci.id, c.id
         ORDER BY pci.interaction_date DESC, pci.created_at DESC
         LIMIT $2 OFFSET $3`,
        [personId, limit, offset]
      );

      const interactions = interactionsResult.rows.map((row) => {
        // Parse products JSON
        let products: Array<{ id: string; name: string }> = [];
        try {
          if (row.products && typeof row.products === 'string') {
            products = JSON.parse(row.products);
          } else if (Array.isArray(row.products)) {
            products = row.products;
          }
        } catch (error) {
          this.logger.warn('Failed to parse products JSON', error);
          products = [];
        }
        
        return {
          id: row.id,
          customerId: row.customer_id,
          personId: row.person_id,
          interactionType: row.interaction_type,
          interactionDate: row.interaction_date,
          description: row.description,
          status: row.status,
          additionalInfo: row.additional_info,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          customerName: row.customer_name,
          products: products, // New: products array
          // Legacy fields for backward compatibility
          productId: products.length > 0 ? products[0].id : undefined,
          productName: products.length > 0 ? products[0].name : undefined,
        };
      });

      return { interactions, total };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Failed to find interactions by person ID', error);
      throw new BadRequestException('查询联系人互动历史失败');
    }
  }

  /**
   * Map database row to PersonResponseDto
   */
  private async mapToResponseDto(row: any, includeCompany: boolean = false): Promise<PersonResponseDto> {
    const dto: PersonResponseDto = {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      mobile: row.mobile,
      jobTitle: row.job_title,
      department: row.department,
      linkedinUrl: row.linkedin_url,
      wechat: row.wechat,
      whatsapp: row.whatsapp,
      facebook: row.facebook,
      notes: row.notes,
      companyId: row.company_id,
      isImportant: row.is_important ?? false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
    };

    // Include company information if requested
    if (includeCompany && (row.company_name || row.company_id_from_join)) {
      dto.company = {
        id: row.company_id_from_join || row.company_id,
        name: row.company_name,
        customerCode: row.customer_code,
        customerType: row.customer_type,
      };
    }

    return dto;
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.pgPool) {
      try {
        await this.pgPool.end();
        this.logger.log('PostgreSQL connection pool closed for PeopleService');
      } catch (error) {
        this.logger.error('Failed to close PostgreSQL connection pool', error);
      }
    }
  }
}
