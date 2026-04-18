import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AdminSidebarNav from '@/components/navigation/AdminSidebarNav.vue';
import { createAdminMessage, createAdminMessageReply, deleteAdminMessage, deleteAdminMessageReply, getAdminMessageDetail, getAdminMessageList, } from '@/services/admin';
import { useAuthStore } from '@/stores/auth';
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const loading = ref(false);
const submittingTopic = ref(false);
const showTopicEditor = ref(false);
const replyingId = ref(null);
const deletingTopicId = ref(null);
const deletingReplyId = ref(null);
const loadingDetailId = ref(null);
const expandedMessageId = ref(null);
const errorMessage = ref('');
const successMessage = ref('');
const messageList = ref([]);
const detailMap = reactive({});
const replyDrafts = reactive({});
const replyTargets = reactive({});
const expandedReplyChildren = reactive({});
const form = reactive({
    keyword: '',
});
const topicForm = reactive({
    title: '',
    content: '',
});
const pagination = reactive({
    page: 1,
    pageSize: 4,
    total: 0,
    totalPages: 0,
});
const headerText = computed(() => {
    const name = authStore.profile?.name || authStore.profile?.username || '管理员';
    return `${name}，这里统一维护教师与管理员共同参与的教学交流主题。`;
});
const reminderTexts = computed(() => [
    pagination.total > 0 ? `当前共有 ${pagination.total} 条交流主题待跟进。` : '当前还没有可管理的交流主题。',
    expandedMessageId.value ? '已展开当前主题，可继续评论、楼中回复和删除内容。' : '可展开任意主题查看评论并继续管理。',
]);
const currentDetail = computed(() => {
    if (!expandedMessageId.value) {
        return null;
    }
    return detailMap[expandedMessageId.value] || null;
});
const rootReplies = computed(() => {
    const detail = currentDetail.value;
    if (!detail) {
        return [];
    }
    const replyIdSet = new Set(detail.replies.map((item) => item.id));
    return detail.replies.filter((item) => !item.parentReplyId || !replyIdSet.has(item.parentReplyId));
});
const canCreateTopic = computed(() => currentDetail.value?.capabilities.canCreateTopic ?? true);
function normalizePage(value) {
    const page = Number(value);
    return Number.isInteger(page) && page > 0 ? page : 1;
}
function clearMessages() {
    errorMessage.value = '';
    successMessage.value = '';
}
function syncFormWithRoute() {
    form.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : '';
}
function resetTopicForm() {
    topicForm.title = '';
    topicForm.content = '';
}
function openTopicEditor() {
    clearMessages();
    showTopicEditor.value = true;
}
function closeTopicEditor() {
    showTopicEditor.value = false;
}
function updateRoute(page = 1) {
    router.push({
        path: '/admin/messages',
        query: {
            page: String(page),
            ...(form.keyword ? { keyword: form.keyword } : {}),
        },
    });
}
function applySearch() {
    expandedMessageId.value = null;
    updateRoute(1);
}
function resetFilters() {
    clearMessages();
    form.keyword = '';
    expandedMessageId.value = null;
    updateRoute(1);
}
function changePage(page) {
    expandedMessageId.value = null;
    updateRoute(page);
}
function getChildReplies(replyId) {
    return (currentDetail.value?.replies || []).filter((item) => item.parentReplyId === replyId);
}
function isReplyChildrenExpanded(replyId) {
    return expandedReplyChildren[replyId] !== false;
}
function toggleReplyChildren(replyId) {
    expandedReplyChildren[replyId] = !isReplyChildrenExpanded(replyId);
}
function setReplyTarget(messageId, reply) {
    replyTargets[messageId] = {
        replyId: reply.id,
        authorName: reply.authorName,
    };
}
function clearReplyTarget(messageId) {
    replyTargets[messageId] = {
        replyId: null,
        authorName: '',
    };
}
function clearReplyDraft(messageId) {
    replyDrafts[messageId] = '';
    clearReplyTarget(messageId);
}
async function loadMessageDetail(messageId) {
    loadingDetailId.value = messageId;
    try {
        detailMap[messageId] = await getAdminMessageDetail(messageId);
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
    clearMessages();
    if (!detailMap[messageId]) {
        try {
            await loadMessageDetail(messageId);
        }
        catch (error) {
            errorMessage.value = error?.response?.data?.message || '交流详情加载失败';
        }
    }
}
async function loadMessages() {
    loading.value = true;
    clearMessages();
    syncFormWithRoute();
    try {
        const data = await getAdminMessageList({
            page: normalizePage(route.query.page),
            pageSize: 4,
            keyword: form.keyword,
        });
        messageList.value = data.list;
        pagination.page = data.pagination.page;
        pagination.pageSize = data.pagination.pageSize;
        pagination.total = data.pagination.total;
        pagination.totalPages = data.pagination.totalPages;
    }
    catch (error) {
        messageList.value = [];
        pagination.page = 1;
        pagination.pageSize = 4;
        pagination.total = 0;
        pagination.totalPages = 0;
        errorMessage.value = error?.response?.data?.message || '教学交流管理列表加载失败';
    }
    finally {
        loading.value = false;
    }
}
async function submitTopic() {
    if (!topicForm.title || !topicForm.content) {
        errorMessage.value = '请先填写完整的标题和内容';
        return;
    }
    submittingTopic.value = true;
    clearMessages();
    try {
        await createAdminMessage({
            title: topicForm.title,
            content: topicForm.content,
        });
        resetTopicForm();
        closeTopicEditor();
        successMessage.value = '管理员主题已发布。';
        updateRoute(1);
        await loadMessages();
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '管理员主题发布失败';
    }
    finally {
        submittingTopic.value = false;
    }
}
async function submitReply(messageId) {
    const content = replyDrafts[messageId]?.trim();
    if (!content) {
        errorMessage.value = '请先填写回复内容';
        return;
    }
    replyingId.value = messageId;
    clearMessages();
    try {
        await createAdminMessageReply(messageId, {
            content,
            parentReplyId: replyTargets[messageId]?.replyId || null,
        });
        clearReplyDraft(messageId);
        successMessage.value = '管理员回复已发布。';
        await Promise.all([loadMessageDetail(messageId), loadMessages()]);
        expandedMessageId.value = messageId;
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '管理员回复发布失败';
    }
    finally {
        replyingId.value = null;
    }
}
async function removeTopic(item) {
    clearMessages();
    if (!window.confirm(`确认删除交流主题《${item.title}》吗？`)) {
        return;
    }
    deletingTopicId.value = item.id;
    try {
        await deleteAdminMessage(item.id);
        successMessage.value = `交流主题《${item.title}》已删除。`;
        if (expandedMessageId.value === item.id) {
            expandedMessageId.value = null;
        }
        delete detailMap[item.id];
        await loadMessages();
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '交流主题删除失败';
    }
    finally {
        deletingTopicId.value = null;
    }
}
async function removeReply(messageId, reply) {
    clearMessages();
    if (!window.confirm('确认删除这条回复吗？')) {
        return;
    }
    deletingReplyId.value = reply.id;
    try {
        await deleteAdminMessageReply(messageId, reply.id);
        successMessage.value = '回复已删除。';
        await Promise.all([loadMessageDetail(messageId), loadMessages()]);
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '回复删除失败';
    }
    finally {
        deletingReplyId.value = null;
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
    ...{ class: "admin-manage-page admin-message-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "admin-dashboard-sidebar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-dashboard-sidebar__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
/** @type {[typeof AdminSidebarNav, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(AdminSidebarNav, new AdminSidebarNav({
    active: "messages",
}));
const __VLS_1 = __VLS_0({
    active: "messages",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
if (false) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
        ...{ class: "admin-dashboard-nav" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(false))
                    return;
                __VLS_ctx.router.push('/admin/system');
            } },
        type: "button",
        ...{ class: "admin-dashboard-nav__item admin-dashboard-nav__item--system" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(false))
                    return;
                __VLS_ctx.router.push('/admin');
            } },
        type: "button",
        ...{ class: "admin-dashboard-nav__item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(false))
                    return;
                __VLS_ctx.router.push('/admin/teachers');
            } },
        type: "button",
        ...{ class: "admin-dashboard-nav__item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(false))
                    return;
                __VLS_ctx.router.push('/admin/accounts');
            } },
        type: "button",
        ...{ class: "admin-dashboard-nav__item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(false))
                    return;
                __VLS_ctx.router.push('/admin/colleges');
            } },
        type: "button",
        ...{ class: "admin-dashboard-nav__item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(false))
                    return;
                __VLS_ctx.router.push('/admin/courses');
            } },
        type: "button",
        ...{ class: "admin-dashboard-nav__item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(false))
                    return;
                __VLS_ctx.router.push('/admin/assets');
            } },
        type: "button",
        ...{ class: "admin-dashboard-nav__item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(false))
                    return;
                __VLS_ctx.router.push('/admin/materials');
            } },
        type: "button",
        ...{ class: "admin-dashboard-nav__item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        type: "button",
        ...{ class: "admin-dashboard-nav__item is-active" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "admin-dashboard-reminder-card admin-dashboard-reminder-card--manage" },
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
    ...{ class: "admin-manage-main" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "admin-manage-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-head__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.headerText);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-head__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "course-chip course-chip--soft" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin');
        } },
    type: "button",
    ...{ class: "auth-btn auth-btn--secondary" },
});
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "course-feedback" },
    });
    (__VLS_ctx.errorMessage);
}
if (__VLS_ctx.successMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "feedback-text feedback-text--success admin-manage-feedback" },
    });
    (__VLS_ctx.successMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "admin-manage-filter-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-filter-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-panel__meta" },
});
(__VLS_ctx.pagination.total);
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.applySearch) },
    ...{ class: "admin-manage-filter-form admin-manage-filter-form--message" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "admin-manage-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.form.keyword),
    type: "text",
    maxlength: "100",
    placeholder: "搜索标题、正文或发布人",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-filter-actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.resetFilters) },
    type: "button",
    ...{ class: "auth-btn auth-btn--secondary" },
    disabled: (__VLS_ctx.loading),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
    ...{ class: "auth-btn" },
    disabled: (__VLS_ctx.loading),
});
(__VLS_ctx.loading ? '加载中...' : '搜索主题');
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "admin-manage-panel admin-message-launch-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-head__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-panel__meta" },
});
(__VLS_ctx.canCreateTopic ? '管理员可直接发起教学交流主题。' : '当前数据库结构尚未升级，暂不支持管理员发帖。');
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.openTopicEditor) },
    type: "button",
    ...{ class: "auth-btn" },
    disabled: (!__VLS_ctx.canCreateTopic),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "admin-manage-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-panel__meta" },
});
if (__VLS_ctx.messageList.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-message-list" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.messageList))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (item.id),
            ...{ class: "admin-message-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-message-item__head" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-message-item__main" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (item.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (item.summary);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: (['online-message-role-badge', `is-${item.authorRole}`]) },
        });
        (item.authorRole === 'admin' ? '管理员' : '教师');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-message-item__meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.authorName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.publishDate);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.statusLabel);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.replyCount);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-message-item__actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.messageList.length))
                        return;
                    __VLS_ctx.toggleDiscussion(item.id);
                } },
            type: "button",
            ...{ class: "course-chip course-chip--soft" },
        });
        (__VLS_ctx.expandedMessageId === item.id ? '收起讨论' : '展开讨论');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.messageList.length))
                        return;
                    __VLS_ctx.removeTopic(item);
                } },
            type: "button",
            ...{ class: "course-chip admin-manage-delete-btn" },
            disabled: (__VLS_ctx.deletingTopicId === item.id),
        });
        (__VLS_ctx.deletingTopicId === item.id ? '删除中...' : '删除主题');
        if (__VLS_ctx.expandedMessageId === item.id) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                ...{ class: "admin-message-thread" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "admin-message-thread__topic" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "admin-message-thread__topic-head" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.currentDetail?.topic.title || item.title);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: (['online-message-role-badge', `is-${__VLS_ctx.currentDetail?.topic.authorRole || item.authorRole}`]) },
            });
            ((__VLS_ctx.currentDetail?.topic.authorRole || item.authorRole) === 'admin' ? '管理员' : '教师');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (__VLS_ctx.currentDetail?.topic.content || '正在加载主题内容...');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.currentDetail?.topic.authorName || item.authorName);
            (__VLS_ctx.currentDetail?.topic.publishDate || item.publishDate);
            if (__VLS_ctx.loadingDetailId === item.id) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "course-detail-empty course-detail-empty--compact" },
                });
            }
            else if (__VLS_ctx.currentDetail) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "admin-message-thread__replies" },
                });
                for (const [reply] of __VLS_getVForSourceType((__VLS_ctx.rootReplies))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
                        key: (reply.id),
                        ...{ class: "admin-message-reply-item" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "admin-message-reply-item__head" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                    (reply.authorName);
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                        ...{ class: (['online-message-role-badge', `is-${reply.authorRole}`]) },
                    });
                    (reply.authorRole === 'admin' ? '管理员' : '教师');
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
                    (reply.content);
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    (reply.replyTime);
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "admin-message-item__actions" },
                    });
                    if (__VLS_ctx.currentDetail.capabilities.canReply && __VLS_ctx.currentDetail.capabilities.canReplyToReply) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                            ...{ onClick: (...[$event]) => {
                                    if (!(__VLS_ctx.messageList.length))
                                        return;
                                    if (!(__VLS_ctx.expandedMessageId === item.id))
                                        return;
                                    if (!!(__VLS_ctx.loadingDetailId === item.id))
                                        return;
                                    if (!(__VLS_ctx.currentDetail))
                                        return;
                                    if (!(__VLS_ctx.currentDetail.capabilities.canReply && __VLS_ctx.currentDetail.capabilities.canReplyToReply))
                                        return;
                                    __VLS_ctx.setReplyTarget(item.id, reply);
                                } },
                            type: "button",
                            ...{ class: "course-chip course-chip--soft" },
                        });
                    }
                    if (__VLS_ctx.getChildReplies(reply.id).length) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                            ...{ onClick: (...[$event]) => {
                                    if (!(__VLS_ctx.messageList.length))
                                        return;
                                    if (!(__VLS_ctx.expandedMessageId === item.id))
                                        return;
                                    if (!!(__VLS_ctx.loadingDetailId === item.id))
                                        return;
                                    if (!(__VLS_ctx.currentDetail))
                                        return;
                                    if (!(__VLS_ctx.getChildReplies(reply.id).length))
                                        return;
                                    __VLS_ctx.toggleReplyChildren(reply.id);
                                } },
                            type: "button",
                            ...{ class: "course-chip course-chip--soft" },
                        });
                        (__VLS_ctx.isReplyChildrenExpanded(reply.id) ? '收起回复' : `展开回复 (${__VLS_ctx.getChildReplies(reply.id).length})`);
                    }
                    if (reply.canDelete) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                            ...{ onClick: (...[$event]) => {
                                    if (!(__VLS_ctx.messageList.length))
                                        return;
                                    if (!(__VLS_ctx.expandedMessageId === item.id))
                                        return;
                                    if (!!(__VLS_ctx.loadingDetailId === item.id))
                                        return;
                                    if (!(__VLS_ctx.currentDetail))
                                        return;
                                    if (!(reply.canDelete))
                                        return;
                                    __VLS_ctx.removeReply(item.id, reply);
                                } },
                            type: "button",
                            ...{ class: "course-chip admin-manage-delete-btn" },
                            disabled: (__VLS_ctx.deletingReplyId === reply.id),
                        });
                        (__VLS_ctx.deletingReplyId === reply.id ? '删除中...' : '删除');
                    }
                    if (__VLS_ctx.isReplyChildrenExpanded(reply.id) && __VLS_ctx.getChildReplies(reply.id).length) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                            ...{ class: "admin-message-reply-children" },
                        });
                        for (const [childReply] of __VLS_getVForSourceType((__VLS_ctx.getChildReplies(reply.id)))) {
                            __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
                                key: (childReply.id),
                                ...{ class: "admin-message-reply-item admin-message-reply-item--child" },
                            });
                            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                                ...{ class: "admin-message-reply-item__head" },
                            });
                            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                            (childReply.authorName);
                            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                                ...{ class: (['online-message-role-badge', `is-${childReply.authorRole}`]) },
                            });
                            (childReply.authorRole === 'admin' ? '管理员' : '教师');
                            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
                            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                                ...{ class: "admin-message-reply-item__mention" },
                            });
                            (childReply.parentAuthorName);
                            (childReply.content);
                            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                            (childReply.replyTime);
                            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                                ...{ class: "admin-message-item__actions" },
                            });
                            if (__VLS_ctx.currentDetail.capabilities.canReply && __VLS_ctx.currentDetail.capabilities.canReplyToReply) {
                                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                                    ...{ onClick: (...[$event]) => {
                                            if (!(__VLS_ctx.messageList.length))
                                                return;
                                            if (!(__VLS_ctx.expandedMessageId === item.id))
                                                return;
                                            if (!!(__VLS_ctx.loadingDetailId === item.id))
                                                return;
                                            if (!(__VLS_ctx.currentDetail))
                                                return;
                                            if (!(__VLS_ctx.isReplyChildrenExpanded(reply.id) && __VLS_ctx.getChildReplies(reply.id).length))
                                                return;
                                            if (!(__VLS_ctx.currentDetail.capabilities.canReply && __VLS_ctx.currentDetail.capabilities.canReplyToReply))
                                                return;
                                            __VLS_ctx.setReplyTarget(item.id, childReply);
                                        } },
                                    type: "button",
                                    ...{ class: "course-chip course-chip--soft" },
                                });
                            }
                            if (childReply.canDelete) {
                                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                                    ...{ onClick: (...[$event]) => {
                                            if (!(__VLS_ctx.messageList.length))
                                                return;
                                            if (!(__VLS_ctx.expandedMessageId === item.id))
                                                return;
                                            if (!!(__VLS_ctx.loadingDetailId === item.id))
                                                return;
                                            if (!(__VLS_ctx.currentDetail))
                                                return;
                                            if (!(__VLS_ctx.isReplyChildrenExpanded(reply.id) && __VLS_ctx.getChildReplies(reply.id).length))
                                                return;
                                            if (!(childReply.canDelete))
                                                return;
                                            __VLS_ctx.removeReply(item.id, childReply);
                                        } },
                                    type: "button",
                                    ...{ class: "course-chip admin-manage-delete-btn" },
                                    disabled: (__VLS_ctx.deletingReplyId === childReply.id),
                                });
                                (__VLS_ctx.deletingReplyId === childReply.id ? '删除中...' : '删除');
                            }
                        }
                    }
                }
                if (!__VLS_ctx.rootReplies.length) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "course-detail-empty course-detail-empty--compact" },
                    });
                }
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
                ...{ onSubmit: (...[$event]) => {
                        if (!(__VLS_ctx.messageList.length))
                            return;
                        if (!(__VLS_ctx.expandedMessageId === item.id))
                            return;
                        __VLS_ctx.submitReply(item.id);
                    } },
                ...{ class: "admin-message-form" },
            });
            if (__VLS_ctx.replyTargets[item.id]?.replyId) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "admin-message-reply-target" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (__VLS_ctx.replyTargets[item.id]?.authorName);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.messageList.length))
                                return;
                            if (!(__VLS_ctx.expandedMessageId === item.id))
                                return;
                            if (!(__VLS_ctx.replyTargets[item.id]?.replyId))
                                return;
                            __VLS_ctx.clearReplyTarget(item.id);
                        } },
                    type: "button",
                    ...{ class: "course-chip course-chip--soft" },
                });
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "admin-manage-field admin-manage-field--full" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.replyTargets[item.id]?.replyId ? '楼中回复' : '管理员评论');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
                value: (__VLS_ctx.replyDrafts[item.id]),
                maxlength: "5000",
                rows: "5",
                placeholder: (__VLS_ctx.currentDetail?.capabilities.canReply === false
                    ? '当前数据库尚未升级管理员回复字段，请先执行 SQL'
                    : '请输入处理意见、补充说明或交流回复'),
                disabled: (__VLS_ctx.currentDetail?.capabilities.canReply === false || __VLS_ctx.replyingId === item.id),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "admin-manage-filter-actions" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                type: "submit",
                ...{ class: "auth-btn" },
                disabled: (__VLS_ctx.currentDetail?.capabilities.canReply === false || __VLS_ctx.replyingId === item.id),
            });
            (__VLS_ctx.replyingId === item.id ? '发布中...' : __VLS_ctx.replyTargets[item.id]?.replyId ? '发布回复' : '发布评论');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.messageList.length))
                            return;
                        if (!(__VLS_ctx.expandedMessageId === item.id))
                            return;
                        __VLS_ctx.clearReplyDraft(item.id);
                    } },
                type: "button",
                ...{ class: "auth-btn auth-btn--secondary" },
                disabled: (__VLS_ctx.replyingId === item.id),
            });
        }
    }
}
else if (!__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "admin-manage-pagination" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-pagination__desc" },
});
(__VLS_ctx.pagination.total);
(__VLS_ctx.pagination.page);
(Math.max(__VLS_ctx.pagination.totalPages, 1));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-pagination__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.changePage(__VLS_ctx.pagination.page - 1);
        } },
    type: "button",
    ...{ class: "course-chip course-pagination__nav" },
    disabled: (__VLS_ctx.pagination.page <= 1 || __VLS_ctx.loading),
    'aria-label': "上一页",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "button",
    ...{ class: "admin-manage-page-btn is-active" },
    disabled: (__VLS_ctx.loading),
    'aria-current': "page",
});
(__VLS_ctx.pagination.page);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.changePage(__VLS_ctx.pagination.page + 1);
        } },
    type: "button",
    ...{ class: "course-chip course-pagination__nav" },
    disabled: (__VLS_ctx.pagination.page >= __VLS_ctx.pagination.totalPages || __VLS_ctx.loading),
    'aria-label': "下一页",
});
if (__VLS_ctx.showTopicEditor) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.closeTopicEditor) },
        ...{ class: "admin-course-editor-mask" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "admin-course-editor admin-course-editor--wide online-message-topic-editor" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-course-editor__head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-manage-panel__eyebrow" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.closeTopicEditor) },
        type: "button",
        ...{ class: "course-chip course-chip--soft" },
        disabled: (__VLS_ctx.submittingTopic),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
        ...{ onSubmit: (__VLS_ctx.submitTopic) },
        ...{ class: "admin-course-editor__form admin-message-form" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "admin-manage-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.topicForm.title),
        type: "text",
        maxlength: "100",
        placeholder: "请输入交流主题标题",
        disabled: (!__VLS_ctx.canCreateTopic || __VLS_ctx.submittingTopic),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "admin-manage-field admin-manage-field--full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.topicForm.content),
        maxlength: "5000",
        rows: "8",
        placeholder: "请输入教学安排、交流议题或管理建议",
        disabled: (!__VLS_ctx.canCreateTopic || __VLS_ctx.submittingTopic),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "admin-course-editor__hint online-message-topic-editor__hint" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-course-editor__footer" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-course-editor__actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.resetTopicForm) },
        type: "button",
        ...{ class: "auth-btn auth-btn--secondary" },
        disabled: (__VLS_ctx.submittingTopic),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        type: "submit",
        ...{ class: "auth-btn" },
        disabled: (!__VLS_ctx.canCreateTopic || __VLS_ctx.submittingTopic),
    });
    (__VLS_ctx.submittingTopic ? '发布中...' : '发布主题');
}
/** @type {__VLS_StyleScopedClasses['admin-manage-page']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-page']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-sidebar__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item--system']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['is-active']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-reminder-card']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-reminder-card--manage']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-reminder-card__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-main']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-head__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-head__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['course-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text--success']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-filter-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-filter-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-filter-form']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-filter-form--message']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-filter-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-launch-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-head__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-list']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-item__head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-item__main']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-item__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-item__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-thread']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-thread__topic']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-thread__topic-head']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-thread__replies']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-reply-item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-reply-item__head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-item__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-reply-children']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-reply-item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-reply-item--child']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-reply-item__head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-reply-item__mention']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-item__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-form']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-reply-target']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-filter-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-pagination__desc']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-pagination__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination__nav']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['is-active']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination__nav']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor-mask']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor--wide']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-topic-editor']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor__head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor__form']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-form']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor__hint']} */ ;
/** @type {__VLS_StyleScopedClasses['online-message-topic-editor__hint']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor__footer']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AdminSidebarNav: AdminSidebarNav,
            router: router,
            loading: loading,
            submittingTopic: submittingTopic,
            showTopicEditor: showTopicEditor,
            replyingId: replyingId,
            deletingTopicId: deletingTopicId,
            deletingReplyId: deletingReplyId,
            loadingDetailId: loadingDetailId,
            expandedMessageId: expandedMessageId,
            errorMessage: errorMessage,
            successMessage: successMessage,
            messageList: messageList,
            replyDrafts: replyDrafts,
            replyTargets: replyTargets,
            form: form,
            topicForm: topicForm,
            pagination: pagination,
            headerText: headerText,
            reminderTexts: reminderTexts,
            currentDetail: currentDetail,
            rootReplies: rootReplies,
            canCreateTopic: canCreateTopic,
            resetTopicForm: resetTopicForm,
            openTopicEditor: openTopicEditor,
            closeTopicEditor: closeTopicEditor,
            applySearch: applySearch,
            resetFilters: resetFilters,
            changePage: changePage,
            getChildReplies: getChildReplies,
            isReplyChildrenExpanded: isReplyChildrenExpanded,
            toggleReplyChildren: toggleReplyChildren,
            setReplyTarget: setReplyTarget,
            clearReplyTarget: clearReplyTarget,
            clearReplyDraft: clearReplyDraft,
            toggleDiscussion: toggleDiscussion,
            submitTopic: submitTopic,
            submitReply: submitReply,
            removeTopic: removeTopic,
            removeReply: removeReply,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
