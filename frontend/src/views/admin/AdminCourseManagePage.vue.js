import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createAdminCourse, deleteAdminCourse, getAdminCourseList, updateAdminCourse, } from '@/services/admin';
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
const collegeOptions = ref([]);
const teacherOptions = ref([]);
const courseList = ref([]);
const form = reactive({
    keyword: '',
});
const editorForm = reactive({
    name: '',
    collegeId: '',
    teacherId: '',
    summary: '',
});
const stats = reactive({
    total: 0,
    teacherCount: 0,
    materialCount: 0,
    videoCount: 0,
});
const pagination = reactive({
    page: 1,
    pageSize: 6,
    total: 0,
    totalPages: 0,
});
const headerText = computed(() => {
    const name = authStore.profile?.name || authStore.profile?.username || '管理员';
    return `${name}，这里统一维护课程基础信息，只保留搜索、增删改查核心操作。`;
});
const reminderTexts = computed(() => {
    return [
        stats.total > 0 ? `当前共有 ${stats.total} 门有效课程。` : '当前还没有可管理的课程数据。',
        stats.teacherCount > 0 ? `已有 ${stats.teacherCount} 位教师关联课程。` : '当前课程尚未关联教师负责人。',
    ];
});
const pageNumbers = computed(() => {
    const totalPages = Math.max(pagination.totalPages, 1);
    const start = Math.max(1, Math.min(pagination.page - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
});
const filteredTeacherOptions = computed(() => {
    if (!editorForm.collegeId) {
        return teacherOptions.value;
    }
    const collegeId = Number(editorForm.collegeId);
    return teacherOptions.value.filter((item) => item.collegeId === collegeId);
});
const editorTitle = computed(() => (editingId.value ? '修改课程' : '新增课程'));
const editorActionText = computed(() => (editingId.value ? '保存修改' : '确认新增'));
watch(() => editorForm.collegeId, () => {
    if (!editorForm.teacherId) {
        return;
    }
    const teacherId = Number(editorForm.teacherId);
    const exists = filteredTeacherOptions.value.some((item) => item.id === teacherId);
    if (!exists) {
        editorForm.teacherId = '';
    }
});
function normalizePage(value) {
    const page = Number(value);
    return Number.isInteger(page) && page > 0 ? page : 1;
}
function clearFeedback() {
    errorMessage.value = '';
    successMessage.value = '';
}
function clearError() {
    errorMessage.value = '';
}
function syncFormWithRoute() {
    form.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : '';
}
function updateRoute(page = 1) {
    router.push({
        path: '/admin/courses',
        query: {
            page: String(page),
            ...(form.keyword ? { keyword: form.keyword } : {}),
        },
    });
}
function resetEditorForm() {
    editingId.value = null;
    editorForm.name = '';
    editorForm.collegeId = '';
    editorForm.teacherId = '';
    editorForm.summary = '';
}
function openCreateEditor() {
    clearFeedback();
    resetEditorForm();
    editorVisible.value = true;
}
function openEditEditor(item) {
    clearFeedback();
    editingId.value = item.id;
    editorForm.name = item.name;
    editorForm.collegeId = item.collegeId ? String(item.collegeId) : '';
    editorForm.teacherId = item.teacherId ? String(item.teacherId) : '';
    editorForm.summary = item.summary === '暂无课程简介' ? '' : item.summary;
    editorVisible.value = true;
}
function closeEditor() {
    if (saving.value) {
        return;
    }
    editorVisible.value = false;
    resetEditorForm();
}
function applySearch() {
    updateRoute(1);
}
function resetFilters() {
    clearFeedback();
    form.keyword = '';
    updateRoute(1);
}
function changePage(page) {
    updateRoute(page);
}
async function submitEditor() {
    clearFeedback();
    if (!editorForm.name) {
        errorMessage.value = '课程名称不能为空';
        return;
    }
    if (!editorForm.collegeId) {
        errorMessage.value = '请选择所属学院';
        return;
    }
    if (!editorForm.teacherId) {
        errorMessage.value = '请选择课程负责人';
        return;
    }
    saving.value = true;
    try {
        const payload = {
            name: editorForm.name,
            summary: editorForm.summary,
            collegeId: editorForm.collegeId,
            teacherId: editorForm.teacherId,
        };
        if (editingId.value) {
            const result = await updateAdminCourse(editingId.value, payload);
            collegeOptions.value = result.formOptions.colleges;
            teacherOptions.value = result.formOptions.teachers;
            successMessage.value = `课程《${result.name}》已更新。`;
            closeEditor();
            await loadCourses();
        }
        else {
            const result = await createAdminCourse(payload);
            collegeOptions.value = result.formOptions.colleges;
            teacherOptions.value = result.formOptions.teachers;
            successMessage.value = `课程《${result.name}》已创建。`;
            closeEditor();
            if (pagination.page !== 1) {
                updateRoute(1);
            }
            else {
                await loadCourses();
            }
        }
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '课程保存失败';
    }
    finally {
        saving.value = false;
    }
}
async function removeCourse(item) {
    clearFeedback();
    if (!window.confirm(`确认删除课程《${item.name}》吗？`)) {
        return;
    }
    deletingId.value = item.id;
    try {
        await deleteAdminCourse(item.id);
        successMessage.value = `课程《${item.name}》已删除。`;
        if (courseList.value.length === 1 && pagination.page > 1) {
            updateRoute(pagination.page - 1);
        }
        else {
            await loadCourses();
        }
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '课程删除失败';
    }
    finally {
        deletingId.value = null;
    }
}
async function loadCourses() {
    loading.value = true;
    clearError();
    syncFormWithRoute();
    try {
        const data = await getAdminCourseList({
            page: normalizePage(route.query.page),
            pageSize: 6,
            keyword: form.keyword,
        });
        courseList.value = data.list;
        collegeOptions.value = data.formOptions.colleges;
        teacherOptions.value = data.formOptions.teachers;
        stats.total = data.stats.total;
        stats.teacherCount = data.stats.teacherCount;
        stats.materialCount = data.stats.materialCount;
        stats.videoCount = data.stats.videoCount;
        pagination.page = data.pagination.page;
        pagination.pageSize = data.pagination.pageSize;
        pagination.total = data.pagination.total;
        pagination.totalPages = data.pagination.totalPages;
    }
    catch (error) {
        courseList.value = [];
        collegeOptions.value = [];
        teacherOptions.value = [];
        stats.total = 0;
        stats.teacherCount = 0;
        stats.materialCount = 0;
        stats.videoCount = 0;
        pagination.page = 1;
        pagination.pageSize = 6;
        pagination.total = 0;
        pagination.totalPages = 0;
        errorMessage.value = error?.response?.data?.message || '课程管理列表加载失败';
    }
    finally {
        loading.value = false;
    }
}
watch(() => route.fullPath, () => {
    loadCourses();
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
            __VLS_ctx.router.push('/admin');
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
    type: "button",
    ...{ class: "admin-dashboard-nav__item is-active" },
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
            __VLS_ctx.router.push('/admin/videos');
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
    ...{ class: "admin-manage-filter-panel admin-course-toolbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "admin-manage-panel__meta" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.applySearch) },
    ...{ class: "admin-course-search" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.form.keyword),
    type: "text",
    maxlength: "100",
    placeholder: "搜索课程名称、简介、教师或学院",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
    ...{ class: "auth-btn" },
    disabled: (__VLS_ctx.loading),
});
(__VLS_ctx.loading ? '加载中...' : '搜索');
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.resetFilters) },
    type: "button",
    ...{ class: "auth-btn auth-btn--secondary" },
    disabled: (__VLS_ctx.loading),
});
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
(__VLS_ctx.stats.teacherCount);
(__VLS_ctx.stats.materialCount);
(__VLS_ctx.stats.videoCount);
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty course-detail-empty--compact" },
    });
}
else if (__VLS_ctx.courseList.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-course-crud-list" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.courseList))) {
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
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.updateDate);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (item.summary || '暂无课程简介');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-course-crud-item__meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.collegeName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.teacherName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.materialCount);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.videoCount);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-course-crud-item__actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.courseList.length))
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
                    if (!(__VLS_ctx.courseList.length))
                        return;
                    __VLS_ctx.removeCourse(item);
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
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "admin-manage-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.editorForm.name),
        type: "text",
        maxlength: "100",
        placeholder: "请输入课程名称",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-course-editor__grid" },
    });
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
        ...{ class: "admin-manage-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.editorForm.teacherId),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "",
    });
    for (const [teacher] of __VLS_getVForSourceType((__VLS_ctx.filteredTeacherOptions))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (teacher.id),
            value: (String(teacher.id)),
        });
        (teacher.name);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "admin-manage-field admin-manage-field--full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.editorForm.summary),
        maxlength: "2000",
        placeholder: "请输入课程简介，可为空",
    });
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
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['is-active']} */ ;
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
/** @type {__VLS_StyleScopedClasses['admin-manage-filter-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-search']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
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
/** @type {__VLS_StyleScopedClasses['admin-course-editor__grid']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field--full']} */ ;
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
            collegeOptions: collegeOptions,
            courseList: courseList,
            form: form,
            editorForm: editorForm,
            stats: stats,
            pagination: pagination,
            headerText: headerText,
            reminderTexts: reminderTexts,
            pageNumbers: pageNumbers,
            filteredTeacherOptions: filteredTeacherOptions,
            editorTitle: editorTitle,
            editorActionText: editorActionText,
            openCreateEditor: openCreateEditor,
            openEditEditor: openEditEditor,
            closeEditor: closeEditor,
            applySearch: applySearch,
            resetFilters: resetFilters,
            changePage: changePage,
            submitEditor: submitEditor,
            removeCourse: removeCourse,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
