import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'portal-home',
            component: () => import('@/views/portal/HomePage.vue'),
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
            path: '/teacher/materials',
            name: 'teacher-material-upload',
            component: () => import('@/views/teacher/MaterialUploadPage.vue'),
            meta: { requiresAuth: true, role: 'teacher' },
        },
        {
            path: '/teacher/videos',
            name: 'teacher-video-upload',
            component: () => import('@/views/teacher/VideoUploadPage.vue'),
            meta: { requiresAuth: true, role: 'teacher' },
        },
        {
            path: '/teacher/messages',
            name: 'teacher-messages',
            component: () => import('@/views/teacher/OnlineMessagePage.vue'),
            meta: { requiresAuth: true, role: 'teacher' },
        },
        {
            path: '/admin',
            name: 'admin-home',
            component: () => import('@/views/admin/AdminHomePlaceholder.vue'),
            meta: { requiresAuth: true, role: 'admin' },
        },
    ],
});
router.beforeEach((to) => {
    const authStore = useAuthStore();
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        return { name: 'login' };
    }
    if (to.meta.guestOnly && authStore.isAuthenticated) {
        return authStore.role === 'admin' ? { name: 'admin-home' } : { name: 'teacher-home' };
    }
    if (to.meta.role && to.meta.role !== authStore.role) {
        return authStore.role === 'admin' ? { name: 'admin-home' } : { name: 'teacher-home' };
    }
    return true;
});
export default router;
