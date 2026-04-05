<template>
  <AuthLayout
    hero-eyebrow="TEACHER ONBOARDING"
    hero-title="创建教师账号"
    hero-description="完成基础信息登记后即可进入教师中心，开始上传资料、视频并管理个人课程内容。"
    panel-title="注册完成后"
    :notes="notes"
  >
    <div class="auth-card auth-card--register auth-card--register-compact">
      <h2>教师快速注册</h2>
      <p class="auth-card__sub">邮箱和个人简介为选填，其余信息均为必填。</p>

      <form class="auth-form auth-form--register auth-form--register-compact" @submit.prevent="handleSubmit">
        <div class="auth-form__row auth-form__row--register">
          <div class="auth-field">
            <label for="teacherName">姓名 <span class="auth-required">*</span></label>
            <input id="teacherName" v-model.trim="form.teacherName" type="text" maxlength="50" placeholder="请输入教师真实姓名" />
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
            <textarea id="profile" v-model.trim="form.profile" maxlength="2000" placeholder="可填写研究方向、授课课程或个人简介"></textarea>
          </div>
        </div>

        <p v-if="feedback.message" :class="['feedback-text', feedback.type === 'error' ? 'feedback-text--error' : 'feedback-text--success']">
          {{ feedback.message }}
        </p>

        <button class="auth-btn" type="submit" :disabled="loading">
          {{ loading ? '注册中...' : '立即注册' }}
        </button>

        <button class="auth-btn--secondary" type="button" @click="goTeacherLogin">返回登录</button>
      </form>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import http from '@/services/http'

interface RegisterCollegeOption {
  id: number
  name: string
}

interface RegisterOptionsResponse {
  colleges: RegisterCollegeOption[]
  genders: string[]
}

const router = useRouter()
const loading = ref(false)
const registerOptionsLoading = ref(false)
const feedback = reactive({
  type: 'error',
  message: '',
})

const form = reactive({
  teacherName: '',
  username: '',
  password: '',
  confirmPassword: '',
  gender: '',
  collegeId: '',
  email: '',
  profile: '',
})

const defaultGenders = ['男', '女', '未知']

const registerOptions = reactive<RegisterOptionsResponse>({
  colleges: [],
  genders: [...defaultGenders],
})

const notes = ['进入教师工作台', '上传资料与视频', '继续完善个人资料']

function goTeacherLogin() {
  router.push({ path: '/login', query: { role: 'teacher' } })
}

async function loadRegisterOptions() {
  registerOptionsLoading.value = true

  try {
    const response = await http.get('/auth/register-options')
    registerOptions.colleges = response.data.data.colleges || []
    registerOptions.genders = response.data.data.genders?.length ? response.data.data.genders : [...defaultGenders]
  } catch (error: any) {
    registerOptions.colleges = []
    registerOptions.genders = [...defaultGenders]
  } finally {
    registerOptionsLoading.value = false
  }
}

async function handleSubmit() {
  if (!form.teacherName || !form.username || !form.gender || !form.collegeId || !form.password || !form.confirmPassword) {
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
      teacherName: form.teacherName,
      username: form.username,
      password: form.password,
      gender: form.gender,
      collegeId: form.collegeId || undefined,
      email: form.email,
      profile: form.profile,
    })

    feedback.type = 'success'
    feedback.message = '注册成功，正在返回教师登录页'
    setTimeout(() => {
      goTeacherLogin()
    }, 800)
  } catch (error: any) {
    feedback.type = 'error'
    feedback.message = error?.response?.data?.message || '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadRegisterOptions()
})
</script>
