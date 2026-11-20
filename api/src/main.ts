import 'reflect-metadata'
import { createApp } from './app'

async function bootstrap() {
  const app = await createApp()
  app.enableShutdownHooks()
  await app.listen(3000, process.env.HOST ?? '127.0.0.1')
}

bootstrap().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'CMS failed to start.')
  process.exitCode = 1
})
