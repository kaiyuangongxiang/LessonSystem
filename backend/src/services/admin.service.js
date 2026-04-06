import bcrypt from 'bcryptjs'
import { pool } from '../config/db.js'
import { logger } from '../utils/logger.js'

const DEFAULT_PAGE_SIZE = 6
const MAX_PAGE_SIZE = 12
const ASSET_FILE_TYPES = new Set(['image', 'audio', 'video'])
const ASSET_CONTENT_TYPES = new Set(['text', 'question', 'template'])
const ASSET_TYPES = [...ASSET_FILE_TYPES, ...ASSET_CONTENT_TYPES]
const PREP_STATUSES = new Set(['draft', 'published', 'archived'])
let replySchemaSupportPromise = null
function badRequest(message) {
  const error = new Error(message)
  error.status = 400
  return error
}

function notFound(message) {
  const error = new Error(message)
  error.status = 404
  return error
}

function normalizePageNumber(value, fallback = 1) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : fallback
}

function normalizePageSize(value) {
  const pageSize = Number(value)

  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    return DEFAULT_PAGE_SIZE
  }

  return Math.min(pageSize, MAX_PAGE_SIZE)
}

function normalizeKeyword(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeCollegeId(value) {
  if (value === undefined || value === null || value === '') {
    return null
  }

  const collegeId = Number(value)
  if (!Number.isInteger(collegeId) || collegeId <= 0) {
    throw badRequest('学院筛选参数不合法')
  }

  return collegeId
}

function normalizeSort(value) {
  return value === 'video-rich' ? 'video-rich' : 'latest'
}

function normalizeCourseId(value, label = '课程') {
  const courseId = Number(value)
  if (!Number.isInteger(courseId) || courseId <= 0) {
    throw badRequest(`${label}ID不合法`)
  }

  return courseId
}

function normalizeCourseName(value) {
  const name = typeof value === 'string' ? value.trim() : ''

  if (!name) {
    throw badRequest('课程名称不能为空')
  }

  if (name.length > 100) {
    throw badRequest('课程名称不能超过100个字')
  }

  return name
}

function normalizeCourseSummary(value) {
  const summary = typeof value === 'string' ? value.trim() : ''

  if (summary.length > 2000) {
    throw badRequest('课程简介不能超过2000个字')
  }

  return summary
}

function normalizeCourseLongText(value, label) {
  const text = typeof value === 'string' ? value.trim() : ''

  if (text.length > 5000) {
    throw badRequest(`${label}不能超过5000个字`)
  }

  return text
}

function normalizeCollegeName(value) {
  const name = typeof value === 'string' ? value.trim() : ''

  if (!name) {
    throw badRequest('学院名称不能为空')
  }

  if (name.length > 100) {
    throw badRequest('学院名称不能超过100个字')
  }

  return name
}

function normalizeCollegeIntro(value) {
  const intro = typeof value === 'string' ? value.trim() : ''

  if (intro.length > 5000) {
    throw badRequest('学院简介不能超过5000个字')
  }

  return intro
}

function normalizeSystemName(value) {
  const name = typeof value === 'string' ? value.trim() : ''

  if (!name) {
    throw badRequest('系统名称不能为空')
  }

  if (name.length > 100) {
    throw badRequest('系统名称不能超过100个字')
  }

  return name
}

function normalizeSystemIntro(value) {
  const intro = typeof value === 'string' ? value.trim() : ''

  if (!intro) {
    throw badRequest('系统介绍不能为空')
  }

  if (intro.length > 5000) {
    throw badRequest('系统介绍不能超过5000个字')
  }

  return intro
}

function normalizeSystemHeroTitle(value) {
  const title = typeof value === 'string' ? value.trim() : ''

  if (!title) {
    throw badRequest('首页主标题不能为空')
  }

  if (title.length > 120) {
    throw badRequest('首页主标题不能超过120个字')
  }

  return title
}

function normalizeSystemProfilePayload(payload) {
  const body = payload && typeof payload === 'object' ? payload : {}

  return {
    systemName: normalizeSystemName(body.systemName),
    heroTitle: normalizeSystemHeroTitle(body.heroTitle),
    systemIntro: normalizeSystemIntro(body.systemIntro),
  }
}

function normalizePrepId(value) {
  const prepId = Number(value)
  if (!Number.isInteger(prepId) || prepId <= 0) {
    throw badRequest('备课单ID不合法')
  }

  return prepId
}

function normalizePrepStatus(value) {
  const status = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!PREP_STATUSES.has(status)) {
    throw badRequest('备课单状态不合法')
  }

  return status
}

function normalizePrepFilterStatus(value) {
  if (value === undefined || value === null || value === '' || value === 'all') {
    return 'all'
  }

  return normalizePrepStatus(value)
}

function normalizeNoticeId(value) {
  const noticeId = Number(value)
  if (!Number.isInteger(noticeId) || noticeId <= 0) {
    throw badRequest('公告ID不合法')
  }

  return noticeId
}

function normalizeNoticeTitle(value) {
  const title = typeof value === 'string' ? value.trim() : ''

  if (!title) {
    throw badRequest('公告标题不能为空')
  }

  if (title.length > 200) {
    throw badRequest('公告标题不能超过200个字')
  }

  return title
}

function normalizeNoticeContent(value) {
  const content = typeof value === 'string' ? value.trim() : ''

  if (!content) {
    throw badRequest('公告内容不能为空')
  }

  if (content.length > 5000) {
    throw badRequest('公告内容不能超过5000个字')
  }

  return content
}

function normalizeNoticeStatus(value) {
  return value === 0 || value === '0' || value === false ? 0 : 1
}

function normalizeNoticePayload(payload) {
  const body = payload && typeof payload === 'object' ? payload : {}

  return {
    title: normalizeNoticeTitle(body.title),
    content: normalizeNoticeContent(body.content),
    status: normalizeNoticeStatus(body.status),
  }
}

function normalizeCollegePayload(payload) {
  const body = payload && typeof payload === 'object' ? payload : {}

  return {
    name: normalizeCollegeName(body.name),
    intro: normalizeCollegeIntro(body.intro),
  }
}

function normalizeAdminId(value, label = '管理员') {
  const adminId = Number(value)
  if (!Number.isInteger(adminId) || adminId <= 0) {
    throw badRequest(`${label}ID不合法`)
  }

  return adminId
}

function normalizeAdminUsername(value) {
  const username = typeof value === 'string' ? value.trim() : ''

  if (!username) {
    throw badRequest('管理员账号不能为空')
  }

  if (username.length > 50) {
    throw badRequest('管理员账号不能超过50个字符')
  }

  return username
}

function normalizeAdminRealName(value) {
  const realName = typeof value === 'string' ? value.trim() : ''

  if (realName.length > 50) {
    throw badRequest('管理员姓名不能超过50个字')
  }

  return realName
}

function normalizeAdminPassword(value, { required = true } = {}) {
  const password = typeof value === 'string' ? value.trim() : ''

  if (!password) {
    if (required) {
      throw badRequest('管理员密码不能为空')
    }

    return ''
  }

  if (password.length < 6) {
    throw badRequest('管理员密码不能少于6位')
  }

  if (password.length > 50) {
    throw badRequest('管理员密码不能超过50位')
  }

  return password
}

function normalizeAdminPayload(payload, { requirePassword = true } = {}) {
  const body = payload && typeof payload === 'object' ? payload : {}

  return {
    username: normalizeAdminUsername(body.username),
    realName: normalizeAdminRealName(body.realName),
    password: normalizeAdminPassword(body.password, { required: requirePassword }),
  }
}

function normalizeManagedTeacherId(value, label = '教师用户') {
  const teacherId = Number(value)
  if (!Number.isInteger(teacherId) || teacherId <= 0) {
    throw badRequest(`${label}ID不合法`)
  }

  return teacherId
}

function normalizeManagedTeacherUsername(value) {
  const username = typeof value === 'string' ? value.trim() : ''

  if (!username) {
    throw badRequest('教师用户名不能为空')
  }

  if (username.length > 50) {
    throw badRequest('教师用户名不能超过50个字符')
  }

  return username
}

function normalizeManagedTeacherName(value) {
  const teacherName = typeof value === 'string' ? value.trim() : ''

  if (!teacherName) {
    throw badRequest('教师姓名不能为空')
  }

  if (teacherName.length > 50) {
    throw badRequest('教师姓名不能超过50个字')
  }

  return teacherName
}

function normalizeManagedTeacherGender(value) {
  if (value === '男' || value === '女' || value === '未知') {
    return value
  }

  throw badRequest('性别参数不合法')
}

function normalizeManagedTeacherPassword(value, { required = true } = {}) {
  const password = typeof value === 'string' ? value.trim() : ''

  if (!password) {
    if (required) {
      throw badRequest('教师账号密码不能为空')
    }

    return ''
  }

  if (password.length < 6) {
    throw badRequest('教师账号密码不能少于6位')
  }

  if (password.length > 50) {
    throw badRequest('教师账号密码不能超过50位')
  }

  return password
}

function normalizeManagedTeacherEmail(value) {
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

function normalizeManagedTeacherProfile(value) {
  const profile = typeof value === 'string' ? value.trim() : ''

  if (!profile) {
    return null
  }

  if (profile.length > 2000) {
    throw badRequest('个人简介不能超过2000个字')
  }

  return profile
}

function normalizeManagedTeacherPayload(payload, { requirePassword = true } = {}) {
  const body = payload && typeof payload === 'object' ? payload : {}

  return {
    username: normalizeManagedTeacherUsername(body.username),
    teacherName: normalizeManagedTeacherName(body.teacherName),
    gender: normalizeManagedTeacherGender(body.gender),
    collegeId: normalizeRequiredCollegeId(body.collegeId),
    email: normalizeManagedTeacherEmail(body.email),
    profile: normalizeManagedTeacherProfile(body.profile),
    password: normalizeManagedTeacherPassword(body.password, { required: requirePassword }),
  }
}

function normalizeManagedStudentId(value, label = '学生用户') {
  const studentId = Number(value)
  if (!Number.isInteger(studentId) || studentId <= 0) {
    throw badRequest(`${label}ID不合法`)
  }

  return studentId
}

function normalizeManagedStudentUsername(value) {
  const username = typeof value === 'string' ? value.trim() : ''

  if (!username) {
    throw badRequest('学生用户名不能为空')
  }

  if (username.length > 50) {
    throw badRequest('学生用户名不能超过50个字符')
  }

  return username
}

function normalizeManagedStudentName(value) {
  const studentName = typeof value === 'string' ? value.trim() : ''

  if (!studentName) {
    throw badRequest('学生姓名不能为空')
  }

  if (studentName.length > 50) {
    throw badRequest('学生姓名不能超过50个字符')
  }

  return studentName
}

function normalizeManagedStudentPassword(value, { required = true } = {}) {
  const password = typeof value === 'string' ? value.trim() : ''

  if (!password) {
    if (required) {
      throw badRequest('学生账号密码不能为空')
    }

    return ''
  }

  if (password.length < 6) {
    throw badRequest('学生账号密码不能少于6位')
  }

  if (password.length > 50) {
    throw badRequest('学生账号密码不能超过50位')
  }

  return password
}

function normalizeManagedStudentPayload(payload, { requirePassword = true } = {}) {
  const body = payload && typeof payload === 'object' ? payload : {}

  return {
    username: normalizeManagedStudentUsername(body.username),
    studentName: normalizeManagedStudentName(body.studentName),
    gender: normalizeManagedTeacherGender(body.gender),
    collegeId: normalizeRequiredCollegeId(body.collegeId),
    email: normalizeManagedTeacherEmail(body.email),
    profile: normalizeManagedTeacherProfile(body.profile),
    password: normalizeManagedStudentPassword(body.password, { required: requirePassword }),
  }
}

function normalizeTeacherId(value) {
  if (value === undefined || value === null || value === '') {
    throw badRequest('课程负责人不能为空')
  }

  const teacherId = Number(value)
  if (!Number.isInteger(teacherId) || teacherId <= 0) {
    throw badRequest('课程负责人不合法')
  }

  return teacherId
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

function normalizeCoursePayload(payload) {
  const body = payload && typeof payload === 'object' ? payload : {}

  return {
    name: normalizeCourseName(body.name),
    summary: normalizeCourseSummary(body.summary),
    teachingGoal: normalizeCourseLongText(body.teachingGoal, '教学目标'),
    teachingContent: normalizeCourseLongText(body.teachingContent, '教学内容'),
    teachingIdea: normalizeCourseLongText(body.teachingIdea, '教学思路'),
    collegeId: normalizeRequiredCollegeId(body.collegeId),
    teacherId: normalizeTeacherId(body.teacherId),
  }
}

function normalizeResourceId(value, label = '资源') {
  const resourceId = Number(value)
  if (!Number.isInteger(resourceId) || resourceId <= 0) {
    throw badRequest(`${label}ID不合法`)
  }

  return resourceId
}

function normalizeMessageId(value) {
  const messageId = Number(value)
  if (!Number.isInteger(messageId) || messageId <= 0) {
    throw badRequest('交流主题ID不合法')
  }

  return messageId
}

function normalizeContent(value, label = '内容') {
  const content = typeof value === 'string' ? value.trim() : ''
  if (!content) {
    throw badRequest(`${label}不能为空`)
  }

  if (content.length > 5000) {
    throw badRequest(`${label}不能超过5000个字`)
  }

  return content
}

function normalizeResourceType(value) {
  if (value === 'material' || value === 'video' || value === 'all') {
    return value
  }

  throw badRequest('资源类型不合法')
}

function normalizeAssetId(value) {
  const assetId = Number(value)
  if (!Number.isInteger(assetId) || assetId <= 0) {
    throw badRequest('素材ID不合法')
  }

  return assetId
}

function normalizeAssetType(value) {
  if (value === undefined || value === null || value === '' || value === 'all') {
    return 'all'
  }

  const assetType = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (ASSET_TYPES.includes(assetType)) {
    return assetType
  }

  throw badRequest('素材类型不合法')
}

function formatDate(value) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date(value))
    .replace(/\//g, '-')
}

function buildResourcePreviewUrl(type, resourceId) {
  return type === 'material' ? `/portal/materials/${resourceId}/download` : `/portal/videos/${resourceId}/play`
}

function buildAssetPreviewUrl(assetId) {
  return `/portal/assets/${assetId}/file`
}

function getPrepStatusLabel(status) {
  if (status === 'published') {
    return '已发布'
  }

  if (status === 'archived') {
    return '已归档'
  }

  return '草稿'
}

function mapAdminPrepItem(item) {
  return {
    id: Number(item.id),
    teacherId: Number(item.teacherId || 0),
    courseId: Number(item.courseId || 0),
    title: item.title,
    courseName: item.courseName,
    teacherName: item.teacherName,
    teachingObjective: item.teachingObjective || '',
    keyPoints: item.keyPoints || '',
    difficultyPoints: item.difficultyPoints || '',
    studentAnalysis: item.studentAnalysis || '',
    teachingContent: item.teachingContent || '',
    teachingProcess: item.teachingProcess || '',
    reflectionNotes: item.reflectionNotes || '',
    status: item.status,
    statusLabel: getPrepStatusLabel(item.status),
    createTime: item.createTime,
    updateTime: item.updateTime,
  }
}

async function ensureAssetLibraryReady() {
  const [rows] = await pool.query(
    `SELECT 1
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'asset_library'
     LIMIT 1`,
  )

  if (!rows.length) {
    throw badRequest('当前数据库尚未初始化素材库表，请先执行素材库升级 SQL')
  }
}

async function ensureTeachingPrepReady() {
  const [rows] = await pool.query(
    `SELECT 1
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'teaching_prep'
     LIMIT 1`,
  )

  if (!rows.length) {
    throw badRequest('当前数据库尚未初始化备课单表，请先执行备课单升级 SQL')
  }
}

function getStatusLabel(status) {
  if (status === 'archived') {
    return '已整理'
  }

  if (status === 'active') {
    return '持续交流'
  }

  return '讨论中'
}

function buildCourseWhereClause({ keyword, collegeId }) {
  const conditions = ['c.status = 1']
  const params = []

  if (keyword) {
    const keywordPattern = `%${keyword}%`
    conditions.push(`(
      c.course_name LIKE ?
      OR COALESCE(c.course_summary, '') LIKE ?
      OR COALESCE(c.teaching_goal, '') LIKE ?
      OR COALESCE(c.teaching_content, '') LIKE ?
      OR COALESCE(c.teaching_idea, '') LIKE ?
      OR COALESCE(col.college_name, '') LIKE ?
      OR COALESCE(t.teacher_name, '') LIKE ?
      OR COALESCE(t.username, '') LIKE ?
    )`)
    params.push(keywordPattern, keywordPattern, keywordPattern, keywordPattern, keywordPattern, keywordPattern, keywordPattern, keywordPattern)
  }

  if (collegeId) {
    conditions.push('c.college_id = ?')
    params.push(collegeId)
  }

  return {
    whereSql: conditions.join(' AND '),
    params,
  }
}

function buildCollegeWhereClause({ keyword }) {
  const conditions = ['1 = 1']
  const params = []

  if (keyword) {
    const keywordPattern = `%${keyword}%`
    conditions.push(`(
      col.college_name LIKE ?
      OR COALESCE(col.college_intro, '') LIKE ?
    )`)
    params.push(keywordPattern, keywordPattern)
  }

  return {
    whereSql: conditions.join(' AND '),
    params,
  }
}

function buildAdminWhereClause({ keyword }) {
  const conditions = ['1 = 1']
  const params = []

  if (keyword) {
    const keywordPattern = `%${keyword}%`
    conditions.push(`(
      a.admin_name LIKE ?
      OR COALESCE(a.real_name, '') LIKE ?
    )`)
    params.push(keywordPattern, keywordPattern)
  }

  return {
    whereSql: conditions.join(' AND '),
    params,
  }
}

function buildTeacherAccountWhereClause({ keyword, collegeId }) {
  const conditions = ['t.status = 1']
  const params = []

  if (keyword) {
    const keywordPattern = `%${keyword}%`
    conditions.push(`(
      t.username LIKE ?
      OR COALESCE(t.teacher_name, '') LIKE ?
      OR COALESCE(t.email, '') LIKE ?
      OR COALESCE(t.profile, '') LIKE ?
      OR COALESCE(c.college_name, '') LIKE ?
    )`)
    params.push(keywordPattern, keywordPattern, keywordPattern, keywordPattern, keywordPattern)
  }

  if (collegeId) {
    conditions.push('t.college_id = ?')
    params.push(collegeId)
  }

  return {
    whereSql: conditions.join(' AND '),
    params,
  }
}

function buildStudentAccountWhereClause({ keyword, collegeId }) {
  const conditions = ['s.status = 1']
  const params = []

  if (keyword) {
    const keywordPattern = `%${keyword}%`
    conditions.push(`(
      s.username LIKE ?
      OR COALESCE(s.student_name, '') LIKE ?
      OR COALESCE(s.email, '') LIKE ?
      OR COALESCE(s.profile, '') LIKE ?
      OR COALESCE(c.college_name, '') LIKE ?
    )`)
    params.push(keywordPattern, keywordPattern, keywordPattern, keywordPattern, keywordPattern)
  }

  if (collegeId) {
    conditions.push('s.college_id = ?')
    params.push(collegeId)
  }

  return {
    whereSql: conditions.join(' AND '),
    params,
  }
}

async function getReplySchemaSupport() {
  if (!replySchemaSupportPromise) {
    replySchemaSupportPromise = (async () => {
      const [rows] = await pool.query(
        `SELECT COLUMN_NAME AS columnName, IS_NULLABLE AS isNullable
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'message_topic_reply'
           AND COLUMN_NAME IN ('teacher_id', 'admin_id')`,
      )

      const teacherIdColumn = rows.find((item) => item.columnName === 'teacher_id')
      const adminIdColumn = rows.find((item) => item.columnName === 'admin_id')

      return {
        enabled: Boolean(adminIdColumn) && teacherIdColumn?.isNullable === 'YES',
      }
    })()
  }

  return replySchemaSupportPromise
}

async function getSystemHeroTitleSchemaSupport() {
  const [rows] = await pool.query(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'system_profile'
       AND COLUMN_NAME = 'hero_title'
     LIMIT 1`,
  )

  return rows.length > 0
}

async function getAdminProfile(adminId) {
  const [rows] = await pool.query(
    `SELECT admin_id AS id,
            admin_name AS username,
            COALESCE(NULLIF(real_name, ''), admin_name, '系统管理员') AS name
     FROM admin
     WHERE admin_id = ?
     LIMIT 1`,
    [adminId],
  )

  if (!rows.length) {
    throw notFound('管理员账号不存在或不可用')
  }

  return rows[0]
}

async function getManagedAdminRow(adminId) {
  const [rows] = await pool.query(
    `SELECT admin_id AS id,
            admin_name AS username,
            COALESCE(real_name, '') AS realName,
            COALESCE(NULLIF(real_name, ''), admin_name, '系统管理员') AS name,
            DATE_FORMAT(create_time, '%Y-%m-%d %H:%i') AS createTime,
            DATE_FORMAT(update_time, '%Y-%m-%d %H:%i') AS updateTime
     FROM admin
     WHERE admin_id = ?
     LIMIT 1`,
    [adminId],
  )

  if (!rows.length) {
    throw notFound('管理员账号不存在')
  }

  return rows[0]
}

async function getManagedTeacherAccountRow(teacherId) {
  const [rows] = await pool.query(
    `SELECT t.teacher_id AS id,
            t.username AS username,
            COALESCE(t.teacher_name, '') AS teacherName,
            COALESCE(NULLIF(t.teacher_name, ''), t.username, '未署名教师') AS name,
            COALESCE(NULLIF(t.gender, ''), '未知') AS gender,
            COALESCE(t.email, '') AS email,
            t.college_id AS collegeId,
            COALESCE(c.college_name, '未关联学院') AS collegeName,
            COALESCE(t.profile, '') AS profile,
            DATE_FORMAT(t.register_time, '%Y-%m-%d %H:%i') AS registerTime,
            DATE_FORMAT(t.update_time, '%Y-%m-%d %H:%i') AS updateTime,
            COALESCE(courseStats.courseCount, 0) AS courseCount,
            COALESCE(resourceStats.resourceCount, 0) AS resourceCount
     FROM teacher_user t
     LEFT JOIN college c ON c.college_id = t.college_id
     LEFT JOIN (
       SELECT teacher_id, COUNT(*) AS courseCount
       FROM course_intro
       WHERE status = 1
       GROUP BY teacher_id
     ) courseStats ON courseStats.teacher_id = t.teacher_id
     LEFT JOIN (
       SELECT teacher_id, COUNT(*) AS resourceCount
       FROM (
         SELECT teacher_id
         FROM material
         WHERE status = 1
         UNION ALL
         SELECT teacher_id
         FROM course_video
         WHERE status = 1
       ) resourceUnion
       GROUP BY teacher_id
     ) resourceStats ON resourceStats.teacher_id = t.teacher_id
     WHERE t.teacher_id = ? AND t.status = 1
     LIMIT 1`,
    [teacherId],
  )

  if (!rows.length) {
    throw notFound('教师用户不存在或已禁用')
  }

  const item = rows[0]
  return {
    id: Number(item.id),
    username: item.username,
    teacherName: item.teacherName,
    name: item.name,
    gender: item.gender,
    email: item.email || '',
    collegeId: item.collegeId === null ? null : Number(item.collegeId),
    collegeName: item.collegeName,
    profile: item.profile || '',
    registerTime: item.registerTime,
    updateTime: item.updateTime,
    courseCount: Number(item.courseCount || 0),
    resourceCount: Number(item.resourceCount || 0),
  }
}

async function getManagedStudentAccountRow(studentId) {
  const [rows] = await pool.query(
    `SELECT s.student_id AS id,
            s.username AS username,
            COALESCE(s.student_name, '') AS studentName,
            COALESCE(NULLIF(s.student_name, ''), s.username, '未命名学生') AS name,
            COALESCE(NULLIF(s.gender, ''), '未知') AS gender,
            COALESCE(s.email, '') AS email,
            s.college_id AS collegeId,
            COALESCE(c.college_name, '未关联学院') AS collegeName,
            COALESCE(s.profile, '') AS profile,
            DATE_FORMAT(s.register_time, '%Y-%m-%d %H:%i') AS registerTime,
            DATE_FORMAT(s.update_time, '%Y-%m-%d %H:%i') AS updateTime
     FROM student_user s
     LEFT JOIN college c ON c.college_id = s.college_id
     WHERE s.student_id = ? AND s.status = 1
     LIMIT 1`,
    [studentId],
  )

  if (!rows.length) {
    throw notFound('学生用户不存在或已禁用')
  }

  const item = rows[0]
  return {
    id: Number(item.id),
    username: item.username,
    studentName: item.studentName,
    name: item.name,
    gender: item.gender,
    email: item.email || '',
    collegeId: item.collegeId === null ? null : Number(item.collegeId),
    collegeName: item.collegeName,
    profile: item.profile || '',
    registerTime: item.registerTime,
    updateTime: item.updateTime,
  }
}

async function getAdminSystemProfileDetail() {
  const heroTitleSupported = await getSystemHeroTitleSchemaSupport()
  const [rows] = await pool.query(
    `SELECT sp.profile_id AS id,
            sp.system_name AS systemName,
            ${heroTitleSupported ? `COALESCE(sp.hero_title, '') AS heroTitle,` : ''}
            COALESCE(sp.system_intro, '') AS systemIntro,
            DATE_FORMAT(sp.update_time, '%Y-%m-%d %H:%i') AS updateTime,
            COALESCE(NULLIF(a.real_name, ''), a.admin_name, 'System Admin') AS updateAdminName
     FROM system_profile sp
     LEFT JOIN admin a ON a.admin_id = sp.update_admin_id
     ORDER BY sp.update_time DESC, sp.profile_id DESC
     LIMIT 1`,
  )

if (!rows.length) {
  return {
    heroTitle: '让课程、资料与视频在一个入口里协同',
      id: null,
      systemName: '在线教师备课系统',
      systemIntro: '围绕课程、资料与视频的统一备课平台，帮助教师快速进入课程浏览与资源查看主链路。',
      updateTime: '',
      updateAdminName: '',
    }
  }

  return {
    id: Number(rows[0].id),
    systemName: rows[0].systemName,
    heroTitle: rows[0].heroTitle || '让课程、资料与视频在一个入口里协同',
    systemIntro: rows[0].systemIntro,
    updateTime: rows[0].updateTime,
    updateAdminName: rows[0].updateAdminName,
  }
}

async function getAdminNoticeRow(noticeId) {
  const [rows] = await pool.query(
    `SELECT n.notice_id AS id,
            n.notice_title AS title,
            n.notice_content AS content,
            n.status AS status,
            DATE_FORMAT(n.publish_time, '%Y-%m-%d %H:%i') AS publishTime,
            DATE_FORMAT(n.update_time, '%Y-%m-%d %H:%i') AS updateTime,
            COALESCE(NULLIF(a.real_name, ''), a.admin_name, 'System Admin') AS publisherName
     FROM notice n
     LEFT JOIN admin a ON a.admin_id = n.publisher_admin_id
     WHERE n.notice_id = ?
     LIMIT 1`,
    [noticeId],
  )

  if (!rows.length) {
    throw notFound('公告不存在')
  }

  return {
    id: Number(rows[0].id),
    title: rows[0].title,
    content: rows[0].content,
    status: Number(rows[0].status || 0),
    statusLabel: Number(rows[0].status || 0) === 1 ? '已发布' : '已停用',
    publishTime: rows[0].publishTime,
    updateTime: rows[0].updateTime,
    publisherName: rows[0].publisherName,
  }
}

async function ensureAdminUsernameAvailable(username, excludeAdminId = null) {
  const params = [username]
  let sql = `SELECT admin_id AS id
             FROM admin
             WHERE admin_name = ?`

  if (excludeAdminId !== null) {
    sql += ' AND admin_id <> ?'
    params.push(excludeAdminId)
  }

  sql += ' LIMIT 1'

  const [rows] = await pool.query(sql, params)

  if (rows.length) {
    throw badRequest('管理员账号已存在，请使用其他账号')
  }
}

async function ensureTeacherUsernameAvailable(username, excludeTeacherId = null) {
  const params = [username]
  let sql = `SELECT teacher_id AS id
             FROM teacher_user
             WHERE username = ?`

  if (excludeTeacherId !== null) {
    sql += ' AND teacher_id <> ?'
    params.push(excludeTeacherId)
  }

  sql += ' LIMIT 1'

  const [rows] = await pool.query(sql, params)

  if (rows.length) {
    throw badRequest('教师用户名已存在，请使用其他用户名')
  }
}

async function ensureStudentUsernameAvailable(username, excludeStudentId = null) {
  const params = [username]
  let sql = `SELECT student_id AS id
             FROM student_user
             WHERE username = ?`

  if (excludeStudentId !== null) {
    sql += ' AND student_id <> ?'
    params.push(excludeStudentId)
  }

  sql += ' LIMIT 1'

  const [rows] = await pool.query(sql, params)

  if (rows.length) {
    throw badRequest('学生用户名已存在，请使用其他用户名')
  }
}

async function ensureUsernameAvailableAcrossRoles(username, current = {}) {
  const normalizedUsername = typeof username === 'string' ? username.trim() : ''
  if (!normalizedUsername) {
    return
  }

  const [adminRows] = await pool.query('SELECT admin_id AS id FROM admin WHERE admin_name = ? LIMIT 1', [normalizedUsername])
  if (adminRows.length && !(current.role === 'admin' && Number(current.id) === Number(adminRows[0].id))) {
    throw badRequest('账号名已被其他角色使用，请更换后再试')
  }

  const [teacherRows] = await pool.query(
    'SELECT teacher_id AS id FROM teacher_user WHERE username = ? AND status = 1 LIMIT 1',
    [normalizedUsername],
  )
  if (teacherRows.length && !(current.role === 'teacher' && Number(current.id) === Number(teacherRows[0].id))) {
    throw badRequest('账号名已被其他角色使用，请更换后再试')
  }

  const [studentRows] = await pool.query(
    'SELECT student_id AS id FROM student_user WHERE username = ? AND status = 1 LIMIT 1',
    [normalizedUsername],
  )
  if (studentRows.length && !(current.role === 'student' && Number(current.id) === Number(studentRows[0].id))) {
    throw badRequest('账号名已被其他角色使用，请更换后再试')
  }
}

async function getAdminCourseRow(courseId) {
  const [rows] = await pool.query(
    `SELECT c.course_id AS id,
            c.teacher_id AS teacherId,
            c.course_name AS name,
            COALESCE(NULLIF(t.teacher_name, ''), t.username, '未署名教师') AS teacherName
     FROM course_intro c
     LEFT JOIN teacher_user t ON t.teacher_id = c.teacher_id
     WHERE c.course_id = ? AND c.status = 1
     LIMIT 1`,
    [courseId],
  )

  if (!rows.length) {
    throw notFound('课程不存在或已删除')
  }

  return rows[0]
}

async function getAdminCollegeRow(collegeId) {
  const [rows] = await pool.query(
    `SELECT college_id AS id, college_name AS name
     FROM college
     WHERE college_id = ?
     LIMIT 1`,
    [collegeId],
  )

  if (!rows.length) {
    throw notFound('所属学院不存在')
  }

  return rows[0]
}

async function ensureCollegeNameAvailable(name, excludeCollegeId = null) {
  const params = [name]
  let sql = `SELECT college_id AS id
             FROM college
             WHERE college_name = ?`

  if (excludeCollegeId !== null) {
    sql += ' AND college_id <> ?'
    params.push(excludeCollegeId)
  }

  sql += ' LIMIT 1'

  const [rows] = await pool.query(sql, params)

  if (rows.length) {
    throw badRequest('学院名称已存在，请使用其他名称')
  }
}

async function getAdminCollegeUsage(collegeId) {
  const [rows] = await pool.query(
    `SELECT
        (SELECT COUNT(*) FROM teacher_user WHERE status = 1 AND college_id = ?) AS teacherCount,
        (SELECT COUNT(*) FROM course_intro WHERE status = 1 AND college_id = ?) AS courseCount`,
    [collegeId, collegeId],
  )

  const row = rows[0] || {
    teacherCount: 0,
    courseCount: 0,
  }

  return {
    teacherCount: Number(row.teacherCount || 0),
    courseCount: Number(row.courseCount || 0),
  }
}

async function getAdminCollegeDetail(collegeId) {
  const [rows] = await pool.query(
    `SELECT col.college_id AS id,
            col.college_name AS name,
            COALESCE(col.college_intro, '') AS intro,
            COALESCE(courseStats.courseCount, 0) AS courseCount,
            COALESCE(teacherStats.teacherCount, 0) AS teacherCount,
            DATE_FORMAT(col.update_time, '%Y-%m-%d') AS updateDate
     FROM college col
     LEFT JOIN (
       SELECT college_id, COUNT(*) AS courseCount
       FROM course_intro
       WHERE status = 1 AND college_id IS NOT NULL
       GROUP BY college_id
     ) courseStats ON courseStats.college_id = col.college_id
     LEFT JOIN (
       SELECT college_id, COUNT(*) AS teacherCount
       FROM teacher_user
       WHERE status = 1 AND college_id IS NOT NULL
       GROUP BY college_id
     ) teacherStats ON teacherStats.college_id = col.college_id
     WHERE col.college_id = ?
     LIMIT 1`,
    [collegeId],
  )

  if (!rows.length) {
    throw notFound('学院不存在')
  }

  const item = rows[0]
  return {
    id: Number(item.id),
    name: item.name,
    intro: item.intro,
    courseCount: Number(item.courseCount || 0),
    teacherCount: Number(item.teacherCount || 0),
    updateDate: item.updateDate,
  }
}

async function getAdminTeacherRow(teacherId) {
  const [rows] = await pool.query(
    `SELECT teacher_id AS id,
            college_id AS collegeId,
            COALESCE(NULLIF(teacher_name, ''), username, '未署名教师') AS name
     FROM teacher_user
     WHERE teacher_id = ? AND status = 1
     LIMIT 1`,
    [teacherId],
  )

  if (!rows.length) {
    throw notFound('课程负责人不存在或已禁用')
  }

  return rows[0]
}

async function getAdminTeacherManageFormOptions() {
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

async function getAdminCourseFormOptions() {
  const [collegeRows] = await pool.query(
    `SELECT college_id AS id, college_name AS name
     FROM college
     ORDER BY college_name ASC`,
  )

  const [teacherRows] = await pool.query(
    `SELECT t.teacher_id AS id,
            COALESCE(NULLIF(t.teacher_name, ''), t.username, '未署名教师') AS name,
            t.college_id AS collegeId,
            COALESCE(c.college_name, '未关联学院') AS collegeName
     FROM teacher_user t
     LEFT JOIN college c ON c.college_id = t.college_id
     WHERE t.status = 1
     ORDER BY c.college_name ASC, name ASC`,
  )

  return {
    colleges: collegeRows.map((item) => ({
      id: Number(item.id),
      name: item.name,
    })),
    teachers: teacherRows.map((item) => ({
      id: Number(item.id),
      name: item.name,
      collegeId: item.collegeId === null ? null : Number(item.collegeId),
      collegeName: item.collegeName,
    })),
  }
}

async function getAdminCourseDetail(courseId) {
  const [rows] = await pool.query(
    `SELECT c.course_id AS id,
            c.course_name AS name,
            COALESCE(c.course_summary, '') AS summary,
            COALESCE(c.teaching_goal, '') AS teachingGoal,
            COALESCE(c.teaching_content, '') AS teachingContent,
            COALESCE(c.teaching_idea, '') AS teachingIdea,
            c.college_id AS collegeId,
            c.teacher_id AS teacherId,
            COALESCE(col.college_name, '未关联学院') AS collegeName,
            COALESCE(NULLIF(t.teacher_name, ''), t.username, '未署名教师') AS teacherName,
            t.college_id AS teacherCollegeId,
            COALESCE(teacherCol.college_name, '未分配学院') AS teacherCollegeName,
            CASE
              WHEN t.college_id IS NULL OR c.college_id IS NULL THEN NULL
              WHEN t.college_id = c.college_id THEN 1
              ELSE 0
            END AS teacherCollegeMatched,
            COALESCE(videoStats.videoCount, 0) AS videoCount,
            COALESCE(materialStats.materialCount, 0) AS materialCount,
            DATE_FORMAT(c.update_time, '%Y-%m-%d') AS updateDate
     FROM course_intro c
     LEFT JOIN college col ON col.college_id = c.college_id
     LEFT JOIN teacher_user t ON t.teacher_id = c.teacher_id
     LEFT JOIN college teacherCol ON teacherCol.college_id = t.college_id
     LEFT JOIN (
       SELECT course_id, COUNT(*) AS videoCount
       FROM course_video
       WHERE status = 1
       GROUP BY course_id
     ) videoStats ON videoStats.course_id = c.course_id
     LEFT JOIN (
       SELECT course_id, COUNT(*) AS materialCount
       FROM material
       WHERE status = 1
       GROUP BY course_id
     ) materialStats ON materialStats.course_id = c.course_id
     WHERE c.course_id = ? AND c.status = 1
     LIMIT 1`,
    [courseId],
  )

  if (!rows.length) {
    throw notFound('课程不存在或已删除')
  }

  const item = rows[0]
  return {
    id: Number(item.id),
    name: item.name,
    summary: item.summary,
    teachingGoal: item.teachingGoal,
    teachingContent: item.teachingContent,
    teachingIdea: item.teachingIdea,
    collegeId: item.collegeId === null ? null : Number(item.collegeId),
    teacherId: item.teacherId === null ? null : Number(item.teacherId),
    collegeName: item.collegeName,
    teacherName: item.teacherName,
    teacherCollegeId: item.teacherCollegeId === null ? null : Number(item.teacherCollegeId),
    teacherCollegeName: item.teacherCollegeName,
    teacherCollegeMatched:
      item.teacherCollegeMatched === null || item.teacherCollegeMatched === undefined
        ? null
        : Boolean(item.teacherCollegeMatched),
    materialCount: Number(item.materialCount || 0),
    videoCount: Number(item.videoCount || 0),
    updateDate: item.updateDate,
  }
}

async function getAdminMaterialRow(materialId) {
  const [rows] = await pool.query(
    `SELECT m.material_id AS id,
            m.course_id AS courseId,
            m.teacher_id AS teacherId,
            m.material_name AS title,
            COALESCE(c.course_name, '未关联课程') AS courseName,
            COALESCE(NULLIF(t.teacher_name, ''), t.username, '未署名教师') AS teacherName
     FROM material m
     LEFT JOIN course_intro c ON c.course_id = m.course_id
     LEFT JOIN teacher_user t ON t.teacher_id = m.teacher_id
     WHERE m.material_id = ? AND m.status = 1
     LIMIT 1`,
    [materialId],
  )

  if (!rows.length) {
    throw notFound('资料不存在或已删除')
  }

  return rows[0]
}

async function getAdminVideoRow(videoId) {
  const [rows] = await pool.query(
    `SELECT v.video_id AS id,
            v.course_id AS courseId,
            v.teacher_id AS teacherId,
            v.video_title AS title,
            COALESCE(c.course_name, '未关联课程') AS courseName,
            COALESCE(NULLIF(t.teacher_name, ''), t.username, '未署名教师') AS teacherName
     FROM course_video v
     LEFT JOIN course_intro c ON c.course_id = v.course_id
     LEFT JOIN teacher_user t ON t.teacher_id = v.teacher_id
     WHERE v.video_id = ? AND v.status = 1
     LIMIT 1`,
    [videoId],
  )

  if (!rows.length) {
    throw notFound('视频不存在或已删除')
  }

  return rows[0]
}

async function getAdminPrepRow(prepId) {
  await ensureTeachingPrepReady()

  const [rows] = await pool.query(
    `SELECT p.prep_id AS id,
            p.teacher_id AS teacherId,
            p.course_id AS courseId,
            p.prep_title AS title,
            COALESCE(p.teaching_objective, '') AS teachingObjective,
            COALESCE(p.key_points, '') AS keyPoints,
            COALESCE(p.difficulty_points, '') AS difficultyPoints,
            COALESCE(p.student_analysis, '') AS studentAnalysis,
            COALESCE(p.teaching_content, '') AS teachingContent,
            COALESCE(p.teaching_process, '') AS teachingProcess,
            COALESCE(p.reflection_notes, '') AS reflectionNotes,
            p.status AS status,
            DATE_FORMAT(p.create_time, '%Y-%m-%d') AS createTime,
            DATE_FORMAT(p.update_time, '%Y-%m-%d') AS updateTime,
            COALESCE(ci.course_name, '未关联课程') AS courseName,
            COALESCE(NULLIF(t.teacher_name, ''), t.username, '未命名教师') AS teacherName
     FROM teaching_prep p
     LEFT JOIN course_intro ci ON ci.course_id = p.course_id
     LEFT JOIN teacher_user t ON t.teacher_id = p.teacher_id
     WHERE p.prep_id = ?
     LIMIT 1`,
    [prepId],
  )

  if (!rows.length) {
    throw notFound('备课单不存在或已删除')
  }

  return rows[0]
}

async function getAdminAssetRow(assetId) {
  await ensureAssetLibraryReady()

  const [rows] = await pool.query(
    `SELECT a.asset_id AS id,
            a.asset_type AS type,
            a.teacher_id AS teacherId,
            a.course_id AS courseId,
            a.asset_title AS title,
            COALESCE(a.asset_description, '') AS description,
            COALESCE(a.asset_content, '') AS content,
            COALESCE(a.file_name, '') AS fileName,
            COALESCE(a.file_size, 0) AS fileSize,
            DATE_FORMAT(a.create_time, '%Y-%m-%d') AS uploadTime,
            COALESCE(ci.course_name, '未关联课程') AS courseName,
            COALESCE(NULLIF(t.teacher_name, ''), t.username, '未命名教师') AS teacherName
     FROM asset_library a
     LEFT JOIN course_intro ci ON ci.course_id = a.course_id
     LEFT JOIN teacher_user t ON t.teacher_id = a.teacher_id
     WHERE a.asset_id = ? AND a.status = 1
     LIMIT 1`,
    [assetId],
  )

  if (!rows.length) {
    throw notFound('素材不存在或已删除')
  }

  return rows[0]
}

async function getAdminMessageRow(messageId) {
  const [rows] = await pool.query(
    `SELECT mt.topic_id AS id,
            mt.teacher_id AS teacherId,
            mt.title AS title,
            mt.content AS content,
            mt.status AS status,
            mt.create_time AS createTime,
            COALESCE(NULLIF(t.teacher_name, ''), t.username, '未署名教师') AS teacherName
     FROM message_topic mt
     LEFT JOIN teacher_user t ON t.teacher_id = mt.teacher_id
     WHERE mt.topic_id = ? AND mt.status <> 'archived'
     LIMIT 1`,
    [messageId],
  )

  if (!rows.length) {
    throw notFound('交流主题不存在或已删除')
  }

  return rows[0]
}

export async function getAdminDashboardData(adminId) {
  const admin = await getAdminProfile(adminId)

  const [statRows] = await pool.query(
    `SELECT
        (SELECT COUNT(*) FROM student_user WHERE status = 1) AS studentCount,
        (SELECT COUNT(*) FROM teacher_user WHERE status = 1) AS teacherCount,
        (SELECT COUNT(*) FROM course_intro WHERE status = 1) AS courseCount,
        (SELECT COUNT(*) FROM material WHERE status = 1) AS materialCount,
        (SELECT COUNT(*) FROM course_video WHERE status = 1) AS videoCount,
        (SELECT COUNT(*) FROM message_topic WHERE status <> 'archived') AS topicCount`,
  )

  const [teacherRows] = await pool.query(
    `SELECT t.teacher_id AS id,
            COALESCE(NULLIF(t.teacher_name, ''), t.username, '未署名教师') AS name,
            t.username AS username,
            COALESCE(c.college_name, '未分配学院') AS departmentName,
            DATE_FORMAT(t.register_time, '%Y-%m-%d') AS registerDate
     FROM teacher_user t
     LEFT JOIN college c ON c.college_id = t.college_id
     WHERE t.status = 1
     ORDER BY t.register_time DESC, t.teacher_id DESC
     LIMIT 5`,
  )

  const [materialRows] = await pool.query(
    `SELECT m.material_id AS id,
            'material' AS type,
            m.material_name AS title,
            COALESCE(NULLIF(t.teacher_name, ''), t.username, '未署名教师') AS teacherName,
            COALESCE(ci.course_name, '未关联课程') AS courseName,
            DATE_FORMAT(m.upload_time, '%Y-%m-%d') AS uploadDate,
            m.upload_time AS sortTime
     FROM material m
     LEFT JOIN teacher_user t ON t.teacher_id = m.teacher_id
     LEFT JOIN course_intro ci ON ci.course_id = m.course_id
     WHERE m.status = 1
     ORDER BY m.upload_time DESC, m.material_id DESC
     LIMIT 6`,
  )

  const [videoRows] = await pool.query(
    `SELECT v.video_id AS id,
            'video' AS type,
            v.video_title AS title,
            COALESCE(NULLIF(t.teacher_name, ''), t.username, '未署名教师') AS teacherName,
            COALESCE(ci.course_name, '未关联课程') AS courseName,
            DATE_FORMAT(v.upload_time, '%Y-%m-%d') AS uploadDate,
            v.upload_time AS sortTime
     FROM course_video v
     LEFT JOIN teacher_user t ON t.teacher_id = v.teacher_id
     LEFT JOIN course_intro ci ON ci.course_id = v.course_id
     WHERE v.status = 1
     ORDER BY v.upload_time DESC, v.video_id DESC
     LIMIT 6`,
  )

  const [topicRows] = await pool.query(
    `SELECT mt.topic_id AS id,
            mt.title AS title,
            COALESCE(NULLIF(t.teacher_name, ''), t.username, '未署名教师') AS teacherName,
            DATE_FORMAT(mt.create_time, '%Y-%m-%d') AS createTime,
            COALESCE(replyStats.replyCount, 0) AS replyCount,
            mt.update_time AS sortTime
     FROM message_topic mt
     LEFT JOIN teacher_user t ON t.teacher_id = mt.teacher_id
     LEFT JOIN (
       SELECT topic_id, COUNT(*) AS replyCount
       FROM message_topic_reply
       GROUP BY topic_id
     ) replyStats ON replyStats.topic_id = mt.topic_id
     WHERE mt.status <> 'archived'
     ORDER BY mt.update_time DESC, mt.topic_id DESC
     LIMIT 5`,
  )

  const [weeklyRows] = await pool.query(
    `SELECT
        (SELECT COUNT(*) FROM material WHERE status = 1 AND upload_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS materialCount,
        (SELECT COUNT(*) FROM course_video WHERE status = 1 AND upload_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS videoCount,
        (SELECT COUNT(*) FROM message_topic WHERE status <> 'archived' AND create_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS topicCount`,
  )

  const statsRow = statRows[0] || {
    studentCount: 0,
    teacherCount: 0,
    courseCount: 0,
    materialCount: 0,
    videoCount: 0,
    topicCount: 0,
  }
  const weeklyRow = weeklyRows[0] || {
    materialCount: 0,
    videoCount: 0,
    topicCount: 0,
  }

  const latestResources = [...materialRows, ...videoRows]
    .sort((left, right) => new Date(right.sortTime).getTime() - new Date(left.sortTime).getTime())
    .slice(0, 6)
    .map(({ sortTime, ...item }) => item)

  const latestTeachers = teacherRows.map((item) => ({
    id: Number(item.id),
    name: item.name,
    username: item.username,
    departmentName: item.departmentName,
    summary: `${item.departmentName} · ${item.registerDate} 注册`,
  }))

  const latestTopics = topicRows.map(({ sortTime, ...item }) => ({
    ...item,
    id: Number(item.id),
    replyCount: Number(item.replyCount || 0),
  }))

  logger.info('admin_dashboard_loaded', {
    adminId,
    studentCount: Number(statsRow.studentCount || 0),
    teacherCount: Number(statsRow.teacherCount || 0),
    courseCount: Number(statsRow.courseCount || 0),
    materialCount: Number(statsRow.materialCount || 0),
    videoCount: Number(statsRow.videoCount || 0),
    topicCount: Number(statsRow.topicCount || 0),
    latestTeacherCount: latestTeachers.length,
    latestResourceCount: latestResources.length,
    latestTopicCount: latestTopics.length,
  })

  return {
    profile: {
      id: Number(admin.id),
      username: admin.username,
      name: admin.name,
    },
    stats: {
      studentCount: Number(statsRow.studentCount || 0),
      teacherCount: Number(statsRow.teacherCount || 0),
      courseCount: Number(statsRow.courseCount || 0),
      materialCount: Number(statsRow.materialCount || 0),
      videoCount: Number(statsRow.videoCount || 0),
      topicCount: Number(statsRow.topicCount || 0),
    },
    latestTeachers,
    latestResources: latestResources.map((item) => ({
      ...item,
      id: Number(item.id),
    })),
    latestTopics,
    weeklyActivity: {
      materialCount: Number(weeklyRow.materialCount || 0),
      videoCount: Number(weeklyRow.videoCount || 0),
      topicCount: Number(weeklyRow.topicCount || 0),
      label: formatDate(new Date()),
    },
  }
}

export async function getAdminSystemManageData({ adminId }) {
  await getAdminProfile(adminId)

  const profile = await getAdminSystemProfileDetail()
  const [noticeRows] = await pool.query(
    `SELECT n.notice_id AS id,
            n.notice_title AS title,
            n.notice_content AS content,
            n.status AS status,
            DATE_FORMAT(n.publish_time, '%Y-%m-%d %H:%i') AS publishTime,
            DATE_FORMAT(n.update_time, '%Y-%m-%d %H:%i') AS updateTime,
            COALESCE(NULLIF(a.real_name, ''), a.admin_name, 'System Admin') AS publisherName
     FROM notice n
     LEFT JOIN admin a ON a.admin_id = n.publisher_admin_id
     ORDER BY n.publish_time DESC, n.notice_id DESC`,
  )
  const [statsRows] = await pool.query(
    `SELECT
        COUNT(*) AS noticeCount,
        COALESCE(SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END), 0) AS publishedNoticeCount,
        COALESCE(SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END), 0) AS disabledNoticeCount
     FROM notice`,
  )

  const statsRow = statsRows[0] || {
    noticeCount: 0,
    publishedNoticeCount: 0,
    disabledNoticeCount: 0,
  }

  logger.info('admin_system_manage_loaded', {
    adminId,
    noticeCount: Number(statsRow.noticeCount || 0),
  })

  return {
    profile,
    notices: noticeRows.map((item) => ({
      id: Number(item.id),
      title: item.title,
      content: item.content,
      status: Number(item.status || 0),
      statusLabel: Number(item.status || 0) === 1 ? '已发布' : '已停用',
      publishTime: item.publishTime,
      updateTime: item.updateTime,
      publisherName: item.publisherName,
    })),
    stats: {
      noticeCount: Number(statsRow.noticeCount || 0),
      publishedNoticeCount: Number(statsRow.publishedNoticeCount || 0),
      disabledNoticeCount: Number(statsRow.disabledNoticeCount || 0),
    },
  }
}

export async function updateAdminSystemProfile({ adminId, payload }) {
  await getAdminProfile(adminId)

  const profile = normalizeSystemProfilePayload(payload)
  const currentProfile = await getAdminSystemProfileDetail()
  const heroTitleSupported = await getSystemHeroTitleSchemaSupport()

  if (currentProfile.id) {
    await pool.query(
      `UPDATE system_profile
       SET system_name = ?,
           ${heroTitleSupported ? 'hero_title = ?,' : ''}
           system_intro = ?,
           update_admin_id = ?,
           update_time = CURRENT_TIMESTAMP
       WHERE profile_id = ?`,
      heroTitleSupported
        ? [profile.systemName, profile.heroTitle, profile.systemIntro, adminId, currentProfile.id]
        : [profile.systemName, profile.systemIntro, adminId, currentProfile.id],
    )
  } else {
    await pool.query(
      `INSERT INTO system_profile (system_name, ${heroTitleSupported ? 'hero_title, ' : ''}system_intro, update_admin_id)
       VALUES (?, ${heroTitleSupported ? '?, ' : ''}?, ?)`,
      heroTitleSupported
        ? [profile.systemName, profile.heroTitle, profile.systemIntro, adminId]
        : [profile.systemName, profile.systemIntro, adminId],
    )
  }

  logger.info('admin_system_profile_updated', {
    adminId,
    systemName: profile.systemName,
    heroTitle: profile.heroTitle,
  })

  return getAdminSystemProfileDetail()
}

export async function createAdminNotice({ adminId, payload }) {
  await getAdminProfile(adminId)

  const notice = normalizeNoticePayload(payload)
  const [result] = await pool.query(
    `INSERT INTO notice (notice_title, notice_content, publisher_admin_id, status)
     VALUES (?, ?, ?, ?)`,
    [notice.title, notice.content, adminId, notice.status],
  )

  logger.info('admin_notice_created', {
    adminId,
    noticeId: Number(result.insertId || 0),
    status: notice.status,
  })

  return getAdminNoticeRow(Number(result.insertId || 0))
}

export async function updateAdminNotice({ adminId, noticeId, payload }) {
  await getAdminProfile(adminId)

  const normalizedNoticeId = normalizeNoticeId(noticeId)
  await getAdminNoticeRow(normalizedNoticeId)

  const notice = normalizeNoticePayload(payload)

  await pool.query(
    `UPDATE notice
     SET notice_title = ?,
         notice_content = ?,
         publisher_admin_id = ?,
         status = ?,
         update_time = CURRENT_TIMESTAMP
     WHERE notice_id = ?`,
    [notice.title, notice.content, adminId, notice.status, normalizedNoticeId],
  )

  logger.info('admin_notice_updated', {
    adminId,
    noticeId: normalizedNoticeId,
    status: notice.status,
  })

  return getAdminNoticeRow(normalizedNoticeId)
}

export async function deleteAdminNotice({ adminId, noticeId }) {
  await getAdminProfile(adminId)

  const normalizedNoticeId = normalizeNoticeId(noticeId)
  const notice = await getAdminNoticeRow(normalizedNoticeId)

  await pool.query('DELETE FROM notice WHERE notice_id = ?', [normalizedNoticeId])

  logger.info('admin_notice_deleted', {
    adminId,
    noticeId: normalizedNoticeId,
  })

  return {
    id: normalizedNoticeId,
    title: notice.title,
  }
}

export async function getAdminAccountList({ adminId, query }) {
  await getAdminProfile(adminId)

  const keyword = normalizeKeyword(query.keyword)
  const requestedPage = normalizePageNumber(query.page)
  const pageSize = normalizePageSize(query.pageSize)
  const { whereSql, params } = buildAdminWhereClause({ keyword })

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM admin a
     WHERE ${whereSql}`,
    params,
  )

  const total = Number(countRows[0]?.total || 0)
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages)
  const offset = (page - 1) * pageSize

  const [list] = await pool.query(
    `SELECT a.admin_id AS id,
            a.admin_name AS username,
            COALESCE(a.real_name, '') AS realName,
            COALESCE(NULLIF(a.real_name, ''), a.admin_name, '系统管理员') AS name,
            DATE_FORMAT(a.create_time, '%Y-%m-%d %H:%i') AS createTime,
            DATE_FORMAT(a.update_time, '%Y-%m-%d %H:%i') AS updateTime,
            CASE WHEN a.admin_id = ? THEN 1 ELSE 0 END AS isCurrent
     FROM admin a
     WHERE ${whereSql}
     ORDER BY a.update_time DESC, a.admin_id DESC
     LIMIT ? OFFSET ?`,
    [adminId, ...params, pageSize, offset],
  )

  const [statsRows] = await pool.query(
    `SELECT
        COUNT(*) AS total,
        SUM(COALESCE(NULLIF(TRIM(real_name), ''), NULL) IS NOT NULL) AS namedCount
     FROM admin`,
  )

  const statsRow = statsRows[0] || {
    total: 0,
    namedCount: 0,
  }

  logger.info('admin_account_list_loaded', {
    adminId,
    keyword,
    page,
    pageSize,
    total,
    resultCount: list.length,
  })

  return {
    stats: {
      total: Number(statsRow.total || 0),
      namedCount: Number(statsRow.namedCount || 0),
    },
    list: list.map((item) => ({
      ...item,
      id: Number(item.id),
      isCurrent: Boolean(item.isCurrent),
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  }
}

export async function createAdminAccount({ adminId, payload }) {
  await getAdminProfile(adminId)

  const account = normalizeAdminPayload(payload, { requirePassword: true })
  await ensureAdminUsernameAvailable(account.username)
  await ensureUsernameAvailableAcrossRoles(account.username)

  const hashedPassword = await bcrypt.hash(account.password, 10)
  const [result] = await pool.query(
    `INSERT INTO admin (admin_name, admin_password, real_name)
     VALUES (?, ?, ?)`,
    [account.username, hashedPassword, account.realName || null],
  )

  logger.info('admin_account_created', {
    operatorAdminId: adminId,
    targetAdminId: result.insertId,
    username: account.username,
  })

  return getManagedAdminRow(result.insertId)
}

export async function updateAdminAccount({ adminId, targetAdminId, payload }) {
  await getAdminProfile(adminId)

  const normalizedTargetAdminId = normalizeAdminId(targetAdminId)
  await getManagedAdminRow(normalizedTargetAdminId)

  const account = normalizeAdminPayload(payload, { requirePassword: false })
  await ensureAdminUsernameAvailable(account.username, normalizedTargetAdminId)
  await ensureUsernameAvailableAcrossRoles(account.username, { role: 'admin', id: normalizedTargetAdminId })

  const params = [account.username, account.realName || null]
  let passwordSql = ''

  if (account.password) {
    const hashedPassword = await bcrypt.hash(account.password, 10)
    passwordSql = ', admin_password = ?'
    params.push(hashedPassword)
  }

  params.push(normalizedTargetAdminId)

  await pool.query(
    `UPDATE admin
     SET admin_name = ?,
         real_name = ?${passwordSql},
         update_time = CURRENT_TIMESTAMP
     WHERE admin_id = ?`,
    params,
  )

  logger.info('admin_account_updated', {
    operatorAdminId: adminId,
    targetAdminId: normalizedTargetAdminId,
    username: account.username,
    passwordChanged: Boolean(account.password),
  })

  return getManagedAdminRow(normalizedTargetAdminId)
}

export async function deleteAdminAccount({ adminId, targetAdminId }) {
  await getAdminProfile(adminId)

  const normalizedTargetAdminId = normalizeAdminId(targetAdminId)
  const target = await getManagedAdminRow(normalizedTargetAdminId)

  if (normalizedTargetAdminId === Number(adminId)) {
    throw badRequest('不能删除当前登录的管理员账号')
  }

  const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM admin')
  const total = Number(countRows[0]?.total || 0)

  if (total <= 1) {
    throw badRequest('系统至少需要保留一个管理员账号')
  }

  await pool.query('DELETE FROM admin WHERE admin_id = ?', [normalizedTargetAdminId])

  logger.info('admin_account_deleted', {
    operatorAdminId: adminId,
    targetAdminId: normalizedTargetAdminId,
    username: target.username,
  })

  return {
    id: Number(target.id),
    username: target.username,
    name: target.name,
  }
}

export async function getAdminTeacherUserList({ adminId, query }) {
  await getAdminProfile(adminId)

  const keyword = normalizeKeyword(query.keyword)
  const collegeId = normalizeCollegeId(query.collegeId)
  const requestedPage = normalizePageNumber(query.page)
  const pageSize = normalizePageSize(query.pageSize)
  const { whereSql, params } = buildTeacherAccountWhereClause({ keyword, collegeId })

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM teacher_user t
     LEFT JOIN college c ON c.college_id = t.college_id
     WHERE ${whereSql}`,
    params,
  )

  const total = Number(countRows[0]?.total || 0)
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages)
  const offset = (page - 1) * pageSize

  const [rows] = await pool.query(
    `SELECT t.teacher_id AS id,
            t.username AS username,
            COALESCE(t.teacher_name, '') AS teacherName,
            COALESCE(NULLIF(t.teacher_name, ''), t.username, '未署名教师') AS name,
            COALESCE(NULLIF(t.gender, ''), '未知') AS gender,
            COALESCE(t.email, '') AS email,
            t.college_id AS collegeId,
            COALESCE(c.college_name, '未关联学院') AS collegeName,
            COALESCE(t.profile, '') AS profile,
            DATE_FORMAT(t.register_time, '%Y-%m-%d %H:%i') AS registerTime,
            DATE_FORMAT(t.update_time, '%Y-%m-%d %H:%i') AS updateTime,
            COALESCE(courseStats.courseCount, 0) AS courseCount,
            COALESCE(resourceStats.resourceCount, 0) AS resourceCount
     FROM teacher_user t
     LEFT JOIN college c ON c.college_id = t.college_id
     LEFT JOIN (
       SELECT teacher_id, COUNT(*) AS courseCount
       FROM course_intro
       WHERE status = 1
       GROUP BY teacher_id
     ) courseStats ON courseStats.teacher_id = t.teacher_id
     LEFT JOIN (
       SELECT teacher_id, COUNT(*) AS resourceCount
       FROM (
         SELECT teacher_id
         FROM material
         WHERE status = 1
         UNION ALL
         SELECT teacher_id
         FROM course_video
         WHERE status = 1
       ) resourceUnion
       GROUP BY teacher_id
     ) resourceStats ON resourceStats.teacher_id = t.teacher_id
     WHERE ${whereSql}
     ORDER BY t.update_time DESC, t.teacher_id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  )

  const [statsRows] = await pool.query(
    `SELECT
        (SELECT COUNT(*) FROM teacher_user WHERE status = 1) AS total,
        (SELECT COUNT(*) FROM teacher_user WHERE status = 1 AND college_id IS NOT NULL) AS collegeAssignedCount,
        (SELECT COUNT(*) FROM teacher_user WHERE status = 1 AND email IS NOT NULL AND TRIM(email) <> '') AS emailBoundCount,
        (SELECT COUNT(*) FROM teacher_user WHERE status = 1 AND profile IS NOT NULL AND TRIM(profile) <> '') AS profileCompletedCount`,
  )

  const statsRow = statsRows[0] || {
    total: 0,
    collegeAssignedCount: 0,
    emailBoundCount: 0,
    profileCompletedCount: 0,
  }

  logger.info('admin_teacher_user_list_loaded', {
    adminId,
    keyword,
    collegeId,
    page,
    pageSize,
    total,
    resultCount: rows.length,
  })

  return {
    stats: {
      total: Number(statsRow.total || 0),
      collegeAssignedCount: Number(statsRow.collegeAssignedCount || 0),
      emailBoundCount: Number(statsRow.emailBoundCount || 0),
      profileCompletedCount: Number(statsRow.profileCompletedCount || 0),
    },
    list: rows.map((item) => ({
      id: Number(item.id),
      username: item.username,
      teacherName: item.teacherName,
      name: item.name,
      gender: item.gender,
      email: item.email || '',
      collegeId: item.collegeId === null ? null : Number(item.collegeId),
      collegeName: item.collegeName,
      profile: item.profile || '',
      registerTime: item.registerTime,
      updateTime: item.updateTime,
      courseCount: Number(item.courseCount || 0),
      resourceCount: Number(item.resourceCount || 0),
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
    formOptions: await getAdminTeacherManageFormOptions(),
  }
}

export async function createAdminTeacherUser({ adminId, payload }) {
  await getAdminProfile(adminId)

  const teacher = normalizeManagedTeacherPayload(payload, { requirePassword: true })
  await getAdminCollegeRow(teacher.collegeId)
  await ensureTeacherUsernameAvailable(teacher.username)
  await ensureUsernameAvailableAcrossRoles(teacher.username)

  const hashedPassword = await bcrypt.hash(teacher.password, 10)
  const [result] = await pool.query(
    `INSERT INTO teacher_user (username, password, teacher_name, gender, college_id, email, profile, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [teacher.username, hashedPassword, teacher.teacherName, teacher.gender, teacher.collegeId, teacher.email, teacher.profile],
  )

  logger.info('admin_teacher_user_created', {
    adminId,
    teacherId: Number(result.insertId || 0),
    username: teacher.username,
    collegeId: teacher.collegeId,
  })

  return getManagedTeacherAccountRow(Number(result.insertId || 0))
}

export async function updateAdminTeacherUser({ adminId, teacherId, payload }) {
  await getAdminProfile(adminId)

  const normalizedTeacherId = normalizeManagedTeacherId(teacherId)
  await getManagedTeacherAccountRow(normalizedTeacherId)

  const teacher = normalizeManagedTeacherPayload(payload, { requirePassword: false })
  await getAdminCollegeRow(teacher.collegeId)
  await ensureTeacherUsernameAvailable(teacher.username, normalizedTeacherId)
  await ensureUsernameAvailableAcrossRoles(teacher.username, { role: 'teacher', id: normalizedTeacherId })

  const params = [teacher.username, teacher.teacherName, teacher.gender, teacher.collegeId, teacher.email, teacher.profile]
  let passwordSql = ''

  if (teacher.password) {
    const hashedPassword = await bcrypt.hash(teacher.password, 10)
    passwordSql = ', password = ?'
    params.push(hashedPassword)
  }

  params.push(normalizedTeacherId)

  await pool.query(
    `UPDATE teacher_user
     SET username = ?,
         teacher_name = ?,
         gender = ?,
         college_id = ?,
         email = ?,
         profile = ?${passwordSql},
         update_time = CURRENT_TIMESTAMP
     WHERE teacher_id = ? AND status = 1`,
    params,
  )

  logger.info('admin_teacher_user_updated', {
    adminId,
    teacherId: normalizedTeacherId,
    username: teacher.username,
    collegeId: teacher.collegeId,
    passwordChanged: Boolean(teacher.password),
  })

  return getManagedTeacherAccountRow(normalizedTeacherId)
}

export async function deleteAdminTeacherUser({ adminId, teacherId }) {
  await getAdminProfile(adminId)

  const normalizedTeacherId = normalizeManagedTeacherId(teacherId)
  const teacher = await getManagedTeacherAccountRow(normalizedTeacherId)

  await pool.query(
    `UPDATE teacher_user
     SET status = 0, update_time = CURRENT_TIMESTAMP
     WHERE teacher_id = ? AND status = 1`,
    [normalizedTeacherId],
  )

  logger.info('admin_teacher_user_deleted', {
    adminId,
    teacherId: normalizedTeacherId,
    username: teacher.username,
    courseCount: teacher.courseCount,
    resourceCount: teacher.resourceCount,
  })

  return {
    id: normalizedTeacherId,
    username: teacher.username,
    name: teacher.name,
  }
}

export async function getAdminStudentUserList({ adminId, query }) {
  await getAdminProfile(adminId)

  const keyword = normalizeKeyword(query.keyword)
  const collegeId = normalizeCollegeId(query.collegeId)
  const requestedPage = normalizePageNumber(query.page)
  const pageSize = normalizePageSize(query.pageSize)
  const { whereSql, params } = buildStudentAccountWhereClause({ keyword, collegeId })

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM student_user s
     LEFT JOIN college c ON c.college_id = s.college_id
     WHERE ${whereSql}`,
    params,
  )

  const total = Number(countRows[0]?.total || 0)
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages)
  const offset = (page - 1) * pageSize

  const [rows] = await pool.query(
    `SELECT s.student_id AS id,
            s.username AS username,
            COALESCE(s.student_name, '') AS studentName,
            COALESCE(NULLIF(s.student_name, ''), s.username, '未命名学生') AS name,
            COALESCE(NULLIF(s.gender, ''), '未知') AS gender,
            COALESCE(s.email, '') AS email,
            s.college_id AS collegeId,
            COALESCE(c.college_name, '未关联学院') AS collegeName,
            COALESCE(s.profile, '') AS profile,
            DATE_FORMAT(s.register_time, '%Y-%m-%d %H:%i') AS registerTime,
            DATE_FORMAT(s.update_time, '%Y-%m-%d %H:%i') AS updateTime
     FROM student_user s
     LEFT JOIN college c ON c.college_id = s.college_id
     WHERE ${whereSql}
     ORDER BY s.update_time DESC, s.student_id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  )

  const [statsRows] = await pool.query(
    `SELECT
        (SELECT COUNT(*) FROM student_user WHERE status = 1) AS total,
        (SELECT COUNT(*) FROM student_user WHERE status = 1 AND college_id IS NOT NULL) AS collegeAssignedCount,
        (SELECT COUNT(*) FROM student_user WHERE status = 1 AND email IS NOT NULL AND TRIM(email) <> '') AS emailBoundCount,
        (SELECT COUNT(*) FROM student_user WHERE status = 1 AND profile IS NOT NULL AND TRIM(profile) <> '') AS profileCompletedCount`,
  )

  const statsRow = statsRows[0] || {
    total: 0,
    collegeAssignedCount: 0,
    emailBoundCount: 0,
    profileCompletedCount: 0,
  }

  logger.info('admin_student_user_list_loaded', {
    adminId,
    keyword,
    collegeId,
    page,
    pageSize,
    total,
    resultCount: rows.length,
  })

  return {
    stats: {
      total: Number(statsRow.total || 0),
      collegeAssignedCount: Number(statsRow.collegeAssignedCount || 0),
      emailBoundCount: Number(statsRow.emailBoundCount || 0),
      profileCompletedCount: Number(statsRow.profileCompletedCount || 0),
    },
    list: rows.map((item) => ({
      id: Number(item.id),
      username: item.username,
      studentName: item.studentName,
      name: item.name,
      gender: item.gender,
      email: item.email || '',
      collegeId: item.collegeId === null ? null : Number(item.collegeId),
      collegeName: item.collegeName,
      profile: item.profile || '',
      registerTime: item.registerTime,
      updateTime: item.updateTime,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
    formOptions: await getAdminTeacherManageFormOptions(),
  }
}

export async function createAdminStudentUser({ adminId, payload }) {
  await getAdminProfile(adminId)

  const student = normalizeManagedStudentPayload(payload, { requirePassword: true })
  await getAdminCollegeRow(student.collegeId)
  await ensureStudentUsernameAvailable(student.username)
  await ensureUsernameAvailableAcrossRoles(student.username)

  const hashedPassword = await bcrypt.hash(student.password, 10)
  const [result] = await pool.query(
    `INSERT INTO student_user (username, password, student_name, gender, college_id, email, profile, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [student.username, hashedPassword, student.studentName, student.gender, student.collegeId, student.email, student.profile],
  )

  logger.info('admin_student_user_created', {
    adminId,
    studentId: Number(result.insertId || 0),
    username: student.username,
    collegeId: student.collegeId,
  })

  return getManagedStudentAccountRow(Number(result.insertId || 0))
}

export async function updateAdminStudentUser({ adminId, studentId, payload }) {
  await getAdminProfile(adminId)

  const normalizedStudentId = normalizeManagedStudentId(studentId)
  await getManagedStudentAccountRow(normalizedStudentId)

  const student = normalizeManagedStudentPayload(payload, { requirePassword: false })
  await getAdminCollegeRow(student.collegeId)
  await ensureStudentUsernameAvailable(student.username, normalizedStudentId)
  await ensureUsernameAvailableAcrossRoles(student.username, { role: 'student', id: normalizedStudentId })

  const params = [student.username, student.studentName, student.gender, student.collegeId, student.email, student.profile]
  let passwordSql = ''

  if (student.password) {
    const hashedPassword = await bcrypt.hash(student.password, 10)
    passwordSql = ', password = ?'
    params.push(hashedPassword)
  }

  params.push(normalizedStudentId)

  await pool.query(
    `UPDATE student_user
     SET username = ?,
         student_name = ?,
         gender = ?,
         college_id = ?,
         email = ?,
         profile = ?${passwordSql},
         update_time = CURRENT_TIMESTAMP
     WHERE student_id = ? AND status = 1`,
    params,
  )

  logger.info('admin_student_user_updated', {
    adminId,
    studentId: normalizedStudentId,
    username: student.username,
    collegeId: student.collegeId,
    passwordChanged: Boolean(student.password),
  })

  return getManagedStudentAccountRow(normalizedStudentId)
}

export async function deleteAdminStudentUser({ adminId, studentId }) {
  await getAdminProfile(adminId)

  const normalizedStudentId = normalizeManagedStudentId(studentId)
  const student = await getManagedStudentAccountRow(normalizedStudentId)

  await pool.query(
    `UPDATE student_user
     SET status = 0, update_time = CURRENT_TIMESTAMP
     WHERE student_id = ? AND status = 1`,
    [normalizedStudentId],
  )

  logger.info('admin_student_user_deleted', {
    adminId,
    studentId: normalizedStudentId,
    username: student.username,
  })

  return {
    id: normalizedStudentId,
    username: student.username,
    name: student.name,
  }
}

export async function getAdminCollegeList({ adminId, query }) {
  await getAdminProfile(adminId)

  const keyword = normalizeKeyword(query.keyword)
  const requestedPage = normalizePageNumber(query.page)
  const pageSize = normalizePageSize(query.pageSize)
  const { whereSql, params } = buildCollegeWhereClause({ keyword })

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM college col
     WHERE ${whereSql}`,
    params,
  )

  const total = Number(countRows[0]?.total || 0)
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages)
  const offset = (page - 1) * pageSize

  const [list] = await pool.query(
    `SELECT col.college_id AS id,
            col.college_name AS name,
            COALESCE(col.college_intro, '') AS intro,
            COALESCE(courseStats.courseCount, 0) AS courseCount,
            COALESCE(teacherStats.teacherCount, 0) AS teacherCount,
            DATE_FORMAT(col.update_time, '%Y-%m-%d') AS updateDate
     FROM college col
     LEFT JOIN (
       SELECT college_id, COUNT(*) AS courseCount
       FROM course_intro
       WHERE status = 1 AND college_id IS NOT NULL
       GROUP BY college_id
     ) courseStats ON courseStats.college_id = col.college_id
     LEFT JOIN (
       SELECT college_id, COUNT(*) AS teacherCount
       FROM teacher_user
       WHERE status = 1 AND college_id IS NOT NULL
       GROUP BY college_id
     ) teacherStats ON teacherStats.college_id = col.college_id
     WHERE ${whereSql}
     ORDER BY col.update_time DESC, col.college_id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  )

  const [statsRows] = await pool.query(
    `SELECT
        (SELECT COUNT(*) FROM college) AS total,
        (SELECT COUNT(*) FROM teacher_user WHERE status = 1 AND college_id IS NOT NULL) AS teacherCount,
        (SELECT COUNT(*) FROM course_intro WHERE status = 1 AND college_id IS NOT NULL) AS courseCount`,
  )

  const statsRow = statsRows[0] || {
    total: 0,
    teacherCount: 0,
    courseCount: 0,
  }

  logger.info('admin_college_list_loaded', {
    adminId,
    keyword,
    page,
    pageSize,
    total,
    resultCount: list.length,
  })

  return {
    stats: {
      total: Number(statsRow.total || 0),
      teacherCount: Number(statsRow.teacherCount || 0),
      courseCount: Number(statsRow.courseCount || 0),
    },
    list: list.map((item) => ({
      id: Number(item.id),
      name: item.name,
      intro: item.intro,
      courseCount: Number(item.courseCount || 0),
      teacherCount: Number(item.teacherCount || 0),
      updateDate: item.updateDate,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  }
}

export async function createAdminCollege({ adminId, payload }) {
  await getAdminProfile(adminId)

  const college = normalizeCollegePayload(payload)
  await ensureCollegeNameAvailable(college.name)

  const [result] = await pool.query(
    `INSERT INTO college (college_name, college_intro)
     VALUES (?, ?)`,
    [college.name, college.intro || null],
  )

  const collegeId = Number(result.insertId || 0)

  logger.info('admin_college_created', {
    adminId,
    collegeId,
    name: college.name,
  })

  return getAdminCollegeDetail(collegeId)
}

export async function updateAdminCollege({ adminId, collegeId, payload }) {
  await getAdminProfile(adminId)

  const normalizedCollegeId = normalizeCourseId(collegeId, '学院')
  await getAdminCollegeRow(normalizedCollegeId)

  const college = normalizeCollegePayload(payload)
  await ensureCollegeNameAvailable(college.name, normalizedCollegeId)

  await pool.query(
    `UPDATE college
     SET college_name = ?,
         college_intro = ?,
         update_time = CURRENT_TIMESTAMP
     WHERE college_id = ?`,
    [college.name, college.intro || null, normalizedCollegeId],
  )

  logger.info('admin_college_updated', {
    adminId,
    collegeId: normalizedCollegeId,
    name: college.name,
  })

  return getAdminCollegeDetail(normalizedCollegeId)
}

export async function deleteAdminCollege({ adminId, collegeId }) {
  await getAdminProfile(adminId)

  const normalizedCollegeId = normalizeCourseId(collegeId, '学院')
  const college = await getAdminCollegeRow(normalizedCollegeId)
  const usage = await getAdminCollegeUsage(normalizedCollegeId)

  if (usage.teacherCount > 0 || usage.courseCount > 0) {
    throw badRequest('该学院已关联课程或教师，请先处理关联数据后再删除')
  }

  await pool.query(
    `DELETE FROM college
     WHERE college_id = ?`,
    [normalizedCollegeId],
  )

  logger.info('admin_college_deleted', {
    adminId,
    collegeId: normalizedCollegeId,
    name: college.name,
  })

  return {
    id: normalizedCollegeId,
    name: college.name,
  }
}

export async function getAdminCourseList({ adminId, query }) {
  await getAdminProfile(adminId)

  const keyword = normalizeKeyword(query.keyword)
  const collegeId = normalizeCollegeId(query.collegeId)
  const sort = normalizeSort(query.sort)
  const requestedPage = normalizePageNumber(query.page)
  const pageSize = normalizePageSize(query.pageSize)
  const { whereSql, params } = buildCourseWhereClause({ keyword, collegeId })

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM course_intro c
     LEFT JOIN college col ON col.college_id = c.college_id
     LEFT JOIN teacher_user t ON t.teacher_id = c.teacher_id
     WHERE ${whereSql}`,
    params,
  )

  const total = Number(countRows[0]?.total || 0)
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages)
  const offset = (page - 1) * pageSize
  const orderBy =
    sort === 'video-rich'
      ? 'COALESCE(videoStats.videoCount, 0) DESC, c.update_time DESC, c.course_id DESC'
      : 'c.update_time DESC, c.course_id DESC'

  const [list] = await pool.query(
    `SELECT c.course_id AS id,
            c.course_name AS name,
            COALESCE(c.course_summary, '') AS summary,
            COALESCE(c.teaching_goal, '') AS teachingGoal,
            COALESCE(c.teaching_content, '') AS teachingContent,
            COALESCE(c.teaching_idea, '') AS teachingIdea,
            COALESCE(col.college_name, '未关联学院') AS collegeName,
            c.college_id AS collegeId,
            COALESCE(NULLIF(t.teacher_name, ''), t.username, '未署名教师') AS teacherName,
            c.teacher_id AS teacherId,
            t.college_id AS teacherCollegeId,
            COALESCE(teacherCol.college_name, '未分配学院') AS teacherCollegeName,
            CASE
              WHEN t.college_id IS NULL OR c.college_id IS NULL THEN NULL
              WHEN t.college_id = c.college_id THEN 1
              ELSE 0
            END AS teacherCollegeMatched,
            COALESCE(videoStats.videoCount, 0) AS videoCount,
            COALESCE(materialStats.materialCount, 0) AS materialCount,
            DATE_FORMAT(c.update_time, '%Y-%m-%d') AS updateDate
     FROM course_intro c
     LEFT JOIN college col ON col.college_id = c.college_id
     LEFT JOIN teacher_user t ON t.teacher_id = c.teacher_id
     LEFT JOIN college teacherCol ON teacherCol.college_id = t.college_id
     LEFT JOIN (
       SELECT course_id, COUNT(*) AS videoCount
       FROM course_video
       WHERE status = 1
       GROUP BY course_id
     ) videoStats ON videoStats.course_id = c.course_id
     LEFT JOIN (
       SELECT course_id, COUNT(*) AS materialCount
       FROM material
       WHERE status = 1
       GROUP BY course_id
     ) materialStats ON materialStats.course_id = c.course_id
     WHERE ${whereSql}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  )

  const [collegeRows] = await pool.query(
    `SELECT col.college_id AS id, col.college_name AS name
     FROM college col
     ORDER BY col.college_name ASC`,
  )

  const [statsRows] = await pool.query(
    `SELECT
        (SELECT COUNT(*) FROM course_intro WHERE status = 1) AS total,
        (SELECT COUNT(DISTINCT teacher_id) FROM course_intro WHERE status = 1 AND teacher_id IS NOT NULL) AS teacherCount,
        (SELECT COUNT(*) FROM material WHERE status = 1) AS materialCount,
        (SELECT COUNT(*) FROM course_video WHERE status = 1) AS videoCount,
        (SELECT COUNT(*) FROM course_intro WHERE status = 1 AND college_id IS NOT NULL) AS collegeAssignedCount,
        (SELECT COUNT(*)
         FROM course_intro
         WHERE status = 1
           AND COALESCE(NULLIF(TRIM(course_summary), ''), NULL) IS NOT NULL
           AND COALESCE(NULLIF(TRIM(teaching_goal), ''), NULL) IS NOT NULL
           AND COALESCE(NULLIF(TRIM(teaching_content), ''), NULL) IS NOT NULL
           AND COALESCE(NULLIF(TRIM(teaching_idea), ''), NULL) IS NOT NULL) AS contentReadyCount`,
  )

  const statsRow = statsRows[0] || {
    total: 0,
    teacherCount: 0,
    materialCount: 0,
    videoCount: 0,
    collegeAssignedCount: 0,
    contentReadyCount: 0,
  }

  logger.info('admin_course_list_loaded', {
    adminId,
    keyword,
    collegeId,
    sort,
    page,
    pageSize,
    total,
    resultCount: list.length,
  })

  return {
    stats: {
      total: Number(statsRow.total || 0),
      teacherCount: Number(statsRow.teacherCount || 0),
      materialCount: Number(statsRow.materialCount || 0),
      videoCount: Number(statsRow.videoCount || 0),
      collegeAssignedCount: Number(statsRow.collegeAssignedCount || 0),
      contentReadyCount: Number(statsRow.contentReadyCount || 0),
    },
    list: list.map((item) => ({
      ...item,
      id: Number(item.id),
      collegeId: item.collegeId === null ? null : Number(item.collegeId),
      teacherId: item.teacherId === null ? null : Number(item.teacherId),
      teacherCollegeId: item.teacherCollegeId === null ? null : Number(item.teacherCollegeId),
      teacherCollegeMatched:
        item.teacherCollegeMatched === null || item.teacherCollegeMatched === undefined
          ? null
          : Boolean(item.teacherCollegeMatched),
      materialCount: Number(item.materialCount || 0),
      videoCount: Number(item.videoCount || 0),
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
    filters: {
      colleges: collegeRows.map((item) => ({
        id: Number(item.id),
        name: item.name,
      })),
    },
    formOptions: await getAdminCourseFormOptions(),
  }
}

export async function createAdminCourse({ adminId, payload }) {
  await getAdminProfile(adminId)

  const course = normalizeCoursePayload(payload)
  const teacher = await getAdminTeacherRow(course.teacherId)
  const college = await getAdminCollegeRow(course.collegeId)

  await pool.query(
    `INSERT INTO course_intro (
       course_name,
       course_summary,
       teaching_goal,
       teaching_content,
       teaching_idea,
       college_id,
       teacher_id,
       status
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      course.name,
      course.summary || null,
      course.teachingGoal || null,
      course.teachingContent || null,
      course.teachingIdea || null,
      course.collegeId,
      course.teacherId,
    ],
  )

  const [resultRows] = await pool.query('SELECT LAST_INSERT_ID() AS id')
  const courseId = Number(resultRows[0]?.id || 0)

  logger.info('admin_course_created', {
    adminId,
    courseId,
    teacherId: course.teacherId,
    collegeId: course.collegeId,
  })

  return {
    ...(await getAdminCourseDetail(courseId)),
    formOptions: await getAdminCourseFormOptions(),
    collegeName: college.name,
    teacherName: teacher.name,
  }
}

export async function updateAdminCourse({ adminId, courseId, payload }) {
  await getAdminProfile(adminId)

  const normalizedCourseId = normalizeCourseId(courseId)
  await getAdminCourseRow(normalizedCourseId)

  const course = normalizeCoursePayload(payload)
  const teacher = await getAdminTeacherRow(course.teacherId)
  const college = await getAdminCollegeRow(course.collegeId)

  await pool.query(
    `UPDATE course_intro
     SET course_name = ?,
         course_summary = ?,
         teaching_goal = ?,
         teaching_content = ?,
         teaching_idea = ?,
         college_id = ?,
         teacher_id = ?,
         update_time = CURRENT_TIMESTAMP
     WHERE course_id = ? AND status = 1`,
    [
      course.name,
      course.summary || null,
      course.teachingGoal || null,
      course.teachingContent || null,
      course.teachingIdea || null,
      course.collegeId,
      course.teacherId,
      normalizedCourseId,
    ],
  )

  logger.info('admin_course_updated', {
    adminId,
    courseId: normalizedCourseId,
    teacherId: course.teacherId,
    collegeId: course.collegeId,
  })

  return {
    ...(await getAdminCourseDetail(normalizedCourseId)),
    formOptions: await getAdminCourseFormOptions(),
    collegeName: college.name,
    teacherName: teacher.name,
  }
}

export async function deleteAdminCourse({ adminId, courseId }) {
  await getAdminProfile(adminId)

  const normalizedCourseId = normalizeCourseId(courseId)
  const course = await getAdminCourseRow(normalizedCourseId)

  await pool.query(
    `UPDATE course_intro
     SET status = 0, update_time = CURRENT_TIMESTAMP
     WHERE course_id = ? AND status = 1`,
    [normalizedCourseId],
  )

  logger.info('admin_course_deleted', {
    adminId,
    courseId: normalizedCourseId,
    teacherId: Number(course.teacherId || 0),
  })

  return {
    id: normalizedCourseId,
    name: course.name,
  }
}

export async function getAdminPrepList({ adminId, query }) {
  await getAdminProfile(adminId)
  await ensureTeachingPrepReady()

  const keyword = normalizeKeyword(query.keyword)
  const requestedPage = normalizePageNumber(query.page)
  const pageSize = normalizePageSize(query.pageSize)
  const courseId = query.courseId === undefined || query.courseId === null || query.courseId === '' ? null : normalizeCourseId(query.courseId)
  const status = normalizePrepFilterStatus(query.status)
  const params = []
  let whereSql = '1 = 1'

  if (courseId) {
    whereSql += ' AND p.course_id = ?'
    params.push(courseId)
  }

  if (status !== 'all') {
    whereSql += ' AND p.status = ?'
    params.push(status)
  }

  if (keyword) {
    const keywordPattern = `%${keyword}%`
    whereSql += ` AND (
      p.prep_title LIKE ?
      OR COALESCE(ci.course_name, '') LIKE ?
      OR COALESCE(t.teacher_name, '') LIKE ?
      OR COALESCE(t.username, '') LIKE ?
      OR COALESCE(p.teaching_objective, '') LIKE ?
      OR COALESCE(p.key_points, '') LIKE ?
      OR COALESCE(p.difficulty_points, '') LIKE ?
      OR COALESCE(p.student_analysis, '') LIKE ?
      OR COALESCE(p.teaching_content, '') LIKE ?
      OR COALESCE(p.teaching_process, '') LIKE ?
      OR COALESCE(p.reflection_notes, '') LIKE ?
    )`
    params.push(
      keywordPattern,
      keywordPattern,
      keywordPattern,
      keywordPattern,
      keywordPattern,
      keywordPattern,
      keywordPattern,
      keywordPattern,
      keywordPattern,
      keywordPattern,
      keywordPattern,
    )
  }

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM teaching_prep p
     LEFT JOIN course_intro ci ON ci.course_id = p.course_id
     LEFT JOIN teacher_user t ON t.teacher_id = p.teacher_id
     WHERE ${whereSql}`,
    params,
  )

  const total = Number(countRows[0]?.total || 0)
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages)
  const offset = (page - 1) * pageSize

  const [listRows] = await pool.query(
    `SELECT p.prep_id AS id,
            p.teacher_id AS teacherId,
            p.course_id AS courseId,
            p.prep_title AS title,
            COALESCE(p.teaching_objective, '') AS teachingObjective,
            COALESCE(p.key_points, '') AS keyPoints,
            COALESCE(p.difficulty_points, '') AS difficultyPoints,
            COALESCE(p.student_analysis, '') AS studentAnalysis,
            COALESCE(p.teaching_content, '') AS teachingContent,
            COALESCE(p.teaching_process, '') AS teachingProcess,
            COALESCE(p.reflection_notes, '') AS reflectionNotes,
            p.status AS status,
            DATE_FORMAT(p.create_time, '%Y-%m-%d') AS createTime,
            DATE_FORMAT(p.update_time, '%Y-%m-%d') AS updateTime,
            COALESCE(ci.course_name, '未关联课程') AS courseName,
            COALESCE(NULLIF(t.teacher_name, ''), t.username, '未命名教师') AS teacherName
     FROM teaching_prep p
     LEFT JOIN course_intro ci ON ci.course_id = p.course_id
     LEFT JOIN teacher_user t ON t.teacher_id = p.teacher_id
     WHERE ${whereSql}
     ORDER BY p.update_time DESC, p.prep_id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  )

  const [statsRows] = await pool.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END), 0) AS draftCount,
            COALESCE(SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END), 0) AS publishedCount,
            COUNT(DISTINCT teacher_id) AS teacherCount
     FROM teaching_prep`,
  )

  const [courseRows] = await pool.query(
    `SELECT course_id AS id, course_name AS name
     FROM course_intro
     WHERE status = 1
     ORDER BY update_time DESC, course_id DESC`,
  )

  const statsRow = statsRows[0] || {
    total: 0,
    draftCount: 0,
    publishedCount: 0,
    teacherCount: 0,
  }

  logger.info('admin_prep_list_loaded', {
    adminId,
    keyword,
    courseId,
    status,
    page,
    pageSize,
    total,
    resultCount: listRows.length,
  })

  return {
    stats: {
      total: Number(statsRow.total || 0),
      draftCount: Number(statsRow.draftCount || 0),
      publishedCount: Number(statsRow.publishedCount || 0),
      teacherCount: Number(statsRow.teacherCount || 0),
    },
    list: listRows.map(mapAdminPrepItem),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
    filters: {
      courses: courseRows.map((item) => ({
        id: Number(item.id),
        name: item.name,
      })),
    },
  }
}

export async function deleteAdminPrep({ adminId, prepId }) {
  await getAdminProfile(adminId)
  await ensureTeachingPrepReady()

  const normalizedPrepId = normalizePrepId(prepId)
  const prep = await getAdminPrepRow(normalizedPrepId)

  await pool.query(
    `DELETE FROM teaching_prep
     WHERE prep_id = ?`,
    [normalizedPrepId],
  )

  logger.info('admin_prep_deleted', {
    adminId,
    prepId: normalizedPrepId,
    teacherId: Number(prep.teacherId || 0),
  })

  return {
    id: normalizedPrepId,
    title: prep.title,
  }
}

export async function getAdminAssetList({ adminId, query }) {
  await getAdminProfile(adminId)
  await ensureAssetLibraryReady()

  const keyword = normalizeKeyword(query.keyword)
  const requestedPage = normalizePageNumber(query.page)
  const pageSize = normalizePageSize(query.pageSize)
  const courseId = query.courseId === undefined || query.courseId === null || query.courseId === '' ? null : normalizeCourseId(query.courseId)
  const type = normalizeAssetType(query.type)
  const params = []
  let whereSql = 'a.status = 1'

  if (courseId) {
    whereSql += ' AND a.course_id = ?'
    params.push(courseId)
  }

  if (type !== 'all') {
    whereSql += ' AND a.asset_type = ?'
    params.push(type)
  }

  if (keyword) {
    const keywordPattern = `%${keyword}%`
    whereSql += ` AND (
      a.asset_title LIKE ?
      OR COALESCE(a.asset_description, '') LIKE ?
      OR COALESCE(a.asset_content, '') LIKE ?
      OR COALESCE(a.file_name, '') LIKE ?
      OR COALESCE(t.teacher_name, '') LIKE ?
      OR COALESCE(t.username, '') LIKE ?
    )`
    params.push(keywordPattern, keywordPattern, keywordPattern, keywordPattern, keywordPattern, keywordPattern)
  }

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM asset_library a
     LEFT JOIN teacher_user t ON t.teacher_id = a.teacher_id
     WHERE ${whereSql}`,
    params,
  )

  const total = Number(countRows[0]?.total || 0)
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages)
  const offset = (page - 1) * pageSize

  const [listRows] = await pool.query(
    `SELECT a.asset_id AS id,
            a.asset_type AS type,
            a.teacher_id AS teacherId,
            a.course_id AS courseId,
            a.asset_title AS title,
            COALESCE(a.asset_description, '') AS description,
            COALESCE(a.asset_content, '') AS content,
            COALESCE(a.file_name, '') AS fileName,
            COALESCE(a.file_size, 0) AS fileSize,
            DATE_FORMAT(a.create_time, '%Y-%m-%d') AS uploadTime,
            COALESCE(ci.course_name, '未关联课程') AS courseName,
            COALESCE(NULLIF(t.teacher_name, ''), t.username, '未命名教师') AS teacherName
     FROM asset_library a
     LEFT JOIN course_intro ci ON ci.course_id = a.course_id
     LEFT JOIN teacher_user t ON t.teacher_id = a.teacher_id
     WHERE ${whereSql}
     ORDER BY a.update_time DESC, a.asset_id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  )

  const [statsRows] = await pool.query(
    `SELECT
        COUNT(*) AS total,
        COUNT(DISTINCT course_id) AS courseCount,
        COUNT(DISTINCT teacher_id) AS teacherCount,
        SUM(CASE WHEN asset_type IN ('image', 'audio', 'video') THEN 1 ELSE 0 END) AS fileCount
     FROM asset_library
     WHERE status = 1`,
  )

  const [courseRows] = await pool.query(
    `SELECT course_id AS id, course_name AS name
     FROM course_intro
     WHERE status = 1
     ORDER BY update_time DESC, course_id DESC`,
  )

  const statsRow = statsRows[0] || {
    total: 0,
    courseCount: 0,
    teacherCount: 0,
    fileCount: 0,
  }

  logger.info('admin_asset_list_loaded', {
    adminId,
    keyword,
    courseId,
    type,
    page,
    pageSize,
    total,
    resultCount: listRows.length,
  })

  return {
    stats: {
      total: Number(statsRow.total || 0),
      courseCount: Number(statsRow.courseCount || 0),
      teacherCount: Number(statsRow.teacherCount || 0),
      fileCount: Number(statsRow.fileCount || 0),
    },
    list: listRows.map((item) => ({
      id: Number(item.id),
      type: item.type,
      teacherId: Number(item.teacherId || 0),
      courseId: Number(item.courseId || 0),
      title: item.title,
      description: item.description || '',
      content: item.content || '',
      fileName: item.fileName || '',
      fileSize: Number(item.fileSize || 0),
      uploadTime: item.uploadTime,
      courseName: item.courseName,
      teacherName: item.teacherName,
      previewUrl: ASSET_FILE_TYPES.has(item.type) ? buildAssetPreviewUrl(Number(item.id)) : '',
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
    filters: {
      courses: courseRows.map((item) => ({
        id: Number(item.id),
        name: item.name,
      })),
    },
  }
}

export async function deleteAdminAsset({ adminId, assetId }) {
  await getAdminProfile(adminId)
  await ensureAssetLibraryReady()

  const normalizedAssetId = normalizeAssetId(assetId)
  const asset = await getAdminAssetRow(normalizedAssetId)

  await pool.query(
    `UPDATE asset_library
     SET status = 0, update_time = CURRENT_TIMESTAMP
     WHERE asset_id = ? AND status = 1`,
    [normalizedAssetId],
  )

  logger.info('admin_asset_deleted', {
    adminId,
    assetId: normalizedAssetId,
    teacherId: Number(asset.teacherId || 0),
    courseId: Number(asset.courseId || 0),
  })

  return {
    id: normalizedAssetId,
    type: asset.type,
    title: asset.title,
  }
}

export async function getAdminResourceList({ adminId, type, query }) {
  await getAdminProfile(adminId)

  const normalizedType = normalizeResourceType(type)
  const keyword = normalizeKeyword(query.keyword)
  const requestedPage = normalizePageNumber(query.page)
  const pageSize = normalizePageSize(query.pageSize)
  const courseId = query.courseId === undefined || query.courseId === null || query.courseId === '' ? null : normalizeCourseId(query.courseId)
  const keywordPattern = keyword ? `%${keyword}%` : ''

  if (normalizedType === 'all') {
    const params = []
    let materialWhereSql = 'm.status = 1'
    let videoWhereSql = 'v.status = 1'

    if (courseId) {
      materialWhereSql += ' AND m.course_id = ?'
      videoWhereSql += ' AND v.course_id = ?'
      params.push(courseId)
    }

    if (keyword) {
      materialWhereSql += ` AND (m.material_name LIKE ? OR COALESCE(m.description, '') LIKE ? OR COALESCE(m.file_name, '') LIKE ?)`
      videoWhereSql += ` AND (v.video_title LIKE ? OR COALESCE(v.description, '') LIKE ?)`
    }

    const materialParams = keyword ? [...params, keywordPattern, keywordPattern, keywordPattern] : [...params]
    const videoParams = keyword ? [...params, keywordPattern, keywordPattern] : [...params]

    const [materialRows] = await pool.query(
      `SELECT m.material_id AS id,
              'material' AS type,
              m.course_id AS courseId,
              m.teacher_id AS teacherId,
              m.material_name AS title,
              COALESCE(ci.course_name, '未关联课程') AS courseName,
              COALESCE(NULLIF(t.teacher_name, ''), t.username, '未署名教师') AS teacherName,
              COALESCE(m.description, '') AS description,
              COALESCE(NULLIF(m.file_name, ''), m.material_name) AS fileName,
              m.file_size AS fileSize,
              m.material_type AS formatSource,
              NULL AS duration,
              m.download_count AS interactionCount,
              DATE_FORMAT(m.upload_time, '%Y-%m-%d') AS uploadTime,
              m.upload_time AS sortTime
       FROM material m
       LEFT JOIN course_intro ci ON ci.course_id = m.course_id
       LEFT JOIN teacher_user t ON t.teacher_id = m.teacher_id
       WHERE ${materialWhereSql}`,
      materialParams,
    )

    const [videoRows] = await pool.query(
      `SELECT v.video_id AS id,
              'video' AS type,
              v.course_id AS courseId,
              v.teacher_id AS teacherId,
              v.video_title AS title,
              COALESCE(ci.course_name, '未关联课程') AS courseName,
              COALESCE(NULLIF(t.teacher_name, ''), t.username, '未署名教师') AS teacherName,
              COALESCE(v.description, '') AS description,
              COALESCE(NULLIF(v.video_title, ''), v.video_title) AS fileName,
              v.file_size AS fileSize,
              v.video_path AS formatSource,
              v.duration AS duration,
              v.play_count AS interactionCount,
              DATE_FORMAT(v.upload_time, '%Y-%m-%d') AS uploadTime,
              v.upload_time AS sortTime
       FROM course_video v
       LEFT JOIN course_intro ci ON ci.course_id = v.course_id
       LEFT JOIN teacher_user t ON t.teacher_id = v.teacher_id
       WHERE ${videoWhereSql}`,
      videoParams,
    )

    const mergedList = [...materialRows, ...videoRows]
      .map((item) => ({
        id: Number(item.id),
        type: item.type,
        courseId: Number(item.courseId || 0),
        teacherId: Number(item.teacherId || 0),
        title: item.title,
        courseName: item.courseName,
        teacherName: item.teacherName,
        description: item.description || '',
        fileName: item.fileName || item.title,
        fileSize: Number(item.fileSize || 0),
        format: String(item.formatSource || item.type).toUpperCase().split('.').pop(),
        duration: item.duration === null || item.duration === undefined ? null : Number(item.duration),
        interactionCount: Number(item.interactionCount || 0),
        uploadTime: item.uploadTime,
        previewUrl: buildResourcePreviewUrl(item.type, Number(item.id)),
        sortTime: item.sortTime,
      }))
      .sort((left, right) => new Date(right.sortTime).getTime() - new Date(left.sortTime).getTime())

    const total = mergedList.length
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
    const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages)
    const offset = (page - 1) * pageSize
    const list = mergedList.slice(offset, offset + pageSize).map(({ sortTime, ...item }) => item)

    const [statsRows] = await pool.query(
      `SELECT
          (SELECT COUNT(*) FROM material WHERE status = 1) + (SELECT COUNT(*) FROM course_video WHERE status = 1) AS total,
          COUNT(DISTINCT resource.courseId) AS courseCount,
          COUNT(DISTINCT resource.teacherId) AS teacherCount,
          COALESCE(SUM(resource.interactionCount), 0) AS interactionCount
       FROM (
         SELECT course_id AS courseId, teacher_id AS teacherId, download_count AS interactionCount
         FROM material
         WHERE status = 1
         UNION ALL
         SELECT course_id AS courseId, teacher_id AS teacherId, play_count AS interactionCount
         FROM course_video
         WHERE status = 1
       ) resource`,
    )

    const [courseRows] = await pool.query(
      `SELECT course_id AS id, course_name AS name
       FROM course_intro
       WHERE status = 1
       ORDER BY update_time DESC, course_id DESC`,
    )

    const statsRow = statsRows[0] || {
      total: 0,
      courseCount: 0,
      teacherCount: 0,
      interactionCount: 0,
    }

    logger.info('admin_resource_list_loaded', {
      adminId,
      keyword,
      courseId,
      page,
      pageSize,
      total,
      resultCount: list.length,
    })

    return {
      stats: {
        total: Number(statsRow.total || 0),
        courseCount: Number(statsRow.courseCount || 0),
        teacherCount: Number(statsRow.teacherCount || 0),
        interactionCount: Number(statsRow.interactionCount || 0),
      },
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      filters: {
        courses: courseRows.map((item) => ({
          id: Number(item.id),
          name: item.name,
        })),
      },
    }
  }

  const params = []

  const alias = normalizedType === 'material' ? 'm' : 'v'
  const tableName = normalizedType === 'material' ? 'material' : 'course_video'
  const idField = normalizedType === 'material' ? 'material_id' : 'video_id'
  const titleField = normalizedType === 'material' ? 'material_name' : 'video_title'
  const descriptionField = 'description'
  const fileNameField = normalizedType === 'material' ? `COALESCE(NULLIF(m.file_name, ''), m.material_name)` : `COALESCE(NULLIF(v.video_title, ''), v.video_title)`
  const interactionField = normalizedType === 'material' ? 'download_count' : 'play_count'
  const extraSearchSql = normalizedType === 'material' ? ` OR COALESCE(${alias}.file_name, '') LIKE ?` : ''
  let whereSql = `${alias}.status = 1`

  if (courseId) {
    whereSql += ` AND ${alias}.course_id = ?`
    params.push(courseId)
  }

  if (keyword) {
    whereSql += ` AND (${alias}.${titleField} LIKE ? OR COALESCE(${alias}.${descriptionField}, '') LIKE ?${extraSearchSql})`
    params.push(keywordPattern, keywordPattern)
    if (normalizedType === 'material') {
      params.push(keywordPattern)
    }
  }

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM ${tableName} ${alias}
     WHERE ${whereSql}`,
    params,
  )

  const total = Number(countRows[0]?.total || 0)
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages)
  const offset = (page - 1) * pageSize

  const [list] = await pool.query(
    `SELECT ${alias}.${idField} AS id,
            ${alias}.course_id AS courseId,
            ${alias}.teacher_id AS teacherId,
            ${alias}.${titleField} AS title,
            COALESCE(ci.course_name, '未关联课程') AS courseName,
            COALESCE(NULLIF(t.teacher_name, ''), t.username, '未署名教师') AS teacherName,
            COALESCE(${alias}.description, '') AS description,
            ${fileNameField} AS fileName,
            ${alias}.file_size AS fileSize,
            ${normalizedType === 'material' ? `${alias}.material_type` : `${alias}.video_path`} AS formatSource,
            ${normalizedType === 'video' ? `${alias}.duration` : 'NULL'} AS duration,
            ${alias}.${interactionField} AS interactionCount,
            DATE_FORMAT(${alias}.upload_time, '%Y-%m-%d') AS uploadTime
     FROM ${tableName} ${alias}
     LEFT JOIN course_intro ci ON ci.course_id = ${alias}.course_id
     LEFT JOIN teacher_user t ON t.teacher_id = ${alias}.teacher_id
     WHERE ${whereSql}
     ORDER BY ${alias}.upload_time DESC, ${alias}.${idField} DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  )

  const [statsRows] = await pool.query(
    `SELECT
        COUNT(*) AS total,
        COUNT(DISTINCT course_id) AS courseCount,
        COUNT(DISTINCT teacher_id) AS teacherCount,
        COALESCE(SUM(${interactionField}), 0) AS interactionCount
     FROM ${tableName}
     WHERE status = 1`,
  )

  const [courseRows] = await pool.query(
    `SELECT course_id AS id, course_name AS name
     FROM course_intro
     WHERE status = 1
     ORDER BY update_time DESC, course_id DESC`,
  )

  const statsRow = statsRows[0] || {
    total: 0,
    courseCount: 0,
    teacherCount: 0,
    interactionCount: 0,
  }

  logger.info(`admin_${normalizedType}_list_loaded`, {
    adminId,
    keyword,
    courseId,
    page,
    pageSize,
    total,
    resultCount: list.length,
  })

  return {
    stats: {
      total: Number(statsRow.total || 0),
      courseCount: Number(statsRow.courseCount || 0),
      teacherCount: Number(statsRow.teacherCount || 0),
      interactionCount: Number(statsRow.interactionCount || 0),
    },
    list: list.map((item) => ({
      id: Number(item.id),
      type: normalizedType,
      courseId: Number(item.courseId || 0),
      teacherId: Number(item.teacherId || 0),
      title: item.title,
      courseName: item.courseName,
      teacherName: item.teacherName,
      description: item.description || '',
      fileName: item.fileName || item.title,
      fileSize: Number(item.fileSize || 0),
      format: String(item.formatSource || normalizedType).toUpperCase().split('.').pop(),
      duration: item.duration === null || item.duration === undefined ? null : Number(item.duration),
      interactionCount: Number(item.interactionCount || 0),
      uploadTime: item.uploadTime,
      previewUrl: buildResourcePreviewUrl(normalizedType, Number(item.id)),
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
    filters: {
      courses: courseRows.map((item) => ({
        id: Number(item.id),
        name: item.name,
      })),
    },
  }
}

export async function deleteAdminResource({ adminId, type, resourceId }) {
  await getAdminProfile(adminId)

  const normalizedType = normalizeResourceType(type)
  const normalizedResourceId = normalizeResourceId(resourceId, normalizedType === 'material' ? '资料' : '视频')
  const resource = normalizedType === 'material' ? await getAdminMaterialRow(normalizedResourceId) : await getAdminVideoRow(normalizedResourceId)

  if (normalizedType === 'material') {
    await pool.query(
      `UPDATE material
       SET status = 0, update_time = CURRENT_TIMESTAMP
       WHERE material_id = ? AND status = 1`,
      [normalizedResourceId],
    )
  } else {
    await pool.query(
      `UPDATE course_video
       SET status = 0, update_time = CURRENT_TIMESTAMP
       WHERE video_id = ? AND status = 1`,
      [normalizedResourceId],
    )
  }

  logger.info(`admin_${normalizedType}_deleted`, {
    adminId,
    resourceId: normalizedResourceId,
    courseId: Number(resource.courseId || 0),
    teacherId: Number(resource.teacherId || 0),
  })

  return {
    id: normalizedResourceId,
    type: normalizedType,
    title: resource.title,
  }
}

export async function getAdminMessageList({ adminId, query }) {
  await getAdminProfile(adminId)

  const keyword = normalizeKeyword(query.keyword)
  const requestedPage = normalizePageNumber(query.page)
  const pageSize = normalizePageSize(query.pageSize)
  const params = []
  let keywordSql = ''

  if (keyword) {
    const keywordPattern = `%${keyword}%`
    keywordSql = ' AND (mt.title LIKE ? OR mt.content LIKE ? OR COALESCE(t.teacher_name, \'\') LIKE ? OR COALESCE(t.username, \'\') LIKE ?)'
    params.push(keywordPattern, keywordPattern, keywordPattern, keywordPattern)
  }

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM message_topic mt
     LEFT JOIN teacher_user t ON t.teacher_id = mt.teacher_id
     WHERE mt.status <> 'archived'${keywordSql}`,
    params,
  )

  const total = Number(countRows[0]?.total || 0)
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages)
  const offset = (page - 1) * pageSize

  const [list] = await pool.query(
    `SELECT mt.topic_id AS id,
            mt.title AS title,
            CASE
              WHEN CHAR_LENGTH(mt.content) > 56 THEN CONCAT(LEFT(mt.content, 56), '...')
              ELSE mt.content
            END AS summary,
            COALESCE(NULLIF(t.teacher_name, ''), t.username, '未署名教师') AS teacherName,
            DATE_FORMAT(mt.create_time, '%Y-%m-%d') AS publishDate,
            DATE_FORMAT(COALESCE(lastReply.lastReplyAt, mt.update_time), '%Y-%m-%d') AS lastReplyAt,
            mt.status AS status,
            COALESCE(replyStats.replyCount, 0) AS replyCount
     FROM message_topic mt
     LEFT JOIN teacher_user t ON t.teacher_id = mt.teacher_id
     LEFT JOIN (
       SELECT topic_id, COUNT(*) AS replyCount
       FROM message_topic_reply
       GROUP BY topic_id
     ) replyStats ON replyStats.topic_id = mt.topic_id
     LEFT JOIN (
       SELECT topic_id, MAX(reply_time) AS lastReplyAt
       FROM message_topic_reply
       GROUP BY topic_id
     ) lastReply ON lastReply.topic_id = mt.topic_id
     WHERE mt.status <> 'archived'${keywordSql}
     ORDER BY COALESCE(lastReply.lastReplyAt, mt.update_time) DESC, mt.topic_id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  )

  logger.info('admin_message_list_loaded', {
    adminId,
    keyword,
    page,
    pageSize,
    total,
    resultCount: list.length,
  })

  return {
    list: list.map((item) => ({
      ...item,
      id: Number(item.id),
      replyCount: Number(item.replyCount || 0),
      statusLabel: getStatusLabel(item.status),
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  }
}

export async function getAdminMessageDetail({ adminId, messageId }) {
  await getAdminProfile(adminId)

  const normalizedMessageId = normalizeMessageId(messageId)
  const topic = await getAdminMessageRow(normalizedMessageId)
  const replySchemaSupport = await getReplySchemaSupport()

  const [replies] = replySchemaSupport.enabled
    ? await pool.query(
        `SELECT r.reply_id AS id,
                r.content AS content,
                COALESCE(
                  NULLIF(a.real_name, ''),
                  a.admin_name,
                  NULLIF(t.teacher_name, ''),
                  t.username,
                  '未署名用户'
                ) AS authorName,
                DATE_FORMAT(r.reply_time, '%Y-%m-%d %H:%i') AS replyTime
         FROM message_topic_reply r
         LEFT JOIN teacher_user t ON t.teacher_id = r.teacher_id
         LEFT JOIN admin a ON a.admin_id = r.admin_id
         WHERE r.topic_id = ?
         ORDER BY r.reply_time ASC, r.reply_id ASC`,
        [normalizedMessageId],
      )
    : await pool.query(
        `SELECT r.reply_id AS id,
                r.content AS content,
                COALESCE(NULLIF(t.teacher_name, ''), t.username, '未署名教师') AS authorName,
                DATE_FORMAT(r.reply_time, '%Y-%m-%d %H:%i') AS replyTime
         FROM message_topic_reply r
         LEFT JOIN teacher_user t ON t.teacher_id = r.teacher_id
         WHERE r.topic_id = ?
         ORDER BY r.reply_time ASC, r.reply_id ASC`,
        [normalizedMessageId],
      )

  logger.info('admin_message_detail_loaded', {
    adminId,
    topicId: normalizedMessageId,
    replyCount: replies.length,
  })

  return {
    topic: {
      id: Number(topic.id),
      title: topic.title,
      content: topic.content,
      teacherId: Number(topic.teacherId || 0),
      teacherName: topic.teacherName,
      publishDate: formatDate(topic.createTime),
      statusLabel: getStatusLabel(topic.status),
    },
    replies: replies.map((item) => ({
      id: Number(item.id),
      content: item.content,
      authorName: item.authorName,
      replyTime: item.replyTime,
    })),
    capabilities: {
      canReply: replySchemaSupport.enabled,
    },
  }
}

export async function createAdminMessageReply({ adminId, messageId, payload }) {
  const admin = await getAdminProfile(adminId)
  const normalizedMessageId = normalizeMessageId(messageId)
  const content = normalizeContent(payload.content, '回复内容')
  const replySchemaSupport = await getReplySchemaSupport()

  await getAdminMessageRow(normalizedMessageId)

  if (!replySchemaSupport.enabled) {
    logger.warn('admin_message_reply_schema_missing', {
      adminId,
      topicId: normalizedMessageId,
    })
    throw badRequest('当前数据库未启用管理员回复字段，请先升级 message_topic_reply 表结构')
  }

  const [result] = await pool.query(
    `INSERT INTO message_topic_reply (topic_id, teacher_id, admin_id, content)
     VALUES (?, NULL, ?, ?)`,
    [normalizedMessageId, adminId, content],
  )

  await pool.query(
    `UPDATE message_topic
     SET status = 'active', update_time = CURRENT_TIMESTAMP
     WHERE topic_id = ? AND status <> 'archived'`,
    [normalizedMessageId],
  )

  logger.info('admin_message_reply_created', {
    adminId,
    adminName: admin.name,
    topicId: normalizedMessageId,
    replyId: result.insertId,
  })

  return {
    id: Number(result.insertId),
  }
}

export async function deleteAdminMessage({ adminId, messageId }) {
  await getAdminProfile(adminId)

  const normalizedMessageId = normalizeMessageId(messageId)
  const topic = await getAdminMessageRow(normalizedMessageId)

  await pool.query(
    `UPDATE message_topic
     SET status = 'archived', update_time = CURRENT_TIMESTAMP
     WHERE topic_id = ? AND status <> 'archived'`,
    [normalizedMessageId],
  )

  logger.info('admin_message_deleted', {
    adminId,
    topicId: normalizedMessageId,
    teacherId: Number(topic.teacherId || 0),
  })

  return {
    id: normalizedMessageId,
    title: topic.title,
  }
}
