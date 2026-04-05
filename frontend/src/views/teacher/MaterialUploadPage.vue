<template>
  <main class="material-upload-page">
    <aside class="material-upload-sidebar">
      <div>
        <div class="material-upload-sidebar__eyebrow">TEACHER WORKSPACE</div>
        <h1>教师中心</h1>
      </div>

      <nav class="material-upload-nav">
        <button type="button" class="material-upload-nav__item" @click="router.push('/teacher')">工作台首页</button>
        <button type="button" class="material-upload-nav__item" @click="router.push('/teacher/messages')">教学交流</button>
        <button type="button" class="material-upload-nav__item is-active">资料上传</button>
        <button type="button" class="material-upload-nav__item" @click="router.push('/teacher/videos')">视频上传</button>
        <button type="button" class="material-upload-nav__item" @click="router.push('/teacher/resources')">我的资源</button>
        <button type="button" class="material-upload-nav__item" @click="router.push('/teacher/profile')">个人资料</button>
      </nav>
    </aside>

    <section class="material-upload-main">
      <header class="material-upload-head">
        <div>
          <div class="material-upload-head__eyebrow">COURSE MATERIALS</div>
          <h2>上传课程资料</h2>
          <p>{{ headerText }}</p>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success material-upload-feedback">{{ successMessage }}</p>
      <div v-if="!loading && !courseOptions.length && !errorMessage" class="course-detail-empty">当前还没有可上传资料的课程，请先确认教师账号下已有课程。</div>

      <section class="material-upload-grid">
        <article class="material-upload-panel material-upload-panel--form">
          <div class="material-upload-panel__head">
            <div>
              <div class="material-upload-panel__eyebrow">MATERIAL INFO</div>
              <h3>资料信息</h3>
            </div>
          </div>

          <form class="material-upload-form" @submit.prevent="submitMaterial">
            <div class="material-upload-form__row">
              <label class="material-upload-field">
                <span>资料名称</span>
                <input v-model.trim="form.materialName" type="text" maxlength="200" placeholder="请输入资料名称，如《数据库实验指导书》" />
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
              <span>资料说明</span>
              <textarea
                v-model.trim="form.description"
                maxlength="2000"
                rows="4"
                placeholder="填写资料用途、适用章节或更新说明"
              ></textarea>
            </label>

            <label class="material-upload-field material-upload-field--file">
              <span>资料文件</span>
              <input
                ref="fileInputRef"
                class="material-upload-file-input"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                @change="handleFileChange"
              />

              <div class="material-upload-dropzone" @click="chooseFile">
                <div class="material-upload-dropzone__main">
                  <div class="material-upload-dropzone__icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 16V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                      <path d="M8.5 10.5 12 7l3.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M6 17.5h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                    </svg>
                  </div>
                  <div>
                    <strong>{{ selectedFile ? selectedFile.name : '选择本地资料文件' }}</strong>
                    <p>{{ selectedFile ? `文件大小 ${formatFileSize(selectedFile.size)}` : '支持 PDF、DOC、DOCX、PPT、PPTX，单文件不超过 100MB' }}</p>
                  </div>
                </div>

                <div class="material-upload-dropzone__actions">
                  <button type="button" class="material-upload-file-button">{{ selectedFile ? '重新选择' : '点击选择' }}</button>
                  <span v-if="selectedFile" class="material-upload-file-tag">已选择</span>
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
import { getTeacherCourseOptions, uploadTeacherMaterial, type TeacherCourseOption } from '@/services/teacher'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const courseOptions = ref<TeacherCourseOption[]>([])
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const form = reactive({
  courseId: '',
  materialName: '',
  description: '',
})

const headerText = computed(() => {
  const name = authStore.profile?.name || authStore.profile?.username || '教师用户'
  return `${name}，在这里上传讲义、课件和实验指导等文档资料。`
})

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(2)} MB`
  }

  return `${(size / 1024).toFixed(2)} KB`
}

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function chooseFile() {
  fileInputRef.value?.click()
}

function resetForm() {
  form.courseId = ''
  form.materialName = ''
  form.description = ''
  selectedFile.value = null
  clearMessages()

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function handleFileChange(event: Event) {
  clearMessages()
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null

  if (!file) {
    selectedFile.value = null
    return
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx']

  if (!allowedExtensions.includes(extension)) {
    input.value = ''
    selectedFile.value = null
    errorMessage.value = '仅支持 PDF、DOC、DOCX、PPT、PPTX 格式资料'
    return
  }

  if (file.size > 100 * 1024 * 1024) {
    input.value = ''
    selectedFile.value = null
    errorMessage.value = '资料文件大小不能超过 100MB'
    return
  }

  selectedFile.value = file
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

async function submitMaterial() {
  clearMessages()

  if (!form.courseId) {
    errorMessage.value = '请选择所属课程'
    return
  }

  if (!form.materialName) {
    errorMessage.value = '请输入资料名称'
    return
  }

  if (!selectedFile.value) {
    errorMessage.value = '请先选择资料文件'
    return
  }

  submitting.value = true

  try {
    const result = await uploadTeacherMaterial({
      courseId: form.courseId,
      materialName: form.materialName,
      description: form.description,
      file: selectedFile.value,
    })

    resetForm()
    successMessage.value = `资料《${result.materialName}》上传成功，已归档到《${result.courseName}》。`
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '资料上传失败'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadCourseOptions()
})
</script>
