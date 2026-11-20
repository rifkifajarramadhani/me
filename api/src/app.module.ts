import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { AdminController } from './admin/admin.controller'
import { CmsConfig } from './admin/cms-config'
import { GithubOAuth } from './admin/github-oauth'
import { OwnerAuth } from './admin/owner-auth'
import { OwnerGuard } from './admin/owner.guard'
import { Sessions } from './admin/sessions'
import { CommitActivity } from './contributions/commit-activity'
import { CommitActivityController } from './contributions/commit-activity.controller'
import { HealthController } from './health.controller'

@Module({
  controllers: [HealthController, AdminController, CommitActivityController],
  providers: [
    CmsConfig,
    GithubOAuth,
    Sessions,
    OwnerAuth,
    CommitActivity,
    { provide: APP_GUARD, useClass: OwnerGuard },
  ],
})
export class AppModule {}
