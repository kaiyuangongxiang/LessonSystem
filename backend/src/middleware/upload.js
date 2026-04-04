import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import { fileURLToPath } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(currentDir, '../../..')
const uploadRoot = path.resolve(projectRoot, 'uploads', 'materials')
const allowedExtensions = new Set(['.pdf', '.doc', '.docx', '.ppt', '.pptx'])
const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])

function ensureUploadDir() {
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

const storage = multer.diskStorage({
  destination(req, file, callback) {
    try {
      ensureUploadDir()
      callback(null, uploadRoot)
    } catch (error) {
      callback(error)
    }
  },
  filename(req, file, callback) {
    const extension = path.extname(file.originalname || '').toLowerCase()
    const baseName = sanitizeBaseName(file.originalname || 'material') || 'material'
    callback(null, `${Date.now()}-${baseName}${extension}`)
  },
})

function fileFilter(req, file, callback) {
  const extension = path.extname(file.originalname || '').toLowerCase()
  const mimeType = String(file.mimetype || '').toLowerCase()

  if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(mimeType)) {
    const error = new Error('仅支持 PDF、DOC、DOCX、PPT、PPTX 格式资料')
    error.status = 400
    callback(error)
    return
  }

  callback(null, true)
}

export const uploadMaterialFile = multer({
  storage,
  fileFilter,
  limits: {
    files: 1,
    fileSize: 100 * 1024 * 1024,
  },
})
