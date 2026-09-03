import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InitiativesModule } from '../initiatives/initiatives.module';
import { UpdatesController } from './updates.controller';
import { UpdatesService } from './updates.service';
import { WorkstreamScopeGuard } from './workstream-scope.guard';

@Module({
  imports: [AuthModule, InitiativesModule],
  controllers: [UpdatesController],
  providers: [UpdatesService, WorkstreamScopeGuard],
})
export class UpdatesModule {}
