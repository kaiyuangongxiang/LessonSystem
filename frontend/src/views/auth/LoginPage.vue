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
      <div class="auth-actions auth-actions--tabs">
        <button
          :class="['auth-btn--secondary', 'auth-role-btn', selectedRole === 'teacher' ? 'is-active' : '']"
          type="button"
          @click="selectedRole = 'teacher'"
        >
          教师登录
        </button>
        <button
          :class="['auth-btn--secondary', 'auth-role-btn', selectedRole === 'admin' ? 'is-active' : '']"
          type="button"
          @click="selectedRole = 'admin'"
        >
          管理员登录
        </button>
      </div>

      <h2>{{ selectedRole === 'teacher' ? '教师登录' : '管理员登录' }}</h2>
      <p class="auth-card__sub">
        {{ selectedRole === 'teacher' ? '请输入教师账号和密码，进入今日备课工作台' : '请输入管理员账号和密码，进入后台管理中心' }}
      </p>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="auth-field">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model.trim="form.username"
            type="text"
            :placeholder="selectedRole === 'teacher' ? '请输入教师账号' : '请输入管理员账号'"
          />
        </div>

        <div class="auth-field">
          <label for="password">密码</label>
          <input id="password" v-model="form.password" type="password" :placeholder="selectedRole === 'teacher' ? '请输入教师登录密码' : '请输入管理员登录密码'" />
        </div>

        <p v-if="errorMessage" class="feedback-text feedback-text--error">{{ errorMessage }}</p>

        <button class="auth-btn" type="submit" :disabled="loading">
          {{ loading ? '登录中...' : selectedRole === 'teacher' ? '教师登录' : '管理员登录' }}
        </button>
      </form>

      <RouterLink v-if="selectedRole === 'teacher'" class="auth-inline-link" to="/register">
        没有账号，注册账号？
      </RouterLink>

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
import { reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import http from '@/services/http'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const errorMessage = ref('')
const selectedRole = ref<'teacher' | 'admin'>('admin')

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

watch(
  () => route.query.role,
  (role) => {
    selectedRole.value = role === 'teacher' ? 'teacher' : 'admin'
  },
  { immediate: true },
)

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

    if (payload.role !== selectedRole.value) {
      errorMessage.value = selectedRole.value === 'teacher' ? '当前账号不是教师账号' : '当前账号不是管理员账号'
      return
    }

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
