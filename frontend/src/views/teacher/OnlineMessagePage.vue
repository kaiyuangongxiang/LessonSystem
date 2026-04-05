<template>
  <main class="online-message-page">
    <header class="online-message-nav">
      <div>
        <div class="online-message-nav__eyebrow">ONLINE MESSAGE</div>
        <h1>教学交流</h1>
        <p>{{ headerText }}</p>
      </div>

      <div class="online-message-nav__actions">
        <button type="button" class="course-chip" @click="router.push('/teacher/profile')">个人资料</button>
        <button type="button" class="course-chip course-chip--soft" @click="router.push('/')">返回首页</button>
      </div>
    </header>

    <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>

    <section class="online-message-hero">
      <div>
        <div class="online-message-hero__eyebrow">TEACHER DISCUSSION</div>
        <h2>围绕课程资源、备课经验与教学问题发起交流</h2>
        <p>发布话题后，可直接在下方展开查看回复内容，并在当前页面继续讨论。</p>
      </div>
      <div class="online-message-hero__meta">
        <span>我的主题数</span>
        <strong>{{ pagination.total }}</strong>
      </div>
    </section>

    <section class="online-message-grid">
      <article class="online-message-panel online-message-panel--form">
        <div class="online-message-panel__head">
          <div>
            <div class="online-message-panel__eyebrow">PUBLISH TOPIC</div>
            <h3>发布话题</h3>
          </div>
        </div>

        <form class="online-message-form" @submit.prevent="submitMessage">
          <label class="online-message-field">
            <span>话题标题</span>
            <input v-model.trim="form.title" type="text" maxlength="100" placeholder="请输入交流主题标题" />
          </label>

          <label class="online-message-field">
            <span>话题内容</span>
            <textarea v-model.trim="form.content" maxlength="5000" rows="8" placeholder="请输入课程资源、教学问题或备课经验内容"></textarea>
          </label>

          <div class="online-message-tip">建议围绕课程资源、备课经验、教学问题等主题发起交流，方便后续持续讨论。</div>

          <div class="online-message-actions">
            <button type="submit" class="auth-btn" :disabled="submitting">{{ submitting ? '发布中...' : '发布话题' }}</button>
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="submitting" @click="resetForm">重置内容</button>
          </div>
        </form>
      </article>

      <article class="online-message-panel online-message-panel--list">
        <div class="online-message-panel__head online-message-panel__head--between">
          <div>
            <div class="online-message-panel__eyebrow">MY TOPICS</div>
            <h3>我的交流主题</h3>
          </div>
          <div class="online-message-total">共 {{ pagination.total }} 条交流主题</div>
        </div>

        <div v-if="visibleMessages.length" class="online-message-list">
          <article v-for="item in visibleMessages" :key="item.id" class="online-message-item">
            <div class="online-message-item__main">
              <strong>{{ item.title }}</strong>
              <p>{{ item.summary }}</p>
            </div>
            <div class="online-message-item__meta">
              <span>{{ item.publishDate }}</span>
              <span>{{ item.statusLabel }}</span>
              <span>{{ item.replyCount }} 条回复</span>
            </div>
            <div class="online-message-item__actions">
              <button type="button" class="course-chip" @click="toggleDiscussion(item.id)">
                {{ expandedMessageId === item.id ? '收起讨论' : '展开讨论' }}
              </button>
            </div>

            <section v-if="expandedMessageId === item.id" class="online-message-thread">
              <div class="online-message-thread__topic">
                <strong>主题正文</strong>
                <p>{{ currentDetail?.topic.content || '正在加载主题内容...' }}</p>
              </div>

              <div v-if="loadingDetailId === item.id" class="course-detail-empty course-detail-empty--compact">
                正在加载讨论内容...
              </div>
              <div v-else-if="currentDetail?.replies?.length" class="message-detail-list">
                <article v-for="reply in currentDetail.replies" :key="reply.id" class="message-detail-item">
                  <strong>{{ reply.authorName }}</strong>
                  <p>{{ reply.content }}</p>
                  <span>{{ reply.replyTime }}</span>
                </article>
              </div>
              <div v-else class="course-detail-empty course-detail-empty--compact">当前还没有回复内容，先补充第一条讨论吧。</div>

              <form class="online-message-form online-message-form--inline" @submit.prevent="submitReply(item.id)">
                <label class="online-message-field">
                  <span>继续回复</span>
                  <textarea
                    v-model.trim="replyDrafts[item.id]"
                    maxlength="5000"
                    rows="5"
                    placeholder="请输入你的补充说明、教学建议或资源经验"
                  ></textarea>
                </label>

                <div class="online-message-actions">
                  <button type="submit" class="auth-btn" :disabled="replyingId === item.id">
                    {{ replyingId === item.id ? '发布中...' : '发布回复' }}
                  </button>
                  <button
                    type="button"
                    class="auth-btn auth-btn--secondary"
                    :disabled="replyingId === item.id"
                    @click="replyDrafts[item.id] = ''"
                  >
                    清空内容
                  </button>
                </div>
              </form>
            </section>
          </article>
        </div>

        <div v-else class="course-detail-empty">当前还没有交流主题，先发布第一条话题吧。</div>

        <section class="course-pagination online-message-pagination">
          <div class="course-pagination__desc">共 {{ pagination.total }} 条交流主题 · 支持分页浏览</div>
          <div class="course-pagination__actions">
            <button type="button" class="course-chip" :disabled="pagination.page <= 1" @click="changePage(pagination.page - 1)">
              上一页
            </button>
            <button
              v-for="pageNumber in pageNumbers"
              :key="pageNumber"
              type="button"
              :class="['course-page-btn', pageNumber === pagination.page ? 'is-active' : '']"
              @click="changePage(pageNumber)"
            >
              {{ pageNumber }}
            </button>
          </div>
        </section>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import http from '@/services/http'
import { useAuthStore } from '@/stores/auth'

interface ReplyItem {
  id: number
  content: string
  authorName: string
  replyTime: string
}

interface MessageItem {
  id: number
  title: string
  summary: string
  publishDate: string
  lastReplyAt: string
  statusLabel: string
  replyCount: number
}

interface MessageDetailResponse {
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

interface MessageListResponse {
  list: MessageItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const loading = ref(false)
const submitting = ref(false)
const replyingId = ref<number | null>(null)
const loadingDetailId = ref<number | null>(null)
const expandedMessageId = ref<number | null>(null)
const errorMessage = ref('')
const messages = ref<MessageItem[]>([])
const replyDrafts = reactive<Record<number, string>>({})
const detailMap = reactive<Record<number, MessageDetailResponse>>({})
const form = reactive({
  title: '',
  content: '',
})
const pagination = reactive({
  page: 1,
  pageSize: 6,
  total: 0,
  totalPages: 0,
})

const headerText = computed(() => {
  const name = authStore.profile?.name || authStore.profile?.username || '教师用户'
  return `${name}，这里用于发布交流主题并继续跟进讨论内容。`
})

const visibleMessages = computed(() => messages.value)
const currentDetail = computed(() => {
  if (!expandedMessageId.value) {
    return null
  }

  return detailMap[expandedMessageId.value] || null
})

const pageNumbers = computed(() => {
  const totalPages = pagination.totalPages || 1
  return Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5)
})

function normalizePage(value: unknown) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function updateRoute(page: number) {
  router.push({
    path: '/teacher/messages',
    query: {
      page: String(page),
    },
  })
}

function changePage(page: number) {
  expandedMessageId.value = null
  updateRoute(page)
}

function resetForm() {
  form.title = ''
  form.content = ''
}

async function loadMessageDetail(messageId: number) {
  loadingDetailId.value = messageId

  try {
    const response = await http.get(`/teacher/messages/${messageId}`)
    detailMap[messageId] = response.data.data as MessageDetailResponse
  } finally {
    loadingDetailId.value = null
  }
}

async function toggleDiscussion(messageId: number) {
  if (expandedMessageId.value === messageId) {
    expandedMessageId.value = null
    return
  }

  expandedMessageId.value = messageId

  if (!detailMap[messageId]) {
    try {
      await loadMessageDetail(messageId)
    } catch (error: any) {
      errorMessage.value = error?.response?.data?.message || '讨论内容加载失败'
    }
  }
}

async function loadMessages() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await http.get('/teacher/messages', {
      params: {
        page: normalizePage(route.query.page),
        pageSize: 6,
      },
    })

    const data = response.data.data as MessageListResponse
    messages.value = data.list
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
  } catch (error: any) {
    messages.value = []
    pagination.page = 1
    pagination.pageSize = 6
    pagination.total = 0
    pagination.totalPages = 0
    errorMessage.value = error?.response?.data?.message || '教学交流列表加载失败'
  } finally {
    loading.value = false
  }
}

async function submitMessage() {
  if (!form.title || !form.content) {
    errorMessage.value = '请先填写完整的话题标题和内容'
    return
  }

  submitting.value = true
  errorMessage.value = ''

  try {
    await http.post('/teacher/messages', {
      title: form.title,
      content: form.content,
    })

    resetForm()
    expandedMessageId.value = null
    updateRoute(1)
    await loadMessages()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '发布交流主题失败'
  } finally {
    submitting.value = false
  }
}

async function submitReply(messageId: number) {
  const content = replyDrafts[messageId]?.trim()
  if (!content) {
    errorMessage.value = '请先填写回复内容'
    return
  }

  replyingId.value = messageId
  errorMessage.value = ''

  try {
    await http.post(`/teacher/messages/${messageId}/replies`, {
      content,
    })

    replyDrafts[messageId] = ''
    await Promise.all([loadMessageDetail(messageId), loadMessages()])
    expandedMessageId.value = messageId
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '发布回复失败'
  } finally {
    replyingId.value = null
  }
}

watch(
  () => route.fullPath,
  () => {
    loadMessages()
  },
  { immediate: true },
)
</script>
