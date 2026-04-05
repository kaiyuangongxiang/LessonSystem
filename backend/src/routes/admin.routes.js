import { Router } from 'express'
import {
  createAdmin,
  createCollege,
  createCourse,
  deleteAdmin,
  deleteCollege,
  deleteCourse,
  deleteMaterial,
  deleteMessage,
  deleteVideo,
  getAdminList,
  getCollegeList,
  getCourseList,
  getDashboard,
  getMaterialList,
  getMessageDetail,
  getMessageList,
  getVideoList,
  postMessageReply,
  updateAdmin,
  updateCollege,
  updateCourse,
} from '../controllers/admin.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authenticate, requireRole('admin'))
router.get('/dashboard', getDashboard)
router.get('/admins', getAdminList)
router.post('/admins', createAdmin)
router.put('/admins/:adminId', updateAdmin)
router.delete('/admins/:adminId', deleteAdmin)

router.get('/colleges', getCollegeList)
router.post('/colleges', createCollege)
router.put('/colleges/:collegeId', updateCollege)
router.delete('/colleges/:collegeId', deleteCollege)
router.get('/courses', getCourseList)
router.post('/courses', createCourse)
router.put('/courses/:courseId', updateCourse)
router.delete('/courses/:courseId', deleteCourse)
router.get('/materials', getMaterialList)
router.delete('/materials/:materialId', deleteMaterial)
router.get('/videos', getVideoList)
router.delete('/videos/:videoId', deleteVideo)
router.get('/messages', getMessageList)
router.get('/messages/:messageId', getMessageDetail)
router.post('/messages/:messageId/replies', postMessageReply)
router.delete('/messages/:messageId', deleteMessage)

export default router
