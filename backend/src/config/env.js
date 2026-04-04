import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(currentDir, '../../.env')
const envExamplePath = path.resolve(currentDir, '../../.env.example')

dotenv.config({
  path: fs.existsSync(envPath) ? envPath : envExamplePath,
})

export const env = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || 'replace-with-a-strong-secret',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  resourceRoot: process.env.RESOURCE_ROOT || '',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lesson_prep_system',
  },
}
