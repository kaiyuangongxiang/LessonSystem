<template>
  <main class="teacher-dashboard-page courseware-page">
    <aside class="teacher-dashboard-sidebar">
      <div>
        <div class="teacher-dashboard-sidebar__eyebrow">TEACHER WORKSPACE</div>
        <h1>教师中心</h1>
      </div>

      <TeacherSidebarNav active="coursewares" />
    </aside>

    <section class="teacher-dashboard-main courseware-manage-main">
      <header class="my-resources-head">
        <div>
          <div class="my-resources-head__eyebrow">ONLINE COURSEWARE</div>
          <h2>在线课件管理</h2>
          <p>{{ headerText }}</p>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success my-resources-feedback">{{ successMessage }}</p>

      <section class="my-resources-stats">
        <article class="my-resources-stat-card">
          <span>课件总数</span>
          <strong>{{ stats.total }}</strong>
          <em>当前教师名下全部在线课件</em>
        </article>
        <article class="my-resources-stat-card">
          <span>草稿课件</span>
          <strong>{{ stats.draftCount }}</strong>
          <em>还可继续编辑完善的课件</em>
        </article>
        <article class="my-resources-stat-card">
          <span>已发布课件</span>
          <strong>{{ stats.publishedCount }}</strong>
          <em>已整理完成并可用于展示的课件</em>
        </article>
        <article class="my-resources-stat-card is-highlight">
          <span>关联课程</span>
          <strong>{{ stats.courseCount }}</strong>
          <em>当前课件已覆盖的课程范围</em>
        </article>
      </section>

      <section class="courseware-create-panel my-resources-panel">
        <div class="my-resources-panel__head">
          <div>
            <div class="my-resources-panel__eyebrow">NEW COURSEWARE</div>
            <h3>新建在线课件</h3>
          </div>
          <div class="my-resources-panel__meta">创建后将直接进入编辑器继续完善页面内容</div>
        </div>

        <form class="courseware-create-form" @submit.prevent="submitCourseware">
          <label class="my-resources-field">
            <span>课件标题</span>
            <input v-model.trim="editorForm.title" type="text" maxlength="200" placeholder="请输入课件标题" />
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
            <span>关联备课单</span>
            <select v-model="editorForm.prepId">
              <option value="">请选择关联备课单</option>
              <option v-for="prep in availablePrepOptions" :key="prep.id" :value="String(prep.id)">
                {{ prep.title }}
              </option>
            </select>
          </label>

          <label class="my-resources-field">
            <span>初始模板</span>
            <select v-model="editorForm.initialTemplate">
              <option v-for="template in COURSEWARE_TEMPLATE_OPTIONS" :key="template.value" :value="template.value">
                {{ template.label }}
              </option>
            </select>
          </label>

          <label class="my-resources-field my-resources-field--full">
            <span>课件摘要</span>
            <textarea
              v-model.trim="editorForm.summary"
              rows="3"
              maxlength="2000"
              placeholder="补充这份课件的用途、章节范围或课堂说明"
            ></textarea>
          </label>

          <div class="prep-manage-form__hint courseware-create-form__hint">
            <strong>创建后可继续完善</strong>
            <p>系统会先生成一页默认模板，后续可在编辑器中继续新增页面、插入文本、图片资料、资料和视频引用。</p>
          </div>

          <div class="my-resources-filter-actions">
            <button type="submit" class="auth-btn" :disabled="saving">
              {{ saving ? '创建中...' : '创建课件并进入编辑器' }}
            </button>
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="saving" @click="resetEditor">重置</button>
          </div>
        </form>
      </section>

      <section class="my-resources-filter-panel">
        <div class="my-resources-filter-panel__head">
          <div>
            <div class="my-resources-filter-panel__eyebrow">COURSEWARE FILTER</div>
            <h3>筛选课件</h3>
          </div>
          <div class="my-resources-panel__meta">共 {{ pagination.total }} 份课件</div>
        </div>

        <form class="my-resources-filter-form courseware-filter-form" @submit.prevent="applySearch">
          <label class="my-resources-field">
            <span>关键词</span>
            <input v-model.trim="filters.keyword" type="text" maxlength="200" placeholder="搜索课件标题、摘要、课程或备课单" />
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
            <span>备课单</span>
            <select v-model="filters.prepId">
              <option value="">全部备课单</option>
              <option v-for="prep in filteredPrepOptions" :key="prep.id" :value="String(prep.id)">
                {{ prep.title }}
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
            <button type="submit" class="auth-btn" :disabled="loading">{{ loading ? '加载中...' : '搜索课件' }}</button>
          </div>
        </form>
      </section>

      <section class="my-resources-panel">
        <div class="my-resources-panel__head">
          <div>
            <div class="my-resources-panel__eyebrow">COURSEWARE LIST</div>
            <h3>课件列表</h3>
          </div>
          <div class="my-resources-panel__meta">支持继续编辑、发布和删除</div>
        </div>

        <div v-if="coursewareList.length" class="courseware-list">
          <article v-for="item in coursewareList" :key="item.id" class="courseware-card">
            <div class="courseware-card__cover" :class="{ 'is-empty': !item.coverPreviewUrl }">
              <img v-if="item.coverPreviewUrl" :src="resolveAssetUrl(item.coverPreviewUrl)" :alt="item.title" />
              <div v-else class="courseware-card__cover-empty">{{ item.slideCount }} 页</div>
            </div>

            <div class="courseware-card__main">
              <div class="courseware-card__head">
                <div>
                  <strong>{{ item.title }}</strong>
                  <div class="courseware-card__meta">
                    <span class="teacher-dashboard-tag">{{ item.statusLabel }}</span>
                    <span>{{ item.courseName }}</span>
                    <span>{{ item.prepTitle }}</span>
                  </div>
                </div>
                <span class="courseware-card__time">更新于 {{ item.updateTime }}</span>
              </div>

              <p class="courseware-card__summary">{{ item.summary || '当前还没有填写课件摘要，可进入编辑器补充说明。' }}</p>

              <div class="courseware-card__facts">
                <span>{{ item.slideCount }} 页</span>
                <span>{{ item.blockCount }} 个内容块</span>
                <span v-if="item.publishedTime">发布于 {{ item.publishedTime }}</span>
                <span v-else>尚未发布</span>
              </div>

              <div class="courseware-card__actions">
                <button type="button" class="course-chip" @click="openEditor(item.id)">进入编辑器</button>
                <button
                  type="button"
                  class="course-chip course-chip--soft"
                  :disabled="publishingId === item.id || item.status === 'published'"
                  @click="publishItem(item)"
                >
                  {{ item.status === 'published' ? '已发布' : publishingId === item.id ? '发布中...' : '发布课件' }}
                </button>
                <button type="button" class="course-chip my-resources-delete-btn" :disabled="deletingId === item.id" @click="removeItem(item)">
                  {{ deletingId === item.id ? '删除中...' : '删除' }}
                </button>
              </div>
            </div>
          </article>
        </div>
        <div v-else-if="!loading" class="course-detail-empty">当前还没有课件记录，可以先创建一份在线课件。</div>

        <section class="course-pagination my-resources-pagination">
          <div class="course-pagination__desc">共 {{ pagination.total }} 份课件，当前第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</div>
          <div class="course-pagination__actions">
          <button type="button" class="course-chip course-pagination__nav" :disabled="pagination.page <= 1 || loading" @click="changePage(pagination.page - 1)" aria-label="上一页">‹</button>
          <button type="button" class="course-page-btn is-active" :disabled="loading" aria-current="page">{{ pagination.page }}</button>
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
import TeacherSidebarNav from '@/components/navigation/TeacherSidebarNav.vue'
import {
  createTeacherCourseware,
  deleteTeacherCourseware,
  getTeacherCoursewares,
  publishTeacherCourseware,
  type TeacherCourseOption,
  type TeacherCoursewareCreatePayload,
  type TeacherCoursewareItem,
  type TeacherCoursewareStats,
  type TeacherCoursewareTemplate,
  type TeacherPrepOption,
} from '@/services/teacher'
import { useAuthStore } from '@/stores/auth'
import { COURSEWARE_TEMPLATE_OPTIONS } from '@/utils/courseware'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const publishingId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const coursewareList = ref<TeacherCoursewareItem[]>([])
const courseOptions = ref<TeacherCourseOption[]>([])
const prepOptions = ref<TeacherPrepOption[]>([])

const stats = reactive<TeacherCoursewareStats>({
  total: 0,
  draftCount: 0,
  publishedCount: 0,
  courseCount: 0,
})

const filters = reactive({
  keyword: '',
  courseId: '',
  prepId: '',
  status: 'all' as 'all' | 'draft' | 'published',
})

const editorForm = reactive({
  title: '',
  courseId: '',
  prepId: '',
  summary: '',
  initialTemplate: 'cover' as TeacherCoursewareTemplate,
})

const pagination = reactive({
  page: 1,
  pageSize: 4,
  total: 0,
  totalPages: 0,
})

const headerText = computed(() => {
  const name = authStore.profile?.name || authStore.profile?.username || '教师用户'
  return `${name}，这里可以创建并整理在线课件，先绑定课程与备课单，再进入编辑器继续完成页面设计。`
})

const availablePrepOptions = computed(() => {
  if (!editorForm.courseId) {
    return prepOptions.value
  }

  return prepOptions.value.filter((item) => String(item.courseId) === editorForm.courseId)
})

const filteredPrepOptions = computed(() => {
  if (!filters.courseId) {
    return prepOptions.value
  }

  return prepOptions.value.filter((item) => String(item.courseId) === filters.courseId)
})



function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function syncFiltersWithRoute() {
  filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  filters.courseId = typeof route.query.courseId === 'string' ? route.query.courseId : ''
  filters.prepId = typeof route.query.prepId === 'string' ? route.query.prepId : ''
  filters.status = route.query.status === 'draft' || route.query.status === 'published' ? route.query.status : 'all'
  pagination.page = typeof route.query.page === 'string' && Number(route.query.page) > 0 ? Number(route.query.page) : 1
}

function resolveAssetUrl(url: string) {
  if (!url) {
    return ''
  }

  if (/^https?:\/\//.test(url)) {
    return url
  }

  const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api$/, '')
  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

function resetEditor() {
  editorForm.title = ''
  editorForm.courseId = ''
  editorForm.prepId = ''
  editorForm.summary = ''
  editorForm.initialTemplate = 'cover'
}

function applySearch() {
  clearMessages()
  void router.replace({
    path: '/teacher/coursewares',
    query: {
      ...(filters.keyword ? { keyword: filters.keyword } : {}),
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
      ...(filters.prepId ? { prepId: filters.prepId } : {}),
      ...(filters.status !== 'all' ? { status: filters.status } : {}),
      page: '1',
    },
  })
}

function resetFilters() {
  clearMessages()
  void router.replace({
    path: '/teacher/coursewares',
  })
}

function changePage(page: number) {
  if (page === pagination.page) {
    return
  }

  void router.replace({
    path: '/teacher/coursewares',
    query: {
      ...(filters.keyword ? { keyword: filters.keyword } : {}),
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
      ...(filters.prepId ? { prepId: filters.prepId } : {}),
      ...(filters.status !== 'all' ? { status: filters.status } : {}),
      page: String(page),
    },
  })
}

function openEditor(coursewareId: number) {
  void router.push(`/teacher/coursewares/${coursewareId}/editor`)
}

async function loadCoursewares() {
  loading.value = true
  clearMessages()

  try {
    const data = await getTeacherCoursewares({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      courseId: filters.courseId || undefined,
      prepId: filters.prepId || undefined,
      status: filters.status,
    })

    Object.assign(stats, data.stats)
    coursewareList.value = data.list
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
    courseOptions.value = data.filters.courses
    prepOptions.value = data.filters.preps
  } catch (error: any) {
    coursewareList.value = []
    pagination.total = 0
    pagination.totalPages = 0
    errorMessage.value = error?.response?.data?.message || '课件列表加载失败'
  } finally {
    loading.value = false
  }
}

async function submitCourseware() {
  if (!editorForm.title || !editorForm.courseId || !editorForm.prepId) {
    errorMessage.value = '请先填写课件标题、所属课程和关联备课单'
    return
  }

  saving.value = true
  clearMessages()

  try {
    const payload: TeacherCoursewareCreatePayload = {
      title: editorForm.title,
      courseId: editorForm.courseId,
      prepId: editorForm.prepId,
      summary: editorForm.summary,
      initialTemplate: editorForm.initialTemplate,
    }

    const result = await createTeacherCourseware(payload)
    successMessage.value = '课件创建成功，正在进入编辑器'
    resetEditor()
    await router.push(`/teacher/coursewares/${result.id}/editor`)
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '课件创建失败'
  } finally {
    saving.value = false
  }
}

async function publishItem(item: TeacherCoursewareItem) {
  if (item.status === 'published') {
    return
  }

  publishingId.value = item.id
  clearMessages()

  try {
    await publishTeacherCourseware(item.id)
    successMessage.value = `课件《${item.title}》已发布`
    await loadCoursewares()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '课件发布失败'
  } finally {
    publishingId.value = null
  }
}

async function removeItem(item: TeacherCoursewareItem) {
  clearMessages()

  if (!window.confirm(`确认删除课件《${item.title}》吗？`)) {
    return
  }

  deletingId.value = item.id

  try {
    await deleteTeacherCourseware(item.id)
    successMessage.value = `课件《${item.title}》已删除`
    await loadCoursewares()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '课件删除失败'
  } finally {
    deletingId.value = null
  }
}

watch(
  () => editorForm.courseId,
  () => {
    if (editorForm.prepId && !availablePrepOptions.value.some((item) => String(item.id) === editorForm.prepId)) {
      editorForm.prepId = ''
    }
  },
)

watch(
  () => filters.courseId,
  () => {
    if (filters.prepId && !filteredPrepOptions.value.some((item) => String(item.id) === filters.prepId)) {
      filters.prepId = ''
    }
  },
)

watch(
  () => route.fullPath,
  () => {
    syncFiltersWithRoute()
    void loadCoursewares()
  },
  { immediate: true },
)
</script>
