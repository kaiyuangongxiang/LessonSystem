<template>
  <AuthLayout
    hero-eyebrow="ACCOUNT REGISTER"
    :hero-title="selectedRole === 'student' ? '创建学生账号' : '创建教师账号'"
    hero-description="完成基础信息登记后即可进入对应工作台。邮箱和个人简介为选填，其他信息为必填。"
    panel-title="注册说明"
    :notes="notes"
  >
    <div class="auth-card auth-card--register auth-card--register-compact">
      <div class="auth-actions auth-actions--tabs">
        <button
          :class="['auth-btn--secondary', 'auth-role-btn', selectedRole === 'teacher' ? 'is-active' : '']"
          type="button"
          @click="changeRole('teacher')"
        >
          教师注册
        </button>
        <button
          :class="['auth-btn--secondary', 'auth-role-btn', selectedRole === 'student' ? 'is-active' : '']"
          type="button"
          @click="changeRole('student')"
        >
          学生注册
        </button>
      </div>

      <h2>{{ selectedRole === 'student' ? '学生快速注册' : '教师快速注册' }}</h2>
      <p class="auth-card__sub">邮箱和个人简介为选填，其余信息均为必填。</p>

      <form class="auth-form auth-form--register auth-form--register-compact" @submit.prevent="handleSubmit">
        <div class="auth-form__row auth-form__row--register">
          <div class="auth-field">
            <label for="displayName">姓名 <span class="auth-required">*</span></label>
            <input
              id="displayName"
              v-model.trim="form.displayName"
              type="text"
              maxlength="50"
              :placeholder="selectedRole === 'student' ? '请输入学生真实姓名' : '请输入教师真实姓名'"
            />
          </div>

          <div class="auth-field">
            <label for="username">用户名 <span class="auth-required">*</span></label>
            <input id="username" v-model.trim="form.username" type="text" maxlength="50" placeholder="请输入唯一用户名" />
          </div>
        </div>

        <div class="auth-form__row auth-form__row--register">
          <div class="auth-field">
            <label for="gender">性别 <span class="auth-required">*</span></label>
            <select id="gender" v-model="form.gender">
              <option value="">请选择性别</option>
              <option v-for="item in registerOptions.genders" :key="item" :value="item">
                {{ item }}
              </option>
            </select>
          </div>

          <div class="auth-field">
            <label for="collegeId">所属学院 <span class="auth-required">*</span></label>
            <select id="collegeId" v-model="form.collegeId">
              <option value="">请选择学院</option>
              <option v-for="college in registerOptions.colleges" :key="college.id" :value="String(college.id)">
                {{ college.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="auth-form__row auth-form__row--register">
          <div class="auth-field">
            <label for="password">密码 <span class="auth-required">*</span></label>
            <input id="password" v-model="form.password" type="password" maxlength="50" placeholder="至少 6 位，建议包含数字和字母" />
          </div>

          <div class="auth-field">
            <label for="confirmPassword">确认密码 <span class="auth-required">*</span></label>
            <input id="confirmPassword" v-model="form.confirmPassword" type="password" maxlength="50" placeholder="请再次输入密码" />
          </div>
        </div>

        <div class="auth-form__row auth-form__row--register">
          <div class="auth-field">
            <label for="email">邮箱</label>
            <input id="email" v-model.trim="form.email" type="email" maxlength="100" placeholder="请输入常用邮箱，可为空" />
          </div>

          <div class="auth-field auth-field--register-wide">
            <label for="profile">个人简介</label>
            <textarea id="profile" v-model.trim="form.profile" maxlength="2000" placeholder="可填写研究方向、学习方向或个人简介"></textarea>
          </div>
        </div>

        <p v-if="feedback.message" :class="['feedback-text', feedback.type === 'error' ? 'feedback-text--error' : 'feedback-text--success']">
          {{ feedback.message }}
        </p>

        <button class="auth-btn" type="submit" :disabled="loading">
          {{ loading ? '注册中...' : '立即注册' }}
        </button>

        <button class="auth-btn--secondary" type="button" @click="goLogin">返回登录</button>
      </form>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import http from '@/services/http'

type RegisterRole = 'teacher' | 'student'

interface RegisterCollegeOption {
  id: number
  name: string
}

interface RegisterOptionsResponse {
  colleges: RegisterCollegeOption[]
  genders: string[]
  roles?: string[]
}

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const feedback = reactive({
  type: 'error',
  message: '',
})

const form = reactive({
  displayName: '',
  username: '',
  password: '',
  confirmPassword: '',
  gender: '',
  collegeId: '',
  email: '',
  profile: '',
})

const selectedRole = ref<RegisterRole>('teacher')
const defaultGenders = ['男', '女', '未知']

const registerOptions = reactive<RegisterOptionsResponse>({
  colleges: [],
  genders: [...defaultGenders],
})

const notes = ['教师、学生都支持自助注册', '注册成功后跳回对应登录页', '学院与性别选项来自系统配置']

function resolveRole(value: unknown): RegisterRole {
  return value === 'student' ? 'student' : 'teacher'
}

function changeRole(role: RegisterRole) {
  selectedRole.value = role
  router.replace({ path: '/register', query: { role } })
}

function goLogin() {
  router.push({ path: '/login', query: { role: selectedRole.value } })
}

async function loadRegisterOptions() {
  try {
    const response = await http.get('/auth/register-options')
    registerOptions.colleges = response.data.data.colleges || []
    registerOptions.genders = response.data.data.genders?.length ? response.data.data.genders : [...defaultGenders]
  } catch {
    registerOptions.colleges = []
    registerOptions.genders = [...defaultGenders]
  }
}

async function handleSubmit() {
  if (!form.displayName || !form.username || !form.gender || !form.collegeId || !form.password || !form.confirmPassword) {
    feedback.type = 'error'
    feedback.message = '请完整填写必填信息'
    return
  }

  if (form.password !== form.confirmPassword) {
    feedback.type = 'error'
    feedback.message = '两次输入的密码不一致'
    return
  }

  loading.value = true
  feedback.message = ''

  try {
    await http.post('/auth/register', {
      role: selectedRole.value,
      username: form.username,
      password: form.password,
      gender: form.gender,
      collegeId: form.collegeId || undefined,
      email: form.email,
      profile: form.profile,
      ...(selectedRole.value === 'student' ? { studentName: form.displayName } : { teacherName: form.displayName }),
    })

    feedback.type = 'success'
    feedback.message = `注册成功，正在返回${selectedRole.value === 'student' ? '学生' : '教师'}登录页`
    setTimeout(() => {
      goLogin()
    }, 800)
  } catch (error: any) {
    feedback.type = 'error'
    feedback.message = error?.response?.data?.message || '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.query.role,
  (role) => {
    selectedRole.value = resolveRole(role)
  },
  { immediate: true },
)

onMounted(() => {
  loadRegisterOptions()
})
</script>
