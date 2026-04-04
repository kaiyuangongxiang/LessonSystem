import http, { type ApiSuccess } from './http'

export interface TeacherDashboardStats {
  courseCount: number
  materialCount: number
  videoCount: number
  topicCount: number
}

export interface TeacherDashboardUploadItem {
  id: number
  type: 'material' | 'video'
  title: string
  courseName: string
  uploadDate: string
}

export interface TeacherDashboardCourseItem {
  id: number
  name: string
  materialCount: number
  videoCount: number
}

export interface TeacherDashboardData {
  profile: {
    id: number
    name: string
    username: string
  }
  stats: TeacherDashboardStats
  recentUploads: TeacherDashboardUploadItem[]
  hotCourses: TeacherDashboardCourseItem[]
  weeklyActivity: {
    materialCount: number
    videoCount: number
    topicCount: number
  }
}

export async function getTeacherDashboard() {
  const response = await http.get<ApiSuccess<TeacherDashboardData>>('/teacher/dashboard')
  return response.data.data
}
