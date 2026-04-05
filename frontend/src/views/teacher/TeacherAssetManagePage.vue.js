import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createTeacherAsset, deleteTeacherAssetDetail, getTeacherAssetDetail, getTeacherAssets, updateTeacherAssetDetail, } from '@/services/teacher';
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
const selectedFile = ref(null);
const fileInputRef = ref(null);
const fileInputKey = ref(0);
const courseOptions = ref([]);
const assetList = ref([]);
const stats = reactive({
    total: 0,
    imageCount: 0,
    audioCount: 0,
    videoCount: 0,
    contentCount: 0,
});
const filters = reactive({
    keyword: '',
    courseId: '',
    type: 'all',
});
const editorForm = reactive({
    type: 'image',
    courseId: '',
    title: '',
    description: '',
    content: '',
});
const pagination = reactive({
    page: 1,
    pageSize: 6,
    total: 0,
    totalPages: 0,
});
const assetTypeOptions = [
    { value: 'image', label: '图片素材' },
    { value: 'audio', label: '音频素材' },
    { value: 'video', label: '视频素材' },
    { value: 'text', label: '文本片段' },
    { value: 'question', label: '题目卡片' },
    { value: 'template', label: '页面模板' },
];
const isContentType = computed(() => ['text', 'question', 'template'].includes(editorForm.type));
const fileAccept = computed(() => {
    if (editorForm.type === 'audio') {
        return '.mp3,.wav,.ogg,.m4a';
    }
    if (editorForm.type === 'video') {
        return '.mp4,.mov';
    }
    return '.jpg,.jpeg,.png,.webp,.gif';
});
const uploadLabel = computed(() => {
    if (editorForm.type === 'audio') {
        return '上传音频';
    }
    if (editorForm.type === 'video') {
        return '上传视频';
    }
    return '上传图片';
});
const uploadTip = computed(() => {
    if (editorForm.type === 'audio') {
        return '支持 MP3、WAV、OGG、M4A 格式，单文件不超过 500MB。';
    }
    if (editorForm.type === 'video') {
        return '支持 MP4、MOV 格式，单文件不超过 500MB。';
    }
    return '支持 JPG、JPEG、PNG、WEBP、GIF 格式，单文件不超过 500MB。';
});
const fileNameText = computed(() => {
    if (selectedFile.value) {
        return selectedFile.value.name;
    }
    if (editingId.value) {
        return '编辑状态下保留原文件';
    }
    return '未选择任何文件';
});
const contentPlaceholder = computed(() => {
    if (editorForm.type === 'question') {
        return '请输入题干、选项、答案要点或讲解内容';
    }
    if (editorForm.type === 'template') {
        return '请输入页面模板结构、布局说明或使用建议';
    }
    return '请输入可直接复用的文本片段内容';
});
const headerText = computed(() => {
    const name = authStore.profile?.name || authStore.profile?.username || '教师用户';
    return `${name}，这里统一管理图片、音频、视频和文本类教学素材，方便后续课程资源与课件复用。`;
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
function formatFileSize(size) {
    if (size >= 1024 * 1024) {
        return `${(size / 1024 / 1024).toFixed(2)} MB`;
    }
    return `${(size / 1024).toFixed(2)} KB`;
}
function assetTypeLabel(type) {
    return assetTypeOptions.find((item) => item.value === type)?.label || type;
}
function openFilePicker() {
    if (!editingId.value) {
        fileInputRef.value?.click();
    }
}
function resetEditor() {
    editingId.value = null;
    editorForm.type = 'image';
    editorForm.courseId = '';
    editorForm.title = '';
    editorForm.description = '';
    editorForm.content = '';
    selectedFile.value = null;
    fileInputKey.value += 1;
}
function syncFiltersWithRoute() {
    filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : '';
    filters.courseId = typeof route.query.courseId === 'string' ? route.query.courseId : '';
    filters.type = typeof route.query.type === 'string' && route.query.type !== '' ? route.query.type : 'all';
}
function updateRoute(page = 1) {
    router.push({
        path: '/teacher/assets',
        query: {
            page: String(page),
            ...(filters.keyword ? { keyword: filters.keyword } : {}),
            ...(filters.courseId ? { courseId: filters.courseId } : {}),
            ...(filters.type !== 'all' ? { type: filters.type } : {}),
        },
    });
}
function applySearch() {
    updateRoute(1);
}
function resetFilters() {
    filters.keyword = '';
    filters.courseId = '';
    filters.type = 'all';
    updateRoute(1);
}
function changePage(page) {
    updateRoute(page);
}
function handleFileChange(event) {
    const target = event.target;
    selectedFile.value = target.files?.[0] || null;
}
function previewAsset(path) {
    if (!path)
        return;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    window.open(`${baseUrl}${path}`, '_blank', 'noopener,noreferrer');
}
async function startEdit(assetId) {
    clearMessages();
    try {
        const detail = await getTeacherAssetDetail(assetId);
        editingId.value = assetId;
        editorForm.type = detail.type;
        editorForm.courseId = String(detail.courseId);
        editorForm.title = detail.title;
        editorForm.description = detail.description;
        editorForm.content = detail.content;
        selectedFile.value = null;
        fileInputKey.value += 1;
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '素材详情加载失败';
    }
}
async function submitAsset() {
    clearMessages();
    if (!editorForm.courseId || !editorForm.title) {
        errorMessage.value = '请完整填写素材类型、所属课程和素材标题';
        return;
    }
    if (isContentType.value && !editorForm.content) {
        errorMessage.value = '当前素材类型必须填写素材内容';
        return;
    }
    if (!isContentType.value && !editingId.value && !selectedFile.value) {
        errorMessage.value = '当前素材类型必须上传文件';
        return;
    }
    saving.value = true;
    try {
        if (editingId.value) {
            const result = await updateTeacherAssetDetail(editingId.value, {
                courseId: editorForm.courseId,
                title: editorForm.title,
                description: editorForm.description,
                content: editorForm.content,
            });
            successMessage.value = `素材“${result.title}”已更新。`;
        }
        else {
            const result = await createTeacherAsset({
                type: editorForm.type,
                courseId: editorForm.courseId,
                title: editorForm.title,
                description: editorForm.description,
                content: editorForm.content,
                file: selectedFile.value,
            });
            successMessage.value = `素材“${result.title}”已创建。`;
        }
        resetEditor();
        await loadAssets();
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '素材保存失败';
    }
    finally {
        saving.value = false;
    }
}
async function removeAsset(item) {
    clearMessages();
    if (!window.confirm(`确认删除素材“${item.title}”吗？`)) {
        return;
    }
    deletingId.value = item.id;
    try {
        await deleteTeacherAssetDetail(item.id);
        successMessage.value = `素材“${item.title}”已删除。`;
        if (editingId.value === item.id) {
            resetEditor();
        }
        await loadAssets();
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '素材删除失败';
    }
    finally {
        deletingId.value = null;
    }
}
async function loadAssets() {
    loading.value = true;
    clearMessages();
    syncFiltersWithRoute();
    try {
        const data = await getTeacherAssets({
            page: normalizePage(route.query.page),
            pageSize: 6,
            keyword: filters.keyword,
            courseId: filters.courseId,
            type: filters.type,
        });
        courseOptions.value = data.filters.courses;
        assetList.value = data.list;
        stats.total = data.stats.total;
        stats.imageCount = data.stats.imageCount;
        stats.audioCount = data.stats.audioCount;
        stats.videoCount = data.stats.videoCount;
        stats.contentCount = data.stats.contentCount;
        pagination.page = data.pagination.page;
        pagination.pageSize = data.pagination.pageSize;
        pagination.total = data.pagination.total;
        pagination.totalPages = data.pagination.totalPages;
    }
    catch (error) {
        courseOptions.value = [];
        assetList.value = [];
        stats.total = 0;
        stats.imageCount = 0;
        stats.audioCount = 0;
        stats.videoCount = 0;
        stats.contentCount = 0;
        pagination.page = 1;
        pagination.pageSize = 6;
        pagination.total = 0;
        pagination.totalPages = 0;
        errorMessage.value = error?.response?.data?.message || '素材库加载失败';
    }
    finally {
        loading.value = false;
    }
}
watch(() => route.fullPath, () => {
    loadAssets();
}, { immediate: true });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "teacher-dashboard-page asset-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "teacher-dashboard-sidebar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-dashboard-sidebar__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "teacher-dashboard-nav" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher');
        } },
    type: "button",
    ...{ class: "teacher-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher/materials');
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
            __VLS_ctx.router.push('/teacher/resources');
        } },
    type: "button",
    ...{ class: "teacher-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher/profile');
        } },
    type: "button",
    ...{ class: "teacher-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "teacher-dashboard-main asset-manage-main" },
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
(__VLS_ctx.stats.imageCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "my-resources-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.audioCount + __VLS_ctx.stats.videoCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "my-resources-stat-card is-highlight" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.contentCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "asset-manage-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "asset-manage-card__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "my-resources-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
(__VLS_ctx.editingId ? '编辑素材' : '新增素材');
if (__VLS_ctx.editingId) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.resetEditor) },
        type: "button",
        ...{ class: "course-chip course-chip--soft" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.submitAsset) },
    ...{ class: "asset-manage-form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "my-resources-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.editorForm.type),
    disabled: (Boolean(__VLS_ctx.editingId)),
});
for (const [option] of __VLS_getVForSourceType((__VLS_ctx.assetTypeOptions))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (option.value),
        value: (option.value),
    });
    (option.label);
}
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
    ...{ class: "my-resources-field asset-manage-form__full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.editorForm.title),
    type: "text",
    maxlength: "200",
    placeholder: "请输入素材标题",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "my-resources-field asset-manage-form__full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.editorForm.description),
    rows: "3",
    maxlength: "2000",
    placeholder: "补充素材用途、适用章节或课堂使用说明",
});
if (__VLS_ctx.isContentType) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "my-resources-field asset-manage-form__full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.editorForm.content),
        rows: "6",
        maxlength: "5000",
        placeholder: (__VLS_ctx.contentPlaceholder),
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "my-resources-field asset-manage-form__full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.uploadLabel);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "asset-upload-picker" },
        ...{ class: ({ 'is-disabled': Boolean(__VLS_ctx.editingId) }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onChange: (__VLS_ctx.handleFileChange) },
        ref: "fileInputRef",
        key: (__VLS_ctx.fileInputKey),
        ...{ class: "asset-upload-picker__input" },
        type: "file",
        accept: (__VLS_ctx.fileAccept),
        disabled: (Boolean(__VLS_ctx.editingId)),
    });
    /** @type {typeof __VLS_ctx.fileInputRef} */ ;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.openFilePicker) },
        type: "button",
        ...{ class: "asset-upload-picker__button" },
        disabled: (Boolean(__VLS_ctx.editingId)),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "asset-upload-picker__name" },
    });
    (__VLS_ctx.fileNameText);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({
        ...{ class: "asset-manage-field-tip" },
    });
    (__VLS_ctx.editingId ? '编辑素材时暂不支持替换文件，可保留原文件继续修改标题和说明。' : __VLS_ctx.uploadTip);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "my-resources-filter-actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
    ...{ class: "auth-btn" },
    disabled: (__VLS_ctx.saving),
});
(__VLS_ctx.saving ? '提交中...' : __VLS_ctx.editingId ? '保存素材' : '创建素材');
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.resetEditor) },
    type: "button",
    ...{ class: "auth-btn auth-btn--secondary" },
    disabled: (__VLS_ctx.saving),
});
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
    placeholder: "搜索标题、说明、内容或文件名",
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
    value: (__VLS_ctx.filters.type),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "all",
});
for (const [option] of __VLS_getVForSourceType((__VLS_ctx.assetTypeOptions))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (option.value),
        value: (option.value),
    });
    (option.label);
}
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
(__VLS_ctx.loading ? '加载中...' : '搜索素材');
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
if (__VLS_ctx.assetList.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "asset-manage-list" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.assetList))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (item.id),
            ...{ class: "asset-manage-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "asset-manage-item__head" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (item.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "teacher-dashboard-tag" },
        });
        (__VLS_ctx.assetTypeLabel(item.type));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "asset-manage-item__time" },
        });
        (item.uploadTime);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "asset-manage-item__meta" },
        });
        (item.courseName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "asset-manage-item__meta" },
        });
        (item.description || '暂无素材说明');
        if (item.content) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "asset-manage-item__content" },
            });
            (item.content);
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "asset-manage-item__meta" },
            });
            (item.fileName || '未记录文件名');
            if (item.fileSize) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.formatFileSize(item.fileSize));
            }
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "asset-manage-item__actions" },
        });
        if (item.previewUrl) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.assetList.length))
                            return;
                        if (!(item.previewUrl))
                            return;
                        __VLS_ctx.previewAsset(item.previewUrl);
                    } },
                type: "button",
                ...{ class: "course-chip course-chip--soft" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.assetList.length))
                        return;
                    __VLS_ctx.startEdit(item.id);
                } },
            type: "button",
            ...{ class: "course-chip" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.assetList.length))
                        return;
                    __VLS_ctx.removeAsset(item);
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
/** @type {__VLS_StyleScopedClasses['asset-page']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-sidebar__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['is-active']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-main']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-manage-main']} */ ;
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
/** @type {__VLS_StyleScopedClasses['asset-manage-card']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-manage-card__head']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-manage-form']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-manage-form__full']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-manage-form__full']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-manage-form__full']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-manage-form__full']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-upload-picker']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-upload-picker__input']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-upload-picker__button']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-upload-picker__name']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-manage-field-tip']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-filter-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
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
/** @type {__VLS_StyleScopedClasses['asset-manage-list']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-manage-item']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-manage-item__head']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-manage-item__time']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-manage-item__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-manage-item__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-manage-item__content']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-manage-item__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['asset-manage-item__actions']} */ ;
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
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            loading: loading,
            saving: saving,
            deletingId: deletingId,
            editingId: editingId,
            errorMessage: errorMessage,
            successMessage: successMessage,
            fileInputRef: fileInputRef,
            fileInputKey: fileInputKey,
            courseOptions: courseOptions,
            assetList: assetList,
            stats: stats,
            filters: filters,
            editorForm: editorForm,
            pagination: pagination,
            assetTypeOptions: assetTypeOptions,
            isContentType: isContentType,
            fileAccept: fileAccept,
            uploadLabel: uploadLabel,
            uploadTip: uploadTip,
            fileNameText: fileNameText,
            contentPlaceholder: contentPlaceholder,
            headerText: headerText,
            pageNumbers: pageNumbers,
            formatFileSize: formatFileSize,
            assetTypeLabel: assetTypeLabel,
            openFilePicker: openFilePicker,
            resetEditor: resetEditor,
            applySearch: applySearch,
            resetFilters: resetFilters,
            changePage: changePage,
            handleFileChange: handleFileChange,
            previewAsset: previewAsset,
            startEdit: startEdit,
            submitAsset: submitAsset,
            removeAsset: removeAsset,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
