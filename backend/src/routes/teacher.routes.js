import { Router } from 'express'
import {
  getCourseOptions,
  getDashboard,
  getMessageDetail,
  getMessages,
  getProfile,
  getResourceDetail,
  getResources,
  postMaterial,
  postResourceBundle,
  postMessage,
  postMessageReply,
  postVideo,
  removeResource,
  updateProfile,
  updateResource,
} from '../controllers/teacher.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { uploadMaterialFile, uploadResourceFiles, uploadVideoFiles } from '../middleware/upload.js'

const router = Router()

router.use(authenticate, requireRole('teacher'))
router.get('/dashboard', getDashboard)
router.get('/courses/options', getCourseOptions)
router.get('/profile', getProfile)
router.put('/profile', updateProfile)
router.post(
  '/resources/upload',
  uploadResourceFiles.fields([
    { name: 'material', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  postResourceBundle,
)
router.post('/materials', uploadMaterialFile.single('file'), postMaterial)
router.post(
  '/videos',
  uploadVideoFiles.fields([
    { name: 'video', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  postVideo,
)
router.get('/resources', getResources)
router.get('/resources/:type/:resourceId', getResourceDetail)
router.put('/resources/:type/:resourceId', updateResource)
router.delete('/resources/:type/:resourceId', removeResource)
router.get('/messages', getMessages)
router.post('/messages', postMessage)
router.get('/messages/:messageId', getMessageDetail)
router.post('/messages/:messageId/replies', postMessageReply)

export default router
