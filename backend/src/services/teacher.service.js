import { pool } from '../config/db.js'
import { logger } from '../utils/logger.js'

const DEFAULT_PAGE_SIZE = 6
const MAX_PAGE_SIZE = 12

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

function getStatusLabel(status) {
  if (status === 'archived') {
    return '已整理'
  }

  if (status === 'active') {
    return '持续交流'
  }

  return '讨论中'
}

async function getTeacherProfile(teacherId) {
  const [rows] = await pool.query(
    `SELECT teacher_id AS id,
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
