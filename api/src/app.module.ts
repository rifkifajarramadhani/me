import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { AdminController } from './admin/admin.controller'
import { CmsConfig } from './admin/cms-config'
import { GithubOAuth } from './admin/github-oauth'
import { OwnerAuth } from './admin/owner-auth'
import { OwnerGuard } from './admin/owner.guard'
import { Sessions } from './admin/sessions'
import { HealthController } from './health.controller'

@Module({
  controllers: [HealthController, AdminController],
  providers: [
    CmsConfig,
    GithubOAuth,
    Sessions,
    OwnerAuth,
    { provide: APP_GUARD, useClass: OwnerGuard },
  ],
})
export class AppModule {}
