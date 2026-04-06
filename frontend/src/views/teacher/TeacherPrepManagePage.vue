<template>
  <main class="teacher-dashboard-page prep-page">
    <aside class="teacher-dashboard-sidebar">
      <div>
        <div class="teacher-dashboard-sidebar__eyebrow">TEACHER WORKSPACE</div>
        <h1>教师中心</h1>
      </div>

      <nav class="teacher-dashboard-nav">
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/teacher')">总览首页</button>
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/teacher/materials')">资源上传</button>
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/teacher/assets')">素材库</button>
        <button type="button" class="teacher-dashboard-nav__item is-active">备课单管理</button>
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/teacher/resources')">我的资源</button>
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/teacher/profile')">个人资料</button>
      </nav>
    </aside>

    <section class="teacher-dashboard-main prep-manage-main">
      <header class="my-resources-head">
        <div>
          <div class="my-resources-head__eyebrow">TEACHING PREP</div>
          <h2>教师备课单管理</h2>
          <p>{{ headerText }}</p>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success my-resources-feedback">{{ successMessage }}</p>

      <section class="my-resources-stats">
        <article class="my-resources-stat-card">
          <span>备课单总数</span>
          <strong>{{ stats.total }}</strong>
          <em>当前教师名下全部备课单</em>
        </article>
        <article class="my-resources-stat-card">
          <span>草稿数量</span>
          <strong>{{ stats.draftCount }}</strong>
          <em>可继续补充完善的备课单</em>
        </article>
        <article class="my-resources-stat-card">
          <span>已发布数量</span>
          <strong>{{ stats.publishedCount }}</strong>
          <em>已整理完成的备课单</em>
        </article>
        <article class="my-resources-stat-card is-highlight">
          <span>关联课程</span>
          <strong>{{ stats.courseCount }}</strong>
          <em>已覆盖课程范围</em>
        </article>
      </section>

      <section class="my-resources-filter-panel">
        <div class="my-resources-filter-panel__head">
          <div>
            <div class="my-resources-filter-panel__eyebrow">PREP FILTER</div>
            <h3>筛选备课单</h3>
          </div>
          <div class="my-resources-panel__meta">共 {{ pagination.total }} 条备课单</div>
        </div>

        <form class="my-resources-filter-form" @submit.prevent="applySearch">
          <label class="my-resources-field">
            <span>关键词</span>
            <input v-model.trim="filters.keyword" type="text" maxlength="200" placeholder="搜索标题、教学内容或课程名" />
          </label>

          <label class="my-resources-field">
            <span>所属课程</span>
            <select v-model="filters.courseId">
              <option value="">全部课程</option>
              <option v-for="course in courseOptions" :key="course.id" :value="String(course.id)">
                {{ course.name }}
              </option>
            </select>
          </label>

          <label class="my-resources-field">
            <span>状态</span>
            <select v-model="filters.status">
              <option value="all">全部状态</option>
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
            </select>
          </label>

          <div class="my-resources-filter-actions">
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="loading" @click="resetFilters">重置</button>
            <button type="submit" class="auth-btn" :disabled="loading">{{ loading ? '加载中...' : '搜索备课单' }}</button>
          </div>
        </form>
      </section>

      <section class="prep-manage-editor my-resources-panel">
        <div class="my-resources-panel__head">
          <div>
            <div class="my-resources-panel__eyebrow">PREP EDITOR</div>
            <h3>{{ editingId ? '编辑备课单' : '新建备课单' }}</h3>
          </div>
          <button v-if="editingId" type="button" class="course-chip course-chip--soft" :disabled="saving" @click="resetEditor">取消编辑</button>
        </div>

        <form class="prep-manage-form" @submit.prevent="submitPrep">
          <label class="my-resources-field">
            <span>备课单标题</span>
            <input v-model.trim="editorForm.title" type="text" maxlength="200" placeholder="请输入备课单标题" />
          </label>

          <label class="my-resources-field">
            <span>所属课程</span>
            <select v-model="editorForm.courseId">
              <option value="">请选择所属课程</option>
              <option v-for="course in courseOptions" :key="course.id" :value="String(course.id)">
                {{ course.name }}
              </option>
            </select>
          </label>

          <label class="my-resources-field">
            <span>状态</span>
            <select v-model="editorForm.status">
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
            </select>
          </label>

          <div class="prep-manage-form__hint">
            <strong>填写建议</strong>
            <p>先完成标题、课程和状态，其他字段可以边备课边持续补充。</p>
          </div>

          <label class="my-resources-field my-resources-field--full">
            <span>教学目标</span>
            <textarea v-model.trim="editorForm.teachingObjective" rows="3" maxlength="5000" placeholder="本节课希望达成的核心目标"></textarea>
          </label>

          <label class="my-resources-field my-resources-field--full">
            <span>教学重点</span>
            <textarea v-model.trim="editorForm.keyPoints" rows="3" maxlength="5000" placeholder="需要重点讲解和强调的内容"></textarea>
          </label>

          <label class="my-resources-field my-resources-field--full">
            <span>教学难点</span>
            <textarea v-model.trim="editorForm.difficultyPoints" rows="3" maxlength="5000" placeholder="学生理解或教师组织上的难点"></textarea>
          </label>

          <label class="my-resources-field my-resources-field--full">
            <span>学情分析</span>
            <textarea v-model.trim="editorForm.studentAnalysis" rows="3" maxlength="5000" placeholder="结合学生基础、学习习惯和课程实际情况进行说明"></textarea>
          </label>

          <label class="my-resources-field my-resources-field--full">
            <span>教学内容</span>
            <textarea v-model.trim="editorForm.teachingContent" rows="4" maxlength="5000" placeholder="概括本次课程的主要内容安排"></textarea>
          </label>

          <label class="my-resources-field my-resources-field--full">
            <span>教学过程</span>
            <textarea v-model.trim="editorForm.teachingProcess" rows="5" maxlength="5000" placeholder="按环节整理导入、讲授、互动、练习与总结过程"></textarea>
          </label>

          <label class="my-resources-field my-resources-field--full">
            <span>教学反思</span>
            <textarea v-model.trim="editorForm.reflectionNotes" rows="3" maxlength="5000" placeholder="记录课后总结、改进建议或补充备注"></textarea>
          </label>

          <div class="my-resources-filter-actions">
            <button type="submit" class="auth-btn" :disabled="saving">
              {{ saving ? '提交中...' : editingId ? '保存备课单' : '创建备课单' }}
            </button>
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="saving" @click="resetEditor">重置</button>
          </div>
        </form>
      </section>

      <section class="my-resources-panel">
        <div class="my-resources-panel__head">
          <div>
            <div class="my-resources-panel__eyebrow">PREP LIST</div>
            <h3>备课单列表</h3>
          </div>
          <div class="my-resources-panel__meta">支持继续编辑、切换发布状态和删除</div>
        </div>

        <div v-if="prepList.length" class="prep-manage-list">
          <article v-for="item in prepList" :key="item.id" class="prep-manage-item">
            <div class="prep-manage-item__header">
              <div>
                <strong>{{ item.title }}</strong>
                <div class="prep-manage-item__meta">
                  <span class="teacher-dashboard-tag">{{ item.statusLabel }}</span>
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
                <span>教学重点 / 难点</span>
                <p>{{ buildFocusText(item) }}</p>
              </article>
              <article class="prep-manage-item__section">
                <span>教学过程</span>
                <p>{{ renderExcerpt(item.teachingProcess) }}</p>
              </article>
            </div>

            <div class="prep-manage-item__actions">
              <button type="button" class="course-chip" @click="startEdit(item)">编辑</button>
              <button type="button" class="course-chip course-chip--soft" @click="fillPublishState(item, item.status === 'published' ? 'draft' : 'published')">
                {{ item.status === 'published' ? '转为草稿' : '直接发布' }}
              </button>
              <button type="button" class="course-chip my-resources-delete-btn" :disabled="deletingId === item.id" @click="removePrep(item)">
                {{ deletingId === item.id ? '删除中...' : '删除' }}
              </button>
            </div>
          </article>
        </div>
        <div v-else-if="!loading" class="course-detail-empty">当前还没有备课单记录，可以先创建一条。</div>

        <section class="course-pagination my-resources-pagination">
          <div class="course-pagination__desc">共 {{ pagination.total }} 条备课单记录，当前第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</div>
          <div class="course-pagination__actions">
            <button type="button" class="course-chip" :disabled="pagination.page <= 1 || loading" @click="changePage(pagination.page - 1)">上一页</button>
            <button
              v-for="pageNumber in pageNumbers"
              :key="pageNumber"
              type="button"
              :class="['course-page-btn', pageNumber === pagination.page ? 'is-active' : '']"
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
  createTeacherPrep,
  deleteTeacherPrep,
  getTeacherPreps,
  updateTeacherPrep,
  type TeacherCourseOption,
  type TeacherPrepItem,
  type TeacherPrepStats,
} from '@/services/teacher'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const editingId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const courseOptions = ref<TeacherCourseOption[]>([])
const prepList = ref<TeacherPrepItem[]>([])

const stats = reactive<TeacherPrepStats>({
  total: 0,
  draftCount: 0,
  publishedCount: 0,
  courseCount: 0,
})

const filters = reactive({
  keyword: '',
  courseId: '',
  status: 'all' as 'all' | 'draft' | 'published',
})

const editorForm = reactive({
  courseId: '',
  title: '',
  status: 'draft' as 'draft' | 'published',
  teachingObjective: '',
  keyPoints: '',
  difficultyPoints: '',
  studentAnalysis: '',
  teachingContent: '',
  teachingProcess: '',
  reflectionNotes: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 6,
  total: 0,
  totalPages: 0,
})

const headerText = computed(() => {
  const name = authStore.profile?.name || authStore.profile?.username || '教师用户'
  return `${name}，这里可以按课程维护完整备课单，先保存草稿，整理完成后再发布。`
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

  return text.length > 90 ? `${text.slice(0, 90)}...` : text
}

function buildFocusText(item: TeacherPrepItem) {
  const keyText = item.keyPoints?.trim() ? `重点：${renderExcerpt(item.keyPoints, '')}` : ''
  const difficultyText = item.difficultyPoints?.trim() ? `难点：${renderExcerpt(item.difficultyPoints, '')}` : ''
  return [keyText, difficultyText].filter(Boolean).join('；') || '暂未填写教学重点与难点'
}

function buildSummary(item: TeacherPrepItem) {
  const parts = [
    item.studentAnalysis?.trim() ? `学情：${renderExcerpt(item.studentAnalysis, '')}` : '',
    item.teachingContent?.trim() ? `内容：${renderExcerpt(item.teachingContent, '')}` : '',
    item.reflectionNotes?.trim() ? `反思：${renderExcerpt(item.reflectionNotes, '')}` : '',
  ].filter(Boolean)

  return parts.join(' ｜ ') || '这份备课单还没有填写详细摘要。'
}

function syncFiltersWithRoute() {
  filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  filters.courseId = typeof route.query.courseId === 'string' ? route.query.courseId : ''
  filters.status = route.query.status === 'draft' || route.query.status === 'published' ? route.query.status : 'all'
}

function updateRoute(page = 1) {
  router.push({
    path: '/teacher/preps',
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

function resetEditor() {
  editingId.value = null
  editorForm.courseId = ''
  editorForm.title = ''
  editorForm.status = 'draft'
  editorForm.teachingObjective = ''
  editorForm.keyPoints = ''
  editorForm.difficultyPoints = ''
  editorForm.studentAnalysis = ''
  editorForm.teachingContent = ''
  editorForm.teachingProcess = ''
  editorForm.reflectionNotes = ''
}

function startEdit(item: TeacherPrepItem) {
  clearMessages()
  editingId.value = item.id
  editorForm.courseId = String(item.courseId)
  editorForm.title = item.title
  editorForm.status = item.status === 'published' ? 'published' : 'draft'
  editorForm.teachingObjective = item.teachingObjective
  editorForm.keyPoints = item.keyPoints
  editorForm.difficultyPoints = item.difficultyPoints
  editorForm.studentAnalysis = item.studentAnalysis
  editorForm.teachingContent = item.teachingContent
  editorForm.teachingProcess = item.teachingProcess
  editorForm.reflectionNotes = item.reflectionNotes
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function fillPublishState(item: TeacherPrepItem, status: 'draft' | 'published') {
  clearMessages()

  try {
    const result = await updateTeacherPrep(item.id, {
      courseId: String(item.courseId),
      title: item.title,
      status,
      teachingObjective: item.teachingObjective,
      keyPoints: item.keyPoints,
      difficultyPoints: item.difficultyPoints,
      studentAnalysis: item.studentAnalysis,
      teachingContent: item.teachingContent,
      teachingProcess: item.teachingProcess,
      reflectionNotes: item.reflectionNotes,
    })

    successMessage.value = `备课单“${result.title}”已更新为${result.statusLabel}`
    await loadPreps()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '备课单状态更新失败'
  }
}

async function submitPrep() {
  clearMessages()

  if (!editorForm.title || !editorForm.courseId) {
    errorMessage.value = '请先填写备课单标题并选择所属课程'
    return
  }

  saving.value = true

  try {
    const payload = {
      courseId: editorForm.courseId,
      title: editorForm.title,
      status: editorForm.status,
      teachingObjective: editorForm.teachingObjective,
      keyPoints: editorForm.keyPoints,
      difficultyPoints: editorForm.difficultyPoints,
      studentAnalysis: editorForm.studentAnalysis,
      teachingContent: editorForm.teachingContent,
      teachingProcess: editorForm.teachingProcess,
      reflectionNotes: editorForm.reflectionNotes,
    }

    if (editingId.value) {
      const result = await updateTeacherPrep(editingId.value, payload)
      successMessage.value = `备课单“${result.title}”已保存`
    } else {
      const result = await createTeacherPrep(payload)
      successMessage.value = `备课单“${result.title}”已创建`
    }

    resetEditor()
    await loadPreps()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '备课单保存失败'
  } finally {
    saving.value = false
  }
}

async function removePrep(item: TeacherPrepItem) {
  clearMessages()

  if (!window.confirm(`确认删除备课单“${item.title}”吗？`)) {
    return
  }

  deletingId.value = item.id

  try {
    await deleteTeacherPrep(item.id)
    successMessage.value = `备课单“${item.title}”已删除`
    if (editingId.value === item.id) {
      resetEditor()
    }
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
    const data = await getTeacherPreps({
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
    stats.courseCount = data.stats.courseCount
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
    stats.courseCount = 0
    pagination.page = 1
    pagination.pageSize = 6
    pagination.total = 0
    pagination.totalPages = 0
    errorMessage.value = error?.response?.data?.message || '备课单列表加载失败'
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
