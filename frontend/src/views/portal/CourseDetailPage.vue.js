import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PortalTopNav from '@/components/navigation/PortalTopNav.vue';
import http from '@/services/http';
const route = useRoute();
const router = useRouter();
const errorMessage = ref('');
const expandedPrepId = ref(null);
const previewVisible = ref(false);
const previewLoading = ref(false);
const previewError = ref('');
const previewAttachment = ref(null);
const previewObjectUrl = ref('');
const previewTextContent = ref('');
const previewMode = ref('frame');
const detail = reactive({
    course: {
        id: 0,
        name: '课程详情待接入',
        summary: '课程信息、资料与视频将统一展示在这里。',
        collegeName: '系统预留',
        teacherName: '系统预留',
        updateDate: '待更新',
    },
    materials: [],
    videos: [],
    preps: [],
});
const detailSubtitle = computed(() => `${detail.course.name} · 课程信息、资料与视频统一展示`);
function materialHref(downloadUrl) {
    if (!downloadUrl) {
        return '#';
    }
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}${downloadUrl}`;
}
function inferMimeTypeFromFileName(fileName, fallbackType) {
    const extension = (fileName.split('.').pop() || '').toLowerCase();
    const mimeMap = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        bmp: 'image/bmp',
        svg: 'image/svg+xml',
        mp4: 'video/mp4',
        webm: 'video/webm',
        ogg: 'video/ogg',
        mov: 'video/quicktime',
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        m4a: 'audio/mp4',
        aac: 'audio/aac',
        flac: 'audio/flac',
        txt: 'text/plain;charset=utf-8',
        md: 'text/markdown;charset=utf-8',
        json: 'application/json;charset=utf-8',
        pdf: 'application/pdf',
    };
    if (mimeMap[extension]) {
        return mimeMap[extension];
    }
    if (fallbackType === 'image') {
        return 'image/jpeg';
    }
    if (fallbackType === 'video') {
        return 'video/mp4';
    }
    if (fallbackType === 'audio') {
        return 'audio/mpeg';
    }
    if (fallbackType === 'text') {
        return 'text/plain;charset=utf-8';
    }
    return 'application/octet-stream';
}
function normalizeMimeType(value) {
    return value.split(';')[0]?.trim().toLowerCase() || '';
}
function resolvePreviewMode(attachment, mimeType) {
    const normalizedMimeType = normalizeMimeType(mimeType);
    const extension = (attachment.fileName.split('.').pop() || '').toLowerCase();
    if (normalizedMimeType.startsWith('image/')) {
        return 'image';
    }
    if (normalizedMimeType.startsWith('video/')) {
        return 'video';
    }
    if (normalizedMimeType.startsWith('audio/')) {
        return 'audio';
    }
    if (normalizedMimeType.startsWith('text/') ||
        normalizedMimeType === 'application/json' ||
        normalizedMimeType === 'application/xml') {
        return 'text';
    }
    if (normalizedMimeType === 'application/pdf') {
        return 'frame';
    }
    if (['txt', 'md', 'json', 'xml', 'csv'].includes(extension)) {
        return 'text';
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
        return 'image';
    }
    if (['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(extension)) {
        return 'video';
    }
    if (['mp3', 'wav', 'm4a', 'aac', 'flac', 'oga'].includes(extension)) {
        return 'audio';
    }
    if (attachment.type === 'image') {
        return 'image';
    }
    if (attachment.type === 'video') {
        return 'video';
    }
    if (attachment.type === 'audio') {
        return 'audio';
    }
    if (attachment.type === 'text') {
        return 'text';
    }
    return 'frame';
}
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
function togglePrep(prepId) {
    expandedPrepId.value = expandedPrepId.value === prepId ? null : prepId;
}
function resetPreviewResource() {
    if (previewObjectUrl.value) {
        URL.revokeObjectURL(previewObjectUrl.value);
        previewObjectUrl.value = '';
    }
    previewTextContent.value = '';
}
function closeAttachmentPreview() {
    previewVisible.value = false;
    previewLoading.value = false;
    previewError.value = '';
    previewAttachment.value = null;
    previewMode.value = 'frame';
    resetPreviewResource();
}
async function openAttachmentPreview(attachment) {
    previewVisible.value = true;
    previewLoading.value = true;
    previewError.value = '';
    previewAttachment.value = attachment;
    previewMode.value = 'frame';
    resetPreviewResource();
    try {
        const response = await http.get(attachment.previewUrl, {
            responseType: 'blob',
        });
        if (!response.data) {
            throw new Error('预览文件获取失败');
        }
        const responseMimeType = normalizeMimeType(String(response.headers['content-type'] || ''));
        const sourceBlob = response.data;
        const blobMimeType = normalizeMimeType(sourceBlob.type || '');
        const fallbackMimeType = inferMimeTypeFromFileName(attachment.fileName, attachment.type);
        const resolvedMimeType = responseMimeType || blobMimeType || fallbackMimeType;
        const resolvedPreviewMode = resolvePreviewMode(attachment, resolvedMimeType);
        const normalizedBlob = new Blob([sourceBlob], {
            type: resolvedMimeType || fallbackMimeType,
        });
        previewMode.value = resolvedPreviewMode;
        if (resolvedPreviewMode === 'text') {
            previewTextContent.value = await normalizedBlob.text();
        }
        else {
            previewObjectUrl.value = URL.createObjectURL(normalizedBlob);
        }
    }
    catch (error) {
        previewError.value = error instanceof Error ? error.message : '当前资料暂时无法在线预览';
    }
    finally {
        previewLoading.value = false;
    }
}
async function loadDetail() {
    errorMessage.value = '';
    expandedPrepId.value = null;
    try {
        const response = await http.get(`/portal/courses/${route.params.courseId}`);
        const data = response.data.data;
        detail.course = data.course;
        detail.materials = data.materials;
        detail.videos = data.videos;
        detail.preps = data.preps;
        if (data.preps.length > 0) {
            expandedPrepId.value = data.preps[0].id;
        }
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '课程详情加载失败';
        detail.materials = [];
        detail.videos = [];
        detail.preps = [];
    }
}
watch(() => route.params.courseId, () => {
    loadDetail();
}, { immediate: true });
onBeforeUnmount(() => {
    resetPreviewResource();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "course-detail-page" },
});
/** @type {[typeof PortalTopNav, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PortalTopNav, new PortalTopNav({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
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
(__VLS_ctx.detail.course.summary);
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "course-detail-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-detail-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.detail.materials.length);
(__VLS_ctx.detail.videos.length);
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "course-detail-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-detail-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.detail.course.collegeName);
(__VLS_ctx.detail.course.teacherName);
(__VLS_ctx.detail.course.updateDate);
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "course-detail-prep-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-detail-table__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-detail-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "course-detail-prep-panel__meta" },
});
(__VLS_ctx.detail.preps.length);
if (__VLS_ctx.detail.preps.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-prep-list" },
    });
    for (const [prep] of __VLS_getVForSourceType((__VLS_ctx.detail.preps))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (prep.id),
            ...{ class: "course-detail-prep-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "course-detail-prep-card__head" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (prep.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (prep.teacherName);
        (prep.updateTime);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.detail.preps.length))
                        return;
                    __VLS_ctx.togglePrep(prep.id);
                } },
            type: "button",
            ...{ class: "course-chip course-chip--soft" },
        });
        (__VLS_ctx.expandedPrepId === prep.id ? '收起资料' : `查看资料 ${prep.attachmentCount}`);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "course-detail-prep-card__summary" },
        });
        (prep.teachingContent || '当前备课单暂无教学内容摘要。');
        if (__VLS_ctx.expandedPrepId === prep.id) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "course-detail-prep-card__body" },
            });
            if (prep.attachments.length) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "course-detail-prep-attachment-list" },
                });
                for (const [attachment] of __VLS_getVForSourceType((prep.attachments))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        key: (attachment.id),
                        ...{ class: "course-detail-prep-attachment" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                    (attachment.title);
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
                    (attachment.sourceLabel);
                    (__VLS_ctx.assetTypeLabel(attachment.type));
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "course-detail-row__meta" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    (attachment.uploadTime);
                    if (attachment.previewUrl) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                            ...{ onClick: (...[$event]) => {
                                    if (!(__VLS_ctx.detail.preps.length))
                                        return;
                                    if (!(__VLS_ctx.expandedPrepId === prep.id))
                                        return;
                                    if (!(prep.attachments.length))
                                        return;
                                    if (!(attachment.previewUrl))
                                        return;
                                    __VLS_ctx.openAttachmentPreview(attachment);
                                } },
                            type: "button",
                        });
                    }
                    if (attachment.downloadUrl) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
                            href: (__VLS_ctx.materialHref(attachment.downloadUrl)),
                            target: "_blank",
                            rel: "noreferrer",
                        });
                    }
                }
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "course-detail-empty course-detail-empty--compact" },
                });
            }
        }
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty" },
    });
}
if (__VLS_ctx.previewVisible) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.closeAttachmentPreview) },
        ...{ class: "course-detail-preview-mask" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "course-detail-preview-dialog" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-preview-dialog__head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-panel__eyebrow" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    (__VLS_ctx.previewAttachment?.title || '资料预览');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.previewAttachment ? `${__VLS_ctx.previewAttachment.sourceLabel} · ${__VLS_ctx.assetTypeLabel(__VLS_ctx.previewAttachment.type)}` : '正在准备预览内容');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.closeAttachmentPreview) },
        type: "button",
        ...{ class: "course-chip course-chip--soft" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-preview-dialog__body" },
    });
    if (__VLS_ctx.previewLoading) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "course-detail-empty course-detail-empty--compact" },
        });
    }
    else if (__VLS_ctx.previewError) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "course-detail-empty course-detail-empty--compact" },
        });
        (__VLS_ctx.previewError);
    }
    else if (__VLS_ctx.previewMode === 'image' && __VLS_ctx.previewObjectUrl) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            ...{ class: "course-detail-preview-media" },
            src: (__VLS_ctx.previewObjectUrl),
            alt: (__VLS_ctx.previewAttachment?.title || '图片预览'),
        });
    }
    else if (__VLS_ctx.previewMode === 'video' && __VLS_ctx.previewObjectUrl) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.video, __VLS_intrinsicElements.video)({
            ...{ class: "course-detail-preview-media" },
            src: (__VLS_ctx.previewObjectUrl),
            controls: true,
            preload: "metadata",
        });
    }
    else if (__VLS_ctx.previewMode === 'audio' && __VLS_ctx.previewObjectUrl) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.audio, __VLS_intrinsicElements.audio)({
            ...{ class: "course-detail-preview-audio" },
            src: (__VLS_ctx.previewObjectUrl),
            controls: true,
            preload: "metadata",
        });
    }
    else if (__VLS_ctx.previewMode === 'text') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
            ...{ class: "course-detail-preview-text" },
        });
        (__VLS_ctx.previewTextContent);
    }
    else if (__VLS_ctx.previewObjectUrl) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.iframe, __VLS_intrinsicElements.iframe)({
            ...{ class: "course-detail-preview-frame" },
            src: (__VLS_ctx.previewObjectUrl),
            title: "资料预览",
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-preview-dialog__actions" },
    });
    if (__VLS_ctx.previewAttachment?.downloadUrl) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
            ...{ class: "course-detail-home-btn" },
            href: (__VLS_ctx.materialHref(__VLS_ctx.previewAttachment.downloadUrl)),
            target: "_blank",
            rel: "noreferrer",
        });
    }
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
/** @type {__VLS_StyleScopedClasses['course-detail-prep-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-table__head']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-prep-panel__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-prep-list']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-prep-card']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-prep-card__head']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-prep-card__summary']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-prep-card__body']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-prep-attachment-list']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-prep-attachment']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-row__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-preview-mask']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-preview-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-preview-dialog__head']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-preview-dialog__body']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-preview-media']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-preview-media']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-preview-audio']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-preview-text']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-preview-frame']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-preview-dialog__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-home-btn']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PortalTopNav: PortalTopNav,
            router: router,
            errorMessage: errorMessage,
            expandedPrepId: expandedPrepId,
            previewVisible: previewVisible,
            previewLoading: previewLoading,
            previewError: previewError,
            previewAttachment: previewAttachment,
            previewObjectUrl: previewObjectUrl,
            previewTextContent: previewTextContent,
            previewMode: previewMode,
            detail: detail,
            detailSubtitle: detailSubtitle,
            materialHref: materialHref,
            assetTypeLabel: assetTypeLabel,
            togglePrep: togglePrep,
            closeAttachmentPreview: closeAttachmentPreview,
            openAttachmentPreview: openAttachmentPreview,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
