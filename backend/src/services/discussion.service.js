import { pool } from '../config/db.js'
import { logger } from '../utils/logger.js'

const DEFAULT_PAGE_SIZE = 6
const MAX_PAGE_SIZE = 12

let discussionSchemaSupportPromise = null

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

function normalizeReplyId(value) {
  const replyId = Number(value)
  if (!Number.isInteger(replyId) || replyId <= 0) {
    throw badRequest('回复ID不合法')
  }

  return replyId
}

function normalizeParentReplyId(value) {
  if (value === undefined || value === null || value === '') {
    return null
  }

  return normalizeReplyId(value)
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

function formatDate(value) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date(value))
    .replace(/\//g, '-')
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

async function getDiscussionSchemaSupport() {
  if (!discussionSchemaSupportPromise) {
    discussionSchemaSupportPromise = (async () => {
      const [topicColumns] = await pool.query(
        `SELECT COLUMN_NAME AS columnName, IS_NULLABLE AS isNullable
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'message_topic'
           AND COLUMN_NAME IN ('teacher_id', 'admin_id')`,
      )

      const [replyColumns] = await pool.query(
        `SELECT COLUMN_NAME AS columnName, IS_NULLABLE AS isNullable
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'message_topic_reply'
           AND COLUMN_NAME IN ('teacher_id', 'admin_id', 'parent_reply_id')`,
      )

      const topicTeacherIdColumn = topicColumns.find((item) => item.columnName === 'teacher_id')
      const topicAdminIdColumn = topicColumns.find((item) => item.columnName === 'admin_id')
      const replyTeacherIdColumn = replyColumns.find((item) => item.columnName === 'teacher_id')
      const replyAdminIdColumn = replyColumns.find((item) => item.columnName === 'admin_id')
      const replyParentIdColumn = replyColumns.find((item) => item.columnName === 'parent_reply_id')

      return {
        topicAdminEnabled: Boolean(topicAdminIdColumn) && topicTeacherIdColumn?.isNullable === 'YES',
        replyAdminEnabled: Boolean(replyAdminIdColumn) && replyTeacherIdColumn?.isNullable === 'YES',
        replyParentEnabled: Boolean(replyParentIdColumn),
      }
    })()
  }

  return discussionSchemaSupportPromise
}

async function getTeacherIdentity(teacherId) {
  const [rows] = await pool.query(
    `SELECT teacher_id AS id,
            username,
            COALESCE(NULLIF(teacher_name, ''), username, '未署名教师') AS name
     FROM teacher_user
     WHERE teacher_id = ?
     LIMIT 1`,
    [teacherId],
  )

  if (!rows.length) {
    throw notFound('教师不存在')
  }

  return rows[0]
}

async function getAdminIdentity(adminId) {
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
    throw notFound('管理员不存在')
  }

  return rows[0]
}

function buildTopicAuthorNameExpression(schema) {
  if (schema.topicAdminEnabled) {
    return `COALESCE(
      NULLIF(t.teacher_name, ''),
      t.username,
      NULLIF(a.real_name, ''),
      a.admin_name,
      '未署名用户'
    )`
  }

  return `COALESCE(NULLIF(t.teacher_name, ''), t.username, '未署名教师')`
}

function buildTopicAuthorRoleExpression(schema) {
  return schema.topicAdminEnabled ? `CASE WHEN mt.admin_id IS NOT NULL THEN 'admin' ELSE 'teacher' END` : `'teacher'`
}

function buildTopicAuthorJoin(schema) {
  return schema.topicAdminEnabled ? `LEFT JOIN admin a ON a.admin_id = mt.admin_id` : ''
}

function buildReplyAuthorNameExpression(schema) {
  if (schema.replyAdminEnabled) {
    return `COALESCE(
      NULLIF(rt.teacher_name, ''),
      rt.username,
      NULLIF(ra.real_name, ''),
      ra.admin_name,
      '未署名用户'
    )`
  }

  return `COALESCE(NULLIF(rt.teacher_name, ''), rt.username, '未署名教师')`
}

function buildReplyAuthorRoleExpression(schema) {
  return schema.replyAdminEnabled ? `CASE WHEN r.admin_id IS NOT NULL THEN 'admin' ELSE 'teacher' END` : `'teacher'`
}

function buildReplyAuthorJoin(schema) {
  return schema.replyAdminEnabled ? `LEFT JOIN admin ra ON ra.admin_id = r.admin_id` : ''
}

function buildParentReplyAuthorNameExpression(schema) {
  if (schema.replyAdminEnabled) {
    return `COALESCE(
      NULLIF(pt.teacher_name, ''),
      pt.username,
      NULLIF(pa.real_name, ''),
      pa.admin_name,
      '未署名用户'
    )`
  }

  return `COALESCE(NULLIF(pt.teacher_name, ''), pt.username, '未署名教师')`
}

function buildParentReplyAuthorJoin(schema) {
  return schema.replyAdminEnabled ? `LEFT JOIN admin pa ON pa.admin_id = parent.admin_id` : ''
}

function buildTopicDeleteCapability(topic, viewerRole, viewerId) {
  if (viewerRole === 'admin') {
    return true
  }

  return topic.authorRole === 'teacher' && Number(topic.teacherId || 0) === Number(viewerId)
}

function buildReplyDeleteCapability(reply, viewerRole, viewerId) {
  if (viewerRole === 'admin') {
    return true
  }

  return reply.authorRole === 'teacher' && Number(reply.teacherId || 0) === Number(viewerId)
}

async function getTopicRow(messageId, schema) {
  const [rows] = await pool.query(
    `SELECT mt.topic_id AS id,
            mt.teacher_id AS teacherId,
            ${schema.topicAdminEnabled ? 'mt.admin_id AS adminId,' : 'NULL AS adminId,'}
            mt.title AS title,
            mt.content AS content,
            mt.status AS status,
            mt.create_time AS createTime,
            ${buildTopicAuthorNameExpression(schema)} AS authorName,
            ${buildTopicAuthorRoleExpression(schema)} AS authorRole
     FROM message_topic mt
     LEFT JOIN teacher_user t ON t.teacher_id = mt.teacher_id
     ${buildTopicAuthorJoin(schema)}
     WHERE mt.topic_id = ?
       AND mt.status <> 'archived'
     LIMIT 1`,
    [messageId],
  )

  if (!rows.length) {
    throw notFound('交流主题不存在或已删除')
  }

  return rows[0]
}

async function getReplyRow({ messageId, replyId, schema }) {
  const [rows] = await pool.query(
    `SELECT r.reply_id AS id,
            r.topic_id AS topicId,
            r.teacher_id AS teacherId,
            ${schema.replyAdminEnabled ? 'r.admin_id AS adminId,' : 'NULL AS adminId,'}
            ${schema.replyParentEnabled ? 'r.parent_reply_id AS parentReplyId,' : 'NULL AS parentReplyId,'}
            r.content AS content,
            ${buildReplyAuthorNameExpression(schema)} AS authorName,
            ${buildReplyAuthorRoleExpression(schema)} AS authorRole
     FROM message_topic_reply r
     LEFT JOIN teacher_user rt ON rt.teacher_id = r.teacher_id
     ${buildReplyAuthorJoin(schema)}
     WHERE r.reply_id = ?
       AND r.topic_id = ?
     LIMIT 1`,
    [replyId, messageId],
  )

  if (!rows.length) {
    throw notFound('回复不存在或已删除')
  }

  return rows[0]
}

async function ensureParentReply({ messageId, parentReplyId, schema }) {
  if (!parentReplyId) {
    return null
  }

  if (!schema.replyParentEnabled) {
    throw badRequest('当前数据库未启用楼中回复字段，请先升级 message_topic_reply 表结构')
  }

  return getReplyRow({ messageId, replyId: parentReplyId, schema })
}

async function touchTopic(messageId) {
  await pool.query(
    `UPDATE message_topic
     SET status = 'active', update_time = CURRENT_TIMESTAMP
     WHERE topic_id = ? AND status <> 'archived'`,
    [messageId],
  )
}

function mapTopicItem(topic, viewerRole, viewerId) {
  return {
    id: Number(topic.id),
    title: topic.title,
    summary: topic.summary,
    authorName: topic.authorName,
    authorRole: topic.authorRole,
    teacherId: topic.teacherId === null || topic.teacherId === undefined ? null : Number(topic.teacherId),
    adminId: topic.adminId === null || topic.adminId === undefined ? null : Number(topic.adminId),
    publishDate: topic.publishDate,
    lastReplyAt: topic.lastReplyAt,
    status: topic.status,
    statusLabel: getStatusLabel(topic.status),
    replyCount: Number(topic.replyCount || 0),
    canDelete: buildTopicDeleteCapability(topic, viewerRole, viewerId),
  }
}

function mapReplyItem(reply, viewerRole, viewerId) {
  return {
    id: Number(reply.id),
    content: reply.content,
    authorName: reply.authorName,
    authorRole: reply.authorRole,
    teacherId: reply.teacherId === null || reply.teacherId === undefined ? null : Number(reply.teacherId),
    adminId: reply.adminId === null || reply.adminId === undefined ? null : Number(reply.adminId),
    replyTime: reply.replyTime,
    parentReplyId: reply.parentReplyId === null || reply.parentReplyId === undefined ? null : Number(reply.parentReplyId),
    parentAuthorName: reply.parentAuthorName || '',
    canDelete: buildReplyDeleteCapability(reply, viewerRole, viewerId),
  }
}

export async function getDiscussionMessageList({ viewerRole, viewerId, query }) {
  if (viewerRole === 'teacher') {
    await getTeacherIdentity(viewerId)
  } else {
    await getAdminIdentity(viewerId)
  }

  const schema = await getDiscussionSchemaSupport()
  const keyword = normalizeKeyword(query.keyword)
  const requestedPage = normalizePageNumber(query.page)
  const pageSize = normalizePageSize(query.pageSize)
  const params = []
  let keywordSql = ''

  if (keyword) {
    const keywordPattern = `%${keyword}%`
    keywordSql = ` AND (
      mt.title LIKE ?
      OR mt.content LIKE ?
      OR ${buildTopicAuthorNameExpression(schema)} LIKE ?
    )`
    params.push(keywordPattern, keywordPattern, keywordPattern)
  }

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM message_topic mt
     LEFT JOIN teacher_user t ON t.teacher_id = mt.teacher_id
     ${buildTopicAuthorJoin(schema)}
     WHERE mt.status <> 'archived'${keywordSql}`,
    params,
  )

  const total = Number(countRows[0]?.total || 0)
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages)
  const offset = (page - 1) * pageSize

  const [list] = await pool.query(
    `SELECT mt.topic_id AS id,
            mt.teacher_id AS teacherId,
            ${schema.topicAdminEnabled ? 'mt.admin_id AS adminId,' : 'NULL AS adminId,'}
            mt.title AS title,
            CASE
              WHEN CHAR_LENGTH(mt.content) > 92 THEN CONCAT(LEFT(mt.content, 92), '...')
              ELSE mt.content
            END AS summary,
            ${buildTopicAuthorNameExpression(schema)} AS authorName,
            ${buildTopicAuthorRoleExpression(schema)} AS authorRole,
            DATE_FORMAT(mt.create_time, '%Y-%m-%d') AS publishDate,
            DATE_FORMAT(COALESCE(lastReply.lastReplyAt, mt.update_time), '%Y-%m-%d') AS lastReplyAt,
            mt.status AS status,
            COALESCE(replyStats.replyCount, 0) AS replyCount
     FROM message_topic mt
     LEFT JOIN teacher_user t ON t.teacher_id = mt.teacher_id
     ${buildTopicAuthorJoin(schema)}
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

  logger.info('discussion_message_list_loaded', {
    viewerRole,
    viewerId,
    keyword,
    page,
    pageSize,
    total,
    resultCount: list.length,
  })

  return {
    list: list.map((item) => mapTopicItem(item, viewerRole, viewerId)),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  }
}

export async function createDiscussionTopic({ viewerRole, viewerId, payload }) {
  const title = normalizeTitle(payload.title)
  const content = normalizeContent(payload.content, '话题内容')
  const schema = await getDiscussionSchemaSupport()

  if (viewerRole === 'teacher') {
    const teacher = await getTeacherIdentity(viewerId)
    const [result] = await pool.query(
      schema.topicAdminEnabled
        ? `INSERT INTO message_topic (teacher_id, admin_id, title, content, status)
           VALUES (?, NULL, ?, ?, 'open')`
        : `INSERT INTO message_topic (teacher_id, title, content, status)
           VALUES (?, ?, ?, 'open')`,
      schema.topicAdminEnabled ? [viewerId, title, content] : [viewerId, title, content],
    )

    logger.info('discussion_topic_created', {
      viewerRole,
      viewerId,
      authorName: teacher.name,
      topicId: result.insertId,
    })

    return {
      id: Number(result.insertId),
      title,
    }
  }

  const admin = await getAdminIdentity(viewerId)

  if (!schema.topicAdminEnabled) {
    throw badRequest('当前数据库未启用管理员发帖字段，请先升级 message_topic 表结构')
  }

  const [result] = await pool.query(
    `INSERT INTO message_topic (teacher_id, admin_id, title, content, status)
     VALUES (NULL, ?, ?, ?, 'open')`,
    [viewerId, title, content],
  )

  logger.info('discussion_topic_created', {
    viewerRole,
    viewerId,
    authorName: admin.name,
    topicId: result.insertId,
  })

  return {
    id: Number(result.insertId),
    title,
  }
}

export async function getDiscussionMessageDetail({ viewerRole, viewerId, messageId }) {
  if (viewerRole === 'teacher') {
    await getTeacherIdentity(viewerId)
  } else {
    await getAdminIdentity(viewerId)
  }

  const schema = await getDiscussionSchemaSupport()
  const normalizedMessageId = normalizeMessageId(messageId)
  const topic = await getTopicRow(normalizedMessageId, schema)

  const [replies] = await pool.query(
    `SELECT r.reply_id AS id,
            r.teacher_id AS teacherId,
            ${schema.replyAdminEnabled ? 'r.admin_id AS adminId,' : 'NULL AS adminId,'}
            ${schema.replyParentEnabled ? 'r.parent_reply_id AS parentReplyId,' : 'NULL AS parentReplyId,'}
            r.content AS content,
            ${buildReplyAuthorNameExpression(schema)} AS authorName,
            ${buildReplyAuthorRoleExpression(schema)} AS authorRole,
            DATE_FORMAT(r.reply_time, '%Y-%m-%d %H:%i') AS replyTime,
            ${schema.replyParentEnabled ? `${buildParentReplyAuthorNameExpression(schema)} AS parentAuthorName` : `'' AS parentAuthorName`}
     FROM message_topic_reply r
     LEFT JOIN teacher_user rt ON rt.teacher_id = r.teacher_id
     ${buildReplyAuthorJoin(schema)}
     ${schema.replyParentEnabled ? 'LEFT JOIN message_topic_reply parent ON parent.reply_id = r.parent_reply_id' : ''}
     ${schema.replyParentEnabled ? 'LEFT JOIN teacher_user pt ON pt.teacher_id = parent.teacher_id' : ''}
     ${schema.replyParentEnabled ? buildParentReplyAuthorJoin(schema) : ''}
     WHERE r.topic_id = ?
     ORDER BY ${schema.replyParentEnabled ? 'COALESCE(r.parent_reply_id, r.reply_id)' : 'r.reply_id'} ASC, r.reply_time ASC, r.reply_id ASC`,
     [normalizedMessageId],
   )

  logger.info('discussion_message_detail_loaded', {
    viewerRole,
    viewerId,
    topicId: normalizedMessageId,
    replyCount: replies.length,
  })

  return {
    topic: {
      id: Number(topic.id),
      title: topic.title,
      content: topic.content,
      teacherId: topic.teacherId === null || topic.teacherId === undefined ? null : Number(topic.teacherId),
      adminId: topic.adminId === null || topic.adminId === undefined ? null : Number(topic.adminId),
      authorName: topic.authorName,
      authorRole: topic.authorRole,
      publishDate: formatDate(topic.createTime),
      statusLabel: getStatusLabel(topic.status),
      canDelete: buildTopicDeleteCapability(topic, viewerRole, viewerId),
    },
    replies: replies.map((item) => mapReplyItem(item, viewerRole, viewerId)),
    capabilities: {
      canCreateTopic: viewerRole === 'teacher' || schema.topicAdminEnabled,
      canReply: viewerRole === 'teacher' || schema.replyAdminEnabled,
      canReplyToReply: schema.replyParentEnabled,
    },
  }
}

export async function createDiscussionReply({ viewerRole, viewerId, messageId, payload }) {
  const normalizedMessageId = normalizeMessageId(messageId)
  const content = normalizeContent(payload.content, '回复内容')
  const parentReplyId = normalizeParentReplyId(payload.parentReplyId)
  const schema = await getDiscussionSchemaSupport()

  if (viewerRole === 'teacher') {
    await getTeacherIdentity(viewerId)
  } else {
    await getAdminIdentity(viewerId)
  }

  await getTopicRow(normalizedMessageId, schema)

  if (parentReplyId) {
    await ensureParentReply({
      messageId: normalizedMessageId,
      parentReplyId,
      schema,
    })
  }

  if (viewerRole === 'admin' && !schema.replyAdminEnabled) {
    throw badRequest('当前数据库未启用管理员回复字段，请先升级 message_topic_reply 表结构')
  }

  const sql = schema.replyParentEnabled
    ? viewerRole === 'teacher'
      ? `INSERT INTO message_topic_reply (topic_id, teacher_id, ${schema.replyAdminEnabled ? 'admin_id, ' : ''}parent_reply_id, content)
         VALUES (?, ?, ${schema.replyAdminEnabled ? 'NULL, ' : ''}?, ?)`
      : `INSERT INTO message_topic_reply (topic_id, teacher_id, admin_id, parent_reply_id, content)
         VALUES (?, NULL, ?, ?, ?)`
    : viewerRole === 'teacher'
      ? `INSERT INTO message_topic_reply (topic_id, teacher_id, ${schema.replyAdminEnabled ? 'admin_id, ' : ''}content)
         VALUES (?, ?, ${schema.replyAdminEnabled ? 'NULL, ' : ''}?)`
      : `INSERT INTO message_topic_reply (topic_id, teacher_id, admin_id, content)
         VALUES (?, NULL, ?, ?)`

  const params =
    viewerRole === 'teacher'
      ? schema.replyParentEnabled
        ? [normalizedMessageId, viewerId, parentReplyId, content]
        : [normalizedMessageId, viewerId, content]
      : schema.replyParentEnabled
        ? [normalizedMessageId, viewerId, parentReplyId, content]
        : [normalizedMessageId, viewerId, content]

  const [result] = await pool.query(sql, params)

  await touchTopic(normalizedMessageId)

  logger.info('discussion_reply_created', {
    viewerRole,
    viewerId,
    topicId: normalizedMessageId,
    replyId: result.insertId,
    parentReplyId,
  })

  return {
    id: Number(result.insertId),
  }
}

export async function deleteDiscussionTopic({ viewerRole, viewerId, messageId }) {
  if (viewerRole === 'teacher') {
    await getTeacherIdentity(viewerId)
  } else {
    await getAdminIdentity(viewerId)
  }

  const schema = await getDiscussionSchemaSupport()
  const normalizedMessageId = normalizeMessageId(messageId)
  const topic = await getTopicRow(normalizedMessageId, schema)

  if (!buildTopicDeleteCapability(topic, viewerRole, viewerId)) {
    throw badRequest('你无权删除该交流主题')
  }

  await pool.query(
    `UPDATE message_topic
     SET status = 'archived', update_time = CURRENT_TIMESTAMP
     WHERE topic_id = ? AND status <> 'archived'`,
    [normalizedMessageId],
  )

  logger.info('discussion_topic_deleted', {
    viewerRole,
    viewerId,
    topicId: normalizedMessageId,
  })

  return {
    id: Number(topic.id),
    title: topic.title,
  }
}

export async function deleteDiscussionReply({ viewerRole, viewerId, messageId, replyId }) {
  if (viewerRole === 'teacher') {
    await getTeacherIdentity(viewerId)
  } else {
    await getAdminIdentity(viewerId)
  }

  const schema = await getDiscussionSchemaSupport()
  const normalizedMessageId = normalizeMessageId(messageId)
  const normalizedReplyId = normalizeReplyId(replyId)

  await getTopicRow(normalizedMessageId, schema)
  const reply = await getReplyRow({
    messageId: normalizedMessageId,
    replyId: normalizedReplyId,
    schema,
  })

  if (!buildReplyDeleteCapability(reply, viewerRole, viewerId)) {
    throw badRequest('你无权删除该回复')
  }

  if (schema.replyParentEnabled) {
    await pool.query(
      `UPDATE message_topic_reply
       SET parent_reply_id = NULL
       WHERE parent_reply_id = ?`,
      [normalizedReplyId],
    )
  }

  await pool.query(
    `DELETE FROM message_topic_reply
     WHERE reply_id = ? AND topic_id = ?`,
    [normalizedReplyId, normalizedMessageId],
  )

  await touchTopic(normalizedMessageId)

  logger.info('discussion_reply_deleted', {
    viewerRole,
    viewerId,
    topicId: normalizedMessageId,
    replyId: normalizedReplyId,
  })

  return {
    id: Number(reply.id),
  }
}
