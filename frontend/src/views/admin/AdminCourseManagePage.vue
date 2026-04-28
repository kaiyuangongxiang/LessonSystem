<template>
  <main class="admin-manage-page admin-course-simple-page">
    <aside class="admin-dashboard-sidebar">
      <div>
        <div class="admin-dashboard-sidebar__eyebrow">ADMIN CONSOLE</div>
        <h1>管理员中心</h1>
      </div>

      <AdminSidebarNav active="courses" />
      <nav v-if="false" class="admin-dashboard-nav">
        <button type="button" class="admin-dashboard-nav__item admin-dashboard-nav__item--system" @click="router.push('/admin/system')">系统管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin')">总览首页</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/teachers')">教师用户</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/accounts')">账号管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/colleges')">学院管理</button>
        <button type="button" class="admin-dashboard-nav__item is-active">课程管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/assets')">资料库</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/materials')">资料管理</button>
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
          <button type="button" class="auth-btn" @click="openCreateEditor">新增课程</button>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success admin-manage-feedback">{{ successMessage }}</p>

      <section class="admin-manage-stats">
        <article class="admin-manage-stat-card">
          <span>课程总数</span>
          <strong>{{ stats.total }}</strong>
          <em>当前有效课程数量</em>
        </article>
        <article class="admin-manage-stat-card">
          <span>已关联学院</span>
          <strong>{{ stats.collegeAssignedCount }}</strong>
          <em>学院信息已补全的课程</em>
        </article>
        <article class="admin-manage-stat-card">
          <span>简介完整课程</span>
          <strong>{{ stats.summaryReadyCount }}</strong>
          <em>已补充课程简介的课程</em>
        </article>
        <article class="admin-manage-stat-card">
          <span>关联教师数</span>
          <strong>{{ stats.teacherCount }}</strong>
          <em>当前负责课程的教师数</em>
        </article>
        <article class="admin-manage-stat-card">
          <span>课程资料量</span>
          <strong>{{ stats.materialCount }}</strong>
          <em>系统内课程资料总量</em>
        </article>
        <article class="admin-manage-stat-card is-highlight">
          <span>课程视频量</span>
          <strong>{{ stats.videoCount }}</strong>
          <em>系统内课程视频总量</em>
        </article>
      </section>

      <section class="admin-manage-filter-panel admin-course-toolbar">
        <div>
          <div class="admin-manage-panel__eyebrow">SMART FILTER</div>
          <h3>搜索与筛选</h3>
          <p class="admin-manage-panel__meta">课程列表已经对齐数据库里的完整课程结构，可按关键字、学院和排序方式一起收缩结果。</p>
        </div>

        <form class="admin-manage-filter-form admin-manage-filter-form--course" @submit.prevent="applySearch">
          <label class="admin-manage-field">
            <span>关键字</span>
            <input v-model.trim="form.keyword" type="text" maxlength="100" placeholder="搜索课程名称、简介、教师或学院" />
          </label>

          <label class="admin-manage-field">
            <span>学院范围</span>
            <select v-model="form.collegeId">
              <option value="">全部学院</option>
              <option v-for="college in filterCollegeOptions" :key="college.id" :value="String(college.id)">
                {{ college.name }}
              </option>
            </select>
          </label>

          <label class="admin-manage-field">
            <span>排序方式</span>
            <select v-model="form.sort">
              <option value="recent">最近更新</option>
              <option value="video-rich">视频优先</option>
            </select>
          </label>

          <div class="admin-manage-filter-actions">
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="loading" @click="resetFilters">重置</button>
            <button type="submit" class="auth-btn" :disabled="loading">{{ loading ? '加载中...' : '应用筛选' }}</button>
          </div>
        </form>
      </section>

      <section class="admin-manage-panel admin-course-list-panel">
        <div class="admin-manage-panel__head">
          <div>
            <div class="admin-manage-panel__eyebrow">COURSE LIST</div>
            <h3>课程列表</h3>
          </div>
          <div class="admin-manage-panel__meta">
            共 {{ pagination.total }} 门课程 · 当前筛选 {{ currentFilterSummary }}
          </div>
        </div>

        <div v-if="loading" class="course-detail-empty course-detail-empty--compact">课程列表加载中...</div>

        <div v-else-if="courseList.length" class="admin-course-crud-list">
          <article v-for="item in courseList" :key="item.id" class="admin-course-crud-item">
            <div class="admin-course-crud-item__main">
              <div class="admin-course-crud-item__head">
                <strong>{{ item.name }}</strong>
              </div>

              <p>{{ item.summary || '暂无课程简介，建议先补充课程定位和教学范围。' }}</p>

              <div class="admin-course-crud-item__status">
                <span :class="['admin-course-status-badge', item.collegeId ? 'is-success' : 'is-warning']">
                  {{ item.collegeId ? `学院：${item.collegeName}` : '待补学院' }}
                </span>
                <span class="admin-course-status-badge is-neutral">负责人：{{ item.teacherName }}</span>
                <span
                  :class="[
                    'admin-course-status-badge',
                    item.teacherCollegeMatched === false
                      ? 'is-warning'
                      : item.teacherCollegeMatched === true
                        ? 'is-success'
                        : 'is-neutral',
                  ]"
                >
                  {{ teacherCollegeText(item) }}
                </span>
                <span :class="['admin-course-status-badge', item.summary.trim() ? 'is-success' : 'is-warning']">
                  {{ item.summary.trim() ? '简介已填写' : '待补简介' }}
                </span>
              </div>

              <div class="admin-course-crud-item__meta">
                <span>资料 {{ item.materialCount }}</span>
                <span>视频 {{ item.videoCount }}</span>
                <span>最近更新 {{ item.updateDate }}</span>
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
            <button type="button" class="course-chip course-pagination__nav" :disabled="pagination.page <= 1 || loading" @click="changePage(pagination.page - 1)" aria-label="上一页">‹</button>
            <button type="button" class="admin-manage-page-btn is-active" :disabled="loading" aria-current="page">{{ pagination.page }}</button>
            <button type="button" class="course-chip course-pagination__nav" :disabled="pagination.page >= pagination.totalPages || loading" @click="changePage(pagination.page + 1)" aria-label="下一页">›</button>
          </div>
        </section>
      </section>
    </section>
  </main>

  <div v-if="editorVisible" class="admin-course-editor-mask" @click.self="closeEditor">
    <section class="admin-course-editor admin-course-editor--wide">
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
                {{ `${teacher.name} · ${teacher.collegeName}` }}
              </option>
            </select>
          </label>
        </div>

        <p v-if="teacherSelectionHint" class="admin-course-editor__hint">{{ teacherSelectionHint }}</p>

        <label class="admin-manage-field admin-manage-field--full">
          <span>课程简介</span>
          <textarea v-model.trim="editorForm.summary" maxlength="2000" placeholder="概述课程定位、适用对象和资源范围"></textarea>
        </label>

        <div class="admin-course-editor__footer">
          <p>课程管理现在直接对应数据库里的 `course_intro` 基础字段，建议优先补齐学院归属、课程负责人和课程简介。</p>
          <div class="admin-course-editor__actions">
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
import AdminSidebarNav from '@/components/navigation/AdminSidebarNav.vue'
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

const filterCollegeOptions = ref<AdminCollegeOption[]>([])
const collegeOptions = ref<AdminCollegeOption[]>([])
const teacherOptions = ref<AdminCourseTeacherOption[]>([])
const courseList = ref<AdminCourseItem[]>([])

const form = reactive({
  keyword: '',
  collegeId: '',
  sort: 'recent' as 'recent' | 'video-rich',
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
  collegeAssignedCount: 0,
  summaryReadyCount: 0,
})

const pagination = reactive({
  page: 1,
  pageSize: 4,
  total: 0,
  totalPages: 0,
})

const headerText = computed(() => {
  const name = authStore.profile?.name || authStore.profile?.username || '管理员'
  return `${name}，这里用于统一维护课程基础信息和课程归属关系。`
})

const reminderTexts = computed(() => {
  return [
    stats.collegeAssignedCount < stats.total
      ? `当前仍有 ${stats.total - stats.collegeAssignedCount} 门课程未补齐学院归属。`
      : '当前课程都已补齐学院归属。',
    stats.summaryReadyCount < stats.total
      ? `当前仍有 ${stats.total - stats.summaryReadyCount} 门课程缺少课程简介。`
      : '当前课程简介都已补齐。',
  ]
})



const currentFilterSummary = computed(() => {
  const parts = [form.sort === 'video-rich' ? '视频优先' : '最近更新']
  if (form.collegeId) {
    const matched = filterCollegeOptions.value.find((item) => String(item.id) === form.collegeId)
    parts.push(matched?.name || '指定学院')
  } else {
    parts.push('全部学院')
  }

  if (form.keyword) {
    parts.push(`关键字：${form.keyword}`)
  }

  return parts.join(' · ')
})

const filteredTeacherOptions = computed(() => {
  if (!editorForm.collegeId) {
    return teacherOptions.value
  }

  const selectedCollegeId = Number(editorForm.collegeId)
  return [...teacherOptions.value]
    .filter((item) => item.collegeId === selectedCollegeId || item.collegeId === null)
    .sort((left, right) => {
      const leftRank = left.collegeId === selectedCollegeId ? 0 : 1
      const rightRank = right.collegeId === selectedCollegeId ? 0 : 1
      if (leftRank !== rightRank) {
        return leftRank - rightRank
      }

      return left.name.localeCompare(right.name, 'zh-CN')
    })
})

const selectedTeacherOption = computed(() => {
  if (!editorForm.teacherId) {
    return null
  }

  const teacherId = Number(editorForm.teacherId)
  return teacherOptions.value.find((item) => item.id === teacherId) || null
})

const teacherSelectionHint = computed(() => {
  if (!editorForm.collegeId || !selectedTeacherOption.value) {
    return ''
  }

  const selectedCollegeId = Number(editorForm.collegeId)
  if (selectedTeacherOption.value.collegeId === selectedCollegeId) {
    return `当前教师已归属到所选学院：${selectedTeacherOption.value.collegeName}。`
  }

  if (selectedTeacherOption.value.collegeId === null) {
    return `当前教师尚未归属学院，将按课程的学院设置继续保存。`
  }

  return `当前教师归属 ${selectedTeacherOption.value.collegeName}，与课程学院不一致，请确认是否需要先调整教师归属。`
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

function syncFormWithRoute() {
  form.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  form.collegeId = typeof route.query.collegeId === 'string' ? route.query.collegeId : ''
  form.sort = route.query.sort === 'video-rich' ? 'video-rich' : 'recent'
}

function updateRoute(page = 1) {
  router.push({
    path: '/admin/courses',
    query: {
      page: String(page),
      ...(form.keyword ? { keyword: form.keyword } : {}),
      ...(form.collegeId ? { collegeId: form.collegeId } : {}),
      ...(form.sort !== 'recent' ? { sort: form.sort } : {}),
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

function teacherCollegeText(item: AdminCourseItem) {
  if (!item.teacherCollegeName) {
    return '教师归属未知'
  }

  if (item.teacherCollegeMatched === false) {
    return `教师归属：${item.teacherCollegeName}（与课程学院不一致）`
  }

  return `教师归属：${item.teacherCollegeName}`
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
  editorForm.summary = item.summary
  editorVisible.value = true
}

function closeEditor() {
  if (saving.value) {
    return
  }

  forceCloseEditor()
}

function forceCloseEditor() {
  editorVisible.value = false
  resetEditorForm()
}

function applySearch() {
  updateRoute(1)
}

function resetFilters() {
  clearFeedback()
  form.keyword = ''
  form.collegeId = ''
  form.sort = 'recent'
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
      filterCollegeOptions.value = result.formOptions.colleges
      teacherOptions.value = result.formOptions.teachers
      successMessage.value = `课程《${result.name}》已更新。`
      forceCloseEditor()
      await loadCourses()
    } else {
      const result = await createAdminCourse(payload)
      collegeOptions.value = result.formOptions.colleges
      filterCollegeOptions.value = result.formOptions.colleges
      teacherOptions.value = result.formOptions.teachers
      successMessage.value = `课程《${result.name}》已创建。`
      forceCloseEditor()

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
  errorMessage.value = ''
  syncFormWithRoute()

  try {
    const data = await getAdminCourseList({
      page: normalizePage(route.query.page),
      pageSize: 4,
      keyword: form.keyword,
      collegeId: form.collegeId || undefined,
      sort: form.sort,
    })

    courseList.value = data.list
    filterCollegeOptions.value = data.filters.colleges
    collegeOptions.value = data.formOptions.colleges
    teacherOptions.value = data.formOptions.teachers
    stats.total = data.stats.total
    stats.teacherCount = data.stats.teacherCount
    stats.materialCount = data.stats.materialCount
    stats.videoCount = data.stats.videoCount
    stats.collegeAssignedCount = data.stats.collegeAssignedCount
    stats.summaryReadyCount = data.stats.summaryReadyCount
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
  } catch (error: any) {
    courseList.value = []
    filterCollegeOptions.value = []
    collegeOptions.value = []
    teacherOptions.value = []
    stats.total = 0
    stats.teacherCount = 0
    stats.materialCount = 0
    stats.videoCount = 0
    stats.collegeAssignedCount = 0
    stats.summaryReadyCount = 0
    pagination.page = 1
    pagination.pageSize = 4
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
