/**
 * Products Service Unit Tests
 * 
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { ConfigService } from '@nestjs/config';
import { TwentyClientService } from '../services/twenty-client/twenty-client.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

// Mock pg.Pool
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
    end: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('ProductsService', () => {
  let service: ProductsService;
  let configService: jest.Mocked<ConfigService>;
  let twentyClientService: jest.Mocked<TwentyClientService>;
  let auditService: jest.Mocked<AuditService>;
  let mockPgPool: jest.Mocked<Pool>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'DATABASE_URL') return 'postgresql://user:pass@host:5432/testdb';
              if (key === 'PG_DATABASE_URL') return 'postgresql://user:pass@host:5432/testdb';
              return defaultValue;
            }),
          },
        },
        {
          provide: TwentyClientService,
          useValue: {
            executeQueryWithToken: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    configService = module.get(ConfigService);
    twentyClientService = module.get(TwentyClientService);
    auditService = module.get(AuditService);
    mockPgPool = service['pgPool'] as jest.Mocked<Pool>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getWorkspaceId', () => {
    it('should get workspace ID from token', async () => {
      twentyClientService.executeQueryWithToken.mockResolvedValueOnce({
        currentUser: {
          workspaceMember: {
            workspace: {
              id: 'mock-workspace-id',
            },
          },
        },
      });

      const workspaceId = await service.getWorkspaceId('mock-token');
      expect(workspaceId).toBe('mock-workspace-id');
      expect(twentyClientService.executeQueryWithToken).toHaveBeenCalled();
    });

    it('should throw BadRequestException if workspace ID cannot be retrieved', async () => {
      twentyClientService.executeQueryWithToken.mockRejectedValueOnce(new Error('Failed'));

      await expect(service.getWorkspaceId('mock-token')).rejects.toThrow(BadRequestException);
      await expect(service.getWorkspaceId('mock-token')).rejects.toThrow('获取工作空间ID失败');
    });
  });

  describe('hasAssociatedInteractions', () => {
    it('should return true if product has associated interactions', async () => {
      (mockPgPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ count: '1' }],
      });

      const result = await service.hasAssociatedInteractions('product-id');
      expect(result).toBe(true);
      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.stringContaining('product_customer_interactions'),
        ['product-id']
      );
    });

    it('should return false if product has no associated interactions', async () => {
      (mockPgPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ count: '0' }],
      });

      const result = await service.hasAssociatedInteractions('product-id');
      expect(result).toBe(false);
    });

    it('should throw BadRequestException if database connection not initialized', async () => {
      service['pgPool'] = null;

      await expect(service.hasAssociatedInteractions('product-id')).rejects.toThrow(BadRequestException);
      await expect(service.hasAssociatedInteractions('product-id')).rejects.toThrow('数据库连接未初始化');
    });
  });

  describe('checkHsCodeExists', () => {
    it('should return true if HS code exists', async () => {
      (mockPgPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ count: '1' }],
      });

      const result = await service.checkHsCodeExists('123456');
      expect(result).toBe(true);
    });

    it('should return false if HS code does not exist', async () => {
      (mockPgPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ count: '0' }],
      });

      const result = await service.checkHsCodeExists('123456');
      expect(result).toBe(false);
    });

    it('should exclude product ID when checking', async () => {
      (mockPgPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ count: '0' }],
      });

      await service.checkHsCodeExists('123456', 'exclude-id');
      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.stringContaining('id !='),
        ['123456', 'exclude-id']
      );
    });
  });

  describe('create', () => {
    const mockCreateDto: CreateProductDto = {
      name: 'Test Product',
      hsCode: '123456',
      category: '电子产品',
      description: 'Test description',
    };

    it('should create a product successfully', async () => {
      twentyClientService.executeQueryWithToken.mockResolvedValueOnce({
        currentUser: {
          workspaceMember: {
            workspace: {
              id: 'workspace-id',
            },
          },
        },
      });

      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // HS code check
        .mockResolvedValueOnce({
          rows: [{
            id: 'product-id',
            name: 'Test Product',
            hs_code: '123456',
            category: '电子产品',
            description: 'Test description',
            status: 'active',
            specifications: null,
            image_url: null,
            workspace_id: 'workspace-id',
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: null,
            created_by: 'user-id',
            updated_by: null,
          }],
        });

      const result = await service.create(mockCreateDto, 'token', 'user-id');

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Product');
      expect(result.hsCode).toBe('123456');
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw ConflictException if HS code already exists', async () => {
      twentyClientService.executeQueryWithToken.mockResolvedValue({
        currentUser: {
          workspaceMember: {
            workspace: {
              id: 'workspace-id',
            },
          },
        },
      });

      (mockPgPool.query as jest.Mock).mockResolvedValue({
        rows: [{ count: '1' }], // HS code exists
      });

      const promise = service.create(mockCreateDto, 'token', 'user-id');
      await expect(promise).rejects.toThrow(ConflictException);
      await expect(promise).rejects.toThrow('HS编码已存在');
    });
  });

  describe('findAll', () => {
    it('should return products with pagination', async () => {
      twentyClientService.executeQueryWithToken.mockResolvedValueOnce({
        currentUser: {
          workspaceMember: {
            workspace: {
              id: 'workspace-id',
            },
          },
        },
      });

      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // Count
        .mockResolvedValueOnce({
          rows: [{
            id: 'product-id',
            name: 'Test Product',
            hs_code: '123456',
            status: 'active',
            workspace_id: 'workspace-id',
            created_at: new Date(),
            updated_at: new Date(),
          }],
        });

      const query: ProductQueryDto = { limit: 20, offset: 0 };
      const result = await service.findAll(query, 'token');

      expect(result.products).toHaveLength(1);
      expect(result.total).toBe(10);
    });

    it('should filter by status', async () => {
      twentyClientService.executeQueryWithToken.mockResolvedValueOnce({
        currentUser: {
          workspaceMember: {
            workspace: {
              id: 'workspace-id',
            },
          },
        },
      });

      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [] });

      const query: ProductQueryDto = { status: 'active' as any, limit: 20, offset: 0 };
      await service.findAll(query, 'token');

      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'active'"),
        expect.any(Array)
      );
    });

    it('should include inactive products when includeInactive is true', async () => {
      twentyClientService.executeQueryWithToken.mockResolvedValueOnce({
        currentUser: {
          workspaceMember: {
            workspace: {
              id: 'workspace-id',
            },
          },
        },
      });

      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [] });

      const query: ProductQueryDto = { includeInactive: true, limit: 20, offset: 0 };
      await service.findAll(query, 'token');

      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.not.stringContaining("status = 'active'"),
        expect.any(Array)
      );
    });
  });

  describe('findOne', () => {
    it('should return a product by ID', async () => {
      twentyClientService.executeQueryWithToken.mockResolvedValueOnce({
        currentUser: {
          workspaceMember: {
            workspace: {
              id: 'workspace-id',
            },
          },
        },
      });

      (mockPgPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: 'product-id',
          name: 'Test Product',
          hs_code: '123456',
          status: 'active',
          workspace_id: 'workspace-id',
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });

      const result = await service.findOne('product-id', 'token');

      expect(result).toBeDefined();
      expect(result.id).toBe('product-id');
    });

    it('should throw NotFoundException if product not found', async () => {
      twentyClientService.executeQueryWithToken.mockResolvedValue({
        currentUser: {
          workspaceMember: {
            workspace: {
              id: 'workspace-id',
            },
          },
        },
      });

      (mockPgPool.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      await expect(service.findOne('non-existent-id', 'token')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent-id', 'token')).rejects.toThrow('产品不存在');
    });
  });

  describe('update', () => {
    const mockUpdateDto: UpdateProductDto = {
      name: 'Updated Product',
    };

    it('should update a product successfully', async () => {
      // Mock getWorkspaceId calls (for findOne and update)
      twentyClientService.executeQueryWithToken
        .mockResolvedValueOnce({
          currentUser: {
            workspaceMember: {
              workspace: {
                id: 'workspace-id',
              },
            },
          },
        })
        .mockResolvedValueOnce({
          currentUser: {
            workspaceMember: {
              workspace: {
                id: 'workspace-id',
              },
            },
          },
        })
        .mockResolvedValueOnce({
          currentUser: {
            workspaceMember: {
              workspace: {
                id: 'workspace-id',
              },
            },
          },
        });

      const mockProductRow = {
        id: 'product-id',
        name: 'Old Product',
        hs_code: '123456',
        status: 'active',
        workspace_id: 'workspace-id',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        created_by: null,
        updated_by: null,
        description: null,
        category: '电子产品',
        specifications: null,
        image_url: null,
      };

      // findOne is called twice: once to check existence (line 295), once to get oldProduct for audit (line 349)
      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockProductRow] }) // findOne call (check existence)
        .mockResolvedValueOnce({ rows: [mockProductRow] }) // findOne call (get oldProduct for audit)
        .mockResolvedValueOnce({ rows: [{ ...mockProductRow, name: 'Updated Product' }] }); // update call

      const result = await service.update('product-id', mockUpdateDto, 'token', 'user-id');

      expect(result.name).toBe('Updated Product');
      expect(auditService.log).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete product if it has associated interactions', async () => {
      // Mock getWorkspaceId (called by findOne in remove)
      twentyClientService.executeQueryWithToken.mockImplementation(() =>
        Promise.resolve({
          currentUser: {
            workspaceMember: {
              workspace: {
                id: 'workspace-id',
              },
            },
          },
        })
      );

      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            id: 'product-id',
            name: 'Test Product',
            hs_code: '123456',
            status: 'active',
            workspace_id: 'workspace-id',
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: null,
            created_by: null,
            updated_by: null,
            description: null,
            category: '电子产品',
            specifications: null,
            image_url: null,
          }],
        })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }) // Has interactions
        .mockResolvedValueOnce({ rows: [] }); // Soft delete

      await service.remove('product-id', 'token', 'user-id');

      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'inactive'"),
        expect.any(Array)
      );
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should hard delete product if it has no associated interactions', async () => {
      // Mock getWorkspaceId (called by findOne in remove)
      twentyClientService.executeQueryWithToken.mockImplementation(() =>
        Promise.resolve({
          currentUser: {
            workspaceMember: {
              workspace: {
                id: 'workspace-id',
              },
            },
          },
        })
      );

      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            id: 'product-id',
            name: 'Test Product',
            hs_code: '123456',
            status: 'active',
            workspace_id: 'workspace-id',
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: null,
            created_by: null,
            updated_by: null,
            description: null,
            category: '电子产品',
            specifications: null,
            image_url: null,
          }],
        })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // No interactions
        .mockResolvedValueOnce({ rows: [] }); // Hard delete

      await service.remove('product-id', 'token', 'user-id');

      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM products'),
        expect.any(Array)
      );
      expect(auditService.log).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should close PostgreSQL connection pool', async () => {
      await service.onModuleDestroy();
      expect(mockPgPool.end).toHaveBeenCalled();
    });

    it('should not throw error if pgPool is null', async () => {
      service['pgPool'] = null;
      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });
  });
});

