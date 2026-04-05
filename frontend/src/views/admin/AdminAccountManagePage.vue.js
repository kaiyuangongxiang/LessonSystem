import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createAdminAccount, deleteAdminAccount, getAdminAccountList, updateAdminAccount, } from '@/services/admin';
import { useAuthStore } from '@/stores/auth';
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const loading = ref(false);
const saving = ref(false);
const deletingId = ref(null);
const errorMessage = ref('');
const successMessage = ref('');
const editorVisible = ref(false);
const editingId = ref(null);
const accountList = ref([]);
const editorForm = reactive({
    username: '',
    realName: '',
    password: '',
});
const stats = reactive({
    total: 0,
    namedCount: 0,
});
const pagination = reactive({
    page: 1,
    pageSize: 6,
    total: 0,
    totalPages: 0,
});
const currentAdminLabel = computed(() => authStore.profile?.name || authStore.profile?.username || '当前管理员');
const headerText = computed(() => {
    const name = authStore.profile?.name || authStore.profile?.username || '管理员';
    return `${name}，这里统一维护后台管理员账号，支持新增、修改、删除和搜索。`;
});
const reminderTexts = computed(() => {
    return [
        stats.total > 0 ? `当前共有 ${stats.total} 个管理员账号可维护。` : '当前还没有管理员账号数据。',
        stats.namedCount < stats.total ? `仍有 ${stats.total - stats.namedCount} 个账号未设置真实姓名。` : '当前管理员账号都已设置真实姓名。',
    ];
});
const pageNumbers = computed(() => {
    const totalPages = Math.max(pagination.totalPages, 1);
    const start = Math.max(1, Math.min(pagination.page - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
});
const editorTitle = computed(() => (editingId.value ? '修改管理员账号' : '新增管理员账号'));
const editorActionText = computed(() => (editingId.value ? '保存修改' : '确认新增'));
function normalizePage(value) {
    const page = Number(value);
    return Number.isInteger(page) && page > 0 ? page : 1;
}
function clearFeedback() {
    errorMessage.value = '';
    successMessage.value = '';
}
function updateRoute(page = 1) {
    router.push({
        path: '/admin/accounts',
        query: {
            page: String(page),
        },
    });
}
function resetEditorForm() {
    editingId.value = null;
    editorForm.username = '';
    editorForm.realName = '';
    editorForm.password = '';
}
function openCreateEditor() {
    clearFeedback();
    resetEditorForm();
    editorVisible.value = true;
}
function openEditEditor(item) {
    clearFeedback();
    editingId.value = item.id;
    editorForm.username = item.username;
    editorForm.realName = item.realName;
    editorForm.password = '';
    editorVisible.value = true;
}
function closeEditor() {
    if (saving.value) {
        return;
    }
    editorVisible.value = false;
    resetEditorForm();
}
function changePage(page) {
    updateRoute(page);
}
async function submitEditor() {
    clearFeedback();
    if (!editorForm.username) {
        errorMessage.value = '管理员账号不能为空';
        return;
    }
    if (!editingId.value && !editorForm.password) {
        errorMessage.value = '新增管理员时必须填写密码';
        return;
    }
    saving.value = true;
    try {
        const payload = {
            username: editorForm.username,
            realName: editorForm.realName,
            password: editorForm.password || undefined,
        };
        if (editingId.value) {
            const result = await updateAdminAccount(editingId.value, payload);
            successMessage.value = `管理员账号《${result.username}》已更新。`;
            closeEditor();
            await loadAdmins();
        }
        else {
            const result = await createAdminAccount(payload);
            successMessage.value = `管理员账号《${result.username}》已创建。`;
            closeEditor();
            if (pagination.page !== 1) {
                updateRoute(1);
            }
            else {
                await loadAdmins();
            }
        }
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '管理员账号保存失败';
    }
    finally {
        saving.value = false;
    }
}
async function removeAdmin(item) {
    clearFeedback();
    if (item.isCurrent) {
        errorMessage.value = '当前登录的管理员账号不能删除';
        return;
    }
    if (!window.confirm(`确认删除管理员账号《${item.username}》吗？`)) {
        return;
    }
    deletingId.value = item.id;
    try {
        await deleteAdminAccount(item.id);
        successMessage.value = `管理员账号《${item.username}》已删除。`;
        if (accountList.value.length === 1 && pagination.page > 1) {
            updateRoute(pagination.page - 1);
        }
        else {
            await loadAdmins();
        }
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '管理员账号删除失败';
    }
    finally {
        deletingId.value = null;
    }
}
async function loadAdmins() {
    loading.value = true;
    errorMessage.value = '';
    try {
        const data = await getAdminAccountList({
            page: normalizePage(route.query.page),
            pageSize: 6,
        });
        accountList.value = data.list;
        stats.total = data.stats.total;
        stats.namedCount = data.stats.namedCount;
        pagination.page = data.pagination.page;
        pagination.pageSize = data.pagination.pageSize;
        pagination.total = data.pagination.total;
        pagination.totalPages = data.pagination.totalPages;
    }
    catch (error) {
        accountList.value = [];
        stats.total = 0;
        stats.namedCount = 0;
        pagination.page = 1;
        pagination.pageSize = 6;
        pagination.total = 0;
        pagination.totalPages = 0;
        errorMessage.value = error?.response?.data?.message || '管理员账号列表加载失败';
    }
    finally {
        loading.value = false;
    }
}
watch(() => route.fullPath, () => {
    loadAdmins();
}, { immediate: true });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "admin-manage-page admin-course-simple-page" },
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
    type: "button",
    ...{ class: "admin-dashboard-nav__item is-active" },
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin');
        } },
    type: "button",
    ...{ class: "auth-btn auth-btn--secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.openCreateEditor) },
    type: "button",
    ...{ class: "auth-btn" },
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
    ...{ class: "admin-manage-stats" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "admin-manage-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.total);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "admin-manage-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.namedCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "admin-manage-stat-card is-highlight" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.currentAdminLabel);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "admin-manage-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.pagination.page);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
(Math.max(__VLS_ctx.pagination.totalPages, 1));
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "admin-manage-panel admin-course-list-panel" },
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
(__VLS_ctx.pagination.total);
(__VLS_ctx.stats.namedCount);
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty course-detail-empty--compact" },
    });
}
else if (__VLS_ctx.accountList.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-course-crud-list" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.accountList))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (item.id),
            ...{ class: "admin-course-crud-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-course-crud-item__main" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-course-crud-item__head" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (item.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (item.realName ? `真实姓名：${item.realName}` : '当前尚未设置真实姓名，建议补齐以便后台协作识别。');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-course-crud-item__status" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "admin-course-status-badge is-neutral" },
        });
        (item.username);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: (['admin-course-status-badge', item.realName ? 'is-success' : 'is-warning']) },
        });
        (item.realName ? '已设置姓名' : '待补姓名');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: (['admin-course-status-badge', item.isCurrent ? 'is-success' : 'is-neutral']) },
        });
        (item.isCurrent ? '当前登录账号' : '普通管理员账号');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-course-crud-item__meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.id);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.createTime);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.updateTime);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-course-crud-item__actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.accountList.length))
                        return;
                    __VLS_ctx.openEditEditor(item);
                } },
            type: "button",
            ...{ class: "course-chip course-chip--soft" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.accountList.length))
                        return;
                    __VLS_ctx.removeAdmin(item);
                } },
            type: "button",
            ...{ class: "course-chip admin-manage-delete-btn" },
            disabled: (__VLS_ctx.deletingId === item.id || item.isCurrent),
        });
        (item.isCurrent ? '当前账号' : __VLS_ctx.deletingId === item.id ? '删除中...' : '删除');
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty" },
    });
}
if (__VLS_ctx.pagination.total > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "admin-manage-pagination" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-manage-pagination__desc" },
    });
    (__VLS_ctx.pagination.page);
    (Math.max(__VLS_ctx.pagination.totalPages, 1));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-manage-pagination__actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.pagination.total > 0))
                    return;
                __VLS_ctx.changePage(__VLS_ctx.pagination.page - 1);
            } },
        type: "button",
        ...{ class: "course-chip" },
        disabled: (__VLS_ctx.pagination.page <= 1 || __VLS_ctx.loading),
    });
    for (const [pageNumber] of __VLS_getVForSourceType((__VLS_ctx.pageNumbers))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.pagination.total > 0))
                        return;
                    __VLS_ctx.changePage(pageNumber);
                } },
            key: (pageNumber),
            type: "button",
            ...{ class: (['admin-manage-page-btn', pageNumber === __VLS_ctx.pagination.page ? 'is-active' : '']) },
            disabled: (__VLS_ctx.loading),
        });
        (pageNumber);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.pagination.total > 0))
                    return;
                __VLS_ctx.changePage(__VLS_ctx.pagination.page + 1);
            } },
        type: "button",
        ...{ class: "course-chip" },
        disabled: (__VLS_ctx.pagination.page >= __VLS_ctx.pagination.totalPages || __VLS_ctx.loading),
    });
}
if (__VLS_ctx.editorVisible) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.closeEditor) },
        ...{ class: "admin-course-editor-mask" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "admin-course-editor" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-course-editor__head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-manage-panel__eyebrow" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    (__VLS_ctx.editorTitle);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.closeEditor) },
        type: "button",
        ...{ class: "course-chip course-chip--soft" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
        ...{ onSubmit: (__VLS_ctx.submitEditor) },
        ...{ class: "admin-course-editor__form" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "admin-manage-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.editorForm.username),
        type: "text",
        maxlength: "50",
        placeholder: "请输入管理员登录账号",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "admin-manage-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.editorForm.realName),
        type: "text",
        maxlength: "50",
        placeholder: "请输入真实姓名，可为空",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "admin-manage-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.editingId ? '重置密码' : '登录密码');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "password",
        maxlength: "50",
        placeholder: (__VLS_ctx.editingId ? '如不修改密码可留空，修改时至少 6 位' : '请输入至少 6 位密码'),
    });
    (__VLS_ctx.editorForm.password);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "admin-course-editor__hint" },
    });
    (__VLS_ctx.editingId ? '编辑账号时密码可留空，系统会保留原密码。' : '新增账号后可立即使用新账号登录管理员中心。');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-course-editor__footer" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-course-editor__actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.closeEditor) },
        type: "button",
        ...{ class: "auth-btn auth-btn--secondary" },
        disabled: (__VLS_ctx.saving),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        type: "submit",
        ...{ class: "auth-btn" },
        disabled: (__VLS_ctx.saving),
    });
    (__VLS_ctx.saving ? '保存中...' : __VLS_ctx.editorActionText);
}
/** @type {__VLS_StyleScopedClasses['admin-manage-page']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-simple-page']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-sidebar__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item--system']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['is-active']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-reminder-card']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-reminder-card--manage']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-reminder-card__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-main']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-head__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-head__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['course-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text--success']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['is-highlight']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-list-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-crud-list']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-crud-item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-crud-item__main']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-crud-item__head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-crud-item__status']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['is-neutral']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-crud-item__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-crud-item__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-pagination__desc']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-pagination__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor-mask']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor__head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor__form']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor__hint']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor__footer']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            loading: loading,
            saving: saving,
            deletingId: deletingId,
            errorMessage: errorMessage,
            successMessage: successMessage,
            editorVisible: editorVisible,
            editingId: editingId,
            accountList: accountList,
            editorForm: editorForm,
            stats: stats,
            pagination: pagination,
            currentAdminLabel: currentAdminLabel,
            headerText: headerText,
            reminderTexts: reminderTexts,
            pageNumbers: pageNumbers,
            editorTitle: editorTitle,
            editorActionText: editorActionText,
            openCreateEditor: openCreateEditor,
            openEditEditor: openEditEditor,
            closeEditor: closeEditor,
            changePage: changePage,
            submitEditor: submitEditor,
            removeAdmin: removeAdmin,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
