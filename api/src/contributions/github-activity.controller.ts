import {
  Controller,
  Get,
  Header,
  ServiceUnavailableException,
} from '@nestjs/common'
import { PublicRoute } from '../admin/owner.guard'
import { GitHubActivity } from './github-activity'

@Controller('api/github/contributions')
export class GitHubActivityController {
  constructor(private readonly activity: GitHubActivity) {}

  @Get()
  @PublicRoute()
  @Header('Cache-Control', 'no-store')
  async get() {
    const snapshot = await this.activity.get()
    if (!snapshot)
      throw new ServiceUnavailableException(
        'GitHub contribution activity is unavailable.',
      )
    return snapshot
  }
}
