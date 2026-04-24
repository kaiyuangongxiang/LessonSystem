import http, { type ApiSuccess } from './http'

export type StudentMessageAuthorRole = 'teacher' | 'admin' | 'student'

export interface StudentMessageItem {
  id: number
  title: string
  summary: string
  authorName: string
  authorRole: StudentMessageAuthorRole
  teacherId: number | null
  adminId: number | null
  studentId: number | null
  publishDate: string
  lastReplyAt: string
  status: string
  statusLabel: string
  replyCount: number
  canDelete: boolean
}

export interface StudentMessageReplyItem {
  id: number
  content: string
  authorName: string
  authorRole: StudentMessageAuthorRole
  teacherId: number | null
  adminId: number | null
  studentId: number | null
  replyTime: string
  parentReplyId: number | null
  parentAuthorName: string
  canDelete: boolean
}

export interface StudentMessageDetailData {
  topic: {
    id: number
    title: string
    content: string
    teacherId: number | null
    adminId: number | null
    studentId: number | null
    authorName: string
    authorRole: StudentMessageAuthorRole
    publishDate: string
    statusLabel: string
    canDelete: boolean
  }
  replies: StudentMessageReplyItem[]
  capabilities: {
    canCreateTopic: boolean
    canReply: boolean
    canReplyToReply: boolean
  }
}

export interface StudentMessageListData {
  list: StudentMessageItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface StudentMessageQuery {
  page?: number
  pageSize?: number
  keyword?: string
}

export interface StudentMessageTopicPayload {
  title: string
  content: string
}

export interface StudentMessageReplyPayload {
  content: string
  parentReplyId?: number | null
}

export async function getStudentMessageList(params: StudentMessageQuery) {
  const response = await http.get<ApiSuccess<StudentMessageListData>>('/student/messages', {
    params,
  })
  return response.data.data
}

export async function createStudentMessage(payload: StudentMessageTopicPayload) {
  const response = await http.post<ApiSuccess<{ id: number; title: string }>>('/student/messages', payload)
  return response.data.data
}

export async function getStudentMessageDetail(messageId: number) {
  const response = await http.get<ApiSuccess<StudentMessageDetailData>>(`/student/messages/${messageId}`)
  return response.data.data
}

export async function createStudentMessageReply(messageId: number, payload: StudentMessageReplyPayload) {
  const response = await http.post<ApiSuccess<{ id: number }>>(`/student/messages/${messageId}/replies`, payload)
  return response.data.data
}

export async function deleteStudentMessage(messageId: number) {
  const response = await http.delete<ApiSuccess<{ id: number; title: string }>>(`/student/messages/${messageId}`)
  return response.data.data
}

export async function deleteStudentMessageReply(messageId: number, replyId: number) {
  const response = await http.delete<ApiSuccess<{ id: number }>>(`/student/messages/${messageId}/replies/${replyId}`)
  return response.data.data
}
