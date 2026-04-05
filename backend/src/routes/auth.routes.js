import { Router } from 'express'
import { getRegisterOptions, loginByPassword, register } from '../controllers/auth.controller.js'

const router = Router()

router.get('/register-options', getRegisterOptions)
router.post('/register', register)
router.post('/login', loginByPassword)

export default router
