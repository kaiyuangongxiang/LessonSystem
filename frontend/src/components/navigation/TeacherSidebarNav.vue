<template>
  <nav class="teacher-dashboard-nav">
    <button
      v-for="item in menuItems"
      :key="item.key"
      type="button"
      :class="['teacher-dashboard-nav__item', item.key === active ? 'is-active' : '']"
      @click="handleNavigate(item.path)"
    >
      {{ item.label }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

export type TeacherNavKey =
  | 'home'
  | 'materials'
  | 'assets'
  | 'preps'
  | 'coursewares'
  | 'resources'
  | 'messages'
  | 'profile'

defineProps<{
  active: TeacherNavKey
}>()

const router = useRouter()

const menuItems: Array<{ key: TeacherNavKey; label: string; path: string }> = [
  { key: 'home', label: '教师首页', path: '/teacher' },
  { key: 'assets', label: '我的素材', path: '/teacher/assets' },
  { key: 'preps', label: '备课单', path: '/teacher/preps' },
  { key: 'coursewares', label: '在线课件', path: '/teacher/coursewares' },
  { key: 'profile', label: '个人资料', path: '/teacher/profile' },
]

function handleNavigate(path: string) {
  void router.push(path)
}
</script>
