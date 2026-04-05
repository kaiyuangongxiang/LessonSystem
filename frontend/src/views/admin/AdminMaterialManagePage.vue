<template>
  <main class="admin-manage-page">
    <aside class="admin-dashboard-sidebar">
      <div>
        <div class="admin-dashboard-sidebar__eyebrow">ADMIN CONSOLE</div>
        <h1>管理员中心</h1>
      </div>

      <nav class="admin-dashboard-nav">
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin')">总览首页</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/accounts')">账号管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/colleges')">学院管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/courses')">课程管理</button>
        <button type="button" class="admin-dashboard-nav__item is-active">资料管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/videos')">视频管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/messages')">留言管理</button>
      </nav>

      <section class="admin-dashboard-reminder-card admin-dashboard-reminder-card--manage">
        <div class="admin-dashboard-reminder-card__eyebrow">MATERIAL ACTION</div>
        <ul>
          <li>{{ reminderTexts[0] }}</li>
          <li>{{ reminderTexts[1] }}</li>
        </ul>
      </section>
    </aside>

    <section class="admin-manage-main">
      <header class="admin-manage-head">
        <div>
          <div class="admin-manage-head__eyebrow">MATERIAL MANAGEMENT</div>
          <h2>管理员资料管理</h2>
          <p>{{ headerText }}</p>
        </div>
        <div class="admin-manage-head__actions">
          <span class="course-chip course-chip--soft">资料治理</span>
          <button type="button" class="auth-btn auth-btn--secondary" @click="router.push('/admin')">返回总览</button>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success admin-manage-feedback">{{ successMessage }}</p>

      <section class="admin-manage-filter-panel">
        <div class="admin-manage-filter-panel__head">
          <div>
            <div class="admin-manage-panel__eyebrow">MATERIAL FILTER</div>
            <h3>筛选资料</h3>
          </div>
          <div class="admin-manage-panel__meta">共 {{ pagination.total }} 份资料</div>
        </div>

        <form class="admin-manage-filter-form admin-manage-filter-form--resource" @submit.prevent="applySearch">
          <label class="admin-manage-field">
            <span>资料名称</span>
            <input v-model.trim="form.keyword" type="text" maxlength="200" placeholder="搜索资料标题、描述或文件名" />
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
            <button type="submit" class="auth-btn" :disabled="loading">{{ loading ? '加载中...' : '搜索资料' }}</button>
          </div>
        </form>
      </section>

      <section class="admin-manage-stats">
        <article class="admin-manage-stat-card">
          <span>资料总数</span>
          <strong>{{ stats.total }}</strong>
          <em>平台有效资料数量</em>
        </article>
        <article class="admin-manage-stat-card">
          <span>关联课程数</span>
          <strong>{{ stats.courseCount }}</strong>
          <em>资料覆盖课程范围</em>
        </article>
        <article class="admin-manage-stat-card">
          <span>上传教师数</span>
          <strong>{{ stats.teacherCount }}</strong>
          <em>当前资料上传教师</em>
        </article>
        <article class="admin-manage-stat-card is-highlight">
          <span>累计下载量</span>
          <strong>{{ stats.interactionCount }}</strong>
          <em>资料下载总次数</em>
        </article>
      </section>

      <section class="admin-manage-panel">
        <div class="admin-manage-panel__head">
          <div>
            <div class="admin-manage-panel__eyebrow">MATERIAL LIST</div>
            <h3>资料列表</h3>
          </div>
          <div class="admin-manage-panel__meta">支持直接查看文件并执行删除</div>
        </div>

        <div v-if="resourceList.length" class="admin-manage-table">
          <div class="admin-manage-table__head admin-manage-table__head--resource">
            <span>资料信息</span>
            <span>所属课程</span>
            <span>上传教师</span>
            <span>格式 / 大小</span>
            <span>上传时间</span>
            <span>下载量</span>
            <span>操作</span>
          </div>

          <article v-for="item in resourceList" :key="item.id" class="admin-manage-row admin-manage-row--resource">
            <div class="admin-manage-row__title">
              <strong>{{ item.title }}</strong>
              <p>{{ item.description || `${item.fileName} · ${formatFileSize(item.fileSize)}` }}</p>
            </div>
            <div class="admin-manage-row__cell">{{ item.courseName }}</div>
            <div class="admin-manage-row__cell">{{ item.teacherName }}</div>
            <div class="admin-manage-row__cell">{{ item.format }} · {{ formatFileSize(item.fileSize) }}</div>
            <div class="admin-manage-row__cell">{{ item.uploadTime }}</div>
            <div class="admin-manage-row__cell">{{ item.interactionCount }}</div>
            <div class="admin-manage-row__actions">
              <button type="button" class="course-chip course-chip--soft" @click="viewResource(item.previewUrl)">查看</button>
              <button type="button" class="course-chip admin-manage-delete-btn" :disabled="deletingId === item.id" @click="removeResource(item)">
                {{ deletingId === item.id ? '删除中...' : '删除' }}
              </button>
            </div>
          </article>
        </div>
        <div v-else-if="!loading" class="course-detail-empty">当前没有符合条件的资料记录。</div>

        <section class="admin-manage-pagination">
          <div class="admin-manage-pagination__desc">共 {{ pagination.total }} 份资料 · 当前第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</div>
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
import {
  deleteAdminMaterial,
  getAdminMaterialList,
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
  pageSize: 6,
  total: 0,
  totalPages: 0,
})

const headerText = computed(() => {
  const name = authStore.profile?.name || authStore.profile?.username || '管理员'
  return `${name}，这里统一管理教师上传的资料资源，并快速处理失效文档。`
})

const reminderTexts = computed(() => {
  return [
    stats.total > 0 ? `当前共有 ${stats.total} 份资料处于有效状态。` : '当前还没有可管理的资料资源。',
    stats.interactionCount > 0 ? `累计资料下载次数为 ${stats.interactionCount} 次。` : '当前资料尚未产生下载记录。',
  ]
})

const pageNumbers = computed(() => {
  const totalPages = pagination.totalPages || 1
  return Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5)
})

function normalizePage(value: unknown) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024 * 1024) {
    return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
  }

  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(2)} MB`
  }

  return `${(size / 1024).toFixed(2)} KB`
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
    path: '/admin/materials',
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

function viewResource(path: string) {
  if (!path) {
    return
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  window.open(`${baseUrl}${path}`, '_blank', 'noopener,noreferrer')
}

async function removeResource(item: AdminManagedResourceItem) {
  clearMessages()

  if (!window.confirm(`确认删除资料《${item.title}》吗？`)) {
    return
  }

  deletingId.value = item.id

  try {
    await deleteAdminMaterial(item.id)
    successMessage.value = `资料《${item.title}》已删除。`
    await loadMaterials()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '资料删除失败'
  } finally {
    deletingId.value = null
  }
}

async function loadMaterials() {
  loading.value = true
  clearMessages()
  syncFormWithRoute()

  try {
    const data = await getAdminMaterialList({
      page: normalizePage(route.query.page),
      pageSize: 6,
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
    pagination.pageSize = 6
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
    loadMaterials()
  },
  { immediate: true },
)
</script>
