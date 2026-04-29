import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [ConfigModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
