import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from './guards/admin.guard';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [ConfigModule, AuthModule, forwardRef(() => AuditModule)],
  providers: [UsersService, AdminGuard],
  controllers: [UsersController],
  exports: [UsersService, AdminGuard],
})
export class UsersModule {}

