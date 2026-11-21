import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { AdminController } from './admin/admin.controller'
import { CmsConfig } from './admin/cms-config'
import { GithubOAuth } from './admin/github-oauth'
import { OwnerAuth } from './admin/owner-auth'
import { OwnerGuard } from './admin/owner.guard'
import { Sessions } from './admin/sessions'
import { Database } from './database/database'
import { GitHubActivity } from './contributions/github-activity'
import { GitHubActivityController } from './contributions/github-activity.controller'
import { HealthController } from './health.controller'
import { AdminPostsController } from './posts/admin-posts.controller'
import { PublicPostsController } from './posts/public-posts.controller'
import { PostsRepository } from './posts/posts.repository'
import { PostsService } from './posts/posts.service'

@Module({
  controllers: [
    HealthController,
    AdminController,
    GitHubActivityController,
    AdminPostsController,
    PublicPostsController,
  ],
  providers: [
    CmsConfig,
    GithubOAuth,
    Sessions,
    OwnerAuth,
    GitHubActivity,
    Database,
    PostsRepository,
    PostsService,
    { provide: APP_GUARD, useClass: OwnerGuard },
  ],
})
export class AppModule {}
