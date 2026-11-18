import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { WorkstreamsModule } from './workstreams/workstreams.module';
import { InitiativesModule } from './initiatives/initiatives.module';
import { MilestonesModule } from './milestones/milestones.module';
import { UpdatesModule } from './updates/updates.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    SupabaseModule,
    AuthModule,
    WorkstreamsModule,
    InitiativesModule,
    MilestonesModule,
    UpdatesModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
