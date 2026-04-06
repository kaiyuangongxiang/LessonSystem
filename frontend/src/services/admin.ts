import http, { type ApiSuccess } from './http'

export interface AdminDashboardStats {
  studentCount: number
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

export interface AdminAccountStats {
  total: number
  namedCount: number
}

export interface AdminAccountItem {
  id: number
  username: string
  name: string
  realName: string
  createTime: string
  updateTime: string
  isCurrent: boolean
}

export interface AdminAccountListData {
  stats: AdminAccountStats
  list: AdminAccountItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface AdminAccountQuery {
  page?: number
  pageSize?: number
  keyword?: string
}

export interface AdminAccountPayload {
  username: string
  realName: string
  password?: string
}

export type AdminAccountMutationData = AdminAccountItem

export interface AdminTeacherStats {
  total: number
  collegeAssignedCount: number
  emailBoundCount: number
  profileCompletedCount: number
}

export interface AdminTeacherItem {
  id: number
  username: string
  teacherName: string
  name: string
  gender: string
  email: string
  collegeId: number | null
  collegeName: string
  profile: string
  registerTime: string
  updateTime: string
  courseCount: number
  resourceCount: number
}

export interface AdminTeacherFormOptions {
  colleges: AdminCollegeOption[]
  genders: string[]
}

export interface AdminTeacherListData {
  stats: AdminTeacherStats
  list: AdminTeacherItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  formOptions: AdminTeacherFormOptions
}

export interface AdminTeacherQuery {
  page?: number
  pageSize?: number
  keyword?: string
  collegeId?: string
}

export interface AdminTeacherPayload {
  username: string
  teacherName: string
  gender: string
  collegeId: string | number
  email: string
  profile: string
  password?: string
}

export type AdminTeacherMutationData = AdminTeacherItem

export interface AdminStudentStats {
  total: number
  collegeAssignedCount: number
  emailBoundCount: number
  profileCompletedCount: number
}

export interface AdminStudentItem {
  id: number
  username: string
  studentName: string
  name: string
  gender: string
  email: string
  collegeId: number | null
  collegeName: string
  profile: string
  registerTime: string
  updateTime: string
}

export interface AdminStudentFormOptions {
  colleges: AdminCollegeOption[]
  genders: string[]
}

export interface AdminStudentListData {
  stats: AdminStudentStats
  list: AdminStudentItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  formOptions: AdminStudentFormOptions
}

export interface AdminStudentQuery {
  page?: number
  pageSize?: number
  keyword?: string
  collegeId?: string
}

export interface AdminStudentPayload {
  username: string
  studentName: string
  gender: string
  collegeId: string | number
  email: string
  profile: string
  password?: string
}

export type AdminStudentMutationData = AdminStudentItem

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
  collegeAssignedCount: number
  contentReadyCount: number
}

export interface AdminCourseItem {
  id: number
  name: string
  summary: string
  teachingGoal: string
  teachingContent: string
  teachingIdea: string
  collegeId: number | null
  collegeName: string
  teacherId: number | null
  teacherName: string
  teacherCollegeId?: number | null
  teacherCollegeName?: string
  teacherCollegeMatched?: boolean | null
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
  teachingGoal: string
  teachingContent: string
  teachingIdea: string
  collegeId: string | number
  teacherId: string | number
}

export interface AdminCourseMutationData extends AdminCourseItem {
  formOptions: AdminCourseFormOptions
}

export type AdminAssetType = 'image' | 'audio' | 'video' | 'text' | 'question' | 'template'

export interface AdminAssetStats {
  total: number
  courseCount: number
  teacherCount: number
  fileCount: number
}

export interface AdminAssetItem {
  id: number
  type: AdminAssetType
  teacherId: number
  courseId: number
  title: string
  courseName: string
  teacherName: string
  description: string
  content: string
  fileName: string
  fileSize: number
  uploadTime: string
  previewUrl: string
}

export interface AdminAssetListData {
  stats: AdminAssetStats
  list: AdminAssetItem[]
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

export interface AdminAssetQuery {
  page?: number
  pageSize?: number
  keyword?: string
  courseId?: string
  type?: AdminAssetType | 'all'
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
  authorName: string
  authorRole: 'teacher' | 'admin'
  teacherId: number | null
  adminId: number | null
  publishDate: string
  lastReplyAt: string
  status: string
  statusLabel: string
  replyCount: number
  canDelete: boolean
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
  authorRole: 'teacher' | 'admin'
  teacherId: number | null
  adminId: number | null
  replyTime: string
  parentReplyId: number | null
  parentAuthorName: string
  canDelete: boolean
}

export interface AdminMessageDetailData {
  topic: {
    id: number
    title: string
    content: string
    teacherId: number | null
    adminId: number | null
    authorName: string
    authorRole: 'teacher' | 'admin'
    publishDate: string
    statusLabel: string
    canDelete: boolean
  }
  replies: AdminMessageReplyItem[]
  capabilities: {
    canCreateTopic: boolean
    canReply: boolean
    canReplyToReply: boolean
  }
}

export interface AdminMessageQuery {
  page?: number
  pageSize?: number
  keyword?: string
}

export interface AdminMessageTopicPayload {
  title: string
  content: string
}

export interface AdminMessageReplyPayload {
  content: string
  parentReplyId?: number | null
}

export interface AdminSystemProfile {
  id: number | null
  systemName: string
  heroTitle: string
  systemIntro: string
  updateTime: string
  updateAdminName: string
}

export interface AdminSystemNoticeItem {
  id: number
  title: string
  content: string
  status: number
  statusLabel: string
  publishTime: string
  updateTime: string
  publisherName: string
}

export interface AdminSystemStats {
  noticeCount: number
  publishedNoticeCount: number
  disabledNoticeCount: number
}

export interface AdminSystemManageData {
  profile: AdminSystemProfile
  notices: AdminSystemNoticeItem[]
  stats: AdminSystemStats
}

export interface AdminSystemProfilePayload {
  systemName: string
  heroTitle: string
  systemIntro: string
}

export interface AdminNoticePayload {
  title: string
  content: string
  status: number
}

export async function getAdminDashboard() {
  const response = await http.get<ApiSuccess<AdminDashboardData>>('/admin/dashboard')
  return response.data.data
}

export async function getAdminSystemManage() {
  const response = await http.get<ApiSuccess<AdminSystemManageData>>('/admin/system')
  return response.data.data
}

export async function updateAdminSystemProfile(payload: AdminSystemProfilePayload) {
  const response = await http.put<ApiSuccess<AdminSystemProfile>>('/admin/system/profile', payload)
  return response.data.data
}

export async function createAdminNotice(payload: AdminNoticePayload) {
  const response = await http.post<ApiSuccess<AdminSystemNoticeItem>>('/admin/system/notices', payload)
  return response.data.data
}

export async function updateAdminNotice(noticeId: number, payload: AdminNoticePayload) {
  const response = await http.put<ApiSuccess<AdminSystemNoticeItem>>(`/admin/system/notices/${noticeId}`, payload)
  return response.data.data
}

export async function deleteAdminNotice(noticeId: number) {
  const response = await http.delete<ApiSuccess<{ id: number; title: string }>>(`/admin/system/notices/${noticeId}`)
  return response.data.data
}

export async function getAdminAccountList(params: AdminAccountQuery) {
  const response = await http.get<ApiSuccess<AdminAccountListData>>('/admin/admins', {
    params,
  })
  return response.data.data
}

export async function createAdminAccount(payload: AdminAccountPayload) {
  const response = await http.post<ApiSuccess<AdminAccountMutationData>>('/admin/admins', payload)
  return response.data.data
}

export async function updateAdminAccount(adminId: number, payload: AdminAccountPayload) {
  const response = await http.put<ApiSuccess<AdminAccountMutationData>>(`/admin/admins/${adminId}`, payload)
  return response.data.data
}

export async function deleteAdminAccount(adminId: number) {
  const response = await http.delete<ApiSuccess<{ id: number; username: string; name: string }>>(`/admin/admins/${adminId}`)
  return response.data.data
}

export async function getAdminTeacherUserList(params: AdminTeacherQuery) {
  const response = await http.get<ApiSuccess<AdminTeacherListData>>('/admin/teachers', {
    params,
  })
  return response.data.data
}

export async function getAdminStudentUserList(params: AdminStudentQuery) {
  const response = await http.get<ApiSuccess<AdminStudentListData>>('/admin/students', {
    params,
  })
  return response.data.data
}

export async function createAdminTeacherUser(payload: AdminTeacherPayload) {
  const response = await http.post<ApiSuccess<AdminTeacherMutationData>>('/admin/teachers', payload)
  return response.data.data
}

export async function createAdminStudentUser(payload: AdminStudentPayload) {
  const response = await http.post<ApiSuccess<AdminStudentMutationData>>('/admin/students', payload)
  return response.data.data
}

export async function updateAdminTeacherUser(teacherId: number, payload: AdminTeacherPayload) {
  const response = await http.put<ApiSuccess<AdminTeacherMutationData>>(`/admin/teachers/${teacherId}`, payload)
  return response.data.data
}

export async function updateAdminStudentUser(studentId: number, payload: AdminStudentPayload) {
  const response = await http.put<ApiSuccess<AdminStudentMutationData>>(`/admin/students/${studentId}`, payload)
  return response.data.data
}

export async function deleteAdminTeacherUser(teacherId: number) {
  const response = await http.delete<ApiSuccess<{ id: number; username: string; name: string }>>(`/admin/teachers/${teacherId}`)
  return response.data.data
}

export async function deleteAdminStudentUser(studentId: number) {
  const response = await http.delete<ApiSuccess<{ id: number; username: string; name: string }>>(`/admin/students/${studentId}`)
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

export interface AdminPrepStats {
  total: number
  draftCount: number
  publishedCount: number
  teacherCount: number
}

export interface AdminPrepItem {
  id: number
  teacherId: number
  courseId: number
  title: string
  courseName: string
  teacherName: string
  teachingObjective: string
  keyPoints: string
  difficultyPoints: string
  studentAnalysis: string
  teachingContent: string
  teachingProcess: string
  reflectionNotes: string
  status: 'draft' | 'published' | 'archived'
  statusLabel: string
  createTime: string
  updateTime: string
}

export interface AdminPrepListData {
  stats: AdminPrepStats
  list: AdminPrepItem[]
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

export interface AdminPrepQuery {
  page?: number
  pageSize?: number
  keyword?: string
  courseId?: string
  status?: 'all' | 'draft' | 'published' | 'archived'
}

export async function getAdminPrepList(params: AdminPrepQuery) {
  const response = await http.get<ApiSuccess<AdminPrepListData>>('/admin/preps', {
    params,
  })
  return response.data.data
}

export async function deleteAdminPrep(prepId: number) {
  const response = await http.delete<ApiSuccess<{ id: number; title: string }>>(`/admin/preps/${prepId}`)
  return response.data.data
}

export async function getAdminAssetList(params: AdminAssetQuery) {
  const response = await http.get<ApiSuccess<AdminAssetListData>>('/admin/assets', {
    params,
  })
  return response.data.data
}

export async function deleteAdminAsset(assetId: number) {
  const response = await http.delete<ApiSuccess<{ id: number; type: AdminAssetType; title: string }>>(`/admin/assets/${assetId}`)
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

export async function createAdminMessage(payload: AdminMessageTopicPayload) {
  const response = await http.post<ApiSuccess<{ id: number; title: string }>>('/admin/messages', payload)
  return response.data.data
}

export async function createAdminMessageReply(messageId: number, payload: AdminMessageReplyPayload) {
  const response = await http.post<ApiSuccess<{ id: number }>>(`/admin/messages/${messageId}/replies`, payload)
  return response.data.data
}

export async function deleteAdminMessage(messageId: number) {
  const response = await http.delete<ApiSuccess<{ id: number; title: string }>>(`/admin/messages/${messageId}`)
  return response.data.data
}

export async function deleteAdminMessageReply(messageId: number, replyId: number) {
  const response = await http.delete<ApiSuccess<{ id: number }>>(`/admin/messages/${messageId}/replies/${replyId}`)
  return response.data.data
}
