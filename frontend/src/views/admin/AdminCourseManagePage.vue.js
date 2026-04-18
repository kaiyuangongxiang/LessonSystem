import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AdminSidebarNav from '@/components/navigation/AdminSidebarNav.vue';
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
const filterCollegeOptions = ref([]);
const collegeOptions = ref([]);
const teacherOptions = ref([]);
const courseList = ref([]);
const form = reactive({
    keyword: '',
    collegeId: '',
    sort: 'recent',
});
const editorForm = reactive({
    name: '',
    collegeId: '',
    teacherId: '',
    summary: '',
    teachingGoal: '',
    teachingContent: '',
    teachingIdea: '',
});
const stats = reactive({
    total: 0,
    teacherCount: 0,
    materialCount: 0,
    videoCount: 0,
    collegeAssignedCount: 0,
    contentReadyCount: 0,
});
const pagination = reactive({
    page: 1,
    pageSize: 4,
    total: 0,
    totalPages: 0,
});
const headerText = computed(() => {
    const name = authStore.profile?.name || authStore.profile?.username || '管理员';
    return `${name}，这里用于统一维护课程基础信息、教学内容结构和课程归属关系。`;
});
const reminderTexts = computed(() => {
    return [
        stats.collegeAssignedCount < stats.total
            ? `当前仍有 ${stats.total - stats.collegeAssignedCount} 门课程未补齐学院归属。`
            : '当前课程都已补齐学院归属。',
        stats.contentReadyCount < stats.total
            ? `当前仍有 ${stats.total - stats.contentReadyCount} 门课程缺少教学内容字段。`
            : '当前课程的简介、目标、内容和思路都已补齐。',
    ];
});
const currentFilterSummary = computed(() => {
    const parts = [form.sort === 'video-rich' ? '视频优先' : '最近更新'];
    if (form.collegeId) {
        const matched = filterCollegeOptions.value.find((item) => String(item.id) === form.collegeId);
        parts.push(matched?.name || '指定学院');
    }
    else {
        parts.push('全部学院');
    }
    if (form.keyword) {
        parts.push(`关键字：${form.keyword}`);
    }
    return parts.join(' · ');
});
const filteredTeacherOptions = computed(() => {
    if (!editorForm.collegeId) {
        return teacherOptions.value;
    }
    const selectedCollegeId = Number(editorForm.collegeId);
    return [...teacherOptions.value]
        .filter((item) => item.collegeId === selectedCollegeId || item.collegeId === null)
        .sort((left, right) => {
        const leftRank = left.collegeId === selectedCollegeId ? 0 : 1;
        const rightRank = right.collegeId === selectedCollegeId ? 0 : 1;
        if (leftRank !== rightRank) {
            return leftRank - rightRank;
        }
        return left.name.localeCompare(right.name, 'zh-CN');
    });
});
const selectedTeacherOption = computed(() => {
    if (!editorForm.teacherId) {
        return null;
    }
    const teacherId = Number(editorForm.teacherId);
    return teacherOptions.value.find((item) => item.id === teacherId) || null;
});
const teacherSelectionHint = computed(() => {
    if (!editorForm.collegeId || !selectedTeacherOption.value) {
        return '';
    }
    const selectedCollegeId = Number(editorForm.collegeId);
    if (selectedTeacherOption.value.collegeId === selectedCollegeId) {
        return `当前教师已归属到所选学院：${selectedTeacherOption.value.collegeName}。`;
    }
    if (selectedTeacherOption.value.collegeId === null) {
        return `当前教师尚未归属学院，将按课程的学院设置继续保存。`;
    }
    return `当前教师归属 ${selectedTeacherOption.value.collegeName}，与课程学院不一致，请确认是否需要先调整教师归属。`;
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
function syncFormWithRoute() {
    form.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : '';
    form.collegeId = typeof route.query.collegeId === 'string' ? route.query.collegeId : '';
    form.sort = route.query.sort === 'video-rich' ? 'video-rich' : 'recent';
}
function updateRoute(page = 1) {
    router.push({
        path: '/admin/courses',
        query: {
            page: String(page),
            ...(form.keyword ? { keyword: form.keyword } : {}),
            ...(form.collegeId ? { collegeId: form.collegeId } : {}),
            ...(form.sort !== 'recent' ? { sort: form.sort } : {}),
        },
    });
}
function resetEditorForm() {
    editingId.value = null;
    editorForm.name = '';
    editorForm.collegeId = '';
    editorForm.teacherId = '';
    editorForm.summary = '';
    editorForm.teachingGoal = '';
    editorForm.teachingContent = '';
    editorForm.teachingIdea = '';
}
function getContentReadyCount(item) {
    return [item.summary, item.teachingGoal, item.teachingContent, item.teachingIdea].filter((value) => Boolean(value?.trim())).length;
}
function teacherCollegeText(item) {
    if (!item.teacherCollegeName) {
        return '教师归属未知';
    }
    if (item.teacherCollegeMatched === false) {
        return `教师归属：${item.teacherCollegeName}（与课程学院不一致）`;
    }
    return `教师归属：${item.teacherCollegeName}`;
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
    editorForm.summary = item.summary;
    editorForm.teachingGoal = item.teachingGoal;
    editorForm.teachingContent = item.teachingContent;
    editorForm.teachingIdea = item.teachingIdea;
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
    form.collegeId = '';
    form.sort = 'recent';
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
            teachingGoal: editorForm.teachingGoal,
            teachingContent: editorForm.teachingContent,
            teachingIdea: editorForm.teachingIdea,
            collegeId: editorForm.collegeId,
            teacherId: editorForm.teacherId,
        };
        if (editingId.value) {
            const result = await updateAdminCourse(editingId.value, payload);
            collegeOptions.value = result.formOptions.colleges;
            filterCollegeOptions.value = result.formOptions.colleges;
            teacherOptions.value = result.formOptions.teachers;
            successMessage.value = `课程《${result.name}》已更新。`;
            closeEditor();
            await loadCourses();
        }
        else {
            const result = await createAdminCourse(payload);
            collegeOptions.value = result.formOptions.colleges;
            filterCollegeOptions.value = result.formOptions.colleges;
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
    errorMessage.value = '';
    syncFormWithRoute();
    try {
        const data = await getAdminCourseList({
            page: normalizePage(route.query.page),
            pageSize: 4,
            keyword: form.keyword,
            collegeId: form.collegeId || undefined,
            sort: form.sort,
        });
        courseList.value = data.list;
        filterCollegeOptions.value = data.filters.colleges;
        collegeOptions.value = data.formOptions.colleges;
        teacherOptions.value = data.formOptions.teachers;
        stats.total = data.stats.total;
        stats.teacherCount = data.stats.teacherCount;
        stats.materialCount = data.stats.materialCount;
        stats.videoCount = data.stats.videoCount;
        stats.collegeAssignedCount = data.stats.collegeAssignedCount;
        stats.contentReadyCount = data.stats.contentReadyCount;
        pagination.page = data.pagination.page;
        pagination.pageSize = data.pagination.pageSize;
        pagination.total = data.pagination.total;
        pagination.totalPages = data.pagination.totalPages;
    }
    catch (error) {
        courseList.value = [];
        filterCollegeOptions.value = [];
        collegeOptions.value = [];
        teacherOptions.value = [];
        stats.total = 0;
        stats.teacherCount = 0;
        stats.materialCount = 0;
        stats.videoCount = 0;
        stats.collegeAssignedCount = 0;
        stats.contentReadyCount = 0;
        pagination.page = 1;
        pagination.pageSize = 4;
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
/** @type {[typeof AdminSidebarNav, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(AdminSidebarNav, new AdminSidebarNav({
    active: "courses",
}));
const __VLS_1 = __VLS_0({
    active: "courses",
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
        type: "button",
        ...{ class: "admin-dashboard-nav__item is-active" },
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
        ...{ onClick: (...[$event]) => {
                if (!(false))
                    return;
                __VLS_ctx.router.push('/admin/messages');
            } },
        type: "button",
        ...{ class: "admin-dashboard-nav__item" },
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
    ...{ class: "admin-manage-filter-form admin-manage-filter-form--course" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "admin-manage-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.form.keyword),
    type: "text",
    maxlength: "100",
    placeholder: "搜索课程名称、简介、教学目标、教学内容、教师或学院",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "admin-manage-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.form.collegeId),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
for (const [college] of __VLS_getVForSourceType((__VLS_ctx.filterCollegeOptions))) {
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
    value: (__VLS_ctx.form.sort),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "recent",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "video-rich",
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
(__VLS_ctx.loading ? '加载中...' : '应用筛选');
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
    ...{ class: "admin-manage-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.contentReadyCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "admin-manage-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.teacherCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "admin-manage-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.materialCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "admin-manage-stat-card is-highlight" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.videoCount);
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
(__VLS_ctx.currentFilterSummary);
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
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (item.summary || '暂无课程简介，建议先补充课程定位和教学范围。');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-course-crud-item__status" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: (['admin-course-status-badge', item.collegeId ? 'is-success' : 'is-warning']) },
        });
        (item.collegeId ? `学院：${item.collegeName}` : '待补学院');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "admin-course-status-badge is-neutral" },
        });
        (item.teacherName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ([
                    'admin-course-status-badge',
                    item.teacherCollegeMatched === false
                        ? 'is-warning'
                        : item.teacherCollegeMatched === true
                            ? 'is-success'
                            : 'is-neutral',
                ]) },
        });
        (__VLS_ctx.teacherCollegeText(item));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: (['admin-course-status-badge', __VLS_ctx.getContentReadyCount(item) === 4 ? 'is-success' : 'is-warning']) },
        });
        (`课程内容 ${__VLS_ctx.getContentReadyCount(item)}/4`);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-course-crud-item__meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.materialCount);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.videoCount);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.teachingGoal ? '已写教学目标' : '缺教学目标');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.teachingContent ? '已写教学内容' : '缺教学内容');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.teachingIdea ? '已写教学思路' : '缺教学思路');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.updateDate);
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
                if (!(__VLS_ctx.pagination.total > 0))
                    return;
                __VLS_ctx.changePage(__VLS_ctx.pagination.page + 1);
            } },
        type: "button",
        ...{ class: "course-chip course-pagination__nav" },
        disabled: (__VLS_ctx.pagination.page >= __VLS_ctx.pagination.totalPages || __VLS_ctx.loading),
        'aria-label': "下一页",
    });
}
if (__VLS_ctx.editorVisible) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.closeEditor) },
        ...{ class: "admin-course-editor-mask" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "admin-course-editor admin-course-editor--wide" },
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
        (`${teacher.name} · ${teacher.collegeName}`);
    }
    if (__VLS_ctx.teacherSelectionHint) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "admin-course-editor__hint" },
        });
        (__VLS_ctx.teacherSelectionHint);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "admin-manage-field admin-manage-field--full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.editorForm.summary),
        maxlength: "2000",
        placeholder: "概述课程定位、适用对象和资源范围",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "admin-manage-field admin-manage-field--full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.editorForm.teachingGoal),
        maxlength: "5000",
        placeholder: "填写本课程预期达成的教学目标",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "admin-manage-field admin-manage-field--full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.editorForm.teachingContent),
        maxlength: "5000",
        placeholder: "填写课程核心内容、章节安排或重点模块",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "admin-manage-field admin-manage-field--full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.editorForm.teachingIdea),
        maxlength: "5000",
        placeholder: "填写教学组织方式、资源使用思路和课堂实施方法",
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
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item--system']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
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
/** @type {__VLS_StyleScopedClasses['admin-manage-filter-form']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-filter-form--course']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-filter-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['is-highlight']} */ ;
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
/** @type {__VLS_StyleScopedClasses['course-pagination__nav']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['is-active']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination__nav']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor-mask']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor--wide']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor__head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor__form']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor__grid']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor__hint']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field--full']} */ ;
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
            AdminSidebarNav: AdminSidebarNav,
            router: router,
            loading: loading,
            saving: saving,
            deletingId: deletingId,
            errorMessage: errorMessage,
            successMessage: successMessage,
            editorVisible: editorVisible,
            filterCollegeOptions: filterCollegeOptions,
            collegeOptions: collegeOptions,
            courseList: courseList,
            form: form,
            editorForm: editorForm,
            stats: stats,
            pagination: pagination,
            headerText: headerText,
            reminderTexts: reminderTexts,
            currentFilterSummary: currentFilterSummary,
            filteredTeacherOptions: filteredTeacherOptions,
            teacherSelectionHint: teacherSelectionHint,
            editorTitle: editorTitle,
            editorActionText: editorActionText,
            getContentReadyCount: getContentReadyCount,
            teacherCollegeText: teacherCollegeText,
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
