<template>
  <main class="course-detail-page">
    <PortalTopNav />

    <header class="course-detail-nav">
      <div>
        <div class="course-detail-nav__eyebrow">COURSE DETAIL</div>
        <h1>课程详情页</h1>
        <p>{{ detailSubtitle }}</p>
      </div>

      <div class="course-detail-nav__actions">
        <button type="button" class="course-chip" @click="router.push('/courses')">返回课程列表</button>
        <button type="button" class="course-detail-home-btn" @click="router.push('/')">返回首页</button>
      </div>
    </header>

    <section class="course-detail-hero">
      <div>
        <h2>{{ detail.course.name }}</h2>
        <div class="course-detail-hero__chips">
          <span class="course-chip is-active">{{ detail.course.collegeName }}</span>
          <span class="course-chip course-chip--soft">负责人：{{ detail.course.teacherName }}</span>
        </div>
        <p>{{ detail.course.summary }}</p>
      </div>

      <div class="course-detail-hero__meta">
        <span>最近更新</span>
        <strong>{{ detail.course.updateDate }}</strong>
      </div>
    </section>

    <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>

    <section class="course-detail-info-grid">
      <article class="course-detail-panel">
        <div class="course-detail-panel__eyebrow">COURSE SUMMARY</div>
        <h3>课程简介</h3>
        <p>{{ detail.course.summary }}</p>
      </article>

      <article class="course-detail-panel">
        <div class="course-detail-panel__eyebrow">RESOURCE OVERVIEW</div>
        <h3>资源概览</h3>
        <p>当前课程共关联 {{ detail.materials.length }} 份资料、{{ detail.videos.length }} 个视频，相关教学资料可结合备课单继续查看。</p>
      </article>

      <article class="course-detail-panel">
        <div class="course-detail-panel__eyebrow">COURSE OWNER</div>
        <h3>课程归属</h3>
        <p>{{ detail.course.collegeName }} · {{ detail.course.teacherName }} 负责维护，最近更新于 {{ detail.course.updateDate }}。</p>
      </article>
    </section>

    <section class="course-detail-prep-panel">
      <div class="course-detail-table__head">
        <div>
          <div class="course-detail-panel__eyebrow">TEACHING PREPS</div>
          <h3>关联备课单</h3>
        </div>
        <span class="course-detail-prep-panel__meta">共 {{ detail.preps.length }} 份已发布备课单</span>
      </div>

      <div v-if="detail.preps.length" class="course-detail-prep-list">
        <article v-for="prep in detail.preps" :key="prep.id" class="course-detail-prep-card">
          <div class="course-detail-prep-card__head">
            <div>
              <strong>{{ prep.title }}</strong>
              <p>{{ prep.teacherName }} · 更新于 {{ prep.updateTime }}</p>
            </div>
            <button type="button" class="course-chip course-chip--soft" @click="togglePrep(prep.id)">
              {{ expandedPrepId === prep.id ? '收起资料' : `查看资料 ${prep.attachmentCount}` }}
            </button>
          </div>

          <p class="course-detail-prep-card__summary">{{ prep.teachingContent || '当前备课单暂无教学内容摘要。' }}</p>

          <div v-if="expandedPrepId === prep.id" class="course-detail-prep-card__body">
            <div v-if="prep.attachments.length" class="course-detail-prep-attachment-list">
              <div v-for="attachment in prep.attachments" :key="attachment.id" class="course-detail-prep-attachment">
                <div>
                  <strong>{{ attachment.title }}</strong>
                  <p>{{ attachment.sourceLabel }} · {{ assetTypeLabel(attachment.type) }}</p>
                </div>
                <div class="course-detail-row__meta">
                  <span>{{ attachment.uploadTime }}</span>
                  <button type="button" v-if="attachment.previewUrl" @click="openAttachmentPreview(attachment)">查看资料</button>
                  <a v-if="attachment.downloadUrl" :href="materialHref(attachment.downloadUrl)" target="_blank" rel="noreferrer">下载文件</a>
                </div>
              </div>
            </div>

            <div v-else class="course-detail-empty course-detail-empty--compact">当前备课单还没有关联具体资料。</div>
          </div>
        </article>
      </div>

      <div v-else class="course-detail-empty">当前课程暂无已发布备课单。</div>
    </section>

    <div v-if="previewVisible" class="course-detail-preview-mask" @click.self="closeAttachmentPreview">
      <section class="course-detail-preview-dialog">
        <div class="course-detail-preview-dialog__head">
          <div>
            <div class="course-detail-panel__eyebrow">FILE PREVIEW</div>
            <h3>{{ previewAttachment?.title || '资料预览' }}</h3>
            <p>{{ previewAttachment ? `${previewAttachment.sourceLabel} · ${assetTypeLabel(previewAttachment.type)}` : '正在准备预览内容' }}</p>
          </div>
          <button type="button" class="course-chip course-chip--soft" @click="closeAttachmentPreview">关闭</button>
        </div>

        <div class="course-detail-preview-dialog__body">
          <div v-if="previewLoading" class="course-detail-empty course-detail-empty--compact">资料预览加载中...</div>
          <div v-else-if="previewError" class="course-detail-empty course-detail-empty--compact">{{ previewError }}</div>
          <img v-else-if="previewMode === 'image' && previewObjectUrl" class="course-detail-preview-media" :src="previewObjectUrl" :alt="previewAttachment?.title || '图片预览'" />
          <video v-else-if="previewMode === 'video' && previewObjectUrl" class="course-detail-preview-media" :src="previewObjectUrl" controls preload="metadata"></video>
          <audio v-else-if="previewMode === 'audio' && previewObjectUrl" class="course-detail-preview-audio" :src="previewObjectUrl" controls preload="metadata"></audio>
          <pre v-else-if="previewMode === 'text'" class="course-detail-preview-text">{{ previewTextContent }}</pre>
          <iframe
            v-else-if="previewObjectUrl"
            class="course-detail-preview-frame"
            :src="previewObjectUrl"
            title="资料预览"
          ></iframe>
        </div>

        <div class="course-detail-preview-dialog__actions">
          <a
            v-if="previewAttachment?.downloadUrl"
            class="course-detail-home-btn"
            :href="materialHref(previewAttachment.downloadUrl)"
            target="_blank"
            rel="noreferrer"
          >
            下载文件
          </a>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PortalTopNav from '@/components/navigation/PortalTopNav.vue'
import http from '@/services/http'

interface MaterialItem {
  id: number
  name: string
  teacherName: string
  uploadDate: string
  downloadUrl: string
}

interface VideoItem {
  id: number
  title: string
  teacherName: string
  uploadDate: string
  duration: number | null
  playUrl: string
}

interface PrepAttachmentItem {
  id: number
  sourceType: 'asset' | 'upload'
  sourceLabel: string
  type: 'image' | 'audio' | 'video' | 'text' | 'file'
  title: string
  description: string
  content: string
  fileName: string
  fileSize: number
  uploadTime: string
  previewUrl: string
  downloadUrl: string
}

interface PrepItem {
  id: number
  teacherId: number
  courseId: number
  title: string
  teachingContent: string
  teacherName: string
  status: 'published'
  createTime: string
  updateTime: string
  attachmentCount: number
  attachments: PrepAttachmentItem[]
}

interface CourseDetailResponse {
  course: {
    id: number
    name: string
    summary: string
    collegeName: string
    teacherName: string
    updateDate: string
  }
  materials: MaterialItem[]
  videos: VideoItem[]
  preps: PrepItem[]
}

const route = useRoute()
const router = useRouter()
const errorMessage = ref('')
const expandedPrepId = ref<number | null>(null)
const previewVisible = ref(false)
const previewLoading = ref(false)
const previewError = ref('')
const previewAttachment = ref<PrepAttachmentItem | null>(null)
const previewObjectUrl = ref('')
const previewTextContent = ref('')
const previewMode = ref<'image' | 'video' | 'audio' | 'text' | 'frame'>('frame')

const detail = reactive<CourseDetailResponse>({
  course: {
    id: 0,
    name: '课程详情待接入',
    summary: '课程信息、资料与视频将统一展示在这里。',
    collegeName: '系统预留',
    teacherName: '系统预留',
    updateDate: '待更新',
  },
  materials: [],
  videos: [],
  preps: [],
})

const detailSubtitle = computed(() => `${detail.course.name} · 课程信息、资料与视频统一展示`)

function materialHref(downloadUrl: string) {
  if (!downloadUrl) {
    return '#'
  }

  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}${downloadUrl}`
}

function inferMimeTypeFromFileName(fileName: string, fallbackType: PrepAttachmentItem['type']) {
  const extension = (fileName.split('.').pop() || '').toLowerCase()
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    flac: 'audio/flac',
    txt: 'text/plain;charset=utf-8',
    md: 'text/markdown;charset=utf-8',
    json: 'application/json;charset=utf-8',
    pdf: 'application/pdf',
  }

  if (mimeMap[extension]) {
    return mimeMap[extension]
  }

  if (fallbackType === 'image') {
    return 'image/jpeg'
  }

  if (fallbackType === 'video') {
    return 'video/mp4'
  }

  if (fallbackType === 'audio') {
    return 'audio/mpeg'
  }

  if (fallbackType === 'text') {
    return 'text/plain;charset=utf-8'
  }

  return 'application/octet-stream'
}

function normalizeMimeType(value: string) {
  return value.split(';')[0]?.trim().toLowerCase() || ''
}

function resolvePreviewMode(
  attachment: PrepAttachmentItem,
  mimeType: string,
): 'image' | 'video' | 'audio' | 'text' | 'frame' {
  const normalizedMimeType = normalizeMimeType(mimeType)
  const extension = (attachment.fileName.split('.').pop() || '').toLowerCase()

  if (normalizedMimeType.startsWith('image/')) {
    return 'image'
  }

  if (normalizedMimeType.startsWith('video/')) {
    return 'video'
  }

  if (normalizedMimeType.startsWith('audio/')) {
    return 'audio'
  }

  if (
    normalizedMimeType.startsWith('text/') ||
    normalizedMimeType === 'application/json' ||
    normalizedMimeType === 'application/xml'
  ) {
    return 'text'
  }

  if (normalizedMimeType === 'application/pdf') {
    return 'frame'
  }

  if (['txt', 'md', 'json', 'xml', 'csv'].includes(extension)) {
    return 'text'
  }

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
    return 'image'
  }

  if (['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(extension)) {
    return 'video'
  }

  if (['mp3', 'wav', 'm4a', 'aac', 'flac', 'oga'].includes(extension)) {
    return 'audio'
  }

  if (attachment.type === 'image') {
    return 'image'
  }

  if (attachment.type === 'video') {
    return 'video'
  }

  if (attachment.type === 'audio') {
    return 'audio'
  }

  if (attachment.type === 'text') {
    return 'text'
  }

  return 'frame'
}

function assetTypeLabel(type: string) {
  const labels: Record<string, string> = {
    image: '图片',
    audio: '音频',
    video: '视频',
    text: '文本',
    file: '文件',
  }

  return labels[type] || type
}

function togglePrep(prepId: number) {
  expandedPrepId.value = expandedPrepId.value === prepId ? null : prepId
}

function resetPreviewResource() {
  if (previewObjectUrl.value) {
    URL.revokeObjectURL(previewObjectUrl.value)
    previewObjectUrl.value = ''
  }
  previewTextContent.value = ''
}

function closeAttachmentPreview() {
  previewVisible.value = false
  previewLoading.value = false
  previewError.value = ''
  previewAttachment.value = null
  previewMode.value = 'frame'
  resetPreviewResource()
}

async function openAttachmentPreview(attachment: PrepAttachmentItem) {
  previewVisible.value = true
  previewLoading.value = true
  previewError.value = ''
  previewAttachment.value = attachment
  previewMode.value = 'frame'
  resetPreviewResource()

  try {
    const response = await http.get<Blob>(attachment.previewUrl, {
      responseType: 'blob',
    })
    if (!response.data) {
      throw new Error('预览文件获取失败')
    }

    const responseMimeType = normalizeMimeType(String(response.headers['content-type'] || ''))
    const sourceBlob = response.data
    const blobMimeType = normalizeMimeType(sourceBlob.type || '')
    const fallbackMimeType = inferMimeTypeFromFileName(attachment.fileName, attachment.type)
    const resolvedMimeType = responseMimeType || blobMimeType || fallbackMimeType
    const resolvedPreviewMode = resolvePreviewMode(attachment, resolvedMimeType)
    const normalizedBlob = new Blob([sourceBlob], {
      type: resolvedMimeType || fallbackMimeType,
    })
    previewMode.value = resolvedPreviewMode

    if (resolvedPreviewMode === 'text') {
      previewTextContent.value = await normalizedBlob.text()
    } else {
      previewObjectUrl.value = URL.createObjectURL(normalizedBlob)
    }
  } catch (error: any) {
    previewError.value = error instanceof Error ? error.message : '当前资料暂时无法在线预览'
  } finally {
    previewLoading.value = false
  }
}

async function loadDetail() {
  errorMessage.value = ''
  expandedPrepId.value = null

  try {
    const response = await http.get(`/portal/courses/${route.params.courseId}`)
    const data = response.data.data as CourseDetailResponse
    detail.course = data.course
    detail.materials = data.materials
    detail.videos = data.videos
    detail.preps = data.preps
    if (data.preps.length > 0) {
      expandedPrepId.value = data.preps[0].id
    }
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '课程详情加载失败'
    detail.materials = []
    detail.videos = []
    detail.preps = []
  }
}

watch(
  () => route.params.courseId,
  () => {
    loadDetail()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  resetPreviewResource()
})
</script>
