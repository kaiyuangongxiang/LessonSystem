import { Router } from 'express'
import {
  getDashboard,
  getMessageDetail,
  getMessages,
  postMessage,
  postMessageReply,
} from '../controllers/teacher.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authenticate, requireRole('teacher'))
router.get('/dashboard', getDashboard)
router.get('/messages', getMessages)
router.post('/messages', postMessage)
router.get('/messages/:messageId', getMessageDetail)
router.post('/messages/:messageId/replies', postMessageReply)

export default router
