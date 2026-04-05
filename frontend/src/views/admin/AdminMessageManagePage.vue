<template>
  <main class="admin-manage-page admin-message-page">
    <aside class="admin-dashboard-sidebar">
      <div>
        <div class="admin-dashboard-sidebar__eyebrow">ADMIN CONSOLE</div>
        <h1>管理员中心</h1>
      </div>

      <nav class="admin-dashboard-nav">
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin')">总览首页</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/accounts')">账号管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/colleges')">学院管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/courses')">课程管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/materials')">资料管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/videos')">视频管理</button>
        <button type="button" class="admin-dashboard-nav__item is-active">留言管理</button>
      </nav>

      <section class="admin-dashboard-reminder-card admin-dashboard-reminder-card--manage">
        <div class="admin-dashboard-reminder-card__eyebrow">MESSAGE ACTION</div>
        <ul>
          <li>{{ reminderTexts[0] }}</li>
          <li>{{ reminderTexts[1] }}</li>
        </ul>
      </section>
    </aside>

    <section class="admin-manage-main">
      <header class="admin-manage-head">
        <div>
          <div class="admin-manage-head__eyebrow">MESSAGE MANAGEMENT</div>
          <h2>管理员留言管理</h2>
          <p>{{ headerText }}</p>
        </div>
        <div class="admin-manage-head__actions">
          <span class="course-chip course-chip--soft">交流治理</span>
          <button type="button" class="auth-btn auth-btn--secondary" @click="router.push('/admin')">返回总览</button>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success admin-manage-feedback">{{ successMessage }}</p>

      <section class="admin-manage-filter-panel">
        <div class="admin-manage-filter-panel__head">
          <div>
            <div class="admin-manage-panel__eyebrow">MESSAGE FILTER</div>
            <h3>筛选交流主题</h3>
          </div>
          <div class="admin-manage-panel__meta">共 {{ pagination.total }} 条主题</div>
        </div>

        <form class="admin-manage-filter-form admin-manage-filter-form--message" @submit.prevent="applySearch">
          <label class="admin-manage-field">
            <span>主题关键词</span>
            <input v-model.trim="form.keyword" type="text" maxlength="100" placeholder="搜索标题、正文或教师姓名" />
          </label>

          <div class="admin-manage-filter-actions">
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="loading" @click="resetFilters">重置</button>
            <button type="submit" class="auth-btn" :disabled="loading">{{ loading ? '加载中...' : '搜索主题' }}</button>
          </div>
        </form>
      </section>

      <section class="admin-manage-panel">
        <div class="admin-manage-panel__head">
          <div>
            <div class="admin-manage-panel__eyebrow">MESSAGE LIST</div>
            <h3>交流主题列表</h3>
          </div>
          <div class="admin-manage-panel__meta">支持展开查看回复并在当前页继续回复</div>
        </div>

        <div v-if="messageList.length" class="admin-message-list">
          <article v-for="item in messageList" :key="item.id" class="admin-message-item">
            <div class="admin-message-item__main">
              <strong>{{ item.title }}</strong>
              <p>{{ item.summary }}</p>
            </div>
            <div class="admin-message-item__meta">
              <span>{{ item.teacherName }}</span>
              <span>{{ item.publishDate }}</span>
              <span>{{ item.statusLabel }}</span>
              <span>{{ item.replyCount }} 条回复</span>
            </div>
            <div class="admin-message-item__actions">
              <button type="button" class="course-chip course-chip--soft" @click="toggleDiscussion(item.id)">
                {{ expandedMessageId === item.id ? '收起讨论' : '展开讨论' }}
              </button>
              <button type="button" class="course-chip admin-manage-delete-btn" :disabled="deletingId === item.id" @click="removeMessage(item)">
                {{ deletingId === item.id ? '删除中...' : '删除主题' }}
              </button>
            </div>

            <section v-if="expandedMessageId === item.id" class="admin-message-thread">
              <div class="admin-message-thread__topic">
                <strong>主题正文</strong>
                <p>{{ currentDetail?.topic.content || '正在加载主题内容...' }}</p>
                <span>{{ currentDetail?.topic.teacherName || item.teacherName }} · {{ currentDetail?.topic.publishDate || item.publishDate }}</span>
              </div>

              <div v-if="loadingDetailId === item.id" class="course-detail-empty course-detail-empty--compact">正在加载讨论内容...</div>
              <div v-else-if="currentDetail?.replies?.length" class="admin-message-reply-list">
                <article v-for="reply in currentDetail.replies" :key="reply.id" class="admin-message-reply-item">
                  <strong>{{ reply.authorName }}</strong>
                  <p>{{ reply.content }}</p>
                  <span>{{ reply.replyTime }}</span>
                </article>
              </div>
              <div v-else class="course-detail-empty course-detail-empty--compact">当前还没有回复内容，可直接在下方补充管理员回复。</div>

              <form class="admin-message-form" @submit.prevent="submitReply(item.id)">
                <label class="admin-manage-field admin-manage-field--full">
                  <span>管理员回复</span>
                  <textarea
                    v-model.trim="replyDrafts[item.id]"
                    maxlength="5000"
                    rows="5"
                    :placeholder="currentDetail?.capabilities.canReply === false ? '当前数据库未启用管理员回复字段，请先升级表结构' : '请输入你的处理意见、引导建议或补充说明'"
                    :disabled="currentDetail?.capabilities.canReply === false || replyingId === item.id"
                  ></textarea>
                </label>

                <div class="admin-manage-filter-actions">
                  <button type="submit" class="auth-btn" :disabled="currentDetail?.capabilities.canReply === false || replyingId === item.id">
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
        <div v-else-if="!loading" class="course-detail-empty">当前没有符合条件的交流主题。</div>

        <section class="admin-manage-pagination">
          <div class="admin-manage-pagination__desc">共 {{ pagination.total }} 条主题 · 当前第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</div>
          <div class="admin-manage-pagination__actions">
            <button type="button" class="course-chip" :disabled="pagination.page <= 1 || loading" @click="changePage(pagination.page - 1)">上一页</button>
            <button
              v-for="pageNumber in pageNumbers"
              :key="pageNumber"
              type="button"
              :class="['admin-manage-page-btn', pageNumber === pagination.page ? 'is-active' : '']"
              :disabled="loading"
              @click="changePage(pageNumber)"
            >
              {{ pageNumber }}
            </button>
          </div>
        </section>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createAdminMessageReply,
  deleteAdminMessage,
  getAdminMessageDetail,
  getAdminMessageList,
  type AdminMessageDetailData,
  type AdminMessageItem,
} from '@/services/admin'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const loading = ref(false)
const replyingId = ref<number | null>(null)
const deletingId = ref<number | null>(null)
const loadingDetailId = ref<number | null>(null)
const expandedMessageId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const messageList = ref<AdminMessageItem[]>([])
const replyDrafts = reactive<Record<number, string>>({})
const detailMap = reactive<Record<number, AdminMessageDetailData>>({})
const form = reactive({
  keyword: '',
})
const pagination = reactive({
  page: 1,
  pageSize: 6,
  total: 0,
  totalPages: 0,
})

const headerText = computed(() => {
  const name = authStore.profile?.name || authStore.profile?.username || '管理员'
  return `${name}，这里统一跟进教师交流主题，查看回复并执行后台治理。`
})

const reminderTexts = computed(() => {
  return [
    pagination.total > 0 ? `当前共有 ${pagination.total} 条交流主题待跟进。` : '当前还没有可管理的交流主题。',
    expandedMessageId.value ? '已展开当前主题，可直接查看回复并继续处理。' : '可展开任意主题查看回复并在当前页继续回复。',
  ]
})

const pageNumbers = computed(() => {
  const totalPages = pagination.totalPages || 1
  return Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5)
})

const currentDetail = computed(() => {
  if (!expandedMessageId.value) {
    return null
  }

  return detailMap[expandedMessageId.value] || null
})

function normalizePage(value: unknown) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function syncFormWithRoute() {
  form.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
}

function updateRoute(page = 1) {
  router.push({
    path: '/admin/messages',
    query: {
      page: String(page),
      ...(form.keyword ? { keyword: form.keyword } : {}),
    },
  })
}

function applySearch() {
  expandedMessageId.value = null
  updateRoute(1)
}

function resetFilters() {
  clearMessages()
  expandedMessageId.value = null
  form.keyword = ''
  updateRoute(1)
}

function changePage(page: number) {
  expandedMessageId.value = null
  updateRoute(page)
}

async function loadMessageDetail(messageId: number) {
  loadingDetailId.value = messageId

  try {
    detailMap[messageId] = await getAdminMessageDetail(messageId)
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
  clearMessages()

  if (!detailMap[messageId]) {
    try {
      await loadMessageDetail(messageId)
    } catch (error: any) {
      errorMessage.value = error?.response?.data?.message || '交流详情加载失败'
    }
  }
}

async function removeMessage(item: AdminMessageItem) {
  clearMessages()

  if (!window.confirm(`确认删除交流主题《${item.title}》吗？`)) {
    return
  }

  deletingId.value = item.id

  try {
    await deleteAdminMessage(item.id)
    successMessage.value = `交流主题《${item.title}》已删除。`
    if (expandedMessageId.value === item.id) {
      expandedMessageId.value = null
    }
    delete detailMap[item.id]
    await loadMessages()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '交流主题删除失败'
  } finally {
    deletingId.value = null
  }
}

async function submitReply(messageId: number) {
  const content = replyDrafts[messageId]?.trim()
  if (!content) {
    errorMessage.value = '请先填写回复内容'
    return
  }

  replyingId.value = messageId
  clearMessages()

  try {
    await createAdminMessageReply(messageId, { content })
    replyDrafts[messageId] = ''
    successMessage.value = '管理员回复已发布。'
    await Promise.all([loadMessageDetail(messageId), loadMessages()])
    expandedMessageId.value = messageId
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '管理员回复发布失败'
  } finally {
    replyingId.value = null
  }
}

async function loadMessages() {
  loading.value = true
  clearMessages()
  syncFormWithRoute()

  try {
    const data = await getAdminMessageList({
      page: normalizePage(route.query.page),
      pageSize: 6,
      keyword: form.keyword,
    })

    messageList.value = data.list
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
  } catch (error: any) {
    messageList.value = []
    pagination.page = 1
    pagination.pageSize = 6
    pagination.total = 0
    pagination.totalPages = 0
    errorMessage.value = error?.response?.data?.message || '留言管理列表加载失败'
  } finally {
    loading.value = false
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
