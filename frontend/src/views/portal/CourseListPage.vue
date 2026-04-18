<template>
  <main class="course-list-page">
    <PortalTopNav />

    <header class="course-list-nav">
      <div>
        <div class="course-list-nav__eyebrow">COURSE CENTER</div>
        <h1>课程中心</h1>
        <p class="course-list-nav__desc">围绕课程、资料与视频的统一入口，按学院与资源偏好快速定位适合浏览的课程内容。</p>
      </div>
    </header>

    <section class="course-list-summary">
      <div class="course-list-summary__intro">
        <div class="course-list-summary__eyebrow">SMART FILTER</div>
        <h2>课程筛选</h2>
        <!-- <p>先按学院范围缩小结果，再结合排序方式浏览课程，搜索框负责补充关键词检索。</p> -->
      </div>

      <div class="course-list-filter-panel">
        <div class="course-list-filter-row">
          <div class="course-list-filter-label">学院范围</div>
          <div class="course-list-chips">
            <button
              v-for="college in collegeOptions"
              :key="college.id"
              type="button"
              :class="['course-chip', String(selectedCollegeId) === String(college.id) ? 'is-active' : '']"
              @click="handleCollegeChange(college.id)"
            >
              {{ college.name }}
            </button>
          </div>
        </div>

        <div class="course-list-filter-row">
          <div class="course-list-filter-label">排序方式</div>
          <div class="course-list-sort">
            <button
              type="button"
              :class="['course-chip', 'course-chip--sort', routeSort === 'latest' ? 'is-active' : '']"
              @click="updateRoute({ sort: 'latest', page: 1 })"
            >
              最近更新
            </button>
            <button
              type="button"
              :class="['course-chip', 'course-chip--sort', routeSort === 'video-rich' ? 'is-active' : '']"
              @click="updateRoute({ sort: 'video-rich', page: 1 })"
            >
              视频优先
            </button>
          </div>
        </div>

        <div class="course-list-filter-meta">
          <div class="course-list-filter-state">
            <span>当前筛选</span>
            <strong>{{ filterSummary }}</strong>
          </div>
          <button v-if="hasActiveFilters" type="button" class="course-list-reset-btn" @click="resetFilters">重置筛选</button>
        </div>
      </div>
    </section>

    <p v-if="errorMessage" class="course-feedback">{{ errorMessage }}</p>

    <section class="course-list-grid">
      <article v-for="course in visibleCourses" :key="course.id" class="course-card">
        <div class="course-card__meta">{{ course.collegeName }} · {{ course.teacherName }}</div>
        <h3>{{ course.name }}</h3>
        <p>{{ course.summary }}</p>
        <div class="course-card__footer">
          <div class="course-card__stats">
            <span>{{ course.materialCount }} 份资料</span>
            <span>{{ course.videoCount }} 个视频</span>
          </div>
          <button type="button" @click="goCourseDetail(course.id)">查看详情</button>
        </div>
      </article>
    </section>

    <section class="course-pagination">
      <div class="course-pagination__desc">共 {{ pagination.total }} 门课程 · 支持分页浏览</div>
      <div class="course-pagination__actions">
        <button type="button" class="course-chip course-pagination__nav" :disabled="pagination.page <= 1" @click="changePage(pagination.page - 1)" aria-label="上一页">‹</button>
        <button type="button" class="course-page-btn is-active" aria-current="page">{{ pagination.page }}</button>
        <button type="button" class="course-chip course-pagination__nav" :disabled="pagination.page >= pagination.totalPages" @click="changePage(pagination.page + 1)" aria-label="下一页">›</button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PortalTopNav from '@/components/navigation/PortalTopNav.vue'
import http from '@/services/http'

interface CourseItem {
  id: number
  name: string
  summary: string
  collegeName: string
  teacherName: string
  videoCount: number
  materialCount: number
  updateDate: string
}

interface CollegeOption {
  id: number | 'all'
  name: string
}

interface CourseListResponse {
  list: CourseItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  filters: {
    colleges: Array<{ id: number; name: string }>
  }
}

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const errorMessage = ref('')

const courses = ref<CourseItem[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 4,
  total: 0,
  totalPages: 0,
})
const colleges = ref<Array<{ id: number; name: string }>>([])

const routeKeyword = computed(() => (typeof route.query.keyword === 'string' ? route.query.keyword : ''))
const routeSort = computed(() => (route.query.sort === 'video-rich' ? 'video-rich' : 'latest'))
const selectedCollegeId = computed(() => {
  const raw = route.query.collegeId
  return typeof raw === 'string' && raw ? raw : 'all'
})

const collegeOptions = computed<CollegeOption[]>(() => [{ id: 'all', name: '全部学院' }, ...colleges.value])

const selectedCollegeName = computed(() => {
  const current = collegeOptions.value.find((item) => String(item.id) === String(selectedCollegeId.value))
  return current?.name || '全部学院'
})

const hasActiveFilters = computed(() => Boolean(routeKeyword.value || selectedCollegeId.value !== 'all' || routeSort.value !== 'latest'))

const filterSummary = computed(() => {
  const parts = [selectedCollegeName.value]

  if (routeKeyword.value) {
    parts.push(`关键词：${routeKeyword.value}`)
  }

  parts.push(routeSort.value === 'video-rich' ? '视频资源优先' : '最近更新')
  return parts.join(' · ')
})

const visibleCourses = computed(() => {
  if (courses.value.length) {
    return courses.value
  }

  return [
    {
      id: 0,
      name: '课程内容待接入',
      summary: '后续将展示课程简介、资料数量与视频数量。',
      collegeName: '系统预留',
      teacherName: '系统预留',
      videoCount: 0,
      materialCount: 0,
      updateDate: '待更新',
    },
    {
      id: 1,
      name: '课程案例待更新',
      summary: '课程列表接口接通后，这里会展示真实课程筛选结果。',
      collegeName: '系统预留',
      teacherName: '系统预留',
      videoCount: 0,
      materialCount: 0,
      updateDate: '待更新',
    },
    {
      id: 2,
      name: '课程详情入口待开放',
      summary: '点击课程卡片即可进入课程详情页查看关联资料与视频。',
      collegeName: '系统预留',
      teacherName: '系统预留',
      videoCount: 0,
      materialCount: 0,
      updateDate: '待更新',
    },
  ]
})

function normalizePage(value: unknown) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function updateRoute(next: { keyword?: string; collegeId?: string | number; sort?: string; page?: number }) {
  router.push({
    path: '/courses',
    query: {
      keyword: (next.keyword ?? routeKeyword.value) || undefined,
      collegeId: next.collegeId ?? (selectedCollegeId.value === 'all' ? undefined : selectedCollegeId.value),
      sort: next.sort ?? routeSort.value,
      page: String(next.page ?? normalizePage(route.query.page)),
    },
  })
}

function handleCollegeChange(collegeId: string | number) {
  updateRoute({ collegeId: collegeId === 'all' ? undefined : collegeId, page: 1 })
}

function changePage(page: number) {
  updateRoute({ page })
}

function resetFilters() {
  updateRoute({ keyword: undefined, collegeId: undefined, sort: 'latest', page: 1 })
}

function goCourseDetail(courseId: number) {
  if (!courseId) {
    return
  }

  router.push(`/courses/${courseId}`)
}

async function loadCourses() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await http.get('/portal/courses', {
      params: {
        keyword: routeKeyword.value || undefined,
        collegeId: selectedCollegeId.value === 'all' ? undefined : selectedCollegeId.value,
        sort: routeSort.value,
        page: normalizePage(route.query.page),
        pageSize: 4,
      },
    })

    const data = response.data.data as CourseListResponse
    courses.value = data.list
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
    colleges.value = data.filters.colleges
  } catch (error: any) {
    courses.value = []
    pagination.page = 1
    pagination.pageSize = 4
    pagination.total = 0
    pagination.totalPages = 0
    colleges.value = []
    errorMessage.value = error?.response?.data?.message || '课程列表加载失败，当前展示默认内容'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.fullPath,
  () => {
    loadCourses()
  },
  { immediate: true },
)
</script>
