import { Router } from 'express'
import { downloadPortalMaterial, getPortalCourseDetail, getPortalCourses, getPortalHome, playPortalVideo } from '../controllers/portal.controller.js'

const router = Router()

router.get('/home', getPortalHome)
router.get('/courses', getPortalCourses)
router.get('/courses/:courseId', getPortalCourseDetail)
router.get('/materials/:materialId/download', downloadPortalMaterial)
router.get('/videos/:videoId/play', playPortalVideo)

export default router
