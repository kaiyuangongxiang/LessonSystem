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

export interface TeacherCourseOption {
  id: number
  name: string
}

export interface TeacherMaterialUploadPayload {
  courseId: string
  materialName: string
  description: string
  file: File
}

export interface TeacherMaterialUploadResult {
  id: number
  materialName: string
  courseId: number
  courseName: string
  fileName: string
  fileSize: number
  materialType: string
  uploadTime: string
}

export async function getTeacherDashboard() {
  const response = await http.get<ApiSuccess<TeacherDashboardData>>('/teacher/dashboard')
  return response.data.data
}

export async function getTeacherCourseOptions() {
  const response = await http.get<ApiSuccess<TeacherCourseOption[]>>('/teacher/courses/options')
  return response.data.data
}


export async function uploadTeacherMaterial(payload: TeacherMaterialUploadPayload) {
  const formData = new FormData()
  formData.append('courseId', payload.courseId)
  formData.append('materialName', payload.materialName)
  formData.append('description', payload.description)
  formData.append('file', payload.file)

  const response = await http.post<ApiSuccess<TeacherMaterialUploadResult>>('/teacher/materials', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data.data
}

export interface TeacherVideoUploadPayload {
  courseId: string
  videoTitle: string
  description: string
  duration?: number | null
  video: File
  cover?: File | null
}

export interface TeacherVideoUploadResult {
  id: number
  videoTitle: string
  courseId: number
  courseName: string
  fileName: string
  fileSize: number
  coverFileName: string
  duration: number | null
  uploadTime: string
}

export async function uploadTeacherVideo(payload: TeacherVideoUploadPayload) {
  const formData = new FormData()
  formData.append('courseId', payload.courseId)
  formData.append('videoTitle', payload.videoTitle)
  formData.append('description', payload.description)
  if (payload.duration !== undefined && payload.duration !== null) {
    formData.append('duration', String(payload.duration))
  }
  formData.append('video', payload.video)
  if (payload.cover) {
    formData.append('cover', payload.cover)
  }

  const response = await http.post<ApiSuccess<TeacherVideoUploadResult>>('/teacher/videos', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 30 * 60 * 1000,
  })

  return response.data.data
}
