import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableShutdownHooks()
  await app.listen(3000, process.env.HOST ?? '127.0.0.1')
}

bootstrap().catch(() => {
  console.error('CMS failed to start.')
  process.exitCode = 1
})
