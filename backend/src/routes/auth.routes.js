import { Router } from 'express'
import { getRegisterOptionsController, loginByPassword, register } from '../controllers/auth.controller.js'

const router = Router()

router.get('/register-options', getRegisterOptionsController)
router.post('/register', register)
router.post('/login', loginByPassword)

export default router
