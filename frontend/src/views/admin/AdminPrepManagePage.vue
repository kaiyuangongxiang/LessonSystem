<template>
  <main class="admin-manage-page admin-prep-page">
    <aside class="admin-dashboard-sidebar">
      <div>
        <div class="admin-dashboard-sidebar__eyebrow">ADMIN CONSOLE</div>
        <h1>管理员中心</h1>
      </div>

      <AdminSidebarNav active="preps" />
    </aside>

    <section class="admin-manage-main admin-prep-main">
      <header class="admin-prep-header">
        <div>
          <div class="admin-prep-header__eyebrow">PREP MANAGEMENT</div>
          <h2>备课单管理</h2>
          <p>管理员侧只查看教学内容主字段和附件挂载情况，避免旧版教学扩展字段继续占用页面空间。</p>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success">{{ successMessage }}</p>

      <section class="admin-prep-stats">
        <article class="admin-prep-stat-card">
          <span>备课单总数</span>
          <strong>{{ stats.total }}</strong>
        </article>
        <article class="admin-prep-stat-card">
          <span>草稿</span>
          <strong>{{ stats.draftCount }}</strong>
        </article>
        <article class="admin-prep-stat-card">
          <span>已发布</span>
          <strong>{{ stats.publishedCount }}</strong>
        </article>
        <article class="admin-prep-stat-card">
          <span>涉及教师</span>
          <strong>{{ stats.teacherCount }}</strong>
        </article>
      </section>

      <section class="admin-prep-card">
        <form class="admin-prep-filter" @submit.prevent="applySearch">
          <label>
            <span>关键词</span>
            <input v-model.trim="filters.keyword" type="text" maxlength="200" placeholder="搜索标题、教师名、课程名或教学内容" />
          </label>

          <label>
            <span>课程</span>
            <select v-model="filters.courseId">
              <option value="">全部课程</option>
              <option v-for="course in courseOptions" :key="course.id" :value="String(course.id)">{{ course.name }}</option>
            </select>
          </label>

          <label>
            <span>状态</span>
            <select v-model="filters.status">
              <option value="all">全部状态</option>
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
              <option value="archived">已归档</option>
            </select>
          </label>

          <div class="admin-prep-filter__actions">
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="loading" @click="resetFilters">重置</button>
            <button type="submit" class="auth-btn" :disabled="loading">{{ loading ? '加载中...' : '应用筛选' }}</button>
          </div>
        </form>
      </section>

      <section class="admin-prep-card">
        <div class="admin-prep-card__head">
          <div>
            <div class="admin-prep-card__eyebrow">LIST</div>
            <h3>备课单列表</h3>
          </div>
          <div class="admin-prep-card__meta">共 {{ pagination.total }} 条备课单</div>
        </div>

        <div v-if="prepList.length" class="admin-prep-list">
          <article v-for="item in prepList" :key="item.id" class="admin-prep-item">
            <div class="admin-prep-item__head">
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.teacherName }} · {{ item.courseName }} · {{ item.statusLabel }}</p>
              </div>
              <span>{{ item.updateTime }}</span>
            </div>

            <p class="admin-prep-item__content">{{ renderExcerpt(item.teachingContent, '暂无教学内容') }}</p>

            <div class="admin-prep-item__attachments">
              <strong>附件 {{ item.attachmentCount }}</strong>
              <div v-if="item.attachments.length" class="admin-prep-item__attachment-tags">
                <span v-for="attachment in item.attachments" :key="attachment.id">
                  {{ attachment.title }}
                </span>
              </div>
            </div>

            <div class="admin-prep-item__actions">
              <button type="button" class="course-chip admin-manage-delete-btn" :disabled="deletingId === item.id" @click="removePrep(item)">
                {{ deletingId === item.id ? '删除中...' : '删除' }}
              </button>
            </div>
          </article>
        </div>
        <div v-else-if="!loading" class="course-detail-empty">当前没有符合条件的备课单记录。</div>

        <section class="admin-manage-pagination">
          <div class="admin-manage-pagination__desc">当前第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</div>
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
import AdminSidebarNav from '@/components/navigation/AdminSidebarNav.vue'
import { deleteAdminPrep, getAdminPrepList, type AdminCourseOption, type AdminPrepItem, type AdminPrepStats } from '@/services/admin'

const router = useRouter()
const route = useRoute()
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

const pageNumbers = computed(() => {
  const totalPages = pagination.totalPages || 1
  return Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1)
})

function normalizePage(value: unknown) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function renderExcerpt(content: string, fallback = '暂无内容') {
  const text = (content || '').trim()
  if (!text) return fallback
  return text.length > 160 ? `${text.slice(0, 160)}...` : text
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
  void router.push({
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
    await loadPreps()
    successMessage.value = `备课单“${item.title}”已删除`
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
