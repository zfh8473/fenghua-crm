/**
 * Interactions Service Unit Tests
 * 
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { InteractionsService } from './interactions.service';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { ProductsService } from '../products/products.service';
import { CompaniesService } from '../companies/companies.service';
import { PermissionService } from '../permission/permission.service';
import { AuditService } from '../audit/audit.service';
import { ProductCustomerAssociationManagementService } from '../products/product-customer-association-management.service';
import { AssociationType } from '../products/constants/association-types';
import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateInteractionDto, FrontendInteractionType, BackendInteractionType, InteractionStatus } from './dto/create-interaction.dto';

// Mock pg.Pool
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('InteractionsService', () => {
  let service: InteractionsService;
  let configService: jest.Mocked<ConfigService>;
  let authService: jest.Mocked<AuthService>;
  let productsService: jest.Mocked<ProductsService>;
  let companiesService: jest.Mocked<CompaniesService>;
  let permissionService: jest.Mocked<PermissionService>;
  let auditService: jest.Mocked<AuditService>;
  let associationService: jest.Mocked<ProductCustomerAssociationManagementService>;
  let mockPgPool: jest.Mocked<Pool>;
  let mockClient: any;

  beforeEach(async () => {
    // Mock database client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InteractionsService,
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
          provide: AuthService,
          useValue: {
            validateToken: jest.fn(),
          },
        },
        {
          provide: ProductsService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: CompaniesService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: PermissionService,
          useValue: {
            canAccess: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ProductCustomerAssociationManagementService,
          useValue: {
            createAssociationInTransaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InteractionsService>(InteractionsService);
    configService = module.get(ConfigService);
    authService = module.get(AuthService);
    productsService = module.get(ProductsService);
    companiesService = module.get(CompaniesService);
    permissionService = module.get(PermissionService);
    auditService = module.get(AuditService);
    associationService = module.get(ProductCustomerAssociationManagementService);
    mockPgPool = service['pgPool'] as jest.Mocked<Pool>;
    
    // Setup mock client connection
    (mockPgPool.connect as jest.Mock) = jest.fn().mockResolvedValue(mockClient);
    mockClient.query.mockResolvedValue({ rows: [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateInteractionDto = {
      productIds: ['product-id'],
      customerId: 'customer-id',
      interactionType: FrontendInteractionType.INITIAL_CONTACT,
      interactionDate: '2025-01-03T10:00:00Z',
      description: 'Test interaction',
    };

    const createDtoMultipleProducts: CreateInteractionDto = {
      productIds: ['product-id-1', 'product-id-2'],
      customerId: 'customer-id',
      interactionType: FrontendInteractionType.INITIAL_CONTACT,
      interactionDate: '2025-01-03T10:00:00Z',
      description: 'Test interaction with multiple products',
    };

    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      role: 'FRONTEND_SPECIALIST',
    };

    const mockProduct = {
      id: 'product-id',
      name: 'Test Product',
      status: 'active',
    };

    const mockCustomer = {
      id: 'customer-id',
      name: 'Test Customer',
      customerType: 'BUYER',
    };

    it('should create an interaction record successfully', async () => {
      authService.validateToken.mockResolvedValueOnce(mockUser);
      productsService.findOne.mockResolvedValueOnce(mockProduct as any);
      companiesService.findOne.mockResolvedValueOnce(mockCustomer as any);
      // Mock batch product query
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{
            id: 'product-id',
            name: 'Test Product',
            status: 'active',
          }],
        }) // Batch product validation query
        .mockResolvedValueOnce({
          rows: [{
            id: 'association-id',
          }],
        }) // Association validation query
        .mockResolvedValueOnce({
          rows: [{
            id: 'interaction-id',
            product_id: 'product-id',
            customer_id: 'customer-id',
            person_id: null, // Story 20.5: Include person_id in response
            interaction_type: FrontendInteractionType.INITIAL_CONTACT,
            interaction_date: new Date('2025-01-03T10:00:00Z'),
            description: 'Test interaction',
            status: null,
            additional_info: null,
            created_at: new Date(),
            created_by: 'user-id',
          }],
        }) // INSERT interaction (single record)
        .mockResolvedValueOnce({}) // INSERT interaction_products associations
        .mockResolvedValueOnce({}); // COMMIT

      const result = await service.create(createDto, 'token');

      expect(result).toBeDefined();
      expect(result.id).toBe('interaction-id');
      expect(authService.validateToken).toHaveBeenCalledWith('token');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      authService.validateToken.mockRejectedValueOnce(new UnauthorizedException('Invalid token'));

      await expect(service.create(createDto, 'invalid-token')).rejects.toThrow(UnauthorizedException);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should throw BadRequestException if product does not exist', async () => {
      authService.validateToken.mockResolvedValueOnce(mockUser);
      productsService.findOne.mockRejectedValueOnce(new BadRequestException('Product not found'));

      mockClient.query.mockResolvedValueOnce({}); // BEGIN

      await expect(service.create(createDto, 'token')).rejects.toThrow(BadRequestException);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should throw BadRequestException if product is not active', async () => {
      authService.validateToken.mockResolvedValueOnce(mockUser);
      productsService.findOne.mockResolvedValueOnce({ ...mockProduct, status: 'inactive' } as any);

      mockClient.query.mockResolvedValueOnce({}); // BEGIN

      await expect(service.create(createDto, 'token')).rejects.toThrow(BadRequestException);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should throw ForbiddenException if customer type does not match user role', async () => {
      authService.validateToken.mockResolvedValueOnce(mockUser);
      productsService.findOne.mockResolvedValueOnce(mockProduct as any);
      companiesService.findOne.mockResolvedValueOnce({ ...mockCustomer, customerType: 'SUPPLIER' } as any);

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{
            id: 'product-id',
            name: 'Test Product',
            status: 'active',
          }],
        }); // Batch product validation query

      await expect(service.create(createDto, 'token')).rejects.toThrow(ForbiddenException);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should throw ForbiddenException for BACKEND_SPECIALIST with wrong customer type', async () => {
      const backendUser = { ...mockUser, role: 'BACKEND_SPECIALIST' };
      authService.validateToken.mockResolvedValueOnce(backendUser);
      productsService.findOne.mockResolvedValueOnce(mockProduct as any);
      companiesService.findOne.mockResolvedValueOnce({ ...mockCustomer, customerType: 'BUYER' } as any);

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{
            id: 'product-id',
            name: 'Test Product',
            status: 'active',
          }],
        }); // Batch product validation query

      await expect(service.create(createDto, 'token')).rejects.toThrow(ForbiddenException);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should create an interaction record successfully for BACKEND_SPECIALIST with supplier customer', async () => {
      const backendUser = { ...mockUser, role: 'BACKEND_SPECIALIST' };
      const backendCreateDto: CreateInteractionDto = {
        ...createDto,
        interactionType: BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER,
      };
      const supplierCustomer = { ...mockCustomer, customerType: 'SUPPLIER' };

      authService.validateToken.mockResolvedValueOnce(backendUser);
      productsService.findOne.mockResolvedValueOnce(mockProduct as any);
      companiesService.findOne.mockResolvedValueOnce(supplierCustomer as any);

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{
            id: 'product-id',
            name: 'Test Product',
            status: 'active',
          }],
        }) // Batch product validation query
        .mockResolvedValueOnce({
          rows: [{ id: 'association-id' }], // Association check
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'interaction-id',
            product_id: 'product-id',
            customer_id: 'customer-id',
            interaction_type: BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER,
            interaction_date: new Date('2025-01-03T10:00:00Z'),
            description: 'Test interaction',
            status: null,
            additional_info: null,
            created_at: new Date(),
            created_by: 'user-id',
          }],
        }) // INSERT interaction (single record)
        .mockResolvedValueOnce({}) // INSERT interaction_products associations
        .mockResolvedValueOnce({}); // COMMIT

      const result = await service.create(backendCreateDto, 'token');

      expect(result).toBeDefined();
      expect(result.id).toBe('interaction-id');
      expect(result.interactionType).toBe(BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER);
      expect(authService.validateToken).toHaveBeenCalledWith('token');
      expect(companiesService.findOne).toHaveBeenCalledWith('customer-id', 'token');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should create an interaction record successfully for BACKEND_SPECIALIST with different backend interaction types', async () => {
      const backendUser = { ...mockUser, role: 'BACKEND_SPECIALIST' };
      const supplierCustomer = { ...mockCustomer, customerType: 'SUPPLIER' };

      const backendInteractionTypes = [
        BackendInteractionType.QUOTATION_RECEIVED,
        BackendInteractionType.SPECIFICATION_CONFIRMED,
        BackendInteractionType.PRODUCTION_PROGRESS,
        BackendInteractionType.PRE_SHIPMENT_INSPECTION,
      ];

      for (const interactionType of backendInteractionTypes) {
        const backendCreateDto: CreateInteractionDto = {
          ...createDto,
          interactionType,
        };

        authService.validateToken.mockResolvedValueOnce(backendUser);
        productsService.findOne.mockResolvedValueOnce(mockProduct as any);
        companiesService.findOne.mockResolvedValueOnce(supplierCustomer as any);

        mockClient.query
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({
            rows: [{
              id: 'product-id',
              name: 'Test Product',
              status: 'active',
            }],
          }) // Batch product validation query
          .mockResolvedValueOnce({
            rows: [{ id: 'association-id' }], // Association check
          })
          .mockResolvedValueOnce({
            rows: [{
              id: 'interaction-id',
              product_id: 'product-id',
              customer_id: 'customer-id',
              interaction_type: interactionType,
              interaction_date: new Date('2025-01-03T10:00:00Z'),
              description: 'Test interaction',
              status: null,
              additional_info: null,
              created_at: new Date(),
              created_by: 'user-id',
            }],
          }) // INSERT
          .mockResolvedValueOnce({}); // COMMIT

        const result = await service.create(backendCreateDto, 'token');

        expect(result).toBeDefined();
        expect(result.interactionType).toBe(interactionType);
        expect(mockClient.query).toHaveBeenCalledWith('COMMIT');

        // Clear only specific mocks for next iteration (afterEach already clears all)
        authService.validateToken.mockClear();
        productsService.findOne.mockClear();
        companiesService.findOne.mockClear();
        mockClient.query.mockClear();
      }
    });

    it('should record audit log after successful creation for BACKEND_SPECIALIST', async () => {
      const backendUser = { ...mockUser, role: 'BACKEND_SPECIALIST' };
      const backendCreateDto: CreateInteractionDto = {
        ...createDto,
        interactionType: BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER,
      };
      const supplierCustomer = { ...mockCustomer, customerType: 'SUPPLIER' };

      authService.validateToken.mockResolvedValueOnce(backendUser);
      productsService.findOne.mockResolvedValueOnce(mockProduct as any);
      companiesService.findOne.mockResolvedValueOnce(supplierCustomer as any);

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{
            id: 'product-id',
            name: 'Test Product',
            status: 'active',
          }],
        }) // Batch product validation query
        .mockResolvedValueOnce({
          rows: [{ id: 'association-id' }], // Association check
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'interaction-id',
            product_id: 'product-id',
            customer_id: 'customer-id',
            interaction_type: BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER,
            interaction_date: new Date('2025-01-03T10:00:00Z'),
            description: 'Test interaction',
            status: null,
            additional_info: null,
            created_at: new Date(),
            created_by: 'user-id',
          }],
        }) // INSERT interaction (single record)
        .mockResolvedValueOnce({}) // INSERT interaction_products associations
        .mockResolvedValueOnce({}); // COMMIT

      await service.create(backendCreateDto, 'token');

      // Wait for setImmediate to execute (audit log is async)
      await new Promise(resolve => setImmediate(resolve));

      // Verify audit service was called
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'INTERACTION_CREATED',
          entityType: 'INTERACTION',
          entityId: 'interaction-id',
          userId: 'user-id',
          operatorId: 'user-id',
          metadata: expect.objectContaining({
            interactionType: BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER,
            productIds: ['product-id'], // Story 20.8: Changed to array
            customerId: 'customer-id',
            totalProducts: 1,
          }),
        })
      );
    });

    it('should throw BadRequestException if customer does not exist (foreign key violation)', async () => {
      authService.validateToken.mockResolvedValueOnce(mockUser);
      productsService.findOne.mockResolvedValueOnce(mockProduct as any);
      const foreignKeyError = new Error('Foreign key violation');
      (foreignKeyError as any).code = '23503'; // PostgreSQL foreign key violation error code
      companiesService.findOne.mockRejectedValueOnce(foreignKeyError);

      mockClient.query.mockResolvedValueOnce({}); // BEGIN

      await expect(service.create(createDto, 'token')).rejects.toThrow(BadRequestException);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should record audit log after successful creation', async () => {
      authService.validateToken.mockResolvedValueOnce(mockUser);
      productsService.findOne.mockResolvedValueOnce(mockProduct as any);
      companiesService.findOne.mockResolvedValueOnce(mockCustomer as any);
      
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{
            id: 'product-id',
            name: 'Test Product',
            status: 'active',
          }],
        }) // Batch product validation query
        .mockResolvedValueOnce({
          rows: [{ id: 'association-id' }], // Association check
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'interaction-id',
            product_id: 'product-id',
            customer_id: 'customer-id',
            person_id: null, // Story 20.5: Include person_id in response
            interaction_type: FrontendInteractionType.INITIAL_CONTACT,
            interaction_date: new Date('2025-01-03T10:00:00Z'),
            description: 'Test interaction',
            status: null,
            additional_info: null,
            created_at: new Date(),
            created_by: 'user-id',
          }],
        }) // INSERT interaction (single record)
        .mockResolvedValueOnce({}) // INSERT interaction_products associations
        .mockResolvedValueOnce({}); // COMMIT

      await service.create(createDto, 'token');

      // Wait for setImmediate to execute (audit log is async)
      await new Promise(resolve => setImmediate(resolve));

      // Verify audit service was called
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'INTERACTION_CREATED',
          entityType: 'INTERACTION',
          entityId: 'interaction-id',
          userId: 'user-id',
          operatorId: 'user-id',
        })
      );
    });

    it('should rollback transaction on error', async () => {
      authService.validateToken.mockResolvedValueOnce(mockUser);
      productsService.findOne.mockResolvedValueOnce(mockProduct as any);
      companiesService.findOne.mockRejectedValueOnce(new Error('Database error'));

      mockClient.query.mockResolvedValueOnce({}); // BEGIN

      await expect(service.create(createDto, 'token')).rejects.toThrow();
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should allow DIRECTOR to create interaction with any customer type', async () => {
      const directorUser = { ...mockUser, role: 'DIRECTOR' };
      const supplierCustomer = { ...mockCustomer, customerType: 'SUPPLIER' };

      authService.validateToken.mockResolvedValueOnce(directorUser);
      productsService.findOne.mockResolvedValueOnce(mockProduct as any);
      companiesService.findOne.mockResolvedValueOnce(supplierCustomer as any);

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{
            id: 'product-id',
            name: 'Test Product',
            status: 'active',
          }],
        }) // Batch product validation query
        .mockResolvedValueOnce({
          rows: [{ id: 'association-id' }], // Association check
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'interaction-id',
            product_id: 'product-id',
            customer_id: 'customer-id',
            person_id: null, // Story 20.5: Include person_id in response
            interaction_type: FrontendInteractionType.INITIAL_CONTACT,
            interaction_date: new Date('2025-01-03T10:00:00Z'),
            description: 'Test interaction',
            status: null,
            additional_info: null,
            created_at: new Date(),
            created_by: 'user-id',
          }],
        }) // INSERT interaction (single record)
        .mockResolvedValueOnce({}) // INSERT interaction_products associations
        .mockResolvedValueOnce({}); // COMMIT

      const result = await service.create(createDto, 'token');

      expect(result).toBeDefined();
      expect(result.id).toBe('interaction-id');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should allow DIRECTOR to create interaction with BUYER customer type', async () => {
      const directorUser = { ...mockUser, role: 'DIRECTOR' };

      authService.validateToken.mockResolvedValueOnce(directorUser);
      productsService.findOne.mockResolvedValueOnce(mockProduct as any);
      companiesService.findOne.mockResolvedValueOnce(mockCustomer as any);

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{
            id: 'product-id',
            name: 'Test Product',
            status: 'active',
          }],
        }) // Batch product validation query
        .mockResolvedValueOnce({
          rows: [{ id: 'association-id' }], // Association check
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'interaction-id',
            product_id: 'product-id',
            customer_id: 'customer-id',
            person_id: null, // Story 20.5: Include person_id in response
            interaction_type: FrontendInteractionType.INITIAL_CONTACT,
            interaction_date: new Date('2025-01-03T10:00:00Z'),
            description: 'Test interaction',
            status: null,
            additional_info: null,
            created_at: new Date(),
            created_by: 'user-id',
          }],
        }) // INSERT interaction (single record)
        .mockResolvedValueOnce({}) // INSERT interaction_products associations
        .mockResolvedValueOnce({}); // COMMIT

      const result = await service.create(createDto, 'token');

      expect(result).toBeDefined();
      expect(result.id).toBe('interaction-id');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should throw UnauthorizedException if user role is null', async () => {
      const nullRoleUser = { ...mockUser, role: null as any };
      authService.validateToken.mockResolvedValueOnce(nullRoleUser);

      mockClient.query.mockResolvedValueOnce({}); // BEGIN

      await expect(service.create(createDto, 'token')).rejects.toThrow(UnauthorizedException);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should throw UnauthorizedException if user role is undefined', async () => {
      const undefinedRoleUser = { ...mockUser, role: undefined as any };
      authService.validateToken.mockResolvedValueOnce(undefinedRoleUser);

      mockClient.query.mockResolvedValueOnce({}); // BEGIN

      await expect(service.create(createDto, 'token')).rejects.toThrow(UnauthorizedException);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should create interaction with valid status enum value', async () => {
      const createDtoWithStatus: CreateInteractionDto = {
        ...createDto,
        status: InteractionStatus.IN_PROGRESS,
        description: 'Test interaction with status',
      };

      authService.validateToken.mockResolvedValueOnce(mockUser);
      productsService.findOne.mockResolvedValueOnce(mockProduct as any);
      companiesService.findOne.mockResolvedValueOnce(mockCustomer as any);

        mockClient.query
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({
            rows: [{
              id: 'product-id',
              name: 'Test Product',
              status: 'active',
            }],
          }) // Batch product validation query
          .mockResolvedValueOnce({
            rows: [{ id: 'association-id' }], // Association check
          })
          .mockResolvedValueOnce({
            rows: [{
              id: 'interaction-id',
              product_id: 'product-id',
              customer_id: 'customer-id',
              interaction_type: FrontendInteractionType.INITIAL_CONTACT,
              interaction_date: new Date('2025-01-03T10:00:00Z'),
              description: 'Test interaction with status',
              status: InteractionStatus.IN_PROGRESS,
              additional_info: null,
              created_at: new Date(),
              created_by: 'user-id',
            }],
          }) // INSERT
          .mockResolvedValueOnce({}); // COMMIT

      const result = await service.create(createDtoWithStatus, 'token');

      expect(result).toBeDefined();
      expect(result.id).toBe('interaction-id');
      expect(result.status).toBe(InteractionStatus.IN_PROGRESS);
      expect(result.description).toBe('Test interaction with status');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should create interaction with all status enum values', async () => {
      const statusValues = [
        InteractionStatus.IN_PROGRESS,
        InteractionStatus.COMPLETED,
        InteractionStatus.CANCELLED,
        InteractionStatus.NEEDS_FOLLOW_UP,
      ];

      for (const status of statusValues) {
        const createDtoWithStatus: CreateInteractionDto = {
          ...createDto,
          status,
        };

        authService.validateToken.mockResolvedValueOnce(mockUser);
        productsService.findOne.mockResolvedValueOnce(mockProduct as any);
        companiesService.findOne.mockResolvedValueOnce(mockCustomer as any);

        mockClient.query
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({
            rows: [{
              id: 'product-id',
              name: 'Test Product',
              status: 'active',
            }],
          }) // Batch product validation query
          .mockResolvedValueOnce({
            rows: [{ id: 'association-id' }], // Association check
          })
          .mockResolvedValueOnce({
            rows: [{
              id: 'interaction-id',
              product_id: 'product-id',
              customer_id: 'customer-id',
              interaction_type: FrontendInteractionType.INITIAL_CONTACT,
              interaction_date: new Date('2025-01-03T10:00:00Z'),
              description: null,
              status,
              additional_info: null,
              created_at: new Date(),
              created_by: 'user-id',
            }],
          }) // INSERT
          .mockResolvedValueOnce({}); // COMMIT

        const result = await service.create(createDtoWithStatus, 'token');

        expect(result).toBeDefined();
        expect(result.status).toBe(status);
      }
    });

    it('should create interaction with description up to 5000 characters', async () => {
      const longDescription = 'a'.repeat(5000);
      const createDtoWithLongDescription: CreateInteractionDto = {
        ...createDto,
        description: longDescription,
      };

      authService.validateToken.mockResolvedValueOnce(mockUser);
      productsService.findOne.mockResolvedValueOnce(mockProduct as any);
      companiesService.findOne.mockResolvedValueOnce(mockCustomer as any);

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{
            id: 'product-id',
            name: 'Test Product',
            status: 'active',
          }],
        }) // Batch product validation query
        .mockResolvedValueOnce({
          rows: [{ id: 'association-id' }], // Association check
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'interaction-id',
            product_id: 'product-id',
            customer_id: 'customer-id',
            interaction_type: FrontendInteractionType.INITIAL_CONTACT,
            interaction_date: new Date('2025-01-03T10:00:00Z'),
            description: longDescription,
            status: null,
            additional_info: null,
            created_at: new Date(),
            created_by: 'user-id',
          }],
        }) // INSERT interaction (single record)
        .mockResolvedValueOnce({}) // INSERT interaction_products associations
        .mockResolvedValueOnce({}); // COMMIT

      const result = await service.create(createDtoWithLongDescription, 'token');

      expect(result).toBeDefined();
      expect(result.description).toBe(longDescription);
      expect(result.description.length).toBe(5000);
    });

    // Story 20.8: Test multi-product association (1:N model)
    describe('multi-product association (Story 20.8)', () => {
      it('should create a single interaction record with multiple product associations', async () => {
        authService.validateToken.mockResolvedValueOnce(mockUser);
        productsService.findOne.mockResolvedValueOnce(mockProduct as any);
        companiesService.findOne.mockResolvedValueOnce(mockCustomer as any);
        
        mockClient.query
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({
            rows: [
              { id: 'product-id-1', name: 'Test Product 1', status: 'active' },
              { id: 'product-id-2', name: 'Test Product 2', status: 'active' },
            ],
          }) // Batch product validation query
          .mockResolvedValueOnce({
            rows: [{ id: 'association-id-1' }],
          }) // Association check for product 1
          .mockResolvedValueOnce({
            rows: [{ id: 'association-id-2' }],
          }) // Association check for product 2
          .mockResolvedValueOnce({
            rows: [{
              id: 'interaction-id',
              product_id: 'product-id-1', // First product for backward compatibility
              customer_id: 'customer-id',
              interaction_type: FrontendInteractionType.INITIAL_CONTACT,
              interaction_date: new Date('2025-01-03T10:00:00Z'),
              description: 'Test interaction with multiple products',
              status: null,
              additional_info: null,
              created_at: new Date(),
              created_by: 'user-id',
            }],
          }) // INSERT interaction (single record)
          .mockResolvedValueOnce({}) // INSERT interaction_products associations
          .mockResolvedValueOnce({}); // COMMIT

        const result = await service.create(createDtoMultipleProducts, 'token');

        expect(result).toBeDefined();
        expect(result.id).toBe('interaction-id');
        expect(result.createdInteractionIds).toEqual(['interaction-id']); // Single interaction ID
        
        // Verify that interaction_products insert was called with both product IDs
        const insertCalls = mockClient.query.mock.calls.filter(call => 
          call[0] && typeof call[0] === 'string' && call[0].includes('INSERT INTO interaction_products')
        );
        expect(insertCalls.length).toBe(1);
        expect(insertCalls[0][1]).toContain('product-id-1');
        expect(insertCalls[0][1]).toContain('product-id-2');
      });

      it('should create a single interaction record with single product association', async () => {
        authService.validateToken.mockResolvedValueOnce(mockUser);
        productsService.findOne.mockResolvedValueOnce(mockProduct as any);
        companiesService.findOne.mockResolvedValueOnce(mockCustomer as any);
        
        mockClient.query
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({
            rows: [{
              id: 'product-id',
              name: 'Test Product',
              status: 'active',
            }],
          }) // Batch product validation query
          .mockResolvedValueOnce({
            rows: [{ id: 'association-id' }],
          }) // Association check
          .mockResolvedValueOnce({
            rows: [{
              id: 'interaction-id',
              product_id: 'product-id',
              customer_id: 'customer-id',
              interaction_type: FrontendInteractionType.INITIAL_CONTACT,
              interaction_date: new Date('2025-01-03T10:00:00Z'),
              description: 'Test interaction',
              status: null,
              additional_info: null,
              created_at: new Date(),
              created_by: 'user-id',
            }],
          }) // INSERT interaction (single record)
          .mockResolvedValueOnce({}) // INSERT interaction_products associations
          .mockResolvedValueOnce({}); // COMMIT

        const result = await service.create(createDto, 'token');

        expect(result).toBeDefined();
        expect(result.id).toBe('interaction-id');
        expect(result.createdInteractionIds).toEqual(['interaction-id']); // Single interaction ID
        
        // Verify that interaction_products insert was called
        const insertCalls = mockClient.query.mock.calls.filter(call => 
          call[0] && typeof call[0] === 'string' && call[0].includes('INSERT INTO interaction_products')
        );
        expect(insertCalls.length).toBe(1);
      });
    });
  });
});

