/**
 * Audit Service Unit Tests
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { RoleChangeAuditLogDto } from './dto/audit-log.dto';

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  describe('logRoleChange', () => {
    it('should log role change successfully', async () => {
      const roleChangeLog: RoleChangeAuditLogDto = {
        oldRole: 'FRONTEND_SPECIALIST',
        newRole: 'BACKEND_SPECIALIST',
        userId: 'user-id-123',
        operatorId: 'operator-id-456',
        timestamp: new Date(),
        reason: 'Role reassignment',
      };

      await service.logRoleChange(roleChangeLog);

      const logs = await service.getUserAuditLogs('user-id-123');
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].action).toBe('ROLE_CHANGE');
      expect(logs[0].oldValue).toBe('FRONTEND_SPECIALIST');
      expect(logs[0].newValue).toBe('BACKEND_SPECIALIST');
    });

    it('should log role change without reason', async () => {
      const roleChangeLog: RoleChangeAuditLogDto = {
        oldRole: 'NONE',
        newRole: 'ADMIN',
        userId: 'user-id-123',
        operatorId: 'operator-id-456',
        timestamp: new Date(),
      };

      await service.logRoleChange(roleChangeLog);

      const logs = await service.getUserAuditLogs('user-id-123');
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].reason).toBeUndefined();
    });
  });

  describe('getUserAuditLogs', () => {
    it('should return audit logs for user', async () => {
      const roleChangeLog: RoleChangeAuditLogDto = {
        oldRole: 'FRONTEND_SPECIALIST',
        newRole: 'BACKEND_SPECIALIST',
        userId: 'user-id-123',
        operatorId: 'operator-id-456',
        timestamp: new Date(),
      };

      await service.logRoleChange(roleChangeLog);

      const logs = await service.getUserAuditLogs('user-id-123');
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].userId).toBe('user-id-123');
    });

    it('should respect limit parameter', async () => {
      // Create multiple logs
      for (let i = 0; i < 5; i++) {
        await service.logRoleChange({
          oldRole: 'NONE',
          newRole: 'ADMIN',
          userId: 'user-id-123',
          operatorId: 'operator-id-456',
          timestamp: new Date(),
        });
      }

      const logs = await service.getUserAuditLogs('user-id-123', 3);
      expect(logs.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getAuditLogsByAction', () => {
    it('should return logs for specific action', async () => {
      await service.logRoleChange({
        oldRole: 'FRONTEND_SPECIALIST',
        newRole: 'BACKEND_SPECIALIST',
        userId: 'user-id-123',
        operatorId: 'operator-id-456',
        timestamp: new Date(),
      });

      const logs = await service.getAuditLogsByAction('ROLE_CHANGE');
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].action).toBe('ROLE_CHANGE');
    });
  });
});

