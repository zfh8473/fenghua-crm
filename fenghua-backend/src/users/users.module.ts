import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from './guards/admin.guard';

@Module({
  imports: [ConfigModule, AuthModule],
  providers: [UsersService, AdminGuard],
  controllers: [UsersController],
  exports: [UsersService, AdminGuard],
})
export class UsersModule {}

