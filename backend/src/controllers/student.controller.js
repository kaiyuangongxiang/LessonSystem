import {
  createDiscussionTopic,
  createDiscussionReply,
  deleteDiscussionReply,
  deleteDiscussionTopic,
  getDiscussionMessageDetail,
  getDiscussionMessageList,
} from '../services/discussion.service.js'

export async function getMessages(req, res, next) {
  try {
    const result = await getDiscussionMessageList({
      viewerRole: 'student',
      viewerId: req.auth.userId,
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

export async function getMessageDetail(req, res, next) {
  try {
    const result = await getDiscussionMessageDetail({
      viewerRole: 'student',
      viewerId: req.auth.userId,
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

export async function postMessage(req, res, next) {
  try {
    const result = await createDiscussionTopic({
      viewerRole: 'student',
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
      viewerRole: 'student',
      viewerId: req.auth.userId,
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

export async function deleteMessage(req, res, next) {
  try {
    const result = await deleteDiscussionTopic({
      viewerRole: 'student',
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
      viewerRole: 'student',
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
