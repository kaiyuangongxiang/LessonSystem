import path from 'node:path'
import { convertOfficeDocumentToPdf, isOfficePreviewFile } from './office-preview.js'

export function buildContentTypeFromExtension(extension) {
  const normalizedExtension = String(extension || '').toLowerCase()
  const contentTypeMap = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.flac': 'audio/flac',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.csv': 'text/csv; charset=utf-8',
    '.pdf': 'application/pdf',
  }

  return contentTypeMap[normalizedExtension] || ''
}

export function resolvePreviewContentType({ mimeType, assetType, fileName, storedPath }) {
  const normalizedMimeType = String(mimeType || '').trim().toLowerCase()
  if (normalizedMimeType) {
    return normalizedMimeType
  }

  const extensionContentType =
    buildContentTypeFromExtension(path.extname(String(fileName || ''))) ||
    buildContentTypeFromExtension(path.extname(String(storedPath || '')))
  if (extensionContentType) {
    return extensionContentType
  }

  const normalizedAssetType = String(assetType || '').trim().toLowerCase()
  if (normalizedAssetType === 'image') {
    return 'image/*'
  }

  if (normalizedAssetType === 'video') {
    return 'video/*'
  }

  if (normalizedAssetType === 'audio') {
    return 'audio/*'
  }

  if (normalizedAssetType === 'text') {
    return 'text/plain; charset=utf-8'
  }

  return 'application/octet-stream'
}

export async function preparePreviewFile({
  resolvedPath,
  fileName,
  mimeType = '',
  assetType = '',
  cacheRoot,
}) {
  const normalizedFileName = fileName || path.basename(resolvedPath)

  if (isOfficePreviewFile(normalizedFileName)) {
    const previewPdfPath = await convertOfficeDocumentToPdf(resolvedPath, cacheRoot)
    return {
      filePath: previewPdfPath,
      fileName: `${path.parse(normalizedFileName).name}.pdf`,
      contentType: 'application/pdf',
    }
  }

  return {
    filePath: resolvedPath,
    fileName: normalizedFileName,
    contentType: resolvePreviewContentType({
      mimeType,
      assetType,
      fileName: normalizedFileName,
      storedPath: resolvedPath,
    }),
  }
}
