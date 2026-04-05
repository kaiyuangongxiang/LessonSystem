<template>
  <main class="teacher-dashboard-page">
    <aside class="teacher-dashboard-sidebar">
      <div>
        <div class="teacher-dashboard-sidebar__eyebrow">TEACHER WORKSPACE</div>
        <h1>教师中心</h1>
      </div>

      <nav class="teacher-dashboard-nav">
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/teacher')">总览首页</button>
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/teacher/materials')">资源上传</button>
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/teacher/resources')">我的资源</button>
        <button type="button" class="teacher-dashboard-nav__item is-active">个人资料</button>
      </nav>
    </aside>

    <section class="teacher-dashboard-main teacher-profile-main">
      <header class="teacher-profile-head">
        <div>
          <div class="teacher-profile-head__eyebrow">PROFILE SETTINGS</div>
          <h2>教师个人资料管理</h2>
          <p>{{ headerText }}</p>
        </div>

        <div class="teacher-profile-head__actions">
          <button type="button" class="auth-btn" :disabled="loading || saving" @click="openEditor">
            {{ saving ? '保存中...' : '编辑资料' }}
          </button>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success teacher-profile-feedback">{{ successMessage }}</p>

      <article class="teacher-profile-panel teacher-profile-panel--preview">
        <div class="teacher-profile-panel__head teacher-profile-panel__head--preview">
          <div>
            <div class="teacher-profile-panel__eyebrow">PROFILE SUMMARY</div>
            <h3>资料预览</h3>
          </div>
          <span class="teacher-profile-panel__status">{{ selectedCollegeName }}</span>
        </div>

        <div class="teacher-profile-summary teacher-profile-summary--wide">
          <div class="teacher-profile-summary__item" v-for="item in previewItems" :key="item.label">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>

          <div class="teacher-profile-summary__item teacher-profile-summary__item--full">
            <span>个人简介</span>
            <strong>{{ profileText }}</strong>
          </div>
        </div>

        <div class="teacher-profile-note teacher-profile-note--full">
          <strong>说明</strong>
          <p>这里展示当前已保存的教师资料。点击右上角“编辑资料”后会在弹窗中修改，保存成功后下方预览会立即同步更新。</p>
        </div>
      </article>
    </section>

    <div v-if="showEditor" class="teacher-profile-editor-mask" @click.self="closeEditor">
      <section class="teacher-profile-editor">
        <div class="teacher-profile-editor__head">
          <div>
            <div class="teacher-profile-panel__eyebrow">BASIC INFO</div>
            <h3>编辑基础资料</h3>
          </div>
          <button type="button" class="course-chip course-chip--soft" :disabled="saving" @click="closeEditor">关闭</button>
        </div>

        <form class="teacher-profile-form" @submit.prevent="submitProfile">
          <div class="teacher-profile-form__row">
            <label class="teacher-profile-field">
              <span>用户名</span>
              <input v-model.trim="editForm.username" type="text" maxlength="50" placeholder="请输入用户名" />
            </label>

            <label class="teacher-profile-field">
              <span>教师姓名</span>
              <input v-model.trim="editForm.teacherName" type="text" maxlength="50" placeholder="请输入教师姓名" />
            </label>
          </div>

          <div class="teacher-profile-form__row">
            <label class="teacher-profile-field">
              <span>性别</span>
              <select v-model="editForm.gender">
                <option value="">请选择性别</option>
                <option v-for="item in genderOptions" :key="item" :value="item">
                  {{ item }}
                </option>
              </select>
            </label>

            <label class="teacher-profile-field">
              <span>所属学院</span>
              <select v-model="editForm.collegeId">
                <option value="">请选择所属学院</option>
                <option v-for="college in collegeOptions" :key="college.id" :value="String(college.id)">
                  {{ college.name }}
                </option>
              </select>
            </label>
          </div>

          <div class="teacher-profile-form__row">
            <label class="teacher-profile-field teacher-profile-field--full">
              <span>邮箱</span>
              <input v-model.trim="editForm.email" type="email" maxlength="100" placeholder="请输入邮箱，可为空" />
            </label>
          </div>

          <div class="teacher-profile-form__row">
            <label class="teacher-profile-field teacher-profile-field--full">
              <span>个人简介</span>
              <textarea v-model.trim="editForm.profile" rows="7" maxlength="2000" placeholder="请输入个人简介，可为空"></textarea>
            </label>
          </div>

          <div class="teacher-profile-editor__actions">
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="saving" @click="closeEditor">取消</button>
            <button type="submit" class="auth-btn" :disabled="saving">{{ saving ? '保存中...' : '保存资料' }}</button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  getTeacherProfile,
  updateTeacherProfile,
  type TeacherCourseOption,
  type TeacherProfileFormData,
} from '@/services/teacher'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const showEditor = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const collegeOptions = ref<TeacherCourseOption[]>([])
const genderOptions = ref<string[]>([])
const originalProfile = ref<TeacherProfileFormData | null>(null)

const editForm = reactive({
  username: '',
  teacherName: '',
  gender: '',
  email: '',
  collegeId: '',
  profile: '',
})

const headerText = computed(() => {
  const name = originalProfile.value?.teacherName || authStore.profile?.name || authStore.profile?.username || '教师用户'
  return `${name}，你可以在这里查看当前资料，并通过弹窗更新教师账户的基础信息。`
})

const selectedCollegeName = computed(() => {
  const collegeId = originalProfile.value?.collegeId
  const college = collegeOptions.value.find((item) => String(item.id) === String(collegeId))
  return college?.name || originalProfile.value?.collegeName || '未选择'
})

const profileText = computed(() => originalProfile.value?.profile?.trim() || '暂未填写个人简介')

const previewItems = computed(() => [
  { label: '当前用户名', value: originalProfile.value?.username || '未填写' },
  { label: '教师姓名', value: originalProfile.value?.teacherName || '未填写' },
  { label: '性别', value: originalProfile.value?.gender || '未填写' },
  { label: '联系邮箱', value: originalProfile.value?.email || '未填写' },
])

function fillEditForm(profile: TeacherProfileFormData) {
  editForm.username = profile.username || ''
  editForm.teacherName = profile.teacherName || ''
  editForm.gender = profile.gender || ''
  editForm.email = profile.email || ''
  editForm.collegeId = profile.collegeId ? String(profile.collegeId) : ''
  editForm.profile = profile.profile || ''
}

function openEditor() {
  if (originalProfile.value) {
    fillEditForm(originalProfile.value)
  }

  errorMessage.value = ''
  successMessage.value = ''
  showEditor.value = true
}

function closeEditor() {
  showEditor.value = false
}

async function loadProfile() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await getTeacherProfile()
    originalProfile.value = result.profile
    collegeOptions.value = result.options.colleges
    genderOptions.value = result.options.genders
    fillEditForm(result.profile)
  } catch (error: any) {
    originalProfile.value = null
    collegeOptions.value = []
    genderOptions.value = ['男', '女', '未知']
    errorMessage.value = error?.response?.data?.message || '教师资料加载失败'
  } finally {
    loading.value = false
  }
}

async function submitProfile() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!editForm.username || !editForm.teacherName || !editForm.gender || !editForm.collegeId) {
    errorMessage.value = '请完整填写基础信息'
    return
  }

  saving.value = true

  try {
    const result = await updateTeacherProfile({
      username: editForm.username,
      teacherName: editForm.teacherName,
      gender: editForm.gender,
      email: editForm.email,
      collegeId: editForm.collegeId,
      profile: editForm.profile,
    })

    originalProfile.value = result
    fillEditForm(result)
    authStore.updateProfile({
      id: result.id,
      username: result.username,
      name: result.teacherName,
    })
    showEditor.value = false
    successMessage.value = '教师个人资料已更新'
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '教师资料保存失败'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>
