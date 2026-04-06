import http, { type ApiSuccess } from './http'

export type PortalAssetType = 'image' | 'audio' | 'video' | 'text' | 'question' | 'template'

export interface PortalNoticeItem {
  id: number
  title: string
  content: string
  publishDate: string
}

export interface PortalCourseItem {
  id: number
  name: string
  summary: string
  teacherName: string
}

export interface PortalMaterialItem {
  id: number
  name: string
  courseName: string
  teacherName: string
  uploadDate: string
}

export interface PortalVideoItem {
  id: number
  title: string
  courseName: string
  teacherName: string
  duration: number | null
  uploadDate: string
}

export interface PortalHomeData {
  profile: {
    systemName: string
    heroTitle: string
    systemIntro: string
  }
  notices: PortalNoticeItem[]
  courses: PortalCourseItem[]
  materials: PortalMaterialItem[]
  videos: PortalVideoItem[]
  stats: {
    courseCount: number
    materialCount: number
    videoCount: number
  }
}

export interface PortalPublicAssetStats {
  total: number
  imageCount: number
  mediaCount: number
  contentCount: number
}

export interface PortalPublicAssetItem {
  id: number
  type: PortalAssetType
  visibility: 'public'
  title: string
  description: string
  content: string
  fileName: string
  fileSize: number
  uploadTime: string
  teacherName: string
  previewUrl: string
}

export interface PortalPublicAssetListData {
  stats: PortalPublicAssetStats
  list: PortalPublicAssetItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface PortalPublicAssetQuery {
  page?: number
  pageSize?: number
  keyword?: string
  type?: PortalAssetType | 'all'
}

export async function getPortalHome() {
  const response = await http.get<ApiSuccess<PortalHomeData>>('/portal/home')
  return response.data.data
}

export async function getPortalPublicAssets(params: PortalPublicAssetQuery) {
  const response = await http.get<ApiSuccess<PortalPublicAssetListData>>('/portal/assets', {
    params,
  })
  return response.data.data
}
