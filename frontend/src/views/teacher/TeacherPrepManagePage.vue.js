import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TeacherSidebarNav from '@/components/navigation/TeacherSidebarNav.vue';
import { createTeacherPrep, deleteTeacherPrep, getTeacherPreps, updateTeacherPrep, } from '@/services/teacher';
import { useAuthStore } from '@/stores/auth';
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const loading = ref(false);
const saving = ref(false);
const deletingId = ref(null);
const editingId = ref(null);
const errorMessage = ref('');
const successMessage = ref('');
const courseOptions = ref([]);
const prepList = ref([]);
const stats = reactive({
    total: 0,
    draftCount: 0,
    publishedCount: 0,
    courseCount: 0,
});
const filters = reactive({
    keyword: '',
    courseId: '',
    status: 'all',
});
const editorForm = reactive({
    courseId: '',
    title: '',
    status: 'draft',
    teachingObjective: '',
    keyPoints: '',
    difficultyPoints: '',
    studentAnalysis: '',
    teachingContent: '',
    teachingProcess: '',
    reflectionNotes: '',
});
const pagination = reactive({
    page: 1,
    pageSize: 6,
    total: 0,
    totalPages: 0,
});
const headerText = computed(() => {
    const name = authStore.profile?.name || authStore.profile?.username || '教师用户';
    return `${name}，这里可以按课程维护完整备课单，先保存草稿，整理完成后再发布。`;
});
const pageNumbers = computed(() => {
    const totalPages = pagination.totalPages || 1;
    return Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5);
});
function normalizePage(value) {
    const page = Number(value);
    return Number.isInteger(page) && page > 0 ? page : 1;
}
function clearMessages() {
    errorMessage.value = '';
    successMessage.value = '';
}
function renderExcerpt(content, fallback = '暂未填写') {
    const text = (content || '').trim();
    if (!text) {
        return fallback;
    }
    return text.length > 90 ? `${text.slice(0, 90)}...` : text;
}
function buildFocusText(item) {
    const keyText = item.keyPoints?.trim() ? `重点：${renderExcerpt(item.keyPoints, '')}` : '';
    const difficultyText = item.difficultyPoints?.trim() ? `难点：${renderExcerpt(item.difficultyPoints, '')}` : '';
    return [keyText, difficultyText].filter(Boolean).join('；') || '暂未填写教学重点与难点';
}
function buildSummary(item) {
    const parts = [
        item.studentAnalysis?.trim() ? `学情：${renderExcerpt(item.studentAnalysis, '')}` : '',
        item.teachingContent?.trim() ? `内容：${renderExcerpt(item.teachingContent, '')}` : '',
        item.reflectionNotes?.trim() ? `反思：${renderExcerpt(item.reflectionNotes, '')}` : '',
    ].filter(Boolean);
    return parts.join(' ｜ ') || '这份备课单还没有填写详细摘要。';
}
function syncFiltersWithRoute() {
    filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : '';
    filters.courseId = typeof route.query.courseId === 'string' ? route.query.courseId : '';
    filters.status = route.query.status === 'draft' || route.query.status === 'published' ? route.query.status : 'all';
}
function updateRoute(page = 1) {
    router.push({
        path: '/teacher/preps',
        query: {
            page: String(page),
            ...(filters.keyword ? { keyword: filters.keyword } : {}),
            ...(filters.courseId ? { courseId: filters.courseId } : {}),
            ...(filters.status !== 'all' ? { status: filters.status } : {}),
        },
    });
}
function applySearch() {
    updateRoute(1);
}
function resetFilters() {
    filters.keyword = '';
    filters.courseId = '';
    filters.status = 'all';
    updateRoute(1);
}
function changePage(page) {
    updateRoute(page);
}
function resetEditor() {
    editingId.value = null;
    editorForm.courseId = '';
    editorForm.title = '';
    editorForm.status = 'draft';
    editorForm.teachingObjective = '';
    editorForm.keyPoints = '';
    editorForm.difficultyPoints = '';
    editorForm.studentAnalysis = '';
    editorForm.teachingContent = '';
    editorForm.teachingProcess = '';
    editorForm.reflectionNotes = '';
}
function startEdit(item) {
    clearMessages();
    editingId.value = item.id;
    editorForm.courseId = String(item.courseId);
    editorForm.title = item.title;
    editorForm.status = item.status === 'published' ? 'published' : 'draft';
    editorForm.teachingObjective = item.teachingObjective;
    editorForm.keyPoints = item.keyPoints;
    editorForm.difficultyPoints = item.difficultyPoints;
    editorForm.studentAnalysis = item.studentAnalysis;
    editorForm.teachingContent = item.teachingContent;
    editorForm.teachingProcess = item.teachingProcess;
    editorForm.reflectionNotes = item.reflectionNotes;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
async function fillPublishState(item, status) {
    clearMessages();
    try {
        const result = await updateTeacherPrep(item.id, {
            courseId: String(item.courseId),
            title: item.title,
            status,
            teachingObjective: item.teachingObjective,
            keyPoints: item.keyPoints,
            difficultyPoints: item.difficultyPoints,
            studentAnalysis: item.studentAnalysis,
            teachingContent: item.teachingContent,
            teachingProcess: item.teachingProcess,
            reflectionNotes: item.reflectionNotes,
        });
        successMessage.value = `备课单“${result.title}”已更新为${result.statusLabel}`;
        await loadPreps();
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '备课单状态更新失败';
    }
}
async function submitPrep() {
    clearMessages();
    if (!editorForm.title || !editorForm.courseId) {
        errorMessage.value = '请先填写备课单标题并选择所属课程';
        return;
    }
    saving.value = true;
    try {
        const payload = {
            courseId: editorForm.courseId,
            title: editorForm.title,
            status: editorForm.status,
            teachingObjective: editorForm.teachingObjective,
            keyPoints: editorForm.keyPoints,
            difficultyPoints: editorForm.difficultyPoints,
            studentAnalysis: editorForm.studentAnalysis,
            teachingContent: editorForm.teachingContent,
            teachingProcess: editorForm.teachingProcess,
            reflectionNotes: editorForm.reflectionNotes,
        };
        if (editingId.value) {
            const result = await updateTeacherPrep(editingId.value, payload);
            successMessage.value = `备课单“${result.title}”已保存`;
        }
        else {
            const result = await createTeacherPrep(payload);
            successMessage.value = `备课单“${result.title}”已创建`;
        }
        resetEditor();
        await loadPreps();
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '备课单保存失败';
    }
    finally {
        saving.value = false;
    }
}
async function removePrep(item) {
    clearMessages();
    if (!window.confirm(`确认删除备课单“${item.title}”吗？`)) {
        return;
    }
    deletingId.value = item.id;
    try {
        await deleteTeacherPrep(item.id);
        successMessage.value = `备课单“${item.title}”已删除`;
        if (editingId.value === item.id) {
            resetEditor();
        }
        await loadPreps();
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '备课单删除失败';
    }
    finally {
        deletingId.value = null;
    }
}
async function loadPreps() {
    loading.value = true;
    clearMessages();
    syncFiltersWithRoute();
    try {
        const data = await getTeacherPreps({
            page: normalizePage(route.query.page),
            pageSize: 6,
            keyword: filters.keyword,
            courseId: filters.courseId,
            status: filters.status,
        });
        prepList.value = data.list;
        courseOptions.value = data.filters.courses;
        stats.total = data.stats.total;
        stats.draftCount = data.stats.draftCount;
        stats.publishedCount = data.stats.publishedCount;
        stats.courseCount = data.stats.courseCount;
        pagination.page = data.pagination.page;
        pagination.pageSize = data.pagination.pageSize;
        pagination.total = data.pagination.total;
        pagination.totalPages = data.pagination.totalPages;
    }
    catch (error) {
        prepList.value = [];
        courseOptions.value = [];
        stats.total = 0;
        stats.draftCount = 0;
        stats.publishedCount = 0;
        stats.courseCount = 0;
        pagination.page = 1;
        pagination.pageSize = 6;
        pagination.total = 0;
        pagination.totalPages = 0;
        errorMessage.value = error?.response?.data?.message || '备课单列表加载失败';
    }
    finally {
        loading.value = false;
    }
}
watch(() => route.fullPath, () => {
    loadPreps();
}, { immediate: true });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "teacher-dashboard-page prep-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "teacher-dashboard-sidebar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-sidebar__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
/** @type {[typeof TeacherSidebarNav, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(TeacherSidebarNav, new TeacherSidebarNav({
    active: "preps",
}));
const __VLS_1 = __VLS_0({
    active: "preps",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
if (false) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
        ...{ class: "teacher-dashboard-nav" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(false))
                    return;
                __VLS_ctx.router.push('/teacher');
            } },
        type: "button",
        ...{ class: "teacher-dashboard-nav__item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(false))
                    return;
                __VLS_ctx.router.push('/teacher/materials');
            } },
        type: "button",
        ...{ class: "teacher-dashboard-nav__item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(false))
                    return;
                __VLS_ctx.router.push('/teacher/assets');
            } },
        type: "button",
        ...{ class: "teacher-dashboard-nav__item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        type: "button",
        ...{ class: "teacher-dashboard-nav__item is-active" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(false))
                    return;
                __VLS_ctx.router.push('/teacher/resources');
            } },
        type: "button",
        ...{ class: "teacher-dashboard-nav__item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(false))
                    return;
                __VLS_ctx.router.push('/teacher/profile');
            } },
        type: "button",
        ...{ class: "teacher-dashboard-nav__item" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "teacher-dashboard-main prep-manage-main" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "my-resources-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "my-resources-head__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.headerText);
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "course-feedback" },
    });
    (__VLS_ctx.errorMessage);
}
if (__VLS_ctx.successMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "feedback-text feedback-text--success my-resources-feedback" },
    });
    (__VLS_ctx.successMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "my-resources-stats" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "my-resources-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.total);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "my-resources-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.draftCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "my-resources-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.publishedCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "my-resources-stat-card is-highlight" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.courseCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "my-resources-filter-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "my-resources-filter-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "my-resources-filter-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "my-resources-panel__meta" },
});
(__VLS_ctx.pagination.total);
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.applySearch) },
    ...{ class: "my-resources-filter-form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "my-resources-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.filters.keyword),
    type: "text",
    maxlength: "200",
    placeholder: "搜索标题、教学内容或课程名",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "my-resources-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.filters.courseId),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
for (const [course] of __VLS_getVForSourceType((__VLS_ctx.courseOptions))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (course.id),
        value: (String(course.id)),
    });
    (course.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "my-resources-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.filters.status),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "all",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "draft",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "published",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "my-resources-filter-actions" },
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
(__VLS_ctx.loading ? '加载中...' : '搜索备课单');
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "prep-manage-editor my-resources-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "my-resources-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "my-resources-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
(__VLS_ctx.editingId ? '编辑备课单' : '新建备课单');
if (__VLS_ctx.editingId) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.resetEditor) },
        type: "button",
        ...{ class: "course-chip course-chip--soft" },
        disabled: (__VLS_ctx.saving),
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.submitPrep) },
    ...{ class: "prep-manage-form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "my-resources-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.editorForm.title),
    type: "text",
    maxlength: "200",
    placeholder: "请输入备课单标题",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "my-resources-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.editorForm.courseId),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
for (const [course] of __VLS_getVForSourceType((__VLS_ctx.courseOptions))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (course.id),
        value: (String(course.id)),
    });
    (course.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "my-resources-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.editorForm.status),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "draft",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "published",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "prep-manage-form__hint" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "my-resources-field my-resources-field--full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.editorForm.teachingObjective),
    rows: "3",
    maxlength: "5000",
    placeholder: "本节课希望达成的核心目标",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "my-resources-field my-resources-field--full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.editorForm.keyPoints),
    rows: "3",
    maxlength: "5000",
    placeholder: "需要重点讲解和强调的内容",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "my-resources-field my-resources-field--full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.editorForm.difficultyPoints),
    rows: "3",
    maxlength: "5000",
    placeholder: "学生理解或教师组织上的难点",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "my-resources-field my-resources-field--full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.editorForm.studentAnalysis),
    rows: "3",
    maxlength: "5000",
    placeholder: "结合学生基础、学习习惯和课程实际情况进行说明",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "my-resources-field my-resources-field--full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.editorForm.teachingContent),
    rows: "4",
    maxlength: "5000",
    placeholder: "概括本次课程的主要内容安排",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "my-resources-field my-resources-field--full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.editorForm.teachingProcess),
    rows: "5",
    maxlength: "5000",
    placeholder: "按环节整理导入、讲授、互动、练习与总结过程",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "my-resources-field my-resources-field--full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.editorForm.reflectionNotes),
    rows: "3",
    maxlength: "5000",
    placeholder: "记录课后总结、改进建议或补充备注",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "my-resources-filter-actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
    ...{ class: "auth-btn" },
    disabled: (__VLS_ctx.saving),
});
(__VLS_ctx.saving ? '提交中...' : __VLS_ctx.editingId ? '保存备课单' : '创建备课单');
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.resetEditor) },
    type: "button",
    ...{ class: "auth-btn auth-btn--secondary" },
    disabled: (__VLS_ctx.saving),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "my-resources-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "my-resources-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "my-resources-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "my-resources-panel__meta" },
});
if (__VLS_ctx.prepList.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "prep-manage-list" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.prepList))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (item.id),
            ...{ class: "prep-manage-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "prep-manage-item__header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (item.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "prep-manage-item__meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "teacher-dashboard-tag" },
        });
        (item.statusLabel);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.courseName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "prep-manage-item__time" },
        });
        (item.updateTime);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "prep-manage-item__summary" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.buildSummary(item));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "prep-manage-item__sections" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            ...{ class: "prep-manage-item__section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.renderExcerpt(item.teachingObjective));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            ...{ class: "prep-manage-item__section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.buildFocusText(item));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            ...{ class: "prep-manage-item__section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.renderExcerpt(item.teachingProcess));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "prep-manage-item__actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.prepList.length))
                        return;
                    __VLS_ctx.startEdit(item);
                } },
            type: "button",
            ...{ class: "course-chip" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.prepList.length))
                        return;
                    __VLS_ctx.fillPublishState(item, item.status === 'published' ? 'draft' : 'published');
                } },
            type: "button",
            ...{ class: "course-chip course-chip--soft" },
        });
        (item.status === 'published' ? '转为草稿' : '直接发布');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.prepList.length))
                        return;
                    __VLS_ctx.removePrep(item);
                } },
            type: "button",
            ...{ class: "course-chip my-resources-delete-btn" },
            disabled: (__VLS_ctx.deletingId === item.id),
        });
        (__VLS_ctx.deletingId === item.id ? '删除中...' : '删除');
    }
}
else if (!__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "course-pagination my-resources-pagination" },
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
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-page']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-page']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-sidebar__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['is-active']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-main']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-main']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-head']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-head__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text--success']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['is-highlight']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-filter-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-filter-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-filter-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-panel__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-filter-form']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-filter-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-editor']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-form']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-form__hint']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-filter-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-panel__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-list']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-item']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-item__header']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-item__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-item__time']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-item__summary']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-item__sections']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-item__section']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-item__section']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-item__section']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-item__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination__desc']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            TeacherSidebarNav: TeacherSidebarNav,
            router: router,
            loading: loading,
            saving: saving,
            deletingId: deletingId,
            editingId: editingId,
            errorMessage: errorMessage,
            successMessage: successMessage,
            courseOptions: courseOptions,
            prepList: prepList,
            stats: stats,
            filters: filters,
            editorForm: editorForm,
            pagination: pagination,
            headerText: headerText,
            pageNumbers: pageNumbers,
            renderExcerpt: renderExcerpt,
            buildFocusText: buildFocusText,
            buildSummary: buildSummary,
            applySearch: applySearch,
            resetFilters: resetFilters,
            changePage: changePage,
            resetEditor: resetEditor,
            startEdit: startEdit,
            fillPublishState: fillPublishState,
            submitPrep: submitPrep,
            removePrep: removePrep,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
