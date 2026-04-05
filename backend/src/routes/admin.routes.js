import { Router } from 'express'
import {
  createMessage,
  createAdmin,
  createCollege,
  createCourse,
  createTeacherUser,
  createStudentUser,
  deleteAsset,
  createNotice,
  deleteAdmin,
  deleteCollege,
  deleteCourse,
  deleteMaterial,
  deleteMessage,
  deleteMessageReply,
  deleteNotice,
  deleteStudentUser,
  deleteTeacherUser,
  deleteVideo,
  getAdminList,
  getCollegeList,
  getCourseList,
  getAssetList,
  getDashboard,
  getMaterialList,
  getMessageDetail,
  getMessageList,
  getSystemManage,
  getStudentUserList,
  getTeacherUserList,
  getVideoList,
  postMessageReply,
  updateNotice,
  updateAdmin,
  updateCollege,
  updateCourse,
  updateStudentUser,
  updateTeacherUser,
  updateSystemProfile,
} from '../controllers/admin.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authenticate, requireRole('admin'))
router.get('/dashboard', getDashboard)
router.get('/system', getSystemManage)
router.put('/system/profile', updateSystemProfile)
router.post('/system/notices', createNotice)
router.put('/system/notices/:noticeId', updateNotice)
router.delete('/system/notices/:noticeId', deleteNotice)
router.get('/admins', getAdminList)
router.post('/admins', createAdmin)
router.put('/admins/:adminId', updateAdmin)
router.delete('/admins/:adminId', deleteAdmin)
router.get('/teachers', getTeacherUserList)
router.post('/teachers', createTeacherUser)
router.put('/teachers/:teacherId', updateTeacherUser)
router.delete('/teachers/:teacherId', deleteTeacherUser)
router.get('/students', getStudentUserList)
router.post('/students', createStudentUser)
router.put('/students/:studentId', updateStudentUser)
router.delete('/students/:studentId', deleteStudentUser)

router.get('/colleges', getCollegeList)
router.post('/colleges', createCollege)
router.put('/colleges/:collegeId', updateCollege)
router.delete('/colleges/:collegeId', deleteCollege)
router.get('/courses', getCourseList)
router.post('/courses', createCourse)
router.put('/courses/:courseId', updateCourse)
router.delete('/courses/:courseId', deleteCourse)
router.get('/assets', getAssetList)
router.delete('/assets/:assetId', deleteAsset)
router.get('/materials', getMaterialList)
router.delete('/materials/:materialId', deleteMaterial)
router.get('/videos', getVideoList)
router.delete('/videos/:videoId', deleteVideo)
router.get('/messages', getMessageList)
router.post('/messages', createMessage)
router.get('/messages/:messageId', getMessageDetail)
router.post('/messages/:messageId/replies', postMessageReply)
router.delete('/messages/:messageId', deleteMessage)
router.delete('/messages/:messageId/replies/:replyId', deleteMessageReply)

export default router
