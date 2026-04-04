import { Router } from 'express'
import { loginByPassword, register } from '../controllers/auth.controller.js'

const router = Router()

router.post('/register', register)
router.post('/login', loginByPassword)

export default router
