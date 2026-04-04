import http, { type ApiSuccess } from './http'

export interface AdminDashboardStats {
  teacherCount: number
  courseCount: number
  materialCount: number
  videoCount: number
  topicCount: number
}

export interface AdminDashboardTeacherItem {
  id: number
  name: string
  username: string
  departmentName: string
  summary: string
}

export interface AdminDashboardResourceItem {
  id: number
  type: 'material' | 'video'
  title: string
  teacherName: string
  courseName: string
  uploadDate: string
}

export interface AdminDashboardTopicItem {
  id: number
  title: string
  teacherName: string
  createTime: string
  replyCount: number
}

export interface AdminDashboardData {
  profile: {
    id: number
    username: string
    name: string
  }
  stats: AdminDashboardStats
  latestTeachers: AdminDashboardTeacherItem[]
  latestResources: AdminDashboardResourceItem[]
  latestTopics: AdminDashboardTopicItem[]
  weeklyActivity: {
    materialCount: number
    videoCount: number
    topicCount: number
    label: string
  }
}

export async function getAdminDashboard() {
  const response = await http.get<ApiSuccess<AdminDashboardData>>('/admin/dashboard')
  return response.data.data
}
