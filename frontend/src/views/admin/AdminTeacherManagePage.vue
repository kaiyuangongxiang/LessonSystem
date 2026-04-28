<template>
  <main class="admin-manage-page admin-course-simple-page">
    <aside class="admin-dashboard-sidebar">
      <div>
        <div class="admin-dashboard-sidebar__eyebrow">ADMIN CONSOLE</div>
        <h1>管理员中心</h1>
      </div>

      <AdminSidebarNav active="teachers" />
      <nav v-if="false" class="admin-dashboard-nav">
        <button type="button" class="admin-dashboard-nav__item admin-dashboard-nav__item--system" @click="router.push('/admin/system')">系统管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin')">总览首页</button>
        <button type="button" class="admin-dashboard-nav__item is-active">教师用户</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/accounts')">账号管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/colleges')">学院管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/courses')">课程管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/assets')">资料库</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/materials')">资料管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/messages')">留言管理</button>
      </nav>

      <section class="admin-dashboard-reminder-card admin-dashboard-reminder-card--manage">
        <div class="admin-dashboard-reminder-card__eyebrow">TEACHER ACTION</div>
        <ul>
          <li>{{ reminderTexts[0] }}</li>
          <li>{{ reminderTexts[1] }}</li>
        </ul>
      </section>
    </aside>

    <section class="admin-manage-main">
      <header class="admin-manage-head">
        <div>
          <div class="admin-manage-head__eyebrow">TEACHER USER MANAGEMENT</div>
          <h2>教师用户信息管理</h2>
          <p>{{ headerText }}</p>
        </div>
        <div class="admin-manage-head__actions">
          <button type="button" class="auth-btn" @click="openCreateEditor">新增教师用户</button>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success admin-manage-feedback">{{ successMessage }}</p>

      <section class="admin-manage-stats">
        <article class="admin-manage-stat-card">
          <span>教师总数</span>
          <strong>{{ stats.total }}</strong>
          <em>当前可用教师账号数量</em>
        </article>
        <article class="admin-manage-stat-card">
          <span>已绑定学院</span>
          <strong>{{ stats.collegeAssignedCount }}</strong>
          <em>已完成学院归属的教师数量</em>
        </article>
        <article class="admin-manage-stat-card is-highlight">
          <span>已填写邮箱</span>
          <strong>{{ stats.emailBoundCount }}</strong>
          <em>已完善邮箱信息的教师数量</em>
        </article>
        <article class="admin-manage-stat-card">
          <span>已完善简介</span>
          <strong>{{ stats.profileCompletedCount }}</strong>
          <em>已填写个人简介的教师数量</em>
        </article>
      </section>

      <section class="admin-manage-panel admin-course-list-panel">
        <div class="admin-manage-panel__head">
          <div>
            <div class="admin-manage-panel__eyebrow">TEACHER USER LIST</div>
            <h3>教师用户列表</h3>
          </div>
          <div class="admin-manage-panel__meta">共 {{ pagination.total }} 位教师 · 第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</div>
        </div>

        <div v-if="loading" class="course-detail-empty course-detail-empty--compact">教师用户列表加载中...</div>

        <div v-else-if="teacherList.length" class="admin-course-crud-list">
          <article v-for="item in teacherList" :key="item.id" class="admin-course-crud-item">
            <div class="admin-course-crud-item__main">
              <div class="admin-course-crud-item__head">
                <strong>{{ item.name }}</strong>
              </div>

              <p>{{ item.profile || '当前尚未填写个人简介，可在编辑中补充教师个人介绍。' }}</p>

              <div class="admin-course-crud-item__status">
                <span class="admin-course-status-badge is-neutral">账号：{{ item.username }}</span>
                <span class="admin-course-status-badge is-neutral">性别：{{ item.gender }}</span>
                <span class="admin-course-status-badge is-neutral">学院：{{ item.collegeName }}</span>
                <span :class="['admin-course-status-badge', item.email ? 'is-success' : 'is-warning']">
                  {{ item.email ? `邮箱：${item.email}` : '未填写邮箱' }}
                </span>
              </div>

              <div class="admin-course-crud-item__meta">
                <span>ID {{ item.id }}</span>
                <span>课程 {{ item.courseCount }}</span>
                <span>资源 {{ item.resourceCount }}</span>
                <span>注册于 {{ item.registerTime }}</span>
                <span>最近更新 {{ item.updateTime }}</span>
              </div>
            </div>

            <div class="admin-course-crud-item__actions">
              <button type="button" class="course-chip course-chip--soft" @click="openEditEditor(item)">修改</button>
              <button type="button" class="course-chip admin-manage-delete-btn" :disabled="deletingId === item.id" @click="removeTeacher(item)">
                {{ deletingId === item.id ? '删除中...' : '删除' }}
              </button>
            </div>
          </article>
        </div>

        <div v-else class="course-detail-empty">当前还没有教师用户数据。</div>

        <section v-if="pagination.total > 0" class="admin-manage-pagination">
          <div class="admin-manage-pagination__desc">当前第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</div>
          <div class="admin-manage-pagination__actions">
            <button type="button" class="course-chip course-pagination__nav" :disabled="pagination.page <= 1 || loading" @click="changePage(pagination.page - 1)" aria-label="上一页">‹</button>
            <button type="button" class="admin-manage-page-btn is-active" :disabled="loading" aria-current="page">{{ pagination.page }}</button>
            <button type="button" class="course-chip course-pagination__nav" :disabled="pagination.page >= pagination.totalPages || loading" @click="changePage(pagination.page + 1)" aria-label="下一页">›</button>
          </div>
        </section>
      </section>
    </section>
  </main>

  <div v-if="editorVisible" class="admin-course-editor-mask" @click.self="closeEditor">
    <section class="admin-course-editor">
      <div class="admin-course-editor__head">
        <div>
          <div class="admin-manage-panel__eyebrow">TEACHER USER EDITOR</div>
          <h3>{{ editorTitle }}</h3>
        </div>
        <button type="button" class="course-chip course-chip--soft" @click="closeEditor">关闭</button>
      </div>

      <form class="admin-course-editor__form" @submit.prevent="submitEditor">
        <div class="teacher-profile-form__row">
          <label class="admin-manage-field">
            <span>用户名</span>
            <input v-model.trim="editorForm.username" type="text" maxlength="50" placeholder="请输入教师登录用户名" />
          </label>

          <label class="admin-manage-field">
            <span>教师姓名</span>
            <input v-model.trim="editorForm.teacherName" type="text" maxlength="50" placeholder="请输入教师姓名" />
          </label>
        </div>

        <div class="teacher-profile-form__row">
          <label class="admin-manage-field">
            <span>性别</span>
            <select v-model="editorForm.gender">
              <option value="">请选择性别</option>
              <option v-for="item in genderOptions" :key="item" :value="item">
                {{ item }}
              </option>
            </select>
          </label>

          <label class="admin-manage-field">
            <span>所属学院</span>
            <select v-model="editorForm.collegeId">
              <option value="">请选择所属学院</option>
              <option v-for="college in collegeOptions" :key="college.id" :value="String(college.id)">
                {{ college.name }}
              </option>
            </select>
          </label>
        </div>

        <label class="admin-manage-field admin-manage-field--full">
          <span>邮箱</span>
          <input v-model.trim="editorForm.email" type="email" maxlength="100" placeholder="请输入邮箱，可为空" />
        </label>

        <label class="admin-manage-field admin-manage-field--full">
          <span>个人简介</span>
          <textarea v-model.trim="editorForm.profile" maxlength="2000" rows="6" placeholder="请输入个人简介，可为空"></textarea>
        </label>

        <label class="admin-manage-field admin-manage-field--full">
          <span>{{ editingId ? '重置密码' : '登录密码' }}</span>
          <input
            v-model.trim="editorForm.password"
            type="password"
            maxlength="50"
            :placeholder="editingId ? '如不修改密码可留空，修改时至少 6 位' : '请输入至少 6 位密码'"
          />
        </label>

        <p class="admin-course-editor__hint">
          {{ editingId ? '修改教师资料时密码可留空，系统会保留原密码。' : '新增教师用户后，可直接用于教师端登录。' }}
        </p>

        <div class="admin-course-editor__footer">
          <p>删除教师用户后仅禁用账号，不会清空该教师已发布的课程、资料和视频数据。</p>
          <div class="admin-course-editor__actions">
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
import AdminSidebarNav from '@/components/navigation/AdminSidebarNav.vue'
import {
  createAdminTeacherUser,
  deleteAdminTeacherUser,
  getAdminTeacherUserList,
  updateAdminTeacherUser,
  type AdminCollegeOption,
  type AdminTeacherItem,
  type AdminTeacherStats,
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

const teacherList = ref<AdminTeacherItem[]>([])
const collegeOptions = ref<AdminCollegeOption[]>([])
const genderOptions = ref<string[]>(['男', '女', '未知'])

const editorForm = reactive({
  username: '',
  teacherName: '',
  gender: '',
  collegeId: '',
  email: '',
  profile: '',
  password: '',
})

const stats = reactive<AdminTeacherStats>({
  total: 0,
  collegeAssignedCount: 0,
  emailBoundCount: 0,
  profileCompletedCount: 0,
})

const pagination = reactive({
  page: 1,
  pageSize: 4,
  total: 0,
  totalPages: 0,
})

const headerText = computed(() => {
  const name = authStore.profile?.name || authStore.profile?.username || '管理员'
  return `${name}，这里统一维护教师账号的基础信息，支持新增、修改和禁用管理。`
})

const reminderTexts = computed(() => {
  return [
    stats.total > 0 ? `当前共有 ${stats.total} 位教师用户可管理。` : '当前还没有教师账号，可先新增基础教师用户。',
    stats.profileCompletedCount < stats.total
      ? `仍有 ${stats.total - stats.profileCompletedCount} 位教师尚未完善个人简介。`
      : '当前教师账号资料完善度较好，可继续维护邮箱等联系信息。',
  ]
})



const editorTitle = computed(() => (editingId.value ? '修改教师用户' : '新增教师用户'))
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
    path: '/admin/teachers',
    query: {
      page: String(page),
    },
  })
}

function resetEditorForm() {
  editingId.value = null
  editorForm.username = ''
  editorForm.teacherName = ''
  editorForm.gender = ''
  editorForm.collegeId = ''
  editorForm.email = ''
  editorForm.profile = ''
  editorForm.password = ''
}

function openCreateEditor() {
  clearFeedback()
  resetEditorForm()
  editorVisible.value = true
}

function openEditEditor(item: AdminTeacherItem) {
  clearFeedback()
  editingId.value = item.id
  editorForm.username = item.username
  editorForm.teacherName = item.teacherName || item.name
  editorForm.gender = item.gender
  editorForm.collegeId = item.collegeId ? String(item.collegeId) : ''
  editorForm.email = item.email || ''
  editorForm.profile = item.profile || ''
  editorForm.password = ''
  editorVisible.value = true
}

function closeEditor(force: boolean | Event = false) {
  const shouldForce = force === true
  if (saving.value && !shouldForce) {
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

  if (!editorForm.username || !editorForm.teacherName || !editorForm.gender || !editorForm.collegeId) {
    errorMessage.value = '请完整填写教师基础信息'
    return
  }

  if (!editingId.value && !editorForm.password) {
    errorMessage.value = '新增教师用户时必须填写登录密码'
    return
  }

  saving.value = true

  try {
    const payload = {
      username: editorForm.username,
      teacherName: editorForm.teacherName,
      gender: editorForm.gender,
      collegeId: editorForm.collegeId,
      email: editorForm.email,
      profile: editorForm.profile,
      password: editorForm.password || undefined,
    }

    if (editingId.value) {
      const result = await updateAdminTeacherUser(editingId.value, payload)
      successMessage.value = `教师用户《${result.name}》已更新。`
      closeEditor(true)
      await loadTeachers()
    } else {
      const result = await createAdminTeacherUser(payload)
      successMessage.value = `教师用户《${result.name}》已创建。`
      closeEditor(true)

      if (pagination.page !== 1) {
        updateRoute(1)
      } else {
        await loadTeachers()
      }
    }
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '教师用户保存失败'
  } finally {
    saving.value = false
  }
}

async function removeTeacher(item: AdminTeacherItem) {
  clearFeedback()

  if (!window.confirm(`确认删除教师用户《${item.name}》吗？删除后该教师账号将无法登录。`)) {
    return
  }

  deletingId.value = item.id

  try {
    await deleteAdminTeacherUser(item.id)
    successMessage.value = `教师用户《${item.name}》已删除。`

    if (teacherList.value.length === 1 && pagination.page > 1) {
      updateRoute(pagination.page - 1)
    } else {
      await loadTeachers()
    }
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '教师用户删除失败'
  } finally {
    deletingId.value = null
  }
}

async function loadTeachers() {
  loading.value = true
  errorMessage.value = ''

  try {
    const data = await getAdminTeacherUserList({
      page: normalizePage(route.query.page),
      pageSize: 4,
    })

    teacherList.value = data.list
    collegeOptions.value = data.formOptions.colleges
    genderOptions.value = data.formOptions.genders
    stats.total = data.stats.total
    stats.collegeAssignedCount = data.stats.collegeAssignedCount
    stats.emailBoundCount = data.stats.emailBoundCount
    stats.profileCompletedCount = data.stats.profileCompletedCount
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
  } catch (error: any) {
    teacherList.value = []
    collegeOptions.value = []
    genderOptions.value = ['男', '女', '未知']
    stats.total = 0
    stats.collegeAssignedCount = 0
    stats.emailBoundCount = 0
    stats.profileCompletedCount = 0
    pagination.page = 1
    pagination.pageSize = 4
    pagination.total = 0
    pagination.totalPages = 0
    errorMessage.value = error?.response?.data?.message || '教师用户列表加载失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.fullPath,
  () => {
    loadTeachers()
  },
  { immediate: true },
)
</script>
