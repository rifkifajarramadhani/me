import { Controller, Get, Header } from '@nestjs/common'

@Controller()
export class HealthController {
  @Get('healthz')
  @Header('Cache-Control', 'no-store')
  health() {
    return { status: 'ok' }
  }
}
