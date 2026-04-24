<template>
  <main class="portal-home teacher-message-page">
    <div class="teacher-message-page__ambient" aria-hidden="true">
      <span class="teacher-message-page__orb teacher-message-page__orb--one"></span>
      <span class="teacher-message-page__orb teacher-message-page__orb--two"></span>
      <span class="teacher-message-page__mesh"></span>
    </div>

    <PortalTopNav />

    <header class="teacher-message-hero">
      <section class="teacher-message-hero__intro">
        <div class="teacher-message-kicker">Learning Exchange</div>
        <h1>教学交流</h1>
        <p class="teacher-message-hero__lead">{{ headerText }}</p>
        <p class="teacher-message-hero__desc">{{ pageSummary }}</p>
      </section>

      <section class="teacher-message-hero__spotlight">
        <div class="teacher-message-kicker teacher-message-kicker--light">Student Forum</div>
        <strong>围绕课程学习问题、资源体验和课堂反馈，与教师、管理员持续交流</strong>
        <p>你可以查看已有讨论、补充自己的想法，也可以在系统支持时发起新的学习主题。</p>
        <button type="button" class="auth-btn" :disabled="!canCreateTopic" @click="openTopicEditor">发起交流主题</button>
        <span class="teacher-message-hero__spotlight-note">当前共有 {{ pagination.total }} 个主题正在讨论中</span>
      </section>
    </header>

    <section class="teacher-message-metrics">
      <article v-for="metric in heroMetrics" :key="metric.label" class="teacher-message-metric">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <p>{{ metric.note }}</p>
      </article>
    </section>

    <p v-if="errorMessage" class="course-feedback teacher-message-feedback teacher-message-feedback--error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="feedback-text feedback-text--success teacher-message-feedback teacher-message-feedback--success">
      {{ successMessage }}
    </p>

    <section class="teacher-message-board">
      <div class="teacher-message-board__head">
        <div>
          <div class="teacher-message-kicker">Topic Archive</div>
          <h2>讨论主题列表</h2>
          <p>{{ boardSummary }}</p>
        </div>

        <div class="teacher-message-board__meta">
          <span>第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</span>
          <span v-if="form.keyword">关键词：{{ form.keyword }}</span>
          <span v-else>当前展示最近更新的交流主题</span>
        </div>
      </div>

      <form class="teacher-message-search" @submit.prevent="applySearch">
        <label class="teacher-message-field">
          <span>关键词检索</span>
          <input
            v-model.trim="form.keyword"
            type="text"
            maxlength="100"
            placeholder="搜索标题、正文内容或发布人"
          />
        </label>

        <div class="teacher-message-search__actions">
          <button type="submit" class="auth-btn" :disabled="loading">{{ loading ? '加载中...' : '搜索主题' }}</button>
          <button type="button" class="auth-btn auth-btn--secondary" :disabled="loading" @click="resetFilters">重置</button>
        </div>

        <p class="teacher-message-search__hint">支持按主题、正文和发布人快速定位讨论内容，方便跟进课程中的具体问题。</p>
      </form>

      <div v-if="messageList.length" class="teacher-message-list">
        <article
          v-for="(item, index) in messageList"
          :key="item.id"
          :class="['teacher-message-topic', expandedMessageId === item.id ? 'is-expanded' : '']"
        >
          <div class="teacher-message-topic__header">
            <div class="teacher-message-topic__serial">{{ formatTopicNumber(index) }}</div>

            <div class="teacher-message-topic__main">
              <div class="teacher-message-topic__headline">
                <strong>{{ item.title }}</strong>
                <span :class="['teacher-message-role-badge', `is-${item.authorRole}`]">
                  {{ getRoleLabel(item.authorRole) }}
                </span>
              </div>

              <p>{{ item.summary }}</p>
            </div>
          </div>

          <div class="teacher-message-topic__meta">
            <span>发布人 {{ item.authorName }}</span>
            <span>发布时间 {{ item.publishDate }}</span>
            <span>最近互动 {{ item.lastReplyAt || '暂无更新' }}</span>
            <span>{{ item.statusLabel }}</span>
            <span>{{ item.replyCount }} 条回复</span>
          </div>

          <div class="teacher-message-topic__footer">
            <div class="teacher-message-topic__tip">
              <span class="teacher-message-topic__tip-dot"></span>
              {{ expandedMessageId === item.id ? '讨论详情已展开，可以继续查看回复或参与交流。' : '点击展开后可查看完整主题内容和楼层回复。' }}
            </div>

            <div class="teacher-message-topic__actions">
              <button type="button" class="course-chip" @click="toggleDiscussion(item.id)">
                {{ expandedMessageId === item.id ? '收起讨论' : '展开讨论' }}
              </button>
              <button
                v-if="item.canDelete"
                type="button"
                class="course-chip teacher-message-delete-btn"
                :disabled="deletingTopicId === item.id"
                @click="removeTopic(item)"
              >
                {{ deletingTopicId === item.id ? '删除中...' : '删除主题' }}
              </button>
            </div>
          </div>

          <section v-if="expandedMessageId === item.id" class="teacher-message-thread">
            <div class="teacher-message-thread__topic">
              <div class="teacher-message-thread__topic-head">
                <div>
                  <div class="teacher-message-kicker teacher-message-kicker--small">Topic Detail</div>
                  <strong>{{ currentDetail?.topic.title || item.title }}</strong>
                </div>
                <span :class="['teacher-message-role-badge', `is-${currentDetail?.topic.authorRole || item.authorRole}`]">
                  {{ getRoleLabel(currentDetail?.topic.authorRole || item.authorRole) }}
                </span>
              </div>

              <p>{{ currentDetail?.topic.content || '正在加载主题内容...' }}</p>

              <div class="teacher-message-thread__topic-meta">
                <span>{{ currentDetail?.topic.authorName || item.authorName }}</span>
                <span>{{ currentDetail?.topic.publishDate || item.publishDate }}</span>
                <span>{{ currentDetail?.topic.statusLabel || item.statusLabel }}</span>
              </div>
            </div>

            <div v-if="loadingDetailId === item.id" class="course-detail-empty course-detail-empty--compact">正在加载讨论内容...</div>

            <div v-else-if="currentDetail" class="teacher-message-thread__body">
              <div class="teacher-message-thread__reply-summary">
                <span>Reply Archive</span>
                <strong>共 {{ currentDetail.replies.length }} 条回复</strong>
              </div>

              <div v-if="rootReplies.length" class="teacher-message-reply-list">
                <article v-for="reply in rootReplies" :key="reply.id" class="teacher-message-reply-card">
                  <div class="teacher-message-reply-card__head">
                    <div>
                      <strong>{{ reply.authorName }}</strong>
                      <span class="teacher-message-reply-card__time">{{ reply.replyTime }}</span>
                    </div>
                    <span :class="['teacher-message-role-badge', `is-${reply.authorRole}`]">
                      {{ getRoleLabel(reply.authorRole) }}
                    </span>
                  </div>

                  <p>{{ reply.content }}</p>

                  <div class="teacher-message-reply-card__actions">
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
                      {{ isReplyChildrenExpanded(reply.id) ? '收起楼中回复' : `展开楼中回复 (${getChildReplies(reply.id).length})` }}
                    </button>
                    <button
                      v-if="reply.canDelete"
                      type="button"
                      class="course-chip teacher-message-delete-btn"
                      :disabled="deletingReplyId === reply.id"
                      @click="removeReply(item.id, reply)"
                    >
                      {{ deletingReplyId === reply.id ? '删除中...' : '删除' }}
                    </button>
                  </div>

                  <div v-if="isReplyChildrenExpanded(reply.id) && getChildReplies(reply.id).length" class="teacher-message-reply-children">
                    <article
                      v-for="childReply in getChildReplies(reply.id)"
                      :key="childReply.id"
                      class="teacher-message-reply-card teacher-message-reply-card--child"
                    >
                      <div class="teacher-message-reply-card__head">
                        <div>
                          <strong>{{ childReply.authorName }}</strong>
                          <span class="teacher-message-reply-card__time">{{ childReply.replyTime }}</span>
                        </div>
                        <span :class="['teacher-message-role-badge', `is-${childReply.authorRole}`]">
                          {{ getRoleLabel(childReply.authorRole) }}
                        </span>
                      </div>

                      <p>
                        <span class="teacher-message-reply-card__mention">@{{ childReply.parentAuthorName }}</span>
                        {{ childReply.content }}
                      </p>

                      <div class="teacher-message-reply-card__actions">
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
                          class="course-chip teacher-message-delete-btn"
                          :disabled="deletingReplyId === childReply.id"
                          @click="removeReply(item.id, childReply)"
                        >
                          {{ deletingReplyId === childReply.id ? '删除中...' : '删除' }}
                        </button>
                      </div>
                    </article>
                  </div>
                </article>
              </div>

              <div v-else class="teacher-message-empty">当前还没有回复，欢迎留下第一条学习反馈。</div>
            </div>

            <div class="teacher-message-reply-form">
              <div class="teacher-message-actions">
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

      <div v-else-if="!loading" class="teacher-message-empty teacher-message-empty--large">当前还没有交流主题，可以先看看已有课程内容或发起一个学习问题。</div>

      <section class="course-pagination teacher-message-pagination">
        <div class="course-pagination__desc">
          共 {{ pagination.total }} 条主题 · 当前第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页
        </div>

        <div class="course-pagination__actions">
          <button type="button" class="course-chip course-pagination__nav" :disabled="pagination.page <= 1 || loading" @click="changePage(pagination.page - 1)" aria-label="上一页">‹</button>
          <button type="button" class="course-page-btn is-active" :disabled="loading" aria-current="page">{{ pagination.page }}</button>
          <button type="button" class="course-chip course-pagination__nav" :disabled="pagination.page >= pagination.totalPages || loading" @click="changePage(pagination.page + 1)" aria-label="下一页">›</button>
        </div>
      </section>
    </section>

    <div v-if="showTopicEditor" class="teacher-message-dialog" @click.self="closeTopicEditor">
      <section class="teacher-message-dialog__panel">
        <div class="teacher-message-dialog__head">
          <div>
            <div class="teacher-message-kicker">New Topic</div>
            <h3>发起交流主题</h3>
          </div>
          <button type="button" class="course-chip course-chip--soft" :disabled="submittingTopic" @click="closeTopicEditor">关闭</button>
        </div>

        <form class="teacher-message-dialog__form" @submit.prevent="submitTopic">
          <label class="teacher-message-field">
            <span>主题标题</span>
            <input v-model.trim="topicForm.title" type="text" maxlength="100" placeholder="请输入交流主题标题" />
          </label>

          <label class="teacher-message-field">
            <span>主题内容</span>
            <textarea
              v-model.trim="topicForm.content"
              maxlength="5000"
              rows="9"
              placeholder="请输入课程问题、学习反馈或希望获得帮助的内容"
            ></textarea>
          </label>

          <p class="teacher-message-dialog__hint">
            主题发布后，教师、管理员和学生都可以继续参与讨论；如果数据库还未升级学生发帖字段，提交时会给出明确提示。
          </p>

          <div class="teacher-message-dialog__footer">
            <p>建议标题直接点出问题场景，正文补充课程、资源和遇到的具体困难，方便他人更快参与。</p>
            <div class="teacher-message-actions">
              <button type="button" class="auth-btn auth-btn--secondary" :disabled="submittingTopic" @click="resetTopicForm">清空内容</button>
              <button type="submit" class="auth-btn" :disabled="submittingTopic">{{ submittingTopic ? '发布中...' : '发布主题' }}</button>
            </div>
          </div>
        </form>
      </section>
    </div>

    <div v-if="showReplyEditor && activeReplyMessageId !== null" class="teacher-message-dialog" @click.self="closeReplyEditor">
      <section class="teacher-message-dialog__panel">
        <div class="teacher-message-dialog__head">
          <div>
            <div class="teacher-message-kicker">Reply Editor</div>
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

        <form class="teacher-message-dialog__form" @submit.prevent="submitReply(activeReplyMessageId)">
          <div v-if="activeReplyTarget?.replyId" class="teacher-message-reply-target">
            <span>正在回复 <strong>{{ activeReplyTarget.authorName }}</strong></span>
            <button type="button" class="course-chip course-chip--soft" @click="clearReplyTarget(activeReplyMessageId)">取消</button>
          </div>

          <label class="teacher-message-field">
            <span>{{ activeReplyTarget?.replyId ? '楼中回复' : '发表评论' }}</span>
            <textarea
              v-model.trim="activeReplyDraft"
              maxlength="5000"
              rows="6"
              :placeholder="
                activeReplyDetail?.capabilities.canReply === false
                  ? '当前数据库结构尚未升级，暂不支持学生回帖'
                  : '请输入你的问题、学习反馈或补充说明'
              "
              :disabled="activeReplyDetail?.capabilities.canReply === false || replyingId === activeReplyMessageId"
            ></textarea>
          </label>

          <p class="teacher-message-dialog__hint">
            可以在这里统一编辑对主帖的评论，或对某条回复的楼中回复。
          </p>

          <div class="teacher-message-dialog__footer">
            <p>建议把问题背景、自己已经尝试的方法和希望得到的帮助写清楚，方便老师或其他同学快速回应。</p>
            <div class="teacher-message-actions">
              <button
                type="button"
                class="auth-btn auth-btn--secondary"
                :disabled="replyingId === activeReplyMessageId"
                @click="clearReplyDraft(activeReplyMessageId)"
              >
                清空内容
              </button>
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
import PortalTopNav from '@/components/navigation/PortalTopNav.vue'
import {
  createStudentMessage,
  createStudentMessageReply,
  deleteStudentMessage,
  deleteStudentMessageReply,
  getStudentMessageDetail,
  getStudentMessageList,
  type StudentMessageAuthorRole,
  type StudentMessageDetailData,
  type StudentMessageItem,
  type StudentMessageReplyItem,
} from '@/services/student'
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
const messageList = ref<StudentMessageItem[]>([])
const detailMap = reactive<Record<number, StudentMessageDetailData>>({})
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

const studentName = computed(() => authStore.profile?.name || authStore.profile?.username || '同学')
const headerText = computed(() => `${studentName.value}，这里可以查看教师发布的教学讨论，也可以补充自己的学习问题和课程反馈。`)

const pageSummary = computed(() => {
  if (form.keyword) {
    return `当前正在筛选与“${form.keyword}”相关的话题内容。`
  }

  return '把零散的问题、资源体验和课堂疑问整理成可追踪的交流线索，让学习反馈更容易被看到和回应。'
})

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

const canCreateTopic = computed(() => currentDetail.value?.capabilities.canCreateTopic ?? true)

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

const totalReplyCount = computed(() => messageList.value.reduce((sum, item) => sum + item.replyCount, 0))
const studentTopicCount = computed(() => messageList.value.filter((item) => item.authorRole === 'student').length)
const teacherTopicCount = computed(() => messageList.value.filter((item) => item.authorRole === 'teacher').length)

const heroMetrics = computed(() => [
  { label: '全部主题', value: String(pagination.total).padStart(2, '0'), note: '当前可浏览的交流主题数量' },
  { label: '本页回复', value: String(totalReplyCount.value).padStart(2, '0'), note: '本页主题累计产生的回复数' },
  { label: '学生发起', value: String(studentTopicCount.value).padStart(2, '0'), note: '本页由学生发起的交流主题数' },
  { label: '教师发起', value: String(teacherTopicCount.value).padStart(2, '0'), note: '本页由教师发起的教学讨论数' },
])

const boardSummary = computed(() => {
  if (expandedMessageId.value) {
    return '当前主题已展开，你可以继续浏览回复，或通过弹窗补充自己的问题和反馈。'
  }

  return '点击任意主题卡片即可展开完整讨论内容，查看主帖、评论和楼中回复。'
})

function getRoleLabel(role: StudentMessageAuthorRole) {
  if (role === 'admin') {
    return '管理员'
  }

  if (role === 'student') {
    return '学生'
  }

  return '教师'
}

function formatTopicNumber(index: number) {
  return String((pagination.page - 1) * pagination.pageSize + index + 1).padStart(2, '0')
}

function normalizePage(value: unknown) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
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

function openReplyEditor(messageId: number, reply?: StudentMessageReplyItem) {
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

function syncFormWithRoute() {
  form.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
}

function updateRoute(page = 1) {
  router.push({
    path: '/student/messages',
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

function setReplyTarget(messageId: number, reply: StudentMessageReplyItem) {
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
    detailMap[messageId] = await getStudentMessageDetail(messageId)
  } finally {
    loadingDetailId.value = null
  }
}

async function toggleDiscussion(messageId: number) {
  if (expandedMessageId.value === messageId) {
    expandedMessageId.value = null
    return
  }

  clearMessages()
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
  clearMessages()
  syncFormWithRoute()

  try {
    const data = await getStudentMessageList({
      page: normalizePage(route.query.page),
      pageSize: 4,
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
    pagination.pageSize = 4
    pagination.total = 0
    pagination.totalPages = 0
    errorMessage.value = error?.response?.data?.message || '教学交流列表加载失败'
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
    await createStudentMessage({
      title: topicForm.title,
      content: topicForm.content,
    })
    resetTopicForm()
    closeTopicEditor()
    expandedMessageId.value = null
    successMessage.value = '交流主题已发布。'
    updateRoute(1)
    await loadMessages()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '发布交流主题失败'
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
    await createStudentMessageReply(messageId, {
      content,
      parentReplyId: replyTargets[messageId]?.replyId || null,
    })
    clearReplyDraft(messageId)
    closeReplyEditor()
    successMessage.value = '回复已发布。'
    await Promise.all([loadMessageDetail(messageId), loadMessages()])
    expandedMessageId.value = messageId
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '发布回复失败'
  } finally {
    replyingId.value = null
  }
}

async function removeTopic(item: StudentMessageItem) {
  clearMessages()

  if (!window.confirm(`确认删除交流主题《${item.title}》吗？`)) {
    return
  }

  deletingTopicId.value = item.id

  try {
    await deleteStudentMessage(item.id)
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

async function removeReply(messageId: number, reply: StudentMessageReplyItem) {
  clearMessages()

  if (!window.confirm('确认删除这条回复吗？')) {
    return
  }

  deletingReplyId.value = reply.id

  try {
    await deleteStudentMessageReply(messageId, reply.id)
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
