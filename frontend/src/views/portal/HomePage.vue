<template>
  <main class="portal-home">
    <PortalTopNav :system-name="home.profile.systemName" />

    <section class="portal-hero">
      <div class="portal-hero__content">
        <h1>{{ heroTitleText }}</h1>
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

        <div class="portal-notice-board" @mouseenter="pauseNoticeRotation" @mouseleave="resumeNoticeRotation">
          <div class="portal-notice-board__window">
            <Transition name="portal-notice-slide" mode="out-in">
              <article :key="`${activeNotice.id}-${activeNoticeIndex}`" class="portal-notice-card">
                <div class="portal-notice-card__meta">
                  <span class="portal-notice-card__date">{{ activeNotice.publishDate }}</span>
                  <span class="portal-notice-card__badge">
                    {{ visibleNotices.length > 1 ? `${activeNoticeIndex + 1} / ${visibleNotices.length}` : '当前公告' }}
                  </span>
                </div>
                <strong>{{ activeNotice.title }}</strong>
                <p>{{ activeNotice.content }}</p>
              </article>
            </Transition>
          </div>

          <div v-if="visibleNotices.length > 1" class="portal-notice-board__dots">
            <button
              v-for="(notice, index) in visibleNotices"
              :key="notice.id"
              type="button"
              :class="['portal-notice-board__dot', { 'is-active': index === activeNoticeIndex }]"
              :aria-label="`切换到公告 ${index + 1}`"
              @click="setActiveNotice(index)"
            ></button>
          </div>

          <ul v-if="visibleNotices.length > 1" class="portal-notice-ticker">
            <li
              v-for="(notice, index) in visibleNotices"
              :key="`${notice.id}-ticker`"
              :class="{ 'is-active': index === activeNoticeIndex }"
            >
              <button type="button" class="portal-notice-ticker__item" @click="setActiveNotice(index)">
                <span>{{ notice.publishDate }}</span>
                <strong>{{ notice.title }}</strong>
              </button>
            </li>
          </ul>
        </div>
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
          <button class="portal-section-head__link" type="button" @click="router.push('/assets')">进入素材库</button>
        </div>

        <ul class="portal-resource-list">
          <li
            v-for="material in visibleMaterials"
            :key="material.id"
            class="portal-resource-row"
            @click="goAssetLibrary(material)"
          >
            <div>
              <strong>{{ material.title }}</strong>
              <p>{{ assetTypeLabel(material.type) }} · {{ material.description || material.teacherName }}</p>
            </div>
            <div class="portal-resource-row__meta">
              <span>{{ material.teacherName }}</span>
              <span>{{ material.uploadTime }}</span>
            </div>
          </li>
        </ul>
      </article>

      <article class="portal-panel portal-panel--videos">
        <div class="portal-section-head">
          <div>
            <div class="portal-section-head__eyebrow">FORUM MESSAGE</div>
            <h2>论坛留言</h2>
          </div>
          <button class="portal-section-head__link" type="button" @click="goTeachingMessages">进入论坛</button>
        </div>

        <button type="button" class="portal-forum-entry" @click="goTeachingMessages">
          <span class="portal-forum-entry__badge">Teaching Exchange</span>
          <strong>进入教学交流，查看论坛留言与主题回复</strong>
          <p>围绕课程资源、课堂问题和备课经验发起讨论，教师与管理员可以在主题下持续回复、追踪和沉淀交流记录。</p>
          <span class="portal-forum-entry__action">进入论坛留言</span>
        </button>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PortalTopNav from '@/components/navigation/PortalTopNav.vue'
import { getPortalHome, getPortalPublicAssets, type PortalAssetType, type PortalPublicAssetItem } from '@/services/portal'
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

interface HomeResponse {
  profile: {
    systemName: string
    heroTitle: string
    systemIntro: string
  }
  notices: NoticeItem[]
  courses: CourseItem[]
  stats: {
    courseCount: number
    materialCount: number
    videoCount: number
  }
}

const DEFAULT_HERO_TITLE = '让课程、资料与视频在一个入口里协同'

const router = useRouter()
const authStore = useAuthStore()
const searchKeyword = ref('')
const errorMessage = ref('')
const noticeSectionRef = ref<HTMLElement | null>(null)
const courseSectionRef = ref<HTMLElement | null>(null)
const resourceSectionRef = ref<HTMLElement | null>(null)

const home = reactive<HomeResponse>({
  profile: {
    heroTitle: DEFAULT_HERO_TITLE,
    systemName: '在线教师备课系统',
    systemIntro: '围绕课程、资料与视频的统一备课平台，帮助教师快速进入课程浏览与资源查看主链路。',
  },
  notices: [],
  courses: [],
  stats: {
    courseCount: 0,
    materialCount: 0,
    videoCount: 0,
  },
})
const latestAssets = ref<PortalPublicAssetItem[]>([])
const heroTitleText = computed(() => home.profile.heroTitle || DEFAULT_HERO_TITLE)
const activeNoticeIndex = ref(0)
const activeNotice = computed(() => visibleNotices.value[activeNoticeIndex.value] || visibleNotices.value[0])
let noticeRotationTimer: number | undefined

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

function stopNoticeRotation() {
  if (noticeRotationTimer !== undefined) {
    window.clearInterval(noticeRotationTimer)
    noticeRotationTimer = undefined
  }
}

function startNoticeRotation() {
  stopNoticeRotation()

  if (visibleNotices.value.length <= 1) {
    return
  }

  noticeRotationTimer = window.setInterval(() => {
    activeNoticeIndex.value = (activeNoticeIndex.value + 1) % visibleNotices.value.length
  }, 4500)
}

function pauseNoticeRotation() {
  stopNoticeRotation()
}

function resumeNoticeRotation() {
  startNoticeRotation()
}

function setActiveNotice(index: number) {
  activeNoticeIndex.value = index
  startNoticeRotation()
}

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
  if (!latestAssets.value.length) {
    return [
      {
        id: 0,
        type: 'file' as PortalAssetType,
        visibility: 'public' as const,
        title: '公开素材待更新',
        description: '教师公开发布的素材会展示在这里',
        content: '',
        fileName: '',
        fileSize: 0,
        uploadTime: '待更新',
        teacherName: '系统预留',
        previewUrl: '',
      },
    ]
  }

  return latestAssets.value
})

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function scrollToSection(section: 'notices' | 'courses' | 'resources') {
  if (section === 'resources') {
    void router.push('/assets')
    return
  }

  const target =
    section === 'notices'
      ? noticeSectionRef.value
      : courseSectionRef.value

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

function goAssetLibrary(material?: PortalPublicAssetItem) {
  router.push({
    path: '/assets',
    query: material?.id ? { keyword: material.title } : undefined,
  })
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
    router.push('/teacher/messages')
    return
  }

  router.push('/admin/messages')
}

function assetTypeLabel(type: string) {
  const labels: Record<PortalAssetType, string> = {
    image: '图片素材',
    audio: '音频素材',
    video: '视频素材',
    text: '文本片段',
    file: '文件素材',
  }

  return labels[type as PortalAssetType] || type
}

async function loadHome() {
  try {
    const data = await getPortalHome()

    home.profile = {
      ...home.profile,
      ...data.profile,
      heroTitle: data?.profile?.heroTitle || DEFAULT_HERO_TITLE,
    }
    home.notices = data.notices
    home.courses = data.courses
    home.stats = data.stats
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '首页数据加载失败，当前展示默认内容'
  }
}

async function loadLatestAssets() {
  try {
    const data = await getPortalPublicAssets({
      page: 1,
      pageSize: 3,
      type: 'all',
    })

    latestAssets.value = data.list
    home.stats.materialCount = data.stats.total
  } catch (error: any) {
    if (!errorMessage.value) {
      errorMessage.value = error?.response?.data?.message || '最新资料加载失败，当前展示默认内容'
    }
  }
}

onMounted(() => {
  loadHome()
  loadLatestAssets()
})

onBeforeUnmount(() => {
  stopNoticeRotation()
})

watch(
  visibleNotices,
  (list) => {
    if (!list.length) {
      activeNoticeIndex.value = 0
      stopNoticeRotation()
      return
    }

    if (activeNoticeIndex.value >= list.length) {
      activeNoticeIndex.value = 0
    }

    startNoticeRotation()
  },
  { immediate: true },
)
</script>
