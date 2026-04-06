import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getAdminSidebarScrollTop, setAdminSidebarScrollTop } from '@/utils/adminSidebarScroll';
const __VLS_props = defineProps();
const router = useRouter();
const route = useRoute();
const navRef = ref(null);
let restoreAttempts = 0;
const MAX_RESTORE_ATTEMPTS = 12;
const menuItems = [
    { key: 'system', label: '系统管理', path: '/admin/system' },
    { key: 'home', label: '总览首页', path: '/admin' },
    { key: 'teachers', label: '教师用户', path: '/admin/teachers' },
    { key: 'students', label: '学生用户', path: '/admin/students' },
    { key: 'accounts', label: '账号管理', path: '/admin/accounts' },
    { key: 'colleges', label: '学院管理', path: '/admin/colleges' },
    { key: 'courses', label: '课程管理', path: '/admin/courses' },
    { key: 'preps', label: '备课单管理', path: '/admin/preps' },
    { key: 'assets', label: '素材库', path: '/admin/assets' },
    { key: 'materials', label: '资料管理', path: '/admin/materials' },
    { key: 'messages', label: '教学交流', path: '/admin/messages' },
];
function handleNavigate(path) {
    setAdminSidebarScrollTop(navRef.value?.scrollTop || 0);
    if (route.path === path) {
        return;
    }
    void router.push(path);
}
function handleScroll() {
    setAdminSidebarScrollTop(navRef.value?.scrollTop || 0);
}
function restoreScroll() {
    const nav = navRef.value;
    if (!nav) {
        return;
    }
    nav.scrollTop = getAdminSidebarScrollTop();
    restoreAttempts += 1;
    if (restoreAttempts < MAX_RESTORE_ATTEMPTS) {
        window.requestAnimationFrame(restoreScroll);
    }
}
onMounted(() => {
    restoreAttempts = 0;
    void nextTick(() => {
        restoreScroll();
    });
});
onBeforeUnmount(() => {
    setAdminSidebarScrollTop(navRef.value?.scrollTop || 0);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ onScroll: (__VLS_ctx.handleScroll) },
    ref: "navRef",
    ...{ class: "admin-dashboard-nav" },
});
/** @type {typeof __VLS_ctx.navRef} */ ;
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.menuItems))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleNavigate(item.path);
            } },
        key: (item.key),
        type: "button",
        ...{ class: ([
                'admin-dashboard-nav__item',
                item.key === __VLS_ctx.active ? 'is-active' : '',
                item.key === 'system' ? 'admin-dashboard-nav__item--system' : '',
            ]) },
    });
    (item.label);
}
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            navRef: navRef,
            menuItems: menuItems,
            handleNavigate: handleNavigate,
            handleScroll: handleScroll,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
