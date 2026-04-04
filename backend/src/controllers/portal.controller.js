import { getPortalHomeData } from '../services/portal.service.js'

export async function getPortalHome(req, res, next) {
  try {
    const result = await getPortalHomeData()
    res.status(200).json({
      code: 200,
      message: '获取首页数据成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}
