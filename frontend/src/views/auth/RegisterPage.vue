<template>
  <AuthLayout
    hero-eyebrow="TEACHER ONBOARDING"
    hero-title="创建教师账号"
    hero-description="注册后即可进入教师中心，上传课程资料与教学视频，快速开始个人备课工作流。"
    panel-title="注册完成后可执行"
    :notes="notes"
  >
    <div class="auth-card auth-card--register">
      <h2>教师快速注册</h2>
      <p class="auth-card__sub">保留最小必要信息，先完成账号开通，再进入教师中心继续完善资料</p>

      <form class="auth-form auth-form--register" @submit.prevent="handleSubmit">
        <div class="auth-field">
          <label for="username">用户名</label>
          <input id="username" v-model.trim="form.username" type="text" placeholder="请输入唯一用户名" />
        </div>

        <div class="auth-form__row">
          <div class="auth-field">
            <label for="password">密码</label>
            <input id="password" v-model="form.password" type="password" placeholder="建议包含数字和字母" />
          </div>

          <div class="auth-field">
            <label for="confirmPassword">确认密码</label>
            <input id="confirmPassword" v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" />
          </div>
        </div>

        <p v-if="feedback.message" :class="['feedback-text', feedback.type === 'error' ? 'feedback-text--error' : 'feedback-text--success']">
          {{ feedback.message }}
        </p>

        <button class="auth-btn" type="submit" :disabled="loading">
          {{ loading ? '注册中...' : '立即注册' }}
        </button>

        <button class="auth-btn--secondary" type="button" @click="router.push('/login')">返回登录</button>
      </form>

      <div class="auth-tip auth-tip--register">
        <div class="auth-tip__title">注册规则</div>
        <ul>
          <li>用户名唯一，便于教师身份管理</li>
          <li>密码不能为空，建议 8 位以上</li>
          <li>不需要手机号与邮箱即可完成注册</li>
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

const router = useRouter()
const loading = ref(false)
const feedback = reactive({
  type: 'error',
  message: '',
})

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
})

const notes = ['进入教师工作台', '查看课程列表与课程详情', '上传资料、视频并管理资源']

async function handleSubmit() {
  if (!form.username || !form.password || !form.confirmPassword) {
    feedback.type = 'error'
    feedback.message = '请完整填写注册信息'
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
      username: form.username,
      password: form.password,
    })

    feedback.type = 'success'
    feedback.message = '注册成功，正在返回登录页'
    setTimeout(() => {
      router.push('/login')
    }, 800)
  } catch (error: any) {
    feedback.type = 'error'
    feedback.message = error?.response?.data?.message || '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>
