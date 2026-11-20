import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InitiativesModule } from '../initiatives/initiatives.module';
import { MeetingsController } from './meetings.controller';
import { MilestoneHistoryController } from './milestone-history.controller';
import { UpdatesController } from './updates.controller';
import { UpdatesService } from './updates.service';
import { WorkstreamScopeGuard } from './workstream-scope.guard';

@Module({
  imports: [AuthModule, InitiativesModule],
  controllers: [UpdatesController, MilestoneHistoryController, MeetingsController],
  providers: [UpdatesService, WorkstreamScopeGuard],
})
export class UpdatesModule {}
