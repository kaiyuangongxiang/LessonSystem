<template>
  <main class="admin-manage-page">
    <aside class="admin-dashboard-sidebar">
      <div>
        <div class="admin-dashboard-sidebar__eyebrow">ADMIN CONSOLE</div>
        <h1>管理员中心</h1>
      </div>

      <AdminSidebarNav active="materials" />
      <nav v-if="false" class="admin-dashboard-nav">
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin')">总览首页</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/accounts')">账号管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/colleges')">学院管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/courses')">课程管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/materials')">资料管理</button>
        <button type="button" class="admin-dashboard-nav__item is-active">视频管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/messages')">留言管理</button>
      </nav>

      <section class="admin-dashboard-reminder-card admin-dashboard-reminder-card--manage">
        <div class="admin-dashboard-reminder-card__eyebrow">VIDEO ACTION</div>
        <ul>
          <li>{{ reminderTexts[0] }}</li>
          <li>{{ reminderTexts[1] }}</li>
        </ul>
      </section>
    </aside>

    <section class="admin-manage-main">
      <header class="admin-manage-head">
        <div>
          <div class="admin-manage-head__eyebrow">VIDEO MANAGEMENT</div>
          <h2>管理员视频管理</h2>
          <p>{{ headerText }}</p>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success admin-manage-feedback">{{ successMessage }}</p>

      <section class="admin-manage-filter-panel">
        <div class="admin-manage-filter-panel__head">
          <div>
            <div class="admin-manage-panel__eyebrow">VIDEO FILTER</div>
            <h3>筛选视频</h3>
          </div>
          <div class="admin-manage-panel__meta">共 {{ pagination.total }} 个视频</div>
        </div>

        <form class="admin-manage-filter-form admin-manage-filter-form--resource" @submit.prevent="applySearch">
          <label class="admin-manage-field">
            <span>视频标题</span>
            <input v-model.trim="form.keyword" type="text" maxlength="200" placeholder="搜索视频标题或描述" />
          </label>

          <label class="admin-manage-field">
            <span>所属课程</span>
            <select v-model="form.courseId">
              <option value="">全部课程</option>
              <option v-for="course in courseOptions" :key="course.id" :value="String(course.id)">
                {{ course.name }}
              </option>
            </select>
          </label>

          <div class="admin-manage-filter-actions">
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="loading" @click="resetFilters">重置</button>
            <button type="submit" class="auth-btn" :disabled="loading">{{ loading ? '加载中...' : '搜索视频' }}</button>
          </div>
        </form>
      </section>

      <section class="admin-manage-stats">
        <article class="admin-manage-stat-card">
          <span>视频总数</span>
          <strong>{{ stats.total }}</strong>
          <em>平台有效视频数量</em>
        </article>
        <article class="admin-manage-stat-card">
          <span>关联课程数</span>
          <strong>{{ stats.courseCount }}</strong>
          <em>视频覆盖课程范围</em>
        </article>
        <article class="admin-manage-stat-card">
          <span>上传教师数</span>
          <strong>{{ stats.teacherCount }}</strong>
          <em>当前视频上传教师</em>
        </article>
        <article class="admin-manage-stat-card is-highlight">
          <span>累计播放量</span>
          <strong>{{ stats.interactionCount }}</strong>
          <em>视频播放总次数</em>
        </article>
      </section>

      <section class="admin-manage-panel">
        <div class="admin-manage-panel__head">
          <div>
            <div class="admin-manage-panel__eyebrow">VIDEO LIST</div>
            <h3>视频列表</h3>
          </div>
          <div class="admin-manage-panel__meta">支持直接播放并执行删除</div>
        </div>

        <div v-if="resourceList.length" class="admin-manage-table">
          <div class="admin-manage-table__head admin-manage-table__head--resource">
            <span>视频信息</span>
            <span>所属课程</span>
            <span>上传教师</span>
            <span>格式 / 时长</span>
            <span>上传时间</span>
            <span>播放量</span>
            <span>操作</span>
          </div>

          <article v-for="item in resourceList" :key="item.id" class="admin-manage-row admin-manage-row--resource">
            <div class="admin-manage-row__title">
              <strong>{{ item.title }}</strong>
              <p>{{ item.description || item.fileName }}</p>
            </div>
            <div class="admin-manage-row__cell">{{ item.courseName }}</div>
            <div class="admin-manage-row__cell">{{ item.teacherName }}</div>
            <div class="admin-manage-row__cell">{{ item.format }} · {{ formatDuration(item.duration) }}</div>
            <div class="admin-manage-row__cell">{{ item.uploadTime }}</div>
            <div class="admin-manage-row__cell">{{ item.interactionCount }}</div>
            <div class="admin-manage-row__actions">
              <button type="button" class="course-chip course-chip--soft" @click="playVideo(item.previewUrl)">播放</button>
              <button type="button" class="course-chip admin-manage-delete-btn" :disabled="deletingId === item.id" @click="removeResource(item)">
                {{ deletingId === item.id ? '删除中...' : '删除' }}
              </button>
            </div>
          </article>
        </div>
        <div v-else-if="!loading" class="course-detail-empty">当前没有符合条件的视频记录。</div>

        <section class="admin-manage-pagination">
          <div class="admin-manage-pagination__desc">共 {{ pagination.total }} 个视频 · 当前第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</div>
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
import {
  deleteAdminVideo,
  getAdminVideoList,
  type AdminCourseOption,
  type AdminManagedResourceItem,
  type AdminResourceStats,
} from '@/services/admin'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const loading = ref(false)
const deletingId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const courseOptions = ref<AdminCourseOption[]>([])
const resourceList = ref<AdminManagedResourceItem[]>([])
const form = reactive({
  keyword: '',
  courseId: '',
})
const stats = reactive<AdminResourceStats>({
  total: 0,
  courseCount: 0,
  teacherCount: 0,
  interactionCount: 0,
})
const pagination = reactive({
  page: 1,
  pageSize: 4,
  total: 0,
  totalPages: 0,
})

const headerText = computed(() => {
  const name = authStore.profile?.name || authStore.profile?.username || '管理员'
  return `${name}，这里统一管理教师上传的视频资源，并快速处理失效内容。`
})

const reminderTexts = computed(() => {
  return [
    stats.total > 0 ? `当前共有 ${stats.total} 个视频处于有效状态。` : '当前还没有可管理的视频资源。',
    stats.interactionCount > 0 ? `累计视频播放次数为 ${stats.interactionCount} 次。` : '当前视频尚未产生播放记录。',
  ]
})



function normalizePage(value: unknown) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function formatDuration(duration: number | null) {
  if (!duration || duration <= 0) {
    return '未标注'
  }

  const totalSeconds = Math.floor(duration)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes} 分 ${String(seconds).padStart(2, '0')} 秒`
}

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function syncFormWithRoute() {
  form.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  form.courseId = typeof route.query.courseId === 'string' ? route.query.courseId : ''
}

function updateRoute(page = 1) {
  router.push({
    path: '/admin/videos',
    query: {
      page: String(page),
      ...(form.keyword ? { keyword: form.keyword } : {}),
      ...(form.courseId ? { courseId: form.courseId } : {}),
    },
  })
}

function applySearch() {
  updateRoute(1)
}

function resetFilters() {
  clearMessages()
  form.keyword = ''
  form.courseId = ''
  updateRoute(1)
}

function changePage(page: number) {
  updateRoute(page)
}

function playVideo(path: string) {
  if (!path) {
    return
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  window.open(`${baseUrl}${path}`, '_blank', 'noopener,noreferrer')
}

async function removeResource(item: AdminManagedResourceItem) {
  clearMessages()

  if (!window.confirm(`确认删除视频《${item.title}》吗？`)) {
    return
  }

  deletingId.value = item.id

  try {
    await deleteAdminVideo(item.id)
    successMessage.value = `视频《${item.title}》已删除。`
    await loadVideos()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '视频删除失败'
  } finally {
    deletingId.value = null
  }
}

async function loadVideos() {
  loading.value = true
  clearMessages()
  syncFormWithRoute()

  try {
    const data = await getAdminVideoList({
      page: normalizePage(route.query.page),
      pageSize: 4,
      keyword: form.keyword,
      courseId: form.courseId,
    })

    resourceList.value = data.list
    courseOptions.value = data.filters.courses
    stats.total = data.stats.total
    stats.courseCount = data.stats.courseCount
    stats.teacherCount = data.stats.teacherCount
    stats.interactionCount = data.stats.interactionCount
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
  } catch (error: any) {
    resourceList.value = []
    courseOptions.value = []
    stats.total = 0
    stats.courseCount = 0
    stats.teacherCount = 0
    stats.interactionCount = 0
    pagination.page = 1
    pagination.pageSize = 4
    pagination.total = 0
    pagination.totalPages = 0
    errorMessage.value = error?.response?.data?.message || '视频管理列表加载失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.fullPath,
  () => {
    loadVideos()
  },
  { immediate: true },
)
</script>
