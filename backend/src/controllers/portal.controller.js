import path from 'node:path'
import {
  getPortalAssetFileData,
  getPortalCourseAssetsData,
  getPortalCourseDetailData,
  getPortalCourseListData,
  getPortalHomeData,
  getPortalMaterialDownloadData,
  getPortalPrepAttachmentFileData,
  getPortalPublicAssetListData,
  getPortalVideoPlayData,
} from '../services/portal.service.js'

export async function getPortalHome(req, res, next) {
  try {
    const result = await getPortalHomeData()
    res.status(200).json({
      code: 200,
      message: '获取首页数据成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getPortalCourses(req, res, next) {
  try {
    const result = await getPortalCourseListData(req.query)
    res.status(200).json({
      code: 200,
      message: '获取课程列表成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getPortalPublicAssets(req, res, next) {
  try {
    const result = await getPortalPublicAssetListData(req.query)
    res.status(200).json({
      code: 200,
      message: '获取公共素材成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getPortalCourseAssets(req, res, next) {
  try {
    const result = await getPortalCourseAssetsData(req.params.courseId)
    res.status(200).json({
      code: 200,
      message: '获取课程素材成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getPortalCourseDetail(req, res, next) {
  try {
    const result = await getPortalCourseDetailData(req.params.courseId)
    res.status(200).json({
      code: 200,
      message: '获取课程详情成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function downloadPortalMaterial(req, res, next) {
  try {
    const result = await getPortalMaterialDownloadData(req.params.materialId)
    res.download(result.filePath, result.downloadName)
  } catch (error) {
    next(error)
  }
}

export async function getPortalAssetFile(req, res, next) {
  try {
    const result = await getPortalAssetFileData(req.params.assetId)
    res.type(path.extname(result.fileName) || 'application/octet-stream')
    res.sendFile(result.filePath)
  } catch (error) {
    next(error)
  }
}

export async function downloadPortalAsset(req, res, next) {
  try {
    const result = await getPortalAssetFileData(req.params.assetId)
    res.download(result.filePath, result.fileName)
  } catch (error) {
    next(error)
  }
}

export async function getPortalPrepAttachmentFile(req, res, next) {
  try {
    const result = await getPortalPrepAttachmentFileData(req.params.attachmentId)
    res.type(result.contentType || path.extname(result.fileName) || 'application/octet-stream')
    res.sendFile(result.filePath)
  } catch (error) {
    next(error)
  }
}

export async function downloadPortalPrepAttachment(req, res, next) {
  try {
    const result = await getPortalPrepAttachmentFileData(req.params.attachmentId)
    res.download(result.filePath, result.fileName)
  } catch (error) {
    next(error)
  }
}

export async function playPortalVideo(req, res, next) {
  try {
    const result = await getPortalVideoPlayData(req.params.videoId)
    res.type(path.extname(result.fileName) || 'mp4')
    res.sendFile(result.filePath)
  } catch (error) {
    next(error)
  }
}
