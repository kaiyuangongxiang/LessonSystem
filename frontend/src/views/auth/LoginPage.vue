<template>
  <AuthLayout
    hero-eyebrow="LESSON PREP PORTAL"
    hero-title="在线教师备课系统"
    hero-description="围绕课程、资料、视频与教学交流的统一入口，教师、学生和管理员都可从这里进入各自工作台。"
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
          :class="['auth-btn--secondary', 'auth-role-btn', selectedRole === 'student' ? 'is-active' : '']"
          type="button"
          @click="selectedRole = 'student'"
        >
          学生登录
        </button>
        <button
          :class="['auth-btn--secondary', 'auth-role-btn', selectedRole === 'admin' ? 'is-active' : '']"
          type="button"
          @click="selectedRole = 'admin'"
        >
          管理员登录
        </button>
      </div>

      <h2>{{ roleTitle }}</h2>
      <p class="auth-card__sub">{{ roleDescription }}</p>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="auth-field">
          <label for="username">用户名</label>
          <input id="username" v-model.trim="form.username" type="text" :placeholder="rolePlaceholder.username" />
        </div>

        <div class="auth-field">
          <label for="password">密码</label>
          <input id="password" v-model="form.password" type="password" :placeholder="rolePlaceholder.password" />
        </div>

        <p v-if="errorMessage" class="feedback-text feedback-text--error">{{ errorMessage }}</p>

        <button class="auth-btn" type="submit" :disabled="loading">
          {{ loading ? '登录中...' : roleTitle }}
        </button>
      </form>

      <RouterLink v-if="selectedRole !== 'admin'" class="auth-inline-link" :to="`/register?role=${selectedRole}`">
        没有账号，注册账号？
      </RouterLink>

      <div ref="tipRef" class="auth-tip">
        <div class="auth-tip__title">登录提示</div>
        <ul>
          <li>教师端可上传资源、维护个人资料并参与教学交流</li>
          <li>学生端当前可进入学生中心，后续会逐步接入课程学习与留言功能</li>
          <li>管理员端可维护账号、课程、资源和系统内容</li>
        </ul>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import http from '@/services/http'
import { useAuthStore } from '@/stores/auth'

type LoginRole = 'teacher' | 'student' | 'admin'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const errorMessage = ref('')
const selectedRole = ref<LoginRole>('teacher')

const form = reactive({
  username: '',
  password: '',
})

const stats = [
  { label: '课程总量', value: '128' },
  { label: '资料总量', value: '2860' },
  { label: '交流主题', value: '96' },
]

const notes = ['教师、学生、管理员统一入口', '教学资源与交流逐步联通', '支持多角色登录跳转']

const roleTitle = computed(() => {
  if (selectedRole.value === 'student') {
    return '学生登录'
  }

  if (selectedRole.value === 'admin') {
    return '管理员登录'
  }

  return '教师登录'
})

const roleDescription = computed(() => {
  if (selectedRole.value === 'student') {
    return '请输入学生账号和密码，进入学生中心。'
  }

  if (selectedRole.value === 'admin') {
    return '请输入管理员账号和密码，进入后台管理中心。'
  }

  return '请输入教师账号和密码，进入教师工作台。'
})

const rolePlaceholder = computed(() => {
  if (selectedRole.value === 'student') {
    return {
      username: '请输入学生账号',
      password: '请输入学生登录密码',
    }
  }

  if (selectedRole.value === 'admin') {
    return {
      username: '请输入管理员账号',
      password: '请输入管理员登录密码',
    }
  }

  return {
    username: '请输入教师账号',
    password: '请输入教师登录密码',
  }
})

function resolveRole(value: unknown): LoginRole {
  if (value === 'student') {
    return 'student'
  }

  if (value === 'admin') {
    return 'admin'
  }

  return 'teacher'
}

watch(
  () => route.query.role,
  (role) => {
    selectedRole.value = resolveRole(role)
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
    const response = await http.post('/auth/login', {
      ...form,
      role: selectedRole.value,
    })
    const payload = response.data.data

    if (payload.role !== selectedRole.value) {
      errorMessage.value = `当前账号不是${roleTitle.value.replace('登录', '')}账号`
      return
    }

    authStore.setAuth({
      token: payload.token,
      role: payload.role,
      profile: payload.user,
    })

    if (payload.role === 'admin') {
      await router.push('/admin')
    } else if (payload.role === 'student') {
      await router.push('/student')
    } else {
      await router.push('/teacher')
    }
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '登录失败，请检查账号或密码'
  } finally {
    loading.value = false
  }
}
</script>
