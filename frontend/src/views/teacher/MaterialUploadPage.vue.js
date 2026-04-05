import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getTeacherCourseOptions, uploadTeacherMaterial } from '@/services/teacher';
import { useAuthStore } from '@/stores/auth';
const router = useRouter();
const authStore = useAuthStore();
const courseOptions = ref([]);
const selectedFile = ref(null);
const fileInputRef = ref(null);
const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const form = reactive({
    courseId: '',
    materialName: '',
    description: '',
});
const headerText = computed(() => {
    const name = authStore.profile?.name || authStore.profile?.username || '教师用户';
    return `${name}，在这里上传讲义、课件和实验指导等文档资料。`;
});
function formatFileSize(size) {
    if (size >= 1024 * 1024) {
        return `${(size / 1024 / 1024).toFixed(2)} MB`;
    }
    return `${(size / 1024).toFixed(2)} KB`;
}
function clearMessages() {
    errorMessage.value = '';
    successMessage.value = '';
}
function chooseFile() {
    fileInputRef.value?.click();
}
function resetForm() {
    form.courseId = '';
    form.materialName = '';
    form.description = '';
    selectedFile.value = null;
    clearMessages();
    if (fileInputRef.value) {
        fileInputRef.value.value = '';
    }
}
function handleFileChange(event) {
    clearMessages();
    const input = event.target;
    const file = input.files?.[0] || null;
    if (!file) {
        selectedFile.value = null;
        return;
    }
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx'];
    if (!allowedExtensions.includes(extension)) {
        input.value = '';
        selectedFile.value = null;
        errorMessage.value = '仅支持 PDF、DOC、DOCX、PPT、PPTX 格式资料';
        return;
    }
    if (file.size > 100 * 1024 * 1024) {
        input.value = '';
        selectedFile.value = null;
        errorMessage.value = '资料文件大小不能超过 100MB';
        return;
    }
    selectedFile.value = file;
}
async function loadCourseOptions() {
    loading.value = true;
    errorMessage.value = '';
    try {
        courseOptions.value = await getTeacherCourseOptions();
    }
    catch (error) {
        courseOptions.value = [];
        errorMessage.value = error?.response?.data?.message || '课程选项加载失败';
    }
    finally {
        loading.value = false;
    }
}
async function submitMaterial() {
    clearMessages();
    if (!form.courseId) {
        errorMessage.value = '请选择所属课程';
        return;
    }
    if (!form.materialName) {
        errorMessage.value = '请输入资料名称';
        return;
    }
    if (!selectedFile.value) {
        errorMessage.value = '请先选择资料文件';
        return;
    }
    submitting.value = true;
    try {
        const result = await uploadTeacherMaterial({
            courseId: form.courseId,
            materialName: form.materialName,
            description: form.description,
            file: selectedFile.value,
        });
        resetForm();
        successMessage.value = `资料《${result.materialName}》上传成功，已归档到《${result.courseName}》。`;
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '资料上传失败';
    }
    finally {
        submitting.value = false;
    }
}
onMounted(() => {
    loadCourseOptions();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "material-upload-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "material-upload-sidebar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "material-upload-sidebar__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "material-upload-nav" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher');
        } },
    type: "button",
    ...{ class: "material-upload-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher/messages');
        } },
    type: "button",
    ...{ class: "material-upload-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "button",
    ...{ class: "material-upload-nav__item is-active" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher/videos');
        } },
    type: "button",
    ...{ class: "material-upload-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher/resources');
        } },
    type: "button",
    ...{ class: "material-upload-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher/profile');
        } },
    type: "button",
    ...{ class: "material-upload-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "material-upload-main" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "material-upload-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "material-upload-head__eyebrow" },
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
        ...{ class: "feedback-text feedback-text--success material-upload-feedback" },
    });
    (__VLS_ctx.successMessage);
}
if (!__VLS_ctx.loading && !__VLS_ctx.courseOptions.length && !__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "material-upload-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "material-upload-panel material-upload-panel--form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "material-upload-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "material-upload-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.submitMaterial) },
    ...{ class: "material-upload-form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "material-upload-form__row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "material-upload-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.form.materialName),
    type: "text",
    maxlength: "200",
    placeholder: "请输入资料名称，如《数据库实验指导书》",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "material-upload-field" },
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
    ...{ class: "material-upload-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.form.description),
    maxlength: "2000",
    rows: "4",
    placeholder: "填写资料用途、适用章节或更新说明",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "material-upload-field material-upload-field--file" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (__VLS_ctx.handleFileChange) },
    ref: "fileInputRef",
    ...{ class: "material-upload-file-input" },
    type: "file",
    accept: ".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
});
/** @type {typeof __VLS_ctx.fileInputRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (__VLS_ctx.chooseFile) },
    ...{ class: "material-upload-dropzone" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "material-upload-dropzone__main" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "material-upload-dropzone__icon" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M12 16V7",
    stroke: "currentColor",
    'stroke-width': "1.8",
    'stroke-linecap': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M8.5 10.5 12 7l3.5 3.5",
    stroke: "currentColor",
    'stroke-width': "1.8",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M6 17.5h12",
    stroke: "currentColor",
    'stroke-width': "1.8",
    'stroke-linecap': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.selectedFile ? __VLS_ctx.selectedFile.name : '选择本地资料文件');
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.selectedFile ? `文件大小 ${__VLS_ctx.formatFileSize(__VLS_ctx.selectedFile.size)}` : '支持 PDF、DOC、DOCX、PPT、PPTX，单文件不超过 100MB');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "material-upload-dropzone__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "button",
    ...{ class: "material-upload-file-button" },
});
(__VLS_ctx.selectedFile ? '重新选择' : '点击选择');
if (__VLS_ctx.selectedFile) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "material-upload-file-tag" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "material-upload-actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
    ...{ class: "auth-btn" },
    disabled: (__VLS_ctx.submitting || !__VLS_ctx.courseOptions.length),
});
(__VLS_ctx.submitting ? '上传中...' : '提交上传');
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.resetForm) },
    type: "button",
    ...{ class: "auth-btn auth-btn--secondary" },
    disabled: (__VLS_ctx.submitting),
});
/** @type {__VLS_StyleScopedClasses['material-upload-page']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-sidebar__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['is-active']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-main']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-head']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-head__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text--success']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-panel--form']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-form']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-form__row']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-field']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-field']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-field']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-field']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-field--file']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-file-input']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-dropzone']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-dropzone__main']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-dropzone__icon']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-dropzone__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-file-button']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-file-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['material-upload-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            courseOptions: courseOptions,
            selectedFile: selectedFile,
            fileInputRef: fileInputRef,
            loading: loading,
            submitting: submitting,
            errorMessage: errorMessage,
            successMessage: successMessage,
            form: form,
            headerText: headerText,
            formatFileSize: formatFileSize,
            chooseFile: chooseFile,
            resetForm: resetForm,
            handleFileChange: handleFileChange,
            submitMaterial: submitMaterial,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
