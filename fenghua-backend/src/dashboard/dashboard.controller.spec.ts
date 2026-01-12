/**
 * Dashboard Controller Unit Tests
 * 
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DirectorOrAdminGuard } from '../users/guards/director-or-admin.guard';

describe('DashboardController', () => {
  let controller: DashboardController;
  let dashboardService: jest.Mocked<DashboardService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: {
            getOverview: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = { id: 'test-user-id', email: 'test@example.com', role: 'ADMIN' };
          request.headers = { authorization: 'Bearer mock-token' };
          return true;
        },
      })
      .overrideGuard(DirectorOrAdminGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    controller = module.get<DashboardController>(DashboardController);
    dashboardService = module.get(DashboardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return dashboard overview', async () => {
      const mockOverview = {
        totalCustomers: 100,
        totalBuyers: 60,
        totalSuppliers: 40,
        totalProducts: 200,
        totalInteractions: 500,
        newCustomersThisMonth: 10,
        newInteractionsThisMonth: 50,
      };

      dashboardService.getOverview.mockResolvedValue(mockOverview);

      const mockRequest = {
        headers: {
          authorization: 'Bearer mock-token',
        },
      };

      const result = await controller.getOverview(mockRequest as any);

      expect(result).toEqual(mockOverview);
      expect(dashboardService.getOverview).toHaveBeenCalledWith('mock-token');
    });
  });
});

