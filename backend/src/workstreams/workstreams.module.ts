import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WorkstreamsController } from './workstreams.controller';
import { WorkstreamsService } from './workstreams.service';

@Module({
  imports: [AuthModule],
  controllers: [WorkstreamsController],
  providers: [WorkstreamsService],
})
export class WorkstreamsModule {}
