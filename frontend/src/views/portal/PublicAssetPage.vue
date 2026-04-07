<template>
  <main class="portal-home public-asset-page">
    <PortalTopNav />

    <header class="portal-hero public-asset-hero">
      <div class="public-asset-hero__content">
        <div class="portal-hero__eyebrow">PUBLIC ASSET LIBRARY</div>
        <h1>公共素材库</h1>
        <p>集中查看教师公开发布的图片、音频、视频和文本类素材，支持基础筛选、预览和下载。</p>
      </div>
    </header>

    <p v-if="errorMessage" class="portal-feedback">{{ errorMessage }}</p>

    <section class="public-asset-stats">
      <article class="public-asset-stat-card">
        <span>公开素材总数</span>
        <strong>{{ stats.total }}</strong>
      </article>
      <article class="public-asset-stat-card">
        <span>图片素材</span>
        <strong>{{ stats.imageCount }}</strong>
      </article>
      <article class="public-asset-stat-card">
        <span>音视频素材</span>
        <strong>{{ stats.mediaCount }}</strong>
      </article>
      <article class="public-asset-stat-card">
        <span>文本与题目</span>
        <strong>{{ stats.contentCount }}</strong>
      </article>
    </section>

    <article class="portal-panel public-asset-panel">
      <div class="portal-section-head">
        <div>
          <div class="portal-section-head__eyebrow">FILTER</div>
          <h2>筛选素材</h2>
        </div>
      </div>

      <form class="public-asset-filter" @submit.prevent="applySearch">
        <label>
          <span>关键词</span>
          <input v-model.trim="filters.keyword" type="text" maxlength="200" placeholder="搜索标题、说明、内容或教师姓名" />
        </label>

        <label>
          <span>素材类型</span>
          <select v-model="filters.type">
            <option value="all">全部类型</option>
            <option v-for="option in assetTypeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

        <div class="public-asset-filter__actions">
          <button type="button" class="auth-btn auth-btn--secondary" :disabled="loading" @click="resetFilters">重置</button>
          <button type="submit" class="auth-btn" :disabled="loading">{{ loading ? '加载中...' : '应用筛选' }}</button>
        </div>
      </form>
    </article>

    <article class="portal-panel public-asset-panel">
      <div class="portal-section-head">
        <div>
          <div class="portal-section-head__eyebrow">LIST</div>
          <h2>素材列表</h2>
        </div>
        <div class="public-asset-panel__meta">共 {{ pagination.total }} 条公开素材</div>
      </div>

      <div v-if="assetList.length" class="public-asset-list">
        <article v-for="item in assetList" :key="item.id" class="public-asset-item">
          <div class="public-asset-item__head">
            <div>
              <strong>{{ item.title }}</strong>
              <p>{{ assetTypeLabel(item.type) }} · {{ item.teacherName }}</p>
            </div>
            <span>{{ item.uploadTime }}</span>
          </div>

          <p class="public-asset-item__desc">{{ item.description || item.content || '暂无素材说明' }}</p>

          <p v-if="item.fileName" class="public-asset-item__meta">
            {{ item.fileName }}
            <span v-if="item.fileSize"> · {{ formatFileSize(item.fileSize) }}</span>
          </p>

          <div class="public-asset-item__actions">
            <button v-if="item.previewUrl" type="button" class="course-chip course-chip--soft" @click="previewAsset(item.previewUrl)">预览</button>
            <button v-if="item.fileName" type="button" class="course-chip" @click="downloadAsset(item.id)">下载</button>
          </div>
        </article>
      </div>
      <div v-else-if="!loading" class="course-detail-empty">当前还没有符合条件的公开素材。</div>

      <section class="course-pagination my-resources-pagination">
        <div class="course-pagination__desc">当前第 {{ pagination.page }} / {{ Math.max(pagination.totalPages, 1) }} 页</div>
        <div class="course-pagination__actions">
          <button type="button" class="course-chip" :disabled="pagination.page <= 1 || loading" @click="changePage(pagination.page - 1)">上一页</button>
          <button
            v-for="pageNumber in pageNumbers"
            :key="pageNumber"
            type="button"
            :class="['course-page-btn', pageNumber === pagination.page ? 'is-active' : '']"
            :disabled="loading"
            @click="changePage(pageNumber)"
          >
            {{ pageNumber }}
          </button>
        </div>
      </section>
    </article>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PortalTopNav from '@/components/navigation/PortalTopNav.vue'
import { getPortalPublicAssets } from '@/services/portal'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const errorMessage = ref('')
const assetList = ref<
  Array<{
    id: number
    type: 'image' | 'audio' | 'video' | 'text' | 'question' | 'template'
    title: string
    description: string
    content: string
    fileName: string
    fileSize: number
    uploadTime: string
    teacherName: string
    previewUrl: string
  }>
>([])

const stats = reactive({
  total: 0,
  imageCount: 0,
  mediaCount: 0,
  contentCount: 0,
})

const filters = reactive({
  keyword: '',
  type: 'all' as 'all' | 'image' | 'audio' | 'video' | 'text' | 'question' | 'template',
})

const pagination = reactive({
  page: 1,
  pageSize: 8,
  total: 0,
  totalPages: 0,
})

const assetTypeOptions = [
  { value: 'image', label: '图片' },
  { value: 'audio', label: '音频' },
  { value: 'video', label: '视频' },
  { value: 'text', label: '文本' },
  { value: 'question', label: '题目' },
  { value: 'template', label: '模板' },
] as const

const pageNumbers = computed(() => {
  const totalPages = pagination.totalPages || 1
  return Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1)
})

function normalizePage(value: unknown) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function assetTypeLabel(type: string) {
  return assetTypeOptions.find((item) => item.value === type)?.label || type
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(2)} MB`
  }

  return `${(size / 1024).toFixed(2)} KB`
}

function previewAsset(path: string) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  window.open(`${baseUrl}${path}`, '_blank', 'noopener,noreferrer')
}

function downloadAsset(assetId: number) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  window.open(`${baseUrl}/portal/assets/${assetId}/download`, '_blank', 'noopener,noreferrer')
}

function syncFiltersWithRoute() {
  filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  filters.type = typeof route.query.type === 'string' && route.query.type !== '' ? (route.query.type as typeof filters.type) : 'all'
}

function updateRoute(page = 1) {
  void router.push({
    path: '/assets',
    query: {
      page: String(page),
      ...(filters.keyword ? { keyword: filters.keyword } : {}),
      ...(filters.type !== 'all' ? { type: filters.type } : {}),
    },
  })
}

function applySearch() {
  updateRoute(1)
}

function resetFilters() {
  filters.keyword = ''
  filters.type = 'all'
  updateRoute(1)
}

function changePage(page: number) {
  updateRoute(page)
}

async function loadAssets() {
  loading.value = true
  errorMessage.value = ''
  syncFiltersWithRoute()

  try {
    const data = await getPortalPublicAssets({
      page: normalizePage(route.query.page),
      pageSize: 8,
      keyword: filters.keyword,
      type: filters.type,
    })

    assetList.value = data.list
    stats.total = data.stats.total
    stats.imageCount = data.stats.imageCount
    stats.mediaCount = data.stats.mediaCount
    stats.contentCount = data.stats.contentCount
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
  } catch (error: any) {
    assetList.value = []
    stats.total = 0
    stats.imageCount = 0
    stats.mediaCount = 0
    stats.contentCount = 0
    pagination.page = 1
    pagination.pageSize = 8
    pagination.total = 0
    pagination.totalPages = 0
    errorMessage.value = error?.response?.data?.message || '公共素材加载失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.fullPath,
  () => {
    loadAssets()
  },
  { immediate: true },
)
</script>
