import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TeacherSidebarNav from '@/components/navigation/TeacherSidebarNav.vue';
import TeacherWorkspaceDialog from '@/components/TeacherWorkspaceDialog.vue';
import { addTeacherPrepAssetAttachments, createTeacherPrep, deleteTeacherPrep, deleteTeacherPrepAttachment, getTeacherAssets, getTeacherPreps, previewTeacherPrepAttachment, updateTeacherPrep, } from '@/services/teacher';
import { useAuthStore } from '@/stores/auth';
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const loading = ref(false);
const saving = ref(false);
const attachingAssets = ref(false);
const deletingPrepId = ref(null);
const deletingAttachmentId = ref(null);
const editingId = ref(null);
const showEditorDialog = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const courseOptions = ref([]);
const prepList = ref([]);
const personalAssetOptions = ref([]);
const editorAttachments = ref([]);
const selectedAssetIds = ref([]);
const assetTypeFilter = ref('all');
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
    teachingContent: '',
});
const pagination = reactive({
    page: 1,
    pageSize: 6,
    total: 0,
    totalPages: 0,
});
const headerText = computed(() => {
    const name = authStore.profile?.name || authStore.profile?.username || '教师用户';
    return `${name}，这里可以维护教学内容，并为备课单挂载个人素材。`;
});
const pageNumbers = computed(() => {
    const totalPages = pagination.totalPages || 1;
    return Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1);
});
const assetTypeOptions = [
    { value: 'image', label: '图片' },
    { value: 'audio', label: '音频' },
    { value: 'video', label: '视频' },
    { value: 'text', label: '文本' },
    { value: 'file', label: '文件' },
];
const canAttachAssets = computed(() => Boolean(editorForm.title.trim()) && Boolean(editorForm.courseId) && Boolean(editorForm.teachingContent.trim()));
const filteredPersonalAssetOptions = computed(() => {
    if (assetTypeFilter.value === 'all') {
        return personalAssetOptions.value;
    }
    return personalAssetOptions.value.filter((item) => item.type === assetTypeFilter.value);
});
const dialogBusy = computed(() => saving.value || attachingAssets.value || deletingAttachmentId.value !== null);
function normalizePage(value) {
    const page = Number(value);
    return Number.isInteger(page) && page > 0 ? page : 1;
}
function clearMessages() {
    errorMessage.value = '';
    successMessage.value = '';
}
function renderExcerpt(content, fallback = '暂无内容') {
    const text = (content || '').trim();
    if (!text)
        return fallback;
    return text.length > 140 ? `${text.slice(0, 140)}...` : text;
}
function assetTypeLabel(type) {
    const labels = {
        image: '图片',
        audio: '音频',
        video: '视频',
        text: '文本',
        file: '文件',
    };
    return labels[type] || type;
}
function fillEditor(item) {
    editingId.value = item.id;
    editorForm.courseId = String(item.courseId);
    editorForm.title = item.title;
    editorForm.status = item.status === 'published' ? 'published' : 'draft';
    editorForm.teachingContent = item.teachingContent;
    editorAttachments.value = item.attachments || [];
    selectedAssetIds.value = [];
    assetTypeFilter.value = 'all';
}
function resetEditor() {
    editingId.value = null;
    editorForm.courseId = '';
    editorForm.title = '';
    editorForm.status = 'draft';
    editorForm.teachingContent = '';
    editorAttachments.value = [];
    selectedAssetIds.value = [];
    assetTypeFilter.value = 'all';
}
function syncPrepListItem(item) {
    const index = prepList.value.findIndex((prep) => prep.id === item.id);
    if (index === -1) {
        return;
    }
    prepList.value.splice(index, 1, {
        ...prepList.value[index],
        ...item,
        attachments: Array.isArray(item.attachments) ? item.attachments : prepList.value[index].attachments,
        attachmentCount: Array.isArray(item.attachments) ? item.attachments.length : item.attachmentCount,
    });
}
function syncPrepListAttachments(prepId, attachments) {
    const index = prepList.value.findIndex((prep) => prep.id === prepId);
    if (index === -1) {
        return;
    }
    prepList.value.splice(index, 1, {
        ...prepList.value[index],
        attachments,
        attachmentCount: attachments.length,
    });
}
function openCreateDialog() {
    clearMessages();
    resetEditor();
    showEditorDialog.value = true;
}
function closeEditorDialog(force = false) {
    if (dialogBusy.value && !force) {
        return;
    }
    showEditorDialog.value = false;
    errorMessage.value = '';
    resetEditor();
}
function syncFiltersWithRoute() {
    filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : '';
    filters.courseId = typeof route.query.courseId === 'string' ? route.query.courseId : '';
    filters.status = route.query.status === 'draft' || route.query.status === 'published' ? route.query.status : 'all';
}
function updateRoute(page = 1) {
    void router.push({
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
function startEdit(item) {
    clearMessages();
    fillEditor(item);
    showEditorDialog.value = true;
}
async function previewAttachment(attachmentId) {
    try {
        await previewTeacherPrepAttachment(attachmentId);
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '备课附件预览失败';
    }
}
function buildPrepPayload() {
    return {
        courseId: editorForm.courseId,
        title: editorForm.title.trim(),
        status: editorForm.status,
        teachingContent: editorForm.teachingContent.trim(),
    };
}
async function ensurePrepForAttachments() {
    if (editingId.value) {
        return editingId.value;
    }
    if (!canAttachAssets.value) {
        errorMessage.value = '请先填写标题、所属课程和教学内容，再挂载素材';
        return null;
    }
    const createdPrep = await createTeacherPrep(buildPrepPayload());
    editingId.value = createdPrep.id;
    editorForm.status = createdPrep.status === 'published' ? 'published' : 'draft';
    editorAttachments.value = createdPrep.attachments || [];
    await loadPreps();
    syncPrepListItem(createdPrep);
    successMessage.value = `备课单“${createdPrep.title}”已自动创建，可继续挂载素材`;
    return createdPrep.id;
}
async function submitPrep() {
    clearMessages();
    if (!canAttachAssets.value) {
        errorMessage.value = '请先填写标题、所属课程和教学内容';
        return;
    }
    saving.value = true;
    try {
        const isEditing = Boolean(editingId.value);
        const pendingAssetIds = [...selectedAssetIds.value];
        const payload = buildPrepPayload();
        const result = editingId.value ? await updateTeacherPrep(editingId.value, payload) : await createTeacherPrep(payload);
        let syncedPrep = result;
        if (pendingAssetIds.length) {
            const attachmentResult = await addTeacherPrepAssetAttachments(result.id, pendingAssetIds);
            editorAttachments.value = attachmentResult.attachments;
            selectedAssetIds.value = [];
            syncedPrep = {
                ...result,
                attachments: attachmentResult.attachments,
                attachmentCount: attachmentResult.attachments.length,
            };
        }
        await loadPreps();
        syncPrepListItem(syncedPrep);
        successMessage.value = isEditing
            ? `备课单“${result.title}”已保存${pendingAssetIds.length ? '，所选素材已同步挂载' : ''}`
            : `备课单“${result.title}”已创建${pendingAssetIds.length ? '，所选素材已同步挂载' : ''}`;
        closeEditorDialog(true);
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '备课单保存失败';
    }
    finally {
        saving.value = false;
    }
}
async function toggleStatus(item) {
    clearMessages();
    try {
        const result = await updateTeacherPrep(item.id, {
            courseId: String(item.courseId),
            title: item.title,
            status: item.status === 'published' ? 'draft' : 'published',
            teachingContent: item.teachingContent,
        });
        await loadPreps();
        if (editingId.value === item.id) {
            fillEditor(result);
        }
        successMessage.value = `备课单“${result.title}”已更新为${result.statusLabel}`;
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '备课单状态更新失败';
    }
}
async function attachSelectedAssets() {
    if (!selectedAssetIds.value.length) {
        errorMessage.value = '请先勾选要挂载的个人素材';
        return;
    }
    attachingAssets.value = true;
    clearMessages();
    try {
        const prepId = await ensurePrepForAttachments();
        if (!prepId) {
            return;
        }
        const result = await addTeacherPrepAssetAttachments(prepId, selectedAssetIds.value);
        editorAttachments.value = result.attachments;
        syncPrepListAttachments(prepId, result.attachments);
        selectedAssetIds.value = [];
        await loadPreps();
        successMessage.value = '个人素材已挂载到当前备课单';
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '个人素材挂载失败';
    }
    finally {
        attachingAssets.value = false;
    }
}
async function removeAttachment(attachment) {
    if (!editingId.value)
        return;
    deletingAttachmentId.value = attachment.id;
    clearMessages();
    try {
        await deleteTeacherPrepAttachment(editingId.value, attachment.id);
        editorAttachments.value = editorAttachments.value.filter((item) => item.id !== attachment.id);
        syncPrepListAttachments(editingId.value, editorAttachments.value);
        await loadPreps();
        successMessage.value = `已移除附件“${attachment.title}”`;
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '附件移除失败';
    }
    finally {
        deletingAttachmentId.value = null;
    }
}
async function removePrep(item) {
    clearMessages();
    if (!window.confirm(`确认删除备课单“${item.title}”吗？`)) {
        return;
    }
    deletingPrepId.value = item.id;
    try {
        await deleteTeacherPrep(item.id);
        if (editingId.value === item.id) {
            closeEditorDialog();
        }
        await loadPreps();
        successMessage.value = `备课单“${item.title}”已删除`;
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '备课单删除失败';
    }
    finally {
        deletingPrepId.value = null;
    }
}
async function loadPersonalAssets() {
    try {
        const data = await getTeacherAssets({
            page: 1,
            pageSize: 60,
            type: 'all',
            visibility: 'all',
        });
        personalAssetOptions.value = data.list;
    }
    catch {
        personalAssetOptions.value = [];
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
        if (editingId.value) {
            const current = data.list.find((item) => item.id === editingId.value);
            if (current) {
                editorAttachments.value = current.attachments || [];
            }
        }
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
    loadPersonalAssets();
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "my-resources-head__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.openCreateDialog) },
    type: "button",
    ...{ class: "auth-btn" },
});
if (__VLS_ctx.errorMessage && !__VLS_ctx.showEditorDialog) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "course-feedback" },
    });
    (__VLS_ctx.errorMessage);
}
if (__VLS_ctx.successMessage && !__VLS_ctx.showEditorDialog) {
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
    placeholder: "搜索标题、课程名或教学内容",
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
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.attachmentCount);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "prep-manage-item__time" },
        });
        (item.updateTime);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "prep-manage-item__summary" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.renderExcerpt(item.teachingContent, '暂未填写教学内容'));
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
                    __VLS_ctx.toggleStatus(item);
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
            disabled: (__VLS_ctx.deletingPrepId === item.id),
        });
        (__VLS_ctx.deletingPrepId === item.id ? '删除中...' : '删除');
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
/** @type {[typeof TeacherWorkspaceDialog, typeof TeacherWorkspaceDialog, ]} */ ;
// @ts-ignore
const __VLS_3 = __VLS_asFunctionalComponent(TeacherWorkspaceDialog, new TeacherWorkspaceDialog({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showEditorDialog),
    eyebrow: "PREP EDITOR",
    title: (__VLS_ctx.editingId ? '编辑备课单' : '新建备课单'),
    description: (__VLS_ctx.editingId ? '在弹窗内继续维护教学内容和附件，不再挤占列表区域。' : '先保存基础信息，再继续挂载附件或个人素材。'),
    size: "wide",
    disabled: (__VLS_ctx.dialogBusy),
}));
const __VLS_4 = __VLS_3({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showEditorDialog),
    eyebrow: "PREP EDITOR",
    title: (__VLS_ctx.editingId ? '编辑备课单' : '新建备课单'),
    description: (__VLS_ctx.editingId ? '在弹窗内继续维护教学内容和附件，不再挤占列表区域。' : '先保存基础信息，再继续挂载附件或个人素材。'),
    size: "wide",
    disabled: (__VLS_ctx.dialogBusy),
}, ...__VLS_functionalComponentArgsRest(__VLS_3));
let __VLS_6;
let __VLS_7;
let __VLS_8;
const __VLS_9 = {
    onClose: (__VLS_ctx.closeEditorDialog)
};
__VLS_5.slots.default;
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "course-feedback teacher-workspace-dialog__feedback" },
    });
    (__VLS_ctx.errorMessage);
}
if (__VLS_ctx.successMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "feedback-text feedback-text--success my-resources-feedback teacher-workspace-dialog__feedback" },
    });
    (__VLS_ctx.successMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.submitPrep) },
    id: "teacher-prep-editor-form",
    ...{ class: "prep-manage-form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "my-resources-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "auth-required" },
});
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "auth-required" },
});
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "auth-required" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.editorForm.teachingContent),
    rows: "10",
    maxlength: "5000",
    placeholder: "请输入本次备课的教学内容安排、重点说明和课堂组织内容",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "my-resources-panel teacher-workspace-dialog__section" },
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
(__VLS_ctx.editingId ? `当前附件 ${__VLS_ctx.editorAttachments.length}` : __VLS_ctx.canAttachAssets ? '必填项已完成，可直接挂载素材' : '请先填写必填项后再挂载素材');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "prep-manage-attachment-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "prep-manage-attachment-box" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "prep-manage-asset-toolbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "prep-manage-asset-filter" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.assetTypeFilter),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "all",
});
for (const [type] of __VLS_getVForSourceType((__VLS_ctx.assetTypeOptions))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (type.value),
        value: (type.value),
    });
    (type.label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "prep-manage-asset-toolbar__meta" },
});
(__VLS_ctx.filteredPersonalAssetOptions.length);
(__VLS_ctx.assetTypeFilter !== 'all' ? ` · ${__VLS_ctx.assetTypeLabel(__VLS_ctx.assetTypeFilter)}` : '');
if (__VLS_ctx.filteredPersonalAssetOptions.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "prep-manage-asset-select" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.filteredPersonalAssetOptions))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            key: (item.id),
            ...{ class: "prep-manage-asset-option" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            type: "checkbox",
            value: (item.id),
            disabled: (((!__VLS_ctx.canAttachAssets && !__VLS_ctx.editingId) || __VLS_ctx.attachingAssets)),
        });
        (__VLS_ctx.selectedAssetIds);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (item.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.assetTypeLabel(item.type));
        (item.visibility === 'public' ? '公开' : '私密');
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty course-detail-empty--compact" },
    });
    (__VLS_ctx.personalAssetOptions.length ? '当前筛选条件下没有可挂载的素材。' : '当前还没有可选择的个人素材。');
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "prep-manage-attachment-box__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.attachSelectedAssets) },
    type: "button",
    ...{ class: "course-chip course-chip--soft" },
    disabled: (((!__VLS_ctx.canAttachAssets && !__VLS_ctx.editingId) || __VLS_ctx.attachingAssets || !__VLS_ctx.selectedAssetIds.length)),
});
(__VLS_ctx.attachingAssets ? '挂载中...' : `挂载 ${__VLS_ctx.selectedAssetIds.length || 0} 个素材`);
if (__VLS_ctx.editorAttachments.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "prep-manage-attachment-list" },
    });
    for (const [attachment] of __VLS_getVForSourceType((__VLS_ctx.editorAttachments))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (attachment.id),
            ...{ class: "prep-manage-attachment-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (attachment.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (attachment.sourceLabel);
        (__VLS_ctx.assetTypeLabel(attachment.type));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "prep-manage-attachment-item__actions" },
        });
        if (attachment.downloadUrl) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.editorAttachments.length))
                            return;
                        if (!(attachment.downloadUrl))
                            return;
                        __VLS_ctx.previewAttachment(attachment.id);
                    } },
                type: "button",
                ...{ class: "course-chip course-chip--soft" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.editorAttachments.length))
                        return;
                    __VLS_ctx.removeAttachment(attachment);
                } },
            type: "button",
            ...{ class: "course-chip my-resources-delete-btn" },
            disabled: (__VLS_ctx.deletingAttachmentId === attachment.id),
        });
        (__VLS_ctx.deletingAttachmentId === attachment.id ? '移除中...' : '移除');
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty course-detail-empty--compact" },
    });
    (__VLS_ctx.editingId ? '当前备课单还没有挂载素材。' : '');
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "my-resources-filter-actions prep-manage-form__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
    form: "teacher-prep-editor-form",
    ...{ class: "auth-btn" },
    disabled: (__VLS_ctx.saving || __VLS_ctx.attachingAssets),
});
(__VLS_ctx.saving ? '保存中...' : __VLS_ctx.editingId ? '保存备课单' : '创建备课单');
var __VLS_5;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-page']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-page']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-sidebar__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-main']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-main']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-head']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-head__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-head__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
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
/** @type {__VLS_StyleScopedClasses['course-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-workspace-dialog__feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text--success']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-workspace-dialog__feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-form']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-required']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-required']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-form__hint']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-required']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-workspace-dialog__section']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-panel__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-attachment-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-attachment-box']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-asset-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-asset-filter']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-asset-toolbar__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-asset-select']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-asset-option']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-attachment-box__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-attachment-list']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-attachment-item']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-attachment-item__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-filter-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['prep-manage-form__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            TeacherSidebarNav: TeacherSidebarNav,
            TeacherWorkspaceDialog: TeacherWorkspaceDialog,
            loading: loading,
            saving: saving,
            attachingAssets: attachingAssets,
            deletingPrepId: deletingPrepId,
            deletingAttachmentId: deletingAttachmentId,
            editingId: editingId,
            showEditorDialog: showEditorDialog,
            errorMessage: errorMessage,
            successMessage: successMessage,
            courseOptions: courseOptions,
            prepList: prepList,
            personalAssetOptions: personalAssetOptions,
            editorAttachments: editorAttachments,
            selectedAssetIds: selectedAssetIds,
            assetTypeFilter: assetTypeFilter,
            stats: stats,
            filters: filters,
            editorForm: editorForm,
            pagination: pagination,
            headerText: headerText,
            pageNumbers: pageNumbers,
            assetTypeOptions: assetTypeOptions,
            canAttachAssets: canAttachAssets,
            filteredPersonalAssetOptions: filteredPersonalAssetOptions,
            dialogBusy: dialogBusy,
            renderExcerpt: renderExcerpt,
            assetTypeLabel: assetTypeLabel,
            openCreateDialog: openCreateDialog,
            closeEditorDialog: closeEditorDialog,
            applySearch: applySearch,
            resetFilters: resetFilters,
            changePage: changePage,
            startEdit: startEdit,
            previewAttachment: previewAttachment,
            submitPrep: submitPrep,
            toggleStatus: toggleStatus,
            attachSelectedAssets: attachSelectedAssets,
            removeAttachment: removeAttachment,
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
