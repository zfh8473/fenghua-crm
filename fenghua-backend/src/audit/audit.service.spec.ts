/**
 * Audit Service Unit Tests
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuditService } from './audit.service';
import { RoleChangeAuditLogDto, DataModificationAuditLogDto } from './dto/audit-log.dto';
import { Pool } from 'pg';

// Mock pg Pool
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn().mockResolvedValue(undefined),
  };
  return {
    Pool: jest.fn(() => mockPool),
  };
});

describe('AuditService', () => {
  let service: AuditService;
  let mockPgPool: any;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    // Mock ConfigService
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'DATABASE_URL' || key === 'PG_DATABASE_URL') {
          return 'postgresql://user:pass@host:5432/testdb';
        }
        return undefined;
      }),
    } as any;

    // Get mock pool instance
    const PoolClass = require('pg').Pool;
    mockPgPool = new PoolClass();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    
    // Inject mock pool
    (service as any).pgPool = mockPgPool;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logRoleChange', () => {
    it('should log role change successfully', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const roleChangeLog: RoleChangeAuditLogDto = {
        oldRole: 'FRONTEND_SPECIALIST',
        newRole: 'BACKEND_SPECIALIST',
        userId: 'user-id-123',
        operatorId: 'operator-id-456',
        timestamp: new Date(),
        reason: 'Role reassignment',
      };

      await service.logRoleChange(roleChangeLog);

      // Verify INSERT query was called
      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        expect.arrayContaining([
          'ROLE_CHANGE',
          'USER',
          'user-id-123',
          expect.any(String), // oldValue (JSON stringified)
          expect.any(String), // newValue (JSON stringified)
          'user-id-123',
          'operator-id-456',
          expect.any(Date),
          'Role reassignment',
          expect.any(String), // metadata (JSON stringified)
        ]),
      );
    });

    it('should log role change without reason', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const roleChangeLog: RoleChangeAuditLogDto = {
        oldRole: 'FRONTEND_SPECIALIST',
        newRole: 'BACKEND_SPECIALIST',
        userId: 'user-id-123',
        operatorId: 'operator-id-456',
        timestamp: new Date(),
      };

      await service.logRoleChange(roleChangeLog);

      // Verify INSERT query was called with null reason
      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        expect.arrayContaining([null]), // reason should be null
      );
    });
  });

  describe('getUserAuditLogs', () => {
    it('should return audit logs for user', async () => {
      const mockRow = {
        action: 'ROLE_CHANGE',
        entity_type: 'USER',
        entity_id: 'user-id-123',
        old_value: JSON.stringify('FRONTEND_SPECIALIST'),
        new_value: JSON.stringify('BACKEND_SPECIALIST'),
        user_id: 'user-id-123',
        operator_id: 'operator-id-456',
        timestamp: new Date('2025-01-03T10:00:00Z'),
        reason: null,
        metadata: JSON.stringify({ actionType: 'ROLE_ASSIGNMENT' }),
      };

      mockPgPool.query.mockResolvedValueOnce({
        rows: [mockRow],
        rowCount: 1,
      });

      const logs = await service.getUserAuditLogs('user-id-123');
      expect(logs.length).toBe(1);
      expect(logs[0].userId).toBe('user-id-123');
      expect(logs[0].action).toBe('ROLE_CHANGE');
      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['user-id-123', 100],
      );
    });

    it('should respect limit parameter', async () => {
      const mockRows = Array.from({ length: 3 }, (_, i) => ({
        action: 'ROLE_CHANGE',
        entity_type: 'USER',
        entity_id: 'user-id-123',
        old_value: JSON.stringify('NONE'),
        new_value: JSON.stringify('ADMIN'),
        user_id: 'user-id-123',
        operator_id: 'operator-id-456',
        timestamp: new Date(`2025-01-03T${10 + i}:00:00Z`),
        reason: null,
        metadata: JSON.stringify({ actionType: 'ROLE_ASSIGNMENT' }),
      }));

      mockPgPool.query.mockResolvedValueOnce({
        rows: mockRows,
        rowCount: 3,
      });

      const logs = await service.getUserAuditLogs('user-id-123', 3);
      expect(logs.length).toBe(3);
      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        ['user-id-123', 3],
      );
    });
  });

  describe('getAuditLogsByAction', () => {
    it('should return logs for specific action', async () => {
      const mockRow = {
        action: 'ROLE_CHANGE',
        entity_type: 'USER',
        entity_id: 'user-id-123',
        old_value: JSON.stringify('FRONTEND_SPECIALIST'),
        new_value: JSON.stringify('BACKEND_SPECIALIST'),
        user_id: 'user-id-123',
        operator_id: 'operator-id-456',
        timestamp: new Date('2025-01-03T10:00:00Z'),
        reason: null,
        metadata: JSON.stringify({ actionType: 'ROLE_ASSIGNMENT' }),
      };

      mockPgPool.query.mockResolvedValueOnce({
        rows: [mockRow],
        rowCount: 1,
      });

      const logs = await service.getAuditLogsByAction('ROLE_CHANGE');
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('ROLE_CHANGE');
      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE action = $1'),
        ['ROLE_CHANGE', 100],
      );
    });
  });

  describe('logDataModification', () => {
    it('should log data modification successfully', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const dataModificationLog: DataModificationAuditLogDto = {
        resourceType: 'PRODUCT',
        resourceId: 'product-id-123',
        oldValue: { name: 'Old Product', price: 100 },
        newValue: { name: 'New Product', price: 150 },
        changedFields: ['name', 'price'],
        userId: 'user-id-123',
        timestamp: new Date(),
        actionType: 'DATA_MODIFICATION',
      };

      await service.logDataModification(dataModificationLog);

      // Wait for setImmediate to complete
      await new Promise(resolve => setImmediate(resolve));

      // Verify INSERT query was called
      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        expect.arrayContaining([
          'DATA_MODIFICATION',
          'PRODUCT',
          'product-id-123',
          expect.any(String), // oldValue (JSON stringified)
          expect.any(String), // newValue (JSON stringified)
          'user-id-123',
          'user-id-123', // operatorId same as userId
          expect.any(Date),
          null, // reason
          expect.stringContaining('changedFields'), // metadata
        ]),
      );
    });

    it('should log data deletion successfully', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const dataModificationLog: DataModificationAuditLogDto = {
        resourceType: 'CUSTOMER',
        resourceId: 'customer-id-123',
        oldValue: { name: 'Customer Name', email: 'customer@example.com' },
        newValue: { name: 'Customer Name', email: 'customer@example.com', deletedAt: new Date() },
        changedFields: ['deletedAt'],
        userId: 'user-id-123',
        timestamp: new Date(),
        actionType: 'DATA_DELETION',
        reason: 'User requested deletion',
      };

      await service.logDataModification(dataModificationLog);

      // Wait for setImmediate to complete
      await new Promise(resolve => setImmediate(resolve));

      // Verify INSERT query was called with DATA_DELETION action
      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        expect.arrayContaining([
          'DATA_DELETION',
          'CUSTOMER',
          'customer-id-123',
          expect.any(String), // oldValue
          expect.any(String), // newValue
          'user-id-123',
          'user-id-123',
          expect.any(Date),
          'User requested deletion', // reason
          expect.stringContaining('changedFields'), // metadata
        ]),
      );
    });

    it('should handle large objects by storing only changed fields', async () => {
      mockPgPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Create a large object (> 1MB when stringified)
      const largeOldValue: Record<string, any> = {};
      const largeNewValue: Record<string, any> = {};
      for (let i = 0; i < 10000; i++) {
        largeOldValue[`field${i}`] = `value${i}`.repeat(100);
        largeNewValue[`field${i}`] = `value${i}`.repeat(100);
      }
      // Change only one field
      largeNewValue.field5000 = 'changed value';

      const dataModificationLog: DataModificationAuditLogDto = {
        resourceType: 'PRODUCT',
        resourceId: 'product-id-123',
        oldValue: largeOldValue,
        newValue: largeNewValue,
        changedFields: ['field5000'],
        userId: 'user-id-123',
        timestamp: new Date(),
        actionType: 'DATA_MODIFICATION',
      };

      await service.logDataModification(dataModificationLog);

      // Wait for setImmediate to complete
      await new Promise(resolve => setImmediate(resolve));

      // Verify that optimization was applied (only changed fields stored)
      const insertCall = mockPgPool.query.mock.calls.find(call => 
        call[0].includes('INSERT INTO audit_logs')
      );
      expect(insertCall).toBeDefined();
      
      const oldValueArg = insertCall[1][3]; // oldValue is 4th parameter (index 3)
      const newValueArg = insertCall[1][4]; // newValue is 5th parameter (index 4)
      
      const parsedOldValue = JSON.parse(oldValueArg);
      const parsedNewValue = JSON.parse(newValueArg);
      
      // Should only contain changed field and key fields (id, name, etc.)
      expect(Object.keys(parsedOldValue).length).toBeLessThan(10000);
      expect(Object.keys(parsedNewValue).length).toBeLessThan(10000);
      expect(parsedNewValue.field5000).toBe('changed value');
    });

    it('should not throw error if database pool is not initialized', async () => {
      (service as any).pgPool = null;

      const dataModificationLog: DataModificationAuditLogDto = {
        resourceType: 'PRODUCT',
        resourceId: 'product-id-123',
        oldValue: { name: 'Old Product' },
        newValue: { name: 'New Product' },
        changedFields: ['name'],
        userId: 'user-id-123',
        timestamp: new Date(),
      };

      // Should not throw
      await expect(service.logDataModification(dataModificationLog)).resolves.not.toThrow();
    });
  });
});
