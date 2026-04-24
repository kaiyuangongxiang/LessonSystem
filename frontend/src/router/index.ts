import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

function isAdminRoutePath(path: unknown) {
  return typeof path === 'string' && path.startsWith('/admin')
}

function resolveHomeByRole(role: string) {
  if (role === 'admin') {
    return { name: 'admin-home' }
  }

  if (role === 'student') {
    return { name: 'student-home' }
  }

  return { name: 'teacher-home' }
}

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from) {
    if (to.path === from.path) {
      return false
    }

    return { left: 0, top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'portal-home',
      component: () => import('@/views/portal/HomePage.vue'),
    },
    {
      path: '/assets',
      name: 'portal-assets',
      component: () => import('@/views/portal/PublicAssetPage.vue'),
    },
    {
      path: '/courses',
      name: 'course-list',
      component: () => import('@/views/portal/CourseListPage.vue'),
    },
    {
      path: '/courses/:courseId',
      name: 'course-detail',
      component: () => import('@/views/portal/CourseDetailPage.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginPage.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterPage.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/teacher',
      name: 'teacher-home',
      component: () => import('@/views/teacher/TeacherHomePlaceholder.vue'),
      meta: { requiresAuth: true, role: 'teacher' },
    },
    {
      path: '/teacher/assets',
      name: 'teacher-assets',
      component: () => import('@/views/teacher/TeacherAssetManagePage.vue'),
      meta: { requiresAuth: true, role: 'teacher' },
    },
    {
      path: '/teacher/preps',
      name: 'teacher-preps',
      component: () => import('@/views/teacher/TeacherPrepManagePage.vue'),
      meta: { requiresAuth: true, role: 'teacher' },
    },
    {
      path: '/teacher/coursewares',
      name: 'teacher-coursewares',
      component: () => import('@/views/teacher/TeacherCoursewareToolPage.vue'),
      meta: { requiresAuth: true, role: 'teacher' },
    },
    {
      path: '/teacher/coursewares/:coursewareId/editor',
      name: 'teacher-courseware-editor',
      redirect: { name: 'teacher-coursewares' },
    },
    {
      path: '/teacher/materials',
      name: 'teacher-material-upload',
      redirect: { name: 'teacher-assets' },
    },
    {
      path: '/teacher/videos',
      name: 'teacher-video-upload',
      redirect: { name: 'teacher-assets' },
    },
    {
      path: '/teacher/resources',
      name: 'teacher-resources',
      redirect: { name: 'teacher-assets' },
    },
    {
      path: '/teacher/profile',
      name: 'teacher-profile',
      component: () => import('@/views/teacher/TeacherProfilePage.vue'),
      meta: { requiresAuth: true, role: 'teacher' },
    },
    {
      path: '/teacher/messages',
      name: 'teacher-messages',
      component: () => import('@/views/teacher/TeacherMessagePage.vue'),
      meta: { requiresAuth: true, role: 'teacher' },
    },
    {
      path: '/student',
      name: 'student-home',
      component: () => import('@/views/student/StudentHomePlaceholder.vue'),
      meta: { requiresAuth: true, role: 'student' },
    },
    {
      path: '/student/messages',
      name: 'student-messages',
      component: () => import('@/views/student/StudentMessagePage.vue'),
      meta: { requiresAuth: true, role: 'student' },
    },
    {
      path: '/admin',
      name: 'admin-home',
      component: () => import('@/views/admin/AdminHomePlaceholder.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin/teachers',
      name: 'admin-teachers',
      component: () => import('@/views/admin/AdminTeacherManagePage.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin/students',
      name: 'admin-students',
      component: () => import('@/views/admin/AdminStudentManagePage.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin/accounts',
      name: 'admin-accounts',
      component: () => import('@/views/admin/AdminAccountManagePage.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin/colleges',
      name: 'admin-colleges',
      component: () => import('@/views/admin/AdminCollegeManagePage.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin/courses',
      name: 'admin-courses',
      component: () => import('@/views/admin/AdminCourseManagePage.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin/preps',
      name: 'admin-preps',
      component: () => import('@/views/admin/AdminPrepManagePage.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin/assets',
      name: 'admin-assets',
      component: () => import('@/views/admin/AdminAssetManagePage.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin/materials',
      name: 'admin-materials',
      component: () => import('@/views/admin/AdminMaterialManagePage.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin/system',
      name: 'admin-system',
      component: () => import('@/views/admin/AdminSystemManagePage.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin/videos',
      name: 'admin-videos',
      redirect: { name: 'admin-materials' },
    },
    {
      path: '/admin/messages',
      name: 'admin-messages',
      component: () => import('@/views/admin/AdminMessageManagePage.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return resolveHomeByRole(authStore.role)
  }

  if (to.meta.role && to.meta.role !== authStore.role) {
    return resolveHomeByRole(authStore.role)
  }

  return true
})

router.afterEach((to, from) => {
  if (typeof document === 'undefined') {
    return
  }

  const isAdminPage = isAdminRoutePath(to.path)
  const isTeacherPage = typeof to.path === 'string' && to.path.startsWith('/teacher')
  document.body.classList.toggle('body-admin-locked', isAdminPage)
  document.body.classList.toggle('body-teacher-locked', isTeacherPage)

  if (to.path === from.path) {
    return
  }

  window.requestAnimationFrame(() => {
    window.scrollTo({ left: 0, top: 0 })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0

    document
      .querySelectorAll<HTMLElement>('.teacher-dashboard-main, .admin-dashboard-main, .admin-manage-main')
      .forEach((element) => {
        element.scrollTop = 0
      })
  })
})

export default router
