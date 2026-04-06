import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from '../config/db.js'
import { logger } from '../utils/logger.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(currentDir, '../../../')
const DEFAULT_PAGE_SIZE = 6
const MAX_PAGE_SIZE = 50
const MAX_DESCRIPTION_LENGTH = 2000
const ASSET_FILE_TYPES = new Set(['image', 'audio', 'video'])
const ASSET_CONTENT_TYPES = new Set(['text', 'question', 'template'])
const ASSET_TYPES = [...ASSET_FILE_TYPES, ...ASSET_CONTENT_TYPES]
const ASSET_VISIBILITIES = new Set(['private', 'public'])
const PREP_STATUSES = new Set(['draft', 'published', 'archived'])

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

function normalizeMessageId(value) {
  const messageId = Number(value)
  if (!Number.isInteger(messageId) || messageId <= 0) {
    throw badRequest('交流主题ID不合法')
  }

  return messageId
}

function normalizeCourseId(value, label = '课程') {
  const courseId = Number(value)
  if (!Number.isInteger(courseId) || courseId <= 0) {
    throw badRequest(`${label}ID不合法`)
  }

  return courseId
}

function normalizeTitle(value) {
  const title = typeof value === 'string' ? value.trim() : ''
  if (!title) {
    throw badRequest('话题标题不能为空')
  }

  if (title.length > 100) {
    throw badRequest('话题标题不能超过100个字')
  }

  return title
}

function normalizeMaterialName(value) {
  const materialName = typeof value === 'string' ? value.trim() : ''
  if (!materialName) {
    throw badRequest('资料名称不能为空')
  }

  if (materialName.length > 200) {
    throw badRequest('资料名称不能超过200个字')
  }

  return materialName
}

function normalizeDescription(value, label = '资料说明') {
  const description = typeof value === 'string' ? value.trim() : ''
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw badRequest(`${label}不能超过2000个字`)
  }

  return description
}

function normalizeVideoTitle(value) {
  const videoTitle = typeof value === 'string' ? value.trim() : ''
  if (!videoTitle) {
    throw badRequest('视频标题不能为空')
  }

  if (videoTitle.length > 200) {
    throw badRequest('视频标题不能超过200个字')
  }

  return videoTitle
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

function normalizeDuration(value) {
  if (value === undefined || value === null || value === '') {
    return null
  }

  const duration = Number(value)
  if (!Number.isFinite(duration) || duration <= 0) {
    throw badRequest('视频时长不合法')
  }

  return Math.round(duration)
}

function normalizeResourceId(value) {
  const resourceId = Number(value)
  if (!Number.isInteger(resourceId) || resourceId <= 0) {
    throw badRequest('资源ID不合法')
  }

  return resourceId
}

function normalizeResourceType(value) {
  if (value === 'material' || value === 'video') {
    return value
  }

  throw badRequest('资源类型不合法')
}

function normalizeResourceFilterType(value) {
  if (value === undefined || value === null || value === '' || value === 'all') {
    return 'all'
  }

  return normalizeResourceType(value)
}

function normalizeAssetId(value) {
  const assetId = Number(value)
  if (!Number.isInteger(assetId) || assetId <= 0) {
    throw badRequest('素材ID不合法')
  }

  return assetId
}

function normalizeAssetType(value) {
  const assetType = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (ASSET_TYPES.includes(assetType)) {
    return assetType
  }

  throw badRequest('素材类型不合法')
}

function normalizeAssetFilterType(value) {
  if (value === undefined || value === null || value === '' || value === 'all') {
    return 'all'
  }

  return normalizeAssetType(value)
}

function normalizeAssetVisibility(value, fallback = 'private') {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  const visibility = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (ASSET_VISIBILITIES.has(visibility)) {
    return visibility
  }

  throw badRequest('素材公开范围不合法')
}

function normalizeAssetFilterVisibility(value) {
  if (value === undefined || value === null || value === '' || value === 'all') {
    return 'all'
  }

  return normalizeAssetVisibility(value)
}

function normalizeOptionalCourseId(value) {
  if (value === undefined || value === null || value === '') {
    return null
  }

  return normalizeCourseId(value)
}

function normalizeAssetTitle(value) {
  const assetTitle = typeof value === 'string' ? value.trim() : ''
  if (!assetTitle) {
    throw badRequest('素材标题不能为空')
  }

  if (assetTitle.length > 200) {
    throw badRequest('素材标题不能超过200个字符')
  }

  return assetTitle
}

function normalizeAssetContent(value, required = false) {
  const assetContent = typeof value === 'string' ? value.trim() : ''
  if (required && !assetContent) {
    throw badRequest('素材内容不能为空')
  }

  if (assetContent.length > 5000) {
    throw badRequest('素材内容不能超过5000个字符')
  }

  return assetContent
}

function normalizePrepId(value) {
  const prepId = Number(value)
  if (!Number.isInteger(prepId) || prepId <= 0) {
    throw badRequest('备课单ID不合法')
  }

  return prepId
}

function normalizePrepTitle(value) {
  const title = typeof value === 'string' ? value.trim() : ''
  if (!title) {
    throw badRequest('备课单标题不能为空')
  }

  if (title.length > 200) {
    throw badRequest('备课单标题不能超过200个字')
  }

  return title
}

function normalizePrepStatus(value, { allowArchived = true } = {}) {
  const status = typeof value === 'string' ? value.trim().toLowerCase() : ''

  if (!PREP_STATUSES.has(status)) {
    throw badRequest('备课单状态不合法')
  }

  if (!allowArchived && status === 'archived') {
    throw badRequest('当前操作不支持归档状态')
  }

  return status
}

function normalizePrepFilterStatus(value) {
  if (value === undefined || value === null || value === '' || value === 'all') {
    return 'all'
  }

  return normalizePrepStatus(value)
}

function normalizePrepText(value, label) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (text.length > 5000) {
    throw badRequest(`${label}不能超过5000个字`)
  }

  return text
}

function normalizePrepPayload(payload, { allowArchived = false } = {}) {
  const body = payload && typeof payload === 'object' ? payload : {}

  return {
    courseId: normalizeCourseId(body.courseId),
    title: normalizePrepTitle(body.title),
    status: normalizePrepStatus(body.status || 'draft', { allowArchived }),
    teachingContent: normalizePrepText(body.teachingContent, '教学内容'),
  }
}

function extractFileFormat(fileName, fallback = '') {
  const extension = path.extname(String(fileName || '')).replace('.', '').trim().toUpperCase()
  return extension || fallback
}

function normalizeAttachmentId(value) {
  const attachmentId = Number(value)
  if (!Number.isInteger(attachmentId) || attachmentId <= 0) {
    throw badRequest('附件 ID 不合法')
  }

  return attachmentId
}

function normalizeAssetIdList(value) {
  const source = Array.isArray(value) ? value : [value]
  const ids = source
    .flatMap((item) => {
      if (Array.isArray(item)) {
        return item
      }

      if (typeof item === 'string' && item.includes(',')) {
        return item.split(',')
      }

      return [item]
    })
    .filter((item) => item !== undefined && item !== null && item !== '')
    .map((item) => normalizeAssetId(item))

  return [...new Set(ids)]
}

function buildResourcePreviewUrl(type, resourceId) {
  return type === 'material' ? `/portal/materials/${resourceId}/download` : `/portal/videos/${resourceId}/play`
}

function buildAssetPreviewUrl(assetId) {
  return `/portal/assets/${assetId}/file`
}

function buildPrepAttachmentDownloadUrl(attachmentId) {
  return `/teacher/preps/attachments/${attachmentId}/file`
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

function mapTeacherPrepItem(item) {
  return {
    id: Number(item.id),
    teacherId: Number(item.teacherId || 0),
    courseId: Number(item.courseId || 0),
    courseName: item.courseName,
    title: item.title,
    teachingContent: item.teachingContent || '',
    status: item.status,
    statusLabel: getPrepStatusLabel(item.status),
    createTime: item.createTime,
    updateTime: item.updateTime,
    attachmentCount: Array.isArray(item.attachments) ? item.attachments.length : Number(item.attachmentCount || 0),
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
  }
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

function mapMaterialResourceItem(item) {
  return {
    id: item.id,
    type: 'material',
    title: item.title,
    courseId: Number(item.courseId || 0),
    courseName: item.courseName,
    description: item.description || '',
    fileName: item.fileName || item.title,
    fileSize: Number(item.fileSize || 0),
    format: extractFileFormat(item.fileName, String(item.materialType || 'DOCUMENT').toUpperCase()),
    duration: null,
    uploadTime: item.uploadTime,
    interactionCount: Number(item.downloadCount || 0),
    previewUrl: buildResourcePreviewUrl('material', item.id),
    sortTime: item.sortTime,
  }
}

function mapVideoResourceItem(item) {
  return {
    id: item.id,
    type: 'video',
    title: item.title,
    courseId: Number(item.courseId || 0),
    courseName: item.courseName,
    description: item.description || '',
    fileName: item.fileName || item.title,
    fileSize: Number(item.fileSize || 0),
    format: extractFileFormat(item.videoPath, 'VIDEO'),
    duration: item.duration === null || item.duration === undefined ? null : Number(item.duration),
    uploadTime: item.uploadTime,
    interactionCount: Number(item.playCount || 0),
    previewUrl: buildResourcePreviewUrl('video', item.id),
    sortTime: item.sortTime,
  }
}


function getUploadFile(files, fieldName) {
  if (!files || typeof files !== 'object') {
    return null
  }

  const fileList = files[fieldName]
  if (!Array.isArray(fileList) || fileList.length === 0) {
    return null
  }

  return fileList[0]
}

async function cleanupUploadedFiles(filePaths) {
  await Promise.all(filePaths.filter(Boolean).map((filePath) => cleanupUploadedFile(filePath)))
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

function buildStoredFilePath(filePath) {
  const normalizedPath = path.normalize(filePath)
  if (normalizedPath.startsWith(`${projectRoot}${path.sep}`)) {
    return path.relative(projectRoot, normalizedPath).replace(/\\/g, '/')
  }

  return normalizedPath.replace(/\\/g, '/')
}

async function cleanupUploadedFile(filePath) {
  if (!filePath) {
    return
  }

  try {
    await fs.unlink(filePath)
  } catch {
    // ignore cleanup failure
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function resolveStoredFilePath(storedPath) {
  const rawPath = String(storedPath || '').trim()
  if (!rawPath) {
    return null
  }

  const normalizedPath = rawPath.replace(/\\/g, path.sep)
  const relativePath = normalizedPath.replace(/^[/\\]+/, '')
  const candidates = path.isAbsolute(normalizedPath)
    ? [path.normalize(normalizedPath)]
    : [path.resolve(projectRoot, relativePath), path.resolve(process.cwd(), relativePath)]

  for (const candidate of [...new Set(candidates)]) {
    if (await fileExists(candidate)) {
      return candidate
    }
  }

  return null
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

async function ensureAssetLibraryVisibilityReady() {
  await ensureAssetLibraryReady()

  const [rows] = await pool.query(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'asset_library'
       AND COLUMN_NAME = 'visibility'
     LIMIT 1`,
  )

  if (!rows.length) {
    throw badRequest('当前数据库缺少素材公开范围字段，请先执行教师中心简化升级 SQL')
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

async function hasTeachingPrepAttachmentReady() {
  const [rows] = await pool.query(
    `SELECT 1
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'teaching_prep_attachment'
     LIMIT 1`,
  )

  return rows.length > 0
}

async function ensureTeachingPrepAttachmentReady() {
  if (!(await hasTeachingPrepAttachmentReady())) {
    throw badRequest('当前备课单附件表尚未初始化，请先执行教师中心简化升级 SQL')
  }
}

async function getTeacherProfile(teacherId) {
  const [rows] = await pool.query(
    `SELECT teacher_id AS id,
            username AS username,
            COALESCE(NULLIF(teacher_name, ''), username, '未署名教师') AS name
     FROM teacher_user
     WHERE teacher_id = ? AND status = 1
     LIMIT 1`,
    [teacherId],
  )

  if (!rows.length) {
    throw notFound('教师账号不存在或不可用')
  }

  return rows[0]
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

function normalizeTeacherName(value) {
  const teacherName = typeof value === 'string' ? value.trim() : ''

  if (!teacherName) {
    throw badRequest('教师姓名不能为空')
  }

  if (teacherName.length > 50) {
    throw badRequest('教师姓名不能超过50个字符')
  }

  return teacherName
}

function normalizeTeacherGender(value) {
  if (value === '男' || value === '女' || value === '未知') {
    return value
  }

  throw badRequest('性别参数不合法')
}

function normalizeTeacherCollegeId(value) {
  const collegeId = Number(value)

  if (!Number.isInteger(collegeId) || collegeId <= 0) {
    throw badRequest('所属学院不合法')
  }

  return collegeId
}

function normalizeTeacherOptionalEmail(value) {
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

function normalizeTeacherOptionalProfile(value) {
  const profile = typeof value === 'string' ? value.trim() : ''

  if (!profile) {
    return null
  }

  if (profile.length > 2000) {
    throw badRequest('个人简介不能超过2000个字符')
  }

  return profile
}

async function ensureTeacherCollegeExists(collegeId) {
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

async function getTeacherCollegeOptions() {
  const [rows] = await pool.query(
    `SELECT college_id AS id, college_name AS name
     FROM college
     ORDER BY college_name ASC`,
  )

  return rows.map((item) => ({
    id: Number(item.id),
    name: item.name,
  }))
}

export async function getTeacherProfileDetail(teacherId) {
  const [rows] = await pool.query(
    `SELECT t.teacher_id AS id,
            t.username AS username,
            COALESCE(NULLIF(t.teacher_name, ''), t.username, '未署名教师') AS teacherName,
            COALESCE(NULLIF(t.gender, ''), '未知') AS gender,
            COALESCE(t.email, '') AS email,
            t.college_id AS collegeId,
            COALESCE(c.college_name, '') AS collegeName,
            COALESCE(t.profile, '') AS profile
     FROM teacher_user t
     LEFT JOIN college c ON c.college_id = t.college_id
     WHERE t.teacher_id = ? AND t.status = 1
     LIMIT 1`,
    [teacherId],
  )

  if (!rows.length) {
    throw notFound('教师账号不存在或不可用')
  }

  const profile = rows[0]
  const colleges = await getTeacherCollegeOptions()

  logger.info('teacher_profile_detail_loaded', {
    teacherId,
    collegeId: profile.collegeId ? Number(profile.collegeId) : null,
  })

  return {
    profile: {
      id: Number(profile.id),
      username: profile.username,
      teacherName: profile.teacherName,
      gender: profile.gender,
      email: profile.email || '',
      collegeId: profile.collegeId ? Number(profile.collegeId) : null,
      collegeName: profile.collegeName || '',
      profile: profile.profile || '',
    },
    options: {
      genders: ['男', '女', '未知'],
      colleges,
    },
  }
}

export async function updateTeacherProfileInfo({ teacherId, payload }) {
  await getTeacherProfile(teacherId)

  const username = normalizeTeacherUsername(payload.username)
  const teacherName = normalizeTeacherName(payload.teacherName)
  const gender = normalizeTeacherGender(payload.gender)
  const collegeId = normalizeTeacherCollegeId(payload.collegeId)
  const email = normalizeTeacherOptionalEmail(payload.email)
  const profile = normalizeTeacherOptionalProfile(payload.profile)

  await ensureTeacherCollegeExists(collegeId)

  const [existingRows] = await pool.query(
    `SELECT teacher_id AS id
     FROM teacher_user
     WHERE username = ? AND teacher_id <> ?
     LIMIT 1`,
    [username, teacherId],
  )

  if (existingRows.length) {
    throw badRequest('用户名已存在')
  }

  await pool.query(
    `UPDATE teacher_user
     SET username = ?,
         teacher_name = ?,
         gender = ?,
         email = ?,
         college_id = ?,
         profile = ?,
         update_time = CURRENT_TIMESTAMP
     WHERE teacher_id = ? AND status = 1`,
    [username, teacherName, gender, email, collegeId, profile, teacherId],
  )

  const college = await ensureTeacherCollegeExists(collegeId)

  logger.info('teacher_profile_updated', {
    teacherId,
    username,
    collegeId,
  })

  return {
    id: Number(teacherId),
    username,
    teacherName,
    gender,
    email: email || '',
    collegeId,
    collegeName: college.name,
    profile: profile || '',
  }
}

async function getOwnedCourseRow(courseId, teacherId) {
  const [rows] = await pool.query(
    `SELECT course_id AS id, course_name AS name
     FROM course_intro
     WHERE course_id = ? AND teacher_id = ? AND status = 1
     LIMIT 1`,
    [courseId, teacherId],
  )

  if (!rows.length) {
    throw notFound('课程不存在或无权操作')
  }

  return rows[0]
}

async function getOwnedAssetRow(assetId, teacherId) {
  await ensureAssetLibraryVisibilityReady()

  const [rows] = await pool.query(
    `SELECT a.asset_id AS id,
            a.asset_type AS type,
            a.teacher_id AS teacherId,
            a.course_id AS courseId,
            COALESCE(a.visibility, 'private') AS visibility,
            a.asset_title AS title,
            COALESCE(a.asset_description, '') AS description,
            COALESCE(a.asset_content, '') AS content,
            COALESCE(a.file_path, '') AS filePath,
            COALESCE(a.file_name, '') AS fileName,
            COALESCE(a.file_size, 0) AS fileSize,
            DATE_FORMAT(a.create_time, '%Y-%m-%d') AS uploadTime,
            a.create_time AS rawUploadTime,
            COALESCE(c.course_name, '未关联课程') AS courseName
     FROM asset_library a
     LEFT JOIN course_intro c ON c.course_id = a.course_id
     WHERE a.asset_id = ? AND a.teacher_id = ? AND a.status = 1
     LIMIT 1`,
    [assetId, teacherId],
  )

  if (!rows.length) {
    throw notFound('素材不存在或无权操作')
  }

  return rows[0]
}

async function getOwnedPrepRow(prepId, teacherId) {
  await ensureTeachingPrepReady()

  const [rows] = await pool.query(
    `SELECT p.prep_id AS id,
            p.teacher_id AS teacherId,
            p.course_id AS courseId,
            p.prep_title AS title,
            COALESCE(p.teaching_content, '') AS teachingContent,
            p.status AS status,
            DATE_FORMAT(p.create_time, '%Y-%m-%d') AS createTime,
            DATE_FORMAT(p.update_time, '%Y-%m-%d') AS updateTime,
            COALESCE(c.course_name, '未关联课程') AS courseName
     FROM teaching_prep p
     LEFT JOIN course_intro c ON c.course_id = p.course_id
     WHERE p.prep_id = ? AND p.teacher_id = ?
     LIMIT 1`,
    [prepId, teacherId],
  )

  if (!rows.length) {
    throw notFound('备课单不存在或无权操作')
  }

  const prep = rows[0]
  const attachmentMap = await getPrepAttachmentMap([prepId], teacherId)
  const attachments = attachmentMap.get(Number(prepId)) || []

  return {
    ...prep,
    attachments,
    attachmentCount: attachments.length,
  }
}

function inferAttachmentTypeFromMimeType(mimeType, fileName) {
  const rawMimeType = String(mimeType || '').toLowerCase()
  const extension = path.extname(String(fileName || '')).toLowerCase()

  if (rawMimeType.startsWith('image/')) {
    return 'image'
  }

  if (rawMimeType.startsWith('audio/')) {
    return 'audio'
  }

  if (rawMimeType.startsWith('video/')) {
    return 'video'
  }

  if (extension === '.txt' || extension === '.md') {
    return 'text'
  }

  return 'file'
}

function mapPrepAttachmentItem(item) {
  const sourceType = item.sourceType
  const assetId = item.assetId ? Number(item.assetId) : null
  const attachmentId = Number(item.id)
  const fileName = item.fileName || ''
  const mimeType = item.mimeType || ''
  const type = sourceType === 'asset' ? item.assetType || inferAttachmentTypeFromMimeType(mimeType, fileName) : inferAttachmentTypeFromMimeType(mimeType, fileName)

  return {
    id: attachmentId,
    sourceType,
    sourceLabel: sourceType === 'asset' ? '个人素材' : '本地上传',
    assetId,
    type,
    title: item.title || fileName || '未命名附件',
    description: item.description || '',
    content: item.content || '',
    fileName,
    fileSize: Number(item.fileSize || 0),
    mimeType,
    visibility: item.visibility || 'private',
    downloadUrl: sourceType === 'asset' && assetId ? buildAssetPreviewUrl(assetId) : buildPrepAttachmentDownloadUrl(attachmentId),
    uploadTime: item.createTime,
  }
}

async function getPrepAttachmentMap(prepIds, teacherId = null) {
  if (!prepIds.length) {
    return new Map()
  }

  if (!(await hasTeachingPrepAttachmentReady())) {
    return new Map()
  }

  const placeholders = prepIds.map(() => '?').join(', ')
  const params = [...prepIds]
  let ownerSql = ''

  if (teacherId !== null) {
    ownerSql = ' AND p.teacher_id = ?'
    params.push(teacherId)
  }

  const [rows] = await pool.query(
    `SELECT pa.attachment_id AS id,
            pa.prep_id AS prepId,
            pa.source_type AS sourceType,
            pa.asset_id AS assetId,
            COALESCE(a.asset_type, '') AS assetType,
            COALESCE(a.asset_title, pa.file_name, '') AS title,
            COALESCE(a.asset_description, '') AS description,
            COALESCE(a.asset_content, '') AS content,
            COALESCE(a.visibility, 'private') AS visibility,
            COALESCE(a.file_name, pa.file_name, '') AS fileName,
            COALESCE(a.file_size, pa.file_size, 0) AS fileSize,
            COALESCE(pa.mime_type, '') AS mimeType,
            DATE_FORMAT(pa.create_time, '%Y-%m-%d') AS createTime
     FROM teaching_prep_attachment pa
     INNER JOIN teaching_prep p ON p.prep_id = pa.prep_id
     LEFT JOIN asset_library a ON a.asset_id = pa.asset_id
     WHERE pa.status = 1 AND pa.prep_id IN (${placeholders})${ownerSql}
     ORDER BY pa.sort_order ASC, pa.attachment_id ASC`,
    params,
  )

  const attachmentMap = new Map()

  for (const prepId of prepIds) {
    attachmentMap.set(Number(prepId), [])
  }

  for (const row of rows) {
    const prepId = Number(row.prepId || 0)
    if (!attachmentMap.has(prepId)) {
      attachmentMap.set(prepId, [])
    }

    attachmentMap.get(prepId)?.push(mapPrepAttachmentItem(row))
  }

  return attachmentMap
}

async function getOwnedMessageRow(messageId, teacherId) {
  const [rows] = await pool.query(
    `SELECT topic_id AS id, teacher_id AS teacherId, title, content, status, create_time, update_time
     FROM message_topic
     WHERE topic_id = ? AND teacher_id = ?
     LIMIT 1`,
    [messageId, teacherId],
  )

  if (!rows.length) {
    throw notFound('交流主题不存在')
  }

  return rows[0]
}

export async function getTeacherDashboardData(teacherId) {
  const teacher = await getTeacherProfile(teacherId)
  await ensureAssetLibraryVisibilityReady()
  await ensureTeachingPrepReady()

  const [statRows] = await pool.query(
    `SELECT
        (SELECT COUNT(*) FROM course_intro WHERE teacher_id = ? AND status = 1) AS courseCount,
        (SELECT COUNT(*) FROM asset_library WHERE teacher_id = ? AND status = 1) AS assetCount,
        (SELECT COUNT(*) FROM asset_library WHERE teacher_id = ? AND status = 1 AND COALESCE(visibility, 'private') = 'public') AS publicAssetCount,
        (SELECT COUNT(*) FROM teaching_prep WHERE teacher_id = ?) AS prepCount,
        (SELECT COUNT(*) FROM teaching_prep WHERE teacher_id = ? AND status = 'published') AS publishedPrepCount`,
    [teacherId, teacherId, teacherId, teacherId, teacherId],
  )

  const [recentAssets] = await pool.query(
    `SELECT a.asset_id AS id,
            a.asset_type AS type,
            a.asset_title AS title,
            COALESCE(a.visibility, 'private') AS visibility,
            DATE_FORMAT(a.create_time, '%Y-%m-%d') AS uploadDate
     FROM asset_library a
     WHERE a.teacher_id = ? AND a.status = 1
     ORDER BY a.update_time DESC, a.asset_id DESC
     LIMIT 5`,
    [teacherId],
  )

  const [recentPreps] = await pool.query(
    `SELECT p.prep_id AS id,
            p.prep_title AS title,
            p.status AS status,
            COALESCE(c.course_name, '未关联课程') AS courseName,
            DATE_FORMAT(p.update_time, '%Y-%m-%d') AS updateDate
     FROM teaching_prep p
     LEFT JOIN course_intro c ON c.course_id = p.course_id
     WHERE p.teacher_id = ?
     ORDER BY p.update_time DESC, p.prep_id DESC
     LIMIT 5`,
    [teacherId],
  )

  const [courseCoverage] = await pool.query(
    `SELECT c.course_id AS id,
            c.course_name AS name,
            COALESCE(asset_stats.assetCount, 0) AS assetCount,
            COALESCE(prep_stats.prepCount, 0) AS prepCount
     FROM course_intro c
     LEFT JOIN (
       SELECT course_id, COUNT(*) AS assetCount
       FROM asset_library
       WHERE teacher_id = ? AND status = 1
       GROUP BY course_id
     ) asset_stats ON asset_stats.course_id = c.course_id
     LEFT JOIN (
       SELECT course_id, COUNT(*) AS prepCount
       FROM teaching_prep
       WHERE teacher_id = ?
       GROUP BY course_id
     ) prep_stats ON prep_stats.course_id = c.course_id
     WHERE c.teacher_id = ? AND c.status = 1
     ORDER BY (COALESCE(asset_stats.assetCount, 0) + COALESCE(prep_stats.prepCount, 0) * 2) DESC,
              c.update_time DESC,
              c.course_id DESC
     LIMIT 3`,
    [teacherId, teacherId, teacherId],
  )

  const [weeklyRows] = await pool.query(
    `SELECT
        (SELECT COUNT(*) FROM asset_library WHERE teacher_id = ? AND status = 1 AND create_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS assetCount,
        (SELECT COUNT(*) FROM teaching_prep WHERE teacher_id = ? AND update_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS prepCount,
        (SELECT COUNT(*) FROM asset_library WHERE teacher_id = ? AND status = 1 AND COALESCE(visibility, 'private') = 'public' AND update_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS publicAssetCount`,
    [teacherId, teacherId, teacherId],
  )

  const statsRow = statRows[0] || {
    courseCount: 0,
    assetCount: 0,
    publicAssetCount: 0,
    prepCount: 0,
    publishedPrepCount: 0,
  }
  const weeklyRow = weeklyRows[0] || {
    assetCount: 0,
    prepCount: 0,
    publicAssetCount: 0,
  }

  logger.info('teacher_dashboard_loaded', {
    teacherId,
    courseCount: Number(statsRow.courseCount || 0),
    assetCount: Number(statsRow.assetCount || 0),
    publicAssetCount: Number(statsRow.publicAssetCount || 0),
    prepCount: Number(statsRow.prepCount || 0),
    recentAssetCount: recentAssets.length,
    recentPrepCount: recentPreps.length,
  })

  return {
    profile: {
      id: teacher.id,
      name: teacher.name,
      username: teacher.username,
    },
    stats: {
      courseCount: Number(statsRow.courseCount || 0),
      assetCount: Number(statsRow.assetCount || 0),
      publicAssetCount: Number(statsRow.publicAssetCount || 0),
      prepCount: Number(statsRow.prepCount || 0),
      publishedPrepCount: Number(statsRow.publishedPrepCount || 0),
    },
    recentAssets: recentAssets.map((item) => ({
      id: Number(item.id),
      type: item.type,
      title: item.title,
      visibility: item.visibility,
      uploadDate: item.uploadDate,
    })),
    recentPreps: recentPreps.map((item) => ({
      id: Number(item.id),
      title: item.title,
      status: item.status,
      statusLabel: getPrepStatusLabel(item.status),
      courseName: item.courseName,
      updateDate: item.updateDate,
    })),
    courseCoverage: courseCoverage.map((item) => ({
      ...item,
      assetCount: Number(item.assetCount || 0),
      prepCount: Number(item.prepCount || 0),
    })),
    weeklyActivity: {
      assetCount: Number(weeklyRow.assetCount || 0),
      prepCount: Number(weeklyRow.prepCount || 0),
      publicAssetCount: Number(weeklyRow.publicAssetCount || 0),
    },
  }
}

export async function getTeacherCourseOptions(teacherId) {
  await getTeacherProfile(teacherId)

  const [rows] = await pool.query(
    `SELECT course_id AS id, course_name AS name
     FROM course_intro
     WHERE teacher_id = ? AND status = 1
     ORDER BY update_time DESC, course_id DESC`,
    [teacherId],
  )

  logger.info('teacher_course_options_loaded', {
    teacherId,
    courseCount: rows.length,
  })

  return rows
}

export async function getTeacherPrepList({ teacherId, query }) {
  await getTeacherProfile(teacherId)
  await ensureTeachingPrepReady()

  const keyword = normalizeKeyword(query.keyword)
  const courseId = query.courseId === undefined || query.courseId === null || query.courseId === '' ? null : normalizeCourseId(query.courseId)
  const status = normalizePrepFilterStatus(query.status)
  const requestedPage = normalizePageNumber(query.page)
  const pageSize = normalizePageSize(query.pageSize)
  const params = [teacherId]
  let whereSql = 'p.teacher_id = ?'

  if (keyword) {
    const keywordPattern = `%${keyword}%`
    whereSql += ` AND (
      p.prep_title LIKE ?
      OR COALESCE(c.course_name, '') LIKE ?
      OR COALESCE(p.teaching_content, '') LIKE ?
    )`
    params.push(keywordPattern, keywordPattern, keywordPattern)
  }

  if (courseId) {
    whereSql += ' AND p.course_id = ?'
    params.push(courseId)
  }

  if (status !== 'all') {
    whereSql += ' AND p.status = ?'
    params.push(status)
  }

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM teaching_prep p
     LEFT JOIN course_intro c ON c.course_id = p.course_id
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
            COALESCE(p.teaching_content, '') AS teachingContent,
            p.status AS status,
            DATE_FORMAT(p.create_time, '%Y-%m-%d') AS createTime,
            DATE_FORMAT(p.update_time, '%Y-%m-%d') AS updateTime,
            COALESCE(c.course_name, '未关联课程') AS courseName
     FROM teaching_prep p
     LEFT JOIN course_intro c ON c.course_id = p.course_id
     WHERE ${whereSql}
     ORDER BY p.update_time DESC, p.prep_id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  )

  const [statsRows] = await pool.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END), 0) AS draftCount,
            COALESCE(SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END), 0) AS publishedCount,
            COUNT(DISTINCT course_id) AS courseCount
     FROM teaching_prep
     WHERE teacher_id = ?`,
    [teacherId],
  )

  const statsRow = statsRows[0] || {
    total: 0,
    draftCount: 0,
    publishedCount: 0,
    courseCount: 0,
  }
  const attachmentMap = await getPrepAttachmentMap(
    listRows.map((item) => Number(item.id)),
    teacherId,
  )

  logger.info('teacher_prep_list_loaded', {
    teacherId,
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
      courseCount: Number(statsRow.courseCount || 0),
    },
    list: listRows.map((item) =>
      mapTeacherPrepItem({
        ...item,
        attachments: attachmentMap.get(Number(item.id)) || [],
      }),
    ),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
    filters: {
      courses: await getTeacherCourseOptions(teacherId),
    },
  }
}

export async function createTeacherPrep({ teacherId, payload }) {
  await getTeacherProfile(teacherId)
  await ensureTeachingPrepReady()

  const prep = normalizePrepPayload(payload, { allowArchived: false })
  await getOwnedCourseRow(prep.courseId, teacherId)

  const [result] = await pool.query(
    `INSERT INTO teaching_prep (
       teacher_id,
       course_id,
       prep_title,
       teaching_content,
       status
     ) VALUES (?, ?, ?, ?, ?)`,
    [
      teacherId,
      prep.courseId,
      prep.title,
      prep.teachingContent || null,
      prep.status,
    ],
  )

  const prepId = Number(result.insertId || 0)

  logger.info('teacher_prep_created', {
    teacherId,
    prepId,
    courseId: prep.courseId,
    status: prep.status,
  })

  return mapTeacherPrepItem(await getOwnedPrepRow(prepId, teacherId))
}

export async function updateTeacherPrep({ teacherId, prepId, payload }) {
  await getTeacherProfile(teacherId)
  await ensureTeachingPrepReady()

  const normalizedPrepId = normalizePrepId(prepId)
  await getOwnedPrepRow(normalizedPrepId, teacherId)

  const prep = normalizePrepPayload(payload, { allowArchived: false })
  await getOwnedCourseRow(prep.courseId, teacherId)

  await pool.query(
    `UPDATE teaching_prep
     SET course_id = ?,
         prep_title = ?,
         teaching_content = ?,
         status = ?,
         update_time = CURRENT_TIMESTAMP
     WHERE prep_id = ? AND teacher_id = ?`,
    [
      prep.courseId,
      prep.title,
      prep.teachingContent || null,
      prep.status,
      normalizedPrepId,
      teacherId,
    ],
  )

  logger.info('teacher_prep_updated', {
    teacherId,
    prepId: normalizedPrepId,
    courseId: prep.courseId,
    status: prep.status,
  })

  return mapTeacherPrepItem(await getOwnedPrepRow(normalizedPrepId, teacherId))
}

export async function deleteTeacherPrep({ teacherId, prepId }) {
  await getTeacherProfile(teacherId)
  await ensureTeachingPrepReady()

  const normalizedPrepId = normalizePrepId(prepId)
  const prep = await getOwnedPrepRow(normalizedPrepId, teacherId)

  await pool.query(
    `DELETE FROM teaching_prep
     WHERE prep_id = ? AND teacher_id = ?`,
    [normalizedPrepId, teacherId],
  )

  logger.info('teacher_prep_deleted', {
    teacherId,
    prepId: normalizedPrepId,
  })

  return {
    id: normalizedPrepId,
    title: prep.title,
  }
}

export async function getTeacherAssetList({ teacherId, query }) {
  await getTeacherProfile(teacherId)
  await ensureAssetLibraryVisibilityReady()

  const keyword = normalizeKeyword(query.keyword)
  const requestedPage = normalizePageNumber(query.page)
  const pageSize = normalizePageSize(query.pageSize)
  const type = normalizeAssetFilterType(query.type)
  const visibility = normalizeAssetFilterVisibility(query.visibility)
  const params = [teacherId]
  let whereSql = 'a.teacher_id = ? AND a.status = 1'

  if (type !== 'all') {
    whereSql += ' AND a.asset_type = ?'
    params.push(type)
  }

  if (visibility !== 'all') {
    whereSql += ' AND COALESCE(a.visibility, \'private\') = ?'
    params.push(visibility)
  }

  if (keyword) {
    const keywordPattern = `%${keyword}%`
    whereSql += ` AND (
      a.asset_title LIKE ?
      OR COALESCE(a.asset_description, '') LIKE ?
      OR COALESCE(a.asset_content, '') LIKE ?
      OR COALESCE(a.file_name, '') LIKE ?
    )`
    params.push(keywordPattern, keywordPattern, keywordPattern, keywordPattern)
  }

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM asset_library a
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
            a.course_id AS courseId,
            COALESCE(a.visibility, 'private') AS visibility,
            a.asset_title AS title,
            COALESCE(a.asset_description, '') AS description,
            COALESCE(a.asset_content, '') AS content,
            COALESCE(a.file_name, '') AS fileName,
            COALESCE(a.file_size, 0) AS fileSize,
            DATE_FORMAT(a.create_time, '%Y-%m-%d') AS uploadTime,
            COALESCE(c.course_name, '未关联课程') AS courseName
     FROM asset_library a
     LEFT JOIN course_intro c ON c.course_id = a.course_id
     WHERE ${whereSql}
     ORDER BY a.update_time DESC, a.asset_id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  )

  const [statsRows] = await pool.query(
    `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN COALESCE(visibility, 'private') = 'public' THEN 1 ELSE 0 END) AS publicCount,
        SUM(CASE WHEN COALESCE(visibility, 'private') = 'private' THEN 1 ELSE 0 END) AS privateCount,
        SUM(CASE WHEN asset_type = 'image' THEN 1 ELSE 0 END) AS imageCount,
        SUM(CASE WHEN asset_type = 'audio' THEN 1 ELSE 0 END) AS audioCount,
        SUM(CASE WHEN asset_type = 'video' THEN 1 ELSE 0 END) AS videoCount,
        SUM(CASE WHEN asset_type IN ('text', 'question', 'template') THEN 1 ELSE 0 END) AS contentCount
     FROM asset_library
     WHERE teacher_id = ? AND status = 1`,
    [teacherId],
  )

  const statsRow = statsRows[0] || {
    total: 0,
    publicCount: 0,
    privateCount: 0,
    imageCount: 0,
    audioCount: 0,
    videoCount: 0,
    contentCount: 0,
  }

  logger.info('teacher_asset_list_loaded', {
    teacherId,
    keyword,
    type,
    visibility,
    page,
    pageSize,
    total,
    resultCount: listRows.length,
  })

  return {
    stats: {
      total: Number(statsRow.total || 0),
      publicCount: Number(statsRow.publicCount || 0),
      privateCount: Number(statsRow.privateCount || 0),
      imageCount: Number(statsRow.imageCount || 0),
      audioCount: Number(statsRow.audioCount || 0),
      videoCount: Number(statsRow.videoCount || 0),
      contentCount: Number(statsRow.contentCount || 0),
    },
    list: listRows.map((item) => ({
      id: Number(item.id),
      type: item.type,
      courseId: Number(item.courseId || 0),
      courseName: item.courseName,
      visibility: item.visibility,
      title: item.title,
      description: item.description || '',
      content: item.content || '',
      fileName: item.fileName || '',
      fileSize: Number(item.fileSize || 0),
      uploadTime: item.uploadTime,
      previewUrl: ASSET_FILE_TYPES.has(item.type) ? buildAssetPreviewUrl(Number(item.id)) : '',
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
    filters: {},
  }
}

export async function createTeacherAsset({ teacherId, payload, file }) {
  await getTeacherProfile(teacherId)
  await ensureAssetLibraryVisibilityReady()

  try {
    const type = normalizeAssetType(payload.type)
    const courseId = normalizeOptionalCourseId(payload.courseId)
    const visibility = normalizeAssetVisibility(payload.visibility)
    const title = normalizeAssetTitle(payload.title)
    const description = normalizeDescription(payload.description, '素材说明')
    const content = normalizeAssetContent(payload.content, ASSET_CONTENT_TYPES.has(type))
    const course = courseId ? await getOwnedCourseRow(courseId, teacherId) : null

    if (ASSET_FILE_TYPES.has(type) && !file) {
      if (type === 'image') {
        throw badRequest('图片素材必须上传文件')
      }

      if (type === 'video') {
        throw badRequest('视频素材必须上传文件')
      }

      throw badRequest('音频素材必须上传文件')
    }

    if (ASSET_CONTENT_TYPES.has(type) && file) {
      throw badRequest('当前素材类型不需要上传文件')
    }

    const storedPath = file ? buildStoredFilePath(file.path) : null
    const [result] = await pool.query(
      `INSERT INTO asset_library (
        asset_type,
        teacher_id,
        course_id,
        visibility,
        asset_title,
        asset_description,
        asset_content,
        file_path,
        file_name,
        file_size,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [type, teacherId, courseId, visibility, title, description || null, content || null, storedPath, file?.originalname || null, Number(file?.size || 0)],
    )

    logger.info('teacher_asset_created', {
      teacherId,
      assetId: Number(result.insertId || 0),
      type,
      courseId,
      visibility,
    })

    return {
      id: Number(result.insertId || 0),
      type,
      title,
      courseId,
      courseName: course?.name || '',
      visibility,
      description,
      content,
      fileName: file?.originalname || '',
      fileSize: Number(file?.size || 0),
      previewUrl: file ? buildAssetPreviewUrl(Number(result.insertId || 0)) : '',
    }
  } catch (error) {
    if (file?.path) {
      await cleanupUploadedFile(file.path)
    }
    throw error
  }
}

export async function getTeacherAssetDetail({ teacherId, assetId }) {
  await getTeacherProfile(teacherId)

  const normalizedAssetId = normalizeAssetId(assetId)
  const asset = await getOwnedAssetRow(normalizedAssetId, teacherId)

  logger.info('teacher_asset_detail_loaded', {
    teacherId,
    assetId: normalizedAssetId,
    courseId: Number(asset.courseId || 0),
  })

  return {
    id: Number(asset.id),
    type: asset.type,
    courseId: Number(asset.courseId || 0),
    courseName: asset.courseName,
    visibility: asset.visibility || 'private',
    title: asset.title,
    description: asset.description || '',
    content: asset.content || '',
    fileName: asset.fileName || '',
    fileSize: Number(asset.fileSize || 0),
    uploadTime: asset.uploadTime,
    previewUrl: ASSET_FILE_TYPES.has(asset.type) ? buildAssetPreviewUrl(Number(asset.id)) : '',
  }
}

export async function updateTeacherAsset({ teacherId, assetId, payload }) {
  await getTeacherProfile(teacherId)

  const normalizedAssetId = normalizeAssetId(assetId)
  const asset = await getOwnedAssetRow(normalizedAssetId, teacherId)
  const title = normalizeAssetTitle(payload.title)
  const courseId = normalizeOptionalCourseId(payload.courseId)
  const visibility = normalizeAssetVisibility(payload.visibility, asset.visibility || 'private')
  const description = normalizeDescription(payload.description, '素材说明')
  const content = normalizeAssetContent(payload.content, ASSET_CONTENT_TYPES.has(asset.type))
  const course = courseId ? await getOwnedCourseRow(courseId, teacherId) : null

  await pool.query(
     `UPDATE asset_library
     SET course_id = ?,
         visibility = ?,
         asset_title = ?,
         asset_description = ?,
         asset_content = ?,
         update_time = CURRENT_TIMESTAMP
     WHERE asset_id = ? AND teacher_id = ? AND status = 1`,
    [courseId, visibility, title, description || null, ASSET_CONTENT_TYPES.has(asset.type) ? content || null : asset.content || null, normalizedAssetId, teacherId],
  )

  logger.info('teacher_asset_updated', {
    teacherId,
    assetId: normalizedAssetId,
    courseId,
    visibility,
  })

  return {
    id: normalizedAssetId,
    type: asset.type,
    title,
    courseId,
    courseName: course?.name || '',
    visibility,
    description,
    content: ASSET_CONTENT_TYPES.has(asset.type) ? content : asset.content || '',
  }
}

export async function deleteTeacherAsset({ teacherId, assetId }) {
  await getTeacherProfile(teacherId)

  const normalizedAssetId = normalizeAssetId(assetId)
  const asset = await getOwnedAssetRow(normalizedAssetId, teacherId)

  await pool.query(
    `UPDATE asset_library
     SET status = 0, update_time = CURRENT_TIMESTAMP
     WHERE asset_id = ? AND teacher_id = ? AND status = 1`,
    [normalizedAssetId, teacherId],
  )

  logger.info('teacher_asset_deleted', {
    teacherId,
    assetId: normalizedAssetId,
    courseId: Number(asset.courseId || 0),
  })

  return {
    id: normalizedAssetId,
    type: asset.type,
    title: asset.title,
  }
}

async function getOwnedPrepAttachmentRow(attachmentId, teacherId) {
  await ensureTeachingPrepAttachmentReady()

  const [rows] = await pool.query(
    `SELECT pa.attachment_id AS id,
            pa.prep_id AS prepId,
            pa.source_type AS sourceType,
            pa.asset_id AS assetId,
            COALESCE(pa.file_path, '') AS filePath,
            COALESCE(pa.file_name, '') AS fileName,
            COALESCE(pa.mime_type, '') AS mimeType
     FROM teaching_prep_attachment pa
     INNER JOIN teaching_prep p ON p.prep_id = pa.prep_id
     WHERE pa.attachment_id = ? AND pa.status = 1 AND p.teacher_id = ?
     LIMIT 1`,
    [attachmentId, teacherId],
  )

  if (!rows.length) {
    throw notFound('备课附件不存在或无权操作')
  }

  return rows[0]
}

export async function addTeacherPrepAssetAttachments({ teacherId, prepId, payload }) {
  await getTeacherProfile(teacherId)
  await ensureTeachingPrepAttachmentReady()

  const normalizedPrepId = normalizePrepId(prepId)
  await getOwnedPrepRow(normalizedPrepId, teacherId)

  const assetIds = normalizeAssetIdList(payload.assetIds)
  if (!assetIds.length) {
    throw badRequest('请先选择要关联的个人素材')
  }

  const placeholders = assetIds.map(() => '?').join(', ')
  const [assetRows] = await pool.query(
    `SELECT asset_id AS id
     FROM asset_library
     WHERE teacher_id = ? AND status = 1 AND asset_id IN (${placeholders})`,
    [teacherId, ...assetIds],
  )

  if (assetRows.length !== assetIds.length) {
    throw notFound('部分个人素材不存在或无权操作')
  }

  const [existingRows] = await pool.query(
    `SELECT asset_id AS assetId
     FROM teaching_prep_attachment
     WHERE prep_id = ? AND source_type = 'asset' AND status = 1 AND asset_id IN (${placeholders})`,
    [normalizedPrepId, ...assetIds],
  )
  const existingAssetIds = new Set(existingRows.map((item) => Number(item.assetId || 0)))
  const pendingAssetIds = assetIds.filter((assetId) => !existingAssetIds.has(assetId))

  if (pendingAssetIds.length) {
    const [sortRows] = await pool.query(
      `SELECT COALESCE(MAX(sort_order), 0) AS maxSortOrder
       FROM teaching_prep_attachment
       WHERE prep_id = ?`,
      [normalizedPrepId],
    )
    let nextSortOrder = Number(sortRows[0]?.maxSortOrder || 0) + 1

    for (const assetId of pendingAssetIds) {
      await pool.query(
        `INSERT INTO teaching_prep_attachment (
          prep_id,
          source_type,
          asset_id,
          sort_order,
          status
        ) VALUES (?, 'asset', ?, ?, 1)`,
        [normalizedPrepId, assetId, nextSortOrder],
      )
      nextSortOrder += 1
    }
  }

  const prep = await getOwnedPrepRow(normalizedPrepId, teacherId)

  logger.info('teacher_prep_asset_attachments_added', {
    teacherId,
    prepId: normalizedPrepId,
    assetCount: pendingAssetIds.length,
  })

  return {
    prepId: normalizedPrepId,
    attachmentCount: prep.attachments.length,
    attachments: prep.attachments,
  }
}

export async function addTeacherPrepUploadAttachments({ teacherId, prepId, files }) {
  await getTeacherProfile(teacherId)
  await ensureTeachingPrepAttachmentReady()

  const normalizedPrepId = normalizePrepId(prepId)
  await getOwnedPrepRow(normalizedPrepId, teacherId)

  const uploadFiles = Array.isArray(files) ? files : []
  if (!uploadFiles.length) {
    throw badRequest('请先选择要上传的备课附件')
  }

  try {
    const [sortRows] = await pool.query(
      `SELECT COALESCE(MAX(sort_order), 0) AS maxSortOrder
       FROM teaching_prep_attachment
       WHERE prep_id = ?`,
      [normalizedPrepId],
    )
    let nextSortOrder = Number(sortRows[0]?.maxSortOrder || 0) + 1

    for (const file of uploadFiles) {
      await pool.query(
        `INSERT INTO teaching_prep_attachment (
          prep_id,
          source_type,
          file_path,
          file_name,
          file_size,
          mime_type,
          sort_order,
          status
        ) VALUES (?, 'upload', ?, ?, ?, ?, ?, 1)`,
        [normalizedPrepId, buildStoredFilePath(file.path), file.originalname, Number(file.size || 0), file.mimetype || null, nextSortOrder],
      )
      nextSortOrder += 1
    }

    const prep = await getOwnedPrepRow(normalizedPrepId, teacherId)

    logger.info('teacher_prep_upload_attachments_added', {
      teacherId,
      prepId: normalizedPrepId,
      fileCount: uploadFiles.length,
    })

    return {
      prepId: normalizedPrepId,
      attachmentCount: prep.attachments.length,
      attachments: prep.attachments,
    }
  } catch (error) {
    await cleanupUploadedFiles(uploadFiles.map((file) => file.path))
    throw error
  }
}

export async function deleteTeacherPrepAttachment({ teacherId, prepId, attachmentId }) {
  await getTeacherProfile(teacherId)
  await ensureTeachingPrepAttachmentReady()

  const normalizedPrepId = normalizePrepId(prepId)
  const normalizedAttachmentId = normalizeAttachmentId(attachmentId)
  const attachment = await getOwnedPrepAttachmentRow(normalizedAttachmentId, teacherId)

  if (Number(attachment.prepId || 0) !== normalizedPrepId) {
    throw notFound('备课附件不存在或无权操作')
  }

  await pool.query(
    `UPDATE teaching_prep_attachment
     SET status = 0, update_time = CURRENT_TIMESTAMP
     WHERE attachment_id = ?`,
    [normalizedAttachmentId],
  )

  if (attachment.sourceType === 'upload' && attachment.filePath) {
    const resolvedPath = await resolveStoredFilePath(attachment.filePath)
    if (resolvedPath) {
      await cleanupUploadedFile(resolvedPath)
    }
  }

  logger.info('teacher_prep_attachment_deleted', {
    teacherId,
    prepId: normalizedPrepId,
    attachmentId: normalizedAttachmentId,
    sourceType: attachment.sourceType,
  })

  return {
    id: normalizedAttachmentId,
    prepId: normalizedPrepId,
    sourceType: attachment.sourceType,
  }
}

export async function getTeacherPrepAttachmentFileData({ teacherId, attachmentId }) {
  await getTeacherProfile(teacherId)

  const normalizedAttachmentId = normalizeAttachmentId(attachmentId)
  const attachment = await getOwnedPrepAttachmentRow(normalizedAttachmentId, teacherId)

  if (attachment.sourceType === 'asset' && attachment.assetId) {
    const asset = await getOwnedAssetRow(Number(attachment.assetId), teacherId)
    const resolvedPath = await resolveStoredFilePath(asset.filePath)

    if (!resolvedPath) {
      throw notFound('附件文件不存在')
    }

    return {
      filePath: resolvedPath,
      fileName: asset.fileName || path.basename(resolvedPath),
    }
  }

  const resolvedPath = await resolveStoredFilePath(attachment.filePath)
  if (!resolvedPath) {
    throw notFound('附件文件不存在')
  }

  return {
    filePath: resolvedPath,
    fileName: attachment.fileName || path.basename(resolvedPath),
  }
}

export async function createTeacherResourceBundle({ teacherId, payload, files }) {
  await getTeacherProfile(teacherId)

  const materialFile = getUploadFile(files, 'material')
  const videoFile = getUploadFile(files, 'video')
  const coverFile = getUploadFile(files, 'cover')
  let connection = null
  let courseId = null

  try {
    if (!materialFile && !videoFile) {
      throw badRequest('资料文件和视频文件至少上传一种')
    }

    if (coverFile && !videoFile) {
      throw badRequest('上传视频封面前请先选择视频文件')
    }

    if (materialFile && Number(materialFile.size || 0) > 100 * 1024 * 1024) {
      throw badRequest('资料文件大小不能超过 100MB')
    }

    if (coverFile && Number(coverFile.size || 0) > 10 * 1024 * 1024) {
      throw badRequest('封面图片大小不能超过 10MB')
    }

    courseId = normalizeCourseId(payload.courseId)
    const title = normalizeMaterialName(payload.title || payload.resourceTitle || payload.materialName || payload.videoTitle)
    const description = normalizeDescription(payload.description, '资源说明')
    const duration = videoFile ? normalizeDuration(payload.duration) : null
    const course = await getOwnedCourseRow(courseId, teacherId)

    connection = await pool.getConnection()
    await connection.beginTransaction()

    const created = []

    if (materialFile) {
      const storedMaterialPath = buildStoredFilePath(materialFile.path)
      const materialType = path.extname(materialFile.originalname || '').replace('.', '').toLowerCase() || 'document'
      const [materialResult] = await connection.query(
        `INSERT INTO material (
          material_name,
          material_type,
          teacher_id,
          course_id,
          file_path,
          file_name,
          file_size,
          description,
          download_count,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
        [title, materialType, teacherId, courseId, storedMaterialPath, materialFile.originalname, Number(materialFile.size || 0), description || null],
      )

      created.push({
        id: materialResult.insertId,
        type: 'material',
        title,
        fileName: materialFile.originalname,
        fileSize: Number(materialFile.size || 0),
      })
    }

    if (videoFile) {
      const storedVideoPath = buildStoredFilePath(videoFile.path)
      const storedCoverPath = coverFile ? buildStoredFilePath(coverFile.path) : null
      const [videoResult] = await connection.query(
        `INSERT INTO course_video (
          video_title,
          course_id,
          teacher_id,
          video_path,
          cover_path,
          duration,
          file_size,
          description,
          play_count,
          download_count,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 1)`,
        [title, courseId, teacherId, storedVideoPath, storedCoverPath, duration, Number(videoFile.size || 0), description || null],
      )

      created.push({
        id: videoResult.insertId,
        type: 'video',
        title,
        fileName: videoFile.originalname,
        fileSize: Number(videoFile.size || 0),
        duration,
        coverFileName: coverFile?.originalname || '',
      })
    }

    await connection.commit()

    logger.info('teacher_resource_bundle_created', {
      teacherId,
      courseId,
      createdTypes: created.map((item) => item.type),
      hasMaterial: Boolean(materialFile),
      hasVideo: Boolean(videoFile),
      hasCover: Boolean(coverFile),
    })

    return {
      title,
      courseId,
      courseName: course.name,
      created,
      uploadTime: new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
        .format(new Date())
        .replace(/\//g, '-'),
    }
  } catch (error) {
    if (connection) {
      await connection.rollback()
    }

    await cleanupUploadedFiles([materialFile?.path, videoFile?.path, coverFile?.path])

    logger.error('teacher_resource_bundle_create_failed', {
      teacherId,
      courseId,
      hasMaterial: Boolean(materialFile),
      hasVideo: Boolean(videoFile),
      hasCover: Boolean(coverFile),
      error: error.message,
    })

    throw error
  } finally {
    connection?.release()
  }
}

export async function createTeacherMaterial({ teacherId, payload, file }) {
  await getTeacherProfile(teacherId)

  if (!file) {
    throw badRequest('请先选择资料文件')
  }

  let courseId = null

  try {
    courseId = normalizeCourseId(payload.courseId)
    const materialName = normalizeMaterialName(payload.materialName)
    const description = normalizeDescription(payload.description)
    const course = await getOwnedCourseRow(courseId, teacherId)
    const storedPath = buildStoredFilePath(file.path)
    const fileExtension = path.extname(file.originalname || '').replace('.', '').toLowerCase() || 'document'

    const [result] = await pool.query(
      `INSERT INTO material (
        material_name,
        material_type,
        teacher_id,
        course_id,
        file_path,
        file_name,
        file_size,
        description,
        download_count,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
      [materialName, fileExtension, teacherId, courseId, storedPath, file.originalname, Number(file.size || 0), description || null],
    )

    logger.info('teacher_material_created', {
      teacherId,
      materialId: result.insertId,
      courseId,
      originalFileName: file.originalname,
      storedFileName: path.basename(file.path),
      fileSize: Number(file.size || 0),
    })

    return {
      id: result.insertId,
      materialName,
      courseId,
      courseName: course.name,
      fileName: file.originalname,
      fileSize: Number(file.size || 0),
      materialType: fileExtension,
      uploadTime: new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
        .format(new Date())
        .replace(/\//g, '-'),
    }
  } catch (error) {
    await cleanupUploadedFile(file.path)

    logger.error('teacher_material_create_failed', {
      teacherId,
      courseId,
      originalFileName: file.originalname,
      storedFileName: path.basename(file.path),
      fileSize: Number(file.size || 0),
      error: error.message,
    })

    throw error
  }
}

export async function createTeacherVideo({ teacherId, payload, files }) {
  await getTeacherProfile(teacherId)

  const videoFile = getUploadFile(files, 'video')
  const coverFile = getUploadFile(files, 'cover')

  if (!videoFile) {
    throw badRequest('请先选择视频文件')
  }

  let courseId = null
  let storedVideoPath = ''
  let storedCoverPath = null

  try {
    courseId = normalizeCourseId(payload.courseId)
    const videoTitle = normalizeVideoTitle(payload.videoTitle)
    const description = normalizeDescription(payload.description, '视频描述')
    const duration = normalizeDuration(payload.duration)
    const course = await getOwnedCourseRow(courseId, teacherId)

    storedVideoPath = buildStoredFilePath(videoFile.path)
    storedCoverPath = coverFile ? buildStoredFilePath(coverFile.path) : null

    const [result] = await pool.query(
      `INSERT INTO course_video (
        video_title,
        course_id,
        teacher_id,
        video_path,
        cover_path,
        duration,
        file_size,
        description,
        play_count,
        download_count,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 1)`,
      [
        videoTitle,
        courseId,
        teacherId,
        storedVideoPath,
        storedCoverPath,
        duration,
        Number(videoFile.size || 0),
        description || null,
      ],
    )

    logger.info('teacher_video_created', {
      teacherId,
      videoId: result.insertId,
      courseId,
      originalVideoName: videoFile.originalname,
      storedVideoName: path.basename(videoFile.path),
      fileSize: Number(videoFile.size || 0),
      hasCover: Boolean(coverFile),
      storedCoverName: coverFile ? path.basename(coverFile.path) : null,
      duration,
    })

    return {
      id: result.insertId,
      videoTitle,
      courseId,
      courseName: course.name,
      fileName: videoFile.originalname,
      fileSize: Number(videoFile.size || 0),
      coverFileName: coverFile?.originalname || '',
      duration,
      uploadTime: new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
        .format(new Date())
        .replace(/\//g, '-'),
    }
  } catch (error) {
    await cleanupUploadedFiles([videoFile.path, coverFile?.path])

    logger.error('teacher_video_create_failed', {
      teacherId,
      courseId,
      originalVideoName: videoFile.originalname,
      storedVideoName: path.basename(videoFile.path),
      fileSize: Number(videoFile.size || 0),
      hasCover: Boolean(coverFile),
      storedCoverName: coverFile ? path.basename(coverFile.path) : null,
      error: error.message,
    })

    throw error
  }
}


export async function getTeacherResourceList({ teacherId, query }) {
  await getTeacherProfile(teacherId)

  const keyword = normalizeKeyword(query.keyword)
  const type = normalizeResourceFilterType(query.type)
  const requestedPage = normalizePageNumber(query.page)
  const pageSize = normalizePageSize(query.pageSize)
  const courseId = query.courseId === undefined || query.courseId === null || query.courseId === '' ? null : normalizeCourseId(query.courseId)
  const keywordPattern = keyword ? `%${keyword}%` : ''
  const params = [teacherId]
  let materialWhereSql = 'm.teacher_id = ? AND m.status = 1'
  let videoWhereSql = 'v.teacher_id = ? AND v.status = 1'

  if (courseId) {
    materialWhereSql += ' AND m.course_id = ?'
    videoWhereSql += ' AND v.course_id = ?'
    params.push(courseId)
  }

  if (keyword) {
    materialWhereSql += ' AND (m.material_name LIKE ? OR COALESCE(m.description, \'\') LIKE ? OR COALESCE(m.file_name, \'\') LIKE ?)'
    videoWhereSql += ' AND (v.video_title LIKE ? OR COALESCE(v.description, \'\') LIKE ?)'
  }

  const materialParams = keyword ? [...params, keywordPattern, keywordPattern, keywordPattern] : [...params]
  const videoParams = keyword ? [...params, keywordPattern, keywordPattern] : [...params]

  const [materialRows] =
    type === 'video'
      ? [[]]
      : await pool.query(
          `SELECT m.material_id AS id,
                  m.course_id AS courseId,
                  m.material_name AS title,
                  COALESCE(c.course_name, '未关联课程') AS courseName,
                  COALESCE(m.description, '') AS description,
                  COALESCE(NULLIF(m.file_name, ''), m.material_name) AS fileName,
                  m.file_size AS fileSize,
                  m.material_type AS materialType,
                  m.download_count AS downloadCount,
                  DATE_FORMAT(m.upload_time, '%Y-%m-%d') AS uploadTime,
                  m.upload_time AS sortTime
           FROM material m
           LEFT JOIN course_intro c ON c.course_id = m.course_id
           WHERE ${materialWhereSql}
           ORDER BY m.upload_time DESC, m.material_id DESC`,
          materialParams,
        )

  const [videoRows] =
    type === 'material'
      ? [[]]
      : await pool.query(
          `SELECT v.video_id AS id,
                  v.course_id AS courseId,
                  v.video_title AS title,
                  COALESCE(c.course_name, '未关联课程') AS courseName,
                  COALESCE(v.description, '') AS description,
                  v.file_size AS fileSize,
                  v.duration AS duration,
                  v.play_count AS playCount,
                  v.video_path AS videoPath,
                  DATE_FORMAT(v.upload_time, '%Y-%m-%d') AS uploadTime,
                  v.upload_time AS sortTime
           FROM course_video v
           LEFT JOIN course_intro c ON c.course_id = v.course_id
           WHERE ${videoWhereSql}
           ORDER BY v.upload_time DESC, v.video_id DESC`,
          videoParams,
        )

  const mergedList = [...materialRows.map(mapMaterialResourceItem), ...videoRows.map(mapVideoResourceItem)].sort(
    (left, right) => new Date(right.sortTime).getTime() - new Date(left.sortTime).getTime(),
  )

  const total = mergedList.length
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages)
  const offset = (page - 1) * pageSize
  const list = mergedList.slice(offset, offset + pageSize).map(({ sortTime, ...item }) => item)

  const [statsRows] = await pool.query(
    `SELECT
        (SELECT COUNT(*) FROM material WHERE teacher_id = ? AND status = 1) +
        (SELECT COUNT(*) FROM course_video WHERE teacher_id = ? AND status = 1) AS total,
        (SELECT COUNT(*) FROM material WHERE teacher_id = ? AND status = 1) AS materialCount,
        (SELECT COUNT(*) FROM course_video WHERE teacher_id = ? AND status = 1) AS videoCount,
        COALESCE((SELECT SUM(download_count) FROM material WHERE teacher_id = ? AND status = 1), 0) +
        COALESCE((SELECT SUM(play_count) FROM course_video WHERE teacher_id = ? AND status = 1), 0) AS interactionCount`,
    [teacherId, teacherId, teacherId, teacherId, teacherId, teacherId],
  )

  const [courseRows] = await pool.query(
    `SELECT course_id AS id, course_name AS name
     FROM course_intro
     WHERE teacher_id = ? AND status = 1
     ORDER BY update_time DESC, course_id DESC`,
    [teacherId],
  )

  const statsRow = statsRows[0] || {
    total: 0,
    materialCount: 0,
    videoCount: 0,
    interactionCount: 0,
  }

  logger.info('teacher_resource_list_loaded', {
    teacherId,
    keyword,
    courseId,
    type,
    page,
    pageSize,
    total,
    resultCount: list.length,
  })

  return {
    stats: {
      total: Number(statsRow.total || 0),
      materialCount: Number(statsRow.materialCount || 0),
      videoCount: Number(statsRow.videoCount || 0),
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
      courses: courseRows,
    },
  }
}

async function getOwnedMaterialResourceRow(resourceId, teacherId) {
  const [rows] = await pool.query(
    `SELECT m.material_id AS id,
            m.course_id AS courseId,
            m.teacher_id AS teacherId,
            m.material_name AS title,
            COALESCE(c.course_name, '未关联课程') AS courseName,
            COALESCE(m.description, '') AS description,
            COALESCE(NULLIF(m.file_name, ''), m.material_name) AS fileName,
            m.file_size AS fileSize,
            m.material_type AS materialType,
            m.download_count AS downloadCount,
            m.status AS status,
            m.upload_time AS uploadTime
     FROM material m
     LEFT JOIN course_intro c ON c.course_id = m.course_id
     WHERE m.material_id = ? AND m.teacher_id = ? AND m.status = 1
     LIMIT 1`,
    [resourceId, teacherId],
  )

  if (!rows.length) {
    throw notFound('资源不存在或无权操作')
  }

  return rows[0]
}

async function getOwnedVideoResourceRow(resourceId, teacherId) {
  const [rows] = await pool.query(
    `SELECT v.video_id AS id,
            v.course_id AS courseId,
            v.teacher_id AS teacherId,
            v.video_title AS title,
            COALESCE(c.course_name, '未关联课程') AS courseName,
            COALESCE(v.description, '') AS description,
            v.file_size AS fileSize,
            v.duration AS duration,
            v.play_count AS playCount,
            v.status AS status,
            v.upload_time AS uploadTime,
            v.video_path AS videoPath
     FROM course_video v
     LEFT JOIN course_intro c ON c.course_id = v.course_id
     WHERE v.video_id = ? AND v.teacher_id = ? AND v.status = 1
     LIMIT 1`,
    [resourceId, teacherId],
  )

  if (!rows.length) {
    throw notFound('资源不存在或无权操作')
  }

  return rows[0]
}

export async function getTeacherResourceDetail({ teacherId, type, resourceId }) {
  await getTeacherProfile(teacherId)

  const normalizedType = normalizeResourceType(type)
  const normalizedResourceId = normalizeResourceId(resourceId)
  const resource =
    normalizedType === 'material'
      ? await getOwnedMaterialResourceRow(normalizedResourceId, teacherId)
      : await getOwnedVideoResourceRow(normalizedResourceId, teacherId)

  const detail = {
    id: resource.id,
    type: normalizedType,
    title: resource.title,
    courseId: Number(resource.courseId || 0),
    courseName: resource.courseName,
    description: resource.description || '',
    fileName: resource.fileName || resource.title,
    fileSize: Number(resource.fileSize || 0),
    format:
      normalizedType === 'material'
        ? extractFileFormat(resource.fileName, String(resource.materialType || 'DOCUMENT').toUpperCase())
        : extractFileFormat(resource.videoPath, 'VIDEO'),
    duration: normalizedType === 'video' ? (resource.duration === null || resource.duration === undefined ? null : Number(resource.duration)) : null,
    uploadTime: formatDate(resource.uploadTime),
    interactionCount: Number(normalizedType === 'material' ? resource.downloadCount || 0 : resource.playCount || 0),
    previewUrl: buildResourcePreviewUrl(normalizedType, normalizedResourceId),
  }

  logger.info('teacher_resource_detail_loaded', {
    teacherId,
    type: normalizedType,
    resourceId: normalizedResourceId,
    courseId: Number(resource.courseId || 0),
  })

  return detail
}

export async function updateTeacherResource({ teacherId, type, resourceId, payload }) {
  await getTeacherProfile(teacherId)

  const normalizedType = normalizeResourceType(type)
  const normalizedResourceId = normalizeResourceId(resourceId)
  const courseId = normalizeCourseId(payload.courseId)
  const description = normalizeDescription(payload.description, '资源描述')
  const course = await getOwnedCourseRow(courseId, teacherId)

  if (normalizedType === 'material') {
    await getOwnedMaterialResourceRow(normalizedResourceId, teacherId)
    const title = normalizeMaterialName(payload.title)

    await pool.query(
      `UPDATE material
       SET material_name = ?, course_id = ?, description = ?, update_time = CURRENT_TIMESTAMP
       WHERE material_id = ? AND teacher_id = ? AND status = 1`,
      [title, courseId, description || null, normalizedResourceId, teacherId],
    )

    logger.info('teacher_resource_updated', {
      teacherId,
      type: normalizedType,
      resourceId: normalizedResourceId,
      courseId,
    })

    return {
      id: normalizedResourceId,
      type: normalizedType,
      title,
      courseId,
      courseName: course.name,
      description,
    }
  }

  await getOwnedVideoResourceRow(normalizedResourceId, teacherId)
  const title = normalizeVideoTitle(payload.title)

  await pool.query(
    `UPDATE course_video
     SET video_title = ?, course_id = ?, description = ?, update_time = CURRENT_TIMESTAMP
     WHERE video_id = ? AND teacher_id = ? AND status = 1`,
    [title, courseId, description || null, normalizedResourceId, teacherId],
  )

  logger.info('teacher_resource_updated', {
    teacherId,
    type: normalizedType,
    resourceId: normalizedResourceId,
    courseId,
  })

  return {
    id: normalizedResourceId,
    type: normalizedType,
    title,
    courseId,
    courseName: course.name,
    description,
  }
}

export async function deleteTeacherResource({ teacherId, type, resourceId }) {
  await getTeacherProfile(teacherId)

  const normalizedType = normalizeResourceType(type)
  const normalizedResourceId = normalizeResourceId(resourceId)
  const resource =
    normalizedType === 'material'
      ? await getOwnedMaterialResourceRow(normalizedResourceId, teacherId)
      : await getOwnedVideoResourceRow(normalizedResourceId, teacherId)

  if (normalizedType === 'material') {
    await pool.query(
      `UPDATE material
       SET status = 0, update_time = CURRENT_TIMESTAMP
       WHERE material_id = ? AND teacher_id = ? AND status = 1`,
      [normalizedResourceId, teacherId],
    )
  } else {
    await pool.query(
      `UPDATE course_video
       SET status = 0, update_time = CURRENT_TIMESTAMP
       WHERE video_id = ? AND teacher_id = ? AND status = 1`,
      [normalizedResourceId, teacherId],
    )
  }

  logger.info('teacher_resource_deleted', {
    teacherId,
    type: normalizedType,
    resourceId: normalizedResourceId,
    courseId: Number(resource.courseId || 0),
  })

  return {
    id: normalizedResourceId,
    type: normalizedType,
  }
}

export async function getTeacherMessageList({ teacherId, query }) {
  const keyword = normalizeKeyword(query.keyword)
  const requestedPage = normalizePageNumber(query.page)
  const pageSize = normalizePageSize(query.pageSize)
  const params = [teacherId]
  let keywordSql = ''

  if (keyword) {
    const keywordPattern = `%${keyword}%`
    keywordSql = ' AND (t.title LIKE ? OR t.content LIKE ?)'
    params.push(keywordPattern, keywordPattern)
  }

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM message_topic t
     WHERE t.teacher_id = ?${keywordSql}`,
    params,
  )

  const total = Number(countRows[0]?.total || 0)
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages)
  const offset = (page - 1) * pageSize

  const [list] = await pool.query(
    `SELECT t.topic_id AS id,
            t.title AS title,
            CASE
              WHEN CHAR_LENGTH(t.content) > 56 THEN CONCAT(LEFT(t.content, 56), '...')
              ELSE t.content
            END AS summary,
            DATE_FORMAT(t.create_time, '%Y-%m-%d') AS publishDate,
            DATE_FORMAT(COALESCE(last_reply.lastReplyAt, t.update_time), '%Y-%m-%d') AS lastReplyAt,
            t.status AS status,
            COALESCE(reply_stats.replyCount, 0) AS replyCount
     FROM message_topic t
     LEFT JOIN (
       SELECT topic_id, COUNT(*) AS replyCount
       FROM message_topic_reply
       GROUP BY topic_id
     ) reply_stats ON reply_stats.topic_id = t.topic_id
     LEFT JOIN (
       SELECT topic_id, MAX(reply_time) AS lastReplyAt
       FROM message_topic_reply
       GROUP BY topic_id
     ) last_reply ON last_reply.topic_id = t.topic_id
     WHERE t.teacher_id = ?${keywordSql}
     ORDER BY COALESCE(last_reply.lastReplyAt, t.update_time) DESC, t.topic_id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  )

  logger.info('teacher_message_list_loaded', {
    teacherId,
    keyword,
    page,
    pageSize,
    total,
    resultCount: list.length,
  })

  return {
    list: list.map((item) => ({
      ...item,
      statusLabel: getStatusLabel(item.status),
      replyCount: Number(item.replyCount || 0),
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  }
}

export async function createTeacherMessage({ teacherId, payload }) {
  const title = normalizeTitle(payload.title)
  const content = normalizeContent(payload.content, '话题内容')

  await getTeacherProfile(teacherId)

  const [result] = await pool.query(
    `INSERT INTO message_topic (teacher_id, title, content, status)
     VALUES (?, ?, ?, 'open')`,
    [teacherId, title, content],
  )

  logger.info('teacher_message_created', {
    teacherId,
    topicId: result.insertId,
    title,
  })

  return {
    id: result.insertId,
    title,
  }
}

export async function getTeacherMessageDetail({ teacherId, messageId }) {
  const normalizedMessageId = normalizeMessageId(messageId)
  const teacher = await getTeacherProfile(teacherId)
  const topic = await getOwnedMessageRow(normalizedMessageId, teacherId)

  const [replies] = await pool.query(
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

  logger.info('teacher_message_detail_loaded', {
    teacherId,
    topicId: normalizedMessageId,
    replyCount: replies.length,
  })

  return {
    topic: {
      id: topic.id,
      title: topic.title,
      content: topic.content,
      authorName: teacher.name,
      publishDate: new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
        .format(new Date(topic.create_time))
        .replace(/\//g, '-'),
      statusLabel: getStatusLabel(topic.status),
    },
    replies,
  }
}

export async function createTeacherMessageReply({ teacherId, messageId, payload }) {
  const normalizedMessageId = normalizeMessageId(messageId)
  const content = normalizeContent(payload.content, '回复内容')

  await getTeacherProfile(teacherId)
  await getOwnedMessageRow(normalizedMessageId, teacherId)

  const [result] = await pool.query(
    `INSERT INTO message_topic_reply (topic_id, teacher_id, content)
     VALUES (?, ?, ?)`,
    [normalizedMessageId, teacherId, content],
  )

  await pool.query(
    `UPDATE message_topic
     SET status = 'active', update_time = CURRENT_TIMESTAMP
     WHERE topic_id = ?`,
    [normalizedMessageId],
  )

  logger.info('teacher_message_reply_created', {
    teacherId,
    topicId: normalizedMessageId,
    replyId: result.insertId,
  })

  return {
    id: result.insertId,
  }
}
