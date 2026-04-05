<template>
  <main class="admin-manage-page admin-course-simple-page">
    <aside class="admin-dashboard-sidebar">
      <div>
        <div class="admin-dashboard-sidebar__eyebrow">ADMIN CONSOLE</div>
        <h1>管理员中心</h1>
      </div>

      <nav class="admin-dashboard-nav">
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin')">总览首页</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/colleges')">学院管理</button>
        <button type="button" class="admin-dashboard-nav__item is-active">课程管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/materials')">资料管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/videos')">视频管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/messages')">留言管理</button>
      </nav>

      <section class="admin-dashboard-reminder-card admin-dashboard-reminder-card--manage">
        <div class="admin-dashboard-reminder-card__eyebrow">COURSE ACTION</div>
        <ul>
          <li>{{ reminderTexts[0] }}</li>
          <li>{{ reminderTexts[1] }}</li>
        </ul>
      </section>
    </aside>

    <section class="admin-manage-main">
      <header class="admin-manage-head">
        <div>
          <div class="admin-manage-head__eyebrow">COURSE MANAGEMENT</div>
          <h2>管理员课程管理</h2>
          <p>{{ headerText }}</p>
        </div>
        <div class="admin-manage-head__actions">
          <button type="button" class="auth-btn auth-btn--secondary" @click="router.push('/admin')">返回总览</button>
          <button type="button" class="auth-btn" @click="openCreateEditor">新增课程</button>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success admin-manage-feedback">{{ successMessage }}</p>

      <section class="admin-manage-filter-panel admin-course-toolbar">
        <div>
          <div class="admin-manage-panel__eyebrow">QUICK SEARCH</div>
          <h3>搜索与列表</h3>
          <p class="admin-manage-panel__meta">保留课程增删改查主链路，不扩展额外功能。</p>
        </div>

        <form class="admin-course-search" @submit.prevent="applySearch">
          <input v-model.trim="form.keyword" type="text" maxlength="100" placeholder="搜索课程名称、简介、教师或学院" />
          <button type="submit" class="auth-btn" :disabled="loading">{{ loading ? '加载中...' : '搜索' }}</button>
          <button type="button" class="auth-btn auth-btn--secondary" :disabled="loading" @click="resetFilters">重置</button>
        </form>
      </section>

      <section class="admin-manage-panel admin-course-list-panel">
        <div class="admin-manage-panel__head">
          <div>
            <div class="admin-manage-panel__eyebrow">COURSE LIST</div>
            <h3>课程列表</h3>
          </div>
          <div class="admin-manage-panel__meta">共 {{ pagination.total }} 门课程 · 教师 {{ stats.teacherCount }} 人 · 资料 {{ stats.materialCount }} 份 · 视频 {{ stats.videoCount }} 个</div>
        </div>

        <div v-if="loading" class="course-detail-empty course-detail-empty--compact">课程列表加载中...</div>

        <div v-else-if="courseList.length" class="admin-course-crud-list">
          <article v-for="item in courseList" :key="item.id" class="admin-course-crud-item">
            <div class="admin-course-crud-item__main">
              <div class="admin-course-crud-item__head">
                <strong>{{ item.name }}</strong>
                <span>最近更新 {{ item.updateDate }}</span>
              </div>
              <p>{{ item.summary || '暂无课程简介' }}</p>
              <div class="admin-course-crud-item__meta">
                <span>学院：{{ item.collegeName }}</span>
                <span>负责人：{{ item.teacherName }}</span>
                <span>资料 {{ item.materialCount }}</span>
                <span>视频 {{ item.videoCount }}</span>
              </div>
            </div>

            <div class="admin-course-crud-item__actions">
              <button type="button" class="course-chip course-chip--soft" @click="openEditEditor(item)">修改</button>
              <button type="button" class="course-chip admin-manage-delete-btn" :disabled="deletingId === item.id" @click="removeCourse(item)">
                {{ deletingId === item.id ? '删除中...' : '删除' }}
              </button>
            </div>
          </article>
        </div>

        <div v-else class="course-detail-empty">当前没有符合条件的课程记录。</div>

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
          <div class="admin-manage-panel__eyebrow">COURSE EDITOR</div>
          <h3>{{ editorTitle }}</h3>
        </div>
        <button type="button" class="course-chip course-chip--soft" @click="closeEditor">关闭</button>
      </div>

      <form class="admin-course-editor__form" @submit.prevent="submitEditor">
        <label class="admin-manage-field">
          <span>课程名称</span>
          <input v-model.trim="editorForm.name" type="text" maxlength="100" placeholder="请输入课程名称" />
        </label>

        <div class="admin-course-editor__grid">
          <label class="admin-manage-field">
            <span>所属学院</span>
            <select v-model="editorForm.collegeId">
              <option value="">请选择学院</option>
              <option v-for="college in collegeOptions" :key="college.id" :value="String(college.id)">
                {{ college.name }}
              </option>
            </select>
          </label>

          <label class="admin-manage-field">
            <span>课程负责人</span>
            <select v-model="editorForm.teacherId">
              <option value="">请选择教师</option>
              <option v-for="teacher in filteredTeacherOptions" :key="teacher.id" :value="String(teacher.id)">
                {{ teacher.name }}
              </option>
            </select>
          </label>
        </div>

        <label class="admin-manage-field admin-manage-field--full">
          <span>课程简介</span>
          <textarea v-model.trim="editorForm.summary" maxlength="2000" placeholder="请输入课程简介，可为空"></textarea>
        </label>

        <div class="admin-course-editor__footer">
          <p>教师列表默认按学院收敛，保持表单更简洁。</p>
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
  createAdminCourse,
  deleteAdminCourse,
  getAdminCourseList,
  updateAdminCourse,
  type AdminCollegeOption,
  type AdminCourseItem,
  type AdminCourseStats,
  type AdminCourseTeacherOption,
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

const collegeOptions = ref<AdminCollegeOption[]>([])
const teacherOptions = ref<AdminCourseTeacherOption[]>([])
const courseList = ref<AdminCourseItem[]>([])

const form = reactive({
  keyword: '',
})

const editorForm = reactive({
  name: '',
  collegeId: '',
  teacherId: '',
  summary: '',
})

const stats = reactive<AdminCourseStats>({
  total: 0,
  teacherCount: 0,
  materialCount: 0,
  videoCount: 0,
})

const pagination = reactive({
  page: 1,
  pageSize: 6,
  total: 0,
  totalPages: 0,
})

const headerText = computed(() => {
  const name = authStore.profile?.name || authStore.profile?.username || '管理员'
  return `${name}，这里统一维护课程基础信息，只保留搜索、增删改查核心操作。`
})

const reminderTexts = computed(() => {
  return [
    stats.total > 0 ? `当前共有 ${stats.total} 门有效课程。` : '当前还没有可管理的课程数据。',
    stats.teacherCount > 0 ? `已有 ${stats.teacherCount} 位教师关联课程。` : '当前课程尚未关联教师负责人。',
  ]
})

const pageNumbers = computed(() => {
  const totalPages = Math.max(pagination.totalPages, 1)
  const start = Math.max(1, Math.min(pagination.page - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

const filteredTeacherOptions = computed(() => {
  if (!editorForm.collegeId) {
    return teacherOptions.value
  }

  const collegeId = Number(editorForm.collegeId)
  return teacherOptions.value.filter((item) => item.collegeId === collegeId)
})

const editorTitle = computed(() => (editingId.value ? '修改课程' : '新增课程'))
const editorActionText = computed(() => (editingId.value ? '保存修改' : '确认新增'))

watch(
  () => editorForm.collegeId,
  () => {
    if (!editorForm.teacherId) {
      return
    }

    const teacherId = Number(editorForm.teacherId)
    const exists = filteredTeacherOptions.value.some((item) => item.id === teacherId)
    if (!exists) {
      editorForm.teacherId = ''
    }
  },
)

function normalizePage(value: unknown) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function clearFeedback() {
  errorMessage.value = ''
  successMessage.value = ''
}

function clearError() {
  errorMessage.value = ''
}

function syncFormWithRoute() {
  form.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
}

function updateRoute(page = 1) {
  router.push({
    path: '/admin/courses',
    query: {
      page: String(page),
      ...(form.keyword ? { keyword: form.keyword } : {}),
    },
  })
}

function resetEditorForm() {
  editingId.value = null
  editorForm.name = ''
  editorForm.collegeId = ''
  editorForm.teacherId = ''
  editorForm.summary = ''
}

function openCreateEditor() {
  clearFeedback()
  resetEditorForm()
  editorVisible.value = true
}

function openEditEditor(item: AdminCourseItem) {
  clearFeedback()
  editingId.value = item.id
  editorForm.name = item.name
  editorForm.collegeId = item.collegeId ? String(item.collegeId) : ''
  editorForm.teacherId = item.teacherId ? String(item.teacherId) : ''
  editorForm.summary = item.summary === '暂无课程简介' ? '' : item.summary
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
    errorMessage.value = '课程名称不能为空'
    return
  }

  if (!editorForm.collegeId) {
    errorMessage.value = '请选择所属学院'
    return
  }

  if (!editorForm.teacherId) {
    errorMessage.value = '请选择课程负责人'
    return
  }

  saving.value = true

  try {
    const payload = {
      name: editorForm.name,
      summary: editorForm.summary,
      collegeId: editorForm.collegeId,
      teacherId: editorForm.teacherId,
    }

    if (editingId.value) {
      const result = await updateAdminCourse(editingId.value, payload)
      collegeOptions.value = result.formOptions.colleges
      teacherOptions.value = result.formOptions.teachers
      successMessage.value = `课程《${result.name}》已更新。`
      closeEditor()
      await loadCourses()
    } else {
      const result = await createAdminCourse(payload)
      collegeOptions.value = result.formOptions.colleges
      teacherOptions.value = result.formOptions.teachers
      successMessage.value = `课程《${result.name}》已创建。`
      closeEditor()

      if (pagination.page !== 1) {
        updateRoute(1)
      } else {
        await loadCourses()
      }
    }
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '课程保存失败'
  } finally {
    saving.value = false
  }
}

async function removeCourse(item: AdminCourseItem) {
  clearFeedback()

  if (!window.confirm(`确认删除课程《${item.name}》吗？`)) {
    return
  }

  deletingId.value = item.id

  try {
    await deleteAdminCourse(item.id)
    successMessage.value = `课程《${item.name}》已删除。`

    if (courseList.value.length === 1 && pagination.page > 1) {
      updateRoute(pagination.page - 1)
    } else {
      await loadCourses()
    }
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '课程删除失败'
  } finally {
    deletingId.value = null
  }
}

async function loadCourses() {
  loading.value = true
  clearError()
  syncFormWithRoute()

  try {
    const data = await getAdminCourseList({
      page: normalizePage(route.query.page),
      pageSize: 6,
      keyword: form.keyword,
    })

    courseList.value = data.list
    collegeOptions.value = data.formOptions.colleges
    teacherOptions.value = data.formOptions.teachers
    stats.total = data.stats.total
    stats.teacherCount = data.stats.teacherCount
    stats.materialCount = data.stats.materialCount
    stats.videoCount = data.stats.videoCount
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
  } catch (error: any) {
    courseList.value = []
    collegeOptions.value = []
    teacherOptions.value = []
    stats.total = 0
    stats.teacherCount = 0
    stats.materialCount = 0
    stats.videoCount = 0
    pagination.page = 1
    pagination.pageSize = 6
    pagination.total = 0
    pagination.totalPages = 0
    errorMessage.value = error?.response?.data?.message || '课程管理列表加载失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.fullPath,
  () => {
    loadCourses()
  },
  { immediate: true },
)
</script>
