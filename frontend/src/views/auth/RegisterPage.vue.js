import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AuthLayout from '@/layouts/AuthLayout.vue';
import http from '@/services/http';
const router = useRouter();
const loading = ref(false);
const feedback = reactive({
    type: 'error',
    message: '',
});
const form = reactive({
    username: '',
    password: '',
    confirmPassword: '',
});
const notes = ['进入教师工作台', '查看课程列表与课程详情', '上传资料、视频并管理资源'];
async function handleSubmit() {
    if (!form.username || !form.password || !form.confirmPassword) {
        feedback.type = 'error';
        feedback.message = '请完整填写注册信息';
        return;
    }
    if (form.password !== form.confirmPassword) {
        feedback.type = 'error';
        feedback.message = '两次输入的密码不一致';
        return;
    }
    loading.value = true;
    feedback.message = '';
    try {
        await http.post('/auth/register', {
            username: form.username,
            password: form.password,
        });
        feedback.type = 'success';
        feedback.message = '注册成功，正在返回登录页';
        setTimeout(() => {
            router.push('/login');
        }, 800);
    }
    catch (error) {
        feedback.type = 'error';
        feedback.message = error?.response?.data?.message || '注册失败，请稍后重试';
    }
    finally {
        loading.value = false;
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {[typeof AuthLayout, typeof AuthLayout, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(AuthLayout, new AuthLayout({
    heroEyebrow: "TEACHER ONBOARDING",
    heroTitle: "创建教师账号",
    heroDescription: "注册后即可进入教师中心，上传课程资料与教学视频，快速开始个人备课工作流。",
    panelTitle: "注册完成后可执行",
    notes: (__VLS_ctx.notes),
}));
const __VLS_1 = __VLS_0({
    heroEyebrow: "TEACHER ONBOARDING",
    heroTitle: "创建教师账号",
    heroDescription: "注册后即可进入教师中心，上传课程资料与教学视频，快速开始个人备课工作流。",
    panelTitle: "注册完成后可执行",
    notes: (__VLS_ctx.notes),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
var __VLS_3 = {};
__VLS_2.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-card auth-card--register" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "auth-card__sub" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.handleSubmit) },
    ...{ class: "auth-form auth-form--register" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    for: "username",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "username",
    value: (__VLS_ctx.form.username),
    type: "text",
    placeholder: "请输入唯一用户名",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-form__row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    for: "password",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "password",
    type: "password",
    placeholder: "建议包含数字和字母",
});
(__VLS_ctx.form.password);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    for: "confirmPassword",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "confirmPassword",
    type: "password",
    placeholder: "请再次输入密码",
});
(__VLS_ctx.form.confirmPassword);
if (__VLS_ctx.feedback.message) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: (['feedback-text', __VLS_ctx.feedback.type === 'error' ? 'feedback-text--error' : 'feedback-text--success']) },
    });
    (__VLS_ctx.feedback.message);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ class: "auth-btn" },
    type: "submit",
    disabled: (__VLS_ctx.loading),
});
(__VLS_ctx.loading ? '注册中...' : '立即注册');
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/login');
        } },
    ...{ class: "auth-btn--secondary" },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-tip auth-tip--register" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-tip__title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['auth-card']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-card--register']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-card__sub']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-form']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-form--register']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-field']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-form__row']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-field']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-field']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-tip']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-tip--register']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-tip__title']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AuthLayout: AuthLayout,
            router: router,
            loading: loading,
            feedback: feedback,
            form: form,
            notes: notes,
            handleSubmit: handleSubmit,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
