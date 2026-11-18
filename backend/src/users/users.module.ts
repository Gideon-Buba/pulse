import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersAccessController } from './users-access.controller';
import { UsersAccessGuard } from './users-access.guard';
import { UsersAccessService } from './users-access.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersAccessController, UsersController],
  providers: [UsersService, UsersAccessService, UsersAccessGuard],
})
export class UsersModule {}
