import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.js'
import {
  deleteMessage,
  deleteMessageReply,
  getMessageDetail,
  getMessages,
  postMessage,
  postMessageReply,
} from '../controllers/student.controller.js'

const router = Router()

router.use(authenticate, requireRole('student'))
router.get('/messages', getMessages)
router.post('/messages', postMessage)
router.get('/messages/:messageId', getMessageDetail)
router.post('/messages/:messageId/replies', postMessageReply)
router.delete('/messages/:messageId', deleteMessage)
router.delete('/messages/:messageId/replies/:replyId', deleteMessageReply)

export default router
