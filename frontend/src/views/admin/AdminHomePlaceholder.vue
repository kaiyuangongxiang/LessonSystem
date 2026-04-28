<template>
  <main class="admin-dashboard-page">
    <aside class="admin-dashboard-sidebar">
      <div>
        <div class="admin-dashboard-sidebar__eyebrow">ADMIN CONSOLE</div>
        <h1>管理员中心</h1>
      </div>

      <AdminSidebarNav active="home" />
      <nav v-if="false" class="admin-dashboard-nav">
        <button type="button" class="admin-dashboard-nav__item admin-dashboard-nav__item--system" @click="router.push('/admin/system')">系统管理</button>
        <button type="button" class="admin-dashboard-nav__item is-active">总览首页</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/teachers')">教师用户</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/students')">学生用户</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/accounts')">账号管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/colleges')">学院管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/courses')">课程管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/preps')">备课单管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/assets')">资料库</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/materials')">资料管理</button>
        <button type="button" class="admin-dashboard-nav__item" @click="router.push('/admin/messages')">教学交流</button>
      </nav>

      <section class="admin-dashboard-reminder-card">
        <div class="admin-dashboard-reminder-card__eyebrow">TODAY REMINDER</div>
        <ul>
          <li>{{ reminderTexts[0] }}</li>
          <li>{{ reminderTexts[1] }}</li>
        </ul>
      </section>
    </aside>

    <section class="admin-dashboard-main">
      <header class="admin-dashboard-head">
        <div>
          <div class="admin-dashboard-head__eyebrow">SYSTEM DASHBOARD</div>
          <h2>管理员工作台</h2>
          <p>{{ welcomeText }}</p>
        </div>
        <div class="admin-dashboard-head__actions">
          <button type="button" class="auth-btn auth-btn--secondary" @click="router.push('/')">返回首页</button>
          <button type="button" class="auth-btn" @click="handleLogout">退出登录</button>
        </div>
      </header>

      <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>

      <section class="admin-dashboard-metrics">
        <article v-for="card in metricCards" :key="card.label" class="admin-dashboard-metric">
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
          <em>{{ card.tip }}</em>
        </article>
      </section>

      <section class="admin-dashboard-grid admin-dashboard-grid--middle">
        <article class="admin-dashboard-panel">
          <div class="admin-dashboard-panel__head">
            <div>
              <div class="admin-dashboard-panel__eyebrow">LATEST TEACHERS</div>
              <h3>最新教师</h3>
            </div>
            <button type="button" class="course-chip course-chip--soft" @click="router.push('/admin/teachers')">查看全部</button>
          </div>

          <div v-if="dashboard?.latestTeachers.length" class="admin-dashboard-teacher-list">
            <article v-for="teacher in dashboard.latestTeachers" :key="teacher.id" class="admin-dashboard-teacher-item">
              <div>
                <strong>{{ teacher.name }}</strong>
                <p>{{ teacher.summary }}</p>
              </div>
              <span>{{ teacher.username }}</span>
            </article>
          </div>
          <div v-else class="course-detail-empty course-detail-empty--compact">当前还没有教师数据，后续注册后会在这里显示。</div>
        </article>

        <article class="admin-dashboard-panel">
          <div class="admin-dashboard-panel__head">
            <div>
              <div class="admin-dashboard-panel__eyebrow">LATEST RESOURCES</div>
              <h3>最新资源</h3>
            </div>
            <button type="button" class="course-chip course-chip--soft" @click="router.push('/admin/assets')">查看全部</button>
          </div>

          <div v-if="dashboard?.latestResources.length" class="admin-dashboard-resource-list">
            <article v-for="item in dashboard.latestResources" :key="`${item.type}-${item.id}`" class="admin-dashboard-resource-item">
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.teacherName }} · {{ item.courseName }}</p>
              </div>
              <div class="admin-dashboard-resource-item__meta">
                <span :class="['admin-dashboard-tag', item.type === 'video' ? 'is-video' : 'is-material']">
                  {{ item.type === 'video' ? '视频' : '资料' }}
                </span>
                <span>{{ item.uploadDate }}</span>
              </div>
            </article>
          </div>
          <div v-else class="course-detail-empty course-detail-empty--compact">当前还没有资料或视频数据。</div>
        </article>
      </section>

      <section class="admin-dashboard-grid admin-dashboard-grid--bottom">
        <article class="admin-dashboard-panel">
          <div class="admin-dashboard-panel__head">
            <div>
              <div class="admin-dashboard-panel__eyebrow">SYSTEM TREND</div>
              <h3>系统趋势</h3>
            </div>
          </div>

          <div class="admin-dashboard-weekly">
            <p>近 7 天新增资料 {{ dashboard?.weeklyActivity.materialCount ?? 0 }} 份。</p>
            <p>近 7 天新增视频 {{ dashboard?.weeklyActivity.videoCount ?? 0 }} 个。</p>
            <p>近 7 天新增交流主题 {{ dashboard?.weeklyActivity.topicCount ?? 0 }} 条。</p>
            <div class="admin-dashboard-status">系统运行正常 · {{ dashboard?.weeklyActivity.label || todayText }}</div>
          </div>
        </article>

        <article class="admin-dashboard-panel">
          <div class="admin-dashboard-panel__head">
            <div>
              <div class="admin-dashboard-panel__eyebrow">LATEST TOPICS</div>
              <h3>最新交流</h3>
            </div>
            <button type="button" class="course-chip course-chip--soft" @click="router.push('/admin/messages')">查看全部</button>
          </div>

          <div v-if="dashboard?.latestTopics.length" class="admin-dashboard-topic-list">
            <article v-for="topic in dashboard.latestTopics" :key="topic.id" class="admin-dashboard-topic-item">
              <div>
                <strong>{{ topic.title }}</strong>
                <p>{{ topic.teacherName }} · {{ topic.createTime }}</p>
              </div>
              <span>{{ topic.replyCount }} 条回复</span>
            </article>
          </div>
          <div v-else class="course-detail-empty course-detail-empty--compact">当前还没有教学交流主题。</div>
        </article>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminSidebarNav from '@/components/navigation/AdminSidebarNav.vue'
import { getAdminDashboard, type AdminDashboardData } from '@/services/admin'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const dashboard = ref<AdminDashboardData | null>(null)
const errorMessage = ref('')

const adminName = computed(() => dashboard.value?.profile.name || authStore.profile?.name || authStore.profile?.username || '管理员')
const todayText = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
  .format(new Date())
  .replace(/\//g, '-')

const welcomeText = computed(() => `${adminName.value}，这里用于查看教师、学生、课程、资源与教学交流的全局概览。`)

const metricCards = computed(() => {
  const stats = dashboard.value?.stats || {
    studentCount: 0,
    teacherCount: 0,
    courseCount: 0,
    materialCount: 0,
    prepCount: 0,
    topicCount: 0,
  }

  return [
    { label: '教师总数', value: stats.teacherCount, tip: '当前可用教师账号数量' },
    { label: '学生总数', value: stats.studentCount, tip: '当前可用学生账号数量' },
    { label: '课程总数', value: stats.courseCount, tip: '系统内已发布课程总览' },
    { label: '资料总数', value: stats.materialCount, tip: '公开资料库累计数量' },
    { label: '备课单数量', value: stats.prepCount, tip: '系统内备课单累计数量' },
    { label: '交流主题数', value: stats.topicCount, tip: '教学交流主题累计数量' },
  ]
})

const reminderTexts = computed(() => {
  const stats = dashboard.value?.stats
  if (!stats) {
    return ['正在加载后台统计数据', '稍后可查看最新教师、学生与资源动态']
  }

  return [
    stats.studentCount > 0 ? `当前共有 ${stats.studentCount} 位学生账号已开通。` : '当前还没有学生账号，可先补齐学生端基础角色。',
    stats.topicCount > 0 ? `当前共有 ${stats.topicCount} 条交流主题可继续跟进。` : '当前还没有交流主题，后续可关注教师讨论情况。',
  ]
})

async function handleLogout() {
  authStore.logout()
  await router.push('/login')
}

async function loadDashboard() {
  errorMessage.value = ''

  try {
    dashboard.value = await getAdminDashboard()
  } catch (error: any) {
    dashboard.value = null
    errorMessage.value = error?.response?.data?.message || '管理员工作台加载失败'
  }
}

onMounted(() => {
  loadDashboard()
})
</script>
