/**
 * Restore Controller Unit Tests
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RestoreController } from './restore.controller';
import { RestoreService } from './restore.service';
import { AdminGuard } from '../users/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RestoreRequestDto } from './dto/restore-request.dto';

describe('RestoreController', () => {
  let controller: RestoreController;
  let restoreService: jest.Mocked<RestoreService>;

  beforeEach(async () => {
    const mockRestoreService = {
      executeRestore: jest.fn(),
      getRestoreStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RestoreController],
      providers: [
        {
          provide: RestoreService,
          useValue: mockRestoreService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RestoreController>(RestoreController);
    restoreService = module.get(RestoreService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('restore', () => {
    it('should execute restore operation', async () => {
      const mockRequest: RestoreRequestDto = {
        backupId: 'backup-123',
      };
      const mockToken = 'test-token';
      const mockOperatorId = 'operator-123';
      const mockRestoreId = 'restore-123';

      restoreService.executeRestore.mockResolvedValueOnce(mockRestoreId);

      const req = { user: { id: mockOperatorId } };
      const result = await controller.restore(mockRequest, mockToken, req as any);

      expect(result).toEqual({ restoreId: mockRestoreId });
      expect(restoreService.executeRestore).toHaveBeenCalledWith(
        mockRequest.backupId,
        mockToken,
        mockOperatorId,
      );
    });
  });

  describe('getStatus', () => {
    it('should return restore status if exists', async () => {
      const mockRestoreId = 'restore-123';
      const mockStatus = {
        restoreId: mockRestoreId,
        status: 'running' as const,
        progress: 50,
        message: 'Restoring...',
        startedAt: new Date(),
      };
      restoreService.getRestoreStatus.mockReturnValueOnce(mockStatus);

      const result = await controller.getStatus(mockRestoreId);
      expect(result).toEqual(mockStatus);
      expect(restoreService.getRestoreStatus).toHaveBeenCalledWith(mockRestoreId);
    });

    it('should return failed status if restore not found', async () => {
      const mockRestoreId = 'non-existent';
      restoreService.getRestoreStatus.mockReturnValueOnce(null);

      const result = await controller.getStatus(mockRestoreId);
      expect(result.status).toBe('failed');
      expect(result.errorMessage).toBe('Restore ID not found or expired');
    });
  });
});

