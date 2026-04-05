import {
  createAdminAccount,
  createAdminCollege,
  createAdminCourse,
  createAdminNotice,
  createAdminTeacherUser,
  createAdminStudentUser,
  deleteAdminAccount,
  deleteAdminCollege,
  deleteAdminCourse,
  deleteAdminNotice,
  deleteAdminResource,
  deleteAdminStudentUser,
  deleteAdminTeacherUser,
  getAdminAccountList,
  getAdminCollegeList,
  getAdminCourseList,
  getAdminDashboardData,
  getAdminResourceList,
  getAdminStudentUserList,
  getAdminSystemManageData,
  getAdminTeacherUserList,
  updateAdminNotice,
  updateAdminAccount,
  updateAdminCollege,
  updateAdminCourse,
  updateAdminStudentUser,
  updateAdminSystemProfile,
  updateAdminTeacherUser,
} from '../services/admin.service.js'
import {
  createDiscussionReply,
  createDiscussionTopic,
  deleteDiscussionReply,
  deleteDiscussionTopic,
  getDiscussionMessageDetail,
  getDiscussionMessageList,
} from '../services/discussion.service.js'

export async function getDashboard(req, res, next) {
  try {
    const result = await getAdminDashboardData(req.auth.userId)

    res.status(200).json({
      code: 200,
      message: '获取管理员工作台成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getSystemManage(req, res, next) {
  try {
    const result = await getAdminSystemManageData({
      adminId: req.auth.userId,
    })

    res.status(200).json({
      code: 200,
      message: '获取系统管理数据成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function updateSystemProfile(req, res, next) {
  try {
    const result = await updateAdminSystemProfile({
      adminId: req.auth.userId,
      payload: req.body,
    })

    res.status(200).json({
      code: 200,
      message: '更新系统介绍成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function createNotice(req, res, next) {
  try {
    const result = await createAdminNotice({
      adminId: req.auth.userId,
      payload: req.body,
    })

    res.status(201).json({
      code: 201,
      message: '创建公告成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function updateNotice(req, res, next) {
  try {
    const result = await updateAdminNotice({
      adminId: req.auth.userId,
      noticeId: req.params.noticeId,
      payload: req.body,
    })

    res.status(200).json({
      code: 200,
      message: '更新公告成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteNotice(req, res, next) {
  try {
    const result = await deleteAdminNotice({
      adminId: req.auth.userId,
      noticeId: req.params.noticeId,
    })

    res.status(200).json({
      code: 200,
      message: '删除公告成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getAdminList(req, res, next) {
  try {
    const result = await getAdminAccountList({
      adminId: req.auth.userId,
      query: req.query,
    })

    res.status(200).json({
      code: 200,
      message: '获取管理员账号列表成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function createAdmin(req, res, next) {
  try {
    const result = await createAdminAccount({
      adminId: req.auth.userId,
      payload: req.body,
    })

    res.status(201).json({
      code: 201,
      message: '创建管理员账号成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function updateAdmin(req, res, next) {
  try {
    const result = await updateAdminAccount({
      adminId: req.auth.userId,
      targetAdminId: req.params.adminId,
      payload: req.body,
    })

    res.status(200).json({
      code: 200,
      message: '更新管理员账号成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteAdmin(req, res, next) {
  try {
    const result = await deleteAdminAccount({
      adminId: req.auth.userId,
      targetAdminId: req.params.adminId,
    })

    res.status(200).json({
      code: 200,
      message: '删除管理员账号成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getTeacherUserList(req, res, next) {
  try {
    const result = await getAdminTeacherUserList({
      adminId: req.auth.userId,
      query: req.query,
    })

    res.status(200).json({
      code: 200,
      message: '获取教师用户列表成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function createTeacherUser(req, res, next) {
  try {
    const result = await createAdminTeacherUser({
      adminId: req.auth.userId,
      payload: req.body,
    })

    res.status(201).json({
      code: 201,
      message: '创建教师用户成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function updateTeacherUser(req, res, next) {
  try {
    const result = await updateAdminTeacherUser({
      adminId: req.auth.userId,
      teacherId: req.params.teacherId,
      payload: req.body,
    })

    res.status(200).json({
      code: 200,
      message: '更新教师用户成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteTeacherUser(req, res, next) {
  try {
    const result = await deleteAdminTeacherUser({
      adminId: req.auth.userId,
      teacherId: req.params.teacherId,
    })

    res.status(200).json({
      code: 200,
      message: '删除教师用户成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getStudentUserList(req, res, next) {
  try {
    const result = await getAdminStudentUserList({
      adminId: req.auth.userId,
      query: req.query,
    })

    res.status(200).json({
      code: 200,
      message: '获取学生用户列表成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function createStudentUser(req, res, next) {
  try {
    const result = await createAdminStudentUser({
      adminId: req.auth.userId,
      payload: req.body,
    })

    res.status(201).json({
      code: 201,
      message: '创建学生用户成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function updateStudentUser(req, res, next) {
  try {
    const result = await updateAdminStudentUser({
      adminId: req.auth.userId,
      studentId: req.params.studentId,
      payload: req.body,
    })

    res.status(200).json({
      code: 200,
      message: '更新学生用户成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteStudentUser(req, res, next) {
  try {
    const result = await deleteAdminStudentUser({
      adminId: req.auth.userId,
      studentId: req.params.studentId,
    })

    res.status(200).json({
      code: 200,
      message: '删除学生用户成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getCollegeList(req, res, next) {
  try {
    const result = await getAdminCollegeList({
      adminId: req.auth.userId,
      query: req.query,
    })

    res.status(200).json({
      code: 200,
      message: '获取学院管理列表成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function createCollege(req, res, next) {
  try {
    const result = await createAdminCollege({
      adminId: req.auth.userId,
      payload: req.body,
    })

    res.status(201).json({
      code: 201,
      message: '创建学院成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function updateCollege(req, res, next) {
  try {
    const result = await updateAdminCollege({
      adminId: req.auth.userId,
      collegeId: req.params.collegeId,
      payload: req.body,
    })

    res.status(200).json({
      code: 200,
      message: '更新学院成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteCollege(req, res, next) {
  try {
    const result = await deleteAdminCollege({
      adminId: req.auth.userId,
      collegeId: req.params.collegeId,
    })

    res.status(200).json({
      code: 200,
      message: '删除学院成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getCourseList(req, res, next) {
  try {
    const result = await getAdminCourseList({
      adminId: req.auth.userId,
      query: req.query,
    })

    res.status(200).json({
      code: 200,
      message: '获取课程管理列表成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function createCourse(req, res, next) {
  try {
    const result = await createAdminCourse({
      adminId: req.auth.userId,
      payload: req.body,
    })

    res.status(201).json({
      code: 201,
      message: '创建课程成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function updateCourse(req, res, next) {
  try {
    const result = await updateAdminCourse({
      adminId: req.auth.userId,
      courseId: req.params.courseId,
      payload: req.body,
    })

    res.status(200).json({
      code: 200,
      message: '更新课程成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteCourse(req, res, next) {
  try {
    const result = await deleteAdminCourse({
      adminId: req.auth.userId,
      courseId: req.params.courseId,
    })

    res.status(200).json({
      code: 200,
      message: '删除课程成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getMaterialList(req, res, next) {
  try {
    const result = await getAdminResourceList({
      adminId: req.auth.userId,
      type: 'all',
      query: req.query,
    })

    res.status(200).json({
      code: 200,
      message: '获取资料管理列表成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteMaterial(req, res, next) {
  try {
    const result = await deleteAdminResource({
      adminId: req.auth.userId,
      type: 'material',
      resourceId: req.params.materialId,
    })

    res.status(200).json({
      code: 200,
      message: '删除资料成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getVideoList(req, res, next) {
  try {
    const result = await getAdminResourceList({
      adminId: req.auth.userId,
      type: 'video',
      query: req.query,
    })

    res.status(200).json({
      code: 200,
      message: '获取视频管理列表成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteVideo(req, res, next) {
  try {
    const result = await deleteAdminResource({
      adminId: req.auth.userId,
      type: 'video',
      resourceId: req.params.videoId,
    })

    res.status(200).json({
      code: 200,
      message: '删除视频成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getMessageList(req, res, next) {
  try {
    const result = await getDiscussionMessageList({
      viewerRole: 'admin',
      viewerId: req.auth.userId,
      query: req.query,
    })

    res.status(200).json({
      code: 200,
      message: '获取交流管理列表成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getMessageDetail(req, res, next) {
  try {
    const result = await getDiscussionMessageDetail({
      viewerRole: 'admin',
      viewerId: req.auth.userId,
      messageId: req.params.messageId,
    })

    res.status(200).json({
      code: 200,
      message: '获取交流主题详情成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function createMessage(req, res, next) {
  try {
    const result = await createDiscussionTopic({
      viewerRole: 'admin',
      viewerId: req.auth.userId,
      payload: req.body,
    })

    res.status(201).json({
      code: 201,
      message: '发布交流主题成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function postMessageReply(req, res, next) {
  try {
    const result = await createDiscussionReply({
      viewerRole: 'admin',
      viewerId: req.auth.userId,
      messageId: req.params.messageId,
      payload: req.body,
    })

    res.status(201).json({
      code: 201,
      message: '发布管理员回复成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteMessage(req, res, next) {
  try {
    const result = await deleteDiscussionTopic({
      viewerRole: 'admin',
      viewerId: req.auth.userId,
      messageId: req.params.messageId,
    })

    res.status(200).json({
      code: 200,
      message: '删除交流主题成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteMessageReply(req, res, next) {
  try {
    const result = await deleteDiscussionReply({
      viewerRole: 'admin',
      viewerId: req.auth.userId,
      messageId: req.params.messageId,
      replyId: req.params.replyId,
    })

    res.status(200).json({
      code: 200,
      message: '删除回复成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}
