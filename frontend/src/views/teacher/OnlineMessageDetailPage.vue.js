import { reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import http from '@/services/http';
const route = useRoute();
const router = useRouter();
const errorMessage = ref('');
const submitting = ref(false);
const replyContent = ref('');
const detail = reactive({
    topic: {
        id: 0,
        title: '教学交流主题',
        content: '这里将展示当前主题的正文内容。',
        authorName: '教师用户',
        publishDate: '待更新',
        statusLabel: '讨论中',
    },
    replies: [],
});
async function loadDetail() {
    errorMessage.value = '';
    try {
        const response = await http.get(`/teacher/messages/${route.params.messageId}`);
        const data = response.data.data;
        detail.topic = data.topic;
        detail.replies = data.replies;
    }
    catch (error) {
        detail.replies = [];
        errorMessage.value = error?.response?.data?.message || '讨论详情加载失败';
    }
}
async function submitReply() {
    if (!replyContent.value) {
        errorMessage.value = '请先填写回复内容';
        return;
    }
    submitting.value = true;
    errorMessage.value = '';
    try {
        await http.post(`/teacher/messages/${route.params.messageId}/replies`, {
            content: replyContent.value,
        });
        replyContent.value = '';
        await loadDetail();
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '发布回复失败';
    }
    finally {
        submitting.value = false;
    }
}
watch(() => route.params.messageId, () => {
    loadDetail();
}, { immediate: true });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "message-detail-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "online-message-nav" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "online-message-nav__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.detail.topic.title || '查看交流主题与回复内容');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "online-message-nav__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher/profile');
        } },
    type: "button",
    ...{ class: "course-chip" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher/messages');
        } },
    type: "button",
    ...{ class: "course-chip" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/');
        } },
    type: "button",
    ...{ class: "course-chip course-chip--soft" },
});
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "course-feedback" },
    });
    (__VLS_ctx.errorMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "message-detail-topic" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "message-detail-topic__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
(__VLS_ctx.detail.topic.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.detail.topic.content);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "message-detail-topic__meta" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.detail.topic.authorName);
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.detail.topic.statusLabel);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.detail.topic.publishDate);
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "message-detail-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "online-message-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "online-message-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "online-message-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
if (__VLS_ctx.detail.replies.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "message-detail-list" },
    });
    for (const [reply] of __VLS_getVForSourceType((__VLS_ctx.detail.replies))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (reply.id),
            ...{ class: "message-detail-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (reply.authorName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (reply.content);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (reply.replyTime);
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "online-message-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "online-message-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "online-message-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.submitReply) },
    ...{ class: "online-message-form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "online-message-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.replyContent),
    maxlength: "5000",
    rows: "10",
    placeholder: "请输入你的补充说明、教学建议或资源经验",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "online-message-actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
    ...{ class: "auth-btn" },
    disabled: (__VLS_ctx.submitting),
});
(__VLS_ctx.submitting ? '发布中...' : '发布回复');
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.replyContent = '';
        } },
    type: "button",
    ...{ class: "auth-btn auth-btn--secondary" },
    disabled: (__VLS_ctx.submitting),
});
/** @type {__VLS_StyleScopedClasses['message-detail-page']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-nav__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-nav__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['message-detail-topic']} */ ;
/** @type {__VLS_StyleScopedClasses['message-detail-topic__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['message-detail-topic__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['message-detail-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['message-detail-list']} */ ;
/** @type {__VLS_StyleScopedClasses['message-detail-item']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-form']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-field']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            errorMessage: errorMessage,
            submitting: submitting,
            replyContent: replyContent,
            detail: detail,
            submitReply: submitReply,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
