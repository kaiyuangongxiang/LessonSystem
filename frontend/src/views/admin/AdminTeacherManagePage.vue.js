import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createAdminTeacherUser, deleteAdminTeacherUser, getAdminTeacherUserList, updateAdminTeacherUser, } from '@/services/admin';
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
const teacherList = ref([]);
const collegeOptions = ref([]);
const genderOptions = ref(['男', '女', '未知']);
const editorForm = reactive({
    username: '',
    teacherName: '',
    gender: '',
    collegeId: '',
    email: '',
    profile: '',
    password: '',
});
const stats = reactive({
    total: 0,
    collegeAssignedCount: 0,
    emailBoundCount: 0,
    profileCompletedCount: 0,
});
const pagination = reactive({
    page: 1,
    pageSize: 6,
    total: 0,
    totalPages: 0,
});
const headerText = computed(() => {
    const name = authStore.profile?.name || authStore.profile?.username || '管理员';
    return `${name}，这里统一维护教师账号的基础信息，支持新增、修改和禁用管理。`;
});
const reminderTexts = computed(() => {
    return [
        stats.total > 0 ? `当前共有 ${stats.total} 位教师用户可管理。` : '当前还没有教师账号，可先新增基础教师用户。',
        stats.profileCompletedCount < stats.total
            ? `仍有 ${stats.total - stats.profileCompletedCount} 位教师尚未完善个人简介。`
            : '当前教师账号资料完善度较好，可继续维护邮箱等联系信息。',
    ];
});
const pageNumbers = computed(() => {
    const totalPages = Math.max(pagination.totalPages, 1);
    const start = Math.max(1, Math.min(pagination.page - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
});
const editorTitle = computed(() => (editingId.value ? '修改教师用户' : '新增教师用户'));
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
        path: '/admin/teachers',
        query: {
            page: String(page),
        },
    });
}
function resetEditorForm() {
    editingId.value = null;
    editorForm.username = '';
    editorForm.teacherName = '';
    editorForm.gender = '';
    editorForm.collegeId = '';
    editorForm.email = '';
    editorForm.profile = '';
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
    editorForm.teacherName = item.teacherName || item.name;
    editorForm.gender = item.gender;
    editorForm.collegeId = item.collegeId ? String(item.collegeId) : '';
    editorForm.email = item.email || '';
    editorForm.profile = item.profile || '';
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
    if (!editorForm.username || !editorForm.teacherName || !editorForm.gender || !editorForm.collegeId) {
        errorMessage.value = '请完整填写教师基础信息';
        return;
    }
    if (!editingId.value && !editorForm.password) {
        errorMessage.value = '新增教师用户时必须填写登录密码';
        return;
    }
    saving.value = true;
    try {
        const payload = {
            username: editorForm.username,
            teacherName: editorForm.teacherName,
            gender: editorForm.gender,
            collegeId: editorForm.collegeId,
            email: editorForm.email,
            profile: editorForm.profile,
            password: editorForm.password || undefined,
        };
        if (editingId.value) {
            const result = await updateAdminTeacherUser(editingId.value, payload);
            successMessage.value = `教师用户《${result.name}》已更新。`;
            closeEditor();
            await loadTeachers();
        }
        else {
            const result = await createAdminTeacherUser(payload);
            successMessage.value = `教师用户《${result.name}》已创建。`;
            closeEditor();
            if (pagination.page !== 1) {
                updateRoute(1);
            }
            else {
                await loadTeachers();
            }
        }
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '教师用户保存失败';
    }
    finally {
        saving.value = false;
    }
}
async function removeTeacher(item) {
    clearFeedback();
    if (!window.confirm(`确认删除教师用户《${item.name}》吗？删除后该教师账号将无法登录。`)) {
        return;
    }
    deletingId.value = item.id;
    try {
        await deleteAdminTeacherUser(item.id);
        successMessage.value = `教师用户《${item.name}》已删除。`;
        if (teacherList.value.length === 1 && pagination.page > 1) {
            updateRoute(pagination.page - 1);
        }
        else {
            await loadTeachers();
        }
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '教师用户删除失败';
    }
    finally {
        deletingId.value = null;
    }
}
async function loadTeachers() {
    loading.value = true;
    errorMessage.value = '';
    try {
        const data = await getAdminTeacherUserList({
            page: normalizePage(route.query.page),
            pageSize: 6,
        });
        teacherList.value = data.list;
        collegeOptions.value = data.formOptions.colleges;
        genderOptions.value = data.formOptions.genders;
        stats.total = data.stats.total;
        stats.collegeAssignedCount = data.stats.collegeAssignedCount;
        stats.emailBoundCount = data.stats.emailBoundCount;
        stats.profileCompletedCount = data.stats.profileCompletedCount;
        pagination.page = data.pagination.page;
        pagination.pageSize = data.pagination.pageSize;
        pagination.total = data.pagination.total;
        pagination.totalPages = data.pagination.totalPages;
    }
    catch (error) {
        teacherList.value = [];
        collegeOptions.value = [];
        genderOptions.value = ['男', '女', '未知'];
        stats.total = 0;
        stats.collegeAssignedCount = 0;
        stats.emailBoundCount = 0;
        stats.profileCompletedCount = 0;
        pagination.page = 1;
        pagination.pageSize = 6;
        pagination.total = 0;
        pagination.totalPages = 0;
        errorMessage.value = error?.response?.data?.message || '教师用户列表加载失败';
    }
    finally {
        loading.value = false;
    }
}
watch(() => route.fullPath, () => {
    loadTeachers();
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
    type: "button",
    ...{ class: "admin-dashboard-nav__item is-active" },
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
(__VLS_ctx.stats.collegeAssignedCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "admin-manage-stat-card is-highlight" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.emailBoundCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "admin-manage-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.profileCompletedCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
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
(__VLS_ctx.pagination.page);
(Math.max(__VLS_ctx.pagination.totalPages, 1));
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty course-detail-empty--compact" },
    });
}
else if (__VLS_ctx.teacherList.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-course-crud-list" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.teacherList))) {
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
        (item.profile || '当前尚未填写个人简介，可在编辑中补充教师个人介绍。');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-course-crud-item__status" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "admin-course-status-badge is-neutral" },
        });
        (item.username);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "admin-course-status-badge is-neutral" },
        });
        (item.gender);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "admin-course-status-badge is-neutral" },
        });
        (item.collegeName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: (['admin-course-status-badge', item.email ? 'is-success' : 'is-warning']) },
        });
        (item.email ? `邮箱：${item.email}` : '未填写邮箱');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-course-crud-item__meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.id);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.courseCount);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.resourceCount);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.registerTime);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.updateTime);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-course-crud-item__actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.teacherList.length))
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
                    if (!(__VLS_ctx.teacherList.length))
                        return;
                    __VLS_ctx.removeTeacher(item);
                } },
            type: "button",
            ...{ class: "course-chip admin-manage-delete-btn" },
            disabled: (__VLS_ctx.deletingId === item.id),
        });
        (__VLS_ctx.deletingId === item.id ? '删除中...' : '删除');
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
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "teacher-profile-form__row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "admin-manage-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.editorForm.username),
        type: "text",
        maxlength: "50",
        placeholder: "请输入教师登录用户名",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "admin-manage-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.editorForm.teacherName),
        type: "text",
        maxlength: "50",
        placeholder: "请输入教师姓名",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "teacher-profile-form__row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "admin-manage-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.editorForm.gender),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "",
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.genderOptions))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (item),
            value: (item),
        });
        (item);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "admin-manage-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.editorForm.collegeId),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "",
    });
    for (const [college] of __VLS_getVForSourceType((__VLS_ctx.collegeOptions))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (college.id),
            value: (String(college.id)),
        });
        (college.name);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "admin-manage-field admin-manage-field--full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "email",
        maxlength: "100",
        placeholder: "请输入邮箱，可为空",
    });
    (__VLS_ctx.editorForm.email);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "admin-manage-field admin-manage-field--full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.editorForm.profile),
        maxlength: "2000",
        rows: "6",
        placeholder: "请输入个人简介，可为空",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "admin-manage-field admin-manage-field--full" },
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
    (__VLS_ctx.editingId ? '修改教师资料时密码可留空，系统会保留原密码。' : '新增教师用户后，可直接用于教师端登录。');
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
/** @type {__VLS_StyleScopedClasses['is-active']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
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
/** @type {__VLS_StyleScopedClasses['admin-course-status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['is-neutral']} */ ;
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
/** @type {__VLS_StyleScopedClasses['teacher-profile-form__row']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-form__row']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field--full']} */ ;
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
            teacherList: teacherList,
            collegeOptions: collegeOptions,
            genderOptions: genderOptions,
            editorForm: editorForm,
            stats: stats,
            pagination: pagination,
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
            removeTeacher: removeTeacher,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
