import { Controller, Get, Header } from '@nestjs/common'
import { PublicRoute } from './admin/owner.guard'

@Controller()
export class HealthController {
  @Get('healthz')
  @PublicRoute()
  @Header('Cache-Control', 'no-store')
  health() {
    return { status: 'ok' }
  }
}
