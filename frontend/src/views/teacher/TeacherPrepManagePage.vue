<template>
  <main class="teacher-dashboard-page prep-page">
    <aside class="teacher-dashboard-sidebar">
      <div>
        <div class="teacher-dashboard-sidebar__eyebrow">TEACHER CENTER</div>
        <h1>教师中心</h1>
      </div>

      <TeacherSidebarNav active="preps" />
    </aside>

    <section class="teacher-dashboard-main prep-manage-main">
      <header class="my-resources-head">
        <div>
          <div class="my-resources-head__eyebrow">TEACHING PREP</div>
          <h2>备课单管理</h2>
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
            <input v-model.trim="filters.keyword" type="text" maxlength="200" placeholder="搜索标题、课程名或教学内容" />
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

      <section class="my-resources-panel prep-manage-editor">
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
            <p>先保存标题、课程和教学内容，再挂载本地素材或个人素材。</p>
          </div>

          <label class="my-resources-field my-resources-field--full">
            <span>教学内容</span>
            <textarea
              v-model.trim="editorForm.teachingContent"
              rows="10"
              maxlength="5000"
              placeholder="请输入本次备课的教学内容安排、重点说明和课堂组织内容"
            ></textarea>
          </label>

          <div class="my-resources-filter-actions">
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="saving" @click="resetEditor">重置</button>
            <button type="submit" class="auth-btn" :disabled="saving">
              {{ saving ? '保存中...' : editingId ? '保存备课单' : '创建备课单' }}
            </button>
          </div>
        </form>
      </section>

      <section class="my-resources-panel">
        <div class="my-resources-panel__head">
          <div>
            <div class="my-resources-panel__eyebrow">PREP ATTACHMENTS</div>
            <h3>素材挂载</h3>
          </div>
          <div class="my-resources-panel__meta">
            {{ editingId ? `当前附件 ${editorAttachments.length}` : '请先保存备课单后再挂载素材' }}
          </div>
        </div>

        <div class="prep-manage-attachment-grid">
          <article class="prep-manage-attachment-box">
            <strong>方式一：本地上传</strong>
            <p>上传后的附件仅挂载到当前备课单，不会进入“我的素材”。</p>
            <input
              ref="localFileInputRef"
              class="prep-manage-attachment-box__input"
              type="file"
              multiple
              :disabled="!editingId || uploadingLocal"
              @change="handleLocalFilesChange"
            />

            <div class="prep-manage-attachment-box__actions">
              <button type="button" class="course-chip" :disabled="!editingId || uploadingLocal" @click="openLocalFilePicker">选择文件</button>
              <button
                type="button"
                class="course-chip course-chip--soft"
                :disabled="!editingId || !localFiles.length || uploadingLocal"
                @click="uploadLocalAttachments"
              >
                {{ uploadingLocal ? '上传中...' : `上传 ${localFiles.length || 0} 个文件` }}
              </button>
            </div>
          </article>

          <article class="prep-manage-attachment-box">
            <strong>方式二：选择个人素材</strong>
            <p>仅可选择当前教师自己的素材进行挂载。</p>

            <div v-if="personalAssetOptions.length" class="prep-manage-asset-select">
              <label v-for="item in personalAssetOptions" :key="item.id" class="prep-manage-asset-option">
                <input v-model="selectedAssetIds" type="checkbox" :value="item.id" :disabled="!editingId || attachingAssets" />
                <div>
                  <strong>{{ item.title }}</strong>
                  <span>{{ assetTypeLabel(item.type) }} · {{ item.visibility === 'public' ? '公开' : '私密' }}</span>
                </div>
              </label>
            </div>
            <div v-else class="course-detail-empty course-detail-empty--compact">当前还没有可选择的个人素材。</div>

            <div class="prep-manage-attachment-box__actions">
              <button
                type="button"
                class="course-chip course-chip--soft"
                :disabled="!editingId || attachingAssets || !selectedAssetIds.length"
                @click="attachSelectedAssets"
              >
                {{ attachingAssets ? '挂载中...' : `挂载 ${selectedAssetIds.length || 0} 个素材` }}
              </button>
            </div>
          </article>
        </div>

        <div v-if="editorAttachments.length" class="prep-manage-attachment-list">
          <article v-for="attachment in editorAttachments" :key="attachment.id" class="prep-manage-attachment-item">
            <div>
              <strong>{{ attachment.title }}</strong>
              <p>{{ attachment.sourceLabel }} · {{ assetTypeLabel(attachment.type) }}</p>
            </div>

            <div class="prep-manage-attachment-item__actions">
              <button
                v-if="attachment.downloadUrl"
                type="button"
                class="course-chip course-chip--soft"
                @click="previewAttachment(attachment.downloadUrl)"
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
        <div v-else class="course-detail-empty course-detail-empty--compact">
          {{ editingId ? '当前备课单还没有挂载素材。' : '先保存备课单后，才能上传或选择素材。' }}
        </div>
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
                  <span>附件 {{ item.attachmentCount }}</span>
                </div>
              </div>
              <span class="prep-manage-item__time">更新于 {{ item.updateTime }}</span>
            </div>

            <div class="prep-manage-item__summary">
              <p>{{ renderExcerpt(item.teachingContent, '暂未填写教学内容') }}</p>
            </div>

            <div class="prep-manage-item__actions">
              <button type="button" class="course-chip" @click="startEdit(item)">编辑</button>
              <button type="button" class="course-chip course-chip--soft" @click="toggleStatus(item)">
                {{ item.status === 'published' ? '转为草稿' : '直接发布' }}
              </button>
              <button type="button" class="course-chip my-resources-delete-btn" :disabled="deletingPrepId === item.id" @click="removePrep(item)">
                {{ deletingPrepId === item.id ? '删除中...' : '删除' }}
              </button>
            </div>
          </article>
        </div>
        <div v-else-if="!loading" class="course-detail-empty">当前还没有备课单记录，可以先创建一条。</div>

        <section class="course-pagination my-resources-pagination">
          <div class="course-pagination__desc">当前第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</div>
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
import TeacherSidebarNav from '@/components/navigation/TeacherSidebarNav.vue'
import {
  addTeacherPrepAssetAttachments,
  createTeacherPrep,
  deleteTeacherPrep,
  deleteTeacherPrepAttachment,
  getTeacherAssets,
  getTeacherPreps,
  updateTeacherPrep,
  uploadTeacherPrepAttachments,
  type TeacherAssetItem,
  type TeacherPrepAttachmentItem,
  type TeacherPrepItem,
  type TeacherPrepStats,
} from '@/services/teacher'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const uploadingLocal = ref(false)
const attachingAssets = ref(false)
const deletingPrepId = ref<number | null>(null)
const deletingAttachmentId = ref<number | null>(null)
const editingId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const courseOptions = ref<Array<{ id: number; name: string }>>([])
const prepList = ref<TeacherPrepItem[]>([])
const personalAssetOptions = ref<TeacherAssetItem[]>([])
const editorAttachments = ref<TeacherPrepAttachmentItem[]>([])
const selectedAssetIds = ref<number[]>([])
const localFiles = ref<File[]>([])
const localFileInputRef = ref<HTMLInputElement | null>(null)

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
  teachingContent: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 6,
  total: 0,
  totalPages: 0,
})

const headerText = computed(() => {
  const name = authStore.profile?.name || authStore.profile?.username || '教师用户'
  return `${name}，这里可以维护教学内容，并为备课单挂载本地附件或个人素材。`
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
  return text.length > 140 ? `${text.slice(0, 140)}...` : text
}

function assetTypeLabel(type: string) {
  const labels: Record<string, string> = {
    image: '图片',
    audio: '音频',
    video: '视频',
    text: '文本',
    question: '题目',
    template: '模板',
    file: '附件',
  }

  return labels[type] || type
}

function fillEditor(item: TeacherPrepItem) {
  editingId.value = item.id
  editorForm.courseId = String(item.courseId)
  editorForm.title = item.title
  editorForm.status = item.status === 'published' ? 'published' : 'draft'
  editorForm.teachingContent = item.teachingContent
  editorAttachments.value = item.attachments || []
  selectedAssetIds.value = []
  localFiles.value = []

  if (localFileInputRef.value) {
    localFileInputRef.value.value = ''
  }
}

function resetEditor() {
  editingId.value = null
  editorForm.courseId = ''
  editorForm.title = ''
  editorForm.status = 'draft'
  editorForm.teachingContent = ''
  editorAttachments.value = []
  selectedAssetIds.value = []
  localFiles.value = []

  if (localFileInputRef.value) {
    localFileInputRef.value.value = ''
  }
}

function syncFiltersWithRoute() {
  filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  filters.courseId = typeof route.query.courseId === 'string' ? route.query.courseId : ''
  filters.status = route.query.status === 'draft' || route.query.status === 'published' ? route.query.status : 'all'
}

function updateRoute(page = 1) {
  void router.push({
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

function startEdit(item: TeacherPrepItem) {
  clearMessages()
  fillEditor(item)
}

function openLocalFilePicker() {
  if (!editingId.value) return
  localFileInputRef.value?.click()
}

function handleLocalFilesChange(event: Event) {
  const input = event.target as HTMLInputElement
  localFiles.value = Array.from(input.files || [])
}

function previewAttachment(path: string) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  window.open(`${baseUrl}${path}`, '_blank', 'noopener,noreferrer')
}

async function submitPrep() {
  clearMessages()

  if (!editorForm.title || !editorForm.courseId) {
    errorMessage.value = '请先填写标题并选择所属课程'
    return
  }

  saving.value = true

  try {
    const isEditing = Boolean(editingId.value)
    const payload = {
      courseId: editorForm.courseId,
      title: editorForm.title,
      status: editorForm.status,
      teachingContent: editorForm.teachingContent,
    }

    const result = editingId.value ? await updateTeacherPrep(editingId.value, payload) : await createTeacherPrep(payload)
    fillEditor(result)
    await loadPreps()
    successMessage.value = isEditing ? `备课单“${result.title}”已保存` : `备课单“${result.title}”已创建`
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '备课单保存失败'
  } finally {
    saving.value = false
  }
}

async function toggleStatus(item: TeacherPrepItem) {
  clearMessages()

  try {
    const result = await updateTeacherPrep(item.id, {
      courseId: String(item.courseId),
      title: item.title,
      status: item.status === 'published' ? 'draft' : 'published',
      teachingContent: item.teachingContent,
    })

    await loadPreps()

    if (editingId.value === item.id) {
      fillEditor(result)
    }

    successMessage.value = `备课单“${result.title}”已更新为${result.statusLabel}`
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '备课单状态更新失败'
  }
}

async function uploadLocalAttachments() {
  if (!editingId.value) {
    errorMessage.value = '请先保存备课单，再上传附件'
    return
  }

  if (!localFiles.value.length) {
    errorMessage.value = '请先选择要上传的文件'
    return
  }

  uploadingLocal.value = true
  clearMessages()

  try {
    const result = await uploadTeacherPrepAttachments(editingId.value, localFiles.value)
    editorAttachments.value = result.attachments
    localFiles.value = []

    if (localFileInputRef.value) {
      localFileInputRef.value.value = ''
    }

    await loadPreps()
    successMessage.value = '本地附件已挂载到当前备课单'
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '附件上传失败'
  } finally {
    uploadingLocal.value = false
  }
}

async function attachSelectedAssets() {
  if (!editingId.value) {
    errorMessage.value = '请先保存备课单，再选择个人素材'
    return
  }

  if (!selectedAssetIds.value.length) {
    errorMessage.value = '请先勾选要挂载的个人素材'
    return
  }

  attachingAssets.value = true
  clearMessages()

  try {
    const result = await addTeacherPrepAssetAttachments(editingId.value, selectedAssetIds.value)
    editorAttachments.value = result.attachments
    selectedAssetIds.value = []
    await loadPreps()
    successMessage.value = '个人素材已挂载到当前备课单'
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '个人素材挂载失败'
  } finally {
    attachingAssets.value = false
  }
}

async function removeAttachment(attachment: TeacherPrepAttachmentItem) {
  if (!editingId.value) return

  deletingAttachmentId.value = attachment.id
  clearMessages()

  try {
    await deleteTeacherPrepAttachment(editingId.value, attachment.id)
    editorAttachments.value = editorAttachments.value.filter((item) => item.id !== attachment.id)
    await loadPreps()
    successMessage.value = `已移除附件“${attachment.title}”`
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '附件移除失败'
  } finally {
    deletingAttachmentId.value = null
  }
}

async function removePrep(item: TeacherPrepItem) {
  clearMessages()

  if (!window.confirm(`确认删除备课单“${item.title}”吗？`)) {
    return
  }

  deletingPrepId.value = item.id

  try {
    await deleteTeacherPrep(item.id)

    if (editingId.value === item.id) {
      resetEditor()
    }

    await loadPreps()
    successMessage.value = `备课单“${item.title}”已删除`
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '备课单删除失败'
  } finally {
    deletingPrepId.value = null
  }
}

async function loadPersonalAssets() {
  try {
    const data = await getTeacherAssets({
      page: 1,
      pageSize: 60,
      type: 'all',
      visibility: 'all',
    })

    personalAssetOptions.value = data.list
  } catch {
    personalAssetOptions.value = []
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

    if (editingId.value) {
      const current = data.list.find((item) => item.id === editingId.value)
      if (current) {
        editorAttachments.value = current.attachments || []
      }
    }
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
    loadPersonalAssets()
  },
  { immediate: true },
)
</script>
