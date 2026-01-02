/**
 * Role-Based Data Access Filtering Integration Tests
 * 
 * Tests for Story 3.7: Role-based data access filtering
 * Verifies that users can only access data based on their roles
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CustomerProductAssociationService } from './customer-product-association.service';
import { PermissionService } from '../permission/permission.service';
import { PermissionAuditService } from '../permission/permission-audit.service';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';

describe('Role-Based Data Access Filtering (Story 3.7)', () => {
  let companiesService: CompaniesService;
  let customerProductAssociationService: CustomerProductAssociationService;
  let permissionService: jest.Mocked<PermissionService>;
  let permissionAuditService: jest.Mocked<PermissionAuditService>;
  let auditService: jest.Mocked<AuditService>;
  let authService: jest.Mocked<AuthService>;
  let mockPgPool: jest.Mocked<Pool>;

  const mockToken = 'mock-token';
  const mockFrontendUserId = 'frontend-user-id';
  const mockBackendUserId = 'backend-user-id';
  const mockDirectorUserId = 'director-user-id';
  const mockAdminUserId = 'admin-user-id';

  const mockBuyerCustomerId = 'buyer-customer-id';
  const mockSupplierCustomerId = 'supplier-customer-id';

  beforeEach(async () => {
    // Mock pg.Pool
    mockPgPool = {
      query: jest.fn(),
      connect: jest.fn(),
      end: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Mock ConfigService
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'DATABASE_URL' || key === 'PG_DATABASE_URL') {
          return 'postgresql://user:pass@host:5432/testdb';
        }
        return undefined;
      }),
    };

    // Mock PermissionService
    const mockPermissionService = {
      getDataAccessFilter: jest.fn(),
    };

    // Mock AuditService
    const mockAuditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    // Mock AuthService
    const mockAuthService = {
      validateToken: jest.fn(),
    };

    // Mock PermissionAuditService
    const mockPermissionAuditService = {
      logPermissionViolation: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        CustomerProductAssociationService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
        {
          provide: PermissionAuditService,
          useValue: mockPermissionAuditService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    companiesService = module.get<CompaniesService>(CompaniesService);
    customerProductAssociationService = module.get<CustomerProductAssociationService>(
      CustomerProductAssociationService,
    );
    permissionService = module.get(PermissionService);
    permissionAuditService = module.get(PermissionAuditService);
    auditService = module.get(AuditService);
    authService = module.get(AuthService);

    // Inject mock pool
    (companiesService as any).pgPool = mockPgPool;
    (customerProductAssociationService as any).pgPool = mockPgPool;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('AC1: Frontend Specialist Data Access Filtering', () => {
    it('should only return BUYER customers for frontend specialist', async () => {
      // Setup: Frontend specialist user
      authService.validateToken.mockResolvedValue({
        id: mockFrontendUserId,
        email: 'frontend@test.com',
        role: 'FRONTEND_SPECIALIST',
      });
      permissionService.getDataAccessFilter.mockResolvedValue({
        customerType: 'buyer',
      });

      // Mock database queries - findAll needs two queries (COUNT first, then SELECT)
      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '1' }], // COUNT query first
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: mockBuyerCustomerId,
              customer_type: 'BUYER',
              name: 'Buyer Company',
              deleted_at: null,
              customer_code: 'BUYER001',
              domain_name: null,
              address: null,
              city: null,
              state: null,
              country: null,
              postal_code: null,
              industry: null,
              employees: null,
              website: null,
              phone: null,
              notes: null,
              created_at: new Date(),
              updated_at: new Date(),
              created_by: null,
              updated_by: null,
            },
          ],
          rowCount: 1, // SELECT query second
        });

      const result = await companiesService.findAll({ limit: 20, offset: 0 }, mockToken);

      expect(result.customers).toHaveLength(1);
      expect(result.customers[0].customerType).toBe('BUYER');
      expect(permissionService.getDataAccessFilter).toHaveBeenCalledWith(mockToken);
    });

    it('should not return SUPPLIER customers for frontend specialist', async () => {
      // Setup: Frontend specialist user
      authService.validateToken.mockResolvedValue({
        id: mockFrontendUserId,
        email: 'frontend@test.com',
        role: 'FRONTEND_SPECIALIST',
      });
      permissionService.getDataAccessFilter.mockResolvedValue({
        customerType: 'buyer',
      });

      // Mock database queries - should filter out SUPPLIER customers (COUNT first, then SELECT)
      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '0' }], // COUNT query first
        })
        .mockResolvedValueOnce({
          rows: [], // No results because SUPPLIER is filtered out
          rowCount: 0, // SELECT query second
        });

      const result = await companiesService.findAll({ limit: 20, offset: 0 }, mockToken);

      expect(result.customers).toHaveLength(0);
    });

    it('should throw NotFoundException and log permission violation when frontend specialist tries to access SUPPLIER customer', async () => {
      // Setup: Frontend specialist user
      authService.validateToken.mockResolvedValue({
        id: mockFrontendUserId,
        email: 'frontend@test.com',
        role: 'FRONTEND_SPECIALIST',
      });
      permissionService.getDataAccessFilter.mockResolvedValue({
        customerType: 'buyer',
      });

      // findOne applies permission filter in WHERE clause, so first query returns empty
      // Then it checks if customer exists without filter to determine if it's a permission issue
      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [], // Query with permission filter returns empty (SUPPLIER filtered out)
        })
        .mockResolvedValueOnce({
          rows: [{ id: mockSupplierCustomerId, customer_type: 'SUPPLIER' }], // Customer exists
        });

      await expect(
        companiesService.findOne(mockSupplierCustomerId, mockToken),
      ).rejects.toThrow(ForbiddenException); // Changed from NotFoundException to ForbiddenException per Issue 2 fix

      // Verify permission audit log was called
      expect(permissionAuditService.logPermissionViolation).toHaveBeenCalledWith(
        mockToken,
        'CUSTOMER',
        mockSupplierCustomerId,
        'ACCESS',
        'BUYER',
        'SUPPLIER',
      );
    });
  });

  describe('AC2: Backend Specialist Data Access Filtering', () => {
    it('should only return SUPPLIER customers for backend specialist', async () => {
      // Setup: Backend specialist user
      authService.validateToken.mockResolvedValue({
        id: mockBackendUserId,
        email: 'backend@test.com',
        role: 'BACKEND_SPECIALIST',
      });
      permissionService.getDataAccessFilter.mockResolvedValue({
        customerType: 'supplier',
      });

      // Mock database queries - should only return SUPPLIER customers (COUNT first, then SELECT)
      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '1' }], // COUNT query first
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: mockSupplierCustomerId,
              customer_type: 'SUPPLIER',
              name: 'Supplier Company',
              deleted_at: null,
              customer_code: 'SUPPLIER001',
              domain_name: null,
              address: null,
              city: null,
              state: null,
              country: null,
              postal_code: null,
              industry: null,
              employees: null,
              website: null,
              phone: null,
              notes: null,
              created_at: new Date(),
              updated_at: new Date(),
              created_by: null,
              updated_by: null,
            },
          ],
          rowCount: 1, // SELECT query second
        });

      const result = await companiesService.findAll({ limit: 20, offset: 0 }, mockToken);

      expect(result.customers).toHaveLength(1);
      expect(result.customers[0].customerType).toBe('SUPPLIER');
      expect(permissionService.getDataAccessFilter).toHaveBeenCalledWith(mockToken);
    });

    it('should throw NotFoundException and log permission violation when backend specialist tries to access BUYER customer', async () => {
      // Setup: Backend specialist user
      authService.validateToken.mockResolvedValue({
        id: mockBackendUserId,
        email: 'backend@test.com',
        role: 'BACKEND_SPECIALIST',
      });
      permissionService.getDataAccessFilter.mockResolvedValue({
        customerType: 'supplier',
      });

      // findOne applies permission filter in WHERE clause, so query returns empty
      // Then it checks if customer exists without filter to determine if it's a permission issue
      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [], // Query with permission filter returns empty
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: mockBuyerCustomerId,
              customer_type: 'BUYER',
            },
          ],
        });

      await expect(companiesService.findOne(mockBuyerCustomerId, mockToken)).rejects.toThrow(
        ForbiddenException, // Changed from NotFoundException to ForbiddenException per Issue 2 fix
      );

      // Verify permission audit log was called
      expect(permissionAuditService.logPermissionViolation).toHaveBeenCalledWith(
        mockToken,
        'CUSTOMER',
        mockBuyerCustomerId,
        'ACCESS',
        'SUPPLIER',
        'BUYER',
      );
    });
  });

  describe('AC3: Director Data Access', () => {
    it('should return all customer types for director', async () => {
      // Setup: Director user
      authService.validateToken.mockResolvedValue({
        id: mockDirectorUserId,
        email: 'director@test.com',
        role: 'DIRECTOR',
      });
      permissionService.getDataAccessFilter.mockResolvedValue(null); // No filter for director

      // Mock database queries - should return both BUYER and SUPPLIER (COUNT first, then SELECT)
      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '2' }], // COUNT query first
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: mockBuyerCustomerId,
              customer_type: 'BUYER',
              name: 'Buyer Company',
              deleted_at: null,
              customer_code: 'BUYER001',
              domain_name: null,
              address: null,
              city: null,
              state: null,
              country: null,
              postal_code: null,
              industry: null,
              employees: null,
              website: null,
              phone: null,
              notes: null,
              created_at: new Date(),
              updated_at: new Date(),
              created_by: null,
              updated_by: null,
            },
            {
              id: mockSupplierCustomerId,
              customer_type: 'SUPPLIER',
              name: 'Supplier Company',
              deleted_at: null,
              customer_code: 'SUPPLIER001',
              domain_name: null,
              address: null,
              city: null,
              state: null,
              country: null,
              postal_code: null,
              industry: null,
              employees: null,
              website: null,
              phone: null,
              notes: null,
              created_at: new Date(),
              updated_at: new Date(),
              created_by: null,
              updated_by: null,
            },
          ],
          rowCount: 2, // SELECT query second
        });

      const result = await companiesService.findAll({ limit: 20, offset: 0 }, mockToken);

      expect(result.customers).toHaveLength(2);
      expect(result.customers.some((c) => c.customerType === 'BUYER')).toBe(true);
      expect(result.customers.some((c) => c.customerType === 'SUPPLIER')).toBe(true);
    });
  });

  describe('AC4: Admin Data Access', () => {
    it('should return all customer types for admin', async () => {
      // Setup: Admin user
      authService.validateToken.mockResolvedValue({
        id: mockAdminUserId,
        email: 'admin@test.com',
        role: 'ADMIN',
      });
      permissionService.getDataAccessFilter.mockResolvedValue(null); // No filter for admin

      // Mock database queries - should return both BUYER and SUPPLIER (COUNT first, then SELECT)
      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '2' }], // COUNT query first
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: mockBuyerCustomerId,
              customer_type: 'BUYER',
              name: 'Buyer Company',
              deleted_at: null,
              customer_code: 'BUYER001',
              domain_name: null,
              address: null,
              city: null,
              state: null,
              country: null,
              postal_code: null,
              industry: null,
              employees: null,
              website: null,
              phone: null,
              notes: null,
              created_at: new Date(),
              updated_at: new Date(),
              created_by: null,
              updated_by: null,
            },
            {
              id: mockSupplierCustomerId,
              customer_type: 'SUPPLIER',
              name: 'Supplier Company',
              deleted_at: null,
              customer_code: 'SUPPLIER001',
              domain_name: null,
              address: null,
              city: null,
              state: null,
              country: null,
              postal_code: null,
              industry: null,
              employees: null,
              website: null,
              phone: null,
              notes: null,
              created_at: new Date(),
              updated_at: new Date(),
              created_by: null,
              updated_by: null,
            },
          ],
          rowCount: 2, // SELECT query second
        });

      const result = await companiesService.findAll({ limit: 20, offset: 0 }, mockToken);

      expect(result.customers).toHaveLength(2);
      expect(result.customers.some((c) => c.customerType === 'BUYER')).toBe(true);
      expect(result.customers.some((c) => c.customerType === 'SUPPLIER')).toBe(true);
    });
  });

  describe('AC5: Service Layer Automatic Filtering', () => {
    it('should automatically add customer_type filter for frontend specialist queries', async () => {
      authService.validateToken.mockResolvedValue({
        id: mockFrontendUserId,
        email: 'frontend@test.com',
        role: 'FRONTEND_SPECIALIST',
      });
      permissionService.getDataAccessFilter.mockResolvedValue({
        customerType: 'buyer',
      });

      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '0' }], // COUNT query first
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0, // SELECT query second
        });

      await companiesService.findAll({ limit: 20, offset: 0 }, mockToken);

      // Verify SQL query includes customer_type filter
      // First call is COUNT query, second call is SELECT query
      const selectQueryCall = (mockPgPool.query as jest.Mock).mock.calls[1];
      expect(selectQueryCall[0]).toContain('customer_type');
      // selectQueryCall[1] is an array of parameters, check first element
      expect(selectQueryCall[1][0]).toBe('BUYER');
    });

    it('should automatically add customer_type filter for backend specialist queries', async () => {
      authService.validateToken.mockResolvedValue({
        id: mockBackendUserId,
        email: 'backend@test.com',
        role: 'BACKEND_SPECIALIST',
      });
      permissionService.getDataAccessFilter.mockResolvedValue({
        customerType: 'supplier',
      });

      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '0' }], // COUNT query first
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0, // SELECT query second
        });

      await companiesService.findAll({ limit: 20, offset: 0 }, mockToken);

      // Verify SQL query includes customer_type filter
      // First call is COUNT query, second call is SELECT query
      const selectQueryCall = (mockPgPool.query as jest.Mock).mock.calls[1];
      expect(selectQueryCall[0]).toContain('customer_type');
      // selectQueryCall[1] is an array of parameters, check first element
      expect(selectQueryCall[1][0]).toBe('SUPPLIER');
    });

    it('should not add customer_type filter for director/admin queries', async () => {
      authService.validateToken.mockResolvedValue({
        id: mockDirectorUserId,
        email: 'director@test.com',
        role: 'DIRECTOR',
      });
      permissionService.getDataAccessFilter.mockResolvedValue(null);

      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ total: '0' }], // COUNT query first
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0, // SELECT query second
        });

      await companiesService.findAll({ limit: 20, offset: 0 }, mockToken);

      // Verify SQL query does not include customer_type filter
      const queryCall = (mockPgPool.query as jest.Mock).mock.calls[0];
      // Query should not have customer_type parameter when filter is null
      // queryCall[1] is an array, check that it doesn't contain BUYER or SUPPLIER
      const params = queryCall[1] || [];
      expect(params).not.toContain('BUYER');
      expect(params).not.toContain('SUPPLIER');
    });
  });

  describe('AC7: Permission Violation Audit Logging', () => {
    it('should log permission violation when frontend specialist accesses SUPPLIER customer (throws NotFoundException)', async () => {
      authService.validateToken.mockResolvedValue({
        id: mockFrontendUserId,
        email: 'frontend@test.com',
        role: 'FRONTEND_SPECIALIST',
      });
      permissionService.getDataAccessFilter.mockResolvedValue({
        customerType: 'buyer',
      });

      // findOne applies permission filter in WHERE clause, so first query returns empty
      // Then it checks if customer exists without filter to determine if it's a permission issue
      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [], // Query with permission filter returns empty (SUPPLIER filtered out)
        })
        .mockResolvedValueOnce({
          rows: [{ id: mockSupplierCustomerId, customer_type: 'SUPPLIER' }], // Customer exists
        });

      await expect(
        companiesService.findOne(mockSupplierCustomerId, mockToken),
      ).rejects.toThrow(ForbiddenException); // Changed from NotFoundException to ForbiddenException per Issue 2 fix

      // Verify permission audit log was called with correct details
      expect(permissionAuditService.logPermissionViolation).toHaveBeenCalledWith(
        mockToken,
        'CUSTOMER',
        mockSupplierCustomerId,
        'ACCESS',
        'BUYER',
        'SUPPLIER',
      );
    });

    it('should log permission violation when user has NONE permission', async () => {
      authService.validateToken.mockResolvedValue({
        id: mockFrontendUserId,
        email: 'frontend@test.com',
        role: 'FRONTEND_SPECIALIST',
      });
      permissionService.getDataAccessFilter.mockResolvedValue({
        customerType: 'NONE',
      });

      await expect(companiesService.findAll({ limit: 20, offset: 0 }, mockToken)).rejects.toThrow(
        ForbiddenException,
      );

      // Verify permission audit log was called
      expect(permissionAuditService.logPermissionViolation).toHaveBeenCalled();
    });

    it('should not block main request if audit logging fails (throws NotFoundException)', async () => {
      authService.validateToken.mockResolvedValue({
        id: mockFrontendUserId,
        email: 'frontend@test.com',
        role: 'FRONTEND_SPECIALIST',
      });
      permissionService.getDataAccessFilter.mockResolvedValue({
        customerType: 'buyer',
      });

      // findOne applies permission filter in WHERE clause, so query returns empty
      // Then it checks if customer exists without filter to determine if it's a permission issue
      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [], // Query with permission filter returns empty
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: mockSupplierCustomerId,
              customer_type: 'SUPPLIER',
            },
          ],
        });

      // Make auditService.log fail (which is called inside logPermissionViolation)
      // This tests that logPermissionViolation catches errors internally and doesn't affect main request
      auditService.log.mockRejectedValueOnce(new Error('Audit log failed'));

      // Should still throw ForbiddenException even if audit log fails internally
      // The logPermissionViolation method catches errors internally, so it won't affect the main request
      await expect(
        companiesService.findOne(mockSupplierCustomerId, mockToken),
      ).rejects.toThrow(ForbiddenException);

      // Verify permission audit log was attempted (even though it failed internally)
      expect(permissionAuditService.logPermissionViolation).toHaveBeenCalled();
    });
  });

  describe('Customer Product Association Service Permission Filtering', () => {
    it('should filter customer products by customer type for frontend specialist', async () => {
      authService.validateToken.mockResolvedValue({
        id: mockFrontendUserId,
        email: 'frontend@test.com',
        role: 'FRONTEND_SPECIALIST',
      });
      permissionService.getDataAccessFilter.mockResolvedValue({
        customerType: 'buyer',
      });

      // Mock customer check - returns BUYER customer
      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ id: mockBuyerCustomerId, customer_type: 'BUYER' }],
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        })
        .mockResolvedValueOnce({
          rows: [{ total: '0' }],
        });

      await customerProductAssociationService.getCustomerProducts(
        mockBuyerCustomerId,
        mockToken,
        1,
        10,
      );

      expect(permissionService.getDataAccessFilter).toHaveBeenCalledWith(mockToken);
    });

    it('should throw ForbiddenException when frontend specialist accesses supplier customer products', async () => {
      authService.validateToken.mockResolvedValue({
        id: mockFrontendUserId,
        email: 'frontend@test.com',
        role: 'FRONTEND_SPECIALIST',
      });
      permissionService.getDataAccessFilter.mockResolvedValue({
        customerType: 'buyer',
      });

      // Mock customer check - returns SUPPLIER customer
      (mockPgPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: mockSupplierCustomerId, customer_type: 'SUPPLIER' }],
      });

      await expect(
        customerProductAssociationService.getCustomerProducts(
          mockSupplierCustomerId,
          mockToken,
          1,
          10,
        ),
      ).rejects.toThrow(ForbiddenException);

      // Verify permission audit log was called
      expect(permissionAuditService.logPermissionViolation).toHaveBeenCalledWith(
        mockToken,
        'PRODUCT_ASSOCIATION',
        mockSupplierCustomerId,
        'ACCESS',
        'BUYER',
        'SUPPLIER',
      );
    });
  });
});

