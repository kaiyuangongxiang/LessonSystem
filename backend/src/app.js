import cors from 'cors'
import express from 'express'
import adminRoutes from './routes/admin.routes.js'
import authRoutes from './routes/auth.routes.js'
import portalRoutes from './routes/portal.routes.js'
import teacherRoutes from './routes/teacher.routes.js'
import { env } from './config/env.js'
import { requestLogger } from './middleware/request-logger.js'
import { errorHandler } from './middleware/error-handler.js'

const app = express()

app.use(
  cors({
    origin: env.frontendOrigin,
  }),
)
app.use(express.json())
app.use(requestLogger)

app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: 'ok',
    data: { status: 'healthy' },
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/portal', portalRoutes)
app.use('/api/teacher', teacherRoutes)
app.use('/api/admin', adminRoutes)
app.use(errorHandler)

export default app
