import {
  createAdminCollege,
  createAdminCourse,
  createAdminMessageReply,
  deleteAdminCollege,
  deleteAdminCourse,
  deleteAdminMessage,
  deleteAdminResource,
  getAdminCollegeList,
  getAdminCourseList,
  getAdminDashboardData,
  getAdminMessageDetail,
  getAdminMessageList,
  getAdminResourceList,
  updateAdminCollege,
  updateAdminCourse,
} from '../services/admin.service.js'

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
      type: 'material',
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
    const result = await getAdminMessageList({
      adminId: req.auth.userId,
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
    const result = await getAdminMessageDetail({
      adminId: req.auth.userId,
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

export async function postMessageReply(req, res, next) {
  try {
    const result = await createAdminMessageReply({
      adminId: req.auth.userId,
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
    const result = await deleteAdminMessage({
      adminId: req.auth.userId,
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
