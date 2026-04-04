<template>
  <AuthLayout
    hero-eyebrow="TEACHER PREP PORTAL"
    hero-title="在线教师备课系统"
    hero-description="围绕课程、资料与视频的统一备课平台，教师登录后即可进入今日备课工作台。"
    panel-title="系统公告"
    :stats="stats"
    :notes="notes"
  >
    <div class="auth-card">
      <h2>欢迎回来</h2>
      <p class="auth-card__sub">请输入用户名和密码，进入今日备课工作台</p>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="auth-field">
          <label for="username">用户名</label>
          <input id="username" v-model.trim="form.username" type="text" placeholder="请输入教师账号或管理员账号" />
        </div>

        <div class="auth-field">
          <label for="password">密码</label>
          <input id="password" v-model="form.password" type="password" placeholder="请输入登录密码" />
        </div>

        <p v-if="errorMessage" class="feedback-text feedback-text--error">{{ errorMessage }}</p>

        <button class="auth-btn" type="submit" :disabled="loading">
          {{ loading ? '登录中...' : '登录系统' }}
        </button>

        <div class="auth-actions">
          <button class="auth-btn--secondary" type="button" @click="router.push('/register')">教师注册</button>
          <button class="auth-btn--secondary" type="button" @click="scrollToTip">查看公告</button>
        </div>
      </form>

      <div ref="tipRef" class="auth-tip">
        <div class="auth-tip__title">登录提示</div>
        <ul>
          <li>教师端可上传资料、视频并管理本人资源</li>
          <li>管理员端可维护课程、资源、教学交流与公告</li>
        </ul>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import http from '@/services/http'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const tipRef = ref<HTMLElement | null>(null)
const loading = ref(false)
const errorMessage = ref('')

const form = reactive({
  username: '',
  password: '',
})

const stats = [
  { label: '课程总量', value: '128' },
  { label: '资料总量', value: '2860' },
  { label: '视频总量', value: '640' },
]

const notes = [
  '教师登录后进入教师中心首页',
  '管理员登录后进入后台控制台',
  '课程详情可查看资料与视频',
]

function scrollToTip() {
  tipRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function handleSubmit() {
  if (!form.username || !form.password) {
    errorMessage.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await http.post('/auth/login', form)
    const payload = response.data.data

    authStore.setAuth({
      token: payload.token,
      role: payload.role,
      profile: payload.user,
    })

    await router.push(payload.role === 'admin' ? '/admin' : '/teacher')
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '登录失败，请检查账号或密码'
  } finally {
    loading.value = false
  }
}
</script>
