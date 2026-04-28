<template>
  <main class="admin-manage-page admin-message-page">
    <aside class="admin-dashboard-sidebar">
      <div>
        <div class="admin-dashboard-sidebar__eyebrow">ADMIN CONSOLE</div>
        <h1>管理员中心</h1>
      </div>

      <AdminSidebarNav active="messages" />
      <nav v-if="false" class="admin-dashboard-nav">
        <button type="button" class="admin-dashboard-nav__item admin-dashboard-nav__item--system" @click="router.push('/admin/system')">系统管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin')">总览首页</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/teachers')">教师用户</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/accounts')">账号管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/colleges')">学院管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/courses')">课程管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/assets')">资料库</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/materials')">资料管理</button>
        <button type="button" class="admin-dashboard-nav__item is-active">教学交流</button>
      </nav>

      <section class="admin-dashboard-reminder-card admin-dashboard-reminder-card--manage">
        <div class="admin-dashboard-reminder-card__eyebrow">DISCUSSION ACTION</div>
        <ul>
          <li>{{ reminderTexts[0] }}</li>
          <li>{{ reminderTexts[1] }}</li>
        </ul>
      </section>
    </aside>

    <section class="admin-manage-main">
      <header class="admin-manage-head">
        <div>
          <div class="admin-manage-head__eyebrow">DISCUSSION MANAGEMENT</div>
          <h2>教学交流管理</h2>
          <p>{{ headerText }}</p>
        </div>
        <div class="admin-manage-head__actions">
          <button type="button" class="auth-btn" :disabled="!canCreateTopic" @click="openTopicEditor">发布新主题</button>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success admin-manage-feedback">{{ successMessage }}</p>

      <section class="admin-manage-filter-panel">
        <div class="admin-manage-filter-panel__head">
          <div>
            <div class="admin-manage-panel__eyebrow">TOPIC FILTER</div>
            <h3>筛选交流主题</h3>
          </div>
          <div class="admin-manage-panel__meta">共 {{ pagination.total }} 条主题</div>
        </div>

        <form class="admin-manage-filter-form admin-manage-filter-form--message" @submit.prevent="applySearch">
          <label class="admin-manage-field">
            <span>主题关键词</span>
            <input v-model.trim="form.keyword" type="text" maxlength="100" placeholder="搜索标题、正文或发布人" />
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
            <div class="admin-manage-panel__eyebrow">TOPIC LIST</div>
            <h3>交流主题列表</h3>
          </div>
          <div class="admin-manage-panel__meta">支持展开查看评论、楼中回复、删除与继续回复</div>
        </div>

        <div v-if="messageList.length" class="admin-message-list">
          <article v-for="item in messageList" :key="item.id" class="admin-message-item">
            <div class="admin-message-item__head">
              <div class="admin-message-item__main">
                <strong>{{ item.title }}</strong>
                <p>{{ item.summary }}</p>
              </div>
              <span :class="['online-message-role-badge', `is-${item.authorRole}`]">
                {{ getRoleLabel(item.authorRole) }}
              </span>
            </div>

            <div class="admin-message-item__meta">
              <span>发布人 {{ item.authorName }}</span>
              <span>发布时间 {{ item.publishDate }}</span>
              <span>{{ item.statusLabel }}</span>
              <span>{{ item.replyCount }} 条回复</span>
            </div>

            <div class="admin-message-item__actions">
              <button type="button" class="course-chip course-chip--soft" @click="toggleDiscussion(item.id)">
                {{ expandedMessageId === item.id ? '收起讨论' : '展开讨论' }}
              </button>
              <button type="button" class="course-chip admin-manage-delete-btn" :disabled="deletingTopicId === item.id" @click="removeTopic(item)">
                {{ deletingTopicId === item.id ? '删除中...' : '删除主题' }}
              </button>
            </div>

            <section v-if="expandedMessageId === item.id" class="admin-message-thread">
              <div class="admin-message-thread__topic">
                <div class="admin-message-thread__topic-head">
                  <strong>{{ currentDetail?.topic.title || item.title }}</strong>
                  <span :class="['online-message-role-badge', `is-${currentDetail?.topic.authorRole || item.authorRole}`]">
                    {{ getRoleLabel(currentDetail?.topic.authorRole || item.authorRole) }}
                  </span>
                </div>
                <p>{{ currentDetail?.topic.content || '正在加载主题内容...' }}</p>
                <span>{{ currentDetail?.topic.authorName || item.authorName }} · {{ currentDetail?.topic.publishDate || item.publishDate }}</span>
              </div>

              <div v-if="loadingDetailId === item.id" class="course-detail-empty course-detail-empty--compact">正在加载讨论内容...</div>
              <div v-else-if="currentDetail" class="admin-message-thread__replies">
                <article v-for="reply in rootReplies" :key="reply.id" class="admin-message-reply-item">
                  <div class="admin-message-reply-item__head">
                    <strong>{{ reply.authorName }}</strong>
                    <span :class="['online-message-role-badge', `is-${reply.authorRole}`]">
                      {{ getRoleLabel(reply.authorRole) }}
                    </span>
                  </div>
                  <p>{{ reply.content }}</p>
                  <span>{{ reply.replyTime }}</span>

                  <div class="admin-message-item__actions">
                    <button
                      v-if="currentDetail.capabilities.canReply && currentDetail.capabilities.canReplyToReply"
                      type="button"
                      class="course-chip course-chip--soft"
                      @click="openReplyEditor(item.id, reply)"
                    >
                      回复
                    </button>
                    <button
                      v-if="getChildReplies(reply.id).length"
                      type="button"
                      class="course-chip course-chip--soft"
                      @click="toggleReplyChildren(reply.id)"
                    >
                      {{ isReplyChildrenExpanded(reply.id) ? '收起回复' : `展开回复 (${getChildReplies(reply.id).length})` }}
                    </button>
                    <button
                      v-if="reply.canDelete"
                      type="button"
                      class="course-chip admin-manage-delete-btn"
                      :disabled="deletingReplyId === reply.id"
                      @click="removeReply(item.id, reply)"
                    >
                      {{ deletingReplyId === reply.id ? '删除中...' : '删除' }}
                    </button>
                  </div>

                  <div v-if="isReplyChildrenExpanded(reply.id) && getChildReplies(reply.id).length" class="admin-message-reply-children">
                    <article v-for="childReply in getChildReplies(reply.id)" :key="childReply.id" class="admin-message-reply-item admin-message-reply-item--child">
                      <div class="admin-message-reply-item__head">
                        <strong>{{ childReply.authorName }}</strong>
                        <span :class="['online-message-role-badge', `is-${childReply.authorRole}`]">
                          {{ getRoleLabel(childReply.authorRole) }}
                        </span>
                      </div>
                      <p><span class="admin-message-reply-item__mention">@{{ childReply.parentAuthorName }}</span>{{ childReply.content }}</p>
                      <span>{{ childReply.replyTime }}</span>

                      <div class="admin-message-item__actions">
                        <button
                          v-if="currentDetail.capabilities.canReply && currentDetail.capabilities.canReplyToReply"
                          type="button"
                          class="course-chip course-chip--soft"
                          @click="openReplyEditor(item.id, childReply)"
                        >
                          回复
                        </button>
                        <button
                          v-if="childReply.canDelete"
                          type="button"
                          class="course-chip admin-manage-delete-btn"
                          :disabled="deletingReplyId === childReply.id"
                          @click="removeReply(item.id, childReply)"
                        >
                          {{ deletingReplyId === childReply.id ? '删除中...' : '删除' }}
                        </button>
                      </div>
                    </article>
                  </div>
                </article>

                <div v-if="!rootReplies.length" class="course-detail-empty course-detail-empty--compact">当前还没有回复，可由管理员率先给出引导意见。</div>
              </div>

              <div class="admin-message-form">
                <div class="admin-manage-filter-actions">
                  <button
                    type="button"
                    class="auth-btn"
                    :disabled="currentDetail?.capabilities.canReply === false"
                    @click="openReplyEditor(item.id)"
                  >
                    {{ currentDetail?.capabilities.canReply === false ? '当前暂不支持回复' : '发表评论' }}
                  </button>
                </div>
              </div>
            </section>
          </article>
        </div>
        <div v-else-if="!loading" class="course-detail-empty">当前没有符合条件的交流主题。</div>

        <section class="admin-manage-pagination">
          <div class="admin-manage-pagination__desc">共 {{ pagination.total }} 条主题 · 当前第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</div>
          <div class="admin-manage-pagination__actions">
            <button type="button" class="course-chip course-pagination__nav" :disabled="pagination.page <= 1 || loading" @click="changePage(pagination.page - 1)" aria-label="上一页">‹</button>
            <button type="button" class="admin-manage-page-btn is-active" :disabled="loading" aria-current="page">{{ pagination.page }}</button>
            <button type="button" class="course-chip course-pagination__nav" :disabled="pagination.page >= pagination.totalPages || loading" @click="changePage(pagination.page + 1)" aria-label="下一页">›</button>
          </div>
        </section>
      </section>
    </section>

    <div v-if="showTopicEditor" class="admin-course-editor-mask" @click.self="closeTopicEditor">
      <section class="admin-course-editor admin-course-editor--wide online-message-topic-editor">
        <div class="admin-course-editor__head">
          <div>
            <div class="admin-manage-panel__eyebrow">NEW TOPIC</div>
            <h3>管理员发布主题</h3>
          </div>
          <button type="button" class="course-chip course-chip--soft" :disabled="submittingTopic" @click="closeTopicEditor">关闭</button>
        </div>

        <form class="admin-course-editor__form admin-message-form" @submit.prevent="submitTopic">
          <label class="admin-manage-field">
            <span>主题标题</span>
            <input
              v-model.trim="topicForm.title"
              type="text"
              maxlength="100"
              placeholder="请输入交流主题标题"
              :disabled="!canCreateTopic || submittingTopic"
            />
          </label>

          <label class="admin-manage-field admin-manage-field--full">
            <span>主题内容</span>
            <textarea
              v-model.trim="topicForm.content"
              maxlength="5000"
              rows="8"
              placeholder="请输入教学安排、交流议题或管理建议"
              :disabled="!canCreateTopic || submittingTopic"
            ></textarea>
          </label>

          <p class="admin-course-editor__hint online-message-topic-editor__hint">
            管理员可以发布教学安排、活动提醒、资源使用说明，或对某个讨论方向进行引导。
          </p>

          <div class="admin-course-editor__footer">
            <p>主题发布后将立即出现在列表中，支持继续评论、楼中回复与删除。</p>
            <div class="admin-course-editor__actions admin-course-editor__actions--end">
              <button type="submit" class="auth-btn" :disabled="!canCreateTopic || submittingTopic">
                {{ submittingTopic ? '发布中...' : '发布主题' }}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>

    <div v-if="showReplyEditor && activeReplyMessageId !== null" class="admin-course-editor-mask" @click.self="closeReplyEditor">
      <section class="admin-course-editor admin-course-editor--wide">
        <div class="admin-course-editor__head">
          <div>
            <div class="admin-manage-panel__eyebrow">REPLY EDITOR</div>
            <h3>{{ activeReplyTarget?.replyId ? '发布回复' : '发表评论' }}</h3>
          </div>
          <button
            type="button"
            class="course-chip course-chip--soft"
            :disabled="replyingId === activeReplyMessageId"
            @click="closeReplyEditor"
          >
            关闭
          </button>
        </div>

        <form class="admin-course-editor__form admin-message-form" @submit.prevent="submitReply(activeReplyMessageId)">
          <div v-if="activeReplyTarget?.replyId" class="admin-message-reply-target">
            正在回复 <strong>{{ activeReplyTarget.authorName }}</strong>
          </div>

          <label class="admin-manage-field admin-manage-field--full">
            <span>{{ activeReplyTarget?.replyId ? '楼中回复' : '管理员评论' }}</span>
            <textarea
              v-model.trim="activeReplyDraft"
              maxlength="5000"
              rows="6"
              :placeholder="
                activeReplyDetail?.capabilities.canReply === false
                  ? '当前数据库尚未升级管理员回复字段，请先执行 SQL'
                  : '请输入处理意见、补充说明或交流回复'
              "
              :disabled="activeReplyDetail?.capabilities.canReply === false || replyingId === activeReplyMessageId"
            ></textarea>
          </label>

          <p class="admin-course-editor__hint">
            可以在这里统一处理主贴评论，也可以针对某条回复继续补充楼中回复。
          </p>

          <div class="admin-course-editor__footer">
            <p>建议写清处理结论、补充说明和后续动作，方便教师与学生继续跟进讨论。</p>
            <div class="admin-course-editor__actions admin-course-editor__actions--end">
              <button
                type="submit"
                class="auth-btn"
                :disabled="activeReplyDetail?.capabilities.canReply === false || replyingId === activeReplyMessageId"
              >
                {{ replyingId === activeReplyMessageId ? '发布中...' : activeReplyTarget?.replyId ? '发布回复' : '发布评论' }}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminSidebarNav from '@/components/navigation/AdminSidebarNav.vue'
import {
  createAdminMessage,
  createAdminMessageReply,
  deleteAdminMessage,
  deleteAdminMessageReply,
  getAdminMessageDetail,
  getAdminMessageList,
  type AdminMessageDetailData,
  type AdminMessageItem,
  type AdminMessageReplyItem,
} from '@/services/admin'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const submittingTopic = ref(false)
const showTopicEditor = ref(false)
const showReplyEditor = ref(false)
const replyingId = ref<number | null>(null)
const deletingTopicId = ref<number | null>(null)
const deletingReplyId = ref<number | null>(null)
const loadingDetailId = ref<number | null>(null)
const expandedMessageId = ref<number | null>(null)
const activeReplyMessageId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const messageList = ref<AdminMessageItem[]>([])
const detailMap = reactive<Record<number, AdminMessageDetailData>>({})
const replyDrafts = reactive<Record<number, string>>({})
const replyTargets = reactive<Record<number, { replyId: number | null; authorName: string }>>({})
const expandedReplyChildren = reactive<Record<number, boolean>>({})

const form = reactive({
  keyword: '',
})

const topicForm = reactive({
  title: '',
  content: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 4,
  total: 0,
  totalPages: 0,
})

const listCapabilities = reactive({
  canCreateTopic: true,
  canReply: true,
  canReplyToReply: true,
})

const headerText = computed(() => {
  const name = authStore.profile?.name || authStore.profile?.username || '管理员'
  return `${name}，这里统一维护教师与管理员共同参与的教学交流主题。`
})

const reminderTexts = computed(() => [
  pagination.total > 0 ? `当前共有 ${pagination.total} 条交流主题待跟进。` : '当前还没有可管理的交流主题。',
  expandedMessageId.value ? '已展开当前主题，可继续评论、楼中回复和删除内容。' : '可展开任意主题查看评论并继续管理。',
])

const currentDetail = computed(() => {
  if (!expandedMessageId.value) {
    return null
  }

  return detailMap[expandedMessageId.value] || null
})

const activeReplyDetail = computed(() => {
  if (activeReplyMessageId.value === null) {
    return null
  }

  return detailMap[activeReplyMessageId.value] || null
})

const activeReplyTarget = computed(() => {
  if (activeReplyMessageId.value === null) {
    return null
  }

  return replyTargets[activeReplyMessageId.value] || { replyId: null, authorName: '' }
})

const activeReplyDraft = computed({
  get() {
    if (activeReplyMessageId.value === null) {
      return ''
    }

    return replyDrafts[activeReplyMessageId.value] || ''
  },
  set(value: string) {
    if (activeReplyMessageId.value === null) {
      return
    }

    replyDrafts[activeReplyMessageId.value] = value
  },
})

const rootReplies = computed(() => {
  const detail = currentDetail.value
  if (!detail) {
    return []
  }

  const replyIdSet = new Set(detail.replies.map((item) => item.id))
  return detail.replies.filter((item) => !item.parentReplyId || !replyIdSet.has(item.parentReplyId))
})

const canCreateTopic = computed(
  () => currentDetail.value?.capabilities.canCreateTopic ?? listCapabilities.canCreateTopic,
)

function getRoleLabel(role: 'teacher' | 'admin' | 'student') {
  if (role === 'admin') {
    return '管理员'
  }

  if (role === 'student') {
    return '学生'
  }

  return '教师'
}



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

function resetTopicForm() {
  topicForm.title = ''
  topicForm.content = ''
}

function openTopicEditor() {
  clearMessages()
  showTopicEditor.value = true
}

function closeTopicEditor() {
  showTopicEditor.value = false
}

function openReplyEditor(messageId: number, reply?: AdminMessageReplyItem) {
  clearMessages()
  activeReplyMessageId.value = messageId

  if (reply) {
    setReplyTarget(messageId, reply)
  } else {
    clearReplyTarget(messageId)
  }

  if (replyDrafts[messageId] === undefined) {
    replyDrafts[messageId] = ''
  }

  showReplyEditor.value = true
}

function closeReplyEditor() {
  showReplyEditor.value = false
  activeReplyMessageId.value = null
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
  form.keyword = ''
  expandedMessageId.value = null
  updateRoute(1)
}

function changePage(page: number) {
  expandedMessageId.value = null
  updateRoute(page)
}

function getChildReplies(replyId: number) {
  return (currentDetail.value?.replies || []).filter((item) => item.parentReplyId === replyId)
}

function isReplyChildrenExpanded(replyId: number) {
  return expandedReplyChildren[replyId] !== false
}

function toggleReplyChildren(replyId: number) {
  expandedReplyChildren[replyId] = !isReplyChildrenExpanded(replyId)
}

function setReplyTarget(messageId: number, reply: AdminMessageReplyItem) {
  replyTargets[messageId] = {
    replyId: reply.id,
    authorName: reply.authorName,
  }
}

function clearReplyTarget(messageId: number) {
  replyTargets[messageId] = {
    replyId: null,
    authorName: '',
  }
}

function clearReplyDraft(messageId: number) {
  replyDrafts[messageId] = ''
  clearReplyTarget(messageId)
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

async function loadMessages() {
  loading.value = true
  clearMessages()
  syncFormWithRoute()

  try {
    const data = await getAdminMessageList({
      page: normalizePage(route.query.page),
      pageSize: 4,
      keyword: form.keyword,
    })

    messageList.value = data.list
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
    listCapabilities.canCreateTopic = data.capabilities.canCreateTopic
    listCapabilities.canReply = data.capabilities.canReply
    listCapabilities.canReplyToReply = data.capabilities.canReplyToReply
  } catch (error: any) {
    messageList.value = []
    pagination.page = 1
    pagination.pageSize = 4
    pagination.total = 0
    pagination.totalPages = 0
    listCapabilities.canCreateTopic = true
    listCapabilities.canReply = true
    listCapabilities.canReplyToReply = true
    errorMessage.value = error?.response?.data?.message || '教学交流管理列表加载失败'
  } finally {
    loading.value = false
  }
}

async function submitTopic() {
  if (!topicForm.title || !topicForm.content) {
    errorMessage.value = '请先填写完整的标题和内容'
    return
  }

  submittingTopic.value = true
  clearMessages()

  try {
    await createAdminMessage({
      title: topicForm.title,
      content: topicForm.content,
    })
    resetTopicForm()
    closeTopicEditor()
    successMessage.value = '管理员主题已发布。'
    updateRoute(1)
    await loadMessages()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '管理员主题发布失败'
  } finally {
    submittingTopic.value = false
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
    await createAdminMessageReply(messageId, {
      content,
      parentReplyId: replyTargets[messageId]?.replyId || null,
    })
    clearReplyDraft(messageId)
    closeReplyEditor()
    successMessage.value = '管理员回复已发布。'
    await Promise.all([loadMessageDetail(messageId), loadMessages()])
    expandedMessageId.value = messageId
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '管理员回复发布失败'
  } finally {
    replyingId.value = null
  }
}

async function removeTopic(item: AdminMessageItem) {
  clearMessages()

  if (!window.confirm(`确认删除交流主题《${item.title}》吗？`)) {
    return
  }

  deletingTopicId.value = item.id

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
    deletingTopicId.value = null
  }
}

async function removeReply(messageId: number, reply: AdminMessageReplyItem) {
  clearMessages()

  if (!window.confirm('确认删除这条回复吗？')) {
    return
  }

  deletingReplyId.value = reply.id

  try {
    await deleteAdminMessageReply(messageId, reply.id)
    successMessage.value = '回复已删除。'
    await Promise.all([loadMessageDetail(messageId), loadMessages()])
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '回复删除失败'
  } finally {
    deletingReplyId.value = null
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
