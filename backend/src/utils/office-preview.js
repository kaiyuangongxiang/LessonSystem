import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { logger } from './logger.js'

const execFileAsync = promisify(execFile)
const OFFICE_EXTENSIONS = new Set(['.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx'])
const POWERPOINT_EXTENSIONS = new Set(['.ppt', '.pptx'])
const OFFICE_BIN_CANDIDATES = [
  process.env.LIBREOFFICE_BIN,
  'soffice',
  'libreoffice',
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
].filter(Boolean)
const POWERPOINT_BIN_CANDIDATES = [
  process.env.POWERPOINT_BIN,
  'POWERPNT.EXE',
  'C:\\Program Files\\Microsoft Office\\root\\Office16\\POWERPNT.EXE',
  'C:\\Program Files\\Microsoft Office\\Root\\Office16\\POWERPNT.EXE',
  'C:\\Program Files (x86)\\Microsoft Office\\root\\Office16\\POWERPNT.EXE',
  'C:\\Program Files (x86)\\Microsoft Office\\Root\\Office16\\POWERPNT.EXE',
].filter(Boolean)
const currentDir = path.dirname(fileURLToPath(import.meta.url))
const convertPptScriptPath = path.resolve(currentDir, '../scripts/convert-ppt-to-pdf.ps1')

let officeBinaryPromise = null
let powerPointBinaryPromise = null

function serviceUnavailable(message) {
  const error = new Error(message)
  error.status = 503
  return error
}

export function isOfficePreviewFile(fileName) {
  return OFFICE_EXTENSIONS.has(path.extname(String(fileName || '')).toLowerCase())
}

async function resolveOfficeBinary() {
  if (!officeBinaryPromise) {
    officeBinaryPromise = (async () => {
      for (const candidate of OFFICE_BIN_CANDIDATES) {
        try {
          await execFileAsync(candidate, ['--version'], { timeout: 15_000 })
          return candidate
        } catch {
          // try next candidate
        }
      }

      throw serviceUnavailable('服务器未安装 LibreOffice，暂时无法在线预览 PPT/Word/Excel，请先下载文件查看')
    })()
    officeBinaryPromise.catch(() => {
      officeBinaryPromise = null
    })
  }

  return officeBinaryPromise
}

async function resolvePowerPointBinary() {
  if (!powerPointBinaryPromise) {
    powerPointBinaryPromise = (async () => {
      for (const candidate of POWERPOINT_BIN_CANDIDATES) {
        try {
          await execFileAsync(candidate, ['/S'], { timeout: 15_000, windowsHide: true })
          return candidate
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          if (
            candidate.toLowerCase().endsWith('powerpnt.exe') &&
            !message.includes('Could not find') &&
            !message.includes('not recognized') &&
            !message.includes('ENOENT')
          ) {
            return candidate
          }
        }
      }

      throw serviceUnavailable('服务器未安装可用的 PowerPoint 或 LibreOffice，暂时无法在线预览 PPT，请先下载文件查看')
    })()
    powerPointBinaryPromise.catch(() => {
      powerPointBinaryPromise = null
    })
  }

  return powerPointBinaryPromise
}

function buildCacheKey(filePath, stats) {
  return createHash('sha1')
    .update(`${filePath}:${Number(stats.mtimeMs || 0)}:${Number(stats.size || 0)}`)
    .digest('hex')
}

export async function convertOfficeDocumentToPdf(filePath, cacheRoot) {
  const extension = path.extname(String(filePath || '')).toLowerCase()
  if (!OFFICE_EXTENSIONS.has(extension)) {
    return null
  }

  const sourceStats = await fs.stat(filePath)
  const cacheKey = buildCacheKey(filePath, sourceStats)
  const outputDir = path.resolve(cacheRoot, cacheKey)
  const expectedPdfPath = path.resolve(outputDir, `${path.parse(filePath).name}.pdf`)

  try {
    await fs.access(expectedPdfPath)
    return expectedPdfPath
  } catch {
    // convert below
  }

  await fs.mkdir(outputDir, { recursive: true })

  if (process.platform === 'win32' && POWERPOINT_EXTENSIONS.has(extension)) {
    try {
      await resolvePowerPointBinary()
      await execFileAsync(
        'powershell.exe',
        [
          '-NoProfile',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          convertPptScriptPath,
          '-InputPath',
          filePath,
          '-OutputPath',
          expectedPdfPath,
        ],
        {
          timeout: 120_000,
          windowsHide: true,
        },
      )

      await fs.access(expectedPdfPath)

      logger.info('powerpoint_preview_pdf_created', {
        sourcePath: filePath,
        previewPath: expectedPdfPath,
      })

      return expectedPdfPath
    } catch (error) {
      logger.warn('powerpoint_preview_pdf_failed', {
        sourcePath: filePath,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const officeBinary = await resolveOfficeBinary()

  try {
    await execFileAsync(
      officeBinary,
      ['--headless', '--convert-to', 'pdf', '--outdir', outputDir, filePath],
      {
        timeout: 120_000,
        windowsHide: true,
      },
    )

    await fs.access(expectedPdfPath)

    logger.info('office_preview_pdf_created', {
      sourcePath: filePath,
      previewPath: expectedPdfPath,
    })

    return expectedPdfPath
  } catch (error) {
    logger.error('office_preview_pdf_failed', {
      sourcePath: filePath,
      error: error instanceof Error ? error.message : String(error),
    })

    throw serviceUnavailable('当前文档暂时无法在线预览，请先下载后查看')
  }
}
