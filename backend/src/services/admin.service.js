import { pool } from '../config/db.js'
import { logger } from '../utils/logger.js'

function notFound(message) {
  const error = new Error(message)
  error.status = 404
  return error
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

export async function getAdminDashboardData(adminId) {
  const admin = await getAdminProfile(adminId)

  const [statRows] = await pool.query(
    `SELECT
        (SELECT COUNT(*) FROM teacher_user WHERE status = 1) AS teacherCount,
        (SELECT COUNT(*) FROM course_intro WHERE status = 1) AS courseCount,
        (SELECT COUNT(*) FROM material WHERE status = 1) AS materialCount,
        (SELECT COUNT(*) FROM course_video WHERE status = 1) AS videoCount,
        (SELECT COUNT(*) FROM message_topic) AS topicCount`,
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
            COALESCE(reply_stats.replyCount, 0) AS replyCount,
            mt.update_time AS sortTime
     FROM message_topic mt
     LEFT JOIN teacher_user t ON t.teacher_id = mt.teacher_id
     LEFT JOIN (
       SELECT topic_id, COUNT(*) AS replyCount
       FROM message_topic_reply
       GROUP BY topic_id
     ) reply_stats ON reply_stats.topic_id = mt.topic_id
     ORDER BY mt.update_time DESC, mt.topic_id DESC
     LIMIT 5`,
  )

  const [weeklyRows] = await pool.query(
    `SELECT
        (SELECT COUNT(*) FROM material WHERE status = 1 AND upload_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS materialCount,
        (SELECT COUNT(*) FROM course_video WHERE status = 1 AND upload_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS videoCount,
        (SELECT COUNT(*) FROM message_topic WHERE create_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS topicCount`,
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
