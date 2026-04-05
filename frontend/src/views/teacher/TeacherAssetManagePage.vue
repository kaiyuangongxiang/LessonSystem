<template>
  <main class="teacher-dashboard-page asset-page">
    <aside class="teacher-dashboard-sidebar">
      <div>
        <div class="teacher-dashboard-sidebar__eyebrow">TEACHER WORKSPACE</div>
        <h1>教师中心</h1>
      </div>

      <nav class="teacher-dashboard-nav">
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/teacher')">总览首页</button>
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/teacher/materials')">资源上传</button>
        <button type="button" class="teacher-dashboard-nav__item is-active">素材库</button>
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/teacher/resources')">我的资源</button>
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/teacher/profile')">个人资料</button>
      </nav>
    </aside>

    <section class="teacher-dashboard-main asset-manage-main">
      <header class="my-resources-head">
        <div>
          <div class="my-resources-head__eyebrow">ASSET LIBRARY</div>
          <h2>教师素材库</h2>
          <p>{{ headerText }}</p>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success my-resources-feedback">{{ successMessage }}</p>

      <section class="my-resources-stats">
        <article class="my-resources-stat-card">
          <span>素材总数</span>
          <strong>{{ stats.total }}</strong>
          <em>当前可维护的全部素材</em>
        </article>
        <article class="my-resources-stat-card">
          <span>图片素材</span>
          <strong>{{ stats.imageCount }}</strong>
          <em>封面、插图、课堂图片</em>
        </article>
        <article class="my-resources-stat-card">
          <span>音频素材</span>
          <strong>{{ stats.audioCount }}</strong>
          <em>讲解音频与配套音频</em>
        </article>
        <article class="my-resources-stat-card is-highlight">
          <span>文本类素材</span>
          <strong>{{ stats.contentCount }}</strong>
          <em>文本片段、题目卡片、页面模板</em>
        </article>
      </section>

      <section class="asset-manage-card">
        <div class="asset-manage-card__head">
          <div>
            <div class="my-resources-panel__eyebrow">ASSET EDITOR</div>
            <h3>{{ editingId ? '编辑素材' : '新增素材' }}</h3>
          </div>
          <button v-if="editingId" type="button" class="course-chip course-chip--soft" @click="resetEditor">取消编辑</button>
        </div>

        <form class="asset-manage-form" @submit.prevent="submitAsset">
          <label class="my-resources-field">
            <span>素材类型</span>
            <select v-model="editorForm.type" :disabled="Boolean(editingId)">
              <option v-for="option in assetTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="my-resources-field">
            <span>所属课程</span>
            <select v-model="editorForm.courseId">
              <option value="">请选择所属课程</option>
              <option v-for="course in courseOptions" :key="course.id" :value="String(course.id)">
                {{ course.name }}
              </option>
            </select>
          </label>

          <label class="my-resources-field asset-manage-form__full">
            <span>素材标题</span>
            <input v-model.trim="editorForm.title" type="text" maxlength="200" placeholder="请输入素材标题" />
          </label>

          <label class="my-resources-field asset-manage-form__full">
            <span>素材说明</span>
            <textarea v-model.trim="editorForm.description" rows="3" maxlength="2000" placeholder="补充素材用途、适用章节或课堂使用说明"></textarea>
          </label>

          <label v-if="isContentType" class="my-resources-field asset-manage-form__full">
            <span>素材内容</span>
            <textarea
              v-model.trim="editorForm.content"
              rows="6"
              maxlength="5000"
              :placeholder="contentPlaceholder"
            ></textarea>
          </label>

          <label v-else class="my-resources-field asset-manage-form__full">
            <span>{{ editorForm.type === 'audio' ? '上传音频' : '上传图片' }}</span>
            <input :key="fileInputKey" type="file" :accept="fileAccept" @change="handleFileChange" />
            <small class="asset-manage-field-tip">
              {{ selectedFile ? `已选择：${selectedFile.name}` : editingId ? '编辑时暂不支持更换文件，可保留原文件。' : '请选择要上传的素材文件。' }}
            </small>
          </label>

          <div class="my-resources-filter-actions">
            <button type="submit" class="auth-btn" :disabled="saving">
              {{ saving ? '提交中...' : editingId ? '保存素材' : '创建素材' }}
            </button>
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="saving" @click="resetEditor">重置</button>
          </div>
        </form>
      </section>

      <section class="my-resources-filter-panel">
        <div class="my-resources-filter-panel__head">
          <div>
            <div class="my-resources-filter-panel__eyebrow">ASSET FILTER</div>
            <h3>筛选素材</h3>
          </div>
          <div class="my-resources-panel__meta">共 {{ pagination.total }} 条素材</div>
        </div>

        <form class="my-resources-filter-form" @submit.prevent="applySearch">
          <label class="my-resources-field">
            <span>关键词</span>
            <input v-model.trim="filters.keyword" type="text" maxlength="200" placeholder="搜索标题、说明、内容或文件名" />
          </label>

          <label class="my-resources-field">
            <span>所属课程</span>
            <select v-model="filters.courseId">
              <option value="">全部课程</option>
              <option v-for="course in courseOptions" :key="course.id" :value="String(course.id)">
                {{ course.name }}
              </option>
            </select>
          </label>

          <label class="my-resources-field">
            <span>素材类型</span>
            <select v-model="filters.type">
              <option value="all">全部素材</option>
              <option v-for="option in assetTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <div class="my-resources-filter-actions">
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="loading" @click="resetFilters">重置</button>
            <button type="submit" class="auth-btn" :disabled="loading">{{ loading ? '加载中...' : '搜索素材' }}</button>
          </div>
        </form>
      </section>

      <section class="my-resources-panel">
        <div class="my-resources-panel__head">
          <div>
            <div class="my-resources-panel__eyebrow">ASSET LIST</div>
            <h3>素材列表</h3>
          </div>
          <div class="my-resources-panel__meta">支持编辑、预览和删除</div>
        </div>

        <div v-if="assetList.length" class="asset-manage-list">
          <article v-for="item in assetList" :key="item.id" class="asset-manage-item">
            <div class="asset-manage-item__head">
              <div>
                <strong>{{ item.title }}</strong>
                <span class="teacher-dashboard-tag">{{ assetTypeLabel(item.type) }}</span>
              </div>
              <span class="asset-manage-item__time">{{ item.uploadTime }}</span>
            </div>

            <p class="asset-manage-item__meta">课程：{{ item.courseName }}</p>
            <p class="asset-manage-item__meta">{{ item.description || '暂无素材说明' }}</p>
            <p v-if="item.content" class="asset-manage-item__content">{{ item.content }}</p>
            <p v-else class="asset-manage-item__meta">
              {{ item.fileName || '无文件名' }}<span v-if="item.fileSize"> · {{ formatFileSize(item.fileSize) }}</span>
            </p>

            <div class="asset-manage-item__actions">
              <button v-if="item.previewUrl" type="button" class="course-chip course-chip--soft" @click="previewAsset(item.previewUrl)">预览</button>
              <button type="button" class="course-chip" @click="startEdit(item.id)">编辑</button>
              <button type="button" class="course-chip my-resources-delete-btn" :disabled="deletingId === item.id" @click="removeAsset(item)">
                {{ deletingId === item.id ? '删除中...' : '删除' }}
              </button>
            </div>
          </article>
        </div>
        <div v-else-if="!loading" class="course-detail-empty">当前还没有素材记录，可先创建一条素材。</div>

        <section class="course-pagination my-resources-pagination">
          <div class="course-pagination__desc">共 {{ pagination.total }} 条素材记录 · 当前第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</div>
          <div class="course-pagination__actions">
            <button type="button" class="course-chip" :disabled="pagination.page <= 1 || loading" @click="changePage(pagination.page - 1)">上一页</button>
            <button
              v-for="pageNumber in pageNumbers"
              :key="pageNumber"
              type="button"
              :class="['course-page-btn', pageNumber === pagination.page ? 'is-active' : '']"
              :disabled="loading"
              @click="changePage(pageNumber)"
            >
              {{ pageNumber }}
            </button>
          </div>
        </section>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createTeacherAsset,
  deleteTeacherAssetDetail,
  getTeacherAssetDetail,
  getTeacherAssets,
  type TeacherAssetItem,
  type TeacherAssetStats,
  type TeacherAssetType,
  type TeacherCourseOption,
  updateTeacherAssetDetail,
} from '@/services/teacher'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const editingId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const selectedFile = ref<File | null>(null)
const fileInputKey = ref(0)
const courseOptions = ref<TeacherCourseOption[]>([])
const assetList = ref<TeacherAssetItem[]>([])
const stats = reactive<TeacherAssetStats>({
  total: 0,
  imageCount: 0,
  audioCount: 0,
  contentCount: 0,
})
const filters = reactive({
  keyword: '',
  courseId: '',
  type: 'all' as TeacherAssetType | 'all',
})
const editorForm = reactive({
  type: 'image' as TeacherAssetType,
  courseId: '',
  title: '',
  description: '',
  content: '',
})
const pagination = reactive({
  page: 1,
  pageSize: 6,
  total: 0,
  totalPages: 0,
})

const assetTypeOptions: Array<{ value: TeacherAssetType; label: string }> = [
  { value: 'image', label: '图片素材' },
  { value: 'audio', label: '音频素材' },
  { value: 'text', label: '文本片段' },
  { value: 'question', label: '题目卡片' },
  { value: 'template', label: '页面模板' },
]

const isContentType = computed(() => ['text', 'question', 'template'].includes(editorForm.type))
const fileAccept = computed(() => (editorForm.type === 'audio' ? '.mp3,.wav,.ogg,.m4a' : '.jpg,.jpeg,.png,.webp,.gif'))
const contentPlaceholder = computed(() => {
  if (editorForm.type === 'question') return '请输入题干、选项、答案要点或讲解内容'
  if (editorForm.type === 'template') return '请输入页面模板结构、布局说明或使用建议'
  return '请输入可直接复用的文本片段内容'
})
const headerText = computed(() => {
  const name = authStore.profile?.name || authStore.profile?.username || '教师用户'
  return `${name}，这里统一管理图片、音频和文本类教学素材，可按课程沉淀后续课件内容。`
})
const pageNumbers = computed(() => {
  const totalPages = pagination.totalPages || 1
  return Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5)
})

function normalizePage(value: unknown) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(2)} MB`
  }

  return `${(size / 1024).toFixed(2)} KB`
}

function assetTypeLabel(type: TeacherAssetType) {
  return assetTypeOptions.find((item) => item.value === type)?.label || type
}

function resetEditor() {
  editingId.value = null
  editorForm.type = 'image'
  editorForm.courseId = ''
  editorForm.title = ''
  editorForm.description = ''
  editorForm.content = ''
  selectedFile.value = null
  fileInputKey.value += 1
}

function syncFiltersWithRoute() {
  filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  filters.courseId = typeof route.query.courseId === 'string' ? route.query.courseId : ''
  filters.type = typeof route.query.type === 'string' && route.query.type !== '' ? (route.query.type as TeacherAssetType | 'all') : 'all'
}

function updateRoute(page = 1) {
  router.push({
    path: '/teacher/assets',
    query: {
      page: String(page),
      ...(filters.keyword ? { keyword: filters.keyword } : {}),
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
      ...(filters.type !== 'all' ? { type: filters.type } : {}),
    },
  })
}

function applySearch() {
  updateRoute(1)
}

function resetFilters() {
  filters.keyword = ''
  filters.courseId = ''
  filters.type = 'all'
  updateRoute(1)
}

function changePage(page: number) {
  updateRoute(page)
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  selectedFile.value = target.files?.[0] || null
}

function previewAsset(path: string) {
  if (!path) return
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  window.open(`${baseUrl}${path}`, '_blank', 'noopener,noreferrer')
}

async function startEdit(assetId: number) {
  clearMessages()
  try {
    const detail = await getTeacherAssetDetail(assetId)
    editingId.value = assetId
    editorForm.type = detail.type
    editorForm.courseId = String(detail.courseId)
    editorForm.title = detail.title
    editorForm.description = detail.description
    editorForm.content = detail.content
    selectedFile.value = null
    fileInputKey.value += 1
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '素材详情加载失败'
  }
}

async function submitAsset() {
  clearMessages()

  if (!editorForm.courseId || !editorForm.title) {
    errorMessage.value = '请完整填写素材类型、所属课程和素材标题'
    return
  }

  if (isContentType.value && !editorForm.content) {
    errorMessage.value = '当前素材类型必须填写素材内容'
    return
  }

  if (!isContentType.value && !editingId.value && !selectedFile.value) {
    errorMessage.value = '当前素材类型必须上传文件'
    return
  }

  saving.value = true

  try {
    if (editingId.value) {
      const result = await updateTeacherAssetDetail(editingId.value, {
        courseId: editorForm.courseId,
        title: editorForm.title,
        description: editorForm.description,
        content: editorForm.content,
      })
      successMessage.value = `素材“${result.title}”已更新。`
    } else {
      const result = await createTeacherAsset({
        type: editorForm.type,
        courseId: editorForm.courseId,
        title: editorForm.title,
        description: editorForm.description,
        content: editorForm.content,
        file: selectedFile.value,
      })
      successMessage.value = `素材“${result.title}”已创建。`
    }

    resetEditor()
    await loadAssets()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '素材保存失败'
  } finally {
    saving.value = false
  }
}

async function removeAsset(item: TeacherAssetItem) {
  clearMessages()
  if (!window.confirm(`确认删除素材“${item.title}”吗？`)) {
    return
  }

  deletingId.value = item.id
  try {
    await deleteTeacherAssetDetail(item.id)
    successMessage.value = `素材“${item.title}”已删除。`
    if (editingId.value === item.id) {
      resetEditor()
    }
    await loadAssets()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '素材删除失败'
  } finally {
    deletingId.value = null
  }
}

async function loadAssets() {
  loading.value = true
  clearMessages()
  syncFiltersWithRoute()

  try {
    const data = await getTeacherAssets({
      page: normalizePage(route.query.page),
      pageSize: 6,
      keyword: filters.keyword,
      courseId: filters.courseId,
      type: filters.type,
    })

    courseOptions.value = data.filters.courses
    assetList.value = data.list
    stats.total = data.stats.total
    stats.imageCount = data.stats.imageCount
    stats.audioCount = data.stats.audioCount
    stats.contentCount = data.stats.contentCount
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
  } catch (error: any) {
    courseOptions.value = []
    assetList.value = []
    stats.total = 0
    stats.imageCount = 0
    stats.audioCount = 0
    stats.contentCount = 0
    pagination.page = 1
    pagination.pageSize = 6
    pagination.total = 0
    pagination.totalPages = 0
    errorMessage.value = error?.response?.data?.message || '素材库加载失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.fullPath,
  () => {
    loadAssets()
  },
  { immediate: true },
)
</script>
