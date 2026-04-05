<template>
  <main class="admin-manage-page asset-page">
    <aside class="admin-dashboard-sidebar">
      <div>
        <div class="admin-dashboard-sidebar__eyebrow">ADMIN CONSOLE</div>
        <h1>管理员中心</h1>
      </div>

      <nav class="admin-dashboard-nav">
        <button type="button" class="admin-dashboard-nav__item admin-dashboard-nav__item--system" @click="router.push('/admin/system')">系统管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/teachers')">教师用户</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/students')">学生用户</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/accounts')">账号管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/colleges')">学院管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/courses')">课程管理</button>
        <button type="button" class="admin-dashboard-nav__item is-active">素材库</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/materials')">资料管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/messages')">教学交流</button>
      </nav>
    </aside>

    <section class="admin-manage-main">
      <header class="admin-manage-head">
        <div>
          <div class="admin-manage-head__eyebrow">ASSET MANAGEMENT</div>
          <h2>素材库管理</h2>
          <p>{{ headerText }}</p>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success admin-manage-feedback">{{ successMessage }}</p>

      <section class="admin-manage-stats">
        <article class="admin-manage-stat-card">
          <span>素材总数</span>
          <strong>{{ stats.total }}</strong>
          <em>平台当前全部素材</em>
        </article>
        <article class="admin-manage-stat-card">
          <span>关联课程</span>
          <strong>{{ stats.courseCount }}</strong>
          <em>已绑定课程的素材范围</em>
        </article>
        <article class="admin-manage-stat-card">
          <span>上传教师</span>
          <strong>{{ stats.teacherCount }}</strong>
          <em>已参与素材沉淀的教师数量</em>
        </article>
        <article class="admin-manage-stat-card is-highlight">
          <span>多媒体素材</span>
          <strong>{{ stats.fileCount }}</strong>
          <em>图片、音频与视频类素材数量</em>
        </article>
      </section>

      <section class="admin-manage-filter-panel">
        <div class="admin-manage-filter-panel__head">
          <div>
            <div class="admin-manage-panel__eyebrow">ASSET FILTER</div>
            <h3>筛选素材</h3>
          </div>
          <div class="admin-manage-panel__meta">共 {{ pagination.total }} 条素材</div>
        </div>

        <form class="admin-manage-filter-form admin-manage-filter-form--resource" @submit.prevent="applySearch">
          <label class="admin-manage-field">
            <span>关键词</span>
            <input v-model.trim="filters.keyword" type="text" maxlength="200" placeholder="搜索标题、说明、内容、文件名或教师姓名" />
          </label>

          <label class="admin-manage-field">
            <span>所属课程</span>
            <select v-model="filters.courseId">
              <option value="">全部课程</option>
              <option v-for="course in courseOptions" :key="course.id" :value="String(course.id)">
                {{ course.name }}
              </option>
            </select>
          </label>

          <label class="admin-manage-field">
            <span>素材类型</span>
            <select v-model="filters.type">
              <option value="all">全部素材</option>
              <option v-for="option in assetTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <div class="admin-manage-filter-actions">
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="loading" @click="resetFilters">重置</button>
            <button type="submit" class="auth-btn" :disabled="loading">{{ loading ? '加载中...' : '搜索素材' }}</button>
          </div>
        </form>
      </section>

      <section class="admin-manage-panel">
        <div class="admin-manage-panel__head">
          <div>
            <div class="admin-manage-panel__eyebrow">ASSET LIST</div>
            <h3>素材列表</h3>
          </div>
          <div class="admin-manage-panel__meta">支持预览文件类素材，并删除不合规内容</div>
        </div>

        <div v-if="assetList.length" class="asset-manage-list">
          <article v-for="item in assetList" :key="item.id" class="asset-manage-item asset-manage-item--admin">
            <div class="asset-manage-item__head">
              <div>
                <strong>{{ item.title }}</strong>
                <span class="teacher-dashboard-tag">{{ assetTypeLabel(item.type) }}</span>
              </div>
              <span class="asset-manage-item__time">{{ item.uploadTime }}</span>
            </div>

            <p class="asset-manage-item__meta">课程：{{ item.courseName }} · 教师：{{ item.teacherName }}</p>
            <p class="asset-manage-item__meta">{{ item.description || '暂无素材说明' }}</p>
            <p v-if="item.content" class="asset-manage-item__content">{{ item.content }}</p>
            <p v-else class="asset-manage-item__meta">
              {{ item.fileName || '未记录文件名' }}
              <span v-if="item.fileSize"> · {{ formatFileSize(item.fileSize) }}</span>
            </p>

            <div class="asset-manage-item__actions">
              <button v-if="item.previewUrl" type="button" class="course-chip course-chip--soft" @click="previewAsset(item.previewUrl)">预览</button>
              <button type="button" class="course-chip admin-manage-delete-btn" :disabled="deletingId === item.id" @click="removeAsset(item)">
                {{ deletingId === item.id ? '删除中...' : '删除' }}
              </button>
            </div>
          </article>
        </div>
        <div v-else-if="!loading" class="course-detail-empty">当前没有符合条件的素材记录。</div>

        <section class="admin-manage-pagination">
          <div class="admin-manage-pagination__desc">共 {{ pagination.total }} 条素材 · 当前第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</div>
          <div class="admin-manage-pagination__actions">
            <button type="button" class="course-chip" :disabled="pagination.page <= 1 || loading" @click="changePage(pagination.page - 1)">上一页</button>
            <button
              v-for="pageNumber in pageNumbers"
              :key="pageNumber"
              type="button"
              :class="['admin-manage-page-btn', pageNumber === pagination.page ? 'is-active' : '']"
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
import { deleteAdminAsset, getAdminAssetList, type AdminAssetItem, type AdminAssetStats, type AdminAssetType, type AdminCourseOption } from '@/services/admin'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const loading = ref(false)
const deletingId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const courseOptions = ref<AdminCourseOption[]>([])
const assetList = ref<AdminAssetItem[]>([])

const stats = reactive<AdminAssetStats>({
  total: 0,
  courseCount: 0,
  teacherCount: 0,
  fileCount: 0,
})

const filters = reactive({
  keyword: '',
  courseId: '',
  type: 'all' as AdminAssetType | 'all',
})

const pagination = reactive({
  page: 1,
  pageSize: 6,
  total: 0,
  totalPages: 0,
})

const assetTypeOptions: Array<{ value: AdminAssetType; label: string }> = [
  { value: 'image', label: '图片素材' },
  { value: 'audio', label: '音频素材' },
  { value: 'video', label: '视频素材' },
  { value: 'text', label: '文本片段' },
  { value: 'question', label: '题目卡片' },
  { value: 'template', label: '页面模板' },
]

const headerText = computed(() => {
  const name = authStore.profile?.name || authStore.profile?.username || '系统管理员'
  return `${name}，这里统一查看教师上传的图片、音频、视频和文本类教学素材。`
})

const pageNumbers = computed(() => {
  const totalPages = pagination.totalPages || 1
  return Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5)
})

function normalizePage(value: unknown) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function syncFiltersWithRoute() {
  filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  filters.courseId = typeof route.query.courseId === 'string' ? route.query.courseId : ''
  filters.type = typeof route.query.type === 'string' && route.query.type !== '' ? (route.query.type as AdminAssetType | 'all') : 'all'
}

function updateRoute(page = 1) {
  router.push({
    path: '/admin/assets',
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

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function assetTypeLabel(type: AdminAssetType) {
  return assetTypeOptions.find((item) => item.value === type)?.label || type
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(2)} MB`
  }

  return `${(size / 1024).toFixed(2)} KB`
}

function previewAsset(path: string) {
  if (!path) return
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  window.open(`${baseUrl}${path}`, '_blank', 'noopener,noreferrer')
}

async function removeAsset(item: AdminAssetItem) {
  clearMessages()
  if (!window.confirm(`确认删除素材“${item.title}”吗？`)) {
    return
  }

  deletingId.value = item.id
  try {
    await deleteAdminAsset(item.id)
    successMessage.value = `素材“${item.title}”已删除。`
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
    const data = await getAdminAssetList({
      page: normalizePage(route.query.page),
      pageSize: 6,
      keyword: filters.keyword,
      courseId: filters.courseId,
      type: filters.type,
    })

    courseOptions.value = data.filters.courses
    assetList.value = data.list
    stats.total = data.stats.total
    stats.courseCount = data.stats.courseCount
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
    stats.courseCount = 0
    stats.teacherCount = 0
    stats.fileCount = 0
    pagination.page = 1
    pagination.pageSize = 6
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
