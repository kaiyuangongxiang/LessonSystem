<template>
  <main class="admin-manage-page admin-system-page">
    <aside class="admin-dashboard-sidebar">
      <div>
        <div class="admin-dashboard-sidebar__eyebrow">ADMIN CONSOLE</div>
        <h1>管理员中心</h1>
      </div>

      <AdminSidebarNav active="system" />
      <nav v-if="false" class="admin-dashboard-nav">
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin')">总览首页</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/teachers')">教师用户</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/accounts')">账号管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/colleges')">学院管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/courses')">课程管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/assets')">素材库</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/materials')">资料管理</button>
        <button type="button" class="admin-dashboard-nav__item admin-dashboard-nav__item--system is-active">系统管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/messages')">留言管理</button>
      </nav>

      <section class="admin-dashboard-reminder-card admin-dashboard-reminder-card--manage">
        <div class="admin-dashboard-reminder-card__eyebrow">SYSTEM ACTION</div>
        <ul>
          <li>{{ reminderTexts[0] }}</li>
          <li>{{ reminderTexts[1] }}</li>
        </ul>
      </section>
    </aside>

    <section class="admin-manage-main">
      <header class="admin-manage-head">
        <div>
          <div class="admin-manage-head__eyebrow">SYSTEM MANAGEMENT</div>
          <h2>系统管理</h2>
          <p>{{ headerText }}</p>
        </div>
        <div class="admin-manage-head__actions">
          <span class="course-chip course-chip--soft">前台门户配置</span>
          <button type="button" class="auth-btn auth-btn--secondary" @click="router.push('/admin')">返回总览</button>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>
      <p v-if="successMessage" class="feedback-text feedback-text--success admin-manage-feedback">{{ successMessage }}</p>

      <section class="admin-manage-stats">
        <article class="admin-manage-stat-card">
          <span>公告总数</span>
          <strong>{{ stats.noticeCount }}</strong>
          <em>可统一管理前台展示公告</em>
        </article>
        <article class="admin-manage-stat-card">
          <span>已发布公告</span>
          <strong>{{ stats.publishedNoticeCount }}</strong>
          <em>前台首页当前可见公告</em>
        </article>
        <article class="admin-manage-stat-card">
          <span>停用公告</span>
          <strong>{{ stats.disabledNoticeCount }}</strong>
          <em>已保留但暂不展示的公告</em>
        </article>
        <article class="admin-manage-stat-card is-highlight">
          <span>最近配置时间</span>
          <strong>{{ systemProfile.updateTime || '未配置' }}</strong>
          <em>{{ systemProfile.updateAdminName || '等待管理员维护系统信息' }}</em>
        </article>
      </section>

      <section class="admin-system-grid">
        <section class="admin-manage-panel">
          <div class="admin-manage-panel__head">
            <div>
              <div class="admin-manage-panel__eyebrow">SYSTEM PROFILE</div>
              <h3>系统介绍</h3>
            </div>
            <div class="admin-manage-panel__meta">对应前台首页系统名称、主标题与介绍区域</div>
          </div>

          <form class="admin-system-profile-form" @submit.prevent="submitProfile">
            <label class="admin-manage-field">
              <span>系统名称</span>
              <input v-model.trim="profileForm.systemName" type="text" maxlength="100" placeholder="请输入前台显示的系统名称" />
            </label>

            <label class="admin-manage-field admin-manage-field--full">
              <span>首页主标题</span>
              <input v-model.trim="profileForm.heroTitle" type="text" maxlength="120" placeholder="请输入首页大标题内容" />
            </label>

            <label class="admin-manage-field admin-manage-field--full">
              <span>系统介绍</span>
              <textarea
                v-model.trim="profileForm.systemIntro"
                maxlength="5000"
                rows="8"
                placeholder="请输入首页展示的系统介绍内容"
              ></textarea>
            </label>

            <div class="admin-course-editor__footer">
              <div class="admin-course-editor__actions">
                <button type="submit" class="auth-btn" :disabled="savingProfile">{{ savingProfile ? '保存中...' : '保存系统介绍' }}</button>
              </div>
            </div>
          </form>
        </section>

        <section class="admin-manage-panel">
          <div class="admin-manage-panel__head">
            <div>
              <div class="admin-manage-panel__eyebrow">SYSTEM NOTICE</div>
              <h3>滚动公告管理</h3>
            </div>
            <div class="admin-manage-head__actions">
              <span class="admin-manage-panel__meta">前台首页公告区域取已发布公告</span>
              <button type="button" class="auth-btn" @click="openCreateNotice">新增公告</button>
            </div>
          </div>

          <div v-if="noticeList.length" class="admin-course-crud-list admin-system-notice-list">
            <article v-for="item in noticeList" :key="item.id" class="admin-course-crud-item admin-system-notice-item">
              <div class="admin-course-crud-item__main">
                <div class="admin-course-crud-item__head">
                  <strong>{{ item.title }}</strong>
                </div>
                <p>{{ item.content }}</p>
                <div class="admin-course-crud-item__status">
                  <span :class="['admin-course-status-badge', item.status === 1 ? 'is-success' : 'is-warning']">
                    {{ item.statusLabel }}
                  </span>
                </div>
                <div class="admin-course-crud-item__meta">
                  <span>发布时间 {{ item.publishTime }}</span>
                  <span>最近更新 {{ item.updateTime }}</span>
                  <span>发布人 {{ item.publisherName }}</span>
                </div>
              </div>

              <div class="admin-course-crud-item__actions">
                <button type="button" class="course-chip course-chip--soft" @click="openEditNotice(item)">修改</button>
                <button
                  type="button"
                  class="course-chip"
                  :disabled="togglingNoticeId === item.id"
                  @click="toggleNoticeStatus(item)"
                >
                  {{ togglingNoticeId === item.id ? '处理中...' : item.status === 1 ? '停用' : '发布' }}
                </button>
                <button
                  type="button"
                  class="course-chip admin-manage-delete-btn"
                  :disabled="deletingNoticeId === item.id"
                  @click="removeNotice(item)"
                >
                  {{ deletingNoticeId === item.id ? '删除中...' : '删除' }}
                </button>
              </div>
            </article>
          </div>
          <div v-else-if="!loading" class="course-detail-empty">当前还没有公告，可先新增一条前台公告。</div>
        </section>
      </section>
    </section>
  </main>

  <div v-if="editorVisible" class="admin-course-editor-mask" @click.self="closeEditor">
    <section class="admin-course-editor">
      <div class="admin-course-editor__head">
        <div>
          <div class="admin-manage-panel__eyebrow">NOTICE EDITOR</div>
          <h3>{{ editingNoticeId ? '修改公告' : '新增公告' }}</h3>
        </div>
        <button type="button" class="course-chip course-chip--soft" @click="closeEditor">关闭</button>
      </div>

      <form class="admin-course-editor__form" @submit.prevent="submitNotice">
        <label class="admin-manage-field">
          <span>公告标题</span>
          <input v-model.trim="noticeForm.title" type="text" maxlength="200" placeholder="请输入公告标题" />
        </label>

        <label class="admin-manage-field">
          <span>发布状态</span>
          <select v-model="noticeForm.status">
            <option :value="1">已发布</option>
            <option :value="0">停用</option>
          </select>
        </label>

        <label class="admin-manage-field admin-manage-field--full">
          <span>公告内容</span>
          <textarea
            v-model.trim="noticeForm.content"
            maxlength="5000"
            rows="8"
            placeholder="请输入前台首页展示的公告内容"
          ></textarea>
        </label>

        <div class="admin-course-editor__footer">
          <p>已发布的公告会进入前台首页公告区域，停用后会从前台隐藏但仍可继续编辑。</p>
          <div class="admin-course-editor__actions">
            <button type="button" class="auth-btn auth-btn--secondary" :disabled="savingNotice" @click="closeEditor">取消</button>
            <button type="submit" class="auth-btn" :disabled="savingNotice">{{ savingNotice ? '保存中...' : '保存公告' }}</button>
          </div>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminSidebarNav from '@/components/navigation/AdminSidebarNav.vue'
import {
  createAdminNotice,
  deleteAdminNotice,
  getAdminSystemManage,
  updateAdminNotice,
  updateAdminSystemProfile,
  type AdminSystemNoticeItem,
  type AdminSystemProfile,
  type AdminSystemStats,
} from '@/services/admin'
import { useAuthStore } from '@/stores/auth'

const DEFAULT_SYSTEM_HERO_TITLE = '让课程、资料与视频在一个入口里协同'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const savingProfile = ref(false)
const savingNotice = ref(false)
const deletingNoticeId = ref<number | null>(null)
const togglingNoticeId = ref<number | null>(null)
const editorVisible = ref(false)
const editingNoticeId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')

const systemProfile = reactive<AdminSystemProfile>({
  id: null,
  systemName: '',
  heroTitle: DEFAULT_SYSTEM_HERO_TITLE,
  systemIntro: '',
  updateTime: '',
  updateAdminName: '',
})

const stats = reactive<AdminSystemStats>({
  noticeCount: 0,
  publishedNoticeCount: 0,
  disabledNoticeCount: 0,
})

const profileForm = reactive({
  systemName: '',
  heroTitle: DEFAULT_SYSTEM_HERO_TITLE,
  systemIntro: '',
})

const noticeForm = reactive({
  title: '',
  content: '',
  status: 1,
})

const noticeList = ref<AdminSystemNoticeItem[]>([])

const headerText = computed(() => {
  const name = authStore.profile?.name || authStore.profile?.username || '管理员'
  return `${name}，这里用于维护前台首页的系统介绍和滚动公告内容。`
})

const reminderTexts = computed(() => [
  stats.publishedNoticeCount > 0 ? `当前已有 ${stats.publishedNoticeCount} 条公告正在前台展示。` : '当前前台还没有已发布公告。',
  systemProfile.updateTime ? `系统介绍最近一次更新于 ${systemProfile.updateTime}。` : '系统介绍仍可继续完善，以便前台首页展示更完整。',
])

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function applySystemData(data: { profile: AdminSystemProfile; notices: AdminSystemNoticeItem[]; stats: AdminSystemStats }) {
  systemProfile.id = data.profile.id
  systemProfile.systemName = data.profile.systemName
  systemProfile.heroTitle = data.profile.heroTitle || DEFAULT_SYSTEM_HERO_TITLE
  systemProfile.systemIntro = data.profile.systemIntro
  systemProfile.updateTime = data.profile.updateTime
  systemProfile.updateAdminName = data.profile.updateAdminName

  profileForm.systemName = data.profile.systemName
  profileForm.heroTitle = data.profile.heroTitle || DEFAULT_SYSTEM_HERO_TITLE
  profileForm.systemIntro = data.profile.systemIntro

  stats.noticeCount = data.stats.noticeCount
  stats.publishedNoticeCount = data.stats.publishedNoticeCount
  stats.disabledNoticeCount = data.stats.disabledNoticeCount

  noticeList.value = data.notices
}

async function loadSystemData() {
  loading.value = true
  errorMessage.value = ''

  try {
    const data = await getAdminSystemManage()
    applySystemData(data)
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '系统管理数据加载失败'
  } finally {
    loading.value = false
  }
}

async function submitProfile() {
  clearMessages()
  savingProfile.value = true

  try {
    const profile = await updateAdminSystemProfile({
      systemName: profileForm.systemName,
      heroTitle: profileForm.heroTitle || DEFAULT_SYSTEM_HERO_TITLE,
      systemIntro: profileForm.systemIntro,
    })

    systemProfile.id = profile.id
    systemProfile.systemName = profile.systemName
    systemProfile.heroTitle = profile.heroTitle || DEFAULT_SYSTEM_HERO_TITLE
    systemProfile.systemIntro = profile.systemIntro
    systemProfile.updateTime = profile.updateTime
    systemProfile.updateAdminName = profile.updateAdminName
    successMessage.value = '系统介绍已更新'
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '系统介绍保存失败'
  } finally {
    savingProfile.value = false
  }
}

function resetNoticeForm() {
  noticeForm.title = ''
  noticeForm.content = ''
  noticeForm.status = 1
}

function openCreateNotice() {
  clearMessages()
  editingNoticeId.value = null
  resetNoticeForm()
  editorVisible.value = true
}

function openEditNotice(item: AdminSystemNoticeItem) {
  clearMessages()
  editingNoticeId.value = item.id
  noticeForm.title = item.title
  noticeForm.content = item.content
  noticeForm.status = item.status
  editorVisible.value = true
}

function closeEditor() {
  if (savingNotice.value) {
    return
  }

  editorVisible.value = false
  editingNoticeId.value = null
  resetNoticeForm()
}

async function submitNotice() {
  clearMessages()
  savingNotice.value = true

  try {
    if (editingNoticeId.value) {
      await updateAdminNotice(editingNoticeId.value, {
        title: noticeForm.title,
        content: noticeForm.content,
        status: noticeForm.status,
      })
      successMessage.value = '公告已更新'
    } else {
      await createAdminNotice({
        title: noticeForm.title,
        content: noticeForm.content,
        status: noticeForm.status,
      })
      successMessage.value = '公告已创建'
    }

    closeEditor()
    await loadSystemData()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '公告保存失败'
  } finally {
    savingNotice.value = false
  }
}

async function toggleNoticeStatus(item: AdminSystemNoticeItem) {
  clearMessages()
  togglingNoticeId.value = item.id

  try {
    await updateAdminNotice(item.id, {
      title: item.title,
      content: item.content,
      status: item.status === 1 ? 0 : 1,
    })
    successMessage.value = item.status === 1 ? '公告已停用' : '公告已发布'
    await loadSystemData()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '公告状态更新失败'
  } finally {
    togglingNoticeId.value = null
  }
}

async function removeNotice(item: AdminSystemNoticeItem) {
  clearMessages()

  if (!window.confirm(`确认删除公告《${item.title}》吗？`)) {
    return
  }

  deletingNoticeId.value = item.id

  try {
    await deleteAdminNotice(item.id)
    successMessage.value = `公告《${item.title}》已删除`
    await loadSystemData()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '公告删除失败'
  } finally {
    deletingNoticeId.value = null
  }
}

onMounted(() => {
  loadSystemData()
})
</script>
