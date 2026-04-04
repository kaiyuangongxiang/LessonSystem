import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import http from '@/services/http';
const route = useRoute();
const router = useRouter();
const errorMessage = ref('');
const activeVideoUrl = ref('');
const detail = reactive({
    course: {
        id: 0,
        name: '课程详情待接入',
        summary: '课程信息、资料与视频将统一展示在这里。',
        teachingGoal: '后续将根据课程数据展示真实教学目标。',
        teachingContent: '后续将根据课程数据展示真实教学内容。',
        teachingIdea: '后续将根据课程数据展示真实教学思想。',
        collegeName: '系统预留',
        teacherName: '系统预留',
        updateDate: '待更新',
    },
    materials: [],
    videos: [],
});
const detailSubtitle = computed(() => `${detail.course.name} · 课程信息、资料与视频统一展示`);
function materialHref(downloadUrl) {
    if (!downloadUrl) {
        return '#';
    }
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}${downloadUrl}`;
}
function setActiveVideo(playUrl) {
    if (!playUrl) {
        return;
    }
    activeVideoUrl.value = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}${playUrl}`;
}
function formatDuration(duration) {
    if (!duration) {
        return '待更新';
    }
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes} 分 ${seconds.toString().padStart(2, '0')} 秒`;
}
async function loadDetail() {
    errorMessage.value = '';
    activeVideoUrl.value = '';
    try {
        const response = await http.get(`/portal/courses/${route.params.courseId}`);
        const data = response.data.data;
        detail.course = data.course;
        detail.materials = data.materials;
        detail.videos = data.videos;
        if (data.videos.length > 0) {
            setActiveVideo(data.videos[0].playUrl);
        }
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '课程详情加载失败';
        detail.materials = [];
        detail.videos = [];
    }
}
watch(() => route.params.courseId, () => {
    loadDetail();
}, { immediate: true });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "course-detail-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "course-detail-nav" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-detail-nav__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.detailSubtitle);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-detail-nav__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/courses');
        } },
    type: "button",
    ...{ class: "course-chip" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/');
        } },
    type: "button",
    ...{ class: "course-detail-home-btn" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "course-detail-hero" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
(__VLS_ctx.detail.course.name);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-detail-hero__chips" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "course-chip is-active" },
});
(__VLS_ctx.detail.course.collegeName);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "course-chip course-chip--soft" },
});
(__VLS_ctx.detail.course.teacherName);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.detail.course.summary);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-detail-hero__meta" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.detail.course.updateDate);
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "course-feedback" },
    });
    (__VLS_ctx.errorMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "course-detail-info-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "course-detail-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-detail-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.detail.course.teachingGoal);
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "course-detail-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-detail-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.detail.course.teachingContent);
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "course-detail-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-detail-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.detail.course.teachingIdea);
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "course-detail-resource-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "course-detail-table course-detail-table--materials" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-detail-table__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
if (__VLS_ctx.detail.materials.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-list" },
    });
    for (const [material] of __VLS_getVForSourceType((__VLS_ctx.detail.materials))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (material.id),
            ...{ class: "course-detail-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "course-detail-row__main" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (material.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (material.teacherName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "course-detail-row__meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (material.uploadDate);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
            href: (__VLS_ctx.materialHref(material.downloadUrl)),
            target: "_blank",
            rel: "noreferrer",
        });
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "course-detail-table course-detail-table--videos" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-detail-table__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-detail-player" },
});
if (__VLS_ctx.activeVideoUrl) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.video, __VLS_intrinsicElements.video)({
        key: (__VLS_ctx.activeVideoUrl),
        controls: true,
        preload: "metadata",
        src: (__VLS_ctx.activeVideoUrl),
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty" },
    });
}
if (__VLS_ctx.detail.videos.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-list" },
    });
    for (const [video] of __VLS_getVForSourceType((__VLS_ctx.detail.videos))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (video.id),
            ...{ class: "course-detail-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "course-detail-row__main" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (video.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (video.teacherName);
        (__VLS_ctx.formatDuration(video.duration));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "course-detail-row__meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (video.uploadDate);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.detail.videos.length))
                        return;
                    __VLS_ctx.setActiveVideo(video.playUrl);
                } },
            type: "button",
        });
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty course-detail-empty--compact" },
    });
}
/** @type {__VLS_StyleScopedClasses['course-detail-page']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-nav__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-nav__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-home-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-hero']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-hero__chips']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['is-active']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-hero__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['course-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-info-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-resource-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-table']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-table--materials']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-table__head']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-list']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-row']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-row__main']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-row__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-table']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-table--videos']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-table__head']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-player']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-list']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-row']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-row__main']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-row__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            errorMessage: errorMessage,
            activeVideoUrl: activeVideoUrl,
            detail: detail,
            detailSubtitle: detailSubtitle,
            materialHref: materialHref,
            setActiveVideo: setActiveVideo,
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
