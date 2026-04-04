import { Router } from 'express'
import { getDashboard } from '../controllers/admin.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authenticate, requireRole('admin'))
router.get('/dashboard', getDashboard)

export default router
