<template>
  <main class="message-detail-page">
    <header class="online-message-nav">
      <div>
        <div class="online-message-nav__eyebrow">DISCUSSION DETAIL</div>
        <h1>讨论详情</h1>
        <p>{{ detail.topic.title || '查看交流主题与回复内容' }}</p>
      </div>

      <div class="online-message-nav__actions">
        <button type="button" class="course-chip" @click="router.push('/teacher/profile')">个人资料</button>
        <button type="button" class="course-chip" @click="router.push('/teacher/messages')">返回交流列表</button>
        <button type="button" class="course-chip course-chip--soft" @click="router.push('/')">返回首页</button>
      </div>
    </header>

    <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>

    <section class="message-detail-topic">
      <div>
        <div class="message-detail-topic__eyebrow">TOPIC OVERVIEW</div>
        <h2>{{ detail.topic.title }}</h2>
        <p>{{ detail.topic.content }}</p>
      </div>
      <div class="message-detail-topic__meta">
        <span>{{ detail.topic.authorName }}</span>
        <strong>{{ detail.topic.statusLabel }}</strong>
        <span>{{ detail.topic.publishDate }}</span>
      </div>
    </section>

    <section class="message-detail-grid">
      <article class="online-message-panel">
        <div class="online-message-panel__head">
          <div>
            <div class="online-message-panel__eyebrow">REPLIES</div>
            <h3>讨论内容</h3>
          </div>
        </div>

        <div v-if="detail.replies.length" class="message-detail-list">
          <article v-for="reply in detail.replies" :key="reply.id" class="message-detail-item">
            <strong>{{ reply.authorName }}</strong>
            <p>{{ reply.content }}</p>
            <span>{{ reply.replyTime }}</span>
          </article>
        </div>
        <div v-else class="course-detail-empty">当前还没有回复内容，先补充第一条讨论吧。</div>
      </article>

      <article class="online-message-panel">
        <div class="online-message-panel__head">
          <div>
            <div class="online-message-panel__eyebrow">CONTINUE DISCUSSION</div>
            <h3>继续回复</h3>
          </div>
        </div>

        <form class="online-message-form" @submit.prevent="submitReply">
          <label class="online-message-field">
            <span>回复内容</span>
            <textarea v-model.trim="replyContent" maxlength="5000" rows="10" placeholder="请输入你的补充说明、教学建议或资源经验"></textarea>
          </label>

          <div class="online-message-actions">
            <button type="submit" class="auth-btn" :disabled="submitting">{{ submitting ? '发布中...' : '发布回复' }}</button>
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="submitting" @click="replyContent = ''">清空内容</button>
          </div>
        </form>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import http from '@/services/http'

interface ReplyItem {
  id: number
  content: string
  authorName: string
  replyTime: string
}

interface DetailResponse {
  topic: {
    id: number
    title: string
    content: string
    authorName: string
    publishDate: string
    statusLabel: string
  }
  replies: ReplyItem[]
}

const route = useRoute()
const router = useRouter()
const errorMessage = ref('')
const submitting = ref(false)
const replyContent = ref('')

const detail = reactive<DetailResponse>({
  topic: {
    id: 0,
    title: '教学交流主题',
    content: '这里将展示当前主题的正文内容。',
    authorName: '教师用户',
    publishDate: '待更新',
    statusLabel: '讨论中',
  },
  replies: [],
})

async function loadDetail() {
  errorMessage.value = ''

  try {
    const response = await http.get(`/teacher/messages/${route.params.messageId}`)
    const data = response.data.data as DetailResponse
    detail.topic = data.topic
    detail.replies = data.replies
  } catch (error: any) {
    detail.replies = []
    errorMessage.value = error?.response?.data?.message || '讨论详情加载失败'
  }
}

async function submitReply() {
  if (!replyContent.value) {
    errorMessage.value = '请先填写回复内容'
    return
  }

  submitting.value = true
  errorMessage.value = ''

  try {
    await http.post(`/teacher/messages/${route.params.messageId}/replies`, {
      content: replyContent.value,
    })
    replyContent.value = ''
    await loadDetail()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '发布回复失败'
  } finally {
    submitting.value = false
  }
}

watch(
  () => route.params.messageId,
  () => {
    loadDetail()
  },
  { immediate: true },
)
</script>
