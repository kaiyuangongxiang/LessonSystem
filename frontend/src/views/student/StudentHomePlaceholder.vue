<template>
  <main class="teacher-dashboard-page">
    <aside class="teacher-dashboard-sidebar">
      <div>
        <div class="teacher-dashboard-sidebar__eyebrow">STUDENT WORKSPACE</div>
        <h1>学生中心</h1>
      </div>

      <nav class="teacher-dashboard-nav">
        <button type="button" class="teacher-dashboard-nav__item is-active">首页概览</button>
        <button type="button" class="teacher-dashboard-nav__item" @click="router.push('/student/messages')">教学交流</button>
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
              <div class="teacher-dashboard-panel__eyebrow">READY NOW</div>
              <h3>当前已开放</h3>
            </div>
          </div>

          <div class="teacher-dashboard-upload-list">
            <article class="teacher-dashboard-upload-item">
              <div class="teacher-dashboard-upload-item__main">
                <strong>学生账号体系</strong>
                <p>支持学生自助注册、登录并进入学生工作台。</p>
              </div>
            </article>
            <article class="teacher-dashboard-upload-item">
              <div class="teacher-dashboard-upload-item__main">
                <strong>教学交流入口</strong>
                <p>现在可以进入教学交流页，查看主题和回复内容，了解课程讨论动态。</p>
              </div>
            </article>
          </div>
        </article>

        <article class="teacher-dashboard-panel teacher-dashboard-panel--actions">
          <div class="teacher-dashboard-panel__head">
            <div>
              <div class="teacher-dashboard-panel__eyebrow">QUICK ACTION</div>
              <h3>继续参与</h3>
            </div>
          </div>

          <div class="teacher-dashboard-note student-dashboard-note--action">
            <div>
              <strong>前往教学交流</strong>
              <p>围绕课程问题、资源体验和课堂反馈，查看教师、管理员和同学的讨论内容。</p>
            </div>
            <div class="teacher-message-actions student-dashboard-note__actions">
              <button type="button" class="auth-btn" @click="router.push('/student/messages')">查看教学交流</button>
            </div>
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
const welcomeText = computed(() => `${studentName.value}，这里是学生端入口，当前以查看课程交流内容为主。`)

const metricCards = [
  { label: '账号状态', value: '已开通', tip: '当前学生账号可正常登录使用' },
  { label: '角色类型', value: '学生', tip: '已完成学生角色接入' },
  { label: '交流权限', value: '查看中', tip: '当前学生账号仅支持查看交流内容' },
]

function handleLogout() {
  authStore.logout()
  router.push('/login?role=student')
}
</script>
