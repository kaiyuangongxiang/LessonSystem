<template>
  <main class="admin-manage-page admin-course-simple-page">
    <aside class="admin-dashboard-sidebar">
      <div>
        <div class="admin-dashboard-sidebar__eyebrow">ADMIN CONSOLE</div>
        <h1>管理员中心</h1>
      </div>

      <nav class="admin-dashboard-nav">
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin')">总览首页</button>
        <button type="button" class="admin-dashboard-nav__item is-active">账号管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/colleges')">学院管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/courses')">课程管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/materials')">资料管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/videos')">视频管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/messages')">留言管理</button>
      </nav>

      <section class="admin-dashboard-reminder-card admin-dashboard-reminder-card--manage">
        <div class="admin-dashboard-reminder-card__eyebrow">ACCOUNT ACTION</div>
        <ul>
          <li>{{ reminderTexts[0] }}</li>
          <li>{{ reminderTexts[1] }}</li>
        </ul>
      </section>
    </aside>

    <section class="admin-manage-main">
      <header class="admin-manage-head">
        <div>
          <div class="admin-manage-head__eyebrow">ACCOUNT MANAGEMENT</div>
          <h2>管理员账号管理</h2>
          <p>{{ headerText }}</p>
        </div>
        <div class="admin-manage-head__actions">
          <button type="button" class="auth-btn auth-btn--secondary" @click="router.push('/admin')">返回总览</button>
          <button type="button" class="auth-btn" @click="openCreateEditor">新增管理员</button>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success admin-manage-feedback">{{ successMessage }}</p>

      <section class="admin-manage-stats">
        <article class="admin-manage-stat-card">
          <span>账号总数</span>
          <strong>{{ stats.total }}</strong>
          <em>当前系统管理员账号数量</em>
        </article>
        <article class="admin-manage-stat-card">
          <span>已设置姓名</span>
          <strong>{{ stats.namedCount }}</strong>
          <em>已补全真实姓名的账号数量</em>
        </article>
        <article class="admin-manage-stat-card is-highlight">
          <span>当前登录账号</span>
          <strong>{{ currentAdminLabel }}</strong>
          <em>当前操作账号不可删除</em>
        </article>
        <article class="admin-manage-stat-card">
          <span>当前页码</span>
          <strong>{{ pagination.page }}</strong>
          <em>共 {{ Math.max(pagination.totalPages, 1) }} 页</em>
        </article>
      </section>

      <section class="admin-manage-panel admin-course-list-panel">
        <div class="admin-manage-panel__head">
          <div>
            <div class="admin-manage-panel__eyebrow">ACCOUNT LIST</div>
            <h3>管理员列表</h3>
          </div>
          <div class="admin-manage-panel__meta">共 {{ pagination.total }} 个账号 · 已命名 {{ stats.namedCount }} 个</div>
        </div>

        <div v-if="loading" class="course-detail-empty course-detail-empty--compact">管理员列表加载中...</div>

        <div v-else-if="accountList.length" class="admin-course-crud-list">
          <article v-for="item in accountList" :key="item.id" class="admin-course-crud-item">
            <div class="admin-course-crud-item__main">
              <div class="admin-course-crud-item__head">
                <strong>{{ item.name }}</strong>
                <span>最近更新 {{ item.updateTime }}</span>
              </div>

              <p>{{ item.realName ? `真实姓名：${item.realName}` : '当前尚未设置真实姓名，建议补齐以便后台协作识别。' }}</p>

              <div class="admin-course-crud-item__status">
                <span class="admin-course-status-badge is-neutral">账号：{{ item.username }}</span>
                <span :class="['admin-course-status-badge', item.realName ? 'is-success' : 'is-warning']">
                  {{ item.realName ? '已设置姓名' : '待补姓名' }}
                </span>
                <span :class="['admin-course-status-badge', item.isCurrent ? 'is-success' : 'is-neutral']">
                  {{ item.isCurrent ? '当前登录账号' : '普通管理员账号' }}
                </span>
              </div>

              <div class="admin-course-crud-item__meta">
                <span>ID {{ item.id }}</span>
                <span>创建于 {{ item.createTime }}</span>
                <span>更新于 {{ item.updateTime }}</span>
              </div>
            </div>

            <div class="admin-course-crud-item__actions">
              <button type="button" class="course-chip course-chip--soft" @click="openEditEditor(item)">修改</button>
              <button
                type="button"
                class="course-chip admin-manage-delete-btn"
                :disabled="deletingId === item.id || item.isCurrent"
                @click="removeAdmin(item)"
              >
                {{ item.isCurrent ? '当前账号' : deletingId === item.id ? '删除中...' : '删除' }}
              </button>
            </div>
          </article>
        </div>

        <div v-else class="course-detail-empty">当前没有符合条件的管理员账号。</div>

        <section v-if="pagination.total > 0" class="admin-manage-pagination">
          <div class="admin-manage-pagination__desc">当前第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</div>
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
            <button type="button" class="course-chip" :disabled="pagination.page >= pagination.totalPages || loading" @click="changePage(pagination.page + 1)">下一页</button>
          </div>
        </section>
      </section>
    </section>
  </main>

  <div v-if="editorVisible" class="admin-course-editor-mask" @click.self="closeEditor">
    <section class="admin-course-editor">
      <div class="admin-course-editor__head">
        <div>
          <div class="admin-manage-panel__eyebrow">ACCOUNT EDITOR</div>
          <h3>{{ editorTitle }}</h3>
        </div>
        <button type="button" class="course-chip course-chip--soft" @click="closeEditor">关闭</button>
      </div>

      <form class="admin-course-editor__form" @submit.prevent="submitEditor">
        <label class="admin-manage-field">
          <span>管理员账号</span>
          <input v-model.trim="editorForm.username" type="text" maxlength="50" placeholder="请输入管理员登录账号" />
        </label>

        <label class="admin-manage-field">
          <span>真实姓名</span>
          <input v-model.trim="editorForm.realName" type="text" maxlength="50" placeholder="请输入真实姓名，可为空" />
        </label>

        <label class="admin-manage-field">
          <span>{{ editingId ? '重置密码' : '登录密码' }}</span>
          <input
            v-model.trim="editorForm.password"
            type="password"
            maxlength="50"
            :placeholder="editingId ? '如不修改密码可留空，修改时至少 6 位' : '请输入至少 6 位密码'"
          />
        </label>

        <p class="admin-course-editor__hint">
          {{ editingId ? '编辑账号时密码可留空，系统会保留原密码。' : '新增账号后可立即使用新账号登录管理员中心。' }}
        </p>

        <div class="admin-course-editor__footer">
          <p>系统会阻止删除当前登录账号，并至少保留一个管理员账号，避免后台失去管理入口。</p>
          <div class="admin-course-editor__actions">
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="saving" @click="closeEditor">取消</button>
            <button type="submit" class="auth-btn" :disabled="saving">{{ saving ? '保存中...' : editorActionText }}</button>
          </div>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createAdminAccount,
  deleteAdminAccount,
  getAdminAccountList,
  updateAdminAccount,
  type AdminAccountItem,
  type AdminAccountStats,
} from '@/services/admin'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const editorVisible = ref(false)
const editingId = ref<number | null>(null)

const accountList = ref<AdminAccountItem[]>([])

const editorForm = reactive({
  username: '',
  realName: '',
  password: '',
})

const stats = reactive<AdminAccountStats>({
  total: 0,
  namedCount: 0,
})

const pagination = reactive({
  page: 1,
  pageSize: 6,
  total: 0,
  totalPages: 0,
})

const currentAdminLabel = computed(() => authStore.profile?.name || authStore.profile?.username || '当前管理员')

const headerText = computed(() => {
  const name = authStore.profile?.name || authStore.profile?.username || '管理员'
  return `${name}，这里统一维护后台管理员账号，支持新增、修改、删除和搜索。`
})

const reminderTexts = computed(() => {
  return [
    stats.total > 0 ? `当前共有 ${stats.total} 个管理员账号可维护。` : '当前还没有管理员账号数据。',
    stats.namedCount < stats.total ? `仍有 ${stats.total - stats.namedCount} 个账号未设置真实姓名。` : '当前管理员账号都已设置真实姓名。',
  ]
})

const pageNumbers = computed(() => {
  const totalPages = Math.max(pagination.totalPages, 1)
  const start = Math.max(1, Math.min(pagination.page - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

const editorTitle = computed(() => (editingId.value ? '修改管理员账号' : '新增管理员账号'))
const editorActionText = computed(() => (editingId.value ? '保存修改' : '确认新增'))

function normalizePage(value: unknown) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function clearFeedback() {
  errorMessage.value = ''
  successMessage.value = ''
}

function updateRoute(page = 1) {
  router.push({
    path: '/admin/accounts',
    query: {
      page: String(page),
    },
  })
}

function resetEditorForm() {
  editingId.value = null
  editorForm.username = ''
  editorForm.realName = ''
  editorForm.password = ''
}

function openCreateEditor() {
  clearFeedback()
  resetEditorForm()
  editorVisible.value = true
}

function openEditEditor(item: AdminAccountItem) {
  clearFeedback()
  editingId.value = item.id
  editorForm.username = item.username
  editorForm.realName = item.realName
  editorForm.password = ''
  editorVisible.value = true
}

function closeEditor() {
  if (saving.value) {
    return
  }

  editorVisible.value = false
  resetEditorForm()
}

function changePage(page: number) {
  updateRoute(page)
}

async function submitEditor() {
  clearFeedback()

  if (!editorForm.username) {
    errorMessage.value = '管理员账号不能为空'
    return
  }

  if (!editingId.value && !editorForm.password) {
    errorMessage.value = '新增管理员时必须填写密码'
    return
  }

  saving.value = true

  try {
    const payload = {
      username: editorForm.username,
      realName: editorForm.realName,
      password: editorForm.password || undefined,
    }

    if (editingId.value) {
      const result = await updateAdminAccount(editingId.value, payload)
      successMessage.value = `管理员账号《${result.username}》已更新。`
      closeEditor()
      await loadAdmins()
    } else {
      const result = await createAdminAccount(payload)
      successMessage.value = `管理员账号《${result.username}》已创建。`
      closeEditor()

      if (pagination.page !== 1) {
        updateRoute(1)
      } else {
        await loadAdmins()
      }
    }
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '管理员账号保存失败'
  } finally {
    saving.value = false
  }
}

async function removeAdmin(item: AdminAccountItem) {
  clearFeedback()

  if (item.isCurrent) {
    errorMessage.value = '当前登录的管理员账号不能删除'
    return
  }

  if (!window.confirm(`确认删除管理员账号《${item.username}》吗？`)) {
    return
  }

  deletingId.value = item.id

  try {
    await deleteAdminAccount(item.id)
    successMessage.value = `管理员账号《${item.username}》已删除。`

    if (accountList.value.length === 1 && pagination.page > 1) {
      updateRoute(pagination.page - 1)
    } else {
      await loadAdmins()
    }
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '管理员账号删除失败'
  } finally {
    deletingId.value = null
  }
}

async function loadAdmins() {
  loading.value = true
  errorMessage.value = ''

  try {
    const data = await getAdminAccountList({
      page: normalizePage(route.query.page),
      pageSize: 6,
    })

    accountList.value = data.list
    stats.total = data.stats.total
    stats.namedCount = data.stats.namedCount
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
  } catch (error: any) {
    accountList.value = []
    stats.total = 0
    stats.namedCount = 0
    pagination.page = 1
    pagination.pageSize = 6
    pagination.total = 0
    pagination.totalPages = 0
    errorMessage.value = error?.response?.data?.message || '管理员账号列表加载失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.fullPath,
  () => {
    loadAdmins()
  },
  { immediate: true },
)
</script>
