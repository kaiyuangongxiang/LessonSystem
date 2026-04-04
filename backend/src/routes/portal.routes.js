import { Router } from 'express'
import { getPortalHome } from '../controllers/portal.controller.js'

const router = Router()

router.get('/home', getPortalHome)

export default router
