import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../config/db.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

const TOKEN_EXPIRES_IN_SECONDS = 30 * 60

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

function normalizeUsername(value, label = '用户名') {
  const username = typeof value === 'string' ? value.trim() : ''

  if (!username) {
    throw badRequest(`${label}不能为空`)
  }

  if (username.length > 50) {
    throw badRequest(`${label}不能超过50个字符`)
  }

  return username
}

function normalizePassword(value) {
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

function normalizeDisplayName(value, label) {
  const name = typeof value === 'string' ? value.trim() : ''

  if (!name) {
    throw badRequest(`${label}不能为空`)
  }

  if (name.length > 50) {
    throw badRequest(`${label}不能超过50个字符`)
  }

  return name
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

function normalizeRegisterRole(value) {
  return value === 'student' ? 'student' : 'teacher'
}

function normalizeLoginRole(value) {
  if (value === 'teacher' || value === 'student' || value === 'admin') {
    return value
  }

  throw badRequest('登录角色不合法')
}

async function ensureCollegeExists(collegeId) {
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

async function ensureUsernameUnusedAcrossRoles(username, current = {}) {
  const [teacherRows] = await pool.query(
    'SELECT teacher_id AS id FROM teacher_user WHERE username = ? AND status = 1 LIMIT 1',
    [username],
  )
  if (teacherRows.length && !(current.role === 'teacher' && Number(current.id) === Number(teacherRows[0].id))) {
    throw badRequest('用户名已存在，请更换后再试')
  }

  const [studentRows] = await pool.query(
    'SELECT student_id AS id FROM student_user WHERE username = ? AND status = 1 LIMIT 1',
    [username],
  )
  if (studentRows.length && !(current.role === 'student' && Number(current.id) === Number(studentRows[0].id))) {
    throw badRequest('用户名已存在，请更换后再试')
  }

  const [adminRows] = await pool.query('SELECT admin_id AS id FROM admin WHERE admin_name = ? LIMIT 1', [username])
  if (adminRows.length && !(current.role === 'admin' && Number(current.id) === Number(adminRows[0].id))) {
    throw badRequest('用户名已存在，请更换后再试')
  }
}

function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: TOKEN_EXPIRES_IN_SECONDS })
}

function buildLoginResult({ token, role, user }) {
  return {
    token,
    role,
    user,
    expiresAt: Date.now() + TOKEN_EXPIRES_IN_SECONDS * 1000,
  }
}

export async function getRegisterOptions() {
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
    roles: ['teacher', 'student'],
  }
}

async function registerTeacher({ username, password, teacherName, gender, collegeId, email, profile }) {
  const normalizedUsername = normalizeUsername(username)
  const normalizedPassword = normalizePassword(password)
  const normalizedTeacherName = normalizeDisplayName(teacherName, '教师姓名')
  const normalizedGender = normalizeGender(gender)
  const normalizedCollegeId = normalizeRequiredCollegeId(collegeId)
  const normalizedEmail = normalizeOptionalEmail(email)
  const normalizedProfile = normalizeOptionalProfile(profile)

  await ensureCollegeExists(normalizedCollegeId)
  await ensureUsernameUnusedAcrossRoles(normalizedUsername)

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
    id: Number(result.insertId),
    role: 'teacher',
    username: normalizedUsername,
    name: normalizedTeacherName,
  }
}

async function registerStudent({ username, password, studentName, gender, collegeId, email, profile }) {
  const normalizedUsername = normalizeUsername(username)
  const normalizedPassword = normalizePassword(password)
  const normalizedStudentName = normalizeDisplayName(studentName, '学生姓名')
  const normalizedGender = normalizeGender(gender)
  const normalizedCollegeId = normalizeRequiredCollegeId(collegeId)
  const normalizedEmail = normalizeOptionalEmail(email)
  const normalizedProfile = normalizeOptionalProfile(profile)

  await ensureCollegeExists(normalizedCollegeId)
  await ensureUsernameUnusedAcrossRoles(normalizedUsername)

  const hashedPassword = await bcrypt.hash(normalizedPassword, 10)
  const [result] = await pool.query(
    `INSERT INTO student_user (username, password, student_name, gender, college_id, email, profile)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [normalizedUsername, hashedPassword, normalizedStudentName, normalizedGender, normalizedCollegeId, normalizedEmail, normalizedProfile],
  )

  logger.info('student_register_success', {
    username: normalizedUsername,
    studentId: result.insertId,
    collegeId: normalizedCollegeId,
  })

  return {
    id: Number(result.insertId),
    role: 'student',
    username: normalizedUsername,
    name: normalizedStudentName,
  }
}

export async function registerUser(payload) {
  const role = normalizeRegisterRole(payload?.role)

  if (role === 'student') {
    return registerStudent(payload)
  }

  return registerTeacher(payload)
}

async function loginTeacher(username, password) {
  const [teachers] = await pool.query(
    'SELECT teacher_id, username, teacher_name, password, status FROM teacher_user WHERE username = ? LIMIT 1',
    [username],
  )

  if (!teachers.length) {
    logger.warn('teacher_login_failed', { username, reason: 'user_not_found' })
    throw unauthorized('教师账号或密码错误')
  }

  const teacher = teachers[0]
  const passwordMatched = await bcrypt.compare(password, teacher.password)

  if (!passwordMatched) {
    logger.warn('teacher_login_failed', { username, reason: 'password_mismatch' })
    throw unauthorized('教师账号或密码错误')
  }

  if (teacher.status !== 1) {
    logger.warn('teacher_login_failed', { username, reason: 'disabled' })
    throw unauthorized('当前教师账号不可用')
  }

  logger.info('teacher_login_success', { username, teacherId: teacher.teacher_id })

  return buildLoginResult({
    token: signToken({ userId: teacher.teacher_id, role: 'teacher' }),
    role: 'teacher',
    user: {
      id: Number(teacher.teacher_id),
      username: teacher.username,
      name: teacher.teacher_name,
    },
  })
}

async function loginStudent(username, password) {
  const [students] = await pool.query(
    'SELECT student_id, username, student_name, password, status FROM student_user WHERE username = ? LIMIT 1',
    [username],
  )

  if (!students.length) {
    logger.warn('student_login_failed', { username, reason: 'user_not_found' })
    throw unauthorized('学生账号或密码错误')
  }

  const student = students[0]
  const passwordMatched = await bcrypt.compare(password, student.password)

  if (!passwordMatched) {
    logger.warn('student_login_failed', { username, reason: 'password_mismatch' })
    throw unauthorized('学生账号或密码错误')
  }

  if (student.status !== 1) {
    logger.warn('student_login_failed', { username, reason: 'disabled' })
    throw unauthorized('当前学生账号不可用')
  }

  logger.info('student_login_success', { username, studentId: student.student_id })

  return buildLoginResult({
    token: signToken({ userId: student.student_id, role: 'student' }),
    role: 'student',
    user: {
      id: Number(student.student_id),
      username: student.username,
      name: student.student_name,
    },
  })
}

async function loginAdmin(username, password) {
  const [admins] = await pool.query(
    'SELECT admin_id, admin_name, real_name, admin_password FROM admin WHERE admin_name = ? LIMIT 1',
    [username],
  )

  if (!admins.length) {
    logger.warn('admin_login_failed', { username, reason: 'user_not_found' })
    throw unauthorized('管理员账号或密码错误')
  }

  const admin = admins[0]
  const plainMatched = password === admin.admin_password
  const hashMatched = admin.admin_password.startsWith('$2') ? await bcrypt.compare(password, admin.admin_password) : false

  if (!plainMatched && !hashMatched) {
    logger.warn('admin_login_failed', { username, reason: 'password_mismatch' })
    throw unauthorized('管理员账号或密码错误')
  }

  logger.info('admin_login_success', { username, adminId: admin.admin_id })

  return buildLoginResult({
    token: signToken({ userId: admin.admin_id, role: 'admin' }),
    role: 'admin',
    user: {
      id: Number(admin.admin_id),
      username: admin.admin_name,
      name: admin.real_name,
    },
  })
}

export async function login({ username, password, role }) {
  const normalizedUsername = typeof username === 'string' ? username.trim() : ''
  const normalizedPassword = typeof password === 'string' ? password : ''

  if (!normalizedUsername || !normalizedPassword) {
    throw badRequest('请输入用户名和密码')
  }

  const normalizedRole = normalizeLoginRole(role)

  if (normalizedRole === 'teacher') {
    return loginTeacher(normalizedUsername, normalizedPassword)
  }

  if (normalizedRole === 'student') {
    return loginStudent(normalizedUsername, normalizedPassword)
  }

  return loginAdmin(normalizedUsername, normalizedPassword)
}
