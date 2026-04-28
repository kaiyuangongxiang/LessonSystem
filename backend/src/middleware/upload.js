import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import { fileURLToPath } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(currentDir, '../../..')
const materialUploadRoot = path.resolve(projectRoot, 'uploads', 'materials')
const videoUploadRoot = path.resolve(projectRoot, 'uploads', 'videos')
const videoCoverUploadRoot = path.resolve(projectRoot, 'uploads', 'video-covers')
const assetImageUploadRoot = path.resolve(projectRoot, 'uploads', 'assets', 'images')
const assetAudioUploadRoot = path.resolve(projectRoot, 'uploads', 'assets', 'audios')
const assetVideoUploadRoot = path.resolve(projectRoot, 'uploads', 'assets', 'videos')
const assetFileUploadRoot = path.resolve(projectRoot, 'uploads', 'assets', 'files')
const prepAttachmentUploadRoot = path.resolve(projectRoot, 'uploads', 'preps', 'attachments')

const materialExtensions = new Set(['.pdf', '.doc', '.docx', '.ppt', '.pptx'])
const materialMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])

const videoExtensions = new Set(['.mp4', '.mov'])
const videoMimeTypes = new Set([
  'video/mp4',
  'video/quicktime',
  'application/mp4',
  'application/octet-stream',
])

const coverExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const coverMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const assetImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const assetImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const assetAudioExtensions = new Set(['.mp3', '.wav', '.ogg', '.m4a'])
const assetAudioMimeTypes = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a',
  'application/octet-stream',
])
const assetFileExtensions = new Set(['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.zip', '.rar', '.7z'])
const assetFileMimeTypes = new Set([
  ...materialMimeTypes,
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/x-7z-compressed',
  'application/octet-stream',
])
const prepAttachmentExtensions = new Set([
  ...materialExtensions,
  ...videoExtensions,
  ...coverExtensions,
  ...assetImageExtensions,
  ...assetAudioExtensions,
  ...assetFileExtensions,
])
const prepAttachmentMimeTypes = new Set([
  ...materialMimeTypes,
  ...videoMimeTypes,
  ...coverMimeTypes,
  ...assetImageMimeTypes,
  ...assetAudioMimeTypes,
  ...assetFileMimeTypes,
])

function ensureUploadDir(uploadRoot) {
  fs.mkdirSync(uploadRoot, { recursive: true })
}

function sanitizeBaseName(fileName) {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

function countReadableChars(value) {
  return (String(value || '').match(/[\u4e00-\u9fff\w\s.\-()[\]]/g) || []).length
}

function normalizeUploadedOriginalName(file) {
  const originalName = String(file?.originalname || '')
  if (!originalName) {
    return ''
  }

  const decodedName = Buffer.from(originalName, 'latin1').toString('utf8')
  const hasRawCjk = /[\u4e00-\u9fff]/.test(originalName)
  const hasRawLatin1 = /[\u00C0-\u00FF]/.test(originalName)
  const hasDecodedCjk = /[\u4e00-\u9fff]/.test(decodedName)

  if (decodedName.includes('\uFFFD') || /[\u0000-\u0008\u000E-\u001F]/.test(decodedName)) {
    return originalName
  }

  const shouldDecode =
    (!hasRawCjk && hasRawLatin1 && hasDecodedCjk) ||
    (hasRawLatin1 && countReadableChars(decodedName) > countReadableChars(originalName) + 1)

  if (shouldDecode) {
    file.originalname = decodedName
    return decodedName
  }

  return originalName
}

function createStorage({ destinationRoot, fallbackBaseName }) {
  return multer.diskStorage({
    destination(req, file, callback) {
      try {
        const uploadRoot = typeof destinationRoot === 'function' ? destinationRoot(req, file) : destinationRoot
        ensureUploadDir(uploadRoot)
        callback(null, uploadRoot)
      } catch (error) {
        callback(error)
      }
    },
    filename(req, file, callback) {
      const originalName = normalizeUploadedOriginalName(file)
      const extension = path.extname(originalName || '').toLowerCase()
      const baseName = sanitizeBaseName(originalName || fallbackBaseName) || fallbackBaseName
      callback(null, `${Date.now()}-${baseName}${extension}`)
    },
  })
}

const materialStorage = createStorage({
  destinationRoot: materialUploadRoot,
  fallbackBaseName: 'material',
})

const videoStorage = createStorage({
  destinationRoot(req, file) {
    return file.fieldname === 'cover' ? videoCoverUploadRoot : videoUploadRoot
  },
  fallbackBaseName: 'video',
})

const resourceStorage = createStorage({
  destinationRoot(req, file) {
    if (file.fieldname === 'material') {
      return materialUploadRoot
    }

    return file.fieldname === 'cover' ? videoCoverUploadRoot : videoUploadRoot
  },
  fallbackBaseName: 'resource',
})

const assetStorage = createStorage({
  destinationRoot(req) {
    const assetType = String(req.body?.type || '').trim().toLowerCase()
    if (assetType === 'audio') {
      return assetAudioUploadRoot
    }
    if (assetType === 'video') {
      return assetVideoUploadRoot
    }
    if (assetType === 'file') {
      return assetFileUploadRoot
    }
    return assetImageUploadRoot
  },
  fallbackBaseName: 'asset',
})

const prepAttachmentStorage = createStorage({
  destinationRoot: prepAttachmentUploadRoot,
  fallbackBaseName: 'prep-attachment',
})

function materialFileFilter(req, file, callback) {
  const originalName = normalizeUploadedOriginalName(file)
  const extension = path.extname(originalName || '').toLowerCase()
  const mimeType = String(file.mimetype || '').toLowerCase()

  if (!materialExtensions.has(extension) || !materialMimeTypes.has(mimeType)) {
    const error = new Error('仅支持 PDF、DOC、DOCX、PPT、PPTX 格式资料')
    error.status = 400
    callback(error)
    return
  }

  callback(null, true)
}

function videoFileFilter(req, file, callback) {
  const originalName = normalizeUploadedOriginalName(file)
  const extension = path.extname(originalName || '').toLowerCase()
  const mimeType = String(file.mimetype || '').toLowerCase()

  if (file.fieldname === 'video') {
    if (!videoExtensions.has(extension) || !videoMimeTypes.has(mimeType)) {
      const error = new Error('仅支持 MP4、MOV 格式视频')
      error.status = 400
      callback(error)
      return
    }

    callback(null, true)
    return
  }

  if (file.fieldname === 'cover') {
    if (!coverExtensions.has(extension) || !coverMimeTypes.has(mimeType)) {
      const error = new Error('封面仅支持 JPG、JPEG、PNG、WEBP 格式图片')
      error.status = 400
      callback(error)
      return
    }

    callback(null, true)
    return
  }

  const error = new Error('不支持的上传字段')
  error.status = 400
  callback(error)
}

export const uploadMaterialFile = multer({
  storage: materialStorage,
  fileFilter: materialFileFilter,
  limits: {
    files: 1,
    fileSize: 100 * 1024 * 1024,
  },
})

export const uploadVideoFiles = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    files: 2,
    fileSize: 500 * 1024 * 1024,
  },
})

function assetFileFilter(req, file, callback) {
  if (file.fieldname !== 'file') {
    const error = new Error('不支持的上传字段')
    error.status = 400
    callback(error)
    return
  }

  const assetType = String(req.body?.type || '').trim().toLowerCase()
  const originalName = normalizeUploadedOriginalName(file)
  const extension = path.extname(originalName || '').toLowerCase()
  const mimeType = String(file.mimetype || '').toLowerCase()

  if (assetType === 'image') {
    if (!assetImageExtensions.has(extension) || !assetImageMimeTypes.has(mimeType)) {
      const error = new Error('图片资料仅支持 JPG、JPEG、PNG、WEBP、GIF 格式')
      error.status = 400
      callback(error)
      return
    }

    callback(null, true)
    return
  }

  if (assetType === 'audio') {
    if (!assetAudioExtensions.has(extension) || !assetAudioMimeTypes.has(mimeType)) {
      const error = new Error('音频资料仅支持 MP3、WAV、OGG、M4A 格式')
      error.status = 400
      callback(error)
      return
    }

    callback(null, true)
    return
  }

  if (assetType === 'video') {
    if (!videoExtensions.has(extension) || !videoMimeTypes.has(mimeType)) {
      const error = new Error('视频资料仅支持 MP4、MOV 格式')
      error.status = 400
      callback(error)
      return
    }

    callback(null, true)
    return
  }

  if (assetType === 'file') {
    if (!assetFileExtensions.has(extension) || !assetFileMimeTypes.has(mimeType)) {
      const error = new Error('文件资料仅支持 PDF、Word、PPT、Excel、TXT、ZIP、RAR、7Z 格式')
      error.status = 400
      callback(error)
      return
    }

    callback(null, true)
    return
  }

  const error = new Error('当前资料类型不支持文件上传')
  error.status = 400
  callback(error)
}

function resourceFileFilter(req, file, callback) {
  if (file.fieldname === 'material') {
    materialFileFilter(req, file, callback)
    return
  }

  if (file.fieldname === 'video' || file.fieldname === 'cover') {
    videoFileFilter(req, file, callback)
    return
  }

  const error = new Error('不支持的上传字段')
  error.status = 400
  callback(error)
}

export const uploadResourceFiles = multer({
  storage: resourceStorage,
  fileFilter: resourceFileFilter,
  limits: {
    files: 3,
    fileSize: 500 * 1024 * 1024,
  },
})

export const uploadAssetFile = multer({
  storage: assetStorage,
  fileFilter: assetFileFilter,
  limits: {
    files: 1,
    fileSize: 500 * 1024 * 1024,
  },
})

function prepAttachmentFileFilter(req, file, callback) {
  if (file.fieldname !== 'files') {
    const error = new Error('不支持的上传字段')
    error.status = 400
    callback(error)
    return
  }

  const originalName = normalizeUploadedOriginalName(file)
  const extension = path.extname(originalName || '').toLowerCase()
  const mimeType = String(file.mimetype || '').toLowerCase()

  if (!prepAttachmentExtensions.has(extension) || !prepAttachmentMimeTypes.has(mimeType)) {
    const error = new Error('备课附件仅支持文档、图片、音频、视频类文件')
    error.status = 400
    callback(error)
    return
  }

  callback(null, true)
}

export const uploadPrepAttachments = multer({
  storage: prepAttachmentStorage,
  fileFilter: prepAttachmentFileFilter,
  limits: {
    files: 10,
    fileSize: 500 * 1024 * 1024,
  },
})
