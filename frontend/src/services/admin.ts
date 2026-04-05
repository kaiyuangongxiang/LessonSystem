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

export interface AdminCollegeOption {
  id: number
  name: string
}

export interface AdminCollegeStats {
  total: number
  teacherCount: number
  courseCount: number
}

export interface AdminCollegeItem {
  id: number
  name: string
  intro: string
  teacherCount: number
  courseCount: number
  updateDate: string
}

export interface AdminCollegeListData {
  stats: AdminCollegeStats
  list: AdminCollegeItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface AdminCollegeQuery {
  page?: number
  pageSize?: number
  keyword?: string
}

export interface AdminCollegePayload {
  name: string
  intro: string
}

export type AdminCollegeMutationData = AdminCollegeItem

export interface AdminCourseTeacherOption {
  id: number
  name: string
  collegeId: number | null
  collegeName: string
}

export interface AdminCourseStats {
  total: number
  teacherCount: number
  materialCount: number
  videoCount: number
}

export interface AdminCourseItem {
  id: number
  name: string
  summary: string
  collegeId: number | null
  collegeName: string
  teacherId: number | null
  teacherName: string
  materialCount: number
  videoCount: number
  updateDate: string
}

export interface AdminCourseFormOptions {
  colleges: AdminCollegeOption[]
  teachers: AdminCourseTeacherOption[]
}

export interface AdminCourseListData {
  stats: AdminCourseStats
  list: AdminCourseItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  filters: {
    colleges: AdminCollegeOption[]
  }
  formOptions: AdminCourseFormOptions
}

export interface AdminCourseQuery {
  page?: number
  pageSize?: number
  keyword?: string
  collegeId?: string
  sort?: 'recent' | 'video-rich'
}

export interface AdminCoursePayload {
  name: string
  summary: string
  collegeId: string | number
  teacherId: string | number
}

export interface AdminCourseMutationData extends AdminCourseItem {
  formOptions: AdminCourseFormOptions
}

export interface AdminResourceStats {
  total: number
  courseCount: number
  teacherCount: number
  interactionCount: number
}

export interface AdminCourseOption {
  id: number
  name: string
}

export interface AdminManagedResourceItem {
  id: number
  type: 'material' | 'video'
  courseId: number
  teacherId: number
  title: string
  courseName: string
  teacherName: string
  description: string
  fileName: string
  fileSize: number
  format: string
  duration: number | null
  uploadTime: string
  interactionCount: number
  previewUrl: string
}

export interface AdminResourceListData {
  stats: AdminResourceStats
  list: AdminManagedResourceItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  filters: {
    courses: AdminCourseOption[]
  }
}

export interface AdminResourceQuery {
  page?: number
  pageSize?: number
  keyword?: string
  courseId?: string
}

export interface AdminMessageItem {
  id: number
  title: string
  summary: string
  teacherName: string
  publishDate: string
  lastReplyAt: string
  status: string
  statusLabel: string
  replyCount: number
}

export interface AdminMessageListData {
  list: AdminMessageItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface AdminMessageReplyItem {
  id: number
  content: string
  authorName: string
  replyTime: string
}

export interface AdminMessageDetailData {
  topic: {
    id: number
    title: string
    content: string
    teacherId: number
    teacherName: string
    publishDate: string
    statusLabel: string
  }
  replies: AdminMessageReplyItem[]
  capabilities: {
    canReply: boolean
  }
}

export interface AdminMessageQuery {
  page?: number
  pageSize?: number
  keyword?: string
}

export async function getAdminDashboard() {
  const response = await http.get<ApiSuccess<AdminDashboardData>>('/admin/dashboard')
  return response.data.data
}

export async function getAdminCollegeList(params: AdminCollegeQuery) {
  const response = await http.get<ApiSuccess<AdminCollegeListData>>('/admin/colleges', {
    params,
  })
  return response.data.data
}

export async function createAdminCollege(payload: AdminCollegePayload) {
  const response = await http.post<ApiSuccess<AdminCollegeMutationData>>('/admin/colleges', payload)
  return response.data.data
}

export async function updateAdminCollege(collegeId: number, payload: AdminCollegePayload) {
  const response = await http.put<ApiSuccess<AdminCollegeMutationData>>(`/admin/colleges/${collegeId}`, payload)
  return response.data.data
}

export async function deleteAdminCollege(collegeId: number) {
  const response = await http.delete<ApiSuccess<{ id: number; name: string }>>(`/admin/colleges/${collegeId}`)
  return response.data.data
}

export async function getAdminCourseList(params: AdminCourseQuery) {
  const response = await http.get<ApiSuccess<AdminCourseListData>>('/admin/courses', {
    params,
  })
  return response.data.data
}

export async function createAdminCourse(payload: AdminCoursePayload) {
  const response = await http.post<ApiSuccess<AdminCourseMutationData>>('/admin/courses', payload)
  return response.data.data
}

export async function updateAdminCourse(courseId: number, payload: AdminCoursePayload) {
  const response = await http.put<ApiSuccess<AdminCourseMutationData>>(`/admin/courses/${courseId}`, payload)
  return response.data.data
}

export async function deleteAdminCourse(courseId: number) {
  const response = await http.delete<ApiSuccess<{ id: number; name: string }>>(`/admin/courses/${courseId}`)
  return response.data.data
}

export async function getAdminMaterialList(params: AdminResourceQuery) {
  const response = await http.get<ApiSuccess<AdminResourceListData>>('/admin/materials', {
    params,
  })
  return response.data.data
}

export async function deleteAdminMaterial(resourceId: number) {
  const response = await http.delete<ApiSuccess<{ id: number; type: 'material'; title: string }>>(`/admin/materials/${resourceId}`)
  return response.data.data
}

export async function getAdminVideoList(params: AdminResourceQuery) {
  const response = await http.get<ApiSuccess<AdminResourceListData>>('/admin/videos', {
    params,
  })
  return response.data.data
}

export async function deleteAdminVideo(resourceId: number) {
  const response = await http.delete<ApiSuccess<{ id: number; type: 'video'; title: string }>>(`/admin/videos/${resourceId}`)
  return response.data.data
}

export async function getAdminMessageList(params: AdminMessageQuery) {
  const response = await http.get<ApiSuccess<AdminMessageListData>>('/admin/messages', {
    params,
  })
  return response.data.data
}

export async function getAdminMessageDetail(messageId: number) {
  const response = await http.get<ApiSuccess<AdminMessageDetailData>>(`/admin/messages/${messageId}`)
  return response.data.data
}

export async function createAdminMessageReply(messageId: number, payload: { content: string }) {
  const response = await http.post<ApiSuccess<{ id: number }>>(`/admin/messages/${messageId}/replies`, payload)
  return response.data.data
}

export async function deleteAdminMessage(messageId: number) {
  const response = await http.delete<ApiSuccess<{ id: number; title: string }>>(`/admin/messages/${messageId}`)
  return response.data.data
}
