<template>
  <main class="teacher-dashboard-page">
    <aside class="teacher-dashboard-sidebar">
      <div>
        <div class="teacher-dashboard-sidebar__eyebrow">TEACHER CENTER</div>
        <h1>教师中心</h1>
      </div>

      <TeacherSidebarNav active="coursewares" />
    </aside>

    <section class="teacher-dashboard-main">
      <header class="teacher-dashboard-head">
        <div>
          <div class="teacher-dashboard-head__eyebrow">ONLINE COURSEWARE</div>
          <h2>在线课件</h2>
          <p>当前保留课件工具入口，不再在站内维护独立编辑器。点击后会新开标签页进入 PPTist。</p>
        </div>

        <div class="teacher-dashboard-head__actions">
          <button type="button" class="auth-btn" @click="openPptist">打开 PPTist</button>
          <button type="button" class="auth-btn auth-btn--secondary" @click="router.push('/teacher/preps')">返回备课单</button>
        </div>
      </header>

      <section class="teacher-dashboard-grid teacher-dashboard-grid--middle">
        <article class="teacher-dashboard-panel">
          <div class="teacher-dashboard-panel__head">
            <div>
              <div class="teacher-dashboard-panel__eyebrow">USAGE</div>
              <h3>使用方式</h3>
            </div>
          </div>

          <div class="teacher-dashboard-hot-list">
            <article class="teacher-dashboard-hot-item">
              <div>
                <strong>1. 先整理备课单</strong>
                <span>建议先在备课单里准备好教学内容和附件素材。</span>
              </div>
            </article>
            <article class="teacher-dashboard-hot-item">
              <div>
                <strong>2. 新开标签制作课件</strong>
                <span>点击“打开 PPTist”后，会在外部页面进行排版与演示设计。</span>
              </div>
            </article>
            <article class="teacher-dashboard-hot-item">
              <div>
                <strong>3. 课件文件自行保存</strong>
                <span>本期仅提供工具入口，不做站内保存、回填和发布联动。</span>
              </div>
            </article>
          </div>
        </article>

        <article class="teacher-dashboard-panel">
          <div class="teacher-dashboard-panel__head">
            <div>
              <div class="teacher-dashboard-panel__eyebrow">NOTICE</div>
              <h3>当前说明</h3>
            </div>
          </div>

          <div class="teacher-dashboard-note">
            <strong>工具入口已就位</strong>
            <p>如果后续要把素材库、备课单和课件编辑进一步打通，我们可以在现有页面基础上再往回接，不影响现在的教师中心结构。</p>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import TeacherSidebarNav from '@/components/navigation/TeacherSidebarNav.vue'

const router = useRouter()

function openPptist() {
  window.open('https://pipipi-pikachu.github.io/PPTist/', '_blank', 'noopener,noreferrer')
}
</script>
