<template>
  <main class="teacher-dashboard-page">
    <aside class="teacher-dashboard-sidebar">
      <div>
        <div class="teacher-dashboard-sidebar__eyebrow">TEACHER WORKSPACE</div>
        <h1>教师中心</h1>
      </div>

      <nav class="teacher-dashboard-nav">
        <button type="button" class="teacher-dashboard-nav__item is-active">工作台首页</button>
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/teacher/messages')">教学交流</button>
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/teacher/materials')">资料上传</button>
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/teacher/videos')">视频上传</button>
        <button type="button" class="teacher-dashboard-nav__item is-disabled" disabled>我的资源</button>
      </nav>

      <section class="teacher-dashboard-reminder-card">
        <div class="teacher-dashboard-reminder-card__eyebrow">TODAY REMINDER</div>
        <ul>
          <li>{{ reminderTexts[0] }}</li>
          <li>{{ reminderTexts[1] }}</li>
        </ul>
      </section>
    </aside>

    <section class="teacher-dashboard-main">
      <header class="teacher-dashboard-head">
        <div>
          <div class="teacher-dashboard-head__eyebrow">TEACHER DASHBOARD</div>
          <h2>教师工作台</h2>
          <p>{{ welcomeText }}</p>
        </div>
        <div class="teacher-dashboard-head__actions">
          <span class="course-chip course-chip--soft">本周概览</span>
          <button type="button" class="auth-btn auth-btn--secondary" @click="router.push('/')">返回首页</button>
          <button type="button" class="auth-btn" @click="router.push('/teacher/messages')">进入教学交流</button>
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
        <article class="teacher-dashboard-panel teacher-dashboard-panel--uploads">
          <div class="teacher-dashboard-panel__head">
            <div>
              <div class="teacher-dashboard-panel__eyebrow">RECENT UPLOADS</div>
              <h3>最近上传资源</h3>
            </div>
            <button type="button" class="course-chip course-chip--soft" disabled>查看全部</button>
          </div>

          <div v-if="dashboard?.recentUploads.length" class="teacher-dashboard-upload-list">
            <article v-for="item in dashboard.recentUploads" :key="`${item.type}-${item.id}`" class="teacher-dashboard-upload-item">
              <div class="teacher-dashboard-upload-item__main">
                <strong>{{ item.title }}</strong>
                <p>{{ item.courseName }}</p>
              </div>
              <div class="teacher-dashboard-upload-item__meta">
                <span :class="['teacher-dashboard-tag', item.type === 'video' ? 'is-video' : 'is-material']">
                  {{ item.type === 'video' ? '视频' : '资料' }}
                </span>
                <span>{{ item.uploadDate }}</span>
              </div>
            </article>
          </div>
          <div v-else class="course-detail-empty">当前还没有上传资料或视频，后续可从这里统一查看最近内容。</div>
        </article>

        <article class="teacher-dashboard-panel teacher-dashboard-panel--actions">
          <div class="teacher-dashboard-panel__head">
            <div>
              <div class="teacher-dashboard-panel__eyebrow">QUICK ACTIONS</div>
              <h3>快捷操作</h3>
            </div>
          </div>

          <div class="teacher-dashboard-action-list">
            <button type="button" class="auth-btn" @click="router.push('/teacher/messages')">查看教学交流</button>
            <button type="button" class="auth-btn auth-btn--secondary" @click="router.push('/teacher/materials')">上传课程资料</button>
            <button type="button" class="auth-btn auth-btn--secondary" @click="router.push('/teacher/videos')">上传课程视频</button>
          </div>

          <div class="teacher-dashboard-note">
            <strong>待处理事项</strong>
            <p>{{ pendingText }}</p>
          </div>
        </article>
      </section>

      <section class="teacher-dashboard-grid teacher-dashboard-grid--bottom">
        <article class="teacher-dashboard-panel">
          <div class="teacher-dashboard-panel__head">
            <div>
              <div class="teacher-dashboard-panel__eyebrow">HOT COURSES</div>
              <h3>课程热度</h3>
            </div>
          </div>

          <div v-if="dashboard?.hotCourses.length" class="teacher-dashboard-hot-list">
            <article v-for="course in dashboard.hotCourses" :key="course.id" class="teacher-dashboard-hot-item">
              <strong>{{ course.name }}</strong>
              <span>资料 {{ course.materialCount }} · 视频 {{ course.videoCount }}</span>
            </article>
          </div>
          <div v-else class="course-detail-empty course-detail-empty--compact">当前还没有课程热度数据，后续上传资源后会在这里展示。</div>
        </article>

        <article class="teacher-dashboard-panel">
          <div class="teacher-dashboard-panel__head">
            <div>
              <div class="teacher-dashboard-panel__eyebrow">WEEKLY ACTIVITY</div>
              <h3>本周动态</h3>
            </div>
          </div>

          <div class="teacher-dashboard-weekly">
            <p>近 7 天新增资料 {{ dashboard?.weeklyActivity.materialCount ?? 0 }} 份。</p>
            <p>近 7 天新增视频 {{ dashboard?.weeklyActivity.videoCount ?? 0 }} 个。</p>
            <p>近 7 天新增交流主题 {{ dashboard?.weeklyActivity.topicCount ?? 0 }} 条。</p>
            <div class="teacher-dashboard-status">教师工作台状态正常</div>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getTeacherDashboard, type TeacherDashboardData } from '@/services/teacher'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const dashboard = ref<TeacherDashboardData | null>(null)
const errorMessage = ref('')

const teacherName = computed(() => dashboard.value?.profile.name || authStore.profile?.name || authStore.profile?.username || '教师用户')

const welcomeText = computed(() => `${teacherName.value}，这里用于查看课程、资料、视频与教学交流的个人概览。`)

const metricCards = computed(() => {
  const stats = dashboard.value?.stats || {
    courseCount: 0,
    materialCount: 0,
    videoCount: 0,
    topicCount: 0,
  }

  return [
    { label: '我的课程数', value: stats.courseCount, tip: '教师名下课程总览' },
    { label: '我的资料数', value: stats.materialCount, tip: '已上传文档资源数量' },
    { label: '我的视频数', value: stats.videoCount, tip: '已上传视频资源数量' },
    { label: '我的交流主题数', value: stats.topicCount, tip: '教学交流主题累计数量' },
  ]
})

const reminderTexts = computed(() => {
  const stats = dashboard.value?.stats
  if (!stats) {
    return ['正在加载教师工作台数据', '稍后可查看最近上传与课程热度']
  }

  return [
    stats.materialCount > 0 ? `当前共有 ${stats.materialCount} 份资料可继续维护。` : '当前还没有资料，后续可从资料上传入口补充。',
    stats.videoCount > 0 ? `当前共有 ${stats.videoCount} 个视频资源。` : '当前还没有视频资源，后续可从视频上传入口补充。',
  ]
})

const pendingText = computed(() => {
  const stats = dashboard.value?.stats
  if (!stats) {
    return '正在整理教师工作台数据。'
  }

  if (!stats.courseCount) {
    return '当前还没有课程数据，后续可在课程与资源模块中继续完善。'
  }

  if (!stats.materialCount && !stats.videoCount) {
    return '已有课程，但还没有上传资料或视频，可先从资料上传开始补充。'
  }

  return '可先进入教学交流查看讨论，再逐步补充资料与视频资源。'
})

async function loadDashboard() {
  errorMessage.value = ''

  try {
    dashboard.value = await getTeacherDashboard()
  } catch (error: any) {
    dashboard.value = null
    errorMessage.value = error?.response?.data?.message || '教师工作台加载失败'
  }
}

onMounted(() => {
  loadDashboard()
})
</script>
