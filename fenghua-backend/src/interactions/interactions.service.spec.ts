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
            id: 'customer-id',
            customer_type: 'BUYER',
          }],
        }) // Customer validation query
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
            interaction_type: FrontendInteractionType.INITIAL_CONTACT,
            interaction_date: new Date('2025-01-03T10:00:00Z'),
            description: 'Test interaction',
            status: null,
            additional_info: null,
            created_at: new Date(),
            created_by: 'user-id',
          }],
        }) // INSERT interaction
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

      mockClient.query.mockResolvedValueOnce({}); // BEGIN

      await expect(service.create(createDto, 'token')).rejects.toThrow(ForbiddenException);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should throw ForbiddenException for BACKEND_SPECIALIST with wrong customer type', async () => {
      const backendUser = { ...mockUser, role: 'BACKEND_SPECIALIST' };
      authService.validateToken.mockResolvedValueOnce(backendUser);
      productsService.findOne.mockResolvedValueOnce(mockProduct as any);
      companiesService.findOne.mockResolvedValueOnce({ ...mockCustomer, customerType: 'BUYER' } as any);

      mockClient.query.mockResolvedValueOnce({}); // BEGIN

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
        }) // INSERT
        .mockResolvedValueOnce({}); // COMMIT

      const result = await service.create(backendCreateDto, 'token');

      expect(result).toBeDefined();
      expect(result.id).toBe('interaction-id');
      expect(result.interactionType).toBe(BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER);
      expect(authService.validateToken).toHaveBeenCalledWith('token');
      expect(productsService.findOne).toHaveBeenCalledWith('product-id', 'token');
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
        }) // INSERT
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
          metadata: { interactionType: BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER },
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
        }) // INSERT
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
        }) // INSERT
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
        }) // INSERT
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
        }) // INSERT
        .mockResolvedValueOnce({}); // COMMIT

      const result = await service.create(createDtoWithLongDescription, 'token');

      expect(result).toBeDefined();
      expect(result.description).toBe(longDescription);
      expect(result.description.length).toBe(5000);
    });

    // Task 6: Test automatic association creation
    describe('automatic association creation', () => {
      it('should automatically create association when interaction is created and association does not exist', async () => {
        authService.validateToken.mockResolvedValueOnce(mockUser);
        productsService.findOne.mockResolvedValueOnce(mockProduct as any);
        companiesService.findOne.mockResolvedValueOnce(mockCustomer as any);
        associationService.createAssociationInTransaction.mockResolvedValueOnce('association-id');
        
        mockClient.query
          .mockResolvedValueOnce({}) // BEGIN
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
          }) // INSERT interaction
          .mockResolvedValueOnce({}); // COMMIT

        const result = await service.create(createDto, 'token');

        expect(result).toBeDefined();
        expect(associationService.createAssociationInTransaction).toHaveBeenCalledWith(
          mockClient,
          'product-id',
          'customer-id',
          AssociationType.POTENTIAL_BUYER,
          'user-id',
        );
        // Wait for setImmediate to execute
        await new Promise((resolve) => setImmediate(resolve));
        expect(auditService.log).toHaveBeenCalled();
      });

      it('should set association type to POTENTIAL_BUYER for BUYER customer', async () => {
        const buyerCustomer = { ...mockCustomer, customerType: 'BUYER' };
        authService.validateToken.mockResolvedValueOnce(mockUser);
        productsService.findOne.mockResolvedValueOnce(mockProduct as any);
        companiesService.findOne.mockResolvedValueOnce(buyerCustomer as any);
        associationService.createAssociationInTransaction.mockResolvedValueOnce('association-id');
        
        mockClient.query
          .mockResolvedValueOnce({}) // BEGIN
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
          }) // INSERT interaction
          .mockResolvedValueOnce({}); // COMMIT

        await service.create(createDto, 'token');

        expect(associationService.createAssociationInTransaction).toHaveBeenCalledWith(
          mockClient,
          'product-id',
          'customer-id',
          AssociationType.POTENTIAL_BUYER,
          'user-id',
        );
      });

      it('should set association type to POTENTIAL_SUPPLIER for SUPPLIER customer', async () => {
        const supplierCustomer = { ...mockCustomer, customerType: 'SUPPLIER' };
        const supplierUser = { ...mockUser, role: 'BACKEND_SPECIALIST' };
        authService.validateToken.mockResolvedValueOnce(supplierUser);
        productsService.findOne.mockResolvedValueOnce(mockProduct as any);
        companiesService.findOne.mockResolvedValueOnce(supplierCustomer as any);
        associationService.createAssociationInTransaction.mockResolvedValueOnce('association-id');
        
        mockClient.query
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({
            rows: [{
              id: 'interaction-id',
              product_id: 'product-id',
              customer_id: 'customer-id',
              interaction_type: BackendInteractionType.PRODUCTION_PROGRESS,
              interaction_date: new Date('2025-01-03T10:00:00Z'),
              description: 'Test interaction',
              status: null,
              additional_info: null,
              created_at: new Date(),
              created_by: 'user-id',
            }],
          }) // INSERT interaction
          .mockResolvedValueOnce({}); // COMMIT

        const supplierDto: CreateInteractionDto = {
          ...createDto,
          interactionType: BackendInteractionType.PRODUCTION_PROGRESS,
        };

        await service.create(supplierDto, 'token');

        expect(associationService.createAssociationInTransaction).toHaveBeenCalledWith(
          mockClient,
          'product-id',
          'customer-id',
          AssociationType.POTENTIAL_SUPPLIER,
          'user-id',
        );
      });

      it('should not create duplicate association if association already exists', async () => {
        authService.validateToken.mockResolvedValueOnce(mockUser);
        productsService.findOne.mockResolvedValueOnce(mockProduct as any);
        companiesService.findOne.mockResolvedValueOnce(mockCustomer as any);
        // Return null to indicate association already exists
        associationService.createAssociationInTransaction.mockResolvedValueOnce(null);
        
        mockClient.query
          .mockResolvedValueOnce({}) // BEGIN
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
          }) // INSERT interaction
          .mockResolvedValueOnce({}); // COMMIT

        const result = await service.create(createDto, 'token');

        expect(result).toBeDefined();
        expect(associationService.createAssociationInTransaction).toHaveBeenCalled();
        // Wait for setImmediate to execute
        await new Promise((resolve) => setImmediate(resolve));
        // Audit log should be called for interaction creation, but not for association creation
        // (since association already exists)
        expect(auditService.log).toHaveBeenCalled();
        // Verify that association audit log was NOT called when association already exists
        const auditCalls = (auditService.log as jest.Mock).mock.calls;
        const associationAuditCall = auditCalls.find(
          (call) => call[0].action === 'ASSOCIATION_CREATED',
        );
        expect(associationAuditCall).toBeUndefined();
      });

      it('should not record audit log when association already exists (returns null)', async () => {
        authService.validateToken.mockResolvedValueOnce(mockUser);
        productsService.findOne.mockResolvedValueOnce(mockProduct as any);
        companiesService.findOne.mockResolvedValueOnce(mockCustomer as any);
        // Return null to indicate association already exists
        associationService.createAssociationInTransaction.mockResolvedValueOnce(null);
        
        mockClient.query
          .mockResolvedValueOnce({}) // BEGIN
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
          }) // INSERT interaction
          .mockResolvedValueOnce({}); // COMMIT

        await service.create(createDto, 'token');

        // Wait for setImmediate to execute
        await new Promise((resolve) => setImmediate(resolve));
        
        // Verify interaction audit log was called
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({ action: 'INTERACTION_CREATED' })
        );
        
        // Verify association audit log was NOT called
        const auditCalls = (auditService.log as jest.Mock).mock.calls;
        const associationAuditCall = auditCalls.find(
          (call) => call[0].action === 'ASSOCIATION_CREATED',
        );
        expect(associationAuditCall).toBeUndefined();
      });

      it('should rollback transaction if association creation fails', async () => {
        authService.validateToken.mockResolvedValueOnce(mockUser);
        productsService.findOne.mockResolvedValueOnce(mockProduct as any);
        companiesService.findOne.mockResolvedValueOnce(mockCustomer as any);
        // Simulate association creation failure
        associationService.createAssociationInTransaction.mockRejectedValueOnce(
          new Error('Association creation failed'),
        );
        
        mockClient.query
          .mockResolvedValueOnce({}) // BEGIN
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
          }) // INSERT interaction
          .mockResolvedValueOnce({}); // ROLLBACK

        await expect(service.create(createDto, 'token')).rejects.toThrow();

        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        // Interaction should not be committed
        expect(mockClient.query).not.toHaveBeenCalledWith('COMMIT');
      });

      it('should handle invalid customer type gracefully (role validation already ensures valid type)', async () => {
        // Note: Customer type validation is now handled by role-based validation (step 3)
        // which ensures customerType is either 'BUYER' or 'SUPPLIER' before reaching association creation
        // This test verifies that if somehow an invalid type gets through, the code handles it
        // In practice, this should not happen due to role validation, but we test the defensive code
        const directorUser = { ...mockUser, role: 'DIRECTOR' };
        const invalidCustomer = { ...mockCustomer, customerType: 'INVALID_TYPE' };
        authService.validateToken.mockResolvedValueOnce(directorUser);
        productsService.findOne.mockResolvedValueOnce(mockProduct as any);
        companiesService.findOne.mockResolvedValueOnce(invalidCustomer as any);
        // Since customerType is invalid, associationType will be null, and association creation should handle it
        associationService.createAssociationInTransaction.mockResolvedValueOnce(null);
        
        mockClient.query
          .mockResolvedValueOnce({}) // BEGIN
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
          }) // INSERT interaction
          .mockResolvedValueOnce({}); // COMMIT

        // The code should still work because associationType will be determined correctly
        // even if customerType is unexpected (though this shouldn't happen in practice)
        const result = await service.create(createDto, 'token');
        expect(result).toBeDefined();
        // Association creation should be skipped (returns null) but interaction should succeed
        expect(associationService.createAssociationInTransaction).toHaveBeenCalled();
      });

      it('should record audit log for association creation after transaction commits', async () => {
        authService.validateToken.mockResolvedValueOnce(mockUser);
        productsService.findOne.mockResolvedValueOnce(mockProduct as any);
        companiesService.findOne.mockResolvedValueOnce(mockCustomer as any);
        associationService.createAssociationInTransaction.mockResolvedValueOnce('association-id');
        
        mockClient.query
          .mockResolvedValueOnce({}) // BEGIN
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
          }) // INSERT interaction
          .mockResolvedValueOnce({}); // COMMIT

        await service.create(createDto, 'token');

        // Wait for setImmediate to execute
        await new Promise((resolve) => setImmediate(resolve));

        // Verify audit log was called for association creation
        const auditCalls = (auditService.log as jest.Mock).mock.calls;
        const associationAuditCall = auditCalls.find(
          (call) => call[0].action === 'ASSOCIATION_CREATED',
        );
        
        expect(associationAuditCall).toBeDefined();
        expect(associationAuditCall[0]).toMatchObject({
          action: 'ASSOCIATION_CREATED',
          entityType: 'PRODUCT_CUSTOMER_ASSOCIATION',
          entityId: 'association-id',
          userId: 'user-id',
          operatorId: 'user-id',
          metadata: {
            productId: 'product-id',
            customerId: 'customer-id',
            associationType: AssociationType.POTENTIAL_BUYER,
          },
        });
      });
    });
  });
});

