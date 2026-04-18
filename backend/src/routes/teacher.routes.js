import { Router } from 'express'
import {
  deleteAsset,
  downloadAsset,
  deletePrepAttachment,
  getCoursewareDetail,
  getCoursewares,
  deleteMessage,
  deleteMessageReply,
  publishCourseware,
  getAssetDetail,
  getAssets,
  getCourseOptions,
  getDashboard,
  getMessageDetail,
  getMessages,
  getPrepAttachmentFile,
  getPreps,
  getProfile,
  getResourceDetail,
  getResources,
  postPrepAssetAttachments,
  postPrepUploadAttachments,
  postCourseware,
  postAsset,
  postMaterial,
  postPrep,
  postResourceBundle,
  postMessage,
  postMessageReply,
  postVideo,
  putCourseware,
  putPrep,
  removePrep,
  removeCourseware,
  removeResource,
  updateAsset,
  updateProfile,
  updateResource,
} from '../controllers/teacher.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { uploadAssetFile, uploadMaterialFile, uploadPrepAttachments, uploadResourceFiles, uploadVideoFiles } from '../middleware/upload.js'

const router = Router()

router.use(authenticate, requireRole('teacher'))
router.get('/dashboard', getDashboard)
router.get('/courses/options', getCourseOptions)
router.get('/preps', getPreps)
router.post('/preps', postPrep)
router.put('/preps/:prepId', putPrep)
router.delete('/preps/:prepId', removePrep)
router.post('/preps/:prepId/attachments/assets', postPrepAssetAttachments)
router.post('/preps/:prepId/attachments/upload', uploadPrepAttachments.array('files', 10), postPrepUploadAttachments)
router.delete('/preps/:prepId/attachments/:attachmentId', deletePrepAttachment)
router.get('/preps/attachments/:attachmentId/file', getPrepAttachmentFile)
router.get('/coursewares', getCoursewares)
router.post('/coursewares', postCourseware)
router.get('/coursewares/:coursewareId', getCoursewareDetail)
router.put('/coursewares/:coursewareId', putCourseware)
router.delete('/coursewares/:coursewareId', removeCourseware)
router.post('/coursewares/:coursewareId/publish', publishCourseware)
router.get('/assets', getAssets)
router.post('/assets', uploadAssetFile.single('file'), postAsset)
router.get('/assets/:assetId', getAssetDetail)
router.get('/assets/:assetId/download', downloadAsset)
router.put('/assets/:assetId', updateAsset)
router.delete('/assets/:assetId', deleteAsset)
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
router.delete('/messages/:messageId', deleteMessage)
router.delete('/messages/:messageId/replies/:replyId', deleteMessageReply)

export default router
