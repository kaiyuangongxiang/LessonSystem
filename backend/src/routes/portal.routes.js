import { Router } from 'express'
import {
  downloadPortalAsset,
  downloadPortalMaterial,
  getPortalAssetFile,
  getPortalCourseAssets,
  getPortalCourseDetail,
  getPortalCourses,
  getPortalHome,
  getPortalPublicAssets,
  playPortalVideo,
} from '../controllers/portal.controller.js'

const router = Router()

router.get('/home', getPortalHome)
router.get('/courses', getPortalCourses)
router.get('/assets', getPortalPublicAssets)
router.get('/assets/:assetId/download', downloadPortalAsset)
router.get('/courses/:courseId/assets', getPortalCourseAssets)
router.get('/courses/:courseId', getPortalCourseDetail)
router.get('/assets/:assetId/file', getPortalAssetFile)
router.get('/materials/:materialId/download', downloadPortalMaterial)
router.get('/videos/:videoId/play', playPortalVideo)

export default router
