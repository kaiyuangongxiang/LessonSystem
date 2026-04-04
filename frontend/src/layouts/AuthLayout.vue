<template>
  <div class="auth-shell">
    <section class="auth-shell__hero">
      <div class="brand-badge">{{ heroEyebrow }}</div>
      <h1>{{ heroTitle }}</h1>
      <p class="hero-desc">{{ heroDescription }}</p>

      <div v-if="safeStats.length" class="stat-grid">
        <article v-for="item in safeStats" :key="item.label" class="stat-card">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </article>
      </div>

      <div v-if="notes.length" class="hero-panel">
        <div class="hero-panel__title">{{ panelTitle }}</div>
        <ul>
          <li v-for="note in notes" :key="note">{{ note }}</li>
        </ul>
      </div>
    </section>

    <section class="auth-shell__form">
      <slot />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface StatItem {
  label: string
  value: string
}

const props = defineProps<{
  heroEyebrow: string
  heroTitle: string
  heroDescription: string
  panelTitle: string
  notes: string[]
  stats?: StatItem[]
}>()

const safeStats = computed(() => props.stats ?? [])
</script>
