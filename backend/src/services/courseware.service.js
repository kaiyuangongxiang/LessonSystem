import { randomUUID } from 'node:crypto'
import { pool } from '../config/db.js'
import { logger } from '../utils/logger.js'

const DEFAULT_PAGE_SIZE = 6
const MAX_PAGE_SIZE = 12
const COURSEWARE_STATUSES = new Set(['draft', 'published'])
const COURSEWARE_TEMPLATES = new Set(['cover', 'agenda', 'content', 'two-column', 'summary'])
const COURSEWARE_TEXT_STYLES = new Set(['title', 'subtitle', 'body', 'caption', 'quote'])
const COURSEWARE_TEXT_ALIGNMENTS = new Set(['left', 'center', 'right'])
const COURSEWARE_BLOCK_TYPES = new Set(['text', 'image', 'resource', 'video'])

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

function normalizeCoursewareId(value) {
  const coursewareId = Number(value)
  if (!Number.isInteger(coursewareId) || coursewareId <= 0) {
    throw badRequest('课件 ID 不合法')
  }

  return coursewareId
}

function normalizeCourseId(value) {
  const courseId = Number(value)
  if (!Number.isInteger(courseId) || courseId <= 0) {
    throw badRequest('课程 ID 不合法')
  }

  return courseId
}

function normalizePrepId(value) {
  const prepId = Number(value)
  if (!Number.isInteger(prepId) || prepId <= 0) {
    throw badRequest('备课单 ID 不合法')
  }

  return prepId
}

function normalizeAssetId(value) {
  const assetId = Number(value)
  if (!Number.isInteger(assetId) || assetId <= 0) {
    throw badRequest('素材 ID 不合法')
  }

  return assetId
}

function normalizeResourceId(value) {
  const resourceId = Number(value)
  if (!Number.isInteger(resourceId) || resourceId <= 0) {
    throw badRequest('资源 ID 不合法')
  }

  return resourceId
}

function normalizeCoursewareStatus(value, fallback = 'draft') {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  const status = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!COURSEWARE_STATUSES.has(status)) {
    throw badRequest('课件状态不合法')
  }

  return status
}

function normalizeCoursewareStatusFilter(value) {
  if (value === undefined || value === null || value === '' || value === 'all') {
    return 'all'
  }

  return normalizeCoursewareStatus(value)
}

function normalizeCoursewareTemplate(value, fallback = 'content') {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  const template = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!COURSEWARE_TEMPLATES.has(template)) {
    throw badRequest('课件模板不合法')
  }

  return template
}

function normalizeCoursewareTitle(value) {
  const title = typeof value === 'string' ? value.trim() : ''

  if (!title) {
    throw badRequest('课件标题不能为空')
  }

  if (title.length > 200) {
    throw badRequest('课件标题不能超过 200 个字符')
  }

  return title
}

function normalizeCoursewareSummary(value) {
  const summary = typeof value === 'string' ? value.trim() : ''

  if (summary.length > 2000) {
    throw badRequest('课件摘要不能超过 2000 个字符')
  }

  return summary
}

function normalizeShortText(value, label, maxLength = 200) {
  const text = typeof value === 'string' ? value.trim() : ''

  if (!text) {
    throw badRequest(`${label}不能为空`)
  }

  if (text.length > maxLength) {
    throw badRequest(`${label}不能超过 ${maxLength} 个字符`)
  }

  return text
}

function normalizeOptionalShortText(value, label, maxLength = 200) {
  const text = typeof value === 'string' ? value.trim() : ''

  if (!text) {
    return ''
  }

  if (text.length > maxLength) {
    throw badRequest(`${label}不能超过 ${maxLength} 个字符`)
  }

  return text
}

function normalizeTextBlockContent(value) {
  const text = typeof value === 'string' ? value.trim() : ''

  if (!text) {
    throw badRequest('文本块内容不能为空')
  }

  if (text.length > 5000) {
    throw badRequest('文本块内容不能超过 5000 个字符')
  }

  return text
}

function normalizeSlideNote(value) {
  const note = typeof value === 'string' ? value.trim() : ''

  if (note.length > 2000) {
    throw badRequest('页面备注不能超过 2000 个字符')
  }

  return note
}

function normalizeBlockStyle(value) {
  const style = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!style) {
    return 'body'
  }

  if (!COURSEWARE_TEXT_STYLES.has(style)) {
    throw badRequest('文本块样式不合法')
  }

  return style
}

function normalizeBlockAlignment(value) {
  const alignment = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!alignment) {
    return 'left'
  }

  if (!COURSEWARE_TEXT_ALIGNMENTS.has(alignment)) {
    throw badRequest('文本块对齐方式不合法')
  }

  return alignment
}

function normalizeBlockType(value) {
  const type = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!COURSEWARE_BLOCK_TYPES.has(type)) {
    throw badRequest('课件内容块类型不合法')
  }

  return type
}

function createClientId(prefix) {
  return `${prefix}-${randomUUID().slice(0, 8)}`
}

function buildAssetPreviewUrl(assetId) {
  return `/portal/assets/${assetId}/file`
}

function buildResourcePreviewUrl(type, resourceId) {
  return type === 'material' ? `/portal/materials/${resourceId}/download` : `/portal/videos/${resourceId}/play`
}

function getCoursewareStatusLabel(status) {
  return status === 'published' ? '已发布' : '草稿'
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

function parseCoursewareContent(rawContent, fallbackTitle = '未命名课件') {
  try {
    const parsed = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.slides) && parsed.slides.length) {
      return parsed
    }
  } catch {
    // ignore invalid stored content and fall back to default content
  }

  return buildDefaultCoursewareContent(fallbackTitle)
}

function buildDefaultCoursewareContent(title, template = 'cover') {
  return {
    version: 1,
    slides: [
      {
        id: createClientId('slide'),
        title: '封面页',
        template,
        note: '',
        blocks: [
          {
            id: createClientId('block'),
            type: 'text',
            text: title,
            style: 'title',
            align: 'center',
          },
          {
            id: createClientId('block'),
            type: 'text',
            text: '从这里开始整理本次在线课件内容',
            style: 'subtitle',
            align: 'center',
          },
        ],
      },
    ],
  }
}

function buildCoursewareCounters(content) {
  const slides = Array.isArray(content?.slides) ? content.slides : []
  let blockCount = 0
  let coverPreviewUrl = ''

  for (const slide of slides) {
    const blocks = Array.isArray(slide?.blocks) ? slide.blocks : []
    blockCount += blocks.length

    if (!coverPreviewUrl) {
      const imageBlock = blocks.find((item) => item?.type === 'image' && item?.previewUrl)
      if (imageBlock) {
        coverPreviewUrl = imageBlock.previewUrl
      }
    }
  }

  return {
    slideCount: slides.length,
    blockCount,
    coverPreviewUrl,
  }
}

async function ensureTeacherExists(teacherId) {
  const [rows] = await pool.query(
    `SELECT teacher_id AS id,
            username,
            COALESCE(NULLIF(teacher_name, ''), username, '未命名教师') AS name
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

async function ensureCoursewareReady() {
  const [rows] = await pool.query(
    `SELECT 1
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'courseware'
     LIMIT 1`,
  )

  if (!rows.length) {
    throw badRequest('当前数据库尚未初始化课件表，请先执行课件升级 SQL')
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

async function getOwnedPrepRow(prepId, teacherId) {
  await ensureTeachingPrepReady()

  const [rows] = await pool.query(
    `SELECT prep_id AS id,
            course_id AS courseId,
            prep_title AS title,
            status
     FROM teaching_prep
     WHERE prep_id = ? AND teacher_id = ?
     LIMIT 1`,
    [prepId, teacherId],
  )

  if (!rows.length) {
    throw notFound('备课单不存在或无权操作')
  }

  return rows[0]
}

async function getOwnedImageAssetRow(assetId, teacherId) {
  await ensureAssetLibraryReady()

  const [rows] = await pool.query(
    `SELECT a.asset_id AS id,
            a.asset_type AS type,
            a.asset_title AS title,
            COALESCE(a.asset_description, '') AS description,
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

  if (rows[0].type !== 'image') {
    throw badRequest('当前素材不是图片素材，不能作为图片块插入')
  }

  return rows[0]
}

async function getOwnedMaterialRow(resourceId, teacherId) {
  const [rows] = await pool.query(
    `SELECT m.material_id AS id,
            m.material_name AS title,
            COALESCE(m.description, '') AS description,
            COALESCE(c.course_name, '未关联课程') AS courseName,
            COALESCE(NULLIF(m.file_name, ''), m.material_name) AS fileName
     FROM material m
     LEFT JOIN course_intro c ON c.course_id = m.course_id
     WHERE m.material_id = ? AND m.teacher_id = ? AND m.status = 1
     LIMIT 1`,
    [resourceId, teacherId],
  )

  if (!rows.length) {
    throw notFound('资料不存在或无权操作')
  }

  return rows[0]
}

async function getOwnedVideoRow(resourceId, teacherId) {
  const [rows] = await pool.query(
    `SELECT v.video_id AS id,
            v.video_title AS title,
            COALESCE(v.description, '') AS description,
            COALESCE(c.course_name, '未关联课程') AS courseName,
            v.duration
     FROM course_video v
     LEFT JOIN course_intro c ON c.course_id = v.course_id
     WHERE v.video_id = ? AND v.teacher_id = ? AND v.status = 1
     LIMIT 1`,
    [resourceId, teacherId],
  )

  if (!rows.length) {
    throw notFound('视频不存在或无权操作')
  }

  return rows[0]
}

async function getOwnedCoursewareRow(coursewareId, teacherId) {
  await ensureCoursewareReady()

  const [rows] = await pool.query(
    `SELECT cw.courseware_id AS id,
            cw.teacher_id AS teacherId,
            cw.course_id AS courseId,
            cw.prep_id AS prepId,
            cw.courseware_title AS title,
            COALESCE(cw.courseware_summary, '') AS summary,
            cw.status,
            cw.content_json AS contentJson,
            DATE_FORMAT(cw.create_time, '%Y-%m-%d') AS createTime,
            DATE_FORMAT(cw.update_time, '%Y-%m-%d') AS updateTime,
            DATE_FORMAT(cw.published_time, '%Y-%m-%d') AS publishedTime,
            cw.published_time AS rawPublishedTime,
            COALESCE(c.course_name, '未关联课程') AS courseName,
            COALESCE(p.prep_title, '未关联备课单') AS prepTitle
     FROM courseware cw
     LEFT JOIN course_intro c ON c.course_id = cw.course_id
     LEFT JOIN teaching_prep p ON p.prep_id = cw.prep_id
     WHERE cw.courseware_id = ? AND cw.teacher_id = ?
     LIMIT 1`,
    [coursewareId, teacherId],
  )

  if (!rows.length) {
    throw notFound('课件不存在或无权操作')
  }

  return rows[0]
}

async function getTeacherPrepOptions(teacherId) {
  await ensureTeachingPrepReady()

  const [rows] = await pool.query(
    `SELECT p.prep_id AS id,
            p.course_id AS courseId,
            p.prep_title AS title,
            p.status AS status,
            COALESCE(c.course_name, '未关联课程') AS courseName
     FROM teaching_prep p
     LEFT JOIN course_intro c ON c.course_id = p.course_id
     WHERE p.teacher_id = ?
     ORDER BY p.update_time DESC, p.prep_id DESC`,
    [teacherId],
  )

  return rows.map((item) => ({
    id: Number(item.id),
    courseId: Number(item.courseId || 0),
    title: item.title,
    courseName: item.courseName,
    status: item.status,
    statusLabel: getPrepStatusLabel(item.status),
  }))
}

async function normalizeCoursewareBlock(block, teacherId) {
  const normalizedBlock = block && typeof block === 'object' ? block : {}
  const type = normalizeBlockType(normalizedBlock.type)
  const id = normalizeOptionalShortText(normalizedBlock.id, '内容块标识', 60) || createClientId('block')

  if (type === 'text') {
    return {
      id,
      type,
      text: normalizeTextBlockContent(normalizedBlock.text),
      style: normalizeBlockStyle(normalizedBlock.style),
      align: normalizeBlockAlignment(normalizedBlock.align),
    }
  }

  if (type === 'image') {
    const asset = await getOwnedImageAssetRow(normalizeAssetId(normalizedBlock.assetId), teacherId)

    return {
      id,
      type,
      assetId: Number(asset.id),
      title: asset.title,
      description: asset.description || '',
      courseName: asset.courseName,
      previewUrl: buildAssetPreviewUrl(Number(asset.id)),
      caption: normalizeOptionalShortText(normalizedBlock.caption, '图片说明', 300),
    }
  }

  if (type === 'resource') {
    const material = await getOwnedMaterialRow(normalizeResourceId(normalizedBlock.resourceId), teacherId)

    return {
      id,
      type,
      resourceId: Number(material.id),
      title: material.title,
      description: material.description || '',
      courseName: material.courseName,
      fileName: material.fileName || material.title,
      previewUrl: buildResourcePreviewUrl('material', Number(material.id)),
      caption: normalizeOptionalShortText(normalizedBlock.caption, '资料说明', 300),
    }
  }

  const video = await getOwnedVideoRow(normalizeResourceId(normalizedBlock.resourceId), teacherId)

  return {
    id,
    type,
    resourceId: Number(video.id),
    title: video.title,
    description: video.description || '',
    courseName: video.courseName,
    duration: video.duration === null || video.duration === undefined ? null : Number(video.duration),
    previewUrl: buildResourcePreviewUrl('video', Number(video.id)),
    caption: normalizeOptionalShortText(normalizedBlock.caption, '视频说明', 300),
  }
}

async function normalizeCoursewareContent(content, teacherId, fallbackTitle) {
  const source = content && typeof content === 'object' ? content : null

  if (!source || !Array.isArray(source.slides)) {
    throw badRequest('课件内容格式不正确')
  }

  if (!source.slides.length) {
    throw badRequest('课件至少需要保留 1 页')
  }

  if (source.slides.length > 50) {
    throw badRequest('课件页数不能超过 50 页')
  }

  const slides = []

  for (const slide of source.slides) {
    const normalizedSlide = slide && typeof slide === 'object' ? slide : {}
    const blocksSource = Array.isArray(normalizedSlide.blocks) ? normalizedSlide.blocks : []

    if (!blocksSource.length) {
      throw badRequest('每一页至少需要保留 1 个内容块')
    }

    if (blocksSource.length > 20) {
      throw badRequest('单页内容块不能超过 20 个')
    }

    const blocks = []
    for (const block of blocksSource) {
      blocks.push(await normalizeCoursewareBlock(block, teacherId))
    }

    slides.push({
      id: normalizeOptionalShortText(normalizedSlide.id, '页面标识', 60) || createClientId('slide'),
      title: normalizeOptionalShortText(normalizedSlide.title, '页面标题', 120) || fallbackTitle || '未命名页面',
      template: normalizeCoursewareTemplate(normalizedSlide.template, 'content'),
      note: normalizeSlideNote(normalizedSlide.note),
      blocks,
    })
  }

  return {
    version: 1,
    slides,
  }
}

function mapCoursewareListItem(row) {
  const content = parseCoursewareContent(row.contentJson, row.title)
  const counters = buildCoursewareCounters(content)

  return {
    id: Number(row.id),
    teacherId: Number(row.teacherId || 0),
    courseId: Number(row.courseId || 0),
    prepId: Number(row.prepId || 0),
    title: row.title,
    summary: row.summary || '',
    status: row.status,
    statusLabel: getCoursewareStatusLabel(row.status),
    courseName: row.courseName,
    prepTitle: row.prepTitle,
    slideCount: counters.slideCount,
    blockCount: counters.blockCount,
    coverPreviewUrl: counters.coverPreviewUrl,
    createTime: row.createTime,
    updateTime: row.updateTime,
    publishedTime: row.publishedTime || '',
  }
}

function mapCoursewareDetail(row) {
  const content = parseCoursewareContent(row.contentJson, row.title)
  const counters = buildCoursewareCounters(content)

  return {
    id: Number(row.id),
    teacherId: Number(row.teacherId || 0),
    courseId: Number(row.courseId || 0),
    prepId: Number(row.prepId || 0),
    title: row.title,
    summary: row.summary || '',
    status: row.status,
    statusLabel: getCoursewareStatusLabel(row.status),
    courseName: row.courseName,
    prepTitle: row.prepTitle,
    slideCount: counters.slideCount,
    blockCount: counters.blockCount,
    coverPreviewUrl: counters.coverPreviewUrl,
    createTime: row.createTime,
    updateTime: row.updateTime,
    publishedTime: row.publishedTime || '',
    content,
  }
}

export async function getTeacherCoursewareList({ teacherId, query }) {
  await ensureTeacherExists(teacherId)
  await ensureCoursewareReady()

  const keyword = normalizeKeyword(query.keyword)
  const courseId = query.courseId === undefined || query.courseId === null || query.courseId === '' ? null : normalizeCourseId(query.courseId)
  const prepId = query.prepId === undefined || query.prepId === null || query.prepId === '' ? null : normalizePrepId(query.prepId)
  const status = normalizeCoursewareStatusFilter(query.status)
  const requestedPage = normalizePageNumber(query.page)
  const pageSize = normalizePageSize(query.pageSize)
  const params = [teacherId]
  let whereSql = 'cw.teacher_id = ?'

  if (keyword) {
    const keywordPattern = `%${keyword}%`
    whereSql += ` AND (
      cw.courseware_title LIKE ?
      OR COALESCE(cw.courseware_summary, '') LIKE ?
      OR COALESCE(c.course_name, '') LIKE ?
      OR COALESCE(p.prep_title, '') LIKE ?
    )`
    params.push(keywordPattern, keywordPattern, keywordPattern, keywordPattern)
  }

  if (courseId) {
    whereSql += ' AND cw.course_id = ?'
    params.push(courseId)
  }

  if (prepId) {
    whereSql += ' AND cw.prep_id = ?'
    params.push(prepId)
  }

  if (status !== 'all') {
    whereSql += ' AND cw.status = ?'
    params.push(status)
  }

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM courseware cw
     LEFT JOIN course_intro c ON c.course_id = cw.course_id
     LEFT JOIN teaching_prep p ON p.prep_id = cw.prep_id
     WHERE ${whereSql}`,
    params,
  )

  const total = Number(countRows[0]?.total || 0)
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages)
  const offset = (page - 1) * pageSize

  const [listRows] = await pool.query(
    `SELECT cw.courseware_id AS id,
            cw.teacher_id AS teacherId,
            cw.course_id AS courseId,
            cw.prep_id AS prepId,
            cw.courseware_title AS title,
            COALESCE(cw.courseware_summary, '') AS summary,
            cw.status,
            cw.content_json AS contentJson,
            DATE_FORMAT(cw.create_time, '%Y-%m-%d') AS createTime,
            DATE_FORMAT(cw.update_time, '%Y-%m-%d') AS updateTime,
            DATE_FORMAT(cw.published_time, '%Y-%m-%d') AS publishedTime,
            COALESCE(c.course_name, '未关联课程') AS courseName,
            COALESCE(p.prep_title, '未关联备课单') AS prepTitle
     FROM courseware cw
     LEFT JOIN course_intro c ON c.course_id = cw.course_id
     LEFT JOIN teaching_prep p ON p.prep_id = cw.prep_id
     WHERE ${whereSql}
     ORDER BY cw.update_time DESC, cw.courseware_id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  )

  const [statsRows] = await pool.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END), 0) AS draftCount,
            COALESCE(SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END), 0) AS publishedCount,
            COUNT(DISTINCT course_id) AS courseCount
     FROM courseware
     WHERE teacher_id = ?`,
    [teacherId],
  )

  const statsRow = statsRows[0] || {
    total: 0,
    draftCount: 0,
    publishedCount: 0,
    courseCount: 0,
  }

  logger.info('teacher_courseware_list_loaded', {
    teacherId,
    keyword,
    courseId,
    prepId,
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
    list: listRows.map(mapCoursewareListItem),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
    filters: {
      courses: await getTeacherCourseOptions(teacherId),
      preps: await getTeacherPrepOptions(teacherId),
    },
  }
}

async function getTeacherCourseOptions(teacherId) {
  const [rows] = await pool.query(
    `SELECT course_id AS id, course_name AS name
     FROM course_intro
     WHERE teacher_id = ? AND status = 1
     ORDER BY update_time DESC, course_id DESC`,
    [teacherId],
  )

  return rows.map((item) => ({
    id: Number(item.id),
    name: item.name,
  }))
}

export async function createTeacherCourseware({ teacherId, payload }) {
  await ensureTeacherExists(teacherId)
  await ensureCoursewareReady()

  const courseId = normalizeCourseId(payload.courseId)
  const prepId = normalizePrepId(payload.prepId)
  const title = normalizeCoursewareTitle(payload.title)
  const summary = normalizeCoursewareSummary(payload.summary)
  const initialTemplate = normalizeCoursewareTemplate(payload.initialTemplate, 'cover')
  const course = await getOwnedCourseRow(courseId, teacherId)
  const prep = await getOwnedPrepRow(prepId, teacherId)

  if (Number(prep.courseId) !== courseId) {
    throw badRequest('所选备课单与课程不匹配')
  }

  const content = buildDefaultCoursewareContent(title, initialTemplate)
  const [result] = await pool.query(
    `INSERT INTO courseware (
      teacher_id,
      course_id,
      prep_id,
      courseware_title,
      courseware_summary,
      status,
      content_json,
      published_time
    ) VALUES (?, ?, ?, ?, ?, 'draft', ?, NULL)`,
    [teacherId, courseId, prepId, title, summary || null, JSON.stringify(content)],
  )

  const coursewareId = Number(result.insertId || 0)

  logger.info('teacher_courseware_created', {
    teacherId,
    coursewareId,
    courseId,
    prepId,
    template: initialTemplate,
  })

  return {
    ...mapCoursewareDetail(await getOwnedCoursewareRow(coursewareId, teacherId)),
    courseName: course.name,
    prepTitle: prep.title,
  }
}

export async function getTeacherCoursewareDetail({ teacherId, coursewareId }) {
  await ensureTeacherExists(teacherId)
  await ensureCoursewareReady()

  const normalizedCoursewareId = normalizeCoursewareId(coursewareId)
  const row = await getOwnedCoursewareRow(normalizedCoursewareId, teacherId)

  logger.info('teacher_courseware_detail_loaded', {
    teacherId,
    coursewareId: normalizedCoursewareId,
    courseId: Number(row.courseId || 0),
    prepId: Number(row.prepId || 0),
  })

  return {
    courseware: mapCoursewareDetail(row),
    options: {
      courses: await getTeacherCourseOptions(teacherId),
      preps: await getTeacherPrepOptions(teacherId),
    },
  }
}

export async function updateTeacherCourseware({ teacherId, coursewareId, payload }) {
  await ensureTeacherExists(teacherId)
  await ensureCoursewareReady()

  const normalizedCoursewareId = normalizeCoursewareId(coursewareId)
  const existing = await getOwnedCoursewareRow(normalizedCoursewareId, teacherId)
  const courseId = normalizeCourseId(payload.courseId)
  const prepId = normalizePrepId(payload.prepId)
  const title = normalizeCoursewareTitle(payload.title)
  const summary = normalizeCoursewareSummary(payload.summary)
  const status = normalizeCoursewareStatus(payload.status, existing.status)
  const course = await getOwnedCourseRow(courseId, teacherId)
  const prep = await getOwnedPrepRow(prepId, teacherId)

  if (Number(prep.courseId) !== courseId) {
    throw badRequest('所选备课单与课程不匹配')
  }

  const content = await normalizeCoursewareContent(payload.content, teacherId, title)
  const publishedTimeSql = status === 'published' ? 'COALESCE(published_time, CURRENT_TIMESTAMP)' : 'NULL'

  await pool.query(
    `UPDATE courseware
     SET course_id = ?,
         prep_id = ?,
         courseware_title = ?,
         courseware_summary = ?,
         status = ?,
         content_json = ?,
         published_time = ${publishedTimeSql},
         update_time = CURRENT_TIMESTAMP
     WHERE courseware_id = ? AND teacher_id = ?`,
    [courseId, prepId, title, summary || null, status, JSON.stringify(content), normalizedCoursewareId, teacherId],
  )

  logger.info('teacher_courseware_updated', {
    teacherId,
    coursewareId: normalizedCoursewareId,
    courseId,
    prepId,
    status,
  })

  const row = await getOwnedCoursewareRow(normalizedCoursewareId, teacherId)

  return {
    ...mapCoursewareDetail(row),
    courseName: course.name,
    prepTitle: prep.title,
  }
}

export async function deleteTeacherCourseware({ teacherId, coursewareId }) {
  await ensureTeacherExists(teacherId)
  await ensureCoursewareReady()

  const normalizedCoursewareId = normalizeCoursewareId(coursewareId)
  const row = await getOwnedCoursewareRow(normalizedCoursewareId, teacherId)

  await pool.query(
    `DELETE FROM courseware
     WHERE courseware_id = ? AND teacher_id = ?`,
    [normalizedCoursewareId, teacherId],
  )

  logger.info('teacher_courseware_deleted', {
    teacherId,
    coursewareId: normalizedCoursewareId,
  })

  return {
    id: normalizedCoursewareId,
    title: row.title,
  }
}

export async function publishTeacherCourseware({ teacherId, coursewareId }) {
  await ensureTeacherExists(teacherId)
  await ensureCoursewareReady()

  const normalizedCoursewareId = normalizeCoursewareId(coursewareId)
  await getOwnedCoursewareRow(normalizedCoursewareId, teacherId)

  await pool.query(
    `UPDATE courseware
     SET status = 'published',
         published_time = COALESCE(published_time, CURRENT_TIMESTAMP),
         update_time = CURRENT_TIMESTAMP
     WHERE courseware_id = ? AND teacher_id = ?`,
    [normalizedCoursewareId, teacherId],
  )

  const row = await getOwnedCoursewareRow(normalizedCoursewareId, teacherId)

  logger.info('teacher_courseware_published', {
    teacherId,
    coursewareId: normalizedCoursewareId,
  })

  return mapCoursewareDetail(row)
}
