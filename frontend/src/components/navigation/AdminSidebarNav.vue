<template>
  <nav ref="navRef" class="admin-dashboard-nav" @scroll="handleScroll">
    <button
      v-for="item in menuItems"
      :key="item.key"
      type="button"
      :class="[
        'admin-dashboard-nav__item',
        item.key === active ? 'is-active' : '',
        item.key === 'system' ? 'admin-dashboard-nav__item--system' : '',
      ]"
      @click="handleNavigate(item.path)"
    >
      {{ item.label }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAdminSidebarScrollTop, setAdminSidebarScrollTop } from '@/utils/adminSidebarScroll'

type AdminNavKey =
  | 'system'
  | 'home'
  | 'teachers'
  | 'students'
  | 'accounts'
  | 'colleges'
  | 'courses'
  | 'preps'
  | 'assets'
  | 'materials'
  | 'messages'

defineProps<{
  active: AdminNavKey
}>()

const router = useRouter()
const route = useRoute()
const navRef = ref<HTMLElement | null>(null)
let restoreAttempts = 0

const MAX_RESTORE_ATTEMPTS = 12

const menuItems: Array<{ key: Exclude<AdminNavKey, 'materials'>; label: string; path: string }> = [
  { key: 'system', label: '系统管理', path: '/admin/system' },
  { key: 'home', label: '总览首页', path: '/admin' },
  { key: 'teachers', label: '教师用户', path: '/admin/teachers' },
  { key: 'students', label: '学生用户', path: '/admin/students' },
  { key: 'accounts', label: '账号管理', path: '/admin/accounts' },
  { key: 'colleges', label: '学院管理', path: '/admin/colleges' },
  { key: 'courses', label: '课程管理', path: '/admin/courses' },
  { key: 'preps', label: '备课单管理', path: '/admin/preps' },
  { key: 'assets', label: '素材库', path: '/admin/assets' },
  { key: 'messages', label: '教学交流', path: '/admin/messages' },
]

function handleNavigate(path: string) {
  setAdminSidebarScrollTop(navRef.value?.scrollTop || 0)

  if (route.path === path) {
    return
  }

  void router.push(path)
}

function handleScroll() {
  setAdminSidebarScrollTop(navRef.value?.scrollTop || 0)
}

function restoreScroll() {
  const nav = navRef.value
  if (!nav) {
    return
  }

  nav.scrollTop = getAdminSidebarScrollTop()
  restoreAttempts += 1

  if (restoreAttempts < MAX_RESTORE_ATTEMPTS) {
    window.requestAnimationFrame(restoreScroll)
  }
}

onMounted(() => {
  restoreAttempts = 0
  void nextTick(() => {
    restoreScroll()
  })
})

onBeforeUnmount(() => {
  setAdminSidebarScrollTop(navRef.value?.scrollTop || 0)
})
</script>
