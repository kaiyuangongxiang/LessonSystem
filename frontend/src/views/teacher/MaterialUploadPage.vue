<template>
  <main class="teacher-dashboard-page">
    <aside class="teacher-dashboard-sidebar">
      <div>
        <div class="teacher-dashboard-sidebar__eyebrow">TEACHER WORKSPACE</div>
        <h1>教师中心</h1>
      </div>

      <nav class="teacher-dashboard-nav">
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/teacher')">工作台首页</button>
        <button type="button" class="teacher-dashboard-nav__item is-active">资源上传</button>
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/teacher/resources')">我的资源</button>
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/teacher/profile')">个人资料</button>
      </nav>
    </aside>

    <section class="teacher-dashboard-main material-upload-main">
      <header class="material-upload-head">
        <div>
          <div class="material-upload-head__eyebrow">RESOURCE UPLOAD</div>
          <h2>上传课程资源</h2>
          <p>{{ headerText }}</p>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success material-upload-feedback">{{ successMessage }}</p>
      <div v-if="!loading && !courseOptions.length && !errorMessage" class="course-detail-empty">当前还没有可上传资源的课程，请先确认教师账号下已有课程。</div>

      <section class="material-upload-grid">
        <article class="material-upload-panel material-upload-panel--form">
          <div class="material-upload-panel__head">
            <div>
              <div class="material-upload-panel__eyebrow">RESOURCE INFO</div>
              <h3>资源信息</h3>
            </div>
          </div>

          <form class="material-upload-form" @submit.prevent="submitResources">
            <div class="material-upload-form__row">
              <label class="material-upload-field">
                <span>资源名称</span>
                <input v-model.trim="form.title" type="text" maxlength="200" placeholder="请输入资源名称，资料和视频会共用该标题" />
              </label>

              <label class="material-upload-field">
                <span>所属课程</span>
                <select v-model="form.courseId">
                  <option value="">请选择所属课程</option>
                  <option v-for="course in courseOptions" :key="course.id" :value="String(course.id)">
                    {{ course.name }}
                  </option>
                </select>
              </label>
            </div>

            <label class="material-upload-field">
              <span>资源说明</span>
              <textarea v-model.trim="form.description" maxlength="2000" rows="4" placeholder="填写资源用途、适用章节或更新说明"></textarea>
            </label>

            <label class="material-upload-field material-upload-field--file">
              <span>资料文件</span>
              <input
                ref="materialFileInputRef"
                class="material-upload-file-input"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                @change="handleMaterialFileChange"
              />

              <div class="material-upload-dropzone" @click="chooseMaterialFile">
                <div class="material-upload-dropzone__main">
                  <div class="material-upload-dropzone__icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 16V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                      <path d="M8.5 10.5 12 7l3.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M6 17.5h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                    </svg>
                  </div>
                  <div>
                    <strong>{{ selectedMaterialFile ? selectedMaterialFile.name : '选择本地资料文件' }}</strong>
                    <p>{{ selectedMaterialFile ? `文件大小 ${formatFileSize(selectedMaterialFile.size)}` : '支持 PDF、DOC、DOCX、PPT、PPTX，单文件不超过 100MB' }}</p>
                  </div>
                </div>

                <div class="material-upload-dropzone__actions">
                  <button type="button" class="material-upload-file-button">{{ selectedMaterialFile ? '重新选择' : '点击选择' }}</button>
                  <span v-if="selectedMaterialFile" class="material-upload-file-tag">已选择</span>
                </div>
              </div>
            </label>

            <label class="video-upload-field video-upload-field--file">
              <span>视频文件</span>
              <input
                ref="videoInputRef"
                class="video-upload-file-input"
                type="file"
                accept=".mp4,.mov,video/mp4,video/quicktime"
                @change="handleVideoChange"
              />

              <div class="video-upload-dropzone video-upload-dropzone--primary" @click="chooseVideoFile">
                <div class="video-upload-dropzone__main">
                  <div class="video-upload-dropzone__icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 16V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                      <path d="M8.5 10.5 12 7l3.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M6 17.5h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                    </svg>
                  </div>
                  <div>
                    <strong>{{ selectedVideo ? selectedVideo.name : '选择视频文件' }}</strong>
                    <p>
                      {{
                        selectedVideo
                          ? `文件大小 ${formatFileSize(selectedVideo.size)}${videoDurationText ? `，时长 ${videoDurationText}` : ''}`
                          : '支持 MP4、MOV，单文件不超过 500MB'
                      }}
                    </p>
                  </div>
                </div>

                <div class="video-upload-dropzone__actions">
                  <button type="button" class="video-upload-file-button">{{ selectedVideo ? '重新选择' : '点击选择' }}</button>
                  <span v-if="selectedVideo" class="video-upload-file-tag">已选择</span>
                </div>
              </div>
            </label>

            <label class="video-upload-field video-upload-field--file">
              <span>视频封面（可选）</span>
              <input
                ref="coverInputRef"
                class="video-upload-file-input"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                @change="handleCoverChange"
              />

              <div class="video-upload-dropzone video-upload-dropzone--cover" @click="chooseCoverFile">
                <div class="video-upload-dropzone__main">
                  <div class="video-upload-dropzone__icon video-upload-dropzone__icon--cover">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="4.5" y="6" width="15" height="12" rx="2.5" stroke="currentColor" stroke-width="1.8" />
                      <path d="m8 14 2.5-2.5L13 14l2-2 3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                      <circle cx="9" cy="10" r="1.2" fill="currentColor" />
                    </svg>
                  </div>
                  <div>
                    <strong>{{ selectedCover ? selectedCover.name : '选择封面图片' }}</strong>
                    <p>{{ selectedCover ? `文件大小 ${formatFileSize(selectedCover.size)}` : '封面可选，支持 JPG、PNG、WEBP' }}</p>
                  </div>
                </div>

                <div class="video-upload-dropzone__actions">
                  <button type="button" class="video-upload-file-button video-upload-file-button--soft">{{ selectedCover ? '重新选择' : '上传封面' }}</button>
                  <span v-if="selectedCover" class="video-upload-file-tag video-upload-file-tag--cover">已选择</span>
                </div>
              </div>
            </label>

            <div class="material-upload-actions">
              <button type="submit" class="auth-btn" :disabled="submitting || !courseOptions.length">
                {{ submitting ? '上传中...' : '提交上传' }}
              </button>
              <button type="button" class="auth-btn auth-btn--secondary" :disabled="submitting" @click="resetForm">重置内容</button>
            </div>
          </form>
        </article>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getTeacherCourseOptions, uploadTeacherResourceBundle, type TeacherCourseOption } from '@/services/teacher'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const courseOptions = ref<TeacherCourseOption[]>([])
const materialFileInputRef = ref<HTMLInputElement | null>(null)
const videoInputRef = ref<HTMLInputElement | null>(null)
const coverInputRef = ref<HTMLInputElement | null>(null)
const selectedMaterialFile = ref<File | null>(null)
const selectedVideo = ref<File | null>(null)
const selectedCover = ref<File | null>(null)
const videoDuration = ref<number | null>(null)
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const form = reactive({
  courseId: '',
  title: '',
  description: '',
})

const headerText = computed(() => {
  const name = authStore.profile?.name || authStore.profile?.username || '教师用户'
  return `${name}，在这里统一上传课程资料和视频资源。`
})

const videoDurationText = computed(() => formatDuration(videoDuration.value))

function formatFileSize(size: number) {
  if (size >= 1024 * 1024 * 1024) {
    return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
  }

  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(2)} MB`
  }

  return `${(size / 1024).toFixed(2)} KB`
}

function formatDuration(duration: number | null) {
  if (!duration) {
    return ''
  }

  const totalSeconds = Math.round(duration)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes} 分 ${seconds.toString().padStart(2, '0')} 秒`
}

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function chooseMaterialFile() {
  materialFileInputRef.value?.click()
}

function chooseVideoFile() {
  videoInputRef.value?.click()
}

function chooseCoverFile() {
  coverInputRef.value?.click()
}

function resetForm() {
  form.courseId = ''
  form.title = ''
  form.description = ''
  selectedMaterialFile.value = null
  selectedVideo.value = null
  selectedCover.value = null
  videoDuration.value = null
  clearMessages()

  if (materialFileInputRef.value) {
    materialFileInputRef.value.value = ''
  }

  if (videoInputRef.value) {
    videoInputRef.value.value = ''
  }

  if (coverInputRef.value) {
    coverInputRef.value.value = ''
  }
}

function handleMaterialFileChange(event: Event) {
  clearMessages()
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null

  if (!file) {
    selectedMaterialFile.value = null
    return
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx']

  if (!allowedExtensions.includes(extension)) {
    input.value = ''
    selectedMaterialFile.value = null
    errorMessage.value = '仅支持 PDF、DOC、DOCX、PPT、PPTX 格式资料'
    return
  }

  if (file.size > 100 * 1024 * 1024) {
    input.value = ''
    selectedMaterialFile.value = null
    errorMessage.value = '资料文件大小不能超过 100MB'
    return
  }

  selectedMaterialFile.value = file
}

function readVideoDuration(file: File) {
  return new Promise<number | null>((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const media = document.createElement('video')
    media.preload = 'metadata'
    media.onloadedmetadata = () => {
      const duration = Number.isFinite(media.duration) ? media.duration : null
      URL.revokeObjectURL(objectUrl)
      resolve(duration)
    }
    media.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(null)
    }
    media.src = objectUrl
  })
}

async function handleVideoChange(event: Event) {
  clearMessages()
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null

  if (!file) {
    selectedVideo.value = null
    videoDuration.value = null
    return
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  const allowedExtensions = ['mp4', 'mov']

  if (!allowedExtensions.includes(extension)) {
    input.value = ''
    selectedVideo.value = null
    videoDuration.value = null
    errorMessage.value = '仅支持 MP4、MOV 格式视频'
    return
  }

  if (file.size > 500 * 1024 * 1024) {
    input.value = ''
    selectedVideo.value = null
    videoDuration.value = null
    errorMessage.value = '视频文件大小不能超过 500MB'
    return
  }

  selectedVideo.value = file
  videoDuration.value = await readVideoDuration(file)
}

function handleCoverChange(event: Event) {
  clearMessages()
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null

  if (!file) {
    selectedCover.value = null
    return
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp']

  if (!allowedExtensions.includes(extension)) {
    input.value = ''
    selectedCover.value = null
    errorMessage.value = '封面仅支持 JPG、JPEG、PNG、WEBP 格式图片'
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    input.value = ''
    selectedCover.value = null
    errorMessage.value = '封面图片大小不能超过 10MB'
    return
  }

  selectedCover.value = file
}

async function loadCourseOptions() {
  loading.value = true
  errorMessage.value = ''

  try {
    courseOptions.value = await getTeacherCourseOptions()
  } catch (error: any) {
    courseOptions.value = []
    errorMessage.value = error?.response?.data?.message || '课程选项加载失败'
  } finally {
    loading.value = false
  }
}

async function submitResources() {
  clearMessages()

  if (!form.courseId) {
    errorMessage.value = '请选择所属课程'
    return
  }

  if (!form.title) {
    errorMessage.value = '请输入资源名称'
    return
  }

  if (!selectedMaterialFile.value && !selectedVideo.value) {
    errorMessage.value = '资料文件和视频文件至少上传一种'
    return
  }

  if (selectedCover.value && !selectedVideo.value) {
    errorMessage.value = '上传视频封面前请先选择视频文件'
    return
  }

  submitting.value = true

  try {
    const result = await uploadTeacherResourceBundle({
      courseId: form.courseId,
      title: form.title,
      description: form.description,
      material: selectedMaterialFile.value,
      video: selectedVideo.value,
      cover: selectedCover.value,
      duration: videoDuration.value,
    })

    const createdTypes = result.created.map((item) => (item.type === 'video' ? '视频' : '资料')).join('、')
    resetForm()
    successMessage.value = `资源上传成功，已归档到《${result.courseName}》，本次上传包含：${createdTypes}。`
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '资源上传失败'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadCourseOptions()
})
</script>
