import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InitiativesModule } from '../initiatives/initiatives.module';
import { MilestonesController } from './milestones.controller';
import { MilestonesService } from './milestones.service';

@Module({
  imports: [AuthModule, InitiativesModule],
  controllers: [MilestonesController],
  providers: [MilestonesService],
})
export class MilestonesModule {}
