import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createTeacherMessage, createTeacherMessageReply, deleteTeacherMessage, deleteTeacherMessageReply, getTeacherMessageDetail, getTeacherMessageList, } from '@/services/teacher';
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
    pageSize: 6,
    total: 0,
    totalPages: 0,
});
const teacherName = computed(() => authStore.profile?.name || authStore.profile?.username || '教师用户');
const headerText = computed(() => `${teacherName.value}，这里用于浏览交流话题、发布评论，并持续跟进教学讨论。`);
const pageSummary = computed(() => {
    if (form.keyword) {
        return `当前正在筛选与“${form.keyword}”相关的话题内容。`;
    }
    return '围绕课程资源、课堂问题与教学经验进行有组织的交流，让后续协作更容易追踪与沉淀。';
});
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
const totalReplyCount = computed(() => messageList.value.reduce((sum, item) => sum + item.replyCount, 0));
const teacherTopicCount = computed(() => messageList.value.filter((item) => item.authorRole === 'teacher').length);
const adminTopicCount = computed(() => messageList.value.filter((item) => item.authorRole === 'admin').length);
const heroMetrics = computed(() => [
    { label: '全部主题', value: String(pagination.total).padStart(2, '0'), note: '系统内当前可浏览的讨论主题数' },
    { label: '本页回复', value: String(totalReplyCount.value).padStart(2, '0'), note: '当前页主题累计产生的回复数' },
    { label: '教师发起', value: String(teacherTopicCount.value).padStart(2, '0'), note: '本页由教师发布的主题数量' },
    { label: '管理员发起', value: String(adminTopicCount.value).padStart(2, '0'), note: '本页由管理员发起的协同话题' },
]);
const boardSummary = computed(() => {
    if (expandedMessageId.value) {
        return '已展开当前主题详情，你可以继续查看楼中回复，或在底部直接补充反馈。';
    }
    return '点击任意主题卡片即可展开完整讨论内容，查看主贴、回复与楼中交流。';
});
const pageNumbers = computed(() => {
    const totalPages = Math.max(pagination.totalPages || 1, 1);
    const start = Math.max(1, Math.min(pagination.page - 2, Math.max(totalPages - 4, 1)));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
});
function getRoleLabel(role) {
    return role === 'admin' ? '管理员' : '教师';
}
function formatTopicNumber(index) {
    return String((pagination.page - 1) * pagination.pageSize + index + 1).padStart(2, '0');
}
function normalizePage(value) {
    const page = Number(value);
    return Number.isInteger(page) && page > 0 ? page : 1;
}
function clearMessages() {
    errorMessage.value = '';
    successMessage.value = '';
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
function syncFormWithRoute() {
    form.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : '';
}
function updateRoute(page = 1) {
    router.push({
        path: '/teacher/messages',
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
        detailMap[messageId] = await getTeacherMessageDetail(messageId);
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
    clearMessages();
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
    clearMessages();
    syncFormWithRoute();
    try {
        const data = await getTeacherMessageList({
            page: normalizePage(route.query.page),
            pageSize: 6,
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
        pagination.pageSize = 6;
        pagination.total = 0;
        pagination.totalPages = 0;
        errorMessage.value = error?.response?.data?.message || '教学交流列表加载失败';
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
        await createTeacherMessage({
            title: topicForm.title,
            content: topicForm.content,
        });
        resetTopicForm();
        closeTopicEditor();
        expandedMessageId.value = null;
        successMessage.value = '交流主题已发布。';
        updateRoute(1);
        await loadMessages();
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '发布交流主题失败';
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
        await createTeacherMessageReply(messageId, {
            content,
            parentReplyId: replyTargets[messageId]?.replyId || null,
        });
        clearReplyDraft(messageId);
        successMessage.value = '回复已发布。';
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
async function removeTopic(item) {
    clearMessages();
    if (!window.confirm(`确认删除交流主题《${item.title}》吗？`)) {
        return;
    }
    deletingTopicId.value = item.id;
    try {
        await deleteTeacherMessage(item.id);
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
        await deleteTeacherMessageReply(messageId, reply.id);
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
    ...{ class: "teacher-message-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-message-page__ambient" },
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "teacher-message-page__orb teacher-message-page__orb--one" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "teacher-message-page__orb teacher-message-page__orb--two" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "teacher-message-page__mesh" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "teacher-message-hero" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "teacher-message-hero__intro" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-message-kicker" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "teacher-message-hero__lead" },
});
(__VLS_ctx.headerText);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "teacher-message-hero__desc" },
});
(__VLS_ctx.pageSummary);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-message-hero__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher');
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "teacher-message-hero__spotlight" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-message-kicker teacher-message-kicker--light" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.openTopicEditor) },
    type: "button",
    ...{ class: "auth-btn" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "teacher-message-hero__spotlight-note" },
});
(__VLS_ctx.pagination.total);
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "teacher-message-metrics" },
});
for (const [metric] of __VLS_getVForSourceType((__VLS_ctx.heroMetrics))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        key: (metric.label),
        ...{ class: "teacher-message-metric" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (metric.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (metric.value);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (metric.note);
}
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "course-feedback teacher-message-feedback teacher-message-feedback--error" },
    });
    (__VLS_ctx.errorMessage);
}
if (__VLS_ctx.successMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "feedback-text feedback-text--success teacher-message-feedback teacher-message-feedback--success" },
    });
    (__VLS_ctx.successMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "teacher-message-board" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-message-board__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-message-kicker" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.boardSummary);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-message-board__meta" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.pagination.page);
(Math.max(__VLS_ctx.pagination.totalPages, 1));
if (__VLS_ctx.form.keyword) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.form.keyword);
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.applySearch) },
    ...{ class: "teacher-message-search" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "teacher-message-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.form.keyword),
    type: "text",
    maxlength: "100",
    placeholder: "搜索标题、正文内容或发布人",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-message-search__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
    ...{ class: "auth-btn" },
    disabled: (__VLS_ctx.loading),
});
(__VLS_ctx.loading ? '加载中...' : '搜索主题');
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.resetFilters) },
    type: "button",
    ...{ class: "auth-btn auth-btn--secondary" },
    disabled: (__VLS_ctx.loading),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "teacher-message-search__hint" },
});
if (__VLS_ctx.messageList.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "teacher-message-list" },
    });
    for (const [item, index] of __VLS_getVForSourceType((__VLS_ctx.messageList))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (item.id),
            ...{ class: (['teacher-message-topic', __VLS_ctx.expandedMessageId === item.id ? 'is-expanded' : '']) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "teacher-message-topic__header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "teacher-message-topic__serial" },
        });
        (__VLS_ctx.formatTopicNumber(index));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "teacher-message-topic__main" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "teacher-message-topic__headline" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (item.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: (['teacher-message-role-badge', `is-${item.authorRole}`]) },
        });
        (__VLS_ctx.getRoleLabel(item.authorRole));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (item.summary);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "teacher-message-topic__meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.authorName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.publishDate);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.lastReplyAt || '暂无更新');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.statusLabel);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.replyCount);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "teacher-message-topic__footer" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "teacher-message-topic__tip" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "teacher-message-topic__tip-dot" },
        });
        (__VLS_ctx.expandedMessageId === item.id ? '讨论详情已展开，可继续查看回复与楼中交流。' : '点击展开后可查看完整主题内容和楼层回复。');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "teacher-message-topic__actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.messageList.length))
                        return;
                    __VLS_ctx.toggleDiscussion(item.id);
                } },
            type: "button",
            ...{ class: "course-chip" },
        });
        (__VLS_ctx.expandedMessageId === item.id ? '收起讨论' : '展开讨论');
        if (item.canDelete) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.messageList.length))
                            return;
                        if (!(item.canDelete))
                            return;
                        __VLS_ctx.removeTopic(item);
                    } },
                type: "button",
                ...{ class: "course-chip teacher-message-delete-btn" },
                disabled: (__VLS_ctx.deletingTopicId === item.id),
            });
            (__VLS_ctx.deletingTopicId === item.id ? '删除中...' : '删除主题');
        }
        if (__VLS_ctx.expandedMessageId === item.id) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                ...{ class: "teacher-message-thread" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "teacher-message-thread__topic" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "teacher-message-thread__topic-head" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "teacher-message-kicker teacher-message-kicker--small" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.currentDetail?.topic.title || item.title);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: (['teacher-message-role-badge', `is-${__VLS_ctx.currentDetail?.topic.authorRole || item.authorRole}`]) },
            });
            (__VLS_ctx.getRoleLabel(__VLS_ctx.currentDetail?.topic.authorRole || item.authorRole));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (__VLS_ctx.currentDetail?.topic.content || '正在加载主题内容...');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "teacher-message-thread__topic-meta" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.currentDetail?.topic.authorName || item.authorName);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.currentDetail?.topic.publishDate || item.publishDate);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.currentDetail?.topic.statusLabel || item.statusLabel);
            if (__VLS_ctx.loadingDetailId === item.id) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "course-detail-empty course-detail-empty--compact" },
                });
            }
            else if (__VLS_ctx.currentDetail) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "teacher-message-thread__body" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "teacher-message-thread__reply-summary" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (__VLS_ctx.currentDetail.replies.length);
                if (__VLS_ctx.rootReplies.length) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "teacher-message-reply-list" },
                    });
                    for (const [reply] of __VLS_getVForSourceType((__VLS_ctx.rootReplies))) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
                            key: (reply.id),
                            ...{ class: "teacher-message-reply-card" },
                        });
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                            ...{ class: "teacher-message-reply-card__head" },
                        });
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                        (reply.authorName);
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                            ...{ class: "teacher-message-reply-card__time" },
                        });
                        (reply.replyTime);
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                            ...{ class: (['teacher-message-role-badge', `is-${reply.authorRole}`]) },
                        });
                        (__VLS_ctx.getRoleLabel(reply.authorRole));
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
                        (reply.content);
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                            ...{ class: "teacher-message-reply-card__actions" },
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
                                        if (!(__VLS_ctx.rootReplies.length))
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
                                        if (!(__VLS_ctx.rootReplies.length))
                                            return;
                                        if (!(__VLS_ctx.getChildReplies(reply.id).length))
                                            return;
                                        __VLS_ctx.toggleReplyChildren(reply.id);
                                    } },
                                type: "button",
                                ...{ class: "course-chip course-chip--soft" },
                            });
                            (__VLS_ctx.isReplyChildrenExpanded(reply.id) ? '收起楼中回复' : `展开楼中回复（${__VLS_ctx.getChildReplies(reply.id).length}）`);
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
                                        if (!(__VLS_ctx.rootReplies.length))
                                            return;
                                        if (!(reply.canDelete))
                                            return;
                                        __VLS_ctx.removeReply(item.id, reply);
                                    } },
                                type: "button",
                                ...{ class: "course-chip teacher-message-delete-btn" },
                                disabled: (__VLS_ctx.deletingReplyId === reply.id),
                            });
                            (__VLS_ctx.deletingReplyId === reply.id ? '删除中...' : '删除');
                        }
                        if (__VLS_ctx.isReplyChildrenExpanded(reply.id) && __VLS_ctx.getChildReplies(reply.id).length) {
                            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                                ...{ class: "teacher-message-reply-children" },
                            });
                            for (const [childReply] of __VLS_getVForSourceType((__VLS_ctx.getChildReplies(reply.id)))) {
                                __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
                                    key: (childReply.id),
                                    ...{ class: "teacher-message-reply-card teacher-message-reply-card--child" },
                                });
                                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                                    ...{ class: "teacher-message-reply-card__head" },
                                });
                                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                                (childReply.authorName);
                                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                                    ...{ class: "teacher-message-reply-card__time" },
                                });
                                (childReply.replyTime);
                                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                                    ...{ class: (['teacher-message-role-badge', `is-${childReply.authorRole}`]) },
                                });
                                (__VLS_ctx.getRoleLabel(childReply.authorRole));
                                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
                                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                                    ...{ class: "teacher-message-reply-card__mention" },
                                });
                                (childReply.parentAuthorName);
                                (childReply.content);
                                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                                    ...{ class: "teacher-message-reply-card__actions" },
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
                                                if (!(__VLS_ctx.rootReplies.length))
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
                                                if (!(__VLS_ctx.rootReplies.length))
                                                    return;
                                                if (!(__VLS_ctx.isReplyChildrenExpanded(reply.id) && __VLS_ctx.getChildReplies(reply.id).length))
                                                    return;
                                                if (!(childReply.canDelete))
                                                    return;
                                                __VLS_ctx.removeReply(item.id, childReply);
                                            } },
                                        type: "button",
                                        ...{ class: "course-chip teacher-message-delete-btn" },
                                        disabled: (__VLS_ctx.deletingReplyId === childReply.id),
                                    });
                                    (__VLS_ctx.deletingReplyId === childReply.id ? '删除中...' : '删除');
                                }
                            }
                        }
                    }
                }
                else {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "teacher-message-empty" },
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
                ...{ class: "teacher-message-reply-form" },
            });
            if (__VLS_ctx.replyTargets[item.id]?.replyId) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "teacher-message-reply-target" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
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
                ...{ class: "teacher-message-field" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.replyTargets[item.id]?.replyId ? '楼中回复' : '发表评论');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
                value: (__VLS_ctx.replyDrafts[item.id]),
                maxlength: "5000",
                rows: "5",
                placeholder: (__VLS_ctx.currentDetail?.capabilities.canReply === false
                    ? '当前数据库结构尚未升级，暂不支持当前角色回复'
                    : '请输入你的补充说明、教学建议或资源经验'),
                disabled: (__VLS_ctx.currentDetail?.capabilities.canReply === false || __VLS_ctx.replyingId === item.id),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "teacher-message-actions" },
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
        ...{ class: "teacher-message-empty teacher-message-empty--large" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "course-pagination teacher-message-pagination" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-pagination__desc" },
});
(__VLS_ctx.pagination.total);
(__VLS_ctx.pagination.page);
(Math.max(__VLS_ctx.pagination.totalPages, 1));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-pagination__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.changePage(__VLS_ctx.pagination.page - 1);
        } },
    type: "button",
    ...{ class: "course-chip" },
    disabled: (__VLS_ctx.pagination.page <= 1 || __VLS_ctx.loading),
});
for (const [pageNumber] of __VLS_getVForSourceType((__VLS_ctx.pageNumbers))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.changePage(pageNumber);
            } },
        key: (pageNumber),
        type: "button",
        ...{ class: (['course-page-btn', pageNumber === __VLS_ctx.pagination.page ? 'is-active' : '']) },
        disabled: (__VLS_ctx.loading),
    });
    (pageNumber);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.changePage(__VLS_ctx.pagination.page + 1);
        } },
    type: "button",
    ...{ class: "course-chip" },
    disabled: (__VLS_ctx.pagination.page >= __VLS_ctx.pagination.totalPages || __VLS_ctx.loading),
});
if (__VLS_ctx.showTopicEditor) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.closeTopicEditor) },
        ...{ class: "teacher-message-dialog" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "teacher-message-dialog__panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "teacher-message-dialog__head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "teacher-message-kicker" },
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
        ...{ class: "teacher-message-dialog__form" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "teacher-message-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.topicForm.title),
        type: "text",
        maxlength: "100",
        placeholder: "请输入交流主题标题",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "teacher-message-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.topicForm.content),
        maxlength: "5000",
        rows: "9",
        placeholder: "请输入课程资源、教学问题或备课经验内容",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "teacher-message-dialog__hint" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "teacher-message-dialog__footer" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "teacher-message-actions" },
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
        disabled: (__VLS_ctx.submittingTopic),
    });
    (__VLS_ctx.submittingTopic ? '发布中...' : '发布主题');
}
/** @type {__VLS_StyleScopedClasses['teacher-message-page']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-page__ambient']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-page__orb']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-page__orb--one']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-page__orb']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-page__orb--two']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-page__mesh']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-hero']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-hero__intro']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-kicker']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-hero__lead']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-hero__desc']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-hero__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-hero__spotlight']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-kicker']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-kicker--light']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-hero__spotlight-note']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-metrics']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-metric']} */ ;
/** @type {__VLS_StyleScopedClasses['course-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-feedback--error']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text--success']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-feedback--success']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-board']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-board__head']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-kicker']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-board__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-search']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-field']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-search__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-search__hint']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-list']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-topic__header']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-topic__serial']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-topic__main']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-topic__headline']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-topic__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-topic__footer']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-topic__tip']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-topic__tip-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-topic__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-thread']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-thread__topic']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-thread__topic-head']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-kicker']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-kicker--small']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-thread__topic-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-thread__body']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-thread__reply-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-reply-list']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-reply-card']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-reply-card__head']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-reply-card__time']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-reply-card__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-reply-children']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-reply-card']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-reply-card--child']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-reply-card__head']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-reply-card__time']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-reply-card__mention']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-reply-card__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-reply-form']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-reply-target']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-field']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-empty--large']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination__desc']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-dialog__panel']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-dialog__head']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-kicker']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-dialog__form']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-field']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-field']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-dialog__hint']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-dialog__footer']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-message-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
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
            pageSummary: pageSummary,
            currentDetail: currentDetail,
            rootReplies: rootReplies,
            heroMetrics: heroMetrics,
            boardSummary: boardSummary,
            pageNumbers: pageNumbers,
            getRoleLabel: getRoleLabel,
            formatTopicNumber: formatTopicNumber,
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
