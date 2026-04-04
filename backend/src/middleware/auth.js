import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

function unauthorized(message) {
  const error = new Error(message)
  error.status = 401
  return error
}

function forbidden(message) {
  const error = new Error(message)
  error.status = 403
  return error
}

export function authenticate(req, res, next) {
  try {
    const authorization = req.headers.authorization || ''

    if (!authorization.startsWith('Bearer ')) {
      throw unauthorized('请先登录')
    }

    const token = authorization.slice(7).trim()
    if (!token) {
      throw unauthorized('登录凭证无效')
    }

    const payload = jwt.verify(token, env.jwtSecret)
    req.auth = {
      userId: payload.userId,
      role: payload.role,
    }

    next()
  } catch (error) {
    logger.warn('auth_verify_failed', {
      path: req.originalUrl,
      error: error.message,
    })

    next(unauthorized('登录状态已失效，请重新登录'))
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.auth?.userId) {
      next(unauthorized('请先登录'))
      return
    }

    if (req.auth.role !== role) {
      next(forbidden('当前账号无权访问该页面'))
      return
    }

    next()
  }
}
