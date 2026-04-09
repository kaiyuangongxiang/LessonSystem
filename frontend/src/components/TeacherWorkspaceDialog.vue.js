import { computed } from 'vue';
const props = withDefaults(defineProps(), {
    description: '',
    eyebrow: '',
    size: 'default',
    disabled: false,
});
const emit = defineEmits();
const sizeClass = computed(() => (props.size === 'wide' ? 'teacher-workspace-dialog__panel--wide' : ''));
function handleClose() {
    if (props.disabled) {
        return;
    }
    emit('update:modelValue', false);
    emit('close');
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    description: '',
    eyebrow: '',
    size: 'default',
    disabled: false,
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
if (__VLS_ctx.modelValue) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.handleClose) },
        ...{ class: "teacher-workspace-dialog" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: (['teacher-workspace-dialog__panel', __VLS_ctx.sizeClass]) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "teacher-workspace-dialog__head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    if (__VLS_ctx.eyebrow) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "teacher-workspace-dialog__eyebrow" },
        });
        (__VLS_ctx.eyebrow);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    (__VLS_ctx.title);
    if (__VLS_ctx.description) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.description);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.handleClose) },
        type: "button",
        ...{ class: "course-chip course-chip--soft" },
        disabled: (__VLS_ctx.disabled),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "teacher-workspace-dialog__body" },
    });
    var __VLS_0 = {};
}
/** @type {__VLS_StyleScopedClasses['teacher-workspace-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-workspace-dialog__head']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-workspace-dialog__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-workspace-dialog__body']} */ ;
// @ts-ignore
var __VLS_1 = __VLS_0;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            sizeClass: sizeClass,
            handleClose: handleClose,
        };
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
const __VLS_component = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
export default {};
; /* PartiallyEnd: #4569/main.vue */
