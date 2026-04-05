import bcrypt from 'bcryptjs'
import { pool } from '../config/db.js'
import { logger } from '../utils/logger.js'

const DEFAULT_PAGE_SIZE = 6
const MAX_PAGE_SIZE = 12
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
  if (value === 'material' || value === 'video') {
    return value
  }

  throw badRequest('资源类型不合法')
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

export async function getAdminResourceList({ adminId, type, query }) {
  await getAdminProfile(adminId)

  const normalizedType = normalizeResourceType(type)
  const keyword = normalizeKeyword(query.keyword)
  const requestedPage = normalizePageNumber(query.page)
  const pageSize = normalizePageSize(query.pageSize)
  const courseId = query.courseId === undefined || query.courseId === null || query.courseId === '' ? null : normalizeCourseId(query.courseId)
  const keywordPattern = keyword ? `%${keyword}%` : ''
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
