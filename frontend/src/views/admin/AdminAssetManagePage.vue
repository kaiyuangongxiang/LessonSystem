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
      <header class="admin-manage-head">
        <div>
          <div class="admin-manage-head__eyebrow">RESOURCE MANAGEMENT</div>
          <h2>资料库管理</h2>
          <p>{{ headerText }}</p>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success admin-manage-feedback">{{ successMessage }}</p>

      <section class="my-resources-stats">
        <article class="my-resources-stat-card is-highlight">
          <span>公开资料</span>
          <strong>{{ stats.total }}</strong>
          <em>当前页面仅展示公开范围资料</em>
        </article>
        <article class="my-resources-stat-card">
          <span>上传教师</span>
          <strong>{{ stats.teacherCount }}</strong>
          <em>当前公开资料涉及的教师数量</em>
        </article>
        <article class="my-resources-stat-card">
          <span>文件资料</span>
          <strong>{{ stats.fileCount }}</strong>
          <em>图片、音频、视频与文件类资料总数</em>
        </article>
        <article class="my-resources-stat-card">
          <span>公开可预览</span>
          <strong>{{ stats.publicCount }}</strong>
          <em>列表中展示的资料默认都为公开状态</em>
        </article>
      </section>

      <section class="my-resources-filter-panel">
        <div class="my-resources-filter-panel__head">
          <div>
            <div class="my-resources-filter-panel__eyebrow">FILTER</div>
            <h3>筛选资料</h3>
          </div>
          <div class="my-resources-panel__meta">范围已固定为公开资料，不再区分公开/私密</div>
        </div>

        <form class="my-resources-filter-form" @submit.prevent="applySearch">
          <label class="my-resources-field">
            <span>关键词</span>
            <input v-model.trim="filters.keyword" type="text" maxlength="200" placeholder="搜索标题、说明、内容或教师姓名" />
          </label>

          <label class="my-resources-field">
            <span>资料类型</span>
            <select v-model="filters.type">
              <option value="all">全部类型</option>
              <option v-for="option in assetTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <div class="my-resources-filter-actions">
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="loading" @click="resetFilters">重置</button>
            <button type="submit" class="auth-btn" :disabled="loading">{{ loading ? '加载中...' : '应用筛选' }}</button>
          </div>
        </form>
      </section>

      <section class="my-resources-panel">
        <div class="my-resources-panel__head">
          <div>
            <div class="my-resources-panel__eyebrow">RESOURCE LIST</div>
            <h3>资料列表</h3>
          </div>
          <div class="my-resources-panel__meta">共 {{ pagination.total }} 条公开资料记录</div>
        </div>

        <div v-if="assetList.length" class="asset-manage-list">
          <article v-for="item in assetList" :key="item.id" class="asset-manage-item">
            <div class="asset-manage-item__head">
              <div>
                <strong>{{ item.title }}</strong>
                <span class="teacher-dashboard-tag is-video">{{ assetTypeLabel(item.type) }}</span>
              </div>
              <span class="asset-manage-item__time">{{ item.uploadTime }}</span>
            </div>

            <p class="asset-manage-item__meta">{{ item.teacherName }} · {{ item.courseName || '未关联课程' }}</p>
            <p class="asset-manage-item__meta">{{ item.description || '暂无资料说明' }}</p>
            <p v-if="item.content" class="asset-manage-item__content">{{ renderPlainText(item.content) }}</p>
            <p v-else class="asset-manage-item__meta">
              {{ item.fileName || '未记录文件名' }}
              <span v-if="item.fileSize"> · {{ formatFileSize(item.fileSize) }}</span>
            </p>

            <div class="asset-manage-item__actions">
              <button v-if="item.previewUrl" type="button" class="course-chip course-chip--soft" @click="previewAsset(item.previewUrl)">预览</button>
              <button
                type="button"
                class="course-chip my-resources-delete-btn"
                :disabled="deletingId === item.id"
                @click="removeAsset(item)"
              >
                {{ deletingId === item.id ? '删除中...' : '删除' }}
              </button>
            </div>
          </article>
        </div>
        <div v-else-if="!loading" class="course-detail-empty">当前没有符合条件的公开资料记录。</div>

        <section class="course-pagination my-resources-pagination">
          <div class="course-pagination__desc">当前第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</div>
          <div class="course-pagination__actions">
            <button
              type="button"
              class="course-chip course-pagination__nav"
              :disabled="pagination.page <= 1 || loading"
              @click="changePage(pagination.page - 1)"
              aria-label="上一页"
            >
              ‹
            </button>
            <button type="button" class="course-page-btn is-active" :disabled="loading" aria-current="page">{{ pagination.page }}</button>
            <button
              type="button"
              class="course-chip course-pagination__nav"
              :disabled="pagination.page >= pagination.totalPages || loading"
              @click="changePage(pagination.page + 1)"
              aria-label="下一页"
            >
              ›
            </button>
          </div>
        </section>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminSidebarNav from '@/components/navigation/AdminSidebarNav.vue'
import {
  deleteAdminAsset,
  getAdminAssetList,
  type AdminAssetItem,
  type AdminAssetStats,
  type AdminAssetType,
} from '@/services/admin'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const deletingId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
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
  type: 'all' as AdminAssetType | 'all',
})

const pagination = reactive({
  page: 1,
  pageSize: 4,
  total: 0,
  totalPages: 0,
})

const headerText = '页面结构参考教师中心资料库，但管理员页只保留公开资料检索与清理能力。'

const assetTypeOptions: Array<{ value: AdminAssetType; label: string }> = [
  { value: 'image', label: '图片' },
  { value: 'audio', label: '音频' },
  { value: 'video', label: '视频' },
  { value: 'text', label: '文本片段' },
  { value: 'file', label: '文件资料' },
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
  filters.type = typeof route.query.type === 'string' && route.query.type !== '' ? (route.query.type as AdminAssetType | 'all') : 'all'
}

function updateRoute(page = 1) {
  void router.push({
    path: '/admin/assets',
    query: {
      page: String(page),
      ...(filters.keyword ? { keyword: filters.keyword } : {}),
      ...(filters.type !== 'all' ? { type: filters.type } : {}),
    },
  })
}

function applySearch() {
  updateRoute(1)
}

function resetFilters() {
  filters.keyword = ''
  filters.type = 'all'
  updateRoute(1)
}

function changePage(page: number) {
  updateRoute(page)
}

async function removeAsset(item: AdminAssetItem) {
  clearMessages()

  if (!window.confirm(`确认删除资料“${item.title}”吗？`)) {
    return
  }

  deletingId.value = item.id

  try {
    await deleteAdminAsset(item.id)
    await loadAssets()
    successMessage.value = `资料“${item.title}”已删除`
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '资料删除失败'
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
      type: filters.type,
      visibility: 'public',
    })

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
    errorMessage.value = error?.response?.data?.message || '资料管理列表加载失败'
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
