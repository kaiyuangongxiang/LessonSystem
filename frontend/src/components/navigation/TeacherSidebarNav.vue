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

type TeacherNavKey = 'home' | 'materials' | 'assets' | 'preps' | 'resources' | 'messages' | 'profile'

defineProps<{
  active: TeacherNavKey
}>()

const router = useRouter()

const menuItems: Array<{ key: TeacherNavKey; label: string; path: string }> = [
  { key: 'home', label: '总览首页', path: '/teacher' },
  { key: 'materials', label: '资源上传', path: '/teacher/materials' },
  { key: 'assets', label: '素材库', path: '/teacher/assets' },
  { key: 'preps', label: '备课单管理', path: '/teacher/preps' },
  { key: 'resources', label: '我的资源', path: '/teacher/resources' },
  { key: 'messages', label: '教学交流', path: '/teacher/messages' },
  { key: 'profile', label: '个人资料', path: '/teacher/profile' },
]

function handleNavigate(path: string) {
  void router.push(path)
}
</script>
