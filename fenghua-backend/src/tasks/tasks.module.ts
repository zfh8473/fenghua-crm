import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
