import { Module } from '@nestjs/common';
import { TwentyClientService } from './twenty-client.service';

@Module({
  providers: [TwentyClientService],
  exports: [TwentyClientService],
})
export class TwentyClientModule {}

