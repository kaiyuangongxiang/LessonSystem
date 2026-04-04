import { getAdminDashboardData } from '../services/admin.service.js'

export async function getDashboard(req, res, next) {
  try {
    const result = await getAdminDashboardData(req.auth.userId)

    res.status(200).json({
      code: 200,
      message: '获取管理员工作台成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}
