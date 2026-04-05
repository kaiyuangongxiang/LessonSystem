<template>
  <main class="video-upload-page">
    <aside class="video-upload-sidebar">
      <div>
        <div class="video-upload-sidebar__eyebrow">TEACHER WORKSPACE</div>
        <h1>教师中心</h1>
      </div>

      <nav class="video-upload-nav">
        <button type="button" class="video-upload-nav__item" @click="router.push('/teacher')">工作台首页</button>
        <button type="button" class="video-upload-nav__item" @click="router.push('/teacher/messages')">教学交流</button>
        <button type="button" class="video-upload-nav__item" @click="router.push('/teacher/materials')">资料上传</button>
        <button type="button" class="video-upload-nav__item is-active">视频上传</button>
        <button type="button" class="video-upload-nav__item" @click="router.push('/teacher/resources')">我的资源</button>
        <button type="button" class="video-upload-nav__item" @click="router.push('/teacher/profile')">个人资料</button>
      </nav>
    </aside>

    <section class="video-upload-main">
      <header class="video-upload-head">
        <div>
          <div class="video-upload-head__eyebrow">COURSE VIDEO</div>
          <h2>上传教学视频</h2>
          <p>{{ headerText }}</p>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success video-upload-feedback">{{ successMessage }}</p>
      <div v-if="!loading && !courseOptions.length && !errorMessage" class="course-detail-empty">当前还没有可上传视频的课程，请先确认教师账号下已有课程。</div>

      <section class="video-upload-grid">
        <article class="video-upload-panel video-upload-panel--form">
          <div class="video-upload-panel__head">
            <div>
              <div class="video-upload-panel__eyebrow">VIDEO INFO</div>
              <h3>视频信息</h3>
            </div>
          </div>

          <form class="video-upload-form" @submit.prevent="submitVideo">
            <div class="video-upload-form__row">
              <label class="video-upload-field">
                <span>视频标题</span>
                <input v-model.trim="form.videoTitle" type="text" maxlength="200" placeholder="请输入视频标题，如《事务与锁机制讲解》" />
              </label>

              <label class="video-upload-field">
                <span>所属课程</span>
                <select v-model="form.courseId">
                  <option value="">请选择所属课程</option>
                  <option v-for="course in courseOptions" :key="course.id" :value="String(course.id)">
                    {{ course.name }}
                  </option>
                </select>
              </label>
            </div>

            <label class="video-upload-field">
              <span>视频描述</span>
              <textarea
                v-model.trim="form.description"
                maxlength="2000"
                rows="4"
                placeholder="填写教学内容摘要、适用对象和配套资料说明"
              ></textarea>
            </label>

            <div class="video-upload-form__row video-upload-form__row--files">
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
                      <strong>{{ selectedVideo ? selectedVideo.name : '选择主视频文件' }}</strong>
                      <p>
                        {{
                          selectedVideo
                            ? `文件大小 ${formatFileSize(selectedVideo.size)}${videoDurationText ? ` · 时长 ${videoDurationText}` : ''}`
                            : '推荐 MP4，支持 MP4/MOV，单文件不超过 500MB'
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
                      <p>{{ selectedCover ? `文件大小 ${formatFileSize(selectedCover.size)}` : '支持 JPG、PNG、WEBP，建议 16:9 比例' }}</p>
                    </div>
                  </div>

                  <div class="video-upload-dropzone__actions">
                    <button type="button" class="video-upload-file-button video-upload-file-button--soft">{{ selectedCover ? '重新选择' : '上传封面' }}</button>
                    <span v-if="selectedCover" class="video-upload-file-tag video-upload-file-tag--cover">已选择</span>
                  </div>
                </div>
              </label>
            </div>

            <div class="video-upload-actions">
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
import { getTeacherCourseOptions, uploadTeacherVideo, type TeacherCourseOption } from '@/services/teacher'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const courseOptions = ref<TeacherCourseOption[]>([])
const selectedVideo = ref<File | null>(null)
const selectedCover = ref<File | null>(null)
const videoInputRef = ref<HTMLInputElement | null>(null)
const coverInputRef = ref<HTMLInputElement | null>(null)
const videoDuration = ref<number | null>(null)
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const form = reactive({
  courseId: '',
  videoTitle: '',
  description: '',
})

const headerText = computed(() => {
  const name = authStore.profile?.name || authStore.profile?.username || '教师用户'
  return `${name}，在这里上传课程讲解、案例演示与实验操作等教学视频。`
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

function chooseVideoFile() {
  videoInputRef.value?.click()
}

function chooseCoverFile() {
  coverInputRef.value?.click()
}

function resetForm() {
  form.courseId = ''
  form.videoTitle = ''
  form.description = ''
  selectedVideo.value = null
  selectedCover.value = null
  videoDuration.value = null
  clearMessages()

  if (videoInputRef.value) {
    videoInputRef.value.value = ''
  }

  if (coverInputRef.value) {
    coverInputRef.value.value = ''
  }
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

async function submitVideo() {
  clearMessages()

  if (!form.courseId) {
    errorMessage.value = '请选择所属课程'
    return
  }

  if (!form.videoTitle) {
    errorMessage.value = '请输入视频标题'
    return
  }

  if (!selectedVideo.value) {
    errorMessage.value = '请先选择视频文件'
    return
  }

  submitting.value = true

  try {
    const result = await uploadTeacherVideo({
      courseId: form.courseId,
      videoTitle: form.videoTitle,
      description: form.description,
      duration: videoDuration.value,
      video: selectedVideo.value,
      cover: selectedCover.value,
    })

    resetForm()
    successMessage.value = `视频《${result.videoTitle}》上传成功，已归档到《${result.courseName}》。`
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '视频上传失败'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadCourseOptions()
})
</script>
