import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import TeacherSidebarNav from '@/components/navigation/TeacherSidebarNav.vue';
import { getTeacherDashboard } from '@/services/teacher';
import { useAuthStore } from '@/stores/auth';
const router = useRouter();
const authStore = useAuthStore();
const dashboard = ref(null);
const errorMessage = ref('');
const teacherName = computed(() => dashboard.value?.profile.name || authStore.profile?.name || authStore.profile?.username || '老师');
const welcomeText = computed(() => `${teacherName.value}，这里统一查看素材、备课单和个人资料等常用入口。`);
const metricCards = computed(() => {
    const stats = dashboard.value?.stats || {
        courseCount: 0,
        assetCount: 0,
        publicAssetCount: 0,
        prepCount: 0,
        publishedPrepCount: 0,
    };
    return [
        { label: '课程数量', value: stats.courseCount, tip: '当前教师名下课程' },
        { label: '资料总数', value: stats.assetCount, tip: '已上传资料总数' },
        { label: '公开素材', value: stats.publicAssetCount, tip: '前台可见的公开素材' },
        { label: '备课单', value: stats.prepCount, tip: `其中已发布 ${stats.publishedPrepCount} 条` },
    ];
});
const pendingText = computed(() => {
    const stats = dashboard.value?.stats;
    if (!stats)
        return '正在整理教师中心数据。';
    if (!stats.courseCount)
        return '当前还没有课程数据，可以先联系管理员补充课程。';
    if (!stats.assetCount)
        return '建议先上传几份常用素材，后续备课会更方便。';
    if (!stats.prepCount)
        return '已有素材后，可以继续整理备课单，形成完整教学内容。';
    return '可以继续补充公开素材，并完善备课单与个人资料。';
});
function assetTypeLabel(type) {
    const labels = {
        image: '图片',
        audio: '音频',
        video: '视频',
        text: '文本',
        file: '文件',
    };
    return labels[type] || type;
}
function handleLogout() {
    authStore.logout();
    void router.push({ path: '/login', query: { role: 'teacher' } });
}
async function loadDashboard() {
    errorMessage.value = '';
    try {
        dashboard.value = await getTeacherDashboard();
    }
    catch (error) {
        dashboard.value = null;
        errorMessage.value = error?.response?.data?.message || '教师中心数据加载失败';
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
/** @type {[typeof TeacherSidebarNav, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(TeacherSidebarNav, new TeacherSidebarNav({
    active: "home",
}));
const __VLS_1 = __VLS_0({
    active: "home",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
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
(__VLS_ctx.teacherName);
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
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "course-feedback" },
    });
    (__VLS_ctx.errorMessage);
}
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
    ...{ class: "teacher-dashboard-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher/assets');
        } },
    type: "button",
    ...{ class: "course-chip course-chip--soft" },
});
if (__VLS_ctx.dashboard?.recentAssets.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "teacher-dashboard-upload-list" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.dashboard.recentAssets))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (item.id),
            ...{ class: "teacher-dashboard-upload-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "teacher-dashboard-upload-item__main" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (item.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.assetTypeLabel(item.type));
        (item.visibility === 'public' ? '公开素材' : '私密素材');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "teacher-dashboard-upload-item__meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.uploadDate);
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty course-detail-empty--compact" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "teacher-dashboard-panel" },
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
    ...{ class: "teacher-dashboard-action-list" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher/assets');
        } },
    type: "button",
    ...{ class: "auth-btn" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher/preps');
        } },
    type: "button",
    ...{ class: "auth-btn auth-btn--secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher/coursewares');
        } },
    type: "button",
    ...{ class: "auth-btn auth-btn--secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher/profile');
        } },
    type: "button",
    ...{ class: "auth-btn auth-btn--secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-note" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.pendingText);
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "teacher-dashboard-grid teacher-dashboard-grid--bottom" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "teacher-dashboard-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher/preps');
        } },
    type: "button",
    ...{ class: "course-chip course-chip--soft" },
});
if (__VLS_ctx.dashboard?.recentPreps.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "teacher-dashboard-hot-list" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.dashboard.recentPreps))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (item.id),
            ...{ class: "teacher-dashboard-hot-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (item.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.courseName);
        (item.statusLabel);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.updateDate);
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty course-detail-empty--compact" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "teacher-dashboard-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
if (__VLS_ctx.dashboard?.courseCoverage.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "teacher-dashboard-hot-list" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.dashboard.courseCoverage))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (item.id),
            ...{ class: "teacher-dashboard-hot-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (item.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.assetCount);
        (item.prepCount);
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty course-detail-empty--compact" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-weekly" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.dashboard?.weeklyActivity.assetCount ?? 0);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.dashboard?.weeklyActivity.prepCount ?? 0);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.dashboard?.weeklyActivity.publicAssetCount ?? 0);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-status" },
});
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-page']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-sidebar__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-main']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-head']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-head__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-head__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['course-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-metrics']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-metric']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-grid--middle']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-upload-list']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-upload-item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-upload-item__main']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-upload-item__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-action-list']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-note']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-grid--bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-hot-list']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-hot-item']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-hot-list']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-hot-item']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-weekly']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-status']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            TeacherSidebarNav: TeacherSidebarNav,
            router: router,
            dashboard: dashboard,
            errorMessage: errorMessage,
            teacherName: teacherName,
            welcomeText: welcomeText,
            metricCards: metricCards,
            pendingText: pendingText,
            assetTypeLabel: assetTypeLabel,
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
