import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import type { RequestHandler } from 'express'
import { AppModule } from './app.module'

const adminHeaders: RequestHandler = (_request, response, next) => {
  response.set({
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex',
  })
  next()
}

export async function createApp(logger: false | undefined = undefined) {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    abortOnError: false,
    logger,
  })
  app.disable('x-powered-by')
  // Post bodies carry the full editor document.
  app.useBodyParser('json', { limit: '1mb' })
  app.use('/admin', adminHeaders)
  return app
}
