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

export interface TeacherProfileFormData {
  id: number
  username: string
  teacherName: string
  gender: string
  email: string
  collegeId: number | null
  collegeName: string
  profile: string
}

export interface TeacherProfileOptions {
  genders: string[]
  colleges: TeacherCourseOption[]
}

export interface TeacherProfileResponse {
  profile: TeacherProfileFormData
  options: TeacherProfileOptions
}

export interface TeacherProfileUpdatePayload {
  username: string
  teacherName: string
  gender: string
  email: string
  collegeId: string
  profile: string
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

export async function getTeacherProfile() {
  const response = await http.get<ApiSuccess<TeacherProfileResponse>>('/teacher/profile')
  return response.data.data
}

export async function updateTeacherProfile(payload: TeacherProfileUpdatePayload) {
  const response = await http.put<ApiSuccess<TeacherProfileFormData>>('/teacher/profile', payload)
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

export interface TeacherResourceStats {
  total: number
  materialCount: number
  videoCount: number
  interactionCount: number
}

export interface TeacherOwnedResourceItem {
  id: number
  type: 'material' | 'video'
  title: string
  courseId: number
  courseName: string
  description: string
  fileName: string
  fileSize: number
  format: string
  duration: number | null
  uploadTime: string
  interactionCount: number
  previewUrl: string
}

export interface TeacherResourceListData {
  stats: TeacherResourceStats
  list: TeacherOwnedResourceItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  filters: {
    courses: TeacherCourseOption[]
  }
}

export interface TeacherResourceQuery {
  page?: number
  pageSize?: number
  keyword?: string
  courseId?: string
  type?: 'all' | 'material' | 'video'
}

export interface TeacherResourceUpdatePayload {
  title: string
  courseId: string
  description: string
}

export async function getTeacherResources(params: TeacherResourceQuery) {
  const response = await http.get<ApiSuccess<TeacherResourceListData>>('/teacher/resources', {
    params,
  })
  return response.data.data
}

export async function getTeacherResourceDetail(type: 'material' | 'video', resourceId: number) {
  const response = await http.get<ApiSuccess<TeacherOwnedResourceItem>>(`/teacher/resources/${type}/${resourceId}`)
  return response.data.data
}

export async function updateTeacherResource(type: 'material' | 'video', resourceId: number, payload: TeacherResourceUpdatePayload) {
  const response = await http.put<ApiSuccess<{ id: number; type: 'material' | 'video'; title: string; courseId: number; courseName: string; description: string }>>(
    `/teacher/resources/${type}/${resourceId}`,
    payload,
  )
  return response.data.data
}

export async function deleteTeacherResource(type: 'material' | 'video', resourceId: number) {
  const response = await http.delete<ApiSuccess<{ id: number; type: 'material' | 'video' }>>(`/teacher/resources/${type}/${resourceId}`)
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
