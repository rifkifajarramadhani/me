import {
  Controller,
  Get,
  Header,
  ServiceUnavailableException,
} from '@nestjs/common'
import { PublicRoute } from '../admin/owner.guard'
import { CommitActivity } from './commit-activity'

@Controller('api/github/contributions')
export class CommitActivityController {
  constructor(private readonly activity: CommitActivity) {}

  @Get()
  @PublicRoute()
  @Header('Cache-Control', 'no-store')
  async get() {
    const snapshot = await this.activity.get()
    if (!snapshot)
      throw new ServiceUnavailableException(
        'GitHub commit activity is unavailable.',
      )
    return snapshot
  }
}
