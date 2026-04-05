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
            redirect: { name: 'teacher-material-upload' },
        },
        {
            path: '/teacher/resources',
            name: 'teacher-resources',
            component: () => import('@/views/teacher/MyResourcesPage.vue'),
            meta: { requiresAuth: true, role: 'teacher' },
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
            redirect: { name: 'teacher-home' },
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
router.afterEach((to) => {
    if (typeof document === 'undefined') {
        return;
    }
    const isAdminPage = typeof to.path === 'string' && to.path.startsWith('/admin');
    document.body.classList.toggle('body-admin-locked', isAdminPage);
});
export default router;
