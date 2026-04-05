<template>
  <main class="teacher-dashboard-page">
    <aside class="teacher-dashboard-sidebar">
      <div>
        <div class="teacher-dashboard-sidebar__eyebrow">STUDENT WORKSPACE</div>
        <h1>学生中心</h1>
      </div>

      <nav class="teacher-dashboard-nav">
        <button type="button" class="teacher-dashboard-nav__item is-active">首页概览</button>
      </nav>
    </aside>

    <section class="teacher-dashboard-main">
      <header class="teacher-dashboard-head">
        <div>
          <div class="teacher-dashboard-head__eyebrow">STUDENT DASHBOARD</div>
          <h2>学生工作台</h2>
          <p>{{ welcomeText }}</p>
        </div>
        <div class="teacher-dashboard-head__actions">
          <button type="button" class="auth-btn auth-btn--secondary" @click="router.push('/')">返回首页</button>
          <button type="button" class="auth-btn" @click="handleLogout">退出登录</button>
        </div>
      </header>

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
              <div class="teacher-dashboard-panel__eyebrow">PHASE ONE</div>
              <h3>当前已开放</h3>
            </div>
          </div>

          <div class="teacher-dashboard-upload-list">
            <article class="teacher-dashboard-upload-item">
              <div class="teacher-dashboard-upload-item__main">
                <strong>学生账号登录</strong>
                <p>支持学生自助注册、登录并进入学生中心。</p>
              </div>
            </article>
            <article class="teacher-dashboard-upload-item">
              <div class="teacher-dashboard-upload-item__main">
                <strong>管理员统一管理</strong>
                <p>管理员可在后台维护学生基础信息和账号状态。</p>
              </div>
            </article>
          </div>
        </article>

        <article class="teacher-dashboard-panel teacher-dashboard-panel--actions">
          <div class="teacher-dashboard-panel__head">
            <div>
              <div class="teacher-dashboard-panel__eyebrow">NEXT STEP</div>
              <h3>后续接入</h3>
            </div>
          </div>

          <div class="teacher-dashboard-note">
            <strong>补齐计划正在推进</strong>
            <p>接下来会逐步接入课程学习、统一论坛、留言板和在线课件浏览等学生端能力。</p>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const studentName = computed(() => authStore.profile?.name || authStore.profile?.username || '学生用户')
const welcomeText = computed(() => `${studentName.value}，这里是学生端第一阶段入口，后续会逐步接入课程学习与互动功能。`)

const metricCards = [
  { label: '账号状态', value: '已开通', tip: '当前学生账号可正常登录使用' },
  { label: '角色类型', value: '学生', tip: '已完成学生角色接入' },
  { label: '功能阶段', value: '第一期', tip: '当前优先完成注册登录与后台管理' },
]

function handleLogout() {
  authStore.logout()
  router.push('/login?role=student')
}
</script>
