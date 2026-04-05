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

function normalizeTeacherUsername(value) {
  const username = typeof value === 'string' ? value.trim() : ''

  if (!username) {
    throw badRequest('用户名不能为空')
  }

  if (username.length > 50) {
    throw badRequest('用户名不能超过50个字符')
  }

  return username
}

function normalizeTeacherPassword(value) {
  const password = typeof value === 'string' ? value.trim() : ''

  if (!password) {
    throw badRequest('密码不能为空')
  }

  if (password.length < 6) {
    throw badRequest('密码不能少于6位')
  }

  if (password.length > 50) {
    throw badRequest('密码不能超过50位')
  }

  return password
}

function normalizeTeacherName(value) {
  const teacherName = typeof value === 'string' ? value.trim() : ''

  if (!teacherName) {
    throw badRequest('教师姓名不能为空')
  }

  if (teacherName.length > 50) {
    throw badRequest('教师姓名不能超过50个字')
  }

  return teacherName
}

function normalizeGender(value) {
  if (value === undefined || value === null || value === '') {
    throw badRequest('性别不能为空')
  }

  if (value === '男' || value === '女' || value === '未知') {
    return value
  }

  throw badRequest('性别参数不合法')
}

function normalizeOptionalEmail(value) {
  const email = typeof value === 'string' ? value.trim() : ''

  if (!email) {
    return null
  }

  if (email.length > 100) {
    throw badRequest('邮箱不能超过100个字符')
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email)) {
    throw badRequest('邮箱格式不正确')
  }

  return email
}

function normalizeOptionalProfile(value) {
  const profile = typeof value === 'string' ? value.trim() : ''

  if (!profile) {
    return null
  }

  if (profile.length > 2000) {
    throw badRequest('个人简介不能超过2000个字')
  }

  return profile
}

function normalizeRequiredCollegeId(value) {
  if (value === undefined || value === null || value === '') {
    throw badRequest('所属学院不能为空')
  }

  const collegeId = Number(value)
  if (!Number.isInteger(collegeId) || collegeId <= 0) {
    throw badRequest('所属学院不合法')
  }

  return collegeId
}

async function ensureCollegeExists(collegeId) {
  if (collegeId === null) {
    return null
  }

  const [rows] = await pool.query(
    `SELECT college_id AS id, college_name AS name
     FROM college
     WHERE college_id = ?
     LIMIT 1`,
    [collegeId],
  )

  if (!rows.length) {
    throw badRequest('所选学院不存在')
  }

  return rows[0]
}

function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' })
}

export async function getTeacherRegisterOptions() {
  const [collegeRows] = await pool.query(
    `SELECT college_id AS id, college_name AS name
     FROM college
     ORDER BY college_name ASC`,
  )

  return {
    colleges: collegeRows.map((item) => ({
      id: Number(item.id),
      name: item.name,
    })),
    genders: ['男', '女', '未知'],
  }
}

export async function registerTeacher({ username, password, teacherName, gender, collegeId, email, profile }) {
  const normalizedUsername = normalizeTeacherUsername(username)
  const normalizedPassword = normalizeTeacherPassword(password)
  const normalizedTeacherName = normalizeTeacherName(teacherName)
  const normalizedGender = normalizeGender(gender)
  const normalizedCollegeId = normalizeRequiredCollegeId(collegeId)
  const normalizedEmail = normalizeOptionalEmail(email)
  const normalizedProfile = normalizeOptionalProfile(profile)

  await ensureCollegeExists(normalizedCollegeId)

  const [existing] = await pool.query('SELECT teacher_id FROM teacher_user WHERE username = ? LIMIT 1', [normalizedUsername])
  if (existing.length > 0) {
    logger.warn('teacher_register_conflict', { username: normalizedUsername })
    throw badRequest('用户名已存在')
  }

  const hashedPassword = await bcrypt.hash(normalizedPassword, 10)
  const [result] = await pool.query(
    `INSERT INTO teacher_user (username, password, teacher_name, gender, college_id, email, profile)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [normalizedUsername, hashedPassword, normalizedTeacherName, normalizedGender, normalizedCollegeId, normalizedEmail, normalizedProfile],
  )

  logger.info('teacher_register_success', {
    username: normalizedUsername,
    teacherId: result.insertId,
    collegeId: normalizedCollegeId,
  })

  return {
    teacherId: result.insertId,
    username: normalizedUsername,
    teacherName: normalizedTeacherName,
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
