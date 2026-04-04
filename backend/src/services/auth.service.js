import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../config/db.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

function badRequest(message) {
  const error = new Error(message)
  error.status = 400
  return error
}

function unauthorized(message) {
  const error = new Error(message)
  error.status = 401
  return error
}

function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' })
}

export async function registerTeacher({ username, password }) {
  const trimmedUsername = username?.trim()

  if (!trimmedUsername) {
    throw badRequest('用户名不能为空')
  }

  if (!password) {
    throw badRequest('密码不能为空')
  }

  const [existing] = await pool.query('SELECT teacher_id FROM teacher_user WHERE username = ? LIMIT 1', [trimmedUsername])
  if (existing.length > 0) {
    logger.warn('teacher_register_conflict', { username: trimmedUsername })
    throw badRequest('用户名已存在')
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const [result] = await pool.query(
    'INSERT INTO teacher_user (username, password) VALUES (?, ?)',
    [trimmedUsername, hashedPassword],
  )

  logger.info('teacher_register_success', {
    username: trimmedUsername,
    teacherId: result.insertId,
  })

  return {
    teacherId: result.insertId,
    username: trimmedUsername,
  }
}

export async function login({ username, password }) {
  const trimmedUsername = username?.trim()

  if (!trimmedUsername || !password) {
    throw badRequest('请输入用户名和密码')
  }

  const [teachers] = await pool.query(
    'SELECT teacher_id, username, teacher_name, password, status FROM teacher_user WHERE username = ? LIMIT 1',
    [trimmedUsername],
  )

  if (teachers.length > 0) {
    const teacher = teachers[0]
    const passwordMatched = await bcrypt.compare(password, teacher.password)

    if (!passwordMatched) {
      logger.warn('teacher_login_failed', { username: trimmedUsername, reason: 'password_mismatch' })
      throw unauthorized('账号或密码错误')
    }

    if (teacher.status !== 1) {
      logger.warn('teacher_login_failed', { username: trimmedUsername, reason: 'disabled' })
      throw unauthorized('当前教师账号不可用')
    }

    logger.info('teacher_login_success', { username: trimmedUsername, teacherId: teacher.teacher_id })

    return {
      token: signToken({ userId: teacher.teacher_id, role: 'teacher' }),
      role: 'teacher',
      user: {
        id: teacher.teacher_id,
        username: teacher.username,
        name: teacher.teacher_name,
      },
    }
  }

  const [admins] = await pool.query(
    'SELECT admin_id, admin_name, real_name, admin_password FROM admin WHERE admin_name = ? LIMIT 1',
    [trimmedUsername],
  )

  if (admins.length > 0) {
    const admin = admins[0]
    const plainMatched = password === admin.admin_password
    const hashMatched = admin.admin_password.startsWith('$2')
      ? await bcrypt.compare(password, admin.admin_password)
      : false

    if (!plainMatched && !hashMatched) {
      logger.warn('admin_login_failed', { username: trimmedUsername, reason: 'password_mismatch' })
      throw unauthorized('账号或密码错误')
    }

    logger.info('admin_login_success', { username: trimmedUsername, adminId: admin.admin_id })

    return {
      token: signToken({ userId: admin.admin_id, role: 'admin' }),
      role: 'admin',
      user: {
        id: admin.admin_id,
        username: admin.admin_name,
        name: admin.real_name,
      },
    }
  }

  logger.warn('login_failed', { username: trimmedUsername, reason: 'user_not_found' })
  throw unauthorized('账号或密码错误')
}
