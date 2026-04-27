<template>
  <main class="teacher-dashboard-page courseware-editor-page">
    <aside class="teacher-dashboard-sidebar">
      <div>
        <div class="teacher-dashboard-sidebar__eyebrow">TEACHER WORKSPACE</div>
        <h1>教师中心</h1>
      </div>

      <TeacherSidebarNav active="coursewares" />
    </aside>

    <section class="teacher-dashboard-main courseware-editor-main">
      <header class="courseware-editor-toolbar">
        <div class="courseware-editor-toolbar__title">
          <div class="my-resources-head__eyebrow">COURSEWARE EDITOR</div>
          <h2>{{ form.title || '在线课件编辑器' }}</h2>
          <p>{{ toolbarSummary }}</p>
        </div>

        <div class="courseware-editor-toolbar__actions">
          <span class="teacher-dashboard-tag">{{ statusLabel }}</span>
          <button type="button" class="course-chip course-chip--soft" @click="goBack">返回列表</button>
          <button type="button" class="course-chip course-chip--soft" @click="previewMode = !previewMode">
            {{ previewMode ? '退出预览' : '预览课件' }}
          </button>
          <button type="button" class="auth-btn auth-btn--secondary" :disabled="saving || loading" @click="saveCourseware()">
            {{ saving ? '保存中...' : '保存草稿' }}
          </button>
          <button type="button" class="auth-btn" :disabled="saving || publishing || loading" @click="publishCoursewareAction">
            {{ publishing ? '发布中...' : '发布课件' }}
          </button>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success my-resources-feedback">{{ successMessage }}</p>

      <section v-if="!loading" class="courseware-editor-workbench">
        <aside class="courseware-editor-rail">
          <div class="courseware-editor-panel__head">
            <div>
              <div class="courseware-editor-panel__eyebrow">SLIDES</div>
              <h3>页面列表</h3>
            </div>
            <button type="button" class="course-chip" @click="addSlide('content')">新增页面</button>
          </div>

          <div class="courseware-editor-rail__actions">
            <button type="button" class="course-chip course-chip--soft" @click="addSlide('cover')">封面页</button>
            <button type="button" class="course-chip course-chip--soft" @click="addSlide('agenda')">目录页</button>
            <button type="button" class="course-chip course-chip--soft" @click="addSlide('summary')">总结页</button>
          </div>

          <div class="courseware-editor-thumbs">
            <article
              v-for="(slide, index) in content.slides"
              :key="slide.id"
              :class="['courseware-thumb', slide.id === activeSlideId ? 'is-active' : '', slide.id === draggingSlideId ? 'is-dragging' : '']"
              draggable="true"
              @click="setActiveSlide(slide.id)"
              @dragstart="handleSlideDragStart(slide.id)"
              @dragover.prevent
              @drop="handleSlideDrop(slide.id)"
            >
              <div class="courseware-thumb__head">
                <span>第 {{ index + 1 }} 页</span>
                <em>{{ getCoursewareTemplateLabel(slide.template) }}</em>
              </div>
              <strong>{{ slide.title || `未命名页面 ${index + 1}` }}</strong>
              <p>{{ slide.blocks.length }} 个内容块</p>

              <div class="courseware-thumb__actions">
                <button type="button" class="course-chip course-chip--soft" @click.stop="moveSlide(slide.id, -1)">上移</button>
                <button type="button" class="course-chip course-chip--soft" @click.stop="moveSlide(slide.id, 1)">下移</button>
                <button type="button" class="course-chip course-chip--soft" @click.stop="duplicateSlide(slide.id)">复制</button>
                <button type="button" class="course-chip my-resources-delete-btn" @click.stop="removeSlide(slide.id)">删除</button>
              </div>
            </article>
          </div>
        </aside>

        <section class="courseware-editor-stage-panel">
          <div class="courseware-editor-panel__head">
            <div>
              <div class="courseware-editor-panel__eyebrow">CANVAS</div>
              <h3>{{ currentSlide?.title || '页面预览' }}</h3>
            </div>

            <div class="courseware-editor-stage-panel__meta">
              <span>{{ currentSlide ? getCoursewareTemplateLabel(currentSlide.template) : '未选择页面' }}</span>
              <span>{{ currentSlide?.blocks.length || 0 }} 个内容块</span>
            </div>
          </div>

          <div class="courseware-editor-stage" :class="{ 'is-preview': previewMode }">
            <section v-if="currentSlide" :class="['courseware-slide', `is-${currentSlide.template}`]">
              <header class="courseware-slide__header">
                <strong>{{ currentSlide.title || '未命名页面' }}</strong>
                <span>{{ currentSlide.note || '可在右侧为当前页面补充备注说明' }}</span>
              </header>

              <div class="courseware-slide__body">
                <button
                  v-for="block in currentSlide.blocks"
                  :key="block.id"
                  type="button"
                  :class="['courseware-block', `is-${block.type}`, selectedBlockId === block.id ? 'is-selected' : '', previewMode ? 'is-preview' : '']"
                  @click="selectBlock(block.id)"
                >
                  <template v-if="block.type === 'text'">
                    <span class="courseware-block__badge">{{ textStyleLabel(block.style) }}</span>
                    <strong>{{ block.text }}</strong>
                    <em>{{ textAlignLabel(block.align) }}</em>
                  </template>

                  <template v-else-if="block.type === 'image'">
                    <div class="courseware-block__preview">
                      <img v-if="block.previewUrl" :src="resolvePreviewUrl(block.previewUrl)" :alt="block.title" />
                      <span v-else>图片素材</span>
                    </div>
                    <strong>{{ block.title }}</strong>
                    <p>{{ block.caption || block.description || '图片素材引用块' }}</p>
                  </template>

                  <template v-else-if="block.type === 'resource'">
                    <span class="courseware-block__badge">资料</span>
                    <strong>{{ block.title }}</strong>
                    <p>{{ block.caption || block.fileName || '资料引用块' }}</p>
                    <em>{{ block.courseName }}</em>
                  </template>

                  <template v-else>
                    <span class="courseware-block__badge">视频</span>
                    <strong>{{ block.title }}</strong>
                    <p>{{ block.caption || block.description || '视频引用块' }}</p>
                    <em>{{ block.duration ? `${block.duration} 秒` : '未记录时长' }}</em>
                  </template>
                </button>
              </div>
            </section>

            <div v-else class="course-detail-empty">当前没有可编辑页面，请先新增页面。</div>
          </div>
        </section>

        <aside class="courseware-editor-inspector">
          <section class="courseware-editor-panel">
            <div class="courseware-editor-panel__head">
              <div>
                <div class="courseware-editor-panel__eyebrow">META</div>
                <h3>课件信息</h3>
              </div>
            </div>

            <div class="courseware-editor-form">
              <label class="my-resources-field">
                <span>课件标题</span>
                <input v-model.trim="form.title" type="text" maxlength="200" placeholder="请输入课件标题" />
              </label>

              <label class="my-resources-field">
                <span>所属课程</span>
                <select v-model="form.courseId">
                  <option value="">请选择所属课程</option>
                  <option v-for="course in courseOptions" :key="course.id" :value="String(course.id)">
                    {{ course.name }}
                  </option>
                </select>
              </label>

              <label class="my-resources-field">
                <span>关联备课单</span>
                <select v-model="form.prepId">
                  <option value="">请选择关联备课单</option>
                  <option v-for="prep in availablePreps" :key="prep.id" :value="String(prep.id)">
                    {{ prep.title }}
                  </option>
                </select>
              </label>

              <label class="my-resources-field my-resources-field--full">
                <span>课件摘要</span>
                <textarea v-model.trim="form.summary" rows="4" maxlength="2000" placeholder="补充课件用途、章节范围或课堂说明"></textarea>
              </label>
            </div>
          </section>

          <section class="courseware-editor-panel" v-if="currentSlide">
            <div class="courseware-editor-panel__head">
              <div>
                <div class="courseware-editor-panel__eyebrow">SLIDE</div>
                <h3>当前页面</h3>
              </div>
            </div>

            <div class="courseware-editor-form">
              <label class="my-resources-field">
                <span>页面标题</span>
                <input v-model.trim="currentSlide.title" type="text" maxlength="120" placeholder="请输入页面标题" />
              </label>

              <label class="my-resources-field">
                <span>页面模板</span>
                <select v-model="currentSlide.template">
                  <option v-for="template in COURSEWARE_TEMPLATE_OPTIONS" :key="template.value" :value="template.value">
                    {{ template.label }}
                  </option>
                </select>
              </label>

              <label class="my-resources-field my-resources-field--full">
                <span>页面备注</span>
                <textarea v-model.trim="currentSlide.note" rows="3" maxlength="2000" placeholder="记录本页讲解备注、口播提示或课堂说明"></textarea>
              </label>
            </div>

            <div class="courseware-editor-insert">
              <button type="button" class="course-chip" @click="addTextBlockToCurrentSlide">插入文本块</button>
              <button type="button" class="course-chip course-chip--soft" @click="duplicateSlide(currentSlide.id)">复制当前页</button>
              <button type="button" class="course-chip my-resources-delete-btn" @click="removeSlide(currentSlide.id)">删除当前页</button>
            </div>
          </section>

          <section class="courseware-editor-panel">
            <div class="courseware-editor-panel__head">
              <div>
                <div class="courseware-editor-panel__eyebrow">ASSET INSERT</div>
                <h3>插入图片素材</h3>
              </div>
              <button type="button" class="course-chip course-chip--soft" :disabled="libraryLoading" @click="loadLibraries">
                {{ libraryLoading ? '加载中...' : '刷新' }}
              </button>
            </div>

            <div class="courseware-editor-search">
              <input v-model.trim="libraryFilters.assetKeyword" type="text" maxlength="100" placeholder="搜索图片素材" @keyup.enter="loadLibraries" />
            </div>

            <div class="courseware-library-list">
              <article v-for="asset in imageAssets" :key="asset.id" class="courseware-library-item">
                <div class="courseware-library-item__main">
                  <strong>{{ asset.title }}</strong>
                  <p>{{ asset.description || asset.courseName }}</p>
                </div>
                <button type="button" class="course-chip" @click="insertImageBlock(asset)">插入</button>
              </article>
              <div v-if="!imageAssets.length" class="course-detail-empty course-detail-empty--compact">暂无可用图片素材</div>
            </div>
          </section>

          <section class="courseware-editor-panel">
            <div class="courseware-editor-panel__head">
              <div>
                <div class="courseware-editor-panel__eyebrow">RESOURCE INSERT</div>
                <h3>插入资料引用</h3>
              </div>
            </div>

            <div class="courseware-editor-search">
              <input v-model.trim="libraryFilters.materialKeyword" type="text" maxlength="100" placeholder="搜索资料资源" @keyup.enter="loadLibraries" />
            </div>

            <div class="courseware-library-list">
              <article v-for="resource in materialResources" :key="resource.id" class="courseware-library-item">
                <div class="courseware-library-item__main">
                  <strong>{{ resource.title }}</strong>
                  <p>{{ resource.fileName || resource.description || resource.courseName }}</p>
                </div>
                <button type="button" class="course-chip" @click="insertResourceBlock(resource)">插入</button>
              </article>
              <div v-if="!materialResources.length" class="course-detail-empty course-detail-empty--compact">暂无可用资料资源</div>
            </div>
          </section>

          <section class="courseware-editor-panel">
            <div class="courseware-editor-panel__head">
              <div>
                <div class="courseware-editor-panel__eyebrow">VIDEO INSERT</div>
                <h3>插入视频引用</h3>
              </div>
            </div>

            <div class="courseware-editor-search">
              <input v-model.trim="libraryFilters.videoKeyword" type="text" maxlength="100" placeholder="搜索视频资源" @keyup.enter="loadLibraries" />
            </div>

            <div class="courseware-library-list">
              <article v-for="resource in videoResources" :key="resource.id" class="courseware-library-item">
                <div class="courseware-library-item__main">
                  <strong>{{ resource.title }}</strong>
                  <p>{{ resource.description || resource.courseName }}</p>
                </div>
                <button type="button" class="course-chip" @click="insertVideoBlock(resource)">插入</button>
              </article>
              <div v-if="!videoResources.length" class="course-detail-empty course-detail-empty--compact">暂无可用视频资源</div>
            </div>
          </section>

          <section class="courseware-editor-panel" v-if="selectedBlock">
            <div class="courseware-editor-panel__head">
              <div>
                <div class="courseware-editor-panel__eyebrow">BLOCK</div>
                <h3>选中内容块</h3>
              </div>
            </div>

            <div class="courseware-editor-form">
              <template v-if="selectedBlock.type === 'text'">
                <label class="my-resources-field my-resources-field--full">
                  <span>文本内容</span>
                  <textarea v-model.trim="selectedBlock.text" rows="5" maxlength="5000" placeholder="请输入文本内容"></textarea>
                </label>

                <label class="my-resources-field">
                  <span>文本样式</span>
                  <select v-model="selectedBlock.style">
                    <option v-for="item in COURSEWARE_TEXT_STYLE_OPTIONS" :key="item.value" :value="item.value">
                      {{ item.label }}
                    </option>
                  </select>
                </label>

                <label class="my-resources-field">
                  <span>对齐方式</span>
                  <select v-model="selectedBlock.align">
                    <option v-for="item in COURSEWARE_TEXT_ALIGN_OPTIONS" :key="item.value" :value="item.value">
                      {{ item.label }}
                    </option>
                  </select>
                </label>
              </template>

              <template v-else>
                <label class="my-resources-field my-resources-field--full">
                  <span>显示标题</span>
                  <input :value="selectedBlock.title" type="text" disabled />
                </label>

                <label class="my-resources-field my-resources-field--full">
                  <span>引用说明</span>
                  <textarea v-model.trim="selectedBlock.caption" rows="3" maxlength="300" placeholder="为当前引用块补充说明"></textarea>
                </label>

                <button
                  v-if="'previewUrl' in selectedBlock && selectedBlock.previewUrl"
                  type="button"
                  class="course-chip course-chip--soft"
                  @click="openPreviewLink(selectedBlock.previewUrl)"
                >
                  打开引用资源
                </button>
              </template>
            </div>

            <div class="courseware-editor-insert">
              <button type="button" class="course-chip my-resources-delete-btn" @click="removeBlock(selectedBlock.id)">删除内容块</button>
            </div>
          </section>
        </aside>
      </section>

      <div v-else class="teacher-dashboard-panel course-detail-empty">课件详情加载中...</div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TeacherSidebarNav from '@/components/navigation/TeacherSidebarNav.vue'
import {
  getTeacherAssets,
  getTeacherCoursewareDetail,
  getTeacherResources,
  previewTeacherResource,
  publishTeacherCourseware,
  updateTeacherCourseware,
  type TeacherAssetItem,
  type TeacherCourseOption,
  type TeacherCoursewareBlock,
  type TeacherCoursewareContent,
  type TeacherCoursewareDetail,
  type TeacherCoursewareSlide,
  type TeacherCoursewareStatus,
  type TeacherCoursewareTemplate,
  type TeacherOwnedResourceItem,
  type TeacherPrepOption,
} from '@/services/teacher'
import {
  cloneCoursewareSlide,
  COURSEWARE_TEMPLATE_OPTIONS,
  COURSEWARE_TEXT_ALIGN_OPTIONS,
  COURSEWARE_TEXT_STYLE_OPTIONS,
  createCoursewareSlide,
  createImageBlock,
  createResourceBlock,
  createTextBlock,
  createVideoBlock,
  getCoursewareTemplateLabel,
} from '@/utils/courseware'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const saving = ref(false)
const publishing = ref(false)
const libraryLoading = ref(false)
const previewMode = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const activeSlideId = ref('')
const selectedBlockId = ref('')
const draggingSlideId = ref('')

const courseOptions = ref<TeacherCourseOption[]>([])
const prepOptions = ref<TeacherPrepOption[]>([])
const imageAssets = ref<TeacherAssetItem[]>([])
const materialResources = ref<TeacherOwnedResourceItem[]>([])
const videoResources = ref<TeacherOwnedResourceItem[]>([])

const form = reactive({
  title: '',
  courseId: '',
  prepId: '',
  summary: '',
  status: 'draft' as TeacherCoursewareStatus,
})

const content = reactive<TeacherCoursewareContent>({
  version: 1,
  slides: [createCoursewareSlide('cover', '封面页')],
})

const libraryFilters = reactive({
  assetKeyword: '',
  materialKeyword: '',
  videoKeyword: '',
})

const coursewareId = computed(() => Number(route.params.coursewareId || 0))

const currentSlide = computed<TeacherCoursewareSlide | null>(() => {
  return content.slides.find((slide) => slide.id === activeSlideId.value) || content.slides[0] || null
})

const selectedBlock = computed<TeacherCoursewareBlock | null>(() => {
  if (!currentSlide.value) {
    return null
  }

  return currentSlide.value.blocks.find((block) => block.id === selectedBlockId.value) || currentSlide.value.blocks[0] || null
})

const availablePreps = computed(() => {
  if (!form.courseId) {
    return prepOptions.value
  }

  return prepOptions.value.filter((item) => String(item.courseId) === form.courseId)
})

const statusLabel = computed(() => (form.status === 'published' ? '已发布' : '草稿'))

const toolbarSummary = computed(() => {
  const slideCount = content.slides.length
  const blockCount = content.slides.reduce((sum, slide) => sum + slide.blocks.length, 0)
  return `当前共 ${slideCount} 页，已放入 ${blockCount} 个内容块，可随时保存草稿或直接发布。`
})

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function resolvePreviewUrl(url: string) {
  if (!url) {
    return ''
  }

  if (/^https?:\/\//.test(url)) {
    return url
  }

  const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api$/, '')
  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

async function openPreviewLink(url: string) {
  if (!url) {
    return
  }

  try {
    await previewTeacherResource(url)
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '资源预览失败'
  }
}

function goBack() {
  void router.push('/teacher/coursewares')
}

function replaceContent(nextContent: TeacherCoursewareContent) {
  content.version = nextContent.version || 1
  content.slides.splice(0, content.slides.length, ...nextContent.slides)
}

function ensureActiveSlide() {
  if (!content.slides.length) {
    const fallback = createCoursewareSlide('content', '新页面')
    content.slides.push(fallback)
  }

  if (!content.slides.some((slide) => slide.id === activeSlideId.value)) {
    activeSlideId.value = content.slides[0]?.id || ''
  }

  const slide = currentSlide.value
  if (slide && !slide.blocks.some((block) => block.id === selectedBlockId.value)) {
    selectedBlockId.value = slide.blocks[0]?.id || ''
  }
}

function setActiveSlide(slideId: string) {
  activeSlideId.value = slideId
  selectedBlockId.value = currentSlide.value?.blocks[0]?.id || ''
}

function selectBlock(blockId: string) {
  selectedBlockId.value = blockId
}

function addSlide(template: TeacherCoursewareTemplate) {
  const slide = createCoursewareSlide(template, template === 'cover' ? '封面页' : '新页面')
  content.slides.push(slide)
  setActiveSlide(slide.id)
}

function duplicateSlide(slideId: string) {
  const index = content.slides.findIndex((slide) => slide.id === slideId)
  if (index < 0) {
    return
  }

  const clonedSlide = cloneCoursewareSlide(content.slides[index])
  clonedSlide.title = `${clonedSlide.title}（副本）`
  content.slides.splice(index + 1, 0, clonedSlide)
  setActiveSlide(clonedSlide.id)
}

function removeSlide(slideId: string) {
  if (content.slides.length <= 1) {
    errorMessage.value = '课件至少需要保留 1 个页面'
    return
  }

  const target = content.slides.find((slide) => slide.id === slideId)
  if (!target) {
    return
  }

  if (!window.confirm(`确认删除页面《${target.title || '未命名页面'}》吗？`)) {
    return
  }

  const index = content.slides.findIndex((slide) => slide.id === slideId)
  content.slides.splice(index, 1)
  const nextSlide = content.slides[Math.max(0, index - 1)] || content.slides[0]
  if (nextSlide) {
    setActiveSlide(nextSlide.id)
  }
}

function moveSlide(slideId: string, direction: -1 | 1) {
  const index = content.slides.findIndex((slide) => slide.id === slideId)
  const nextIndex = index + direction
  if (index < 0 || nextIndex < 0 || nextIndex >= content.slides.length) {
    return
  }

  const [target] = content.slides.splice(index, 1)
  content.slides.splice(nextIndex, 0, target)
}

function handleSlideDragStart(slideId: string) {
  draggingSlideId.value = slideId
}

function handleSlideDrop(targetSlideId: string) {
  if (!draggingSlideId.value || draggingSlideId.value === targetSlideId) {
    draggingSlideId.value = ''
    return
  }

  const sourceIndex = content.slides.findIndex((slide) => slide.id === draggingSlideId.value)
  const targetIndex = content.slides.findIndex((slide) => slide.id === targetSlideId)
  if (sourceIndex < 0 || targetIndex < 0) {
    draggingSlideId.value = ''
    return
  }

  const [draggedSlide] = content.slides.splice(sourceIndex, 1)
  content.slides.splice(targetIndex, 0, draggedSlide)
  draggingSlideId.value = ''
}

function addTextBlockToCurrentSlide() {
  if (!currentSlide.value) {
    return
  }

  const block = createTextBlock(currentSlide.value.template === 'cover' ? '请输入封面说明' : '请输入正文内容')
  currentSlide.value.blocks.push(block)
  selectBlock(block.id)
}

function removeBlock(blockId: string) {
  if (!currentSlide.value) {
    return
  }

  if (currentSlide.value.blocks.length <= 1) {
    errorMessage.value = '每一页至少需要保留 1 个内容块'
    return
  }

  const index = currentSlide.value.blocks.findIndex((block) => block.id === blockId)
  if (index < 0) {
    return
  }

  currentSlide.value.blocks.splice(index, 1)
  selectedBlockId.value = currentSlide.value.blocks[Math.max(0, index - 1)]?.id || ''
}

function insertImageBlock(asset: TeacherAssetItem) {
  if (!currentSlide.value) {
    return
  }

  const block = createImageBlock({
    type: 'image',
    assetId: asset.id,
    title: asset.title,
    description: asset.description,
    courseName: asset.courseName,
    previewUrl: asset.previewUrl,
    caption: '',
  })
  currentSlide.value.blocks.push(block)
  selectBlock(block.id)
}

function insertResourceBlock(resource: TeacherOwnedResourceItem) {
  if (!currentSlide.value) {
    return
  }

  const block = createResourceBlock({
    type: 'resource',
    resourceId: resource.id,
    title: resource.title,
    description: resource.description,
    courseName: resource.courseName,
    fileName: resource.fileName,
    previewUrl: resource.previewUrl,
    caption: '',
  })
  currentSlide.value.blocks.push(block)
  selectBlock(block.id)
}

function insertVideoBlock(resource: TeacherOwnedResourceItem) {
  if (!currentSlide.value) {
    return
  }

  const block = createVideoBlock({
    type: 'video',
    resourceId: resource.id,
    title: resource.title,
    description: resource.description,
    courseName: resource.courseName,
    duration: resource.duration,
    previewUrl: resource.previewUrl,
    caption: '',
  })
  currentSlide.value.blocks.push(block)
  selectBlock(block.id)
}

function textStyleLabel(style: string) {
  return COURSEWARE_TEXT_STYLE_OPTIONS.find((item) => item.value === style)?.label || '正文'
}

function textAlignLabel(align: string) {
  return COURSEWARE_TEXT_ALIGN_OPTIONS.find((item) => item.value === align)?.label || '左对齐'
}

async function loadLibraries() {
  libraryLoading.value = true

  try {
    const [assetData, materialData, videoData] = await Promise.all([
      getTeacherAssets({
        page: 1,
        pageSize: 12,
        courseId: form.courseId || undefined,
        keyword: libraryFilters.assetKeyword || undefined,
        type: 'image',
      }),
      getTeacherResources({
        page: 1,
        pageSize: 12,
        courseId: form.courseId || undefined,
        keyword: libraryFilters.materialKeyword || undefined,
        type: 'material',
      }),
      getTeacherResources({
        page: 1,
        pageSize: 12,
        courseId: form.courseId || undefined,
        keyword: libraryFilters.videoKeyword || undefined,
        type: 'video',
      }),
    ])

    imageAssets.value = assetData.list
    materialResources.value = materialData.list
    videoResources.value = videoData.list
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '资源引用列表加载失败'
  } finally {
    libraryLoading.value = false
  }
}

async function loadCoursewareDetail() {
  if (!coursewareId.value) {
    errorMessage.value = '课件 ID 不合法'
    loading.value = false
    return
  }

  loading.value = true
  clearMessages()

  try {
    const data = await getTeacherCoursewareDetail(coursewareId.value)
    const detail: TeacherCoursewareDetail = data.courseware

    form.title = detail.title
    form.courseId = String(detail.courseId)
    form.prepId = String(detail.prepId)
    form.summary = detail.summary || ''
    form.status = detail.status
    courseOptions.value = data.options.courses
    prepOptions.value = data.options.preps
    replaceContent(detail.content)
    activeSlideId.value = detail.content.slides[0]?.id || ''
    selectedBlockId.value = detail.content.slides[0]?.blocks[0]?.id || ''
    await loadLibraries()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '课件详情加载失败'
  } finally {
    loading.value = false
  }
}

async function saveCourseware(showToast = true) {
  if (!form.title || !form.courseId || !form.prepId) {
    errorMessage.value = '请先填写课件标题、所属课程和关联备课单'
    return false
  }

  saving.value = true
  clearMessages()

  try {
    const result = await updateTeacherCourseware(coursewareId.value, {
      title: form.title,
      courseId: form.courseId,
      prepId: form.prepId,
      summary: form.summary,
      status: form.status,
      content: {
        version: 1,
        slides: content.slides,
      },
    })

    form.status = result.status
    replaceContent(result.content)
    ensureActiveSlide()
    if (showToast) {
      successMessage.value = '课件草稿已保存'
    }
    return true
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '课件保存失败'
    return false
  } finally {
    saving.value = false
  }
}

async function publishCoursewareAction() {
  const saved = await saveCourseware(false)
  if (!saved) {
    return
  }

  publishing.value = true
  clearMessages()

  try {
    const result = await publishTeacherCourseware(coursewareId.value)
    form.status = result.status
    successMessage.value = '课件已发布'
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '课件发布失败'
  } finally {
    publishing.value = false
  }
}

watch(
  () => form.courseId,
  () => {
    if (form.prepId && !availablePreps.value.some((item) => String(item.id) === form.prepId)) {
      form.prepId = ''
    }

    if (!loading.value) {
      void loadLibraries()
    }
  },
)

watch(
  () => currentSlide.value?.id,
  () => {
    ensureActiveSlide()
  },
)

watch(
  () => route.params.coursewareId,
  () => {
    void loadCoursewareDetail()
  },
  { immediate: true },
)
</script>
