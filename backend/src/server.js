import app from './app.js'
import { env } from './config/env.js'
import { logger } from './utils/logger.js'

const server = app.listen(env.port, () => {
  logger.info('server_started', {
    port: env.port,
  })
})

server.on('error', (error) => {
  if (error?.code === 'EADDRINUSE') {
    logger.error('server_port_in_use', {
      port: env.port,
      message: `Port ${env.port} is already in use. Stop the existing process before starting the backend again.`,
    })
    process.exit(1)
  }

  throw error
})
