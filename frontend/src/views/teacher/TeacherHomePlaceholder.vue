<template>
  <main class="placeholder-page">
    <section class="placeholder-card placeholder-card--teacher">
      <div class="placeholder-card__eyebrow">TEACHER CENTER</div>
      <h1>教师中心</h1>
      <p>当前已接入教师教学交流主入口，你可以直接进入“教学交流”查看我的主题并继续讨论。</p>
      <div class="placeholder-actions">
        <button type="button" class="auth-btn" @click="router.push('/teacher/messages')">进入教学交流</button>
        <button type="button" class="auth-btn auth-btn--secondary" @click="router.push('/')">返回首页</button>
      </div>
      <div class="placeholder-meta">当前登录角色：教师。该页面用于承接教师身份导航分流。</div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>
