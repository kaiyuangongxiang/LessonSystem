import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import { fileURLToPath } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(currentDir, '../../..')
const materialUploadRoot = path.resolve(projectRoot, 'uploads', 'materials')
const videoUploadRoot = path.resolve(projectRoot, 'uploads', 'videos')
const videoCoverUploadRoot = path.resolve(projectRoot, 'uploads', 'video-covers')

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

function createStorage({ destinationRoot, fallbackBaseName }) {
  return multer.diskStorage({
    destination(req, file, callback) {
      try {
        const uploadRoot = typeof destinationRoot === 'function' ? destinationRoot(file) : destinationRoot
        ensureUploadDir(uploadRoot)
        callback(null, uploadRoot)
      } catch (error) {
        callback(error)
      }
    },
    filename(req, file, callback) {
      const extension = path.extname(file.originalname || '').toLowerCase()
      const baseName = sanitizeBaseName(file.originalname || fallbackBaseName) || fallbackBaseName
      callback(null, `${Date.now()}-${baseName}${extension}`)
    },
  })
}

const materialStorage = createStorage({
  destinationRoot: materialUploadRoot,
  fallbackBaseName: 'material',
})

const videoStorage = createStorage({
  destinationRoot(file) {
    return file.fieldname === 'cover' ? videoCoverUploadRoot : videoUploadRoot
  },
  fallbackBaseName: 'video',
})

function materialFileFilter(req, file, callback) {
  const extension = path.extname(file.originalname || '').toLowerCase()
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
  const extension = path.extname(file.originalname || '').toLowerCase()
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
