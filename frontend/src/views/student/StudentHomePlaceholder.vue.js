import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
const router = useRouter();
const authStore = useAuthStore();
const studentName = computed(() => authStore.profile?.name || authStore.profile?.username || '学生用户');
const welcomeText = computed(() => `${studentName.value}，这里是学生端入口，当前已接入教学交流能力。`);
const metricCards = [
    { label: '账号状态', value: '已开通', tip: '当前学生账号可正常登录使用' },
    { label: '角色类型', value: '学生', tip: '已完成学生角色接入' },
    { label: '交流能力', value: '已接入', tip: '支持查看、回复，并在条件满足时发布主题' },
];
function handleLogout() {
    authStore.logout();
    router.push('/login?role=student');
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "teacher-dashboard-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "teacher-dashboard-sidebar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-sidebar__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "teacher-dashboard-nav" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "button",
    ...{ class: "teacher-dashboard-nav__item is-active" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/student/messages');
        } },
    type: "button",
    ...{ class: "teacher-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "teacher-dashboard-main" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "teacher-dashboard-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-head__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.welcomeText);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-head__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/');
        } },
    type: "button",
    ...{ class: "auth-btn auth-btn--secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.handleLogout) },
    type: "button",
    ...{ class: "auth-btn" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "teacher-dashboard-metrics" },
});
for (const [card] of __VLS_getVForSourceType((__VLS_ctx.metricCards))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        key: (card.label),
        ...{ class: "teacher-dashboard-metric" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (card.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (card.value);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
    (card.tip);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "teacher-dashboard-grid teacher-dashboard-grid--middle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "teacher-dashboard-panel teacher-dashboard-panel--uploads" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-upload-list" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "teacher-dashboard-upload-item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-upload-item__main" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "teacher-dashboard-upload-item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-upload-item__main" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "teacher-dashboard-panel teacher-dashboard-panel--actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-note student-dashboard-note--action" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-message-actions student-dashboard-note__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/student/messages');
        } },
    type: "button",
    ...{ class: "auth-btn" },
});
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-page']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-sidebar__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['is-active']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-main']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-head']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-head__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-head__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-metrics']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-metric']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-grid--middle']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-panel--uploads']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-upload-list']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-upload-item__main']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-upload-item__main']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-panel--actions']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-note']} */ ;
/** @type {__VLS_StyleScopedClasses['student-dashboard-note--action']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['student-dashboard-note__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            welcomeText: welcomeText,
            metricCards: metricCards,
            handleLogout: handleLogout,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
