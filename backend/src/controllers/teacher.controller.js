import {
  createTeacherMaterial,
  createTeacherMessage,
  createTeacherMessageReply,
  createTeacherVideo,
  deleteTeacherResource,
  getTeacherCourseOptions,
  getTeacherDashboardData,
  getTeacherProfileDetail,
  getTeacherMessageDetail,
  getTeacherMessageList,
  getTeacherResourceDetail,
  getTeacherResourceList,
  updateTeacherProfileInfo,
  updateTeacherResource,
} from '../services/teacher.service.js'

export async function getDashboard(req, res, next) {
  try {
    const result = await getTeacherDashboardData(req.auth.userId)

    res.status(200).json({
      code: 200,
      message: '获取教师工作台成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getCourseOptions(req, res, next) {
  try {
    const result = await getTeacherCourseOptions(req.auth.userId)

    res.status(200).json({
      code: 200,
      message: '获取教师课程选项成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getProfile(req, res, next) {
  try {
    const result = await getTeacherProfileDetail(req.auth.userId)

    res.status(200).json({
      code: 200,
      message: '获取教师资料成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function updateProfile(req, res, next) {
  try {
    const result = await updateTeacherProfileInfo({
      teacherId: req.auth.userId,
      payload: req.body,
    })

    res.status(200).json({
      code: 200,
      message: '更新教师资料成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function postMaterial(req, res, next) {
  try {
    const result = await createTeacherMaterial({
      teacherId: req.auth.userId,
      payload: req.body,
      file: req.file,
    })

    res.status(201).json({
      code: 201,
      message: '上传资料成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function postVideo(req, res, next) {
  try {
    const result = await createTeacherVideo({
      teacherId: req.auth.userId,
      payload: req.body,
      files: req.files,
    })

    res.status(201).json({
      code: 201,
      message: '上传视频成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}


export async function getResources(req, res, next) {
  try {
    const result = await getTeacherResourceList({
      teacherId: req.auth.userId,
      query: req.query,
    })

    res.status(200).json({
      code: 200,
      message: '获取我的资源成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getResourceDetail(req, res, next) {
  try {
    const result = await getTeacherResourceDetail({
      teacherId: req.auth.userId,
      type: req.params.type,
      resourceId: req.params.resourceId,
    })

    res.status(200).json({
      code: 200,
      message: '获取资源详情成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function updateResource(req, res, next) {
  try {
    const result = await updateTeacherResource({
      teacherId: req.auth.userId,
      type: req.params.type,
      resourceId: req.params.resourceId,
      payload: req.body,
    })

    res.status(200).json({
      code: 200,
      message: '更新资源成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function removeResource(req, res, next) {
  try {
    const result = await deleteTeacherResource({
      teacherId: req.auth.userId,
      type: req.params.type,
      resourceId: req.params.resourceId,
    })

    res.status(200).json({
      code: 200,
      message: '删除资源成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}
export async function getMessages(req, res, next) {
  try {
    const result = await getTeacherMessageList({
      teacherId: req.auth.userId,
      query: req.query,
    })

    res.status(200).json({
      code: 200,
      message: '获取交流主题成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function postMessage(req, res, next) {
  try {
    const result = await createTeacherMessage({
      teacherId: req.auth.userId,
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

export async function getMessageDetail(req, res, next) {
  try {
    const result = await getTeacherMessageDetail({
      teacherId: req.auth.userId,
      messageId: req.params.messageId,
    })

    res.status(200).json({
      code: 200,
      message: '获取交流详情成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function postMessageReply(req, res, next) {
  try {
    const result = await createTeacherMessageReply({
      teacherId: req.auth.userId,
      messageId: req.params.messageId,
      payload: req.body,
    })

    res.status(201).json({
      code: 201,
      message: '发布回复成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}
