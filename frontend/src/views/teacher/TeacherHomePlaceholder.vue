<template>
  <main class="teacher-dashboard-page">
    <aside class="teacher-dashboard-sidebar">
      <div>
        <div class="teacher-dashboard-sidebar__eyebrow">TEACHER CENTER</div>
        <h1>教师中心</h1>
      </div>

      <TeacherSidebarNav active="home" />
    </aside>

    <section class="teacher-dashboard-main">
      <header class="teacher-dashboard-head">
        <div>
          <div class="teacher-dashboard-head__eyebrow">TEACHER DASHBOARD</div>
          <h2>{{ teacherName }}，欢迎回来</h2>
          <p>{{ welcomeText }}</p>
        </div>

        <div class="teacher-dashboard-head__actions">
          <button type="button" class="auth-btn auth-btn--secondary" @click="router.push('/')">返回首页</button>
          <button type="button" class="auth-btn" @click="handleLogout">退出登录</button>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>

      <section class="teacher-dashboard-metrics">
        <article v-for="card in metricCards" :key="card.label" class="teacher-dashboard-metric">
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
          <em>{{ card.tip }}</em>
        </article>
      </section>

      <section class="teacher-dashboard-grid teacher-dashboard-grid--middle">
        <article class="teacher-dashboard-panel">
          <div class="teacher-dashboard-panel__head">
            <div>
              <div class="teacher-dashboard-panel__eyebrow">RECENT RESOURCES</div>
              <h3>最近资料</h3>
            </div>
            <button type="button" class="course-chip course-chip--soft" @click="router.push('/teacher/assets')">查看全部</button>
          </div>

          <div v-if="dashboard?.recentAssets.length" class="teacher-dashboard-upload-list">
            <article v-for="item in dashboard.recentAssets" :key="item.id" class="teacher-dashboard-upload-item">
              <div class="teacher-dashboard-upload-item__main">
                <strong>{{ item.title }}</strong>
                <p>{{ assetTypeLabel(item.type) }} · {{ item.visibility === 'public' ? '公开资料' : '私密资料' }}</p>
              </div>
              <div class="teacher-dashboard-upload-item__meta">
                <span>{{ item.uploadDate }}</span>
              </div>
            </article>
          </div>
          <div v-else class="course-detail-empty course-detail-empty--compact">当前还没有资料记录，可以先去上传第一份资料。</div>
        </article>

        <article class="teacher-dashboard-panel">
          <div class="teacher-dashboard-panel__head">
            <div>
              <div class="teacher-dashboard-panel__eyebrow">QUICK ACTIONS</div>
              <h3>快捷操作</h3>
            </div>
          </div>

          <div class="teacher-dashboard-action-list">
            <button type="button" class="auth-btn" @click="router.push('/teacher/assets')">打开资料管理</button>
            <button type="button" class="auth-btn auth-btn--secondary" @click="router.push('/teacher/preps')">整理备课单</button>
            <button type="button" class="auth-btn auth-btn--secondary" @click="router.push('/teacher/coursewares')">打开在线课件</button>
            <button type="button" class="auth-btn auth-btn--secondary" @click="router.push('/teacher/profile')">维护个人资料</button>
          </div>

          <div class="teacher-dashboard-note">
            <strong>当前建议</strong>
            <p>{{ pendingText }}</p>
          </div>
        </article>
      </section>

      <section class="teacher-dashboard-grid teacher-dashboard-grid--bottom">
        <article class="teacher-dashboard-panel">
          <div class="teacher-dashboard-panel__head">
            <div>
              <div class="teacher-dashboard-panel__eyebrow">RECENT PREPS</div>
              <h3>最近备课单</h3>
            </div>
            <button type="button" class="course-chip course-chip--soft" @click="router.push('/teacher/preps')">查看全部</button>
          </div>

          <div v-if="dashboard?.recentPreps.length" class="teacher-dashboard-hot-list">
            <article v-for="item in dashboard.recentPreps" :key="item.id" class="teacher-dashboard-hot-item">
              <div>
                <strong>{{ item.title }}</strong>
                <span>{{ item.courseName }} · {{ item.statusLabel }}</span>
              </div>
              <span>{{ item.updateDate }}</span>
            </article>
          </div>
          <div v-else class="course-detail-empty course-detail-empty--compact">当前还没有备课单，可以先创建一条教学内容记录。</div>
        </article>

        <article class="teacher-dashboard-panel">
          <div class="teacher-dashboard-panel__head">
            <div>
              <div class="teacher-dashboard-panel__eyebrow">COURSE COVERAGE</div>
              <h3>课程覆盖</h3>
            </div>
          </div>

          <div v-if="dashboard?.courseCoverage.length" class="teacher-dashboard-hot-list">
            <article v-for="item in dashboard.courseCoverage" :key="item.id" class="teacher-dashboard-hot-item">
              <div>
                <strong>{{ item.name }}</strong>
                <span>资料 {{ item.assetCount }} · 备课单 {{ item.prepCount }}</span>
              </div>
            </article>
          </div>
          <div v-else class="course-detail-empty course-detail-empty--compact">当前还没有课程覆盖数据，后续会在这里汇总展示。</div>

          <div class="teacher-dashboard-weekly">
            <p>近 7 天新增资料 {{ dashboard?.weeklyActivity.assetCount ?? 0 }} 份。</p>
            <p>近 7 天新增备课单 {{ dashboard?.weeklyActivity.prepCount ?? 0 }} 条。</p>
            <p>近 7 天公开资料 {{ dashboard?.weeklyActivity.publicAssetCount ?? 0 }} 份。</p>
            <div class="teacher-dashboard-status">教师中心状态正常</div>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import TeacherSidebarNav from '@/components/navigation/TeacherSidebarNav.vue'
import { getTeacherDashboard, type TeacherDashboardData } from '@/services/teacher'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const dashboard = ref<TeacherDashboardData | null>(null)
const errorMessage = ref('')

const teacherName = computed(() => dashboard.value?.profile.name || authStore.profile?.name || authStore.profile?.username || '老师')

const welcomeText = computed(() => `${teacherName.value}，这里统一查看资料、备课单和个人资料等常用入口。`)

const metricCards = computed(() => {
  const stats = dashboard.value?.stats || {
    courseCount: 0,
    assetCount: 0,
    publicAssetCount: 0,
    prepCount: 0,
    publishedPrepCount: 0,
  }

  return [
    { label: '课程数量', value: stats.courseCount, tip: '当前教师名下课程' },
    { label: '资料总数', value: stats.assetCount, tip: '已上传资料总数' },
    { label: '公开资料', value: stats.publicAssetCount, tip: '前台可见的公开资料' },
    { label: '备课单', value: stats.prepCount, tip: `其中已发布 ${stats.publishedPrepCount} 条` },
  ]
})

const pendingText = computed(() => {
  const stats = dashboard.value?.stats
  if (!stats) return '正在整理教师中心数据。'
  if (!stats.courseCount) return '当前还没有课程数据，可以先联系管理员补充课程。'
  if (!stats.assetCount) return '建议先上传几份常用资料，后续备课会更方便。'
  if (!stats.prepCount) return '已有资料后，可以继续整理备课单，形成完整教学内容。'
  return '可以继续补充公开资料，并完善备课单与个人资料。'
})

function assetTypeLabel(type: string) {
  const labels: Record<string, string> = {
    image: '图片',
    audio: '音频',
    video: '视频',
    text: '文本',
    file: '文件',
  }

  return labels[type] || type
}

function handleLogout() {
  authStore.logout()
  void router.push({ path: '/login', query: { role: 'teacher' } })
}

async function loadDashboard() {
  errorMessage.value = ''

  try {
    dashboard.value = await getTeacherDashboard()
  } catch (error: any) {
    dashboard.value = null
    errorMessage.value = error?.response?.data?.message || '教师中心数据加载失败'
  }
}

onMounted(() => {
  loadDashboard()
})
</script>
