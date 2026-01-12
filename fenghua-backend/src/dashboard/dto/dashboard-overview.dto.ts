/**
 * Dashboard Overview DTO
 * 
 * Response DTO for dashboard overview endpoint
 * All custom code is proprietary and not open source.
 */

import { IsNumber, Min } from 'class-validator';

export class DashboardOverviewDto {
  @IsNumber()
  @Min(0)
  totalCustomers: number;

  @IsNumber()
  @Min(0)
  totalBuyers: number;

  @IsNumber()
  @Min(0)
  totalSuppliers: number;

  @IsNumber()
  @Min(0)
  totalProducts: number;

  @IsNumber()
  @Min(0)
  totalInteractions: number;

  @IsNumber()
  @Min(0)
  newCustomersThisMonth: number;

  @IsNumber()
  @Min(0)
  newInteractionsThisMonth: number;
}

