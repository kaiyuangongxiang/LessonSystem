import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from '../config/db.js'
import { logger } from '../utils/logger.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(currentDir, '../../../')
const DEFAULT_PAGE_SIZE = 6
const MAX_PAGE_SIZE = 12
const MAX_DESCRIPTION_LENGTH = 2000

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

function extractFileFormat(fileName, fallback = '') {
  const extension = path.extname(String(fileName || '')).replace('.', '').trim().toUpperCase()
  return extension || fallback
}

function buildResourcePreviewUrl(type, resourceId) {
  return type === 'material' ? `/portal/materials/${resourceId}/download` : `/portal/videos/${resourceId}/play`
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

  const [statRows] = await pool.query(
    `SELECT
        (SELECT COUNT(*) FROM course_intro WHERE teacher_id = ? AND status = 1) AS courseCount,
        (SELECT COUNT(*) FROM material WHERE teacher_id = ? AND status = 1) AS materialCount,
        (SELECT COUNT(*) FROM course_video WHERE teacher_id = ? AND status = 1) AS videoCount,
        (SELECT COUNT(*) FROM message_topic WHERE teacher_id = ?) AS topicCount`,
    [teacherId, teacherId, teacherId, teacherId],
  )

  const [recentMaterials] = await pool.query(
    `SELECT m.material_id AS id,
            'material' AS type,
            m.material_name AS title,
            COALESCE(c.course_name, '未关联课程') AS courseName,
            DATE_FORMAT(m.upload_time, '%Y-%m-%d') AS uploadDate,
            m.upload_time AS sortTime
     FROM material m
     LEFT JOIN course_intro c ON c.course_id = m.course_id
     WHERE m.teacher_id = ? AND m.status = 1
     ORDER BY m.upload_time DESC, m.material_id DESC
     LIMIT 5`,
    [teacherId],
  )

  const [recentVideos] = await pool.query(
    `SELECT v.video_id AS id,
            'video' AS type,
            v.video_title AS title,
            COALESCE(c.course_name, '未关联课程') AS courseName,
            DATE_FORMAT(v.upload_time, '%Y-%m-%d') AS uploadDate,
            v.upload_time AS sortTime
     FROM course_video v
     LEFT JOIN course_intro c ON c.course_id = v.course_id
     WHERE v.teacher_id = ? AND v.status = 1
     ORDER BY v.upload_time DESC, v.video_id DESC
     LIMIT 5`,
    [teacherId],
  )

  const recentUploads = [...recentMaterials, ...recentVideos]
    .sort((left, right) => new Date(right.sortTime).getTime() - new Date(left.sortTime).getTime())
    .slice(0, 5)
    .map(({ sortTime, ...item }) => item)

  const [hotCourses] = await pool.query(
    `SELECT c.course_id AS id,
            c.course_name AS name,
            COALESCE(material_stats.materialCount, 0) AS materialCount,
            COALESCE(video_stats.videoCount, 0) AS videoCount
     FROM course_intro c
     LEFT JOIN (
       SELECT course_id, COUNT(*) AS materialCount
       FROM material
       WHERE teacher_id = ? AND status = 1
       GROUP BY course_id
     ) material_stats ON material_stats.course_id = c.course_id
     LEFT JOIN (
       SELECT course_id, COUNT(*) AS videoCount
       FROM course_video
       WHERE teacher_id = ? AND status = 1
       GROUP BY course_id
     ) video_stats ON video_stats.course_id = c.course_id
     WHERE c.teacher_id = ? AND c.status = 1
     ORDER BY (COALESCE(material_stats.materialCount, 0) + COALESCE(video_stats.videoCount, 0) * 2) DESC,
              c.update_time DESC,
              c.course_id DESC
     LIMIT 3`,
    [teacherId, teacherId, teacherId],
  )

  const [weeklyRows] = await pool.query(
    `SELECT
        (SELECT COUNT(*) FROM material WHERE teacher_id = ? AND status = 1 AND upload_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS materialCount,
        (SELECT COUNT(*) FROM course_video WHERE teacher_id = ? AND status = 1 AND upload_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS videoCount,
        (SELECT COUNT(*) FROM message_topic WHERE teacher_id = ? AND create_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS topicCount`,
    [teacherId, teacherId, teacherId],
  )

  const statsRow = statRows[0] || {
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

  logger.info('teacher_dashboard_loaded', {
    teacherId,
    courseCount: Number(statsRow.courseCount || 0),
    materialCount: Number(statsRow.materialCount || 0),
    videoCount: Number(statsRow.videoCount || 0),
    topicCount: Number(statsRow.topicCount || 0),
    recentUploadCount: recentUploads.length,
    hotCourseCount: hotCourses.length,
  })

  return {
    profile: {
      id: teacher.id,
      name: teacher.name,
      username: teacher.username,
    },
    stats: {
      courseCount: Number(statsRow.courseCount || 0),
      materialCount: Number(statsRow.materialCount || 0),
      videoCount: Number(statsRow.videoCount || 0),
      topicCount: Number(statsRow.topicCount || 0),
    },
    recentUploads,
    hotCourses: hotCourses.map((item) => ({
      ...item,
      materialCount: Number(item.materialCount || 0),
      videoCount: Number(item.videoCount || 0),
    })),
    weeklyActivity: {
      materialCount: Number(weeklyRow.materialCount || 0),
      videoCount: Number(weeklyRow.videoCount || 0),
      topicCount: Number(weeklyRow.topicCount || 0),
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
