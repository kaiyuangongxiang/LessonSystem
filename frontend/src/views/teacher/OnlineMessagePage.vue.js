import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import http from '@/services/http';
import { useAuthStore } from '@/stores/auth';
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const loading = ref(false);
const submitting = ref(false);
const replyingId = ref(null);
const loadingDetailId = ref(null);
const expandedMessageId = ref(null);
const errorMessage = ref('');
const messages = ref([]);
const replyDrafts = reactive({});
const detailMap = reactive({});
const form = reactive({
    title: '',
    content: '',
});
const pagination = reactive({
    page: 1,
    pageSize: 6,
    total: 0,
    totalPages: 0,
});
const headerText = computed(() => {
    const name = authStore.profile?.name || authStore.profile?.username || '教师用户';
    return `${name}，这里用于发布交流主题并继续跟进讨论内容。`;
});
const visibleMessages = computed(() => messages.value);
const currentDetail = computed(() => {
    if (!expandedMessageId.value) {
        return null;
    }
    return detailMap[expandedMessageId.value] || null;
});
const pageNumbers = computed(() => {
    const totalPages = pagination.totalPages || 1;
    return Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5);
});
function normalizePage(value) {
    const page = Number(value);
    return Number.isInteger(page) && page > 0 ? page : 1;
}
function updateRoute(page) {
    router.push({
        path: '/teacher/messages',
        query: {
            page: String(page),
        },
    });
}
function changePage(page) {
    expandedMessageId.value = null;
    updateRoute(page);
}
function resetForm() {
    form.title = '';
    form.content = '';
}
async function loadMessageDetail(messageId) {
    loadingDetailId.value = messageId;
    try {
        const response = await http.get(`/teacher/messages/${messageId}`);
        detailMap[messageId] = response.data.data;
    }
    finally {
        loadingDetailId.value = null;
    }
}
async function toggleDiscussion(messageId) {
    if (expandedMessageId.value === messageId) {
        expandedMessageId.value = null;
        return;
    }
    expandedMessageId.value = messageId;
    if (!detailMap[messageId]) {
        try {
            await loadMessageDetail(messageId);
        }
        catch (error) {
            errorMessage.value = error?.response?.data?.message || '讨论内容加载失败';
        }
    }
}
async function loadMessages() {
    loading.value = true;
    errorMessage.value = '';
    try {
        const response = await http.get('/teacher/messages', {
            params: {
                page: normalizePage(route.query.page),
                pageSize: 6,
            },
        });
        const data = response.data.data;
        messages.value = data.list;
        pagination.page = data.pagination.page;
        pagination.pageSize = data.pagination.pageSize;
        pagination.total = data.pagination.total;
        pagination.totalPages = data.pagination.totalPages;
    }
    catch (error) {
        messages.value = [];
        pagination.page = 1;
        pagination.pageSize = 6;
        pagination.total = 0;
        pagination.totalPages = 0;
        errorMessage.value = error?.response?.data?.message || '教学交流列表加载失败';
    }
    finally {
        loading.value = false;
    }
}
async function submitMessage() {
    if (!form.title || !form.content) {
        errorMessage.value = '请先填写完整的话题标题和内容';
        return;
    }
    submitting.value = true;
    errorMessage.value = '';
    try {
        await http.post('/teacher/messages', {
            title: form.title,
            content: form.content,
        });
        resetForm();
        expandedMessageId.value = null;
        updateRoute(1);
        await loadMessages();
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '发布交流主题失败';
    }
    finally {
        submitting.value = false;
    }
}
async function submitReply(messageId) {
    const content = replyDrafts[messageId]?.trim();
    if (!content) {
        errorMessage.value = '请先填写回复内容';
        return;
    }
    replyingId.value = messageId;
    errorMessage.value = '';
    try {
        await http.post(`/teacher/messages/${messageId}/replies`, {
            content,
        });
        replyDrafts[messageId] = '';
        await Promise.all([loadMessageDetail(messageId), loadMessages()]);
        expandedMessageId.value = messageId;
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '发布回复失败';
    }
    finally {
        replyingId.value = null;
    }
}
watch(() => route.fullPath, () => {
    loadMessages();
}, { immediate: true });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "online-message-page" },
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
(__VLS_ctx.headerText);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "online-message-nav__actions" },
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
    ...{ class: "online-message-hero" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "online-message-hero__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "online-message-hero__meta" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.pagination.total);
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "online-message-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "online-message-panel online-message-panel--form" },
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
    ...{ onSubmit: (__VLS_ctx.submitMessage) },
    ...{ class: "online-message-form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "online-message-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.form.title),
    type: "text",
    maxlength: "100",
    placeholder: "请输入交流主题标题",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "online-message-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.form.content),
    maxlength: "5000",
    rows: "8",
    placeholder: "请输入课程资源、教学问题或备课经验内容",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "online-message-tip" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "online-message-actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
    ...{ class: "auth-btn" },
    disabled: (__VLS_ctx.submitting),
});
(__VLS_ctx.submitting ? '发布中...' : '发布话题');
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.resetForm) },
    type: "button",
    ...{ class: "auth-btn auth-btn--secondary" },
    disabled: (__VLS_ctx.submitting),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "online-message-panel online-message-panel--list" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "online-message-panel__head online-message-panel__head--between" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "online-message-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "online-message-total" },
});
(__VLS_ctx.pagination.total);
if (__VLS_ctx.visibleMessages.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "online-message-list" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.visibleMessages))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (item.id),
            ...{ class: "online-message-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "online-message-item__main" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (item.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (item.summary);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "online-message-item__meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.publishDate);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.statusLabel);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.replyCount);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "online-message-item__actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.visibleMessages.length))
                        return;
                    __VLS_ctx.toggleDiscussion(item.id);
                } },
            type: "button",
            ...{ class: "course-chip" },
        });
        (__VLS_ctx.expandedMessageId === item.id ? '收起讨论' : '展开讨论');
        if (__VLS_ctx.expandedMessageId === item.id) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                ...{ class: "online-message-thread" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "online-message-thread__topic" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (__VLS_ctx.currentDetail?.topic.content || '正在加载主题内容...');
            if (__VLS_ctx.loadingDetailId === item.id) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "course-detail-empty course-detail-empty--compact" },
                });
            }
            else if (__VLS_ctx.currentDetail?.replies?.length) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "message-detail-list" },
                });
                for (const [reply] of __VLS_getVForSourceType((__VLS_ctx.currentDetail.replies))) {
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
                    ...{ class: "course-detail-empty course-detail-empty--compact" },
                });
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
                ...{ onSubmit: (...[$event]) => {
                        if (!(__VLS_ctx.visibleMessages.length))
                            return;
                        if (!(__VLS_ctx.expandedMessageId === item.id))
                            return;
                        __VLS_ctx.submitReply(item.id);
                    } },
                ...{ class: "online-message-form online-message-form--inline" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "online-message-field" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
                value: (__VLS_ctx.replyDrafts[item.id]),
                maxlength: "5000",
                rows: "5",
                placeholder: "请输入你的补充说明、教学建议或资源经验",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "online-message-actions" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                type: "submit",
                ...{ class: "auth-btn" },
                disabled: (__VLS_ctx.replyingId === item.id),
            });
            (__VLS_ctx.replyingId === item.id ? '发布中...' : '发布回复');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.visibleMessages.length))
                            return;
                        if (!(__VLS_ctx.expandedMessageId === item.id))
                            return;
                        __VLS_ctx.replyDrafts[item.id] = '';
                    } },
                type: "button",
                ...{ class: "auth-btn auth-btn--secondary" },
                disabled: (__VLS_ctx.replyingId === item.id),
            });
        }
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "course-pagination online-message-pagination" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-pagination__desc" },
});
(__VLS_ctx.pagination.total);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-pagination__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.changePage(__VLS_ctx.pagination.page - 1);
        } },
    type: "button",
    ...{ class: "course-chip" },
    disabled: (__VLS_ctx.pagination.page <= 1),
});
for (const [pageNumber] of __VLS_getVForSourceType((__VLS_ctx.pageNumbers))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.changePage(pageNumber);
            } },
        key: (pageNumber),
        type: "button",
        ...{ class: (['course-page-btn', pageNumber === __VLS_ctx.pagination.page ? 'is-active' : '']) },
    });
    (pageNumber);
}
/** @type {__VLS_StyleScopedClasses['online-message-page']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-nav__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-nav__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-hero']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-hero__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-hero__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-panel--form']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-form']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-field']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-field']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-tip']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-panel--list']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-panel__head--between']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-total']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-list']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-item']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-item__main']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-item__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-item__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-thread']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-thread__topic']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
/** @type {__VLS_StyleScopedClasses['message-detail-list']} */ ;
/** @type {__VLS_StyleScopedClasses['message-detail-item']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-form']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-form--inline']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-field']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination__desc']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            submitting: submitting,
            replyingId: replyingId,
            loadingDetailId: loadingDetailId,
            expandedMessageId: expandedMessageId,
            errorMessage: errorMessage,
            replyDrafts: replyDrafts,
            form: form,
            pagination: pagination,
            headerText: headerText,
            visibleMessages: visibleMessages,
            currentDetail: currentDetail,
            pageNumbers: pageNumbers,
            changePage: changePage,
            resetForm: resetForm,
            toggleDiscussion: toggleDiscussion,
            submitMessage: submitMessage,
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
