/**
 * Product Business Process Service
 * 
 * Handles queries for product-customer business process view
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PermissionService } from '../permission/permission.service';
import {
  ProductBusinessProcessDto,
  BusinessProcessStageDto,
  BusinessProcessStageStatus,
} from './dto/product-business-process.dto';

/**
 * Buyer process stage definitions
 */
const BUYER_STAGES = [
  { key: 'initial_contact', name: '初步接触', interactionTypes: ['initial_contact'] },
  { key: 'product_inquiry', name: '产品询价', interactionTypes: ['product_inquiry'] },
  { key: 'quotation', name: '报价', interactionTypes: ['quotation'] },
  { key: 'quotation_response', name: '接受/拒绝报价', interactionTypes: ['quotation_accepted', 'quotation_rejected'] },
  { key: 'order_signed', name: '签署订单', interactionTypes: ['order_signed'] },
  { key: 'order_completed', name: '完成订单', interactionTypes: ['order_completed'] },
];

/**
 * Supplier process stage definitions
 */
const SUPPLIER_STAGES = [
  { key: 'product_inquiry_supplier', name: '询价产品', interactionTypes: ['product_inquiry_supplier'] },
  { key: 'quotation_received', name: '接收报价', interactionTypes: ['quotation_received'] },
  { key: 'specification_confirmed', name: '产品规格确认', interactionTypes: ['specification_confirmed'] },
  { key: 'production_progress', name: '生产进度跟进', interactionTypes: ['production_progress'] },
  { key: 'pre_shipment_inspection', name: '发货前验收', interactionTypes: ['pre_shipment_inspection'] },
  { key: 'shipped', name: '已发货', interactionTypes: ['shipped'] },
];

@Injectable()
export class ProductBusinessProcessService implements OnModuleDestroy {
  private readonly logger = new Logger(ProductBusinessProcessService.name);
  private pgPool: Pool | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly permissionService: PermissionService,
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
      this.logger.warn('DATABASE_URL not configured, product business process operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10, // Connection pool size
      });
      this.logger.log('PostgreSQL connection pool initialized for ProductBusinessProcessService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  /**
   * Get product business process stages
   */
  async getProductBusinessProcess(
    productId: string,
    customerId: string,
    token: string,
  ): Promise<ProductBusinessProcessDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // 1. 获取用户权限和数据访问过滤器
    const dataFilter = await this.permissionService.getDataAccessFilter(token);

    // 2. 转换 customer_type 大小写（PermissionService 返回小写，数据库存储大写）
    const customerTypeFilter = dataFilter?.customerType
      ? dataFilter.customerType.toUpperCase()
      : null;

    // 3. 处理权限检查失败
    if (dataFilter?.customerType === 'NONE') {
      throw new ForbiddenException('您没有权限查看业务流程');
    }

    // 4. 验证产品是否存在
    const productCheck = await this.pgPool.query(
      'SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL',
      [productId],
    );
    if (productCheck.rows.length === 0) {
      throw new NotFoundException('产品不存在');
    }

    // 5. 验证客户是否存在，并检查客户类型权限
    const customerCheck = await this.pgPool.query(
      'SELECT id, customer_type FROM companies WHERE id = $1 AND deleted_at IS NULL',
      [customerId],
    );
    if (customerCheck.rows.length === 0) {
      throw new NotFoundException('客户不存在');
    }

    const customerType = customerCheck.rows[0].customer_type;
    // 权限检查：如果用户只能查看特定类型的客户，验证客户类型
    if (customerTypeFilter && customerType !== customerTypeFilter) {
      throw new ForbiddenException('您没有权限查看该客户的业务流程');
    }

    // 6. 查询产品-客户的所有互动记录（按时间顺序）
    const query = `
      SELECT 
        pci.id,
        pci.interaction_type,
        pci.interaction_date
      FROM product_customer_interactions pci
      INNER JOIN companies c ON c.id = pci.customer_id
      WHERE pci.product_id = $1 
        AND pci.customer_id = $2
        AND pci.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND ($3::text IS NULL OR c.customer_type = $3)
      ORDER BY pci.interaction_date ASC
    `;

    let interactions;
    try {
      const result = await this.pgPool.query(query, [productId, customerId, customerTypeFilter]);
      interactions = result.rows;
    } catch (error) {
      this.logger.error('Failed to query product customer interactions', error);
      throw new BadRequestException('获取业务流程数据失败');
    }

    // 7. 根据客户类型确定流程阶段定义
    if (customerType !== 'BUYER' && customerType !== 'SUPPLIER') {
      this.logger.error(`Invalid customer_type: ${customerType} for customer ${customerId}`);
      throw new BadRequestException(`无效的客户类型: ${customerType}`);
    }
    const stages = customerType === 'BUYER' ? BUYER_STAGES : SUPPLIER_STAGES;
    const processType = customerType === 'BUYER' ? 'buyer' : 'supplier';

    // 8. 构建阶段数据并判断状态
    const stageDtos: BusinessProcessStageDto[] = stages.map((stage, index) => {
      // 找到该阶段的所有互动记录
      const stageInteractions = interactions.filter((interaction) =>
        stage.interactionTypes.includes(interaction.interaction_type),
      );

      const interactionIds = stageInteractions.map((i) => i.id);
      const interactionCount = stageInteractions.length;

      // 获取完成时间（最后一次互动的时间）
      const completedAt =
        stageInteractions.length > 0
          ? new Date(
              stageInteractions[stageInteractions.length - 1].interaction_date,
            )
          : undefined;

      // 判断阶段状态
      let status: BusinessProcessStageStatus;
      if (interactionCount > 0) {
        // 当前阶段有互动记录
        // 检查后续阶段是否有互动记录
        const hasLaterInteractions = stages
          .slice(index + 1)
          .some((laterStage) => {
            return interactions.some((interaction) =>
              laterStage.interactionTypes.includes(interaction.interaction_type),
            );
          });

        if (hasLaterInteractions) {
          // 后续阶段有互动，当前阶段已完成（且不是最后一个阶段）
          status = BusinessProcessStageStatus.COMPLETED;
        } else {
          // 后续阶段没有互动，当前阶段是最后一个有互动记录的阶段，标记为进行中
          status = BusinessProcessStageStatus.IN_PROGRESS;
        }
      } else {
        // 当前阶段没有互动记录，标记为未开始
        // 注意：即使前面的阶段也没有互动，也标记为未开始（允许跳过阶段的情况在后续阶段有互动时会自动处理）
        status = BusinessProcessStageStatus.NOT_STARTED;
      }

      return {
        stageName: stage.name,
        stageKey: stage.key,
        status,
        completedAt,
        interactionIds,
        interactionCount,
      };
    });

    return {
      customerType: customerType as 'BUYER' | 'SUPPLIER',
      processType: processType as 'buyer' | 'supplier',
      stages: stageDtos,
      totalInteractions: interactions.length,
    };
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
      this.logger.log('PostgreSQL connection pool closed for ProductBusinessProcessService');
    }
  }
}

