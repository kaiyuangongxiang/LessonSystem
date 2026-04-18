import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TeacherSidebarNav from '@/components/navigation/TeacherSidebarNav.vue';
import { deleteTeacherResource, getTeacherResourceDetail, getTeacherResources, updateTeacherResource, } from '@/services/teacher';
import { useAuthStore } from '@/stores/auth';
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const loading = ref(false);
const saving = ref(false);
const deletingId = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const courseOptions = ref([]);
const resourceList = ref([]);
const editingItem = ref(null);
const form = reactive({
    keyword: '',
    courseId: '',
    type: 'all',
});
const editForm = reactive({
    title: '',
    courseId: '',
    description: '',
});
const stats = reactive({
    total: 0,
    materialCount: 0,
    videoCount: 0,
    interactionCount: 0,
});
const pagination = reactive({
    page: 1,
    pageSize: 4,
    total: 0,
    totalPages: 0,
});
const headerText = computed(() => {
    const name = authStore.profile?.name || authStore.profile?.username || '教师用户';
    return `${name}，这里统一查看本人上传的资料与视频，并继续维护资源内容。`;
});
function normalizePage(value) {
    const page = Number(value);
    return Number.isInteger(page) && page > 0 ? page : 1;
}
function formatFileSize(size) {
    if (size >= 1024 * 1024 * 1024) {
        return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
    }
    if (size >= 1024 * 1024) {
        return `${(size / 1024 / 1024).toFixed(2)} MB`;
    }
    return `${(size / 1024).toFixed(2)} KB`;
}
function buildApiUrl(path) {
    if (!path) {
        return '#';
    }
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}${path}`;
}
function clearMessages() {
    errorMessage.value = '';
    successMessage.value = '';
}
function syncFormWithRoute() {
    form.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : '';
    form.courseId = typeof route.query.courseId === 'string' ? route.query.courseId : '';
    form.type = route.query.type === 'material' || route.query.type === 'video' ? route.query.type : 'all';
}
function updateRoute(page = 1) {
    router.push({
        path: '/teacher/resources',
        query: {
            page: String(page),
            ...(form.keyword ? { keyword: form.keyword } : {}),
            ...(form.courseId ? { courseId: form.courseId } : {}),
            ...(form.type !== 'all' ? { type: form.type } : {}),
        },
    });
}
function applySearch() {
    updateRoute(1);
}
function resetFilters() {
    clearMessages();
    form.keyword = '';
    form.courseId = '';
    form.type = 'all';
    updateRoute(1);
}
function changePage(page) {
    editingItem.value = null;
    updateRoute(page);
}
function cancelEdit() {
    editingItem.value = null;
    editForm.title = '';
    editForm.courseId = '';
    editForm.description = '';
}
function viewResource(item) {
    window.open(buildApiUrl(item.previewUrl), '_blank', 'noopener,noreferrer');
}
async function startEdit(item) {
    clearMessages();
    try {
        const detail = await getTeacherResourceDetail(item.type, item.id);
        editingItem.value = detail;
        editForm.title = detail.title;
        editForm.courseId = String(detail.courseId);
        editForm.description = detail.description;
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '资源详情加载失败';
    }
}
async function submitEdit() {
    clearMessages();
    if (!editingItem.value) {
        return;
    }
    if (!editForm.title) {
        errorMessage.value = editingItem.value.type === 'video' ? '请输入视频标题' : '请输入资料名称';
        return;
    }
    if (!editForm.courseId) {
        errorMessage.value = '请选择所属课程';
        return;
    }
    saving.value = true;
    try {
        const result = await updateTeacherResource(editingItem.value.type, editingItem.value.id, {
            title: editForm.title,
            courseId: editForm.courseId,
            description: editForm.description,
        });
        successMessage.value = `资源《${result.title}》更新成功。`;
        cancelEdit();
        await loadResources();
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '资源更新失败';
    }
    finally {
        saving.value = false;
    }
}
async function removeItem(item) {
    clearMessages();
    if (!window.confirm(`确认删除资源《${item.title}》吗？`)) {
        return;
    }
    deletingId.value = `${item.type}-${item.id}`;
    try {
        await deleteTeacherResource(item.type, item.id);
        successMessage.value = `资源《${item.title}》已删除。`;
        if (editingItem.value?.id === item.id && editingItem.value.type === item.type) {
            cancelEdit();
        }
        await loadResources();
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '资源删除失败';
    }
    finally {
        deletingId.value = '';
    }
}
async function loadResources() {
    loading.value = true;
    clearMessages();
    syncFormWithRoute();
    try {
        const data = await getTeacherResources({
            page: normalizePage(route.query.page),
            pageSize: 4,
            keyword: form.keyword,
            courseId: form.courseId,
            type: form.type,
        });
        resourceList.value = data.list;
        courseOptions.value = data.filters.courses;
        stats.total = data.stats.total;
        stats.materialCount = data.stats.materialCount;
        stats.videoCount = data.stats.videoCount;
        stats.interactionCount = data.stats.interactionCount;
        pagination.page = data.pagination.page;
        pagination.pageSize = data.pagination.pageSize;
        pagination.total = data.pagination.total;
        pagination.totalPages = data.pagination.totalPages;
    }
    catch (error) {
        resourceList.value = [];
        courseOptions.value = [];
        stats.total = 0;
        stats.materialCount = 0;
        stats.videoCount = 0;
        stats.interactionCount = 0;
        pagination.page = 1;
        pagination.pageSize = 4;
        pagination.total = 0;
        pagination.totalPages = 0;
        errorMessage.value = error?.response?.data?.message || '我的资源加载失败';
    }
    finally {
        loading.value = false;
    }
}
watch(() => route.fullPath, () => {
    loadResources();
}, { immediate: true });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "teacher-dashboard-page" },
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
    active: "resources",
}));
const __VLS_1 = __VLS_0({
    active: "resources",
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
        ...{ onClick: (...[$event]) => {
                if (!(false))
                    return;
                __VLS_ctx.router.push('/teacher/preps');
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
                __VLS_ctx.router.push('/teacher/profile');
            } },
        type: "button",
        ...{ class: "teacher-dashboard-nav__item" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "teacher-dashboard-main my-resources-main" },
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "my-resources-head__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher/materials');
        } },
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
        ...{ class: "feedback-text feedback-text--success my-resources-feedback" },
    });
    (__VLS_ctx.successMessage);
}
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.applySearch) },
    ...{ class: "my-resources-filter-form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "my-resources-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.form.keyword),
    type: "text",
    maxlength: "200",
    placeholder: "搜索资源名称",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "my-resources-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.form.courseId),
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
    value: (__VLS_ctx.form.type),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "all",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "material",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "video",
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
(__VLS_ctx.loading ? '加载中...' : '搜索资源');
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
(__VLS_ctx.stats.materialCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "my-resources-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.videoCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "my-resources-stat-card is-highlight" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.interactionCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
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
(__VLS_ctx.pagination.total);
if (__VLS_ctx.editingItem) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "my-resources-editor" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "my-resources-editor__head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "my-resources-panel__eyebrow" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
    (__VLS_ctx.editingItem.type === 'video' ? '视频' : '资料');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.cancelEdit) },
        type: "button",
        ...{ class: "course-chip course-chip--soft" },
        disabled: (__VLS_ctx.saving),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
        ...{ onSubmit: (__VLS_ctx.submitEdit) },
        ...{ class: "my-resources-editor__form" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "my-resources-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.editingItem.type === 'video' ? '视频标题' : '资料名称');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.editForm.title),
        type: "text",
        maxlength: "200",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "my-resources-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.editForm.courseId),
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
        ...{ class: "my-resources-field my-resources-field--full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.editForm.description),
        maxlength: "2000",
        rows: "4",
        placeholder: "补充资源用途、章节范围或更新说明",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "my-resources-filter-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        type: "submit",
        ...{ class: "auth-btn" },
        disabled: (__VLS_ctx.saving),
    });
    (__VLS_ctx.saving ? '保存中...' : '保存修改');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.cancelEdit) },
        type: "button",
        ...{ class: "auth-btn auth-btn--secondary" },
        disabled: (__VLS_ctx.saving),
    });
}
if (__VLS_ctx.resourceList.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "my-resources-table" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "my-resources-table__head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.resourceList))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (`${item.type}-${item.id}`),
            ...{ class: "my-resources-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "my-resources-row__title" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (item.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (item.description || `${item.fileName} · ${__VLS_ctx.formatFileSize(item.fileSize)}`);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: (['teacher-dashboard-tag', item.type === 'video' ? 'is-video' : 'is-material']) },
        });
        (item.type === 'video' ? '视频' : '资料');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "my-resources-row__cell" },
        });
        (item.courseName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "my-resources-row__cell" },
        });
        (item.uploadTime);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "my-resources-row__cell" },
        });
        (item.interactionCount);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "my-resources-row__actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.resourceList.length))
                        return;
                    __VLS_ctx.viewResource(item);
                } },
            type: "button",
            ...{ class: "course-chip course-chip--soft" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.resourceList.length))
                        return;
                    __VLS_ctx.startEdit(item);
                } },
            type: "button",
            ...{ class: "course-chip" },
            disabled: (__VLS_ctx.saving),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.resourceList.length))
                        return;
                    __VLS_ctx.removeItem(item);
                } },
            type: "button",
            ...{ class: "course-chip my-resources-delete-btn" },
            disabled: (__VLS_ctx.deletingId === `${item.type}-${item.id}`),
        });
        (__VLS_ctx.deletingId === `${item.type}-${item.id}` ? '删除中...' : '删除');
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-pagination__actions" },
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
    ...{ class: "course-page-btn is-active" },
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
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-page']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-sidebar__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['is-active']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-main']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-main']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-head']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-head__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-head__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['course-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text--success']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-filter-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-filter-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-filter-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-filter-form']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-filter-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['is-highlight']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-panel__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-editor']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-editor__head']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-editor__form']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-filter-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-table']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-table__head']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-row']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-row__title']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-row__cell']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-row__cell']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-row__cell']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-row__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination__desc']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination__nav']} */ ;
/** @type {__VLS_StyleScopedClasses['course-page-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['is-active']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination__nav']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            TeacherSidebarNav: TeacherSidebarNav,
            router: router,
            loading: loading,
            saving: saving,
            deletingId: deletingId,
            errorMessage: errorMessage,
            successMessage: successMessage,
            courseOptions: courseOptions,
            resourceList: resourceList,
            editingItem: editingItem,
            form: form,
            editForm: editForm,
            stats: stats,
            pagination: pagination,
            headerText: headerText,
            formatFileSize: formatFileSize,
            applySearch: applySearch,
            resetFilters: resetFilters,
            changePage: changePage,
            cancelEdit: cancelEdit,
            viewResource: viewResource,
            startEdit: startEdit,
            submitEdit: submitEdit,
            removeItem: removeItem,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
