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
      <header class="teacher-dashboard-head teacher-courseware-tool-head">
        <div>
          <div class="teacher-dashboard-head__eyebrow">ONLINE COURSEWARE</div>
          <h2>在线课件</h2>
          <p>这里提供在线课件制作入口，适合把已经整理好的教学内容快速排版成演示课件。点击后会新开标签页进入 PPTist，不影响教师中心当前页面。</p>
        </div>

        <div class="teacher-dashboard-head__actions">
          <button type="button" class="auth-btn" @click="openPptist">打开 PPTist</button>
        </div>
      </header>

      <section class="teacher-dashboard-grid teacher-dashboard-grid--middle">
        <article class="teacher-dashboard-panel teacher-courseware-tool-panel">
          <div class="teacher-dashboard-panel__head">
            <div>
              <div class="teacher-dashboard-panel__eyebrow">WORKFLOW</div>
              <h3>功能说明</h3>
            </div>
          </div>

          <div class="teacher-courseware-tool-list">
            <article class="teacher-courseware-tool-item">
              <div>
                <strong>1. 先准备教学内容</strong>
                <span>建议先在备课单中整理好授课目标、讲解结构、课堂案例和需要引用的附件素材，再进入课件制作。</span>
              </div>
            </article>
            <article class="teacher-courseware-tool-item">
              <div>
                <strong>2. 打开 PPTist 开始排版</strong>
                <span>点击“打开 PPTist”后，会在新标签页进入外部课件工具，适合完成封面、目录、内容页和演示节奏的排版设计。</span>
              </div>
            </article>
            <article class="teacher-courseware-tool-item">
              <div>
                <strong>3. 导出与保存需自行处理</strong>
                <span>当前页面仅提供制作入口，不负责站内保存、自动回填、发布或与课程资料做联动同步。</span>
              </div>
            </article>
            <article class="teacher-courseware-tool-item">
              <div>
                <strong>4. 适用场景</strong>
                <span>适合教师快速制作展示型课件、公开课演示稿、课堂讲授型页面内容，以及需要单独导出的课件文件。</span>
              </div>
            </article>
          </div>
        </article>

        <article class="teacher-dashboard-panel teacher-courseware-tool-panel teacher-courseware-tool-panel--notice">
          <div class="teacher-dashboard-panel__head">
            <div>
              <div class="teacher-dashboard-panel__eyebrow">NOTICE</div>
              <h3>使用提醒</h3>
            </div>
          </div>

          <div class="teacher-courseware-tool-note">
            <strong>当前能力边界</strong>
            <p>现在支持从教师中心一键跳转到课件工具，但暂不支持课件内容自动回传、与备课单绑定保存、素材库直接拖入或课件成品统一归档。</p>
          </div>

          <div class="teacher-courseware-tool-note teacher-courseware-tool-note--soft">
            <strong>建议的使用顺序</strong>
            <p>先完成课程资料和备课内容整理，再制作课件；这样后续无论是课堂展示、导出文件还是继续补充教学材料，都会更顺手。</p>
          </div>

          <div class="teacher-courseware-tool-callout">
            <span>推荐操作</span>
            <p>如果你现在已经准备好本节课的教学结构，可以直接点击右上角按钮开始制作，不需要再返回其他页面。</p>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import TeacherSidebarNav from '@/components/navigation/TeacherSidebarNav.vue'

function openPptist() {
  window.open('https://pipipi-pikachu.github.io/PPTist/', '_blank', 'noopener,noreferrer')
}
</script>
