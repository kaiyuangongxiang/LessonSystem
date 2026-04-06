import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TeacherSidebarNav from '@/components/navigation/TeacherSidebarNav.vue';
import { getTeacherAssets, getTeacherCoursewareDetail, getTeacherResources, publishTeacherCourseware, updateTeacherCourseware, } from '@/services/teacher';
import { cloneCoursewareSlide, COURSEWARE_TEMPLATE_OPTIONS, COURSEWARE_TEXT_ALIGN_OPTIONS, COURSEWARE_TEXT_STYLE_OPTIONS, createCoursewareSlide, createImageBlock, createResourceBlock, createTextBlock, createVideoBlock, getCoursewareTemplateLabel, } from '@/utils/courseware';
const router = useRouter();
const route = useRoute();
const loading = ref(true);
const saving = ref(false);
const publishing = ref(false);
const libraryLoading = ref(false);
const previewMode = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const activeSlideId = ref('');
const selectedBlockId = ref('');
const draggingSlideId = ref('');
const courseOptions = ref([]);
const prepOptions = ref([]);
const imageAssets = ref([]);
const materialResources = ref([]);
const videoResources = ref([]);
const form = reactive({
    title: '',
    courseId: '',
    prepId: '',
    summary: '',
    status: 'draft',
});
const content = reactive({
    version: 1,
    slides: [createCoursewareSlide('cover', '封面页')],
});
const libraryFilters = reactive({
    assetKeyword: '',
    materialKeyword: '',
    videoKeyword: '',
});
const coursewareId = computed(() => Number(route.params.coursewareId || 0));
const currentSlide = computed(() => {
    return content.slides.find((slide) => slide.id === activeSlideId.value) || content.slides[0] || null;
});
const selectedBlock = computed(() => {
    if (!currentSlide.value) {
        return null;
    }
    return currentSlide.value.blocks.find((block) => block.id === selectedBlockId.value) || currentSlide.value.blocks[0] || null;
});
const availablePreps = computed(() => {
    if (!form.courseId) {
        return prepOptions.value;
    }
    return prepOptions.value.filter((item) => String(item.courseId) === form.courseId);
});
const statusLabel = computed(() => (form.status === 'published' ? '已发布' : '草稿'));
const toolbarSummary = computed(() => {
    const slideCount = content.slides.length;
    const blockCount = content.slides.reduce((sum, slide) => sum + slide.blocks.length, 0);
    return `当前共 ${slideCount} 页，已放入 ${blockCount} 个内容块，可随时保存草稿或直接发布。`;
});
function clearMessages() {
    errorMessage.value = '';
    successMessage.value = '';
}
function resolvePreviewUrl(url) {
    if (!url) {
        return '';
    }
    if (/^https?:\/\//.test(url)) {
        return url;
    }
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api$/, '');
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
}
function openPreviewLink(url) {
    const targetUrl = resolvePreviewUrl(url);
    if (!targetUrl) {
        return;
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
}
function goBack() {
    void router.push('/teacher/coursewares');
}
function replaceContent(nextContent) {
    content.version = nextContent.version || 1;
    content.slides.splice(0, content.slides.length, ...nextContent.slides);
}
function ensureActiveSlide() {
    if (!content.slides.length) {
        const fallback = createCoursewareSlide('content', '新页面');
        content.slides.push(fallback);
    }
    if (!content.slides.some((slide) => slide.id === activeSlideId.value)) {
        activeSlideId.value = content.slides[0]?.id || '';
    }
    const slide = currentSlide.value;
    if (slide && !slide.blocks.some((block) => block.id === selectedBlockId.value)) {
        selectedBlockId.value = slide.blocks[0]?.id || '';
    }
}
function setActiveSlide(slideId) {
    activeSlideId.value = slideId;
    selectedBlockId.value = currentSlide.value?.blocks[0]?.id || '';
}
function selectBlock(blockId) {
    selectedBlockId.value = blockId;
}
function addSlide(template) {
    const slide = createCoursewareSlide(template, template === 'cover' ? '封面页' : '新页面');
    content.slides.push(slide);
    setActiveSlide(slide.id);
}
function duplicateSlide(slideId) {
    const index = content.slides.findIndex((slide) => slide.id === slideId);
    if (index < 0) {
        return;
    }
    const clonedSlide = cloneCoursewareSlide(content.slides[index]);
    clonedSlide.title = `${clonedSlide.title}（副本）`;
    content.slides.splice(index + 1, 0, clonedSlide);
    setActiveSlide(clonedSlide.id);
}
function removeSlide(slideId) {
    if (content.slides.length <= 1) {
        errorMessage.value = '课件至少需要保留 1 个页面';
        return;
    }
    const target = content.slides.find((slide) => slide.id === slideId);
    if (!target) {
        return;
    }
    if (!window.confirm(`确认删除页面《${target.title || '未命名页面'}》吗？`)) {
        return;
    }
    const index = content.slides.findIndex((slide) => slide.id === slideId);
    content.slides.splice(index, 1);
    const nextSlide = content.slides[Math.max(0, index - 1)] || content.slides[0];
    if (nextSlide) {
        setActiveSlide(nextSlide.id);
    }
}
function moveSlide(slideId, direction) {
    const index = content.slides.findIndex((slide) => slide.id === slideId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= content.slides.length) {
        return;
    }
    const [target] = content.slides.splice(index, 1);
    content.slides.splice(nextIndex, 0, target);
}
function handleSlideDragStart(slideId) {
    draggingSlideId.value = slideId;
}
function handleSlideDrop(targetSlideId) {
    if (!draggingSlideId.value || draggingSlideId.value === targetSlideId) {
        draggingSlideId.value = '';
        return;
    }
    const sourceIndex = content.slides.findIndex((slide) => slide.id === draggingSlideId.value);
    const targetIndex = content.slides.findIndex((slide) => slide.id === targetSlideId);
    if (sourceIndex < 0 || targetIndex < 0) {
        draggingSlideId.value = '';
        return;
    }
    const [draggedSlide] = content.slides.splice(sourceIndex, 1);
    content.slides.splice(targetIndex, 0, draggedSlide);
    draggingSlideId.value = '';
}
function addTextBlockToCurrentSlide() {
    if (!currentSlide.value) {
        return;
    }
    const block = createTextBlock(currentSlide.value.template === 'cover' ? '请输入封面说明' : '请输入正文内容');
    currentSlide.value.blocks.push(block);
    selectBlock(block.id);
}
function removeBlock(blockId) {
    if (!currentSlide.value) {
        return;
    }
    if (currentSlide.value.blocks.length <= 1) {
        errorMessage.value = '每一页至少需要保留 1 个内容块';
        return;
    }
    const index = currentSlide.value.blocks.findIndex((block) => block.id === blockId);
    if (index < 0) {
        return;
    }
    currentSlide.value.blocks.splice(index, 1);
    selectedBlockId.value = currentSlide.value.blocks[Math.max(0, index - 1)]?.id || '';
}
function insertImageBlock(asset) {
    if (!currentSlide.value) {
        return;
    }
    const block = createImageBlock({
        type: 'image',
        assetId: asset.id,
        title: asset.title,
        description: asset.description,
        courseName: asset.courseName,
        previewUrl: asset.previewUrl,
        caption: '',
    });
    currentSlide.value.blocks.push(block);
    selectBlock(block.id);
}
function insertResourceBlock(resource) {
    if (!currentSlide.value) {
        return;
    }
    const block = createResourceBlock({
        type: 'resource',
        resourceId: resource.id,
        title: resource.title,
        description: resource.description,
        courseName: resource.courseName,
        fileName: resource.fileName,
        previewUrl: resource.previewUrl,
        caption: '',
    });
    currentSlide.value.blocks.push(block);
    selectBlock(block.id);
}
function insertVideoBlock(resource) {
    if (!currentSlide.value) {
        return;
    }
    const block = createVideoBlock({
        type: 'video',
        resourceId: resource.id,
        title: resource.title,
        description: resource.description,
        courseName: resource.courseName,
        duration: resource.duration,
        previewUrl: resource.previewUrl,
        caption: '',
    });
    currentSlide.value.blocks.push(block);
    selectBlock(block.id);
}
function textStyleLabel(style) {
    return COURSEWARE_TEXT_STYLE_OPTIONS.find((item) => item.value === style)?.label || '正文';
}
function textAlignLabel(align) {
    return COURSEWARE_TEXT_ALIGN_OPTIONS.find((item) => item.value === align)?.label || '左对齐';
}
async function loadLibraries() {
    libraryLoading.value = true;
    try {
        const [assetData, materialData, videoData] = await Promise.all([
            getTeacherAssets({
                page: 1,
                pageSize: 12,
                courseId: form.courseId || undefined,
                keyword: libraryFilters.assetKeyword || undefined,
                type: 'image',
            }),
            getTeacherResources({
                page: 1,
                pageSize: 12,
                courseId: form.courseId || undefined,
                keyword: libraryFilters.materialKeyword || undefined,
                type: 'material',
            }),
            getTeacherResources({
                page: 1,
                pageSize: 12,
                courseId: form.courseId || undefined,
                keyword: libraryFilters.videoKeyword || undefined,
                type: 'video',
            }),
        ]);
        imageAssets.value = assetData.list;
        materialResources.value = materialData.list;
        videoResources.value = videoData.list;
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '资源引用列表加载失败';
    }
    finally {
        libraryLoading.value = false;
    }
}
async function loadCoursewareDetail() {
    if (!coursewareId.value) {
        errorMessage.value = '课件 ID 不合法';
        loading.value = false;
        return;
    }
    loading.value = true;
    clearMessages();
    try {
        const data = await getTeacherCoursewareDetail(coursewareId.value);
        const detail = data.courseware;
        form.title = detail.title;
        form.courseId = String(detail.courseId);
        form.prepId = String(detail.prepId);
        form.summary = detail.summary || '';
        form.status = detail.status;
        courseOptions.value = data.options.courses;
        prepOptions.value = data.options.preps;
        replaceContent(detail.content);
        activeSlideId.value = detail.content.slides[0]?.id || '';
        selectedBlockId.value = detail.content.slides[0]?.blocks[0]?.id || '';
        await loadLibraries();
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '课件详情加载失败';
    }
    finally {
        loading.value = false;
    }
}
async function saveCourseware(showToast = true) {
    if (!form.title || !form.courseId || !form.prepId) {
        errorMessage.value = '请先填写课件标题、所属课程和关联备课单';
        return false;
    }
    saving.value = true;
    clearMessages();
    try {
        const result = await updateTeacherCourseware(coursewareId.value, {
            title: form.title,
            courseId: form.courseId,
            prepId: form.prepId,
            summary: form.summary,
            status: form.status,
            content: {
                version: 1,
                slides: content.slides,
            },
        });
        form.status = result.status;
        replaceContent(result.content);
        ensureActiveSlide();
        if (showToast) {
            successMessage.value = '课件草稿已保存';
        }
        return true;
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '课件保存失败';
        return false;
    }
    finally {
        saving.value = false;
    }
}
async function publishCoursewareAction() {
    const saved = await saveCourseware(false);
    if (!saved) {
        return;
    }
    publishing.value = true;
    clearMessages();
    try {
        const result = await publishTeacherCourseware(coursewareId.value);
        form.status = result.status;
        successMessage.value = '课件已发布';
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '课件发布失败';
    }
    finally {
        publishing.value = false;
    }
}
watch(() => form.courseId, () => {
    if (form.prepId && !availablePreps.value.some((item) => String(item.id) === form.prepId)) {
        form.prepId = '';
    }
    if (!loading.value) {
        void loadLibraries();
    }
});
watch(() => currentSlide.value?.id, () => {
    ensureActiveSlide();
});
watch(() => route.params.coursewareId, () => {
    void loadCoursewareDetail();
}, { immediate: true });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "teacher-dashboard-page courseware-editor-page" },
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
    active: "coursewares",
}));
const __VLS_1 = __VLS_0({
    active: "coursewares",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "teacher-dashboard-main courseware-editor-main" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "courseware-editor-toolbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "courseware-editor-toolbar__title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "my-resources-head__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
(__VLS_ctx.form.title || '在线课件编辑器');
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.toolbarSummary);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "courseware-editor-toolbar__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "teacher-dashboard-tag" },
});
(__VLS_ctx.statusLabel);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.goBack) },
    type: "button",
    ...{ class: "course-chip course-chip--soft" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.previewMode = !__VLS_ctx.previewMode;
        } },
    type: "button",
    ...{ class: "course-chip course-chip--soft" },
});
(__VLS_ctx.previewMode ? '退出预览' : '预览课件');
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.saveCourseware();
        } },
    type: "button",
    ...{ class: "auth-btn auth-btn--secondary" },
    disabled: (__VLS_ctx.saving || __VLS_ctx.loading),
});
(__VLS_ctx.saving ? '保存中...' : '保存草稿');
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.publishCoursewareAction) },
    type: "button",
    ...{ class: "auth-btn" },
    disabled: (__VLS_ctx.saving || __VLS_ctx.publishing || __VLS_ctx.loading),
});
(__VLS_ctx.publishing ? '发布中...' : '发布课件');
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
if (!__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "courseware-editor-workbench" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
        ...{ class: "courseware-editor-rail" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-editor-panel__head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-editor-panel__eyebrow" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(!__VLS_ctx.loading))
                    return;
                __VLS_ctx.addSlide('content');
            } },
        type: "button",
        ...{ class: "course-chip" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-editor-rail__actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(!__VLS_ctx.loading))
                    return;
                __VLS_ctx.addSlide('cover');
            } },
        type: "button",
        ...{ class: "course-chip course-chip--soft" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(!__VLS_ctx.loading))
                    return;
                __VLS_ctx.addSlide('agenda');
            } },
        type: "button",
        ...{ class: "course-chip course-chip--soft" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(!__VLS_ctx.loading))
                    return;
                __VLS_ctx.addSlide('summary');
            } },
        type: "button",
        ...{ class: "course-chip course-chip--soft" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-editor-thumbs" },
    });
    for (const [slide, index] of __VLS_getVForSourceType((__VLS_ctx.content.slides))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.loading))
                        return;
                    __VLS_ctx.setActiveSlide(slide.id);
                } },
            ...{ onDragstart: (...[$event]) => {
                    if (!(!__VLS_ctx.loading))
                        return;
                    __VLS_ctx.handleSlideDragStart(slide.id);
                } },
            ...{ onDragover: () => { } },
            ...{ onDrop: (...[$event]) => {
                    if (!(!__VLS_ctx.loading))
                        return;
                    __VLS_ctx.handleSlideDrop(slide.id);
                } },
            key: (slide.id),
            ...{ class: (['courseware-thumb', slide.id === __VLS_ctx.activeSlideId ? 'is-active' : '', slide.id === __VLS_ctx.draggingSlideId ? 'is-dragging' : '']) },
            draggable: "true",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "courseware-thumb__head" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (index + 1);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
        (__VLS_ctx.getCoursewareTemplateLabel(slide.template));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (slide.title || `未命名页面 ${index + 1}`);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (slide.blocks.length);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "courseware-thumb__actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.loading))
                        return;
                    __VLS_ctx.moveSlide(slide.id, -1);
                } },
            type: "button",
            ...{ class: "course-chip course-chip--soft" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.loading))
                        return;
                    __VLS_ctx.moveSlide(slide.id, 1);
                } },
            type: "button",
            ...{ class: "course-chip course-chip--soft" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.loading))
                        return;
                    __VLS_ctx.duplicateSlide(slide.id);
                } },
            type: "button",
            ...{ class: "course-chip course-chip--soft" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.loading))
                        return;
                    __VLS_ctx.removeSlide(slide.id);
                } },
            type: "button",
            ...{ class: "course-chip my-resources-delete-btn" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "courseware-editor-stage-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-editor-panel__head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-editor-panel__eyebrow" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    (__VLS_ctx.currentSlide?.title || '页面预览');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-editor-stage-panel__meta" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.currentSlide ? __VLS_ctx.getCoursewareTemplateLabel(__VLS_ctx.currentSlide.template) : '未选择页面');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.currentSlide?.blocks.length || 0);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-editor-stage" },
        ...{ class: ({ 'is-preview': __VLS_ctx.previewMode }) },
    });
    if (__VLS_ctx.currentSlide) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: (['courseware-slide', `is-${__VLS_ctx.currentSlide.template}`]) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
            ...{ class: "courseware-slide__header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.currentSlide.title || '未命名页面');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.currentSlide.note || '可在右侧为当前页面补充备注说明');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "courseware-slide__body" },
        });
        for (const [block] of __VLS_getVForSourceType((__VLS_ctx.currentSlide.blocks))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.currentSlide))
                            return;
                        __VLS_ctx.selectBlock(block.id);
                    } },
                key: (block.id),
                type: "button",
                ...{ class: (['courseware-block', `is-${block.type}`, __VLS_ctx.selectedBlockId === block.id ? 'is-selected' : '', __VLS_ctx.previewMode ? 'is-preview' : '']) },
            });
            if (block.type === 'text') {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "courseware-block__badge" },
                });
                (__VLS_ctx.textStyleLabel(block.style));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (block.text);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
                (__VLS_ctx.textAlignLabel(block.align));
            }
            else if (block.type === 'image') {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "courseware-block__preview" },
                });
                if (block.previewUrl) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                        src: (__VLS_ctx.resolvePreviewUrl(block.previewUrl)),
                        alt: (block.title),
                    });
                }
                else {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (block.title);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
                (block.caption || block.description || '图片素材引用块');
            }
            else if (block.type === 'resource') {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "courseware-block__badge" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (block.title);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
                (block.caption || block.fileName || '资料引用块');
                __VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
                (block.courseName);
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "courseware-block__badge" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (block.title);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
                (block.caption || block.description || '视频引用块');
                __VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
                (block.duration ? `${block.duration} 秒` : '未记录时长');
            }
        }
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "course-detail-empty" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
        ...{ class: "courseware-editor-inspector" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "courseware-editor-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-editor-panel__head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-editor-panel__eyebrow" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-editor-form" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "my-resources-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.form.title),
        type: "text",
        maxlength: "200",
        placeholder: "请输入课件标题",
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
        value: (__VLS_ctx.form.prepId),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "",
    });
    for (const [prep] of __VLS_getVForSourceType((__VLS_ctx.availablePreps))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (prep.id),
            value: (String(prep.id)),
        });
        (prep.title);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "my-resources-field my-resources-field--full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.form.summary),
        rows: "4",
        maxlength: "2000",
        placeholder: "补充课件用途、章节范围或课堂说明",
    });
    if (__VLS_ctx.currentSlide) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: "courseware-editor-panel" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "courseware-editor-panel__head" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "courseware-editor-panel__eyebrow" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "courseware-editor-form" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "my-resources-field" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            value: (__VLS_ctx.currentSlide.title),
            type: "text",
            maxlength: "120",
            placeholder: "请输入页面标题",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "my-resources-field" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
            value: (__VLS_ctx.currentSlide.template),
        });
        for (const [template] of __VLS_getVForSourceType((__VLS_ctx.COURSEWARE_TEMPLATE_OPTIONS))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                key: (template.value),
                value: (template.value),
            });
            (template.label);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "my-resources-field my-resources-field--full" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
            value: (__VLS_ctx.currentSlide.note),
            rows: "3",
            maxlength: "2000",
            placeholder: "记录本页讲解备注、口播提示或课堂说明",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "courseware-editor-insert" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.addTextBlockToCurrentSlide) },
            type: "button",
            ...{ class: "course-chip" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.currentSlide))
                        return;
                    __VLS_ctx.duplicateSlide(__VLS_ctx.currentSlide.id);
                } },
            type: "button",
            ...{ class: "course-chip course-chip--soft" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.currentSlide))
                        return;
                    __VLS_ctx.removeSlide(__VLS_ctx.currentSlide.id);
                } },
            type: "button",
            ...{ class: "course-chip my-resources-delete-btn" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "courseware-editor-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-editor-panel__head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-editor-panel__eyebrow" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.loadLibraries) },
        type: "button",
        ...{ class: "course-chip course-chip--soft" },
        disabled: (__VLS_ctx.libraryLoading),
    });
    (__VLS_ctx.libraryLoading ? '加载中...' : '刷新');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-editor-search" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onKeyup: (__VLS_ctx.loadLibraries) },
        value: (__VLS_ctx.libraryFilters.assetKeyword),
        type: "text",
        maxlength: "100",
        placeholder: "搜索图片素材",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-library-list" },
    });
    for (const [asset] of __VLS_getVForSourceType((__VLS_ctx.imageAssets))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (asset.id),
            ...{ class: "courseware-library-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "courseware-library-item__main" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (asset.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (asset.description || asset.courseName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.loading))
                        return;
                    __VLS_ctx.insertImageBlock(asset);
                } },
            type: "button",
            ...{ class: "course-chip" },
        });
    }
    if (!__VLS_ctx.imageAssets.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "course-detail-empty course-detail-empty--compact" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "courseware-editor-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-editor-panel__head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-editor-panel__eyebrow" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-editor-search" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onKeyup: (__VLS_ctx.loadLibraries) },
        value: (__VLS_ctx.libraryFilters.materialKeyword),
        type: "text",
        maxlength: "100",
        placeholder: "搜索资料资源",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-library-list" },
    });
    for (const [resource] of __VLS_getVForSourceType((__VLS_ctx.materialResources))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (resource.id),
            ...{ class: "courseware-library-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "courseware-library-item__main" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (resource.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (resource.fileName || resource.description || resource.courseName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.loading))
                        return;
                    __VLS_ctx.insertResourceBlock(resource);
                } },
            type: "button",
            ...{ class: "course-chip" },
        });
    }
    if (!__VLS_ctx.materialResources.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "course-detail-empty course-detail-empty--compact" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "courseware-editor-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-editor-panel__head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-editor-panel__eyebrow" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-editor-search" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onKeyup: (__VLS_ctx.loadLibraries) },
        value: (__VLS_ctx.libraryFilters.videoKeyword),
        type: "text",
        maxlength: "100",
        placeholder: "搜索视频资源",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "courseware-library-list" },
    });
    for (const [resource] of __VLS_getVForSourceType((__VLS_ctx.videoResources))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (resource.id),
            ...{ class: "courseware-library-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "courseware-library-item__main" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (resource.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (resource.description || resource.courseName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.loading))
                        return;
                    __VLS_ctx.insertVideoBlock(resource);
                } },
            type: "button",
            ...{ class: "course-chip" },
        });
    }
    if (!__VLS_ctx.videoResources.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "course-detail-empty course-detail-empty--compact" },
        });
    }
    if (__VLS_ctx.selectedBlock) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: "courseware-editor-panel" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "courseware-editor-panel__head" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "courseware-editor-panel__eyebrow" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "courseware-editor-form" },
        });
        if (__VLS_ctx.selectedBlock.type === 'text') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "my-resources-field my-resources-field--full" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
                value: (__VLS_ctx.selectedBlock.text),
                rows: "5",
                maxlength: "5000",
                placeholder: "请输入文本内容",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "my-resources-field" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                value: (__VLS_ctx.selectedBlock.style),
            });
            for (const [item] of __VLS_getVForSourceType((__VLS_ctx.COURSEWARE_TEXT_STYLE_OPTIONS))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    key: (item.value),
                    value: (item.value),
                });
                (item.label);
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "my-resources-field" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                value: (__VLS_ctx.selectedBlock.align),
            });
            for (const [item] of __VLS_getVForSourceType((__VLS_ctx.COURSEWARE_TEXT_ALIGN_OPTIONS))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    key: (item.value),
                    value: (item.value),
                });
                (item.label);
            }
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "my-resources-field my-resources-field--full" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                value: (__VLS_ctx.selectedBlock.title),
                type: "text",
                disabled: true,
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "my-resources-field my-resources-field--full" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
                value: (__VLS_ctx.selectedBlock.caption),
                rows: "3",
                maxlength: "300",
                placeholder: "为当前引用块补充说明",
            });
            if ('previewUrl' in __VLS_ctx.selectedBlock && __VLS_ctx.selectedBlock.previewUrl) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!__VLS_ctx.loading))
                                return;
                            if (!(__VLS_ctx.selectedBlock))
                                return;
                            if (!!(__VLS_ctx.selectedBlock.type === 'text'))
                                return;
                            if (!('previewUrl' in __VLS_ctx.selectedBlock && __VLS_ctx.selectedBlock.previewUrl))
                                return;
                            __VLS_ctx.openPreviewLink(__VLS_ctx.selectedBlock.previewUrl);
                        } },
                    type: "button",
                    ...{ class: "course-chip course-chip--soft" },
                });
            }
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "courseware-editor-insert" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.selectedBlock))
                        return;
                    __VLS_ctx.removeBlock(__VLS_ctx.selectedBlock.id);
                } },
            type: "button",
            ...{ class: "course-chip my-resources-delete-btn" },
        });
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "teacher-dashboard-panel course-detail-empty" },
    });
}
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-page']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-page']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-sidebar__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-main']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-main']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-toolbar__title']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-head__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-toolbar__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['course-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text--success']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-workbench']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-rail']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-rail__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-thumbs']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-thumb__head']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-thumb__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-stage-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-stage-panel__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-stage']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-slide__header']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-slide__body']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-block__badge']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-block__preview']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-block__badge']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-block__badge']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-inspector']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-form']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-form']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-insert']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-search']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-library-list']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-library-item']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-library-item__main']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-search']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-library-list']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-library-item']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-library-item__main']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-search']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-library-list']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-library-item']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-library-item__main']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty--compact']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-form']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['courseware-editor-insert']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            TeacherSidebarNav: TeacherSidebarNav,
            COURSEWARE_TEMPLATE_OPTIONS: COURSEWARE_TEMPLATE_OPTIONS,
            COURSEWARE_TEXT_ALIGN_OPTIONS: COURSEWARE_TEXT_ALIGN_OPTIONS,
            COURSEWARE_TEXT_STYLE_OPTIONS: COURSEWARE_TEXT_STYLE_OPTIONS,
            getCoursewareTemplateLabel: getCoursewareTemplateLabel,
            loading: loading,
            saving: saving,
            publishing: publishing,
            libraryLoading: libraryLoading,
            previewMode: previewMode,
            errorMessage: errorMessage,
            successMessage: successMessage,
            activeSlideId: activeSlideId,
            selectedBlockId: selectedBlockId,
            draggingSlideId: draggingSlideId,
            courseOptions: courseOptions,
            imageAssets: imageAssets,
            materialResources: materialResources,
            videoResources: videoResources,
            form: form,
            content: content,
            libraryFilters: libraryFilters,
            currentSlide: currentSlide,
            selectedBlock: selectedBlock,
            availablePreps: availablePreps,
            statusLabel: statusLabel,
            toolbarSummary: toolbarSummary,
            resolvePreviewUrl: resolvePreviewUrl,
            openPreviewLink: openPreviewLink,
            goBack: goBack,
            setActiveSlide: setActiveSlide,
            selectBlock: selectBlock,
            addSlide: addSlide,
            duplicateSlide: duplicateSlide,
            removeSlide: removeSlide,
            moveSlide: moveSlide,
            handleSlideDragStart: handleSlideDragStart,
            handleSlideDrop: handleSlideDrop,
            addTextBlockToCurrentSlide: addTextBlockToCurrentSlide,
            removeBlock: removeBlock,
            insertImageBlock: insertImageBlock,
            insertResourceBlock: insertResourceBlock,
            insertVideoBlock: insertVideoBlock,
            textStyleLabel: textStyleLabel,
            textAlignLabel: textAlignLabel,
            loadLibraries: loadLibraries,
            saveCourseware: saveCourseware,
            publishCoursewareAction: publishCoursewareAction,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
