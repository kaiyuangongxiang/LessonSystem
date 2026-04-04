import { Router } from 'express'
import {
  getCourseOptions,
  getDashboard,
  getMessageDetail,
  getMessages,
  postMaterial,
  postMessage,
  postMessageReply,
} from '../controllers/teacher.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { uploadMaterialFile } from '../middleware/upload.js'

const router = Router()

router.use(authenticate, requireRole('teacher'))
router.get('/dashboard', getDashboard)
router.get('/courses/options', getCourseOptions)
router.post('/materials', uploadMaterialFile.single('file'), postMaterial)
router.get('/messages', getMessages)
router.post('/messages', postMessage)
router.get('/messages/:messageId', getMessageDetail)
router.post('/messages/:messageId/replies', postMessageReply)

export default router
