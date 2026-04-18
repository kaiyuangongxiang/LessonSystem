<template>
  <main class="admin-manage-page admin-asset-page">
    <aside class="admin-dashboard-sidebar">
      <div>
        <div class="admin-dashboard-sidebar__eyebrow">ADMIN CONSOLE</div>
        <h1>管理员中心</h1>
      </div>

      <AdminSidebarNav active="assets" />
    </aside>

    <section class="admin-manage-main admin-asset-main">
      <header class="admin-asset-header">
        <div>
          <div class="admin-asset-header__eyebrow">ASSET MANAGEMENT</div>
          <h2>素材管理</h2>
          <p>统一查看教师上传素材，并按公开状态进行筛选、审核和清理。</p>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success">{{ successMessage }}</p>

      <section class="admin-asset-stats">
        <article class="admin-asset-stat-card">
          <span>素材总数</span>
          <strong>{{ stats.total }}</strong>
        </article>
        <article class="admin-asset-stat-card">
          <span>公开素材</span>
          <strong>{{ stats.publicCount }}</strong>
        </article>
        <article class="admin-asset-stat-card">
          <span>私密素材</span>
          <strong>{{ stats.privateCount }}</strong>
        </article>
        <article class="admin-asset-stat-card">
          <span>上传教师</span>
          <strong>{{ stats.teacherCount }}</strong>
        </article>
      </section>

      <section class="admin-asset-card">
        <form class="admin-asset-filter" @submit.prevent="applySearch">
          <label>
            <span>关键词</span>
            <input v-model.trim="filters.keyword" type="text" maxlength="200" placeholder="搜索标题、说明、教师或文件名" />
          </label>

          <label>
            <span>课程</span>
            <select v-model="filters.courseId">
              <option value="">全部课程</option>
              <option v-for="course in courseOptions" :key="course.id" :value="String(course.id)">{{ course.name }}</option>
            </select>
          </label>

          <label>
            <span>类型</span>
            <select v-model="filters.type">
              <option value="all">全部类型</option>
              <option v-for="option in assetTypeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>

          <label>
            <span>公开范围</span>
            <select v-model="filters.visibility">
              <option value="all">全部范围</option>
              <option value="public">公开</option>
              <option value="private">私密</option>
            </select>
          </label>

          <div class="admin-asset-filter__actions">
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="loading" @click="resetFilters">重置</button>
            <button type="submit" class="auth-btn" :disabled="loading">{{ loading ? '加载中...' : '应用筛选' }}</button>
          </div>
        </form>
      </section>

      <section class="admin-asset-card">
        <div class="admin-asset-card__head">
          <div>
            <div class="admin-asset-card__eyebrow">LIST</div>
            <h3>素材列表</h3>
          </div>
          <div class="admin-asset-card__meta">共 {{ pagination.total }} 条素材</div>
        </div>

        <div v-if="assetList.length" class="admin-asset-list">
          <article v-for="item in assetList" :key="item.id" class="admin-asset-item">
            <div class="admin-asset-item__head">
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.teacherName }} · {{ item.courseName || '未关联课程' }}</p>
              </div>
              <div class="admin-asset-item__tags">
                <span class="teacher-dashboard-tag">{{ assetTypeLabel(item.type) }}</span>
                <span :class="['admin-asset-badge', item.visibility === 'public' ? 'is-public' : 'is-private']">
                  {{ item.visibility === 'public' ? '公开' : '私密' }}
                </span>
              </div>
            </div>

            <p class="admin-asset-item__desc">{{ item.description || renderPlainText(item.content, '暂无素材说明') }}</p>
            <p v-if="item.fileName" class="admin-asset-item__meta">
              {{ item.fileName }}
              <span v-if="item.fileSize"> · {{ formatFileSize(item.fileSize) }}</span>
            </p>

            <div class="admin-asset-item__actions">
              <button v-if="item.previewUrl" type="button" class="course-chip course-chip--soft" @click="previewAsset(item.previewUrl)">预览</button>
              <button type="button" class="course-chip admin-manage-delete-btn" :disabled="deletingId === item.id" @click="removeAsset(item)">
                {{ deletingId === item.id ? '删除中...' : '删除' }}
              </button>
            </div>
          </article>
        </div>
        <div v-else-if="!loading" class="course-detail-empty">当前没有符合条件的素材记录。</div>

        <section class="admin-manage-pagination">
          <div class="admin-manage-pagination__desc">当前第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</div>
          <div class="admin-manage-pagination__actions">
            <button type="button" class="course-chip course-pagination__nav" :disabled="pagination.page <= 1 || loading" @click="changePage(pagination.page - 1)" aria-label="上一页">‹</button>
            <button type="button" class="admin-manage-page-btn is-active" :disabled="loading" aria-current="page">{{ pagination.page }}</button>
            <button type="button" class="course-chip course-pagination__nav" :disabled="pagination.page >= pagination.totalPages || loading" @click="changePage(pagination.page + 1)" aria-label="下一页">›</button>
          </div>
        </section>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminSidebarNav from '@/components/navigation/AdminSidebarNav.vue'
import { deleteAdminAsset, getAdminAssetList, type AdminAssetItem, type AdminAssetStats, type AdminAssetType, type AdminCourseOption } from '@/services/admin'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const deletingId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const courseOptions = ref<AdminCourseOption[]>([])
const assetList = ref<AdminAssetItem[]>([])

const stats = reactive<AdminAssetStats>({
  total: 0,
  publicCount: 0,
  privateCount: 0,
  teacherCount: 0,
  fileCount: 0,
})

const filters = reactive({
  keyword: '',
  courseId: '',
  type: 'all' as AdminAssetType | 'all',
  visibility: 'all' as 'all' | 'public' | 'private',
})

const pagination = reactive({
  page: 1,
  pageSize: 4,
  total: 0,
  totalPages: 0,
})

const assetTypeOptions: Array<{ value: AdminAssetType; label: string }> = [
  { value: 'image', label: '图片' },
  { value: 'audio', label: '音频' },
  { value: 'video', label: '视频' },
  { value: 'text', label: '文本片段' },
  { value: 'file', label: '文件素材' },
]



function normalizePage(value: unknown) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function renderPlainText(value: string, fallback = '暂无内容') {
  const text = stripHtml(value)
  if (!text) return fallback
  return text.length > 180 ? `${text.slice(0, 180)}...` : text
}

function assetTypeLabel(type: AdminAssetType) {
  return assetTypeOptions.find((item) => item.value === type)?.label || type
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`
  return `${(size / 1024).toFixed(2)} KB`
}

function previewAsset(path: string) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  window.open(`${baseUrl}${path}`, '_blank', 'noopener,noreferrer')
}

function syncFiltersWithRoute() {
  filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  filters.courseId = typeof route.query.courseId === 'string' ? route.query.courseId : ''
  filters.type = typeof route.query.type === 'string' && route.query.type !== '' ? (route.query.type as AdminAssetType | 'all') : 'all'
  filters.visibility =
    route.query.visibility === 'public' || route.query.visibility === 'private' ? route.query.visibility : 'all'
}

function updateRoute(page = 1) {
  void router.push({
    path: '/admin/assets',
    query: {
      page: String(page),
      ...(filters.keyword ? { keyword: filters.keyword } : {}),
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
      ...(filters.type !== 'all' ? { type: filters.type } : {}),
      ...(filters.visibility !== 'all' ? { visibility: filters.visibility } : {}),
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
  filters.visibility = 'all'
  updateRoute(1)
}

function changePage(page: number) {
  updateRoute(page)
}

async function removeAsset(item: AdminAssetItem) {
  clearMessages()

  if (!window.confirm(`确认删除素材“${item.title}”吗？`)) {
    return
  }

  deletingId.value = item.id

  try {
    await deleteAdminAsset(item.id)
    await loadAssets()
    successMessage.value = `素材“${item.title}”已删除`
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
    const data = await getAdminAssetList({
      page: normalizePage(route.query.page),
      pageSize: 4,
      keyword: filters.keyword,
      courseId: filters.courseId,
      type: filters.type,
      visibility: filters.visibility,
    })

    courseOptions.value = data.filters.courses
    assetList.value = data.list
    stats.total = data.stats.total
    stats.publicCount = data.stats.publicCount
    stats.privateCount = data.stats.privateCount
    stats.teacherCount = data.stats.teacherCount
    stats.fileCount = data.stats.fileCount
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
  } catch (error: any) {
    courseOptions.value = []
    assetList.value = []
    stats.total = 0
    stats.publicCount = 0
    stats.privateCount = 0
    stats.teacherCount = 0
    stats.fileCount = 0
    pagination.page = 1
    pagination.pageSize = 4
    pagination.total = 0
    pagination.totalPages = 0
    errorMessage.value = error?.response?.data?.message || '素材管理列表加载失败'
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
