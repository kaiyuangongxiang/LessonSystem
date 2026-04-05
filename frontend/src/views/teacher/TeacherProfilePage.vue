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
          <button type="button" class="auth-btn auth-btn--secondary" :disabled="saving" @click="resetForm">恢复原值</button>
          <button type="button" class="auth-btn" :disabled="saving" @click="submitProfile">
            {{ saving ? '保存中...' : '保存资料' }}
          </button>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success teacher-profile-feedback">{{ successMessage }}</p>

      <section class="teacher-profile-grid">
        <article class="teacher-profile-panel teacher-profile-panel--form">
          <div class="teacher-profile-panel__head">
            <div>
              <div class="teacher-profile-panel__eyebrow">BASIC INFO</div>
              <h3>基础资料</h3>
            </div>
          </div>

          <form class="teacher-profile-form" @submit.prevent="submitProfile">
            <div class="teacher-profile-form__row">
              <label class="teacher-profile-field">
                <span>用户名</span>
                <input v-model.trim="form.username" type="text" maxlength="50" placeholder="请输入用户名" />
              </label>

              <label class="teacher-profile-field">
                <span>教师姓名</span>
                <input v-model.trim="form.teacherName" type="text" maxlength="50" placeholder="请输入教师姓名" />
              </label>
            </div>

            <div class="teacher-profile-form__row">
              <label class="teacher-profile-field">
                <span>性别</span>
                <select v-model="form.gender">
                  <option value="">请选择性别</option>
                  <option v-for="item in genderOptions" :key="item" :value="item">
                    {{ item }}
                  </option>
                </select>
              </label>

              <label class="teacher-profile-field">
                <span>所属学院</span>
                <select v-model="form.collegeId">
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
                <input v-model.trim="form.email" type="email" maxlength="100" placeholder="请输入邮箱，可为空" />
              </label>
            </div>

            <div class="teacher-profile-form__row">
              <label class="teacher-profile-field teacher-profile-field--full">
                <span>个人简介</span>
                <textarea v-model.trim="form.profile" rows="7" maxlength="2000" placeholder="请输入个人简介，可为空"></textarea>
              </label>
            </div>
          </form>
        </article>

        <article class="teacher-profile-panel teacher-profile-panel--summary">
          <div class="teacher-profile-panel__head">
            <div>
              <div class="teacher-profile-panel__eyebrow">PROFILE SUMMARY</div>
              <h3>资料预览</h3>
            </div>
          </div>

          <div class="teacher-profile-summary">
            <div class="teacher-profile-summary__item">
              <span>当前用户名</span>
              <strong>{{ form.username || '未填写' }}</strong>
            </div>
            <div class="teacher-profile-summary__item">
              <span>教师姓名</span>
              <strong>{{ form.teacherName || '未填写' }}</strong>
            </div>
            <div class="teacher-profile-summary__item">
              <span>所属学院</span>
              <strong>{{ selectedCollegeName }}</strong>
            </div>
            <div class="teacher-profile-summary__item">
              <span>联系邮箱</span>
              <strong>{{ form.email || '未填写' }}</strong>
            </div>
          </div>

          <div class="teacher-profile-note">
            <strong>说明</strong>
            <p>修改后会立即保存到教师账户信息中，后续教师端页面展示名称也会同步更新。</p>
          </div>
        </article>
      </section>
    </section>
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
const errorMessage = ref('')
const successMessage = ref('')
const collegeOptions = ref<TeacherCourseOption[]>([])
const genderOptions = ref<string[]>([])
const originalProfile = ref<TeacherProfileFormData | null>(null)

const form = reactive({
  username: '',
  teacherName: '',
  gender: '',
  email: '',
  collegeId: '',
  profile: '',
})

const headerText = computed(() => {
  const name = originalProfile.value?.teacherName || authStore.profile?.name || authStore.profile?.username || '教师用户'
  return `${name}，你可以在这里维护教师账号的基础信息。`
})

const selectedCollegeName = computed(() => {
  const college = collegeOptions.value.find((item) => String(item.id) === form.collegeId)
  return college?.name || '未选择'
})

function fillForm(profile: TeacherProfileFormData) {
  form.username = profile.username || ''
  form.teacherName = profile.teacherName || ''
  form.gender = profile.gender || ''
  form.email = profile.email || ''
  form.collegeId = profile.collegeId ? String(profile.collegeId) : ''
  form.profile = profile.profile || ''
}

function resetForm() {
  if (!originalProfile.value) {
    return
  }

  fillForm(originalProfile.value)
  errorMessage.value = ''
  successMessage.value = ''
}

async function loadProfile() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await getTeacherProfile()
    originalProfile.value = result.profile
    collegeOptions.value = result.options.colleges
    genderOptions.value = result.options.genders
    fillForm(result.profile)
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

  if (!form.username || !form.teacherName || !form.gender || !form.collegeId) {
    errorMessage.value = '请完整填写基础信息'
    return
  }

  saving.value = true

  try {
    const result = await updateTeacherProfile({
      username: form.username,
      teacherName: form.teacherName,
      gender: form.gender,
      email: form.email,
      collegeId: form.collegeId,
      profile: form.profile,
    })

    originalProfile.value = result
    fillForm(result)
    authStore.updateProfile({
      id: result.id,
      username: result.username,
      name: result.teacherName,
    })
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
