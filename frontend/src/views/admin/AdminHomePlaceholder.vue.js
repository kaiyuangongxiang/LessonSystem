import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getAdminDashboard } from '@/services/admin';
import { useAuthStore } from '@/stores/auth';
const router = useRouter();
const authStore = useAuthStore();
const dashboard = ref(null);
const errorMessage = ref('');
const adminName = computed(() => dashboard.value?.profile.name || authStore.profile?.name || authStore.profile?.username || '管理员');
const todayText = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
})
    .format(new Date())
    .replace(/\//g, '-');
const welcomeText = computed(() => `${adminName.value}，这里用于查看教师、学生、课程、资源与教学交流的全局概览。`);
const metricCards = computed(() => {
    const stats = dashboard.value?.stats || {
        studentCount: 0,
        teacherCount: 0,
        courseCount: 0,
        materialCount: 0,
        videoCount: 0,
        topicCount: 0,
    };
    return [
        { label: '教师总数', value: stats.teacherCount, tip: '当前可用教师账号数量' },
        { label: '学生总数', value: stats.studentCount, tip: '当前可用学生账号数量' },
        { label: '课程总数', value: stats.courseCount, tip: '系统内已发布课程总览' },
        { label: '资料总数', value: stats.materialCount, tip: '教师上传资料累计数量' },
        { label: '视频总数', value: stats.videoCount, tip: '课程视频资源累计数量' },
        { label: '交流主题数', value: stats.topicCount, tip: '教学交流主题累计数量' },
    ];
});
const reminderTexts = computed(() => {
    const stats = dashboard.value?.stats;
    if (!stats) {
        return ['正在加载后台统计数据', '稍后可查看最新教师、学生与资源动态'];
    }
    return [
        stats.studentCount > 0 ? `当前共有 ${stats.studentCount} 位学生账号已开通。` : '当前还没有学生账号，可先补齐学生端基础角色。',
        stats.topicCount > 0 ? `当前共有 ${stats.topicCount} 条交流主题可继续跟进。` : '当前还没有交流主题，后续可关注教师讨论情况。',
    ];
});
async function handleLogout() {
    authStore.logout();
    await router.push('/login');
}
async function loadDashboard() {
    errorMessage.value = '';
    try {
        dashboard.value = await getAdminDashboard();
    }
    catch (error) {
        dashboard.value = null;
        errorMessage.value = error?.response?.data?.message || '管理员工作台加载失败';
    }
}
onMounted(() => {
    loadDashboard();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "admin-dashboard-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "admin-dashboard-sidebar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-dashboard-sidebar__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "admin-dashboard-nav" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin/system');
        } },
    type: "button",
    ...{ class: "admin-dashboard-nav__item admin-dashboard-nav__item--system" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "button",
    ...{ class: "admin-dashboard-nav__item is-active" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin/teachers');
        } },
    type: "button",
    ...{ class: "admin-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin/students');
        } },
    type: "button",
    ...{ class: "admin-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin/accounts');
        } },
    type: "button",
    ...{ class: "admin-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin/colleges');
        } },
    type: "button",
    ...{ class: "admin-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin/courses');
        } },
    type: "button",
    ...{ class: "admin-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin/assets');
        } },
    type: "button",
    ...{ class: "admin-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin/materials');
        } },
    type: "button",
    ...{ class: "admin-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin/messages');
        } },
    type: "button",
    ...{ class: "admin-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "admin-dashboard-reminder-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-dashboard-reminder-card__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
(__VLS_ctx.reminderTexts[0]);
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
(__VLS_ctx.reminderTexts[1]);
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "admin-dashboard-main" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "admin-dashboard-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-dashboard-head__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.welcomeText);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-dashboard-head__actions" },
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
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "course-feedback" },
    });
    (__VLS_ctx.errorMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "admin-dashboard-metrics" },
});
for (const [card] of __VLS_getVForSourceType((__VLS_ctx.metricCards))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        key: (card.label),
        ...{ class: "admin-dashboard-metric" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (card.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (card.value);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
    (card.tip);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "admin-dashboard-grid admin-dashboard-grid--middle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "admin-dashboard-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-dashboard-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-dashboard-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
if (__VLS_ctx.dashboard?.latestTeachers.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-dashboard-teacher-list" },
    });
    for (const [teacher] of __VLS_getVForSourceType((__VLS_ctx.dashboard.latestTeachers))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (teacher.id),
            ...{ class: "admin-dashboard-teacher-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (teacher.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (teacher.summary);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (teacher.username);
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty course-detail-empty--compact" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "admin-dashboard-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-dashboard-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-dashboard-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
if (__VLS_ctx.dashboard?.latestResources.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-dashboard-resource-list" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.dashboard.latestResources))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (`${item.type}-${item.id}`),
            ...{ class: "admin-dashboard-resource-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (item.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (item.teacherName);
        (item.courseName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-dashboard-resource-item__meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: (['admin-dashboard-tag', item.type === 'video' ? 'is-video' : 'is-material']) },
        });
        (item.type === 'video' ? '视频' : '资料');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.uploadDate);
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty course-detail-empty--compact" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "admin-dashboard-grid admin-dashboard-grid--bottom" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "admin-dashboard-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-dashboard-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-dashboard-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-dashboard-weekly" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.dashboard?.weeklyActivity.materialCount ?? 0);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.dashboard?.weeklyActivity.videoCount ?? 0);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.dashboard?.weeklyActivity.topicCount ?? 0);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-dashboard-status" },
});
(__VLS_ctx.dashboard?.weeklyActivity.label || __VLS_ctx.todayText);
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "admin-dashboard-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-dashboard-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-dashboard-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
if (__VLS_ctx.dashboard?.latestTopics.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-dashboard-topic-list" },
    });
    for (const [topic] of __VLS_getVForSourceType((__VLS_ctx.dashboard.latestTopics))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (topic.id),
            ...{ class: "admin-dashboard-topic-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (topic.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (topic.teacherName);
        (topic.createTime);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (topic.replyCount);
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty course-detail-empty--compact" },
    });
}
/** @type {__VLS_StyleScopedClasses['admin-dashboard-page']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-sidebar__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item--system']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['is-active']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-reminder-card']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-reminder-card__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-main']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-head__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-head__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['course-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-metrics']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-metric']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-grid--middle']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-teacher-list']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-teacher-item']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-resource-list']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-resource-item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-resource-item__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-grid--bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-weekly']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-status']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-topic-list']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-topic-item']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            dashboard: dashboard,
            errorMessage: errorMessage,
            todayText: todayText,
            welcomeText: welcomeText,
            metricCards: metricCards,
            reminderTexts: reminderTexts,
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
