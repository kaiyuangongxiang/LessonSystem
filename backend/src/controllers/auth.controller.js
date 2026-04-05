import { getRegisterOptions, login, registerUser } from '../services/auth.service.js'

export async function getRegisterOptionsController(req, res, next) {
  try {
    const result = await getRegisterOptions()
    res.status(200).json({
      code: 200,
      message: '获取注册选项成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function register(req, res, next) {
  try {
    const result = await registerUser(req.body)
    res.status(201).json({
      code: 201,
      message: '注册成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export async function loginByPassword(req, res, next) {
  try {
    const result = await login(req.body)
    res.status(200).json({
      code: 200,
      message: '登录成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}
