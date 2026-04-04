import { pool } from '../config/db.js'
import { logger } from '../utils/logger.js'

const DEFAULT_PROFILE = {
  systemName: '在线教师备课系统',
  systemIntro: '围绕课程、资料与视频的统一备课平台，帮助教师快速进入课程浏览与资源查看主链路。',
}

export async function getPortalHomeData() {
  const [profiles] = await pool.query(
    `SELECT system_name, system_intro
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
