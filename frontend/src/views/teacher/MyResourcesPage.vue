<template>
  <main class="teacher-dashboard-page">
    <aside class="teacher-dashboard-sidebar">
      <div>
        <div class="teacher-dashboard-sidebar__eyebrow">TEACHER WORKSPACE</div>
        <h1>教师中心</h1>
      </div>

      <nav class="teacher-dashboard-nav">
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/teacher')">工作台首页</button>
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/teacher/materials')">资料上传</button>
        <button type="button" class="teacher-dashboard-nav__item is-active">我的资源</button>
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/teacher/profile')">个人资料</button>
      </nav>
    </aside>

    <section class="teacher-dashboard-main my-resources-main">
      <header class="my-resources-head">
        <div>
          <div class="my-resources-head__eyebrow">MY RESOURCES</div>
          <h2>我的资源管理</h2>
          <p>{{ headerText }}</p>
        </div>

        <div class="my-resources-head__actions">
          <button type="button" class="auth-btn" @click="router.push('/teacher/materials')">上传资源</button>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success my-resources-feedback">{{ successMessage }}</p>

      <section class="my-resources-filter-panel">
        <div class="my-resources-filter-panel__head">
          <div>
            <div class="my-resources-filter-panel__eyebrow">RESOURCE FILTER</div>
            <h3>检索资源</h3>
          </div>
        </div>

        <form class="my-resources-filter-form" @submit.prevent="applySearch">
          <label class="my-resources-field">
            <span>资源名称</span>
            <input v-model.trim="form.keyword" type="text" maxlength="200" placeholder="搜索资源名称" />
          </label>

          <label class="my-resources-field">
            <span>所属课程</span>
            <select v-model="form.courseId">
              <option value="">全部课程</option>
              <option v-for="course in courseOptions" :key="course.id" :value="String(course.id)">
                {{ course.name }}
              </option>
            </select>
          </label>

          <label class="my-resources-field">
            <span>资源类型</span>
            <select v-model="form.type">
              <option value="all">全部资源</option>
              <option value="material">资料</option>
              <option value="video">视频</option>
            </select>
          </label>

          <div class="my-resources-filter-actions">
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="loading" @click="resetFilters">重置</button>
            <button type="submit" class="auth-btn" :disabled="loading">{{ loading ? '加载中...' : '搜索资源' }}</button>
          </div>
        </form>
      </section>

      <section class="my-resources-stats">
        <article class="my-resources-stat-card">
          <span>资源总数</span>
          <strong>{{ stats.total }}</strong>
          <em>全部有效资源</em>
        </article>
        <article class="my-resources-stat-card">
          <span>资料数量</span>
          <strong>{{ stats.materialCount }}</strong>
          <em>文档资源累计</em>
        </article>
        <article class="my-resources-stat-card">
          <span>视频数量</span>
          <strong>{{ stats.videoCount }}</strong>
          <em>教学视频累计</em>
        </article>
        <article class="my-resources-stat-card is-highlight">
          <span>累计互动</span>
          <strong>{{ stats.interactionCount }}</strong>
          <em>下载 + 播放次数</em>
        </article>
      </section>

      <section class="my-resources-panel">
        <div class="my-resources-panel__head">
          <div>
            <div class="my-resources-panel__eyebrow">RESOURCE LIST</div>
            <h3>资源列表</h3>
          </div>
          <div class="my-resources-panel__meta">共 {{ pagination.total }} 条资源记录</div>
        </div>

        <div v-if="editingItem" class="my-resources-editor">
          <div class="my-resources-editor__head">
            <div>
              <div class="my-resources-panel__eyebrow">EDIT RESOURCE</div>
              <h4>编辑{{ editingItem.type === 'video' ? '视频' : '资料' }}</h4>
            </div>
            <button type="button" class="course-chip course-chip--soft" :disabled="saving" @click="cancelEdit">取消</button>
          </div>

          <form class="my-resources-editor__form" @submit.prevent="submitEdit">
            <label class="my-resources-field">
              <span>{{ editingItem.type === 'video' ? '视频标题' : '资料名称' }}</span>
              <input v-model.trim="editForm.title" type="text" maxlength="200" />
            </label>

            <label class="my-resources-field">
              <span>所属课程</span>
              <select v-model="editForm.courseId">
                <option value="">请选择所属课程</option>
                <option v-for="course in courseOptions" :key="course.id" :value="String(course.id)">
                  {{ course.name }}
                </option>
              </select>
            </label>

            <label class="my-resources-field my-resources-field--full">
              <span>资源描述</span>
              <textarea v-model.trim="editForm.description" maxlength="2000" rows="4" placeholder="补充资源用途、章节范围或更新说明"></textarea>
            </label>

            <div class="my-resources-filter-actions">
              <button type="submit" class="auth-btn" :disabled="saving">{{ saving ? '保存中...' : '保存修改' }}</button>
              <button type="button" class="auth-btn auth-btn--secondary" :disabled="saving" @click="cancelEdit">取消编辑</button>
            </div>
          </form>
        </div>

        <div v-if="resourceList.length" class="my-resources-table">
          <div class="my-resources-table__head">
            <span>资源名称</span>
            <span>类型</span>
            <span>所属课程</span>
            <span>上传时间</span>
            <span>次数</span>
            <span>操作</span>
          </div>

          <article v-for="item in resourceList" :key="`${item.type}-${item.id}`" class="my-resources-row">
            <div class="my-resources-row__title">
              <strong>{{ item.title }}</strong>
              <p>{{ item.description || `${item.fileName} · ${formatFileSize(item.fileSize)}` }}</p>
            </div>
            <div>
              <span :class="['teacher-dashboard-tag', item.type === 'video' ? 'is-video' : 'is-material']">
                {{ item.type === 'video' ? '视频' : '资料' }}
              </span>
            </div>
            <div class="my-resources-row__cell">{{ item.courseName }}</div>
            <div class="my-resources-row__cell">{{ item.uploadTime }}</div>
            <div class="my-resources-row__cell">{{ item.interactionCount }}</div>
            <div class="my-resources-row__actions">
              <button type="button" class="course-chip course-chip--soft" @click="viewResource(item)">查看</button>
              <button type="button" class="course-chip" :disabled="saving" @click="startEdit(item)">编辑</button>
              <button type="button" class="course-chip my-resources-delete-btn" :disabled="deletingId === `${item.type}-${item.id}`" @click="removeItem(item)">
                {{ deletingId === `${item.type}-${item.id}` ? '删除中...' : '删除' }}
              </button>
            </div>
          </article>
        </div>
        <div v-else-if="!loading" class="course-detail-empty">当前没有符合条件的资源记录，可先上传资料或视频。</div>

        <section class="course-pagination my-resources-pagination">
          <div class="course-pagination__desc">共 {{ pagination.total }} 条资源记录 · 支持分页浏览</div>
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
  deleteTeacherResource,
  getTeacherResourceDetail,
  getTeacherResources,
  updateTeacherResource,
  type TeacherCourseOption,
  type TeacherOwnedResourceItem,
  type TeacherResourceStats,
} from '@/services/teacher'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const deletingId = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const courseOptions = ref<TeacherCourseOption[]>([])
const resourceList = ref<TeacherOwnedResourceItem[]>([])
const editingItem = ref<TeacherOwnedResourceItem | null>(null)
const form = reactive({
  keyword: '',
  courseId: '',
  type: 'all' as 'all' | 'material' | 'video',
})
const editForm = reactive({
  title: '',
  courseId: '',
  description: '',
})
const stats = reactive<TeacherResourceStats>({
  total: 0,
  materialCount: 0,
  videoCount: 0,
  interactionCount: 0,
})
const pagination = reactive({
  page: 1,
  pageSize: 6,
  total: 0,
  totalPages: 0,
})

const headerText = computed(() => {
  const name = authStore.profile?.name || authStore.profile?.username || '教师用户'
  return `${name}，这里统一查看本人上传的资料与视频，并继续维护资源内容。`
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

function buildApiUrl(path: string) {
  if (!path) {
    return '#'
  }

  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}${path}`
}

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function syncFormWithRoute() {
  form.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  form.courseId = typeof route.query.courseId === 'string' ? route.query.courseId : ''
  form.type = route.query.type === 'material' || route.query.type === 'video' ? route.query.type : 'all'
}

function updateRoute(page = 1) {
  router.push({
    path: '/teacher/resources',
    query: {
      page: String(page),
      ...(form.keyword ? { keyword: form.keyword } : {}),
      ...(form.courseId ? { courseId: form.courseId } : {}),
      ...(form.type !== 'all' ? { type: form.type } : {}),
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
  form.type = 'all'
  updateRoute(1)
}

function changePage(page: number) {
  editingItem.value = null
  updateRoute(page)
}

function cancelEdit() {
  editingItem.value = null
  editForm.title = ''
  editForm.courseId = ''
  editForm.description = ''
}

function viewResource(item: TeacherOwnedResourceItem) {
  window.open(buildApiUrl(item.previewUrl), '_blank', 'noopener,noreferrer')
}

async function startEdit(item: TeacherOwnedResourceItem) {
  clearMessages()

  try {
    const detail = await getTeacherResourceDetail(item.type, item.id)
    editingItem.value = detail
    editForm.title = detail.title
    editForm.courseId = String(detail.courseId)
    editForm.description = detail.description
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '资源详情加载失败'
  }
}

async function submitEdit() {
  clearMessages()

  if (!editingItem.value) {
    return
  }

  if (!editForm.title) {
    errorMessage.value = editingItem.value.type === 'video' ? '请输入视频标题' : '请输入资料名称'
    return
  }

  if (!editForm.courseId) {
    errorMessage.value = '请选择所属课程'
    return
  }

  saving.value = true

  try {
    const result = await updateTeacherResource(editingItem.value.type, editingItem.value.id, {
      title: editForm.title,
      courseId: editForm.courseId,
      description: editForm.description,
    })
    successMessage.value = `资源《${result.title}》更新成功。`
    cancelEdit()
    await loadResources()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '资源更新失败'
  } finally {
    saving.value = false
  }
}

async function removeItem(item: TeacherOwnedResourceItem) {
  clearMessages()

  if (!window.confirm(`确认删除资源《${item.title}》吗？`)) {
    return
  }

  deletingId.value = `${item.type}-${item.id}`

  try {
    await deleteTeacherResource(item.type, item.id)
    successMessage.value = `资源《${item.title}》已删除。`
    if (editingItem.value?.id === item.id && editingItem.value.type === item.type) {
      cancelEdit()
    }
    await loadResources()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '资源删除失败'
  } finally {
    deletingId.value = ''
  }
}

async function loadResources() {
  loading.value = true
  clearMessages()
  syncFormWithRoute()

  try {
    const data = await getTeacherResources({
      page: normalizePage(route.query.page),
      pageSize: 6,
      keyword: form.keyword,
      courseId: form.courseId,
      type: form.type,
    })

    resourceList.value = data.list
    courseOptions.value = data.filters.courses
    stats.total = data.stats.total
    stats.materialCount = data.stats.materialCount
    stats.videoCount = data.stats.videoCount
    stats.interactionCount = data.stats.interactionCount
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
  } catch (error: any) {
    resourceList.value = []
    courseOptions.value = []
    stats.total = 0
    stats.materialCount = 0
    stats.videoCount = 0
    stats.interactionCount = 0
    pagination.page = 1
    pagination.pageSize = 6
    pagination.total = 0
    pagination.totalPages = 0
    errorMessage.value = error?.response?.data?.message || '我的资源加载失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.fullPath,
  () => {
    loadResources()
  },
  { immediate: true },
)
</script>
