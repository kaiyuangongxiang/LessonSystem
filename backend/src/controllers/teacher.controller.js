import {
  createTeacherMaterial,
  createTeacherMessage,
  createTeacherMessageReply,
  createTeacherVideo,
  getTeacherCourseOptions,
  getTeacherDashboardData,
  getTeacherMessageDetail,
  getTeacherMessageList,
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
