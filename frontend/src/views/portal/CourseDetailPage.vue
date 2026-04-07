<template>
  <main class="course-detail-page">
    <PortalTopNav />

    <header class="course-detail-nav">
      <div>
        <div class="course-detail-nav__eyebrow">COURSE DETAIL</div>
        <h1>课程详情页</h1>
        <p>{{ detailSubtitle }}</p>
      </div>

      <div class="course-detail-nav__actions">
        <button type="button" class="course-chip" @click="router.push('/courses')">返回课程列表</button>
        <button type="button" class="course-detail-home-btn" @click="router.push('/')">返回首页</button>
      </div>
    </header>

    <section class="course-detail-hero">
      <div>
        <h2>{{ detail.course.name }}</h2>
        <div class="course-detail-hero__chips">
          <span class="course-chip is-active">{{ detail.course.collegeName }}</span>
          <span class="course-chip course-chip--soft">负责人：{{ detail.course.teacherName }}</span>
        </div>
        <p>{{ detail.course.summary }}</p>
      </div>

      <div class="course-detail-hero__meta">
        <span>最近更新</span>
        <strong>{{ detail.course.updateDate }}</strong>
      </div>
    </section>

    <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>

    <section class="course-detail-info-grid">
      <article class="course-detail-panel">
        <div class="course-detail-panel__eyebrow">TEACHING GOAL</div>
        <h3>教学目标</h3>
        <p>{{ detail.course.teachingGoal }}</p>
      </article>

      <article class="course-detail-panel">
        <div class="course-detail-panel__eyebrow">TEACHING CONTENT</div>
        <h3>教学内容</h3>
        <p>{{ detail.course.teachingContent }}</p>
      </article>

      <article class="course-detail-panel">
        <div class="course-detail-panel__eyebrow">TEACHING IDEA</div>
        <h3>教学思想</h3>
        <p>{{ detail.course.teachingIdea }}</p>
      </article>
    </section>

    <section class="course-detail-resource-grid">
      <article class="course-detail-table course-detail-table--materials">
        <div class="course-detail-table__head">
          <h3>关联资料列表</h3>
        </div>

        <div v-if="detail.materials.length" class="course-detail-list">
          <div v-for="material in detail.materials" :key="material.id" class="course-detail-row">
            <div class="course-detail-row__main">
              <strong>{{ material.name }}</strong>
              <p>{{ material.teacherName }}</p>
            </div>
            <div class="course-detail-row__meta">
              <span>{{ material.uploadDate }}</span>
              <a :href="materialHref(material.downloadUrl)" target="_blank" rel="noreferrer">下载</a>
            </div>
          </div>
        </div>

        <div v-else class="course-detail-empty">当前课程暂无关联资料。</div>
      </article>

      <article class="course-detail-table course-detail-table--videos">
        <div class="course-detail-table__head">
          <h3>关联视频列表</h3>
        </div>

        <div class="course-detail-player">
          <video v-if="activeVideoUrl" :key="activeVideoUrl" controls preload="metadata" :src="activeVideoUrl"></video>
          <div v-else class="course-detail-empty">当前课程暂无可播放视频。</div>
        </div>

        <div v-if="detail.videos.length" class="course-detail-list">
          <div v-for="video in detail.videos" :key="video.id" class="course-detail-row">
            <div class="course-detail-row__main">
              <strong>{{ video.title }}</strong>
              <p>{{ video.teacherName }} · {{ formatDuration(video.duration) }}</p>
            </div>
            <div class="course-detail-row__meta">
              <span>{{ video.uploadDate }}</span>
              <button type="button" @click="setActiveVideo(video.playUrl)">播放</button>
            </div>
          </div>
        </div>

        <div v-else class="course-detail-empty course-detail-empty--compact">当前课程暂无关联视频。</div>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PortalTopNav from '@/components/navigation/PortalTopNav.vue'
import http from '@/services/http'

interface MaterialItem {
  id: number
  name: string
  teacherName: string
  uploadDate: string
  downloadUrl: string
}

interface VideoItem {
  id: number
  title: string
  teacherName: string
  uploadDate: string
  duration: number | null
  playUrl: string
}

interface CourseDetailResponse {
  course: {
    id: number
    name: string
    summary: string
    teachingGoal: string
    teachingContent: string
    teachingIdea: string
    collegeName: string
    teacherName: string
    updateDate: string
  }
  materials: MaterialItem[]
  videos: VideoItem[]
}

const route = useRoute()
const router = useRouter()
const errorMessage = ref('')
const activeVideoUrl = ref('')

const detail = reactive<CourseDetailResponse>({
  course: {
    id: 0,
    name: '课程详情待接入',
    summary: '课程信息、资料与视频将统一展示在这里。',
    teachingGoal: '后续将根据课程数据展示真实教学目标。',
    teachingContent: '后续将根据课程数据展示真实教学内容。',
    teachingIdea: '后续将根据课程数据展示真实教学思想。',
    collegeName: '系统预留',
    teacherName: '系统预留',
    updateDate: '待更新',
  },
  materials: [],
  videos: [],
})

const detailSubtitle = computed(() => `${detail.course.name} · 课程信息、资料与视频统一展示`)

function materialHref(downloadUrl: string) {
  if (!downloadUrl) {
    return '#'
  }

  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}${downloadUrl}`
}

function setActiveVideo(playUrl: string) {
  if (!playUrl) {
    return
  }

  activeVideoUrl.value = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}${playUrl}`
}

function formatDuration(duration: number | null) {
  if (!duration) {
    return '待更新'
  }

  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes} 分 ${seconds.toString().padStart(2, '0')} 秒`
}

async function loadDetail() {
  errorMessage.value = ''
  activeVideoUrl.value = ''

  try {
    const response = await http.get(`/portal/courses/${route.params.courseId}`)
    const data = response.data.data as CourseDetailResponse
    detail.course = data.course
    detail.materials = data.materials
    detail.videos = data.videos
    if (data.videos.length > 0) {
      setActiveVideo(data.videos[0].playUrl)
    }
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || '课程详情加载失败'
    detail.materials = []
    detail.videos = []
  }
}

watch(
  () => route.params.courseId,
  () => {
    loadDetail()
  },
  { immediate: true },
)
</script>
