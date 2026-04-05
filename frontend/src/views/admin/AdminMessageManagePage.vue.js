import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createAdminMessageReply, deleteAdminMessage, getAdminMessageDetail, getAdminMessageList, } from '@/services/admin';
import { useAuthStore } from '@/stores/auth';
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const loading = ref(false);
const replyingId = ref(null);
const deletingId = ref(null);
const loadingDetailId = ref(null);
const expandedMessageId = ref(null);
const errorMessage = ref('');
const successMessage = ref('');
const messageList = ref([]);
const replyDrafts = reactive({});
const detailMap = reactive({});
const form = reactive({
    keyword: '',
});
const pagination = reactive({
    page: 1,
    pageSize: 6,
    total: 0,
    totalPages: 0,
});
const headerText = computed(() => {
    const name = authStore.profile?.name || authStore.profile?.username || '管理员';
    return `${name}，这里统一跟进教师交流主题，查看回复并执行后台治理。`;
});
const reminderTexts = computed(() => {
    return [
        pagination.total > 0 ? `当前共有 ${pagination.total} 条交流主题待跟进。` : '当前还没有可管理的交流主题。',
        expandedMessageId.value ? '已展开当前主题，可直接查看回复并继续处理。' : '可展开任意主题查看回复并在当前页继续回复。',
    ];
});
const pageNumbers = computed(() => {
    const totalPages = pagination.totalPages || 1;
    return Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5);
});
const currentDetail = computed(() => {
    if (!expandedMessageId.value) {
        return null;
    }
    return detailMap[expandedMessageId.value] || null;
});
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
    expandedMessageId.value = null;
    form.keyword = '';
    updateRoute(1);
}
function changePage(page) {
    expandedMessageId.value = null;
    updateRoute(page);
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
async function removeMessage(item) {
    clearMessages();
    if (!window.confirm(`确认删除交流主题《${item.title}》吗？`)) {
        return;
    }
    deletingId.value = item.id;
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
        deletingId.value = null;
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
        await createAdminMessageReply(messageId, { content });
        replyDrafts[messageId] = '';
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
async function loadMessages() {
    loading.value = true;
    clearMessages();
    syncFormWithRoute();
    try {
        const data = await getAdminMessageList({
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
        errorMessage.value = error?.response?.data?.message || '留言管理列表加载失败';
    }
    finally {
        loading.value = false;
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
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin');
        } },
    type: "button",
    ...{ class: "admin-dashboard-nav__item" },
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
            __VLS_ctx.router.push('/admin/materials');
        } },
    type: "button",
    ...{ class: "admin-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "button",
    ...{ class: "admin-dashboard-nav__item is-active" },
});
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
    placeholder: "搜索标题、正文或教师姓名",
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
            ...{ class: "admin-message-item__main" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (item.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (item.summary);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-message-item__meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.teacherName);
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
                    __VLS_ctx.removeMessage(item);
                } },
            type: "button",
            ...{ class: "course-chip admin-manage-delete-btn" },
            disabled: (__VLS_ctx.deletingId === item.id),
        });
        (__VLS_ctx.deletingId === item.id ? '删除中...' : '删除主题');
        if (__VLS_ctx.expandedMessageId === item.id) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                ...{ class: "admin-message-thread" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "admin-message-thread__topic" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (__VLS_ctx.currentDetail?.topic.content || '正在加载主题内容...');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.currentDetail?.topic.teacherName || item.teacherName);
            (__VLS_ctx.currentDetail?.topic.publishDate || item.publishDate);
            if (__VLS_ctx.loadingDetailId === item.id) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "course-detail-empty course-detail-empty--compact" },
                });
            }
            else if (__VLS_ctx.currentDetail?.replies?.length) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "admin-message-reply-list" },
                });
                for (const [reply] of __VLS_getVForSourceType((__VLS_ctx.currentDetail.replies))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
                        key: (reply.id),
                        ...{ class: "admin-message-reply-item" },
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
                        if (!(__VLS_ctx.messageList.length))
                            return;
                        if (!(__VLS_ctx.expandedMessageId === item.id))
                            return;
                        __VLS_ctx.submitReply(item.id);
                    } },
                ...{ class: "admin-message-form" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "admin-manage-field admin-manage-field--full" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
                value: (__VLS_ctx.replyDrafts[item.id]),
                maxlength: "5000",
                rows: "5",
                placeholder: (__VLS_ctx.currentDetail?.capabilities.canReply === false ? '当前数据库未启用管理员回复字段，请先升级表结构' : '请输入你的处理意见、引导建议或补充说明'),
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
            (__VLS_ctx.replyingId === item.id ? '发布中...' : '发布回复');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.messageList.length))
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
        ...{ class: (['admin-manage-page-btn', pageNumber === __VLS_ctx.pagination.page ? 'is-active' : '']) },
        disabled: (__VLS_ctx.loading),
    });
    (pageNumber);
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
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-list']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-item__main']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-item__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-item__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-thread']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-thread__topic']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-reply-list']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-reply-item']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-message-form']} */ ;
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
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            loading: loading,
            replyingId: replyingId,
            deletingId: deletingId,
            loadingDetailId: loadingDetailId,
            expandedMessageId: expandedMessageId,
            errorMessage: errorMessage,
            successMessage: successMessage,
            messageList: messageList,
            replyDrafts: replyDrafts,
            form: form,
            pagination: pagination,
            headerText: headerText,
            reminderTexts: reminderTexts,
            pageNumbers: pageNumbers,
            currentDetail: currentDetail,
            applySearch: applySearch,
            resetFilters: resetFilters,
            changePage: changePage,
            toggleDiscussion: toggleDiscussion,
            removeMessage: removeMessage,
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
