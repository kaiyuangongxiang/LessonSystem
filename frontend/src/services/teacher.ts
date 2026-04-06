import http, { type ApiSuccess } from './http'

export interface TeacherDashboardStats {
  courseCount: number
  assetCount: number
  publicAssetCount: number
  prepCount: number
  publishedPrepCount: number
}

export interface TeacherDashboardAssetItem {
  id: number
  type: 'image' | 'audio' | 'video' | 'text' | 'question' | 'template'
  title: string
  visibility: 'public' | 'private'
  uploadDate: string
}

export interface TeacherDashboardPrepItem {
  id: number
  title: string
  status: 'draft' | 'published' | 'archived'
  statusLabel: string
  courseName: string
  updateDate: string
}

export interface TeacherDashboardCourseItem {
  id: number
  name: string
  assetCount: number
  prepCount: number
}

export interface TeacherDashboardData {
  profile: {
    id: number
    name: string
    username: string
  }
  stats: TeacherDashboardStats
  recentAssets: TeacherDashboardAssetItem[]
  recentPreps: TeacherDashboardPrepItem[]
  courseCoverage: TeacherDashboardCourseItem[]
  weeklyActivity: {
    assetCount: number
    prepCount: number
    publicAssetCount: number
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

export interface TeacherResourceBundleUploadPayload {
  courseId: string
  title: string
  description: string
  material?: File | null
  video?: File | null
  cover?: File | null
  duration?: number | null
}

export interface TeacherResourceBundleUploadResultItem {
  id: number
  type: 'material' | 'video'
  title: string
  fileName: string
  fileSize: number
  duration?: number | null
  coverFileName?: string
}

export interface TeacherResourceBundleUploadResult {
  title: string
  courseId: number
  courseName: string
  created: TeacherResourceBundleUploadResultItem[]
  uploadTime: string
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

export interface TeacherPrepStats {
  total: number
  draftCount: number
  publishedCount: number
  courseCount: number
}

export interface TeacherPrepItem {
  id: number
  teacherId: number
  courseId: number
  courseName: string
  title: string
  teachingContent: string
  status: 'draft' | 'published' | 'archived'
  statusLabel: string
  createTime: string
  updateTime: string
  attachmentCount: number
  attachments: TeacherPrepAttachmentItem[]
}

export interface TeacherPrepOption {
  id: number
  courseId: number
  title: string
  courseName: string
  status: 'draft' | 'published' | 'archived'
  statusLabel: string
}

export interface TeacherPrepListData {
  stats: TeacherPrepStats
  list: TeacherPrepItem[]
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

export interface TeacherPrepQuery {
  page?: number
  pageSize?: number
  keyword?: string
  courseId?: string
  status?: 'all' | 'draft' | 'published' | 'archived'
}

export interface TeacherPrepPayload {
  courseId: string
  title: string
  status: 'draft' | 'published'
  teachingContent: string
}

export type TeacherCoursewareStatus = 'draft' | 'published'
export type TeacherCoursewareTemplate = 'cover' | 'agenda' | 'content' | 'two-column' | 'summary'
export type TeacherCoursewareTextStyle = 'title' | 'subtitle' | 'body' | 'caption' | 'quote'
export type TeacherCoursewareTextAlign = 'left' | 'center' | 'right'

export interface TeacherCoursewareTextBlock {
  id: string
  type: 'text'
  text: string
  style: TeacherCoursewareTextStyle
  align: TeacherCoursewareTextAlign
}

export interface TeacherCoursewareImageBlock {
  id: string
  type: 'image'
  assetId: number
  title: string
  description: string
  courseName: string
  previewUrl: string
  caption: string
}

export interface TeacherCoursewareResourceBlock {
  id: string
  type: 'resource'
  resourceId: number
  title: string
  description: string
  courseName: string
  fileName: string
  previewUrl: string
  caption: string
}

export interface TeacherCoursewareVideoBlock {
  id: string
  type: 'video'
  resourceId: number
  title: string
  description: string
  courseName: string
  duration: number | null
  previewUrl: string
  caption: string
}

export type TeacherCoursewareBlock =
  | TeacherCoursewareTextBlock
  | TeacherCoursewareImageBlock
  | TeacherCoursewareResourceBlock
  | TeacherCoursewareVideoBlock

export interface TeacherCoursewareSlide {
  id: string
  title: string
  template: TeacherCoursewareTemplate
  note: string
  blocks: TeacherCoursewareBlock[]
}

export interface TeacherCoursewareContent {
  version: number
  slides: TeacherCoursewareSlide[]
}

export interface TeacherCoursewareStats {
  total: number
  draftCount: number
  publishedCount: number
  courseCount: number
}

export interface TeacherCoursewareItem {
  id: number
  teacherId: number
  courseId: number
  prepId: number
  title: string
  summary: string
  status: TeacherCoursewareStatus
  statusLabel: string
  courseName: string
  prepTitle: string
  slideCount: number
  blockCount: number
  coverPreviewUrl: string
  createTime: string
  updateTime: string
  publishedTime: string
}

export interface TeacherCoursewareDetail extends TeacherCoursewareItem {
  content: TeacherCoursewareContent
}

export interface TeacherCoursewareListData {
  stats: TeacherCoursewareStats
  list: TeacherCoursewareItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  filters: {
    courses: TeacherCourseOption[]
    preps: TeacherPrepOption[]
  }
}

export interface TeacherCoursewareDetailData {
  courseware: TeacherCoursewareDetail
  options: {
    courses: TeacherCourseOption[]
    preps: TeacherPrepOption[]
  }
}

export interface TeacherCoursewareQuery {
  page?: number
  pageSize?: number
  keyword?: string
  courseId?: string
  prepId?: string
  status?: 'all' | TeacherCoursewareStatus
}

export interface TeacherCoursewareCreatePayload {
  courseId: string
  prepId: string
  title: string
  summary: string
  initialTemplate?: TeacherCoursewareTemplate
}

export interface TeacherCoursewareUpdatePayload {
  courseId: string
  prepId: string
  title: string
  summary: string
  status?: TeacherCoursewareStatus
  content: TeacherCoursewareContent
}

export async function getTeacherPreps(params: TeacherPrepQuery) {
  const response = await http.get<ApiSuccess<TeacherPrepListData>>('/teacher/preps', {
    params,
  })
  return response.data.data
}

export async function createTeacherPrep(payload: TeacherPrepPayload) {
  const response = await http.post<ApiSuccess<TeacherPrepItem>>('/teacher/preps', payload)
  return response.data.data
}

export async function updateTeacherPrep(prepId: number, payload: TeacherPrepPayload) {
  const response = await http.put<ApiSuccess<TeacherPrepItem>>(`/teacher/preps/${prepId}`, payload)
  return response.data.data
}

export async function deleteTeacherPrep(prepId: number) {
  const response = await http.delete<ApiSuccess<{ id: number; title: string }>>(`/teacher/preps/${prepId}`)
  return response.data.data
}

export async function addTeacherPrepAssetAttachments(prepId: number, assetIds: number[]) {
  const response = await http.post<ApiSuccess<{ prepId: number; attachmentCount: number; attachments: TeacherPrepAttachmentItem[] }>>(
    `/teacher/preps/${prepId}/attachments/assets`,
    { assetIds },
  )
  return response.data.data
}

export async function uploadTeacherPrepAttachments(prepId: number, files: File[]) {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })

  const response = await http.post<ApiSuccess<{ prepId: number; attachmentCount: number; attachments: TeacherPrepAttachmentItem[] }>>(
    `/teacher/preps/${prepId}/attachments/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )
  return response.data.data
}

export async function deleteTeacherPrepAttachment(prepId: number, attachmentId: number) {
  const response = await http.delete<ApiSuccess<{ id: number; prepId: number; sourceType: 'upload' | 'asset' }>>(
    `/teacher/preps/${prepId}/attachments/${attachmentId}`,
  )
  return response.data.data
}

export async function getTeacherCoursewares(params: TeacherCoursewareQuery) {
  const response = await http.get<ApiSuccess<TeacherCoursewareListData>>('/teacher/coursewares', {
    params,
  })
  return response.data.data
}

export async function createTeacherCourseware(payload: TeacherCoursewareCreatePayload) {
  const response = await http.post<ApiSuccess<TeacherCoursewareDetail>>('/teacher/coursewares', payload)
  return response.data.data
}

export async function getTeacherCoursewareDetail(coursewareId: number) {
  const response = await http.get<ApiSuccess<TeacherCoursewareDetailData>>(`/teacher/coursewares/${coursewareId}`)
  return response.data.data
}

export async function updateTeacherCourseware(coursewareId: number, payload: TeacherCoursewareUpdatePayload) {
  const response = await http.put<ApiSuccess<TeacherCoursewareDetail>>(`/teacher/coursewares/${coursewareId}`, payload)
  return response.data.data
}

export async function deleteTeacherCourseware(coursewareId: number) {
  const response = await http.delete<ApiSuccess<{ id: number; title: string }>>(`/teacher/coursewares/${coursewareId}`)
  return response.data.data
}

export async function publishTeacherCourseware(coursewareId: number) {
  const response = await http.post<ApiSuccess<TeacherCoursewareDetail>>(`/teacher/coursewares/${coursewareId}/publish`)
  return response.data.data
}

export type TeacherAssetType = 'image' | 'audio' | 'video' | 'text' | 'question' | 'template'
export type TeacherAssetVisibility = 'private' | 'public'

export interface TeacherPrepAttachmentItem {
  id: number
  sourceType: 'upload' | 'asset'
  sourceLabel: string
  assetId: number | null
  type: string
  title: string
  description?: string
  content?: string
  fileName: string
  fileSize: number
  mimeType: string
  visibility: TeacherAssetVisibility
  downloadUrl: string
  uploadTime: string
}

export interface TeacherAssetItem {
  id: number
  type: TeacherAssetType
  courseId: number
  courseName: string
  visibility: TeacherAssetVisibility
  title: string
  description: string
  content: string
  fileName: string
  fileSize: number
  uploadTime?: string
  previewUrl: string
}

export interface TeacherAssetStats {
  total: number
  publicCount: number
  privateCount: number
  imageCount: number
  audioCount: number
  videoCount: number
  contentCount: number
}

export interface TeacherAssetListData {
  stats: TeacherAssetStats
  list: TeacherAssetItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  filters: {
    courses?: TeacherCourseOption[]
    visibilityOptions?: Array<{ value: string; label: string }>
  }
}

export interface TeacherAssetQuery {
  page?: number
  pageSize?: number
  keyword?: string
  courseId?: string
  type?: TeacherAssetType | 'all'
  visibility?: TeacherAssetVisibility | 'all'
}

export interface TeacherAssetPayload {
  type: TeacherAssetType
  courseId?: string
  visibility: TeacherAssetVisibility
  title: string
  description: string
  content: string
  file?: File | null
}

export interface TeacherAssetUpdatePayload {
  courseId?: string
  visibility: TeacherAssetVisibility
  title: string
  description: string
  content: string
}

export async function getTeacherAssets(params: TeacherAssetQuery) {
  const response = await http.get<ApiSuccess<TeacherAssetListData>>('/teacher/assets', {
    params,
  })
  return response.data.data
}

export async function createTeacherAsset(payload: TeacherAssetPayload) {
  const formData = new FormData()
  formData.append('type', payload.type)
  formData.append('visibility', payload.visibility)
  if (payload.courseId) {
    formData.append('courseId', payload.courseId)
  }
  formData.append('title', payload.title)
  formData.append('description', payload.description)
  formData.append('content', payload.content)
  if (payload.file) {
    formData.append('file', payload.file)
  }

  const response = await http.post<ApiSuccess<TeacherAssetItem>>('/teacher/assets', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data.data
}

export async function getTeacherAssetDetail(assetId: number) {
  const response = await http.get<ApiSuccess<TeacherAssetItem>>(`/teacher/assets/${assetId}`)
  return response.data.data
}

export async function updateTeacherAssetDetail(assetId: number, payload: TeacherAssetUpdatePayload) {
  const response = await http.put<ApiSuccess<TeacherAssetItem>>(`/teacher/assets/${assetId}`, payload)
  return response.data.data
}

export async function deleteTeacherAssetDetail(assetId: number) {
  const response = await http.delete<ApiSuccess<{ id: number; type: TeacherAssetType; title: string }>>(`/teacher/assets/${assetId}`)
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

export async function uploadTeacherResourceBundle(payload: TeacherResourceBundleUploadPayload) {
  const formData = new FormData()
  formData.append('courseId', payload.courseId)
  formData.append('title', payload.title)
  formData.append('description', payload.description)
  if (payload.material) {
    formData.append('material', payload.material)
  }
  if (payload.video) {
    formData.append('video', payload.video)
  }
  if (payload.cover) {
    formData.append('cover', payload.cover)
  }
  if (payload.duration !== undefined && payload.duration !== null) {
    formData.append('duration', String(payload.duration))
  }

  const response = await http.post<ApiSuccess<TeacherResourceBundleUploadResult>>('/teacher/resources/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 30 * 60 * 1000,
  })

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

export interface TeacherMessageItem {
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

export interface TeacherMessageReplyItem {
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

export interface TeacherMessageDetailData {
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
  replies: TeacherMessageReplyItem[]
  capabilities: {
    canCreateTopic: boolean
    canReply: boolean
    canReplyToReply: boolean
  }
}

export interface TeacherMessageListData {
  list: TeacherMessageItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface TeacherMessageQuery {
  page?: number
  pageSize?: number
  keyword?: string
}

export interface TeacherMessageTopicPayload {
  title: string
  content: string
}

export interface TeacherMessageReplyPayload {
  content: string
  parentReplyId?: number | null
}

export async function getTeacherMessageList(params: TeacherMessageQuery) {
  const response = await http.get<ApiSuccess<TeacherMessageListData>>('/teacher/messages', {
    params,
  })
  return response.data.data
}

export async function createTeacherMessage(payload: TeacherMessageTopicPayload) {
  const response = await http.post<ApiSuccess<{ id: number; title: string }>>('/teacher/messages', payload)
  return response.data.data
}

export async function getTeacherMessageDetail(messageId: number) {
  const response = await http.get<ApiSuccess<TeacherMessageDetailData>>(`/teacher/messages/${messageId}`)
  return response.data.data
}

export async function createTeacherMessageReply(messageId: number, payload: TeacherMessageReplyPayload) {
  const response = await http.post<ApiSuccess<{ id: number }>>(`/teacher/messages/${messageId}/replies`, payload)
  return response.data.data
}

export async function deleteTeacherMessage(messageId: number) {
  const response = await http.delete<ApiSuccess<{ id: number; title: string }>>(`/teacher/messages/${messageId}`)
  return response.data.data
}

export async function deleteTeacherMessageReply(messageId: number, replyId: number) {
  const response = await http.delete<ApiSuccess<{ id: number }>>(`/teacher/messages/${messageId}/replies/${replyId}`)
  return response.data.data
}
