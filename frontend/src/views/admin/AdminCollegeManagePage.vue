<template>
  <main class="admin-manage-page admin-course-simple-page">
    <aside class="admin-dashboard-sidebar">
      <div>
        <div class="admin-dashboard-sidebar__eyebrow">ADMIN CONSOLE</div>
        <h1>管理员中心</h1>
      </div>

      <nav class="admin-dashboard-nav">
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin')">总览首页</button>
        <button type="button" class="admin-dashboard-nav__item is-active">学院管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/courses')">课程管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/materials')">资料管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/videos')">视频管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/messages')">留言管理</button>
      </nav>

      <section class="admin-dashboard-reminder-card admin-dashboard-reminder-card--manage">
        <div class="admin-dashboard-reminder-card__eyebrow">COLLEGE ACTION</div>
        <ul>
          <li>{{ reminderTexts[0] }}</li>
          <li>{{ reminderTexts[1] }}</li>
        </ul>
      </section>
    </aside>

    <section class="admin-manage-main">
      <header class="admin-manage-head">
        <div>
          <div class="admin-manage-head__eyebrow">COLLEGE MANAGEMENT</div>
          <h2>管理员学院管理</h2>
          <p>{{ headerText }}</p>
        </div>
        <div class="admin-manage-head__actions">
          <button type="button" class="auth-btn auth-btn--secondary" @click="router.push('/admin')">返回总览</button>
          <button type="button" class="auth-btn" @click="openCreateEditor">新增学院</button>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success admin-manage-feedback">{{ successMessage }}</p>

      <section class="admin-manage-filter-panel admin-course-toolbar">
        <div>
          <div class="admin-manage-panel__eyebrow">QUICK SEARCH</div>
          <h3>搜索与列表</h3>
          <p class="admin-manage-panel__meta">聚焦学院基础信息维护，保留搜索、增删改查核心操作。</p>
        </div>

        <form class="admin-course-search" @submit.prevent="applySearch">
          <input v-model.trim="form.keyword" type="text" maxlength="100" placeholder="搜索学院名称或简介" />
          <button type="submit" class="auth-btn" :disabled="loading">{{ loading ? '加载中...' : '搜索' }}</button>
          <button type="button" class="auth-btn auth-btn--secondary" :disabled="loading" @click="resetFilters">重置</button>
        </form>
      </section>

      <section class="admin-manage-stats">
        <article class="admin-manage-stat-card">
          <span>学院总数</span>
          <strong>{{ stats.total }}</strong>
          <em>当前已建档学院数量</em>
        </article>
        <article class="admin-manage-stat-card">
          <span>关联教师数</span>
          <strong>{{ stats.teacherCount }}</strong>
          <em>已绑定学院的教师数量</em>
        </article>
        <article class="admin-manage-stat-card is-highlight">
          <span>关联课程数</span>
          <strong>{{ stats.courseCount }}</strong>
          <em>已绑定学院的课程数量</em>
        </article>
        <article class="admin-manage-stat-card">
          <span>当前页码</span>
          <strong>{{ pagination.page }}</strong>
          <em>共 {{ Math.max(pagination.totalPages, 1) }} 页</em>
        </article>
      </section>

      <section class="admin-manage-panel admin-course-list-panel">
        <div class="admin-manage-panel__head">
          <div>
            <div class="admin-manage-panel__eyebrow">COLLEGE LIST</div>
            <h3>学院列表</h3>
          </div>
          <div class="admin-manage-panel__meta">共 {{ pagination.total }} 个学院 · 教师 {{ stats.teacherCount }} 人 · 课程 {{ stats.courseCount }} 门</div>
        </div>

        <div v-if="loading" class="course-detail-empty course-detail-empty--compact">学院列表加载中...</div>

        <div v-else-if="collegeList.length" class="admin-course-crud-list">
          <article v-for="item in collegeList" :key="item.id" class="admin-course-crud-item">
            <div class="admin-course-crud-item__main">
              <div class="admin-course-crud-item__head">
                <strong>{{ item.name }}</strong>
                <span>最近更新 {{ item.updateDate }}</span>
              </div>
              <p>{{ item.intro || '暂无学院简介' }}</p>
              <div class="admin-course-crud-item__meta">
                <span>教师 {{ item.teacherCount }}</span>
                <span>课程 {{ item.courseCount }}</span>
              </div>
            </div>

            <div class="admin-course-crud-item__actions">
              <button type="button" class="course-chip course-chip--soft" @click="openEditEditor(item)">修改</button>
              <button type="button" class="course-chip admin-manage-delete-btn" :disabled="deletingId === item.id" @click="removeCollege(item)">
                {{ deletingId === item.id ? '删除中...' : '删除' }}
              </button>
            </div>
          </article>
        </div>

        <div v-else class="course-detail-empty">当前没有符合条件的学院记录。</div>

        <section v-if="pagination.total > 0" class="admin-manage-pagination">
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
            <button type="button" class="course-chip" :disabled="pagination.page >= pagination.totalPages || loading" @click="changePage(pagination.page + 1)">下一页</button>
          </div>
        </section>
      </section>
    </section>
  </main>

  <div v-if="editorVisible" class="admin-course-editor-mask" @click.self="closeEditor">
    <section class="admin-course-editor">
      <div class="admin-course-editor__head">
        <div>
          <div class="admin-manage-panel__eyebrow">COLLEGE EDITOR</div>
          <h3>{{ editorTitle }}</h3>
        </div>
        <button type="button" class="course-chip course-chip--soft" @click="closeEditor">关闭</button>
      </div>

      <form class="admin-course-editor__form" @submit.prevent="submitEditor">
        <label class="admin-manage-field">
          <span>学院名称</span>
          <input v-model.trim="editorForm.name" type="text" maxlength="100" placeholder="请输入学院名称" />
        </label>

        <label class="admin-manage-field admin-manage-field--full">
          <span>学院简介</span>
          <textarea v-model.trim="editorForm.intro" maxlength="5000" placeholder="请输入学院简介，可为空"></textarea>
        </label>

        <div class="admin-course-editor__footer">
          <p>删除学院前会校验是否存在关联教师或课程，避免误删基础数据。</p>
          <div class="admin-course-editor__actions">
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="saving" @click="closeEditor">取消</button>
            <button type="submit" class="auth-btn" :disabled="saving">{{ saving ? '保存中...' : editorActionText }}</button>
          </div>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createAdminCollege,
  deleteAdminCollege,
  getAdminCollegeList,
  updateAdminCollege,
  type AdminCollegeItem,
  type AdminCollegeStats,
} from '@/services/admin'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const editorVisible = ref(false)
const editingId = ref<number | null>(null)

const collegeList = ref<AdminCollegeItem[]>([])

const form = reactive({
  keyword: '',
})

const editorForm = reactive({
  name: '',
  intro: '',
})

const stats = reactive<AdminCollegeStats>({
  total: 0,
  teacherCount: 0,
  courseCount: 0,
})

const pagination = reactive({
  page: 1,
  pageSize: 6,
  total: 0,
  totalPages: 0,
})

const headerText = computed(() => {
  const name = authStore.profile?.name || authStore.profile?.username || '管理员'
  return `${name}，这里统一维护学院基础信息，为课程管理和教师归属提供主数据支持。`
})

const reminderTexts = computed(() => {
  return [
    stats.total > 0 ? `当前共有 ${stats.total} 个学院可管理。` : '当前还没有学院数据，可先创建学院信息。',
    stats.courseCount > 0 ? `已有 ${stats.courseCount} 门课程完成学院归属。` : '当前课程尚未形成学院归属，可逐步补齐。',
  ]
})

const pageNumbers = computed(() => {
  const totalPages = Math.max(pagination.totalPages, 1)
  const start = Math.max(1, Math.min(pagination.page - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

const editorTitle = computed(() => (editingId.value ? '修改学院' : '新增学院'))
const editorActionText = computed(() => (editingId.value ? '保存修改' : '确认新增'))

function normalizePage(value: unknown) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function clearFeedback() {
  errorMessage.value = ''
  successMessage.value = ''
}

function syncFormWithRoute() {
  form.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
}

function updateRoute(page = 1) {
  router.push({
    path: '/admin/colleges',
    query: {
      page: String(page),
      ...(form.keyword ? { keyword: form.keyword } : {}),
    },
  })
}

function resetEditorForm() {
  editingId.value = null
  editorForm.name = ''
  editorForm.intro = ''
}

function openCreateEditor() {
  clearFeedback()
  resetEditorForm()
  editorVisible.value = true
}

function openEditEditor(item: AdminCollegeItem) {
  clearFeedback()
  editingId.value = item.id
  editorForm.name = item.name
  editorForm.intro = item.intro
  editorVisible.value = true
}

function closeEditor() {
  if (saving.value) {
    return
  }

  editorVisible.value = false
  resetEditorForm()
}

function applySearch() {
  updateRoute(1)
}

function resetFilters() {
  clearFeedback()
  form.keyword = ''
  updateRoute(1)
}

function changePage(page: number) {
  updateRoute(page)
}

async function submitEditor() {
  clearFeedback()

  if (!editorForm.name) {
    errorMessage.value = '学院名称不能为空'
    return
  }

  saving.value = true

  try {
    const payload = {
      name: editorForm.name,
      intro: editorForm.intro,
    }

    if (editingId.value) {
      const result = await updateAdminCollege(editingId.value, payload)
      successMessage.value = `学院《${result.name}》已更新。`
      closeEditor()
      await loadColleges()
    } else {
      const result = await createAdminCollege(payload)
      successMessage.value = `学院《${result.name}》已创建。`
      closeEditor()

      if (pagination.page !== 1) {
        updateRoute(1)
      } else {
        await loadColleges()
      }
    }
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '学院保存失败'
  } finally {
    saving.value = false
  }
}

async function removeCollege(item: AdminCollegeItem) {
  clearFeedback()

  if (!window.confirm(`确认删除学院《${item.name}》吗？如果已关联课程或教师，将无法删除。`)) {
    return
  }

  deletingId.value = item.id

  try {
    await deleteAdminCollege(item.id)
    successMessage.value = `学院《${item.name}》已删除。`

    if (collegeList.value.length === 1 && pagination.page > 1) {
      updateRoute(pagination.page - 1)
    } else {
      await loadColleges()
    }
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '学院删除失败'
  } finally {
    deletingId.value = null
  }
}

async function loadColleges() {
  loading.value = true
  syncFormWithRoute()
  errorMessage.value = ''

  try {
    const data = await getAdminCollegeList({
      page: normalizePage(route.query.page),
      pageSize: 6,
      keyword: form.keyword,
    })

    collegeList.value = data.list
    stats.total = data.stats.total
    stats.teacherCount = data.stats.teacherCount
    stats.courseCount = data.stats.courseCount
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
  } catch (error: any) {
    collegeList.value = []
    stats.total = 0
    stats.teacherCount = 0
    stats.courseCount = 0
    pagination.page = 1
    pagination.pageSize = 6
    pagination.total = 0
    pagination.totalPages = 0
    errorMessage.value = error?.response?.data?.message || '学院管理列表加载失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.fullPath,
  () => {
    loadColleges()
  },
  { immediate: true },
)
</script>
