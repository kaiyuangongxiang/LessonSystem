export const COURSEWARE_TEMPLATE_OPTIONS = [
    { value: 'cover', label: '封面页', hint: '适合课程标题、教师信息与主题导入。' },
    { value: 'agenda', label: '目录页', hint: '适合列出章节提纲、课堂安排与步骤。' },
    { value: 'content', label: '内容页', hint: '适合正文讲解、案例说明与重点展示。' },
    { value: 'two-column', label: '双栏页', hint: '适合左右对照、知识点拆分与图文并列。' },
    { value: 'summary', label: '总结页', hint: '适合课堂总结、复习提醒与作业布置。' },
];
export const COURSEWARE_TEXT_STYLE_OPTIONS = [
    { value: 'title', label: '主标题' },
    { value: 'subtitle', label: '副标题' },
    { value: 'body', label: '正文' },
    { value: 'caption', label: '说明' },
    { value: 'quote', label: '强调' },
];
export const COURSEWARE_TEXT_ALIGN_OPTIONS = [
    { value: 'left', label: '左对齐' },
    { value: 'center', label: '居中' },
    { value: 'right', label: '右对齐' },
];
export function createCoursewareClientId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
export function createTextBlock(text = '请输入文本内容') {
    return {
        id: createCoursewareClientId('block'),
        type: 'text',
        text,
        style: 'body',
        align: 'left',
    };
}
export function createImageBlock(block) {
    return {
        id: createCoursewareClientId('block'),
        ...block,
    };
}
export function createResourceBlock(block) {
    return {
        id: createCoursewareClientId('block'),
        ...block,
    };
}
export function createVideoBlock(block) {
    return {
        id: createCoursewareClientId('block'),
        ...block,
    };
}
export function createCoursewareSlide(template = 'content', title = '新页面') {
    return {
        id: createCoursewareClientId('slide'),
        title,
        template,
        note: '',
        blocks: [createTextBlock(template === 'cover' ? '请输入封面标题' : '请输入当前页内容')],
    };
}
export function cloneCoursewareSlide(slide) {
    return {
        ...slide,
        id: createCoursewareClientId('slide'),
        blocks: slide.blocks.map((block) => ({
            ...block,
            id: createCoursewareClientId('block'),
        })),
    };
}
export function cloneCoursewareContent(content) {
    return {
        version: content.version,
        slides: content.slides.map((slide) => cloneCoursewareSlide(slide)),
    };
}
export function getCoursewareTemplateLabel(template) {
    return COURSEWARE_TEMPLATE_OPTIONS.find((item) => item.value === template)?.label || '内容页';
}
