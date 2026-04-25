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
      <header class="admin-manage-head">
        <div>
          <div class="admin-manage-head__eyebrow">PREP MANAGEMENT</div>
          <h2>备课单管理</h2>
          <p>{{ headerText }}</p>
        </div>
      </header>

      <p v-if="errorMessage && !showEditorDialog" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage && !showEditorDialog" class="feedback-text feedback-text--success admin-manage-feedback">
        {{ successMessage }}
      </p>

      <section class="my-resources-stats">
        <article class="my-resources-stat-card">
          <span>备课单总数</span>
          <strong>{{ stats.total }}</strong>
          <em>当前系统中的全部备课单数量</em>
        </article>
        <article class="my-resources-stat-card">
          <span>草稿数量</span>
          <strong>{{ stats.draftCount }}</strong>
          <em>管理员仅查看，不进行操作</em>
        </article>
        <article class="my-resources-stat-card is-highlight">
          <span>已发布数量</span>
          <strong>{{ stats.publishedCount }}</strong>
          <em>管理员可编辑、删附件与删除</em>
        </article>
        <article class="my-resources-stat-card">
          <span>涉及教师</span>
          <strong>{{ stats.teacherCount }}</strong>
          <em>当前筛选范围涉及的教师覆盖情况</em>
        </article>
      </section>

      <section class="my-resources-filter-panel">
        <div class="my-resources-filter-panel__head">
          <div>
            <div class="my-resources-filter-panel__eyebrow">PREP FILTER</div>
            <h3>筛选备课单</h3>
          </div>
          <div class="my-resources-panel__meta">默认仅展示已发布备课单，管理员可直接搜索、编辑、删附件和删除</div>
        </div>

        <form class="my-resources-filter-form" @submit.prevent="applySearch">
          <label class="my-resources-field">
            <span>关键词</span>
            <input v-model.trim="filters.keyword" type="text" maxlength="200" placeholder="搜索标题、教师名、课程名或教学内容" />
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

          <div class="my-resources-filter-actions">
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="loading" @click="resetFilters">重置</button>
            <button type="submit" class="auth-btn" :disabled="loading">{{ loading ? '加载中...' : '搜索备课单' }}</button>
          </div>
        </form>
      </section>

      <section class="my-resources-panel">
        <div class="my-resources-panel__head">
          <div>
            <div class="my-resources-panel__eyebrow">PREP LIST</div>
            <h3>备课单列表</h3>
          </div>
          <div class="my-resources-panel__meta">共 {{ pagination.total }} 条记录，管理员仅可操作当前处于“已发布”的备课单</div>
        </div>

        <div v-if="prepList.length" class="prep-manage-list">
          <article v-for="item in prepList" :key="item.id" class="prep-manage-item">
            <div class="prep-manage-item__header">
              <div>
                <strong>{{ item.title }}</strong>
                <div class="prep-manage-item__meta">
                  <span class="teacher-dashboard-tag">{{ item.statusLabel }}</span>
                  <span>{{ item.teacherName }}</span>
                  <span>{{ item.courseName }}</span>
                  <span>附件 {{ item.attachmentCount }}</span>
                </div>
              </div>
              <span class="prep-manage-item__time">更新于 {{ item.updateTime }}</span>
            </div>

            <div class="prep-manage-item__summary">
              <p>{{ renderExcerpt(item.teachingContent, '暂无教学内容') }}</p>
            </div>

            <div class="prep-manage-item__actions">
              <button type="button" class="course-chip" :disabled="!canManagePrep(item)" @click="startEdit(item)">
                {{ canManagePrep(item) ? '编辑' : '仅已发布可编辑' }}
              </button>
              <button
                type="button"
                class="course-chip my-resources-delete-btn"
                :disabled="!canManagePrep(item) || deletingPrepId === item.id"
                @click="removePrep(item)"
              >
                {{ deletingPrepId === item.id ? '删除中...' : '删除' }}
              </button>
            </div>
          </article>
        </div>
        <div v-else-if="!loading" class="course-detail-empty">当前没有符合条件的备课单记录。</div>

        <section class="course-pagination my-resources-pagination">
          <div class="course-pagination__desc">当前第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</div>
          <div class="course-pagination__actions">
            <button
              type="button"
              class="course-chip course-pagination__nav"
              :disabled="pagination.page <= 1 || loading"
              @click="changePage(pagination.page - 1)"
              aria-label="上一页"
            >
              ‹
            </button>
            <button type="button" class="course-page-btn is-active" :disabled="loading" aria-current="page">{{ pagination.page }}</button>
            <button
              type="button"
              class="course-chip course-pagination__nav"
              :disabled="pagination.page >= pagination.totalPages || loading"
              @click="changePage(pagination.page + 1)"
              aria-label="下一页"
            >
              ›
            </button>
          </div>
        </section>
      </section>

      <TeacherWorkspaceDialog
        v-model="showEditorDialog"
        eyebrow="ADMIN PREP EDITOR"
        :title="editingId ? '编辑已发布备课单' : '备课单编辑器'"
        :description="'管理员可统一维护已发布备课单的标题、课程、教学内容与附件。'"
        size="wide"
        :disabled="dialogBusy"
        @close="closeEditorDialog"
      >
        <p v-if="errorMessage" class="course-feedback teacher-workspace-dialog__feedback">{{ errorMessage }}</p>
        <p v-if="successMessage" class="feedback-text feedback-text--success my-resources-feedback teacher-workspace-dialog__feedback">
          {{ successMessage }}
        </p>

        <form id="admin-prep-editor-form" class="prep-manage-form" @submit.prevent="submitPrep">
          <label class="my-resources-field">
            <span>备课单标题 <span class="auth-required">*</span></span>
            <input v-model.trim="editorForm.title" type="text" maxlength="200" placeholder="请输入备课单标题" />
          </label>

          <label class="my-resources-field">
            <span>所属课程 <span class="auth-required">*</span></span>
            <select v-model="editorForm.courseId">
              <option value="">请选择所属课程</option>
              <option v-for="course in courseOptions" :key="course.id" :value="String(course.id)">
                {{ course.name }}
              </option>
            </select>
          </label>

          <div class="prep-manage-form__hint">
            <strong>管理员操作限制</strong>
            <p>当前页面仅维护“已发布”备课单，保存后状态保持为“已发布”。</p>
          </div>

          <label class="my-resources-field my-resources-field--full">
            <span>教学内容 <span class="auth-required">*</span></span>
            <textarea
              v-model.trim="editorForm.teachingContent"
              rows="10"
              maxlength="5000"
              placeholder="请输入本次备课的教学内容安排、重点说明和课堂组织内容"
            ></textarea>
          </label>
        </form>

        <section class="my-resources-panel teacher-workspace-dialog__section">
          <div class="my-resources-panel__head">
            <div>
              <div class="my-resources-panel__eyebrow">PREP ATTACHMENTS</div>
              <h3>附件管理</h3>
            </div>
            <div class="my-resources-panel__meta">当前附件 {{ editorAttachments.length }} 个，可直接预览或移除</div>
          </div>

          <div v-if="editorAttachments.length" class="prep-manage-attachment-list">
            <article v-for="attachment in editorAttachments" :key="attachment.id" class="prep-manage-attachment-item">
              <div>
                <strong>{{ attachment.title }}</strong>
                <p>{{ attachment.sourceLabel }} · {{ attachment.type }} · {{ attachment.fileName || '在线预览' }}</p>
              </div>

              <div class="prep-manage-attachment-item__actions">
                <button
                  type="button"
                  class="course-chip course-chip--soft"
                  :disabled="!attachment.previewUrl"
                  @click="previewAttachment(attachment.id)"
                >
                  查看
                </button>
                <button
                  type="button"
                  class="course-chip my-resources-delete-btn"
                  :disabled="deletingAttachmentId === attachment.id"
                  @click="removeAttachment(attachment)"
                >
                  {{ deletingAttachmentId === attachment.id ? '移除中...' : '移除' }}
                </button>
              </div>
            </article>
          </div>
          <div v-else class="course-detail-empty course-detail-empty--compact">当前备课单还没有附件。</div>
        </section>

        <div class="my-resources-filter-actions prep-manage-form__actions">
          <button type="submit" form="admin-prep-editor-form" class="auth-btn" :disabled="dialogBusy">
            {{ saving ? '保存中...' : '保存备课单' }}
          </button>
        </div>
      </TeacherWorkspaceDialog>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminSidebarNav from '@/components/navigation/AdminSidebarNav.vue'
import TeacherWorkspaceDialog from '@/components/TeacherWorkspaceDialog.vue'
import {
  deleteAdminPrep,
  deleteAdminPrepAttachment,
  getAdminPrepList,
  previewAdminPrepAttachment,
  updateAdminPrep,
  type AdminCourseOption,
  type AdminPrepItem,
  type AdminPrepPayload,
  type AdminPrepStats,
} from '@/services/admin'

type AdminPrepAttachmentItem = AdminPrepItem['attachments'][number]

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const saving = ref(false)
const deletingPrepId = ref<number | null>(null)
const deletingAttachmentId = ref<number | null>(null)
const editingId = ref<number | null>(null)
const showEditorDialog = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const courseOptions = ref<AdminCourseOption[]>([])
const prepList = ref<AdminPrepItem[]>([])
const editorAttachments = ref<AdminPrepAttachmentItem[]>([])

const stats = reactive<AdminPrepStats>({
  total: 0,
  draftCount: 0,
  publishedCount: 0,
  teacherCount: 0,
})

const filters = reactive({
  keyword: '',
  courseId: '',
})

const editorForm = reactive({
  courseId: '',
  title: '',
  teachingContent: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 4,
  total: 0,
  totalPages: 0,
})

const headerText = computed(
  () => '页面结构参考教师中心备课单，但管理员只可维护已发布备课单，并且可以跨教师统一编辑、删附件和删除。',
)

const dialogBusy = computed(() => saving.value || deletingAttachmentId.value !== null)

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

function canManagePrep(item: AdminPrepItem) {
  return item.status === 'published'
}

function resetEditor() {
  editingId.value = null
  editorForm.courseId = ''
  editorForm.title = ''
  editorForm.teachingContent = ''
  editorAttachments.value = []
}

function fillEditor(item: AdminPrepItem) {
  editingId.value = item.id
  editorForm.courseId = String(item.courseId)
  editorForm.title = item.title
  editorForm.teachingContent = item.teachingContent
  editorAttachments.value = item.attachments || []
}

function closeEditorDialog(force = false) {
  if (dialogBusy.value && !force) {
    return
  }

  showEditorDialog.value = false
  errorMessage.value = ''
  resetEditor()
}

function syncFiltersWithRoute() {
  filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  filters.courseId = typeof route.query.courseId === 'string' ? route.query.courseId : ''
}

function updateRoute(page = 1) {
  void router.push({
    path: '/admin/preps',
    query: {
      page: String(page),
      ...(filters.keyword ? { keyword: filters.keyword } : {}),
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
    },
  })
}

function applySearch() {
  updateRoute(1)
}

function resetFilters() {
  filters.keyword = ''
  filters.courseId = ''
  updateRoute(1)
}

function changePage(page: number) {
  updateRoute(page)
}

async function previewAttachment(attachmentId: number) {
  try {
    await previewAdminPrepAttachment(attachmentId)
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '备课附件预览失败'
  }
}

function buildPrepPayload(): AdminPrepPayload {
  return {
    courseId: editorForm.courseId,
    title: editorForm.title.trim(),
    status: 'published',
    teachingContent: editorForm.teachingContent.trim(),
  }
}

function startEdit(item: AdminPrepItem) {
  clearMessages()

  if (!canManagePrep(item)) {
    errorMessage.value = '管理员仅可操作已发布的备课单'
    return
  }

  fillEditor(item)
  showEditorDialog.value = true
}

async function submitPrep() {
  clearMessages()

  if (!editingId.value) {
    errorMessage.value = '当前未选中可编辑的备课单'
    return
  }

  if (!editorForm.title.trim() || !editorForm.courseId || !editorForm.teachingContent.trim()) {
    errorMessage.value = '请先填写标题、所属课程和教学内容'
    return
  }

  saving.value = true

  try {
    const result = await updateAdminPrep(editingId.value, buildPrepPayload())
    await loadPreps()
    successMessage.value = `备课单“${result.title}”已更新`
    closeEditorDialog(true)
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '备课单保存失败'
  } finally {
    saving.value = false
  }
}

async function removePrep(item: AdminPrepItem) {
  clearMessages()

  if (!canManagePrep(item)) {
    errorMessage.value = '管理员仅可操作已发布的备课单'
    return
  }

  if (!window.confirm(`确认删除备课单“${item.title}”吗？`)) {
    return
  }

  deletingPrepId.value = item.id

  try {
    await deleteAdminPrep(item.id)
    await loadPreps()

    if (editingId.value === item.id) {
      closeEditorDialog(true)
    }

    successMessage.value = `备课单“${item.title}”已删除`
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '备课单删除失败'
  } finally {
    deletingPrepId.value = null
  }
}

async function removeAttachment(attachment: AdminPrepAttachmentItem) {
  if (!editingId.value) return

  deletingAttachmentId.value = attachment.id
  clearMessages()

  try {
    await deleteAdminPrepAttachment(editingId.value, attachment.id)
    editorAttachments.value = editorAttachments.value.filter((item) => item.id !== attachment.id)
    await loadPreps()
    successMessage.value = `已移除附件“${attachment.title}”`
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '附件移除失败'
  } finally {
    deletingAttachmentId.value = null
  }
}

async function loadPreps() {
  loading.value = true
  clearMessages()
  syncFiltersWithRoute()

  try {
    const data = await getAdminPrepList({
      page: normalizePage(route.query.page),
      pageSize: 4,
      keyword: filters.keyword,
      courseId: filters.courseId,
      status: 'published',
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

    if (editingId.value) {
      const matched = data.list.find((item) => item.id === editingId.value)
      if (matched && matched.status === 'published') {
        fillEditor(matched)
      } else {
        closeEditorDialog(true)
      }
    }
  } catch (error: any) {
    prepList.value = []
    courseOptions.value = []
    stats.total = 0
    stats.draftCount = 0
    stats.publishedCount = 0
    stats.teacherCount = 0
    pagination.page = 1
    pagination.pageSize = 4
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
