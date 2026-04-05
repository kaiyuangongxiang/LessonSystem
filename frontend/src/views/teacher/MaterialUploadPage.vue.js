import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getTeacherCourseOptions, uploadTeacherResourceBundle } from '@/services/teacher';
import { useAuthStore } from '@/stores/auth';
const router = useRouter();
const authStore = useAuthStore();
const courseOptions = ref([]);
const materialFileInputRef = ref(null);
const videoInputRef = ref(null);
const coverInputRef = ref(null);
const selectedMaterialFile = ref(null);
const selectedVideo = ref(null);
const selectedCover = ref(null);
const videoDuration = ref(null);
const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const form = reactive({
    courseId: '',
    title: '',
    description: '',
});
const headerText = computed(() => {
    const name = authStore.profile?.name || authStore.profile?.username || '教师用户';
    return `${name}，在这里统一上传课程资料和视频资源。`;
});
const videoDurationText = computed(() => formatDuration(videoDuration.value));
function formatFileSize(size) {
    if (size >= 1024 * 1024 * 1024) {
        return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
    }
    if (size >= 1024 * 1024) {
        return `${(size / 1024 / 1024).toFixed(2)} MB`;
    }
    return `${(size / 1024).toFixed(2)} KB`;
}
function formatDuration(duration) {
    if (!duration) {
        return '';
    }
    const totalSeconds = Math.round(duration);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} 分 ${seconds.toString().padStart(2, '0')} 秒`;
}
function clearMessages() {
    errorMessage.value = '';
    successMessage.value = '';
}
function chooseMaterialFile() {
    materialFileInputRef.value?.click();
}
function chooseVideoFile() {
    videoInputRef.value?.click();
}
function chooseCoverFile() {
    coverInputRef.value?.click();
}
function resetForm() {
    form.courseId = '';
    form.title = '';
    form.description = '';
    selectedMaterialFile.value = null;
    selectedVideo.value = null;
    selectedCover.value = null;
    videoDuration.value = null;
    clearMessages();
    if (materialFileInputRef.value) {
        materialFileInputRef.value.value = '';
    }
    if (videoInputRef.value) {
        videoInputRef.value.value = '';
    }
    if (coverInputRef.value) {
        coverInputRef.value.value = '';
    }
}
function handleMaterialFileChange(event) {
    clearMessages();
    const input = event.target;
    const file = input.files?.[0] || null;
    if (!file) {
        selectedMaterialFile.value = null;
        return;
    }
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx'];
    if (!allowedExtensions.includes(extension)) {
        input.value = '';
        selectedMaterialFile.value = null;
        errorMessage.value = '仅支持 PDF、DOC、DOCX、PPT、PPTX 格式资料';
        return;
    }
    if (file.size > 100 * 1024 * 1024) {
        input.value = '';
        selectedMaterialFile.value = null;
        errorMessage.value = '资料文件大小不能超过 100MB';
        return;
    }
    selectedMaterialFile.value = file;
}
function readVideoDuration(file) {
    return new Promise((resolve) => {
        const objectUrl = URL.createObjectURL(file);
        const media = document.createElement('video');
        media.preload = 'metadata';
        media.onloadedmetadata = () => {
            const duration = Number.isFinite(media.duration) ? media.duration : null;
            URL.revokeObjectURL(objectUrl);
            resolve(duration);
        };
        media.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(null);
        };
        media.src = objectUrl;
    });
}
async function handleVideoChange(event) {
    clearMessages();
    const input = event.target;
    const file = input.files?.[0] || null;
    if (!file) {
        selectedVideo.value = null;
        videoDuration.value = null;
        return;
    }
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = ['mp4', 'mov'];
    if (!allowedExtensions.includes(extension)) {
        input.value = '';
        selectedVideo.value = null;
        videoDuration.value = null;
        errorMessage.value = '仅支持 MP4、MOV 格式视频';
        return;
    }
    if (file.size > 500 * 1024 * 1024) {
        input.value = '';
        selectedVideo.value = null;
        videoDuration.value = null;
        errorMessage.value = '视频文件大小不能超过 500MB';
        return;
    }
    selectedVideo.value = file;
    videoDuration.value = await readVideoDuration(file);
}
function handleCoverChange(event) {
    clearMessages();
    const input = event.target;
    const file = input.files?.[0] || null;
    if (!file) {
        selectedCover.value = null;
        return;
    }
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    if (!allowedExtensions.includes(extension)) {
        input.value = '';
        selectedCover.value = null;
        errorMessage.value = '封面仅支持 JPG、JPEG、PNG、WEBP 格式图片';
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        input.value = '';
        selectedCover.value = null;
        errorMessage.value = '封面图片大小不能超过 10MB';
        return;
    }
    selectedCover.value = file;
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
async function submitResources() {
    clearMessages();
    if (!form.courseId) {
        errorMessage.value = '请选择所属课程';
        return;
    }
    if (!form.title) {
        errorMessage.value = '请输入资源名称';
        return;
    }
    if (!selectedMaterialFile.value && !selectedVideo.value) {
        errorMessage.value = '资料文件和视频文件至少上传一种';
        return;
    }
    if (selectedCover.value && !selectedVideo.value) {
        errorMessage.value = '上传视频封面前请先选择视频文件';
        return;
    }
    submitting.value = true;
    try {
        const result = await uploadTeacherResourceBundle({
            courseId: form.courseId,
            title: form.title,
            description: form.description,
            material: selectedMaterialFile.value,
            video: selectedVideo.value,
            cover: selectedCover.value,
            duration: videoDuration.value,
        });
        const createdTypes = result.created.map((item) => (item.type === 'video' ? '视频' : '资料')).join('、');
        resetForm();
        successMessage.value = `资源上传成功，已归档到《${result.courseName}》，本次上传包含：${createdTypes}。`;
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '资源上传失败';
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
    ...{ class: "teacher-dashboard-main material-upload-main" },
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
    ...{ onSubmit: (__VLS_ctx.submitResources) },
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
    value: (__VLS_ctx.form.title),
    type: "text",
    maxlength: "200",
    placeholder: "请输入资源名称，资料和视频会共用该标题",
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
    placeholder: "填写资源用途、适用章节或更新说明",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "material-upload-field material-upload-field--file" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (__VLS_ctx.handleMaterialFileChange) },
    ref: "materialFileInputRef",
    ...{ class: "material-upload-file-input" },
    type: "file",
    accept: ".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
});
/** @type {typeof __VLS_ctx.materialFileInputRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (__VLS_ctx.chooseMaterialFile) },
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
(__VLS_ctx.selectedMaterialFile ? __VLS_ctx.selectedMaterialFile.name : '选择本地资料文件');
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.selectedMaterialFile ? `文件大小 ${__VLS_ctx.formatFileSize(__VLS_ctx.selectedMaterialFile.size)}` : '支持 PDF、DOC、DOCX、PPT、PPTX，单文件不超过 100MB');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "material-upload-dropzone__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "button",
    ...{ class: "material-upload-file-button" },
});
(__VLS_ctx.selectedMaterialFile ? '重新选择' : '点击选择');
if (__VLS_ctx.selectedMaterialFile) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "material-upload-file-tag" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "video-upload-field video-upload-field--file" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (__VLS_ctx.handleVideoChange) },
    ref: "videoInputRef",
    ...{ class: "video-upload-file-input" },
    type: "file",
    accept: ".mp4,.mov,video/mp4,video/quicktime",
});
/** @type {typeof __VLS_ctx.videoInputRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (__VLS_ctx.chooseVideoFile) },
    ...{ class: "video-upload-dropzone video-upload-dropzone--primary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "video-upload-dropzone__main" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "video-upload-dropzone__icon" },
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
(__VLS_ctx.selectedVideo ? __VLS_ctx.selectedVideo.name : '选择视频文件');
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.selectedVideo
    ? `文件大小 ${__VLS_ctx.formatFileSize(__VLS_ctx.selectedVideo.size)}${__VLS_ctx.videoDurationText ? `，时长 ${__VLS_ctx.videoDurationText}` : ''}`
    : '支持 MP4、MOV，单文件不超过 500MB');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "video-upload-dropzone__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "button",
    ...{ class: "video-upload-file-button" },
});
(__VLS_ctx.selectedVideo ? '重新选择' : '点击选择');
if (__VLS_ctx.selectedVideo) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "video-upload-file-tag" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "video-upload-field video-upload-field--file" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (__VLS_ctx.handleCoverChange) },
    ref: "coverInputRef",
    ...{ class: "video-upload-file-input" },
    type: "file",
    accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
});
/** @type {typeof __VLS_ctx.coverInputRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (__VLS_ctx.chooseCoverFile) },
    ...{ class: "video-upload-dropzone video-upload-dropzone--cover" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "video-upload-dropzone__main" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "video-upload-dropzone__icon video-upload-dropzone__icon--cover" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
    x: "4.5",
    y: "6",
    width: "15",
    height: "12",
    rx: "2.5",
    stroke: "currentColor",
    'stroke-width': "1.8",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "m8 14 2.5-2.5L13 14l2-2 3 3",
    stroke: "currentColor",
    'stroke-width': "1.8",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "9",
    cy: "10",
    r: "1.2",
    fill: "currentColor",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.selectedCover ? __VLS_ctx.selectedCover.name : '选择封面图片');
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.selectedCover ? `文件大小 ${__VLS_ctx.formatFileSize(__VLS_ctx.selectedCover.size)}` : '封面可选，支持 JPG、PNG、WEBP');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "video-upload-dropzone__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "button",
    ...{ class: "video-upload-file-button video-upload-file-button--soft" },
});
(__VLS_ctx.selectedCover ? '重新选择' : '上传封面');
if (__VLS_ctx.selectedCover) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "video-upload-file-tag video-upload-file-tag--cover" },
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
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-page']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-sidebar__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['is-active']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-main']} */ ;
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
/** @type {__VLS_StyleScopedClasses['video-upload-field']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-field--file']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-file-input']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-dropzone']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-dropzone--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-dropzone__main']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-dropzone__icon']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-dropzone__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-file-button']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-file-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-field']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-field--file']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-file-input']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-dropzone']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-dropzone--cover']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-dropzone__main']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-dropzone__icon']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-dropzone__icon--cover']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-dropzone__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-file-button']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-file-button--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-file-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['video-upload-file-tag--cover']} */ ;
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
            materialFileInputRef: materialFileInputRef,
            videoInputRef: videoInputRef,
            coverInputRef: coverInputRef,
            selectedMaterialFile: selectedMaterialFile,
            selectedVideo: selectedVideo,
            selectedCover: selectedCover,
            loading: loading,
            submitting: submitting,
            errorMessage: errorMessage,
            successMessage: successMessage,
            form: form,
            headerText: headerText,
            videoDurationText: videoDurationText,
            formatFileSize: formatFileSize,
            chooseMaterialFile: chooseMaterialFile,
            chooseVideoFile: chooseVideoFile,
            chooseCoverFile: chooseCoverFile,
            resetForm: resetForm,
            handleMaterialFileChange: handleMaterialFileChange,
            handleVideoChange: handleVideoChange,
            handleCoverChange: handleCoverChange,
            submitResources: submitResources,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
