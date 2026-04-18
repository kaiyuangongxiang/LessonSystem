<template>
  <main class="teacher-dashboard-page">
    <aside class="teacher-dashboard-sidebar">
      <div>
        <div class="teacher-dashboard-sidebar__eyebrow">TEACHER CENTER</div>
        <h1>教师中心</h1>
      </div>

      <TeacherSidebarNav active="assets" />
    </aside>

    <section class="teacher-dashboard-main asset-manage-main">
      <header class="teacher-dashboard-head">
        <div>
          <div class="teacher-dashboard-head__eyebrow">RESOURCE MANAGEMENT</div>
          <h2>资料管理</h2>
          <p>素材上传不再占用主页面布局，创建和编辑都会在独立弹窗内完成，同时保留公开与私密管理。</p>
        </div>

        <div class="teacher-dashboard-head__actions">
          <button type="button" class="auth-btn" @click="openCreateDialog">新增素材</button>
          <button type="button" class="auth-btn auth-btn--secondary" @click="router.push('/assets')">查看前台素材库</button>
        </div>
      </header>

      <p v-if="errorMessage && !showEditorDialog" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success my-resources-feedback">{{ successMessage }}</p>

      <section class="teacher-dashboard-metrics">
        <article class="teacher-dashboard-metric">
          <span>素材总数</span>
          <strong>{{ stats.total }}</strong>
          <em>当前教师账号下的全部素材</em>
        </article>
        <article class="teacher-dashboard-metric">
          <span>公开素材</span>
          <strong>{{ stats.publicCount }}</strong>
          <em>可在前台素材库中展示</em>
        </article>
        <article class="teacher-dashboard-metric">
          <span>私密素材</span>
          <strong>{{ stats.privateCount }}</strong>
          <em>仅教师本人和管理员可见</em>
        </article>
        <article class="teacher-dashboard-metric">
          <span>图片 / 音视频 / 文本</span>
          <strong>{{ `${stats.imageCount} / ${stats.audioCount + stats.videoCount} / ${stats.contentCount}` }}</strong>
          <em>文件素材也会计入素材总数</em>
        </article>
      </section>

      <article class="my-resources-filter-panel">
        <div class="my-resources-filter-panel__head">
          <div>
            <div class="my-resources-filter-panel__eyebrow">FILTER</div>
            <h3>筛选素材</h3>
          </div>
          <div class="my-resources-panel__meta">共 {{ pagination.total }} 条素材</div>
        </div>

        <form class="my-resources-filter-form" @submit.prevent="applySearch">
          <label class="my-resources-field">
            <span>关键词</span>
            <input v-model.trim="filters.keyword" type="text" maxlength="200" placeholder="搜索标题、说明、内容或文件名" />
          </label>

          <label class="my-resources-field">
            <span>素材类型</span>
            <select v-model="filters.type">
              <option value="all">全部类型</option>
              <option v-for="option in assetTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="my-resources-field">
            <span>公开范围</span>
            <select v-model="filters.visibility">
              <option value="all">全部范围</option>
              <option v-for="option in visibilityOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <div class="my-resources-filter-actions">
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="loading" @click="resetFilters">重置</button>
            <button type="submit" class="auth-btn" :disabled="loading">{{ loading ? '加载中...' : '应用筛选' }}</button>
          </div>
        </form>
      </article>

      <section class="my-resources-panel">
        <div class="my-resources-panel__head">
          <div>
            <div class="my-resources-panel__eyebrow">ASSET LIST</div>
            <h3>素材列表</h3>
          </div>
          <div class="my-resources-panel__meta">创建入口已收起到页头按钮，编辑在弹窗中完成</div>
        </div>

        <div v-if="assetList.length" class="asset-manage-list">
          <article v-for="item in assetList" :key="item.id" class="asset-manage-item">
            <div class="asset-manage-item__head">
              <div>
                <strong>{{ item.title }}</strong>
                <span :class="['teacher-dashboard-tag', item.visibility === 'public' ? 'is-video' : 'is-material']">
                  {{ item.visibility === 'public' ? '公开' : '私密' }}
                </span>
              </div>
              <span class="asset-manage-item__time">{{ item.uploadTime }}</span>
            </div>

            <p class="asset-manage-item__meta">{{ assetTypeLabel(item.type) }}</p>
            <p class="asset-manage-item__meta">{{ item.description || '暂无素材说明' }}</p>
            <p v-if="item.content" class="asset-manage-item__content">{{ renderPlainText(item.content) }}</p>
            <p v-else class="asset-manage-item__meta">
              {{ item.fileName || '未记录文件名' }}
              <span v-if="item.fileSize"> · {{ formatFileSize(item.fileSize) }}</span>
            </p>

            <div class="asset-manage-item__actions">
              <button v-if="item.previewUrl" type="button" class="course-chip course-chip--soft" @click="previewAsset(item)">预览</button>
              <button v-if="item.fileName" type="button" class="course-chip" @click="downloadAsset(item.id)">下载</button>
              <button type="button" class="course-chip" @click="startEdit(item.id)">编辑</button>
              <button v-if="item.visibility === 'private'" type="button" class="course-chip my-resources-delete-btn" :disabled="deletingId === item.id" @click="removeAsset(item)">
                {{ deletingId === item.id ? '删除中...' : '删除' }}
              </button>
            </div>
          </article>
        </div>
        <div v-else-if="!loading" class="course-detail-empty">当前没有符合条件的素材，可以先新增一条。</div>

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

      <TeacherWorkspaceDialog
        v-model="showEditorDialog"
        eyebrow="ASSET EDITOR"
        :title="editingId ? '编辑素材' : '新增素材'"
        :description="editingId ? '保存后将返回列表，不再占据页面主区域。' : '通过独立弹窗完成素材创建，列表页保持稳定。'"
        :disabled="saving"
        @close="closeEditorDialog"
      >
        <p v-if="errorMessage" class="course-feedback teacher-workspace-dialog__feedback">{{ errorMessage }}</p>

        <form class="asset-manage-form" @submit.prevent="submitAsset">
          <label class="my-resources-field">
            <span>素材类型</span>
            <select v-model="editorForm.type" :disabled="Boolean(editingId)">
              <option v-for="option in assetTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="my-resources-field">
            <span>公开范围</span>
            <select v-model="editorForm.visibility">
              <option v-for="option in visibilityOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="my-resources-field asset-manage-form__full">
            <span>素材标题</span>
            <input v-model.trim="editorForm.title" type="text" maxlength="200" placeholder="请输入素材标题" />
          </label>

          <label class="my-resources-field asset-manage-form__full">
            <span>素材说明</span>
            <textarea v-model.trim="editorForm.description" rows="3" maxlength="2000" placeholder="补充素材用途、使用场景或备注说明"></textarea>
          </label>

          <div v-if="isContentType" class="my-resources-field asset-manage-form__full">
            <span>素材内容</span>
            <div class="asset-rich-editor">
              <div class="asset-rich-editor__toolbar" aria-label="富文本工具栏">
                <button
                  v-for="action in richTextActions"
                  :key="action.command"
                  type="button"
                  class="asset-rich-editor__tool"
                  :title="action.title"
                  @mousedown.prevent
                  @click="formatRichText(action.command)"
                >
                  {{ action.label }}
                </button>
              </div>
              <div
                ref="richEditorRef"
                class="asset-rich-editor__content"
                contenteditable="true"
                role="textbox"
                aria-multiline="true"
                :data-placeholder="contentPlaceholder"
                @input="syncRichTextContent"
                @blur="syncRichTextContent"
              ></div>
            </div>
            <small class="asset-manage-field-tip">支持加粗、斜体、下划线、项目列表和编号列表，保存后会作为文本片段复用。</small>
          </div>

          <label v-else class="my-resources-field asset-manage-form__full">
            <span>{{ uploadLabel }}</span>
            <div class="asset-upload-picker" :class="{ 'is-disabled': Boolean(editingId) }">
              <input
                ref="fileInputRef"
                :key="fileInputKey"
                class="asset-upload-picker__input"
                type="file"
                :accept="fileAccept"
                :disabled="Boolean(editingId)"
                @change="handleFileChange"
              />
              <button type="button" class="asset-upload-picker__button" :disabled="Boolean(editingId)" @click="openFilePicker">
                选择文件
              </button>
              <span class="asset-upload-picker__name">{{ fileNameText }}</span>
            </div>
            <small class="asset-manage-field-tip">
              {{ editingId ? '编辑文件类素材时会保留原文件，仅修改标题、说明和公开范围。' : uploadTip }}
            </small>
          </label>

          <div class="my-resources-filter-actions asset-manage-form__actions">
            <button type="submit" class="auth-btn" :disabled="saving">
              {{ saving ? '提交中...' : editingId ? '保存素材' : '创建素材' }}
            </button>
          </div>
        </form>
      </TeacherWorkspaceDialog>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TeacherSidebarNav from '@/components/navigation/TeacherSidebarNav.vue'
import TeacherWorkspaceDialog from '@/components/TeacherWorkspaceDialog.vue'
import {
  createTeacherAsset,
  deleteTeacherAssetDetail,
  downloadTeacherAsset,
  getTeacherAssetDetail,
  getTeacherAssets,
  previewTeacherAsset,
  type TeacherAssetItem,
  type TeacherAssetStats,
  type TeacherAssetType,
  type TeacherAssetVisibility,
  updateTeacherAssetDetail,
} from '@/services/teacher'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const editingId = ref<number | null>(null)
const showEditorDialog = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const richEditorRef = ref<HTMLDivElement | null>(null)
const fileInputKey = ref(0)
const assetList = ref<TeacherAssetItem[]>([])

const stats = reactive<TeacherAssetStats>({
  total: 0,
  publicCount: 0,
  privateCount: 0,
  imageCount: 0,
  audioCount: 0,
  videoCount: 0,
  contentCount: 0,
})

const filters = reactive({
  keyword: '',
  type: 'all' as TeacherAssetType | 'all',
  visibility: 'all' as TeacherAssetVisibility | 'all',
})

const editorForm = reactive({
  type: 'image' as TeacherAssetType,
  visibility: 'private' as TeacherAssetVisibility,
  title: '',
  description: '',
  content: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 6,
  total: 0,
  totalPages: 0,
})

const assetTypeOptions: Array<{ value: TeacherAssetType; label: string }> = [
  { value: 'image', label: '图片素材' },
  { value: 'audio', label: '音频素材' },
  { value: 'video', label: '视频素材' },
  { value: 'text', label: '文本片段' },
  { value: 'file', label: '文件素材' },
]

const visibilityOptions: Array<{ value: TeacherAssetVisibility; label: string }> = [
  { value: 'private', label: '私密' },
  { value: 'public', label: '公开' },
]

const isContentType = computed(() => editorForm.type === 'text')

const richTextActions = [
  { command: 'bold', label: '加粗', title: '加粗' },
  { command: 'italic', label: '斜体', title: '斜体' },
  { command: 'underline', label: '下划线', title: '下划线' },
  { command: 'insertUnorderedList', label: '列表', title: '项目列表' },
  { command: 'insertOrderedList', label: '编号', title: '编号列表' },
] as const

const fileAccept = computed(() => {
  if (editorForm.type === 'audio') return '.mp3,.wav,.ogg,.m4a'
  if (editorForm.type === 'video') return '.mp4,.mov,.avi,.webm'
  if (editorForm.type === 'file') return '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.7z'
  return '.jpg,.jpeg,.png,.gif,.webp'
})

const uploadLabel = computed(() => {
  if (editorForm.type === 'audio') return '上传音频文件'
  if (editorForm.type === 'video') return '上传视频文件'
  if (editorForm.type === 'file') return '上传文件素材'
  return '上传图片文件'
})

const uploadTip = computed(() => {
  if (editorForm.type === 'audio') return '支持 MP3、WAV、OGG、M4A 格式。'
  if (editorForm.type === 'video') return '支持 MP4、MOV、AVI、WEBM 格式。'
  if (editorForm.type === 'file') return '支持 PDF、Word、PPT、Excel、TXT、ZIP、RAR、7Z 格式。'
  return '支持 JPG、PNG、GIF、WEBP 格式。'
})

const fileNameText = computed(() => {
  if (selectedFile.value) return selectedFile.value.name
  if (editingId.value) return '编辑状态下保留原文件'
  return '未选择文件'
})

const contentPlaceholder = computed(() => '请输入可复用的文本内容')

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

function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function renderPlainText(value: string, fallback = '暂无内容') {
  const text = stripHtml(value)
  if (!text) return fallback
  return text.length > 180 ? `${text.slice(0, 180)}...` : text
}

function syncRichEditor() {
  if (!richEditorRef.value || !isContentType.value) {
    return
  }

  if (richEditorRef.value.innerHTML !== editorForm.content) {
    richEditorRef.value.innerHTML = editorForm.content
  }
}

function syncRichTextContent() {
  editorForm.content = richEditorRef.value?.innerHTML.trim() || ''
}

function formatRichText(command: string) {
  richEditorRef.value?.focus()
  document.execCommand(command, false)
  syncRichTextContent()
}

function resetEditor() {
  editingId.value = null
  editorForm.type = 'image'
  editorForm.visibility = 'private'
  editorForm.title = ''
  editorForm.description = ''
  editorForm.content = ''
  selectedFile.value = null
  fileInputKey.value += 1
}

function openCreateDialog() {
  clearMessages()
  resetEditor()
  showEditorDialog.value = true
}

function closeEditorDialog() {
  if (saving.value) {
    return
  }

  showEditorDialog.value = false
  errorMessage.value = ''
  resetEditor()
}

function assetTypeLabel(type: TeacherAssetType) {
  return assetTypeOptions.find((item) => item.value === type)?.label || type
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`
  return `${(size / 1024).toFixed(2)} KB`
}

function openFilePicker() {
  if (!editingId.value) {
    fileInputRef.value?.click()
  }
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  selectedFile.value = target.files?.[0] || null
}

async function previewAsset(item: TeacherAssetItem) {
  if (!item.fileName) {
    return
  }

  try {
    await previewTeacherAsset(item.id)
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '资料预览失败'
  }
}

async function downloadAsset(assetId: number) {
  const target = assetList.value.find((item) => item.id === assetId)

  try {
    await downloadTeacherAsset(assetId, target?.fileName || 'download')
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '资料下载失败'
  }
}

function syncFiltersWithRoute() {
  filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  filters.type = typeof route.query.type === 'string' && route.query.type !== '' ? (route.query.type as TeacherAssetType | 'all') : 'all'
  filters.visibility =
    route.query.visibility === 'public' || route.query.visibility === 'private' ? route.query.visibility : 'all'
}

function updateRoute(page = 1) {
  void router.push({
    path: '/teacher/assets',
    query: {
      page: String(page),
      ...(filters.keyword ? { keyword: filters.keyword } : {}),
      ...(filters.type !== 'all' ? { type: filters.type } : {}),
      ...(filters.visibility !== 'all' ? { visibility: filters.visibility } : {}),
    },
  })
}

function applySearch() {
  updateRoute(1)
}

function resetFilters() {
  filters.keyword = ''
  filters.type = 'all'
  filters.visibility = 'all'
  updateRoute(1)
}

function changePage(page: number) {
  updateRoute(page)
}

async function startEdit(assetId: number) {
  clearMessages()

  try {
    const detail = await getTeacherAssetDetail(assetId)
    editingId.value = assetId
    editorForm.type = detail.type
    editorForm.visibility = detail.visibility
    editorForm.title = detail.title
    editorForm.description = detail.description
    editorForm.content = detail.content
    selectedFile.value = null
    fileInputKey.value += 1
    showEditorDialog.value = true
    await nextTick()
    syncRichEditor()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '素材详情加载失败'
  }
}

async function submitAsset() {
  clearMessages()
  syncRichTextContent()

  if (!editorForm.title) {
    errorMessage.value = '请先填写素材标题'
    return
  }

  if (isContentType.value && !stripHtml(editorForm.content)) {
    errorMessage.value = '当前素材类型需要填写素材内容'
    return
  }

  if (!isContentType.value && !editingId.value && !selectedFile.value) {
    errorMessage.value = '请先选择要上传的文件'
    return
  }

  saving.value = true

  try {
    if (editingId.value) {
      const result = await updateTeacherAssetDetail(editingId.value, {
        visibility: editorForm.visibility,
        title: editorForm.title,
        description: editorForm.description,
        content: editorForm.content,
      })

      showEditorDialog.value = false
      resetEditor()
      await loadAssets()
      successMessage.value = `素材“${result.title}”已更新`
    } else {
      const result = await createTeacherAsset({
        type: editorForm.type,
        visibility: editorForm.visibility,
        title: editorForm.title,
        description: editorForm.description,
        content: editorForm.content,
        file: selectedFile.value,
      })

      showEditorDialog.value = false
      resetEditor()
      await loadAssets()
      successMessage.value = `素材“${result.title}”已创建`
    }
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '素材保存失败'
  } finally {
    saving.value = false
  }
}

async function removeAsset(item: TeacherAssetItem) {
  clearMessages()

  if (!window.confirm(`确认删除素材“${item.title}”吗？`)) {
    return
  }

  deletingId.value = item.id

  try {
    await deleteTeacherAssetDetail(item.id)
    if (editingId.value === item.id) {
      closeEditorDialog()
    }
    await loadAssets()
    successMessage.value = `素材“${item.title}”已删除`
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '素材删除失败'
  } finally {
    deletingId.value = null
  }
}

async function loadAssets() {
  loading.value = true
  clearMessages()
  syncFiltersWithRoute()

  try {
    const data = await getTeacherAssets({
      page: normalizePage(route.query.page),
      pageSize: 6,
      keyword: filters.keyword,
      type: filters.type,
      visibility: filters.visibility,
    })

    assetList.value = data.list
    stats.total = data.stats.total
    stats.publicCount = data.stats.publicCount
    stats.privateCount = data.stats.privateCount
    stats.imageCount = data.stats.imageCount
    stats.audioCount = data.stats.audioCount
    stats.videoCount = data.stats.videoCount
    stats.contentCount = data.stats.contentCount
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
  } catch (error: any) {
    assetList.value = []
    stats.total = 0
    stats.publicCount = 0
    stats.privateCount = 0
    stats.imageCount = 0
    stats.audioCount = 0
    stats.videoCount = 0
    stats.contentCount = 0
    pagination.page = 1
    pagination.pageSize = 6
    pagination.total = 0
    pagination.totalPages = 0
    errorMessage.value = error?.response?.data?.message || '素材列表加载失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => showEditorDialog.value,
  async (visible) => {
    if (visible) {
      await nextTick()
      syncRichEditor()
    }
  },
)

watch(
  () => editorForm.type,
  async (type) => {
    if (type !== 'text') {
      editorForm.content = ''
      return
    }

    await nextTick()
    syncRichEditor()
  },
)

watch(
  () => route.fullPath,
  () => {
    loadAssets()
  },
  { immediate: true },
)
</script>
