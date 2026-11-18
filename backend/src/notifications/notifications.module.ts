import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

/**
 * `@Global()` for one specific reason: `AuthModule`'s sign-up flow needs
 * `NotificationsService` to alert admins, while this module needs
 * `AuthModule` for `JwtAuthGuard` on the feed endpoints. Exporting globally
 * keeps that a one-way import (notifications → auth) instead of a circular
 * pair needing `forwardRef` at both ends. Same pattern as `SupabaseModule`.
 */
@Global()
@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
