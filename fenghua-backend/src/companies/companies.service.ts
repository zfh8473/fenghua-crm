/**
 * Companies Service
 * 
 * Handles CRUD operations for companies (customers) with role-based data filtering
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
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';

@Injectable()
export class CompaniesService implements OnModuleDestroy {
  private readonly logger = new Logger(CompaniesService.name);
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
      this.logger.warn('DATABASE_URL not configured, companies operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10, // Connection pool size
      });
      this.logger.log('PostgreSQL connection pool initialized for CompaniesService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }


  /**
   * Generate next available customer code
   */
  private async generateCustomerCode(customerType: 'BUYER' | 'SUPPLIER'): Promise<string> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      // Find the maximum customer code for the given customer type
      const prefix = customerType === 'BUYER' ? 'BUYER' : 'SUPPLIER';
      const result = await this.pgPool.query(
        `SELECT MAX(CAST(SUBSTRING(customer_code FROM '[0-9]+$') AS INTEGER)) as max_num
         FROM companies
         WHERE customer_type = $1 AND customer_code LIKE $2 AND deleted_at IS NULL`,
        [customerType, `${prefix}%`]
      );

      const maxNum = result.rows[0]?.max_num;
      const nextNum = maxNum ? maxNum + 1 : 1;
      const customerCode = `${prefix}${String(nextNum).padStart(3, '0')}`;

      // Double-check uniqueness (in case of race condition)
      const exists = await this.checkCustomerCodeExists(customerCode);
      if (exists) {
        // If exists, try next number
        return `${prefix}${String(nextNum + 1).padStart(3, '0')}`;
      }

      return customerCode;
    } catch (error) {
      this.logger.error('Failed to generate customer code', error);
      // Fallback: use timestamp-based code
      const prefix = customerType === 'BUYER' ? 'BUYER' : 'SUPPLIER';
      return `${prefix}${Date.now().toString().slice(-6)}`;
    }
  }

  /**
   * Create a new customer
   */
  async create(createCustomerDto: CreateCustomerDto, token: string, userId: string): Promise<CustomerResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // 1. 获取用户权限和数据访问过滤器
    const dataFilter = await this.permissionService.getDataAccessFilter(token);

    // 2. 验证用户是否有权限创建该类型的客户
    if (dataFilter?.customerType) {
      const allowedType = dataFilter.customerType.toUpperCase(); // 'buyer' -> 'BUYER'
      if (createCustomerDto.customerType !== allowedType) {
        // Log permission violation
        await this.permissionAuditService.logPermissionViolation(
          token,
          'CUSTOMER',
          null,
          'CREATE',
          allowedType,
          createCustomerDto.customerType,
        );
        throw new ForbiddenException(`您没有权限创建${createCustomerDto.customerType === 'BUYER' ? '采购商' : '供应商'}类型的客户`);
      }
    }

    // 3. 自动生成客户代码（如果未提供）
    let customerCode = createCustomerDto.customerCode;
    if (!customerCode || customerCode.trim() === '') {
      customerCode = await this.generateCustomerCode(createCustomerDto.customerType);
      this.logger.log(`Auto-generated customer code: ${customerCode} for ${createCustomerDto.customerType}`);
    } else {
      // 如果提供了客户代码，检查唯一性
      const customerCodeExists = await this.checkCustomerCodeExists(customerCode);
      if (customerCodeExists) {
        throw new ConflictException('客户代码已存在');
      }
    }

    // 4. 验证 userId 格式
    let validUserId: string | null = userId;
    if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      this.logger.warn(`Invalid userId format (not UUID): ${userId}, using null for created_by`);
      validUserId = null;
    }

    try {
      const result = await this.pgPool.query(
        `INSERT INTO companies (
          name, customer_code, customer_type, domain_name, address, city, state, country, 
          postal_code, industry, employees, website, phone, email, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          createCustomerDto.name,
          customerCode, // Use generated or provided code
          createCustomerDto.customerType,
          createCustomerDto.domainName || null,
          createCustomerDto.address || null,
          createCustomerDto.city || null,
          createCustomerDto.state || null,
          createCustomerDto.country || null,
          createCustomerDto.postalCode || null,
          createCustomerDto.industry || null,
          createCustomerDto.employees || null,
          createCustomerDto.website || null,
          createCustomerDto.phone || null,
          createCustomerDto.email || null,
          createCustomerDto.notes || null,
          validUserId,
        ]
      );

      const customer = result.rows[0];
      const customerDto = this.mapToResponseDto(customer);

      // 5. 审计日志
      try {
        await this.auditService.log({
          action: 'CREATE',
          entityType: 'CUSTOMER',
          entityId: customerDto.id,
          userId: validUserId || 'system',
          operatorId: validUserId || 'system',
          timestamp: new Date(),
          metadata: {
            customerName: customerDto.name,
            customerCode: customerDto.customerCode,
            customerType: customerDto.customerType,
          },
        });
      } catch (error) {
        this.logger.warn('Failed to log audit entry for customer create', error);
      }

      return customerDto;
    } catch (error) {
      if (error instanceof ConflictException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Failed to create customer', error);
      throw new BadRequestException('创建客户失败');
    }
  }

  /**
   * Find all customers with pagination and role-based filtering
   */
  async findAll(query: CustomerQueryDto, token: string): Promise<{ customers: CustomerResponseDto[]; total: number }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    const limit = query.limit || 20;
    const offset = query.offset || 0;

    try {
      this.logger.log(`[findAll] Starting customer query with params: ${JSON.stringify(query)}`);
      
      // 1. 获取用户权限和数据访问过滤器
      let dataFilter;
      try {
        this.logger.log('[findAll] Getting data access filter...');
        dataFilter = await this.permissionService.getDataAccessFilter(token);
        this.logger.log(`[findAll] Data access filter: ${JSON.stringify(dataFilter)}`);
      } catch (permissionError) {
        this.logger.error('[findAll] Failed to get data access filter', {
          error: permissionError instanceof Error ? permissionError.message : String(permissionError),
          stack: permissionError instanceof Error ? permissionError.stack : undefined,
        });
        throw new BadRequestException({
          message: `获取用户权限失败: ${permissionError instanceof Error ? permissionError.message : String(permissionError)}`,
          error: 'PERMISSION_CHECK_FAILED',
        });
      }

      // 2. 转换 customer_type 大小写（PermissionService 返回小写，数据库存储大写）
      const customerTypeFilter = dataFilter?.customerType
        ? dataFilter.customerType.toUpperCase()
        : null;

      // 3. 处理权限检查失败
      if (dataFilter?.customerType === 'NONE') {
        // Log permission violation
        await this.permissionAuditService.logPermissionViolation(token, 'CUSTOMER', null, 'ACCESS', null, null);
        throw new ForbiddenException('您没有权限查看客户信息');
      }

      // 4. 构建查询条件
      let whereClause = 'WHERE deleted_at IS NULL';
      const params: (string | number)[] = [];
      let paramIndex = 1;

      // 应用角色过滤
      if (customerTypeFilter) {
        whereClause += ` AND customer_type = $${paramIndex}`;
        params.push(customerTypeFilter);
        paramIndex++;
      }

      // 应用查询参数过滤
      if (query.customerType) {
        whereClause += ` AND customer_type = $${paramIndex}`;
        params.push(query.customerType);
        paramIndex++;
      }

      if (query.name) {
        whereClause += ` AND name ILIKE $${paramIndex}`;
        params.push(`%${query.name}%`);
        paramIndex++;
      } else if (query.customerCode) {
        whereClause += ` AND customer_code LIKE $${paramIndex}`;
        params.push(`%${query.customerCode}%`);
        paramIndex++;
      } else if (query.search) {
        whereClause += ` AND (name ILIKE $${paramIndex} OR customer_code LIKE $${paramIndex + 1})`;
        params.push(`%${query.search}%`, `%${query.search}%`);
        paramIndex += 2;
      }

      // 5. 获取总数（使用单独的查询，避免参数索引冲突）
      const countResult = await this.pgPool.query(
        `SELECT COUNT(*) as total FROM companies ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].total, 10);

      // 6. 获取客户列表
      // 注意：orderByClause 中的参数索引需要从 paramIndex 开始，因为 whereClause 已经使用了之前的参数
      let orderByClause = 'ORDER BY created_at DESC';
      const orderParams: (string | number)[] = [];
      let orderParamIndex = paramIndex;
      
      if (query.name) {
        orderByClause = `ORDER BY CASE WHEN name = $${orderParamIndex} THEN 1 WHEN name ILIKE $${orderParamIndex + 1} THEN 2 ELSE 3 END, name`;
        orderParams.push(query.name, `${query.name}%`);
        orderParamIndex += 2;
      } else if (query.customerCode) {
        orderByClause = `ORDER BY CASE WHEN customer_code = $${orderParamIndex} THEN 1 ELSE 2 END, customer_code`;
        orderParams.push(query.customerCode);
        orderParamIndex++;
      } else if (query.search) {
        orderByClause = `ORDER BY CASE WHEN name = $${orderParamIndex} THEN 1 WHEN name ILIKE $${orderParamIndex + 1} THEN 2 WHEN customer_code = $${orderParamIndex + 2} THEN 3 ELSE 4 END, name`;
        orderParams.push(query.search, `${query.search}%`, query.search);
        orderParamIndex += 3;
      }

      // 合并所有参数：whereClause 参数 + orderByClause 参数 + limit/offset
      const allParams = [...params, ...orderParams, limit, offset];
      const limitParamIndex = orderParamIndex;
      const offsetParamIndex = orderParamIndex + 1;

      // Log query details (always log in development, error level in production for debugging)
      this.logger.log('Executing customer query', {
        whereClause,
        orderByClause,
        limitParamIndex,
        offsetParamIndex,
        paramCount: allParams.length,
        params: allParams,
        paramIndex,
        orderParamIndex,
      });

      // Validate parameter indices match array length
      if (limitParamIndex > allParams.length || offsetParamIndex > allParams.length) {
        const errorMsg = `Parameter index mismatch: limitParamIndex=${limitParamIndex}, offsetParamIndex=${offsetParamIndex}, allParams.length=${allParams.length}`;
        this.logger.error(errorMsg, {
          whereClause,
          orderByClause,
          params,
          orderParams,
          limit,
          offset,
          paramIndex,
          orderParamIndex,
        });
        throw new BadRequestException({
          message: '查询参数错误',
          error: 'PARAMETER_INDEX_MISMATCH',
          details: errorMsg,
        });
      }

      this.logger.log(`[findAll] Executing SQL query with ${allParams.length} parameters`);
      
      try {
        const customersResult = await this.pgPool.query(
          `SELECT * FROM companies ${whereClause} ${orderByClause} LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
          allParams
        );

        this.logger.log(`[findAll] Query successful, returned ${customersResult.rows.length} rows`);
        const customers = customersResult.rows.map(row => this.mapToResponseDto(row));

        return { customers, total };
      } catch (sqlError) {
        this.logger.error('[findAll] SQL query failed', {
          error: sqlError instanceof Error ? sqlError.message : String(sqlError),
          stack: sqlError instanceof Error ? sqlError.stack : undefined,
          sql: `SELECT * FROM companies ${whereClause} ${orderByClause} LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
          params: allParams,
          paramCount: allParams.length,
          limitParamIndex,
          offsetParamIndex,
        });
        throw sqlError; // Re-throw to be caught by outer catch block
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      // Log detailed error information for debugging
      this.logger.error('[findAll] Failed to find customers', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        query: query,
        errorName: error instanceof Error ? error.constructor.name : typeof error,
      });
      throw new BadRequestException({
        message: `查询客户列表失败: ${error instanceof Error ? error.message : String(error)}`,
        error: 'CUSTOMER_QUERY_FAILED',
      });
    }
  }

  /**
   * Get a customer by ID with role-based filtering
   */
  async findOne(id: string, token: string): Promise<CustomerResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      // 1. 获取用户权限和数据访问过滤器
      const dataFilter = await this.permissionService.getDataAccessFilter(token);

      // 2. 转换 customer_type 大小写
      const customerTypeFilter = dataFilter?.customerType
        ? dataFilter.customerType.toUpperCase()
        : null;

      // 3. 处理权限检查失败
      if (dataFilter?.customerType === 'NONE') {
        // Log permission violation
        await this.permissionAuditService.logPermissionViolation(token, 'CUSTOMER', id, 'ACCESS', null, null);
        throw new ForbiddenException('您没有权限查看客户信息');
      }

      // 4. 构建查询条件
      let whereClause = 'WHERE id = $1 AND deleted_at IS NULL';
      const params: string[] = [id];
      let paramIndex = 2;

      if (customerTypeFilter) {
        whereClause += ` AND customer_type = $${paramIndex}`;
        params.push(customerTypeFilter);
        paramIndex++;
      }

      const result = await this.pgPool.query(
        `SELECT * FROM companies ${whereClause}`,
        params
      );

      if (result.rows.length === 0) {
        // If customer exists but filtered out by permission, log violation
        const customerCheck = await this.pgPool.query(
          'SELECT id, customer_type FROM companies WHERE id = $1 AND deleted_at IS NULL',
          [id],
        );
        if (customerCheck.rows.length > 0) {
          const customerType = customerCheck.rows[0].customer_type;
          // Customer exists but filtered by permission - this is a permission violation
          await this.permissionAuditService.logPermissionViolation(
            token,
            'CUSTOMER',
            id,
            'ACCESS',
            customerTypeFilter,
            customerType,
          );
          // Throw ForbiddenException (403) instead of NotFoundException (404) per AC7
          throw new ForbiddenException('您没有权限查看该客户');
        }
        // Customer doesn't exist
        throw new NotFoundException('客户不存在');
      }

      return this.mapToResponseDto(result.rows[0]);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Failed to query customer', error);
      throw new BadRequestException('查询客户信息失败');
    }
  }

  /**
   * Update a customer with role-based permission check
   */
  async update(id: string, updateCustomerDto: UpdateCustomerDto, token: string, userId: string): Promise<CustomerResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // 1. 检查客户是否存在并获取当前客户信息
    const currentCustomer = await this.findOne(id, token);

    // 2. 获取用户权限和数据访问过滤器
    const dataFilter = await this.permissionService.getDataAccessFilter(token);

    // 3. 验证用户是否有权限编辑该客户（检查客户类型）
    if (dataFilter?.customerType) {
      const allowedType = dataFilter.customerType.toUpperCase();
      if (currentCustomer.customerType !== allowedType) {
        // Log permission violation
        await this.permissionAuditService.logPermissionViolation(
          token,
          'CUSTOMER',
          id,
          'UPDATE',
          allowedType,
          currentCustomer.customerType,
        );
        throw new ForbiddenException(`您没有权限编辑${currentCustomer.customerType === 'BUYER' ? '采购商' : '供应商'}类型的客户`);
      }
    }

    // 4. 如果更新客户代码，检查唯一性
    if (updateCustomerDto.customerCode && updateCustomerDto.customerCode !== currentCustomer.customerCode) {
      const customerCodeExists = await this.checkCustomerCodeExists(updateCustomerDto.customerCode, id);
      if (customerCodeExists) {
        throw new ConflictException('客户代码已存在');
      }
    }

    // 5. 验证 userId 格式
    let validUserId: string | null = userId;
    if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      this.logger.warn(`Invalid userId format (not UUID): ${userId}, using null for updated_by`);
      validUserId = null;
    }

    try {
      const updateFields: string[] = [];
      const values: (string | number | null)[] = [];
      let paramIndex = 1;

      if (updateCustomerDto.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        values.push(updateCustomerDto.name);
        paramIndex++;
      }

      if (updateCustomerDto.customerCode !== undefined) {
        updateFields.push(`customer_code = $${paramIndex}`);
        values.push(updateCustomerDto.customerCode);
        paramIndex++;
      }

      if (updateCustomerDto.domainName !== undefined) {
        updateFields.push(`domain_name = $${paramIndex}`);
        values.push(updateCustomerDto.domainName || null);
        paramIndex++;
      }

      if (updateCustomerDto.address !== undefined) {
        updateFields.push(`address = $${paramIndex}`);
        values.push(updateCustomerDto.address || null);
        paramIndex++;
      }

      if (updateCustomerDto.city !== undefined) {
        updateFields.push(`city = $${paramIndex}`);
        values.push(updateCustomerDto.city || null);
        paramIndex++;
      }

      if (updateCustomerDto.state !== undefined) {
        updateFields.push(`state = $${paramIndex}`);
        values.push(updateCustomerDto.state || null);
        paramIndex++;
      }

      if (updateCustomerDto.country !== undefined) {
        updateFields.push(`country = $${paramIndex}`);
        values.push(updateCustomerDto.country || null);
        paramIndex++;
      }

      if (updateCustomerDto.postalCode !== undefined) {
        updateFields.push(`postal_code = $${paramIndex}`);
        values.push(updateCustomerDto.postalCode || null);
        paramIndex++;
      }

      if (updateCustomerDto.industry !== undefined) {
        updateFields.push(`industry = $${paramIndex}`);
        values.push(updateCustomerDto.industry || null);
        paramIndex++;
      }

      if (updateCustomerDto.employees !== undefined) {
        updateFields.push(`employees = $${paramIndex}`);
        values.push(updateCustomerDto.employees || null);
        paramIndex++;
      }

      if (updateCustomerDto.website !== undefined) {
        updateFields.push(`website = $${paramIndex}`);
        values.push(updateCustomerDto.website || null);
        paramIndex++;
      }

      if (updateCustomerDto.phone !== undefined) {
        updateFields.push(`phone = $${paramIndex}`);
        values.push(updateCustomerDto.phone || null);
        paramIndex++;
      }

      if (updateCustomerDto.email !== undefined) {
        updateFields.push(`email = $${paramIndex}`);
        values.push(updateCustomerDto.email || null);
        paramIndex++;
      }

      if (updateCustomerDto.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex}`);
        values.push(updateCustomerDto.notes || null);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return currentCustomer; // No fields to update
      }

      // 添加 updated_by
      updateFields.push(`updated_by = $${paramIndex}`);
      values.push(validUserId);
      paramIndex++;

      // 添加 id 参数
      values.push(id);

      const result = await this.pgPool.query(
        `UPDATE companies SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      const customer = result.rows[0];
      const customerDto = this.mapToResponseDto(customer);

      // 6. 审计日志
      try {
        await this.auditService.log({
          action: 'UPDATE',
          entityType: 'CUSTOMER',
          entityId: customerDto.id,
          userId: validUserId || 'system',
          operatorId: validUserId || 'system',
          timestamp: new Date(),
          metadata: {
            customerName: customerDto.name,
            customerCode: customerDto.customerCode,
            changes: updateFields,
          },
        });
      } catch (error) {
        this.logger.warn('Failed to log audit entry for customer update', error);
      }

      return customerDto;
    } catch (error) {
      if (error instanceof ConflictException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Failed to update customer', error);
      throw new BadRequestException('更新客户失败');
    }
  }

  /**
   * Delete a customer (soft delete or hard delete based on associations)
   */
  async remove(id: string, token: string, userId: string): Promise<void> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // 1. 检查客户是否存在并获取当前客户信息
    const currentCustomer = await this.findOne(id, token);

    // 2. 获取用户权限和数据访问过滤器
    const dataFilter = await this.permissionService.getDataAccessFilter(token);

    // 3. 验证用户是否有权限删除该客户
    if (dataFilter?.customerType) {
      const allowedType = dataFilter.customerType.toUpperCase();
      if (currentCustomer.customerType !== allowedType) {
        // Log permission violation
        await this.permissionAuditService.logPermissionViolation(
          token,
          'CUSTOMER',
          id,
          'DELETE',
          allowedType,
          currentCustomer.customerType,
        );
        throw new ForbiddenException(`您没有权限删除${currentCustomer.customerType === 'BUYER' ? '采购商' : '供应商'}类型的客户`);
      }
    }

    // 4. 检查是否有关联的互动记录
    const associationCheck = await this.pgPool.query(
      'SELECT COUNT(*) as count FROM product_customer_interactions WHERE customer_id = $1 AND deleted_at IS NULL',
      [id]
    );
    const associationCount = parseInt(associationCheck.rows[0].count, 10);

    // 5. 验证 userId 格式
    let validUserId: string | null = userId;
    if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      this.logger.warn(`Invalid userId format (not UUID): ${userId}, using null for updated_by`);
      validUserId = null;
    }

    try {
      if (associationCount > 0) {
        // 软删除：标记 deleted_at
        await this.pgPool.query(
          'UPDATE companies SET deleted_at = NOW(), updated_by = $1 WHERE id = $2',
          [validUserId, id]
        );
        this.logger.log(`Soft deleted customer ${id} (has ${associationCount} associations)`);
      } else {
        // 硬删除：直接删除记录
        await this.pgPool.query(
          'DELETE FROM companies WHERE id = $1',
          [id]
        );
        this.logger.log(`Hard deleted customer ${id} (no associations)`);
      }

      // 6. 审计日志
      try {
        await this.auditService.log({
          action: 'DELETE',
          entityType: 'CUSTOMER',
          entityId: id,
          userId: validUserId || 'system',
          operatorId: validUserId || 'system',
          timestamp: new Date(),
          metadata: {
            customerName: currentCustomer.name,
            customerCode: currentCustomer.customerCode,
            deleteType: associationCount > 0 ? 'soft' : 'hard',
            associationCount,
          },
        });
      } catch (error) {
        this.logger.warn('Failed to log audit entry for customer delete', error);
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Failed to delete customer', error);
      throw new BadRequestException('删除客户失败');
    }
  }

  /**
   * Check if customer code exists
   */
  private async checkCustomerCodeExists(customerCode: string, excludeId?: string): Promise<boolean> {
    if (!this.pgPool) {
      return false;
    }

    try {
      let query = 'SELECT COUNT(*) as count FROM companies WHERE customer_code = $1 AND deleted_at IS NULL';
      const params: (string | undefined)[] = [customerCode];

      if (excludeId) {
        query += ' AND id != $2';
        params.push(excludeId);
      }

      const result = await this.pgPool.query(query, params);
      return parseInt(result.rows[0].count, 10) > 0;
    } catch (error) {
      this.logger.error('Failed to check customer code existence', error);
      return false;
    }
  }

  /**
   * Map database row to CustomerResponseDto
   */
  private mapToResponseDto(row: any): CustomerResponseDto {
    return {
      id: row.id,
      name: row.name,
      customerCode: row.customer_code,
      customerType: row.customer_type,
      domainName: row.domain_name,
      address: row.address,
      city: row.city,
      state: row.state,
      country: row.country,
      postalCode: row.postal_code,
      industry: row.industry,
      employees: row.employees,
      website: row.website,
      phone: row.phone,
      email: row.email,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
    };
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.pgPool) {
      try {
        await this.pgPool.end();
        this.logger.log('PostgreSQL connection pool closed for CompaniesService');
      } catch (error) {
        this.logger.error('Failed to close PostgreSQL connection pool', error);
      }
    }
  }
}

