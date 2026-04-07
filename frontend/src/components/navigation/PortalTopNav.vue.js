import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
const props = withDefaults(defineProps(), {
    systemName: '在线教师备课系统',
    eyebrow: 'TEACHER PREP PORTAL',
});
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const searchKeyword = ref('');
const systemName = computed(() => props.systemName || '在线教师备课系统');
const eyebrow = computed(() => props.eyebrow || 'TEACHER PREP PORTAL');
const activeItem = computed(() => {
    if (route.name === 'portal-home') {
        return 'home';
    }
    if (route.name === 'course-list' || route.name === 'course-detail') {
        return 'courses';
    }
    if (route.name === 'portal-assets') {
        return 'assets';
    }
    if (route.name === 'teacher-messages' || route.name === 'admin-messages') {
        return 'messages';
    }
    return '';
});
const primaryActionText = computed(() => {
    if (!authStore.isAuthenticated) {
        return '进入教师中心';
    }
    if (authStore.role === 'admin') {
        return '进入管理中心';
    }
    if (authStore.role === 'student') {
        return '进入学生中心';
    }
    return '进入教师中心';
});
const searchTargetPath = computed(() => (activeItem.value === 'assets' ? '/assets' : '/courses'));
function goHome() {
    if (route.name === 'portal-home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    void router.push('/');
}
function goCourses() {
    void router.push('/courses');
}
function goAssets() {
    void router.push('/assets');
}
function submitSearch() {
    void router.push({
        path: searchTargetPath.value,
        query: {
            keyword: searchKeyword.value || undefined,
        },
    });
}
function goPrimaryAction() {
    if (!authStore.isAuthenticated) {
        void router.push({ path: '/login', query: { role: 'teacher' } });
        return;
    }
    if (authStore.role === 'admin') {
        void router.push('/admin');
        return;
    }
    if (authStore.role === 'student') {
        void router.push('/student');
        return;
    }
    void router.push('/teacher');
}
function goTeachingMessages() {
    if (!authStore.isAuthenticated) {
        void router.push({ path: '/login', query: { role: 'teacher' } });
        return;
    }
    if (authStore.role === 'teacher') {
        void router.push('/teacher/messages');
        return;
    }
    if (authStore.role === 'admin') {
        void router.push('/admin/messages');
        return;
    }
    void router.push('/student');
}
watch(() => route.fullPath, () => {
    searchKeyword.value = typeof route.query.keyword === 'string' ? route.query.keyword : '';
}, { immediate: true });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    systemName: '在线教师备课系统',
    eyebrow: 'TEACHER PREP PORTAL',
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "portal-topbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "portal-nav" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.goHome) },
    type: "button",
    ...{ class: "portal-brand portal-brand--button" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "portal-brand__eyebrow" },
});
(__VLS_ctx.eyebrow);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "portal-brand__title" },
});
(__VLS_ctx.systemName);
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.submitSearch) },
    ...{ class: "portal-search" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.searchKeyword),
    type: "text",
    placeholder: "搜索课程 / 资料 / 视频",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
    ...{ class: "portal-search__button" },
    'aria-label': "搜索",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M10.5 18a7.5 7.5 0 1 1 5.303-12.803A7.5 7.5 0 0 1 10.5 18Zm0-13.2a5.7 5.7 0 1 0 0 11.4 5.7 5.7 0 0 0 0-11.4Zm10.064 14.791-4.076-4.075",
    stroke: "currentColor",
    'stroke-width': "1.8",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "portal-links" },
    'aria-label': "前台主导航",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.goHome) },
    type: "button",
    ...{ class: ({ 'is-active': __VLS_ctx.activeItem === 'home' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.goCourses) },
    type: "button",
    ...{ class: ({ 'is-active': __VLS_ctx.activeItem === 'courses' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.goAssets) },
    type: "button",
    ...{ class: ({ 'is-active': __VLS_ctx.activeItem === 'assets' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.goTeachingMessages) },
    type: "button",
    ...{ class: ({ 'is-active': __VLS_ctx.activeItem === 'messages' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.goPrimaryAction) },
    ...{ class: "portal-login-btn portal-login-btn--entry" },
    type: "button",
});
(__VLS_ctx.primaryActionText);
/** @type {__VLS_StyleScopedClasses['portal-topbar']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-brand']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-brand--button']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-brand__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-brand__title']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-search']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-search__button']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-links']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-login-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-login-btn--entry']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            searchKeyword: searchKeyword,
            systemName: systemName,
            eyebrow: eyebrow,
            activeItem: activeItem,
            primaryActionText: primaryActionText,
            goHome: goHome,
            goCourses: goCourses,
            goAssets: goAssets,
            submitSearch: submitSearch,
            goPrimaryAction: goPrimaryAction,
            goTeachingMessages: goTeachingMessages,
        };
    },
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
