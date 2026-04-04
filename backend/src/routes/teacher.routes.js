import { Router } from 'express'
import {
  getCourseOptions,
  getDashboard,
  getMessageDetail,
  getMessages,
  postMaterial,
  postMessage,
  postMessageReply,
  postVideo,
} from '../controllers/teacher.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { uploadMaterialFile, uploadVideoFiles } from '../middleware/upload.js'

const router = Router()

router.use(authenticate, requireRole('teacher'))
router.get('/dashboard', getDashboard)
router.get('/courses/options', getCourseOptions)
router.post('/materials', uploadMaterialFile.single('file'), postMaterial)
router.post(
  '/videos',
  uploadVideoFiles.fields([
    { name: 'video', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  postVideo,
)
router.get('/messages', getMessages)
router.post('/messages', postMessage)
router.get('/messages/:messageId', getMessageDetail)
router.post('/messages/:messageId/replies', postMessageReply)

export default router
