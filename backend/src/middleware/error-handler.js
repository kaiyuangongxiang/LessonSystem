import { logger } from '../utils/logger.js'

export function errorHandler(error, req, res, next) {
  logger.error('request_failed', {
    method: req.method,
    path: req.originalUrl,
    error: error.message,
    stack: error.stack,
  })

  const status = error.status || 500
  res.status(status).json({
    code: status,
    message: error.message || '服务器内部错误',
    data: null,
  })
}
