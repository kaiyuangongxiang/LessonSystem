import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from '../config/env.js'
import { pool } from '../config/db.js'
import { preparePreviewFile } from '../utils/file-preview.js'
import { logger } from '../utils/logger.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(currentDir, '../../')
const projectRoot = path.resolve(currentDir, '../../../')
const officePreviewCacheRoot = path.resolve(backendRoot, '.cache/office-preview')
const DEFAULT_PAGE_SIZE = 6
const MAX_PAGE_SIZE = 12
const PUBLIC_ASSET_TYPES = new Set(['image', 'audio', 'video', 'text', 'file'])

const DEFAULT_PROFILE = {
  heroTitle: '让课程、资料与视频在一个入口里协同',
  systemName: '在线教师备课系统',
  systemIntro: '围绕课程、资料与视频的统一备课平台，帮助教师快速进入课程浏览与资源查看主链路。',
}

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

function normalizeCourseId(value, label = '课程') {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw badRequest(`${label}ID不合法`)
  }

  return id
}

function normalizeSort(value) {
  return value === 'time-asc' ? 'time-asc' : 'time-desc'
}

function normalizePublicAssetType(value) {
  if (value === undefined || value === null || value === '' || value === 'all') {
    return 'all'
  }

  const type = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (PUBLIC_ASSET_TYPES.has(type)) {
    return type
  }

  throw badRequest('公共素材类型不合法')
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

function buildCourseWhereClause({ keyword, collegeId }) {
  const conditions = ['c.status = 1']
  const params = []

  if (keyword) {
    const keywordPattern = `%${keyword}%`
    conditions.push(`(
      c.course_name LIKE ?
      OR COALESCE(col.college_name, '') LIKE ?
      OR COALESCE(t.teacher_name, '') LIKE ?
      OR COALESCE(t.username, '') LIKE ?
    )`)
    params.push(keywordPattern, keywordPattern, keywordPattern, keywordPattern)
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

function resolveStoredFilePath(storedPath) {
  const rawPath = String(storedPath || '').trim()
  if (!rawPath) {
    return null
  }

  const normalizedPath = rawPath.replace(/\\/g, path.sep)
  const relativePath = normalizedPath.replace(/^[/\\]+/, '')
  const candidates = []

  if (path.isAbsolute(normalizedPath)) {
    candidates.push(path.normalize(normalizedPath))
  } else {
    if (env.resourceRoot) {
      candidates.push(path.resolve(env.resourceRoot, relativePath))
    }

    candidates.push(path.resolve(projectRoot, relativePath))
    candidates.push(path.resolve(backendRoot, relativePath))
    candidates.push(path.resolve(process.cwd(), relativePath))
  }

  return [...new Set(candidates)].find((candidate) => fs.existsSync(candidate)) || null
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
    throw notFound('素材库尚未初始化')
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
    throw notFound('公共素材功能尚未初始化，请先执行教师中心简化升级 SQL')
  }
}

async function hasTeachingPrepReady() {
  const [rows] = await pool.query(
    `SELECT 1
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'teaching_prep'
     LIMIT 1`,
  )

  return rows.length > 0
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

function inferPrepAttachmentType(mimeType, fileName) {
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

function buildPortalPrepAttachmentFileUrl(attachmentId) {
  return `/portal/preps/attachments/${attachmentId}/file`
}

function buildPortalPrepAttachmentDownloadUrl(attachmentId) {
  return `/portal/preps/attachments/${attachmentId}/download`
}

function mapPortalPrepAttachmentItem(item) {
  const sourceType = item.sourceType
  const assetType = String(item.assetType || '').toLowerCase()
  const fileName = item.fileName || ''
  const mimeType = item.mimeType || ''
  const type = PUBLIC_ASSET_TYPES.has(assetType) ? assetType : inferPrepAttachmentType(mimeType, fileName)
  const hasFile = Boolean(String(item.storedPath || '').trim())

  return {
    id: Number(item.id),
    sourceType,
    sourceLabel: sourceType === 'asset' ? '挂载素材' : '本地上传',
    type,
    title: item.title || fileName || '未命名附件',
    description: item.description || '',
    content: item.content || '',
    fileName,
    fileSize: Number(item.fileSize || 0),
    uploadTime: item.uploadTime,
    previewUrl: hasFile ? buildPortalPrepAttachmentFileUrl(Number(item.id)) : '',
    downloadUrl: hasFile ? buildPortalPrepAttachmentDownloadUrl(Number(item.id)) : '',
  }
}

async function getPortalPrepAttachmentMap(prepIds) {
  if (!prepIds.length || !(await hasTeachingPrepAttachmentReady())) {
    return new Map()
  }

  const placeholders = prepIds.map(() => '?').join(', ')
  const [rows] = await pool.query(
    `SELECT pa.attachment_id AS id,
            pa.prep_id AS prepId,
            pa.source_type AS sourceType,
            COALESCE(a.asset_type, '') AS assetType,
            COALESCE(a.asset_title, pa.file_name, '') AS title,
            COALESCE(a.asset_description, '') AS description,
            COALESCE(a.asset_content, '') AS content,
            COALESCE(a.file_name, pa.file_name, '') AS fileName,
            COALESCE(a.file_size, pa.file_size, 0) AS fileSize,
            COALESCE(pa.mime_type, '') AS mimeType,
            COALESCE(a.file_path, pa.file_path, '') AS storedPath,
            DATE_FORMAT(pa.create_time, '%Y-%m-%d') AS uploadTime
     FROM teaching_prep_attachment pa
     INNER JOIN teaching_prep p ON p.prep_id = pa.prep_id
     LEFT JOIN asset_library a ON a.asset_id = pa.asset_id AND a.status = 1
     WHERE pa.status = 1
       AND p.status = 'published'
       AND pa.prep_id IN (${placeholders})
       AND (pa.source_type = 'upload' OR a.asset_id IS NOT NULL)
     ORDER BY pa.sort_order ASC, pa.attachment_id ASC`,
    prepIds,
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

    attachmentMap.get(prepId)?.push(mapPortalPrepAttachmentItem(row))
  }

  return attachmentMap
}

export async function getPortalHomeData() {
  const heroTitleSupported = await getSystemHeroTitleSchemaSupport()
  const [profiles] = await pool.query(
    `SELECT system_name,
            ${heroTitleSupported ? `COALESCE(hero_title, '') AS hero_title,` : ''}
            system_intro
     FROM system_profile
     ORDER BY update_time DESC
     LIMIT 1`,
  )

  const [notices] = await pool.query(
    `SELECT notice_id AS id, notice_title AS title, notice_content AS content,
            DATE_FORMAT(publish_time, '%Y-%m-%d') AS publishDate
     FROM notice
     WHERE status = 1
     ORDER BY publish_time DESC
     LIMIT 3`,
  )

  const [courses] = await pool.query(
    `SELECT c.course_id AS id, c.course_name AS name,
            COALESCE(c.course_summary, '暂无课程简介') AS summary,
            COALESCE(t.teacher_name, t.username, '未署名教师') AS teacherName
     FROM course_intro c
     LEFT JOIN teacher_user t ON t.teacher_id = c.teacher_id
     WHERE c.status = 1
     ORDER BY c.update_time DESC
     LIMIT 3`,
  )

  const [materials] = await pool.query(
    `SELECT m.material_id AS id, m.material_name AS name,
            COALESCE(c.course_name, '未关联课程') AS courseName,
            COALESCE(t.teacher_name, t.username, '未署名教师') AS teacherName,
            DATE_FORMAT(m.upload_time, '%Y-%m-%d') AS uploadDate
     FROM material m
     LEFT JOIN teacher_user t ON t.teacher_id = m.teacher_id
     LEFT JOIN course_intro c ON c.course_id = m.course_id
     WHERE m.status = 1
     ORDER BY m.upload_time DESC
     LIMIT 3`,
  )

  const [videos] = await pool.query(
    `SELECT v.video_id AS id, v.video_title AS title,
            COALESCE(c.course_name, '未关联课程') AS courseName,
            COALESCE(t.teacher_name, t.username, '未署名教师') AS teacherName,
            v.duration AS duration,
            DATE_FORMAT(v.upload_time, '%Y-%m-%d') AS uploadDate
     FROM course_video v
     LEFT JOIN teacher_user t ON t.teacher_id = v.teacher_id
     LEFT JOIN course_intro c ON c.course_id = v.course_id
     WHERE v.status = 1
     ORDER BY v.upload_time DESC
     LIMIT 3`,
  )

  const [statRows] = await pool.query(
    `SELECT
        (SELECT COUNT(*) FROM course_intro WHERE status = 1) AS courseCount,
        (SELECT COUNT(*) FROM material WHERE status = 1) AS materialCount,
        (SELECT COUNT(*) FROM course_video WHERE status = 1) AS videoCount`,
  )

  const profileRow = profiles[0]
  const statsRow = statRows[0] || {
    courseCount: 0,
    materialCount: 0,
    videoCount: 0,
  }

  logger.info('portal_home_loaded', {
    noticeCount: notices.length,
    courseCount: Number(statsRow.courseCount || 0),
    materialCount: Number(statsRow.materialCount || 0),
    videoCount: Number(statsRow.videoCount || 0),
  })

  return {
    profile: {
      systemName: profileRow?.system_name || DEFAULT_PROFILE.systemName,
      heroTitle: profileRow?.hero_title || DEFAULT_PROFILE.heroTitle,
      systemIntro: profileRow?.system_intro || DEFAULT_PROFILE.systemIntro,
    },
    notices,
    courses,
    materials,
    videos,
    stats: {
      courseCount: Number(statsRow.courseCount || 0),
      materialCount: Number(statsRow.materialCount || 0),
      videoCount: Number(statsRow.videoCount || 0),
    },
  }
}

export async function getPortalCourseListData(query) {
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
    sort === 'time-asc'
      ? 'c.update_time ASC, c.course_id ASC'
      : 'c.update_time DESC, c.course_id DESC'

  const [list] = await pool.query(
    `SELECT c.course_id AS id,
            c.course_name AS name,
            COALESCE(c.course_summary, '暂无课程简介') AS summary,
            COALESCE(col.college_name, '未关联学院') AS collegeName,
            COALESCE(t.teacher_name, t.username, '未署名教师') AS teacherName,
            COALESCE(video_stats.videoCount, 0) AS videoCount,
            COALESCE(material_stats.materialCount, 0) AS materialCount,
            DATE_FORMAT(c.update_time, '%Y-%m-%d') AS updateDate
     FROM course_intro c
     LEFT JOIN college col ON col.college_id = c.college_id
     LEFT JOIN teacher_user t ON t.teacher_id = c.teacher_id
     LEFT JOIN (
       SELECT course_id, COUNT(*) AS videoCount
       FROM course_video
       WHERE status = 1
       GROUP BY course_id
     ) video_stats ON video_stats.course_id = c.course_id
     LEFT JOIN (
       SELECT course_id, COUNT(*) AS materialCount
       FROM material
       WHERE status = 1
       GROUP BY course_id
     ) material_stats ON material_stats.course_id = c.course_id
     WHERE ${whereSql}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  )

  const [colleges] = await pool.query(
    `SELECT col.college_id AS id, col.college_name AS name
     FROM college col
     ORDER BY col.college_name ASC`,
  )

  logger.info('portal_course_list_loaded', {
    keyword,
    collegeId,
    sort,
    page,
    pageSize,
    total,
    resultCount: list.length,
  })

  return {
    list,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
    filters: {
      colleges,
    },
  }
}

export async function getPortalPublicAssetListData(query) {
  await ensureAssetLibraryVisibilityReady()

  const keyword = normalizeKeyword(query.keyword)
  const type = normalizePublicAssetType(query.type)
  const requestedPage = normalizePageNumber(query.page)
  const pageSize = normalizePageSize(query.pageSize)
  const params = []
  let whereSql = `a.status = 1 AND COALESCE(a.visibility, 'private') = 'public'`

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
      OR COALESCE(t.teacher_name, '') LIKE ?
      OR COALESCE(t.username, '') LIKE ?
    )`
    params.push(keywordPattern, keywordPattern, keywordPattern, keywordPattern, keywordPattern)
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
            COALESCE(a.visibility, 'public') AS visibility,
            a.asset_title AS title,
            COALESCE(a.asset_description, '') AS description,
            COALESCE(a.asset_content, '') AS content,
            COALESCE(a.file_name, '') AS fileName,
            COALESCE(a.file_size, 0) AS fileSize,
            DATE_FORMAT(a.create_time, '%Y-%m-%d') AS uploadTime,
            COALESCE(NULLIF(t.teacher_name, ''), t.username, '未署名教师') AS teacherName
     FROM asset_library a
     LEFT JOIN teacher_user t ON t.teacher_id = a.teacher_id
     WHERE ${whereSql}
     ORDER BY a.update_time DESC, a.asset_id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  )

  const [statsRows] = await pool.query(
    `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN asset_type = 'image' THEN 1 ELSE 0 END) AS imageCount,
        SUM(CASE WHEN asset_type IN ('audio', 'video') THEN 1 ELSE 0 END) AS mediaCount,
        SUM(CASE WHEN asset_type = 'text' THEN 1 ELSE 0 END) AS contentCount
     FROM asset_library
     WHERE status = 1 AND COALESCE(visibility, 'private') = 'public'`,
  )

  logger.info('portal_public_asset_list_loaded', {
    keyword,
    type,
    page,
    pageSize,
    total,
    resultCount: listRows.length,
  })

  return {
    stats: {
      total: Number(statsRows[0]?.total || 0),
      imageCount: Number(statsRows[0]?.imageCount || 0),
      mediaCount: Number(statsRows[0]?.mediaCount || 0),
      contentCount: Number(statsRows[0]?.contentCount || 0),
    },
    list: listRows.map((item) => ({
      id: Number(item.id),
      type: item.type,
      visibility: item.visibility,
      title: item.title,
      description: item.description || '',
      content: item.content || '',
      fileName: item.fileName || '',
      fileSize: Number(item.fileSize || 0),
      uploadTime: item.uploadTime,
      teacherName: item.teacherName,
      previewUrl: item.fileName ? `/portal/assets/${Number(item.id)}/file` : '',
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  }
}

export async function getPortalCourseDetailData(courseIdValue) {
  const courseId = normalizeCourseId(courseIdValue)

  const [courseRows] = await pool.query(
    `SELECT c.course_id AS id,
            c.course_name AS name,
            COALESCE(c.course_summary, '暂无课程简介') AS summary,
            COALESCE(col.college_name, '未关联学院') AS collegeName,
            COALESCE(t.teacher_name, t.username, '未署名教师') AS teacherName,
            DATE_FORMAT(c.update_time, '%Y-%m-%d') AS updateDate
     FROM course_intro c
     LEFT JOIN college col ON col.college_id = c.college_id
     LEFT JOIN teacher_user t ON t.teacher_id = c.teacher_id
     WHERE c.course_id = ? AND c.status = 1
     LIMIT 1`,
    [courseId],
  )

  const course = courseRows[0]
  if (!course) {
    logger.warn('portal_course_detail_missing', { courseId })
    throw notFound('课程不存在或已下线')
  }

  const [materials] = await pool.query(
    `SELECT m.material_id AS id,
            m.material_name AS name,
            COALESCE(t.teacher_name, t.username, '未署名教师') AS teacherName,
            DATE_FORMAT(m.upload_time, '%Y-%m-%d') AS uploadDate
     FROM material m
     LEFT JOIN teacher_user t ON t.teacher_id = m.teacher_id
     WHERE m.course_id = ? AND m.status = 1
     ORDER BY m.upload_time DESC, m.material_id DESC`,
    [courseId],
  )

  const materialList = materials.map((item) => ({
    ...item,
    downloadUrl: `/portal/materials/${item.id}/download`,
  }))

  const [videos] = await pool.query(
    `SELECT v.video_id AS id,
            v.video_title AS title,
            COALESCE(t.teacher_name, t.username, '未署名教师') AS teacherName,
            DATE_FORMAT(v.upload_time, '%Y-%m-%d') AS uploadDate,
            v.duration AS duration
     FROM course_video v
     LEFT JOIN teacher_user t ON t.teacher_id = v.teacher_id
     WHERE v.course_id = ? AND v.status = 1
     ORDER BY v.upload_time DESC, v.video_id DESC`,
    [courseId],
  )

  const videoList = videos.map((item) => ({
    ...item,
    playUrl: `/portal/videos/${item.id}/play`,
  }))

  let prepList = []
  if (await hasTeachingPrepReady()) {
    const [prepRows] = await pool.query(
      `SELECT p.prep_id AS id,
              p.teacher_id AS teacherId,
              p.course_id AS courseId,
              p.prep_title AS title,
              COALESCE(p.teaching_content, '') AS teachingContent,
              p.status AS status,
              DATE_FORMAT(p.create_time, '%Y-%m-%d') AS createTime,
              DATE_FORMAT(p.update_time, '%Y-%m-%d') AS updateTime,
              COALESCE(t.teacher_name, t.username, '未署名教师') AS teacherName
       FROM teaching_prep p
       LEFT JOIN teacher_user t ON t.teacher_id = p.teacher_id
       WHERE p.course_id = ? AND p.status = 'published'
       ORDER BY p.update_time DESC, p.prep_id DESC`,
      [courseId],
    )

    const attachmentMap = await getPortalPrepAttachmentMap(prepRows.map((item) => Number(item.id)))
    prepList = prepRows.map((item) => {
      const prepId = Number(item.id)
      const attachments = attachmentMap.get(prepId) || []

      return {
        id: prepId,
        teacherId: Number(item.teacherId || 0),
        courseId: Number(item.courseId || 0),
        title: item.title,
        teachingContent: item.teachingContent || '',
        teacherName: item.teacherName,
        status: item.status,
        createTime: item.createTime,
        updateTime: item.updateTime,
        attachmentCount: attachments.length,
        attachments,
      }
    })
  }

  logger.info('portal_course_detail_loaded', {
    courseId,
    materialCount: materials.length,
    videoCount: videos.length,
    prepCount: prepList.length,
  })

  return {
    course,
    materials: materialList,
    videos: videoList,
    preps: prepList,
  }
}

export async function getPortalCourseAssetsData(courseIdValue) {
  const courseId = normalizeCourseId(courseIdValue)
  await ensureAssetLibraryReady()

  const [rows] = await pool.query(
    `SELECT a.asset_id AS id,
            a.asset_type AS type,
            a.asset_title AS title,
            COALESCE(a.asset_description, '') AS description,
            COALESCE(a.asset_content, '') AS content,
            COALESCE(a.file_name, '') AS fileName,
            COALESCE(a.file_size, 0) AS fileSize,
            DATE_FORMAT(a.create_time, '%Y-%m-%d') AS uploadTime,
            COALESCE(t.teacher_name, t.username, '未命名教师') AS teacherName
     FROM asset_library a
     LEFT JOIN teacher_user t ON t.teacher_id = a.teacher_id
     INNER JOIN course_intro c ON c.course_id = a.course_id AND c.status = 1
     WHERE a.course_id = ? AND a.status = 1
     ORDER BY a.update_time DESC, a.asset_id DESC`,
    [courseId],
  )

  logger.info('portal_course_assets_loaded', {
    courseId,
    assetCount: rows.length,
  })

  return {
    list: rows.map((item) => ({
      id: Number(item.id),
      type: item.type,
      title: item.title,
      description: item.description || '',
      content: item.content || '',
      fileName: item.fileName || '',
      fileSize: Number(item.fileSize || 0),
      uploadTime: item.uploadTime,
      teacherName: item.teacherName,
      previewUrl: item.fileName ? `/portal/assets/${Number(item.id)}/file` : '',
    })),
  }
}

async function getPortalMaterialFileSource(materialIdValue) {
  const materialId = normalizeCourseId(materialIdValue, '资料')

  const [rows] = await pool.query(
    `SELECT m.material_id AS id,
            m.course_id AS courseId,
            m.material_name AS name,
            COALESCE(NULLIF(m.file_name, ''), m.material_name) AS fileName,
            m.file_path AS storedPath
     FROM material m
     INNER JOIN course_intro c ON c.course_id = m.course_id AND c.status = 1
     WHERE m.material_id = ? AND m.status = 1
     LIMIT 1`,
    [materialId],
  )

  const material = rows[0]
  if (!material) {
    logger.warn('portal_material_missing', { materialId })
    throw notFound('资料不存在或已下线')
  }

  const resolvedPath = resolveStoredFilePath(material.storedPath)
  if (!resolvedPath) {
    logger.warn('portal_material_file_missing', {
      materialId,
      courseId: material.courseId,
      storedPath: material.storedPath,
    })
    throw notFound('资料文件不存在')
  }

  return {
    materialId,
    courseId: material.courseId,
    filePath: resolvedPath,
    fileName: material.fileName || path.basename(resolvedPath),
  }
}

async function getPortalAssetFileSource(assetIdValue) {
  const assetId = normalizeCourseId(assetIdValue, '绱犳潗')
  await ensureAssetLibraryVisibilityReady()

  const [rows] = await pool.query(
    `SELECT a.asset_id AS id,
            a.course_id AS courseId,
            a.asset_type AS type,
            COALESCE(a.file_name, a.asset_title) AS fileName,
            a.file_path AS storedPath
     FROM asset_library a
     WHERE a.asset_id = ?
       AND a.status = 1
       AND COALESCE(a.visibility, 'private') = 'public'
     LIMIT 1`,
    [assetId],
  )

  const asset = rows[0]
  if (!asset) {
    logger.warn('portal_asset_missing', { assetId })
    throw notFound('\u7d20\u6750\u4e0d\u5b58\u5728\u6216\u5df2\u4e0b\u7ebf')
  }

  const resolvedPath = resolveStoredFilePath(asset.storedPath)
  if (!resolvedPath) {
    logger.warn('portal_asset_file_missing', {
      assetId,
      courseId: asset.courseId,
      storedPath: asset.storedPath,
    })
    throw notFound('\u7d20\u6750\u6587\u4ef6\u4e0d\u5b58\u5728')
  }

  return {
    assetId,
    courseId: asset.courseId,
    assetType: asset.type,
    filePath: resolvedPath,
    fileName: asset.fileName || path.basename(resolvedPath),
  }
}

async function getPortalPrepAttachmentFileSource(attachmentIdValue) {
  const attachmentId = normalizeCourseId(attachmentIdValue, '澶囪闄勪欢')

  if (!(await hasTeachingPrepAttachmentReady()) || !(await hasTeachingPrepReady())) {
    throw notFound('澶囪闄勪欢涓嶅瓨鍦ㄦ垨鏈垵濮嬪寲')
  }

  const [rows] = await pool.query(
    `SELECT pa.attachment_id AS id,
            pa.source_type AS sourceType,
            COALESCE(pa.file_path, '') AS uploadStoredPath,
            COALESCE(pa.file_name, '') AS uploadFileName,
            COALESCE(pa.mime_type, '') AS uploadMimeType,
            p.prep_id AS prepId,
            p.course_id AS courseId,
            COALESCE(a.asset_id, 0) AS assetId,
            COALESCE(a.asset_type, '') AS assetType,
            COALESCE(a.file_path, '') AS assetStoredPath,
            COALESCE(a.file_name, '') AS assetFileName
     FROM teaching_prep_attachment pa
     INNER JOIN teaching_prep p ON p.prep_id = pa.prep_id
     LEFT JOIN asset_library a ON a.asset_id = pa.asset_id AND a.status = 1
     INNER JOIN course_intro c ON c.course_id = p.course_id AND c.status = 1
     WHERE pa.attachment_id = ?
       AND pa.status = 1
       AND p.status = 'published'
       AND (pa.source_type = 'upload' OR a.asset_id IS NOT NULL)
     LIMIT 1`,
    [attachmentId],
  )

  const attachment = rows[0]
  if (!attachment) {
    logger.warn('portal_prep_attachment_missing', { attachmentId })
    throw notFound('\u5907\u8bfe\u9644\u4ef6\u4e0d\u5b58\u5728\u6216\u5df2\u4e0b\u7ebf')
  }

  const storedPath =
    attachment.sourceType === 'asset' ? attachment.assetStoredPath : attachment.uploadStoredPath
  const fileName =
    attachment.sourceType === 'asset'
      ? attachment.assetFileName || attachment.uploadFileName
      : attachment.uploadFileName
  const mimeType = attachment.sourceType === 'asset' ? '' : attachment.uploadMimeType
  const assetType = attachment.sourceType === 'asset' ? attachment.assetType : 'file'
  const resolvedPath = resolveStoredFilePath(storedPath)
  if (!resolvedPath) {
    logger.warn('portal_prep_attachment_file_missing', {
      attachmentId,
      prepId: attachment.prepId,
      courseId: attachment.courseId,
      storedPath,
    })
    throw notFound('\u5907\u8bfe\u9644\u4ef6\u6587\u4ef6\u4e0d\u5b58\u5728')
  }

  return {
    attachmentId,
    prepId: attachment.prepId,
    courseId: attachment.courseId,
    sourceType: attachment.sourceType,
    assetType,
    mimeType,
    filePath: resolvedPath,
    fileName: fileName || path.basename(resolvedPath),
  }
}

export async function getPortalMaterialDownloadData(materialIdValue) {
  const material = await getPortalMaterialFileSource(materialIdValue)

  await pool.query('UPDATE material SET download_count = download_count + 1 WHERE material_id = ?', [material.materialId])

  logger.info('portal_material_download_ready', {
    materialId: material.materialId,
    courseId: material.courseId,
  })

  return {
    filePath: material.filePath,
    downloadName: material.fileName,
  }
}

export async function getPortalMaterialFileData(materialIdValue) {
  const material = await getPortalMaterialFileSource(materialIdValue)

  logger.info('portal_material_file_ready', {
    materialId: material.materialId,
    courseId: material.courseId,
  })

  return preparePreviewFile({
    resolvedPath: material.filePath,
    fileName: material.fileName,
    assetType: 'file',
    cacheRoot: officePreviewCacheRoot,
  })
}

export async function getPortalAssetFileData(assetIdValue) {
  const assetSource = await getPortalAssetFileSource(assetIdValue)

  logger.info('portal_asset_file_ready', {
    assetId: assetSource.assetId,
    courseId: assetSource.courseId,
    type: assetSource.assetType,
  })

  return preparePreviewFile({
    resolvedPath: assetSource.filePath,
    fileName: assetSource.fileName,
    assetType: assetSource.assetType,
    cacheRoot: officePreviewCacheRoot,
  })
  const assetId = normalizeCourseId(assetIdValue, '素材')
  await ensureAssetLibraryVisibilityReady()

  const [rows] = await pool.query(
    `SELECT a.asset_id AS id,
            a.course_id AS courseId,
            a.asset_type AS type,
            COALESCE(a.file_name, a.asset_title) AS fileName,
            a.file_path AS storedPath
     FROM asset_library a
     WHERE a.asset_id = ?
       AND a.status = 1
       AND COALESCE(a.visibility, 'private') = 'public'
     LIMIT 1`,
    [assetId],
  )

  const asset = rows[0]
  if (!asset) {
    logger.warn('portal_asset_missing', { assetId })
    throw notFound('素材不存在或已下线')
  }

  const resolvedPath = resolveStoredFilePath(asset.storedPath)
  if (!resolvedPath) {
    logger.warn('portal_asset_file_missing', {
      assetId,
      courseId: asset.courseId,
      storedPath: asset.storedPath,
    })
    throw notFound('素材文件不存在')
  }

  logger.info('portal_asset_file_ready', {
    assetId,
    courseId: asset.courseId,
    type: asset.type,
  })

  return preparePreviewFile({
    resolvedPath,
    fileName: asset.fileName || path.basename(resolvedPath),
    assetType: asset.type,
    cacheRoot: officePreviewCacheRoot,
  })
}

export async function getPortalPrepAttachmentFileData(attachmentIdValue) {
  const attachmentSource = await getPortalPrepAttachmentFileSource(attachmentIdValue)

  logger.info('portal_prep_attachment_file_ready', {
    attachmentId: attachmentSource.attachmentId,
    prepId: attachmentSource.prepId,
    courseId: attachmentSource.courseId,
    sourceType: attachmentSource.sourceType,
  })

  return preparePreviewFile({
    resolvedPath: attachmentSource.filePath,
    fileName: attachmentSource.fileName,
    mimeType: attachmentSource.mimeType,
    assetType: attachmentSource.assetType,
    cacheRoot: officePreviewCacheRoot,
  })
  const attachmentId = normalizeCourseId(attachmentIdValue, '备课附件')

  if (!(await hasTeachingPrepAttachmentReady()) || !(await hasTeachingPrepReady())) {
    throw notFound('备课附件不存在或未初始化')
  }

  const [rows] = await pool.query(
    `SELECT pa.attachment_id AS id,
            pa.source_type AS sourceType,
            COALESCE(pa.file_path, '') AS uploadStoredPath,
            COALESCE(pa.file_name, '') AS uploadFileName,
            COALESCE(pa.mime_type, '') AS uploadMimeType,
            p.prep_id AS prepId,
            p.course_id AS courseId,
            COALESCE(a.asset_id, 0) AS assetId,
            COALESCE(a.asset_type, '') AS assetType,
            COALESCE(a.file_path, '') AS assetStoredPath,
            COALESCE(a.file_name, '') AS assetFileName
     FROM teaching_prep_attachment pa
     INNER JOIN teaching_prep p ON p.prep_id = pa.prep_id
     LEFT JOIN asset_library a ON a.asset_id = pa.asset_id AND a.status = 1
     INNER JOIN course_intro c ON c.course_id = p.course_id AND c.status = 1
     WHERE pa.attachment_id = ?
       AND pa.status = 1
       AND p.status = 'published'
       AND (pa.source_type = 'upload' OR a.asset_id IS NOT NULL)
     LIMIT 1`,
    [attachmentId],
  )

  const attachment = rows[0]
  if (!attachment) {
    logger.warn('portal_prep_attachment_missing', { attachmentId })
    throw notFound('备课附件不存在或已下线')
  }

  const storedPath =
    attachment.sourceType === 'asset' ? attachment.assetStoredPath : attachment.uploadStoredPath
  const fileName =
    attachment.sourceType === 'asset'
      ? attachment.assetFileName || attachment.uploadFileName
      : attachment.uploadFileName
  const mimeType = attachment.sourceType === 'asset' ? '' : attachment.uploadMimeType
  const resolvedPath = resolveStoredFilePath(storedPath)
  if (!resolvedPath) {
    logger.warn('portal_prep_attachment_file_missing', {
      attachmentId,
      prepId: attachment.prepId,
      courseId: attachment.courseId,
      storedPath,
    })
    throw notFound('备课附件文件不存在')
  }

  logger.info('portal_prep_attachment_file_ready', {
    attachmentId,
    prepId: attachment.prepId,
    courseId: attachment.courseId,
    sourceType: attachment.sourceType,
  })

  return preparePreviewFile({
    resolvedPath,
    fileName: fileName || path.basename(resolvedPath),
    mimeType,
    assetType: attachment.assetType,
    cacheRoot: officePreviewCacheRoot,
  })
}

export async function getPortalAssetDownloadData(assetIdValue) {
  const asset = await getPortalAssetFileSource(assetIdValue)

  logger.info('portal_asset_download_ready', {
    assetId: asset.assetId,
    courseId: asset.courseId,
    type: asset.assetType,
  })

  return {
    filePath: asset.filePath,
    fileName: asset.fileName,
  }
}

export async function getPortalPrepAttachmentDownloadData(attachmentIdValue) {
  const attachment = await getPortalPrepAttachmentFileSource(attachmentIdValue)

  logger.info('portal_prep_attachment_download_ready', {
    attachmentId: attachment.attachmentId,
    prepId: attachment.prepId,
    courseId: attachment.courseId,
    sourceType: attachment.sourceType,
  })

  return {
    filePath: attachment.filePath,
    fileName: attachment.fileName,
  }
}

export async function getPortalVideoPlayData(videoIdValue) {
  const videoId = normalizeCourseId(videoIdValue, '视频')

  const [rows] = await pool.query(
    `SELECT v.video_id AS id,
            v.course_id AS courseId,
            v.video_title AS title,
            v.video_path AS storedPath
     FROM course_video v
     INNER JOIN course_intro c ON c.course_id = v.course_id AND c.status = 1
     WHERE v.video_id = ? AND v.status = 1
     LIMIT 1`,
    [videoId],
  )

  const video = rows[0]
  if (!video) {
    logger.warn('portal_video_missing', { videoId })
    throw notFound('视频不存在或已下线')
  }

  const resolvedPath = resolveStoredFilePath(video.storedPath)
  if (!resolvedPath) {
    logger.warn('portal_video_file_missing', {
      videoId,
      courseId: video.courseId,
      storedPath: video.storedPath,
    })
    throw notFound('视频文件不存在')
  }

  await pool.query('UPDATE course_video SET play_count = play_count + 1 WHERE video_id = ?', [videoId])

  logger.info('portal_video_play_ready', {
    videoId,
    courseId: video.courseId,
  })

  return {
    filePath: resolvedPath,
    fileName: `${video.title || 'video'}${path.extname(resolvedPath)}`,
  }
}
