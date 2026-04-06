<template>
  <main class="admin-manage-page prep-page">
    <aside class="admin-dashboard-sidebar">
      <div>
        <div class="admin-dashboard-sidebar__eyebrow">ADMIN CONSOLE</div>
        <h1>管理员中心</h1>
      </div>

      <nav class="admin-dashboard-nav">
        <button type="button" class="admin-dashboard-nav__item admin-dashboard-nav__item--system" @click="router.push('/admin/system')">系统管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin')">总览首页</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/teachers')">教师用户</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/students')">学生用户</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/accounts')">账号管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/colleges')">学院管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/courses')">课程管理</button>
        <button type="button" class="admin-dashboard-nav__item is-active">备课单管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/assets')">素材库</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/materials')">资料管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/messages')">教学交流</button>
      </nav>
    </aside>

    <section class="admin-manage-main">
      <header class="admin-manage-head">
        <div>
          <div class="admin-manage-head__eyebrow">PREP MANAGEMENT</div>
          <h2>管理员备课单管理</h2>
          <p>{{ headerText }}</p>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success admin-manage-feedback">{{ successMessage }}</p>

      <section class="admin-manage-stats">
        <article class="admin-manage-stat-card">
          <span>备课单总数</span>
          <strong>{{ stats.total }}</strong>
          <em>平台当前全部备课单</em>
        </article>
        <article class="admin-manage-stat-card">
          <span>草稿数量</span>
          <strong>{{ stats.draftCount }}</strong>
          <em>尚未完成整理的备课单</em>
        </article>
        <article class="admin-manage-stat-card">
          <span>已发布数量</span>
          <strong>{{ stats.publishedCount }}</strong>
          <em>可直接查看的备课单</em>
        </article>
        <article class="admin-manage-stat-card is-highlight">
          <span>涉及教师</span>
          <strong>{{ stats.teacherCount }}</strong>
          <em>已有备课记录的教师人数</em>
        </article>
      </section>

      <section class="admin-manage-filter-panel">
        <div class="admin-manage-filter-panel__head">
          <div>
            <div class="admin-manage-panel__eyebrow">PREP FILTER</div>
            <h3>筛选备课单</h3>
          </div>
          <div class="admin-manage-panel__meta">共 {{ pagination.total }} 条备课单</div>
        </div>

        <form class="admin-manage-filter-form admin-manage-filter-form--resource" @submit.prevent="applySearch">
          <label class="admin-manage-field">
            <span>关键词</span>
            <input v-model.trim="filters.keyword" type="text" maxlength="200" placeholder="搜索标题、教师名、课程名或教学内容" />
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
            <span>状态</span>
            <select v-model="filters.status">
              <option value="all">全部状态</option>
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
              <option value="archived">已归档</option>
            </select>
          </label>

          <div class="admin-manage-filter-actions">
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="loading" @click="resetFilters">重置</button>
            <button type="submit" class="auth-btn" :disabled="loading">{{ loading ? '加载中...' : '搜索备课单' }}</button>
          </div>
        </form>
      </section>

      <section class="admin-manage-panel">
        <div class="admin-manage-panel__head">
          <div>
            <div class="admin-manage-panel__eyebrow">PREP LIST</div>
            <h3>备课单列表</h3>
          </div>
          <div class="admin-manage-panel__meta">支持查看摘要并删除异常或无效备课单</div>
        </div>

        <div v-if="prepList.length" class="prep-manage-list prep-manage-list--admin">
          <article v-for="item in prepList" :key="item.id" class="prep-manage-item prep-manage-item--admin">
            <div class="prep-manage-item__header">
              <div>
                <strong>{{ item.title }}</strong>
                <div class="prep-manage-item__meta">
                  <span class="teacher-dashboard-tag">{{ item.statusLabel }}</span>
                  <span>{{ item.teacherName }}</span>
                  <span>{{ item.courseName }}</span>
                </div>
              </div>
              <span class="prep-manage-item__time">更新于 {{ item.updateTime }}</span>
            </div>

            <div class="prep-manage-item__summary">
              <p>{{ buildSummary(item) }}</p>
            </div>

            <div class="prep-manage-item__sections">
              <article class="prep-manage-item__section">
                <span>教学目标</span>
                <p>{{ renderExcerpt(item.teachingObjective) }}</p>
              </article>
              <article class="prep-manage-item__section">
                <span>学情分析</span>
                <p>{{ renderExcerpt(item.studentAnalysis) }}</p>
              </article>
              <article class="prep-manage-item__section">
                <span>教学过程</span>
                <p>{{ renderExcerpt(item.teachingProcess) }}</p>
              </article>
            </div>

            <div class="prep-manage-item__actions">
              <button type="button" class="course-chip admin-manage-delete-btn" :disabled="deletingId === item.id" @click="removePrep(item)">
                {{ deletingId === item.id ? '删除中...' : '删除' }}
              </button>
            </div>
          </article>
        </div>
        <div v-else-if="!loading" class="course-detail-empty">当前没有符合条件的备课单记录。</div>

        <section class="admin-manage-pagination">
          <div class="admin-manage-pagination__desc">共 {{ pagination.total }} 条备课单，当前第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</div>
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
import { deleteAdminPrep, getAdminPrepList, type AdminCourseOption, type AdminPrepItem, type AdminPrepStats } from '@/services/admin'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const loading = ref(false)
const deletingId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const courseOptions = ref<AdminCourseOption[]>([])
const prepList = ref<AdminPrepItem[]>([])

const stats = reactive<AdminPrepStats>({
  total: 0,
  draftCount: 0,
  publishedCount: 0,
  teacherCount: 0,
})

const filters = reactive({
  keyword: '',
  courseId: '',
  status: 'all' as 'all' | 'draft' | 'published' | 'archived',
})

const pagination = reactive({
  page: 1,
  pageSize: 6,
  total: 0,
  totalPages: 0,
})

const headerText = computed(() => {
  const name = authStore.profile?.name || authStore.profile?.username || '系统管理员'
  return `${name}，这里统一查看教师提交的备课单，便于按课程和状态进行管理。`
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

function renderExcerpt(content: string, fallback = '暂未填写') {
  const text = (content || '').trim()
  if (!text) {
    return fallback
  }

  return text.length > 100 ? `${text.slice(0, 100)}...` : text
}

function buildSummary(item: AdminPrepItem) {
  const parts = [
    item.keyPoints?.trim() ? `重点：${renderExcerpt(item.keyPoints, '')}` : '',
    item.difficultyPoints?.trim() ? `难点：${renderExcerpt(item.difficultyPoints, '')}` : '',
    item.teachingContent?.trim() ? `内容：${renderExcerpt(item.teachingContent, '')}` : '',
    item.reflectionNotes?.trim() ? `反思：${renderExcerpt(item.reflectionNotes, '')}` : '',
  ].filter(Boolean)

  return parts.join(' ｜ ') || '这份备课单还没有填写完整摘要。'
}

function syncFiltersWithRoute() {
  filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  filters.courseId = typeof route.query.courseId === 'string' ? route.query.courseId : ''
  filters.status =
    route.query.status === 'draft' || route.query.status === 'published' || route.query.status === 'archived'
      ? route.query.status
      : 'all'
}

function updateRoute(page = 1) {
  router.push({
    path: '/admin/preps',
    query: {
      page: String(page),
      ...(filters.keyword ? { keyword: filters.keyword } : {}),
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
      ...(filters.status !== 'all' ? { status: filters.status } : {}),
    },
  })
}

function applySearch() {
  updateRoute(1)
}

function resetFilters() {
  filters.keyword = ''
  filters.courseId = ''
  filters.status = 'all'
  updateRoute(1)
}

function changePage(page: number) {
  updateRoute(page)
}

async function removePrep(item: AdminPrepItem) {
  clearMessages()

  if (!window.confirm(`确认删除备课单“${item.title}”吗？`)) {
    return
  }

  deletingId.value = item.id

  try {
    await deleteAdminPrep(item.id)
    successMessage.value = `备课单“${item.title}”已删除`
    await loadPreps()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '备课单删除失败'
  } finally {
    deletingId.value = null
  }
}

async function loadPreps() {
  loading.value = true
  clearMessages()
  syncFiltersWithRoute()

  try {
    const data = await getAdminPrepList({
      page: normalizePage(route.query.page),
      pageSize: 6,
      keyword: filters.keyword,
      courseId: filters.courseId,
      status: filters.status,
    })

    prepList.value = data.list
    courseOptions.value = data.filters.courses
    stats.total = data.stats.total
    stats.draftCount = data.stats.draftCount
    stats.publishedCount = data.stats.publishedCount
    stats.teacherCount = data.stats.teacherCount
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
  } catch (error: any) {
    prepList.value = []
    courseOptions.value = []
    stats.total = 0
    stats.draftCount = 0
    stats.publishedCount = 0
    stats.teacherCount = 0
    pagination.page = 1
    pagination.pageSize = 6
    pagination.total = 0
    pagination.totalPages = 0
    errorMessage.value = error?.response?.data?.message || '备课单管理列表加载失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.fullPath,
  () => {
    loadPreps()
  },
  { immediate: true },
)
</script>
