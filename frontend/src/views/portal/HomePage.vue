<template>
  <main class="portal-home">
    <header class="portal-nav">
      <div class="portal-brand">
        <div class="portal-brand__eyebrow">TEACHER PREP PORTAL</div>
        <div class="portal-brand__title">{{ home.profile.systemName }}</div>
      </div>

      <form class="portal-search" @submit.prevent="goCourseListWithKeyword">
        <input v-model.trim="searchKeyword" type="text" placeholder="搜索课程 / 资料 / 视频" />
        <span class="portal-search__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M10.5 18a7.5 7.5 0 1 1 5.303-12.803A7.5 7.5 0 0 1 10.5 18Zm0-13.2a5.7 5.7 0 1 0 0 11.4 5.7 5.7 0 0 0 0-11.4Zm10.064 14.791-4.076-4.075"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      </form>

      <nav class="portal-links">
        <button type="button" class="is-active" @click="scrollToTop">首页</button>
        <button type="button" @click="router.push('/courses')">课程中心</button>
        <button type="button" @click="scrollToSection('resources')">资源库</button>
        <button type="button" @click="goTeachingMessages">教学交流</button>
      </nav>

      <button class="portal-login-btn" type="button" @click="goPrimaryAction">
        {{ primaryActionText }}
      </button>
    </header>

    <section class="portal-hero">
      <div class="portal-hero__content">
        <div class="portal-hero__eyebrow">统一备课入口</div>
        <h1>{{ heroTitle }}</h1>
        <p>{{ home.profile.systemIntro }}</p>

        <div class="portal-hero__actions">
          <button class="portal-hero__btn" type="button" @click="router.push('/courses')">浏览课程</button>
          <button class="portal-hero__btn portal-hero__btn--ghost" type="button" @click="goTeachingMessages">
            进入教学交流
          </button>
        </div>
      </div>

      <div class="portal-stat-grid">
        <article class="portal-stat-card">
          <span>开放课程</span>
          <strong>{{ home.stats.courseCount }}</strong>
        </article>
        <article class="portal-stat-card">
          <span>最新资料</span>
          <strong>{{ home.stats.materialCount }}</strong>
        </article>
        <article class="portal-stat-card">
          <span>新增视频</span>
          <strong>{{ home.stats.videoCount }}</strong>
        </article>
      </div>
    </section>

    <p v-if="errorMessage" class="portal-feedback">{{ errorMessage }}</p>

    <section class="portal-grid">
      <article ref="noticeSectionRef" class="portal-panel portal-panel--notice">
        <div class="portal-section-head">
          <div>
            <div class="portal-section-head__eyebrow">SYSTEM NOTICE</div>
            <h2>系统公告</h2>
          </div>
        </div>

        <ul class="portal-notice-list">
          <li v-for="notice in visibleNotices" :key="notice.id">
            <strong>{{ notice.title }}</strong>
            <p>{{ notice.content }}</p>
            <span>{{ notice.publishDate }}</span>
          </li>
        </ul>
      </article>

      <article ref="courseSectionRef" class="portal-panel portal-panel--courses">
        <div class="portal-section-head">
          <div>
            <div class="portal-section-head__eyebrow">COURSE PICKS</div>
            <h2>推荐课程</h2>
          </div>
          <button class="portal-section-head__link" type="button" @click="router.push('/courses')">查看全部</button>
        </div>

        <div class="portal-course-grid">
          <article v-for="course in visibleCourses" :key="course.id" class="portal-course-card" @click="goCourseDetail(course.id)">
            <div class="portal-course-card__tag">{{ course.teacherName }}</div>
            <h3>{{ course.name }}</h3>
            <p>{{ course.summary }}</p>
            <button type="button" class="portal-course-card__btn" @click.stop="goCourseDetail(course.id)">查看详情</button>
          </article>
        </div>
      </article>
    </section>

    <section ref="resourceSectionRef" class="portal-grid portal-grid--bottom">
      <article class="portal-panel portal-panel--materials">
        <div class="portal-section-head">
          <div>
            <div class="portal-section-head__eyebrow">LATEST MATERIALS</div>
            <h2>最新资料</h2>
          </div>
        </div>

        <ul class="portal-resource-list">
          <li v-for="material in visibleMaterials" :key="material.id" class="portal-resource-row">
            <div>
              <strong>{{ material.name }}</strong>
              <p>{{ material.courseName }}</p>
            </div>
            <div class="portal-resource-row__meta">
              <span>{{ material.teacherName }}</span>
              <span>{{ material.uploadDate }}</span>
            </div>
          </li>
        </ul>
      </article>

      <article class="portal-panel portal-panel--videos">
        <div class="portal-section-head">
          <div>
            <div class="portal-section-head__eyebrow">LATEST VIDEOS</div>
            <h2>最新视频</h2>
          </div>
        </div>

        <div class="portal-video-grid">
          <article v-for="video in visibleVideos" :key="video.id" class="portal-video-card">
            <div class="portal-video-card__cover"></div>
            <strong>{{ video.title }}</strong>
            <p>{{ video.courseName }}</p>
            <span>{{ formatDuration(video.duration) }} · {{ video.teacherName }}</span>
          </article>
        </div>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/services/http'
import { useAuthStore } from '@/stores/auth'

interface NoticeItem {
  id: number
  title: string
  content: string
  publishDate: string
}

interface CourseItem {
  id: number
  name: string
  summary: string
  teacherName: string
}

interface MaterialItem {
  id: number
  name: string
  courseName: string
  teacherName: string
  uploadDate: string
}

interface VideoItem {
  id: number
  title: string
  courseName: string
  teacherName: string
  duration: number | null
  uploadDate: string
}

interface HomeResponse {
  profile: {
    systemName: string
    systemIntro: string
  }
  notices: NoticeItem[]
  courses: CourseItem[]
  materials: MaterialItem[]
  videos: VideoItem[]
  stats: {
    courseCount: number
    materialCount: number
    videoCount: number
  }
}

const router = useRouter()
const authStore = useAuthStore()
const searchKeyword = ref('')
const errorMessage = ref('')
const noticeSectionRef = ref<HTMLElement | null>(null)
const courseSectionRef = ref<HTMLElement | null>(null)
const resourceSectionRef = ref<HTMLElement | null>(null)

const home = reactive<HomeResponse>({
  profile: {
    systemName: '在线教师备课系统',
    systemIntro: '围绕课程、资料与视频的统一备课平台，帮助教师快速进入课程浏览与资源查看主链路。',
  },
  notices: [],
  courses: [],
  materials: [],
  videos: [],
  stats: {
    courseCount: 0,
    materialCount: 0,
    videoCount: 0,
  },
})

const heroTitle = computed(() => '让课程、资料与视频在一个入口里协同')

const primaryActionText = computed(() => {
  if (!authStore.isAuthenticated) {
    return '登录 / 注册'
  }

  return authStore.role === 'admin' ? '管理员中心' : '进入教师中心'
})

const visibleNotices = computed(() => {
  if (!home.notices.length) {
    return [
      {
        id: 0,
        title: '公告待维护',
        content: '当前暂无已发布公告，后续可由管理员在后台维护公告内容。',
        publishDate: '待更新',
      },
    ]
  }

  return home.notices
})

const visibleCourses = computed(() => {
  if (!home.courses.length) {
    return [
      { id: 0, name: '课程内容待补充', summary: '课程上线后将在这里展示推荐课程与简介。', teacherName: '系统预留' },
      { id: 1, name: '教学案例待接入', summary: '后续将展示课程简介、资料类型与视频概览。', teacherName: '系统预留' },
      { id: 2, name: '备课专题待更新', summary: '课程中心完成后可从此进入完整课程浏览链路。', teacherName: '系统预留' },
    ]
  }

  return home.courses
})

const visibleMaterials = computed(() => {
  if (!home.materials.length) {
    return [
      { id: 0, name: '资料列表待接入', courseName: '课程关联信息待补充', teacherName: '系统预留', uploadDate: '待更新' },
      { id: 1, name: '下载资源待更新', courseName: '后续展示最新上传资料', teacherName: '系统预留', uploadDate: '待更新' },
      { id: 2, name: '讲义与导学案待更新', courseName: '支持课程维度聚合', teacherName: '系统预留', uploadDate: '待更新' },
    ]
  }

  return home.materials
})

const visibleVideos = computed(() => {
  if (!home.videos.length) {
    return [
      { id: 0, title: '视频内容待接入', courseName: '课程视频将在此展示', teacherName: '系统预留', duration: null, uploadDate: '待更新' },
      { id: 1, title: '微课资源待更新', courseName: '后续支持在线播放', teacherName: '系统预留', duration: null, uploadDate: '待更新' },
      { id: 2, title: '教学演示待更新', courseName: '配合课程详情统一承接', teacherName: '系统预留', duration: null, uploadDate: '待更新' },
    ]
  }

  return home.videos
})

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function scrollToSection(section: 'notices' | 'courses' | 'resources') {
  const target =
    section === 'notices'
      ? noticeSectionRef.value
      : section === 'courses'
        ? courseSectionRef.value
        : resourceSectionRef.value

  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function goCourseListWithKeyword() {
  router.push({
    path: '/courses',
    query: {
      keyword: searchKeyword.value || undefined,
    },
  })
}

function goCourseDetail(courseId: number) {
  if (!courseId) {
    router.push('/courses')
    return
  }

  router.push(`/courses/${courseId}`)
}

function goPrimaryAction() {
  if (!authStore.isAuthenticated) {
    router.push({ path: '/login', query: { role: 'teacher' } })
    return
  }

  router.push(authStore.role === 'admin' ? '/admin' : '/teacher')
}

function goTeachingMessages() {
  if (!authStore.isAuthenticated) {
    router.push({ path: '/login', query: { role: 'teacher' } })
    return
  }

  if (authStore.role === 'teacher') {
    router.push('/teacher')
    return
  }

  router.push('/admin/messages')
}

function formatDuration(duration: number | null) {
  if (!duration) {
    return '待更新'
  }

  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes} 分 ${seconds.toString().padStart(2, '0')} 秒`
}

async function loadHome() {
  try {
    const response = await http.get('/portal/home')
    const data = response.data.data as HomeResponse

    home.profile = data.profile
    home.notices = data.notices
    home.courses = data.courses
    home.materials = data.materials
    home.videos = data.videos
    home.stats = data.stats
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '首页数据加载失败，当前展示默认内容'
  }
}

onMounted(() => {
  loadHome()
})
</script>
