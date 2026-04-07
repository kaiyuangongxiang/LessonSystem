import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import PortalTopNav from '@/components/navigation/PortalTopNav.vue';
import http from '@/services/http';
import { useAuthStore } from '@/stores/auth';
const DEFAULT_HERO_TITLE = '让课程、资料与视频在一个入口里协同';
const router = useRouter();
const authStore = useAuthStore();
const searchKeyword = ref('');
const errorMessage = ref('');
const noticeSectionRef = ref(null);
const courseSectionRef = ref(null);
const resourceSectionRef = ref(null);
const home = reactive({
    profile: {
        heroTitle: DEFAULT_HERO_TITLE,
        systemName: '在线教师备课系统',
        systemIntro: '围绕课程、资料与视频的统一备课平台，帮助教师快速进入课程浏览与资源查看主链路。',
    },
    notices: [],
    courses: [],
    materials: [],
    videos: [],
    stats: {
        courseCount: 0,
        materialCount: 0,
        videoCount: 0,
    },
});
const heroTitleText = computed(() => home.profile.heroTitle || DEFAULT_HERO_TITLE);
const activeNoticeIndex = ref(0);
const activeNotice = computed(() => visibleNotices.value[activeNoticeIndex.value] || visibleNotices.value[0]);
let noticeRotationTimer;
const primaryActionText = computed(() => {
    if (!authStore.isAuthenticated) {
        return '登录 / 注册';
    }
    return authStore.role === 'admin' ? '管理员中心' : '进入教师中心';
});
const visibleNotices = computed(() => {
    if (!home.notices.length) {
        return [
            {
                id: 0,
                title: '公告待维护',
                content: '当前暂无已发布公告，后续可由管理员在后台维护公告内容。',
                publishDate: '待更新',
            },
        ];
    }
    return home.notices;
});
function stopNoticeRotation() {
    if (noticeRotationTimer !== undefined) {
        window.clearInterval(noticeRotationTimer);
        noticeRotationTimer = undefined;
    }
}
function startNoticeRotation() {
    stopNoticeRotation();
    if (visibleNotices.value.length <= 1) {
        return;
    }
    noticeRotationTimer = window.setInterval(() => {
        activeNoticeIndex.value = (activeNoticeIndex.value + 1) % visibleNotices.value.length;
    }, 4500);
}
function pauseNoticeRotation() {
    stopNoticeRotation();
}
function resumeNoticeRotation() {
    startNoticeRotation();
}
function setActiveNotice(index) {
    activeNoticeIndex.value = index;
    startNoticeRotation();
}
const visibleCourses = computed(() => {
    if (!home.courses.length) {
        return [
            { id: 0, name: '课程内容待补充', summary: '课程上线后将在这里展示推荐课程与简介。', teacherName: '系统预留' },
            { id: 1, name: '教学案例待接入', summary: '后续将展示课程简介、资料类型与视频概览。', teacherName: '系统预留' },
            { id: 2, name: '备课专题待更新', summary: '课程中心完成后可从此进入完整课程浏览链路。', teacherName: '系统预留' },
        ];
    }
    return home.courses;
});
const visibleMaterials = computed(() => {
    if (!home.materials.length) {
        return [
            { id: 0, name: '资料列表待接入', courseName: '课程关联信息待补充', teacherName: '系统预留', uploadDate: '待更新' },
            { id: 1, name: '下载资源待更新', courseName: '后续展示最新上传资料', teacherName: '系统预留', uploadDate: '待更新' },
            { id: 2, name: '讲义与导学案待更新', courseName: '支持课程维度聚合', teacherName: '系统预留', uploadDate: '待更新' },
        ];
    }
    return home.materials;
});
const visibleVideos = computed(() => {
    if (!home.videos.length) {
        return [
            { id: 0, title: '视频内容待接入', courseName: '课程视频将在此展示', teacherName: '系统预留', duration: null, uploadDate: '待更新' },
            { id: 1, title: '微课资源待更新', courseName: '后续支持在线播放', teacherName: '系统预留', duration: null, uploadDate: '待更新' },
            { id: 2, title: '教学演示待更新', courseName: '配合课程详情统一承接', teacherName: '系统预留', duration: null, uploadDate: '待更新' },
        ];
    }
    return home.videos;
});
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
function scrollToSection(section) {
    if (section === 'resources') {
        void router.push('/assets');
        return;
    }
    const target = section === 'notices'
        ? noticeSectionRef.value
        : courseSectionRef.value;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function goCourseListWithKeyword() {
    router.push({
        path: '/courses',
        query: {
            keyword: searchKeyword.value || undefined,
        },
    });
}
function goCourseDetail(courseId) {
    if (!courseId) {
        router.push('/courses');
        return;
    }
    router.push(`/courses/${courseId}`);
}
function goPrimaryAction() {
    if (!authStore.isAuthenticated) {
        router.push({ path: '/login', query: { role: 'teacher' } });
        return;
    }
    router.push(authStore.role === 'admin' ? '/admin' : '/teacher');
}
function goTeachingMessages() {
    if (!authStore.isAuthenticated) {
        router.push({ path: '/login', query: { role: 'teacher' } });
        return;
    }
    if (authStore.role === 'teacher') {
        router.push('/teacher/messages');
        return;
    }
    router.push('/admin/messages');
}
function formatDuration(duration) {
    if (!duration) {
        return '待更新';
    }
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes} 分 ${seconds.toString().padStart(2, '0')} 秒`;
}
async function loadHome() {
    try {
        const response = await http.get('/portal/home');
        const data = response.data.data;
        home.profile = {
            ...home.profile,
            ...data.profile,
            heroTitle: data?.profile?.heroTitle || DEFAULT_HERO_TITLE,
        };
        home.notices = data.notices;
        home.courses = data.courses;
        home.materials = data.materials;
        home.videos = data.videos;
        home.stats = data.stats;
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '首页数据加载失败，当前展示默认内容';
    }
}
onMounted(() => {
    loadHome();
});
onBeforeUnmount(() => {
    stopNoticeRotation();
});
watch(visibleNotices, (list) => {
    if (!list.length) {
        activeNoticeIndex.value = 0;
        stopNoticeRotation();
        return;
    }
    if (activeNoticeIndex.value >= list.length) {
        activeNoticeIndex.value = 0;
    }
    startNoticeRotation();
}, { immediate: true });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "portal-home" },
});
/** @type {[typeof PortalTopNav, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PortalTopNav, new PortalTopNav({
    systemName: (__VLS_ctx.home.profile.systemName),
}));
const __VLS_1 = __VLS_0({
    systemName: (__VLS_ctx.home.profile.systemName),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "portal-hero" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "portal-hero__content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
(__VLS_ctx.heroTitleText);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.home.profile.systemIntro);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "portal-hero__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/courses');
        } },
    ...{ class: "portal-hero__btn" },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.goTeachingMessages) },
    ...{ class: "portal-hero__btn portal-hero__btn--ghost" },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "portal-stat-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "portal-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.home.stats.courseCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "portal-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.home.stats.materialCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "portal-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.home.stats.videoCount);
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "portal-feedback" },
    });
    (__VLS_ctx.errorMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "portal-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ref: "noticeSectionRef",
    ...{ class: "portal-panel portal-panel--notice" },
});
/** @type {typeof __VLS_ctx.noticeSectionRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "portal-section-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "portal-section-head__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onMouseenter: (__VLS_ctx.pauseNoticeRotation) },
    ...{ onMouseleave: (__VLS_ctx.resumeNoticeRotation) },
    ...{ class: "portal-notice-board" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "portal-notice-board__window" },
});
const __VLS_3 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
    name: "portal-notice-slide",
    mode: "out-in",
}));
const __VLS_5 = __VLS_4({
    name: "portal-notice-slide",
    mode: "out-in",
}, ...__VLS_functionalComponentArgsRest(__VLS_4));
__VLS_6.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    key: (`${__VLS_ctx.activeNotice.id}-${__VLS_ctx.activeNoticeIndex}`),
    ...{ class: "portal-notice-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "portal-notice-card__meta" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "portal-notice-card__date" },
});
(__VLS_ctx.activeNotice.publishDate);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "portal-notice-card__badge" },
});
(__VLS_ctx.visibleNotices.length > 1 ? `${__VLS_ctx.activeNoticeIndex + 1} / ${__VLS_ctx.visibleNotices.length}` : '当前公告');
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.activeNotice.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.activeNotice.content);
var __VLS_6;
if (__VLS_ctx.visibleNotices.length > 1) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "portal-notice-board__dots" },
    });
    for (const [notice, index] of __VLS_getVForSourceType((__VLS_ctx.visibleNotices))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.visibleNotices.length > 1))
                        return;
                    __VLS_ctx.setActiveNotice(index);
                } },
            key: (notice.id),
            type: "button",
            ...{ class: (['portal-notice-board__dot', { 'is-active': index === __VLS_ctx.activeNoticeIndex }]) },
            'aria-label': (`切换到公告 ${index + 1}`),
        });
    }
}
if (__VLS_ctx.visibleNotices.length > 1) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
        ...{ class: "portal-notice-ticker" },
    });
    for (const [notice, index] of __VLS_getVForSourceType((__VLS_ctx.visibleNotices))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
            key: (`${notice.id}-ticker`),
            ...{ class: ({ 'is-active': index === __VLS_ctx.activeNoticeIndex }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.visibleNotices.length > 1))
                        return;
                    __VLS_ctx.setActiveNotice(index);
                } },
            type: "button",
            ...{ class: "portal-notice-ticker__item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (notice.publishDate);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (notice.title);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ref: "courseSectionRef",
    ...{ class: "portal-panel portal-panel--courses" },
});
/** @type {typeof __VLS_ctx.courseSectionRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "portal-section-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "portal-section-head__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/courses');
        } },
    ...{ class: "portal-section-head__link" },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "portal-course-grid" },
});
for (const [course] of __VLS_getVForSourceType((__VLS_ctx.visibleCourses))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.goCourseDetail(course.id);
            } },
        key: (course.id),
        ...{ class: "portal-course-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "portal-course-card__tag" },
    });
    (course.teacherName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    (course.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (course.summary);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.goCourseDetail(course.id);
            } },
        type: "button",
        ...{ class: "portal-course-card__btn" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ref: "resourceSectionRef",
    ...{ class: "portal-grid portal-grid--bottom" },
});
/** @type {typeof __VLS_ctx.resourceSectionRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "portal-panel portal-panel--materials" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "portal-section-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "portal-section-head__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
    ...{ class: "portal-resource-list" },
});
for (const [material] of __VLS_getVForSourceType((__VLS_ctx.visibleMaterials))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
        key: (material.id),
        ...{ class: "portal-resource-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (material.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (material.courseName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "portal-resource-row__meta" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (material.teacherName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (material.uploadDate);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "portal-panel portal-panel--videos" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "portal-section-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "portal-section-head__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "portal-video-grid" },
});
for (const [video] of __VLS_getVForSourceType((__VLS_ctx.visibleVideos))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        key: (video.id),
        ...{ class: "portal-video-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "portal-video-card__cover" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (video.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (video.courseName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.formatDuration(video.duration));
    (video.teacherName);
}
/** @type {__VLS_StyleScopedClasses['portal-home']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-hero']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-hero__content']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-hero__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-hero__btn']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-hero__btn']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-hero__btn--ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-stat-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-panel--notice']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-section-head']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-section-head__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-notice-board']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-notice-board__window']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-notice-card']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-notice-card__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-notice-card__date']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-notice-card__badge']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-notice-board__dots']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-notice-ticker']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-notice-ticker__item']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-panel--courses']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-section-head']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-section-head__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-section-head__link']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-course-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-course-card']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-course-card__tag']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-course-card__btn']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-grid--bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-panel--materials']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-section-head']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-section-head__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-resource-list']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-resource-row']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-resource-row__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-panel--videos']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-section-head']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-section-head__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-video-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-video-card']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-video-card__cover']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PortalTopNav: PortalTopNav,
            router: router,
            errorMessage: errorMessage,
            noticeSectionRef: noticeSectionRef,
            courseSectionRef: courseSectionRef,
            resourceSectionRef: resourceSectionRef,
            home: home,
            heroTitleText: heroTitleText,
            activeNoticeIndex: activeNoticeIndex,
            activeNotice: activeNotice,
            visibleNotices: visibleNotices,
            pauseNoticeRotation: pauseNoticeRotation,
            resumeNoticeRotation: resumeNoticeRotation,
            setActiveNotice: setActiveNotice,
            visibleCourses: visibleCourses,
            visibleMaterials: visibleMaterials,
            visibleVideos: visibleVideos,
            goCourseDetail: goCourseDetail,
            goTeachingMessages: goTeachingMessages,
            formatDuration: formatDuration,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
