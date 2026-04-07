<template>
  <div class="portal-topbar">
    <header class="portal-nav">
      <button type="button" class="portal-brand portal-brand--button" @click="goHome">
        <span class="portal-brand__eyebrow">{{ eyebrow }}</span>
        <span class="portal-brand__title">{{ systemName }}</span>
      </button>

      <form class="portal-search" @submit.prevent="submitSearch">
        <input v-model.trim="searchKeyword" type="text" placeholder="搜索课程 / 资料 / 视频" />
        <button type="submit" class="portal-search__button" aria-label="搜索">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M10.5 18a7.5 7.5 0 1 1 5.303-12.803A7.5 7.5 0 0 1 10.5 18Zm0-13.2a5.7 5.7 0 1 0 0 11.4 5.7 5.7 0 0 0 0-11.4Zm10.064 14.791-4.076-4.075"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </form>

      <nav class="portal-links" aria-label="前台主导航">
        <button type="button" :class="{ 'is-active': activeItem === 'home' }" @click="goHome">首页</button>
        <button type="button" :class="{ 'is-active': activeItem === 'courses' }" @click="goCourses">课程中心</button>
        <button type="button" :class="{ 'is-active': activeItem === 'assets' }" @click="goAssets">素材库</button>
        <button type="button" :class="{ 'is-active': activeItem === 'messages' }" @click="goTeachingMessages">教学交流</button>
      </nav>

      <button class="portal-login-btn portal-login-btn--entry" type="button" @click="goPrimaryAction">
        {{ primaryActionText }}
      </button>
    </header>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const props = withDefaults(
  defineProps<{
    systemName?: string
    eyebrow?: string
  }>(),
  {
    systemName: '在线教师备课系统',
    eyebrow: 'TEACHER PREP PORTAL',
  },
)

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const searchKeyword = ref('')

const systemName = computed(() => props.systemName || '在线教师备课系统')
const eyebrow = computed(() => props.eyebrow || 'TEACHER PREP PORTAL')

const activeItem = computed(() => {
  if (route.name === 'portal-home') {
    return 'home'
  }

  if (route.name === 'course-list' || route.name === 'course-detail') {
    return 'courses'
  }

  if (route.name === 'portal-assets') {
    return 'assets'
  }

  if (route.name === 'teacher-messages' || route.name === 'admin-messages') {
    return 'messages'
  }

  return ''
})

const primaryActionText = computed(() => {
  if (!authStore.isAuthenticated) {
    return '进入教师中心'
  }

  if (authStore.role === 'admin') {
    return '进入管理中心'
  }

  if (authStore.role === 'student') {
    return '进入学生中心'
  }

  return '进入教师中心'
})

const searchTargetPath = computed(() => (activeItem.value === 'assets' ? '/assets' : '/courses'))

function goHome() {
  if (route.name === 'portal-home') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  void router.push('/')
}

function goCourses() {
  void router.push('/courses')
}

function goAssets() {
  void router.push('/assets')
}

function submitSearch() {
  void router.push({
    path: searchTargetPath.value,
    query: {
      keyword: searchKeyword.value || undefined,
    },
  })
}

function goPrimaryAction() {
  if (!authStore.isAuthenticated) {
    void router.push({ path: '/login', query: { role: 'teacher' } })
    return
  }

  if (authStore.role === 'admin') {
    void router.push('/admin')
    return
  }

  if (authStore.role === 'student') {
    void router.push('/student')
    return
  }

  void router.push('/teacher')
}

function goTeachingMessages() {
  if (!authStore.isAuthenticated) {
    void router.push({ path: '/login', query: { role: 'teacher' } })
    return
  }

  if (authStore.role === 'teacher') {
    void router.push('/teacher/messages')
    return
  }

  if (authStore.role === 'admin') {
    void router.push('/admin/messages')
    return
  }

  void router.push('/student')
}

watch(
  () => route.fullPath,
  () => {
    searchKeyword.value = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  },
  { immediate: true },
)
</script>
