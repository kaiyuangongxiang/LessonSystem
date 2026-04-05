import { reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import AuthLayout from '@/layouts/AuthLayout.vue';
import http from '@/services/http';
import { useAuthStore } from '@/stores/auth';
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const errorMessage = ref('');
const selectedRole = ref('admin');
const form = reactive({
    username: '',
    password: '',
});
const stats = [
    { label: '课程总量', value: '128' },
    { label: '资料总量', value: '2860' },
    { label: '视频总量', value: '640' },
];
const notes = [
    '教师登录后进入教师中心首页',
    '管理员登录后进入后台控制台',
    '课程详情可查看资料与视频',
];
watch(() => route.query.role, (role) => {
    selectedRole.value = role === 'teacher' ? 'teacher' : 'admin';
}, { immediate: true });
async function handleSubmit() {
    if (!form.username || !form.password) {
        errorMessage.value = '请输入用户名和密码';
        return;
    }
    loading.value = true;
    errorMessage.value = '';
    try {
        const response = await http.post('/auth/login', form);
        const payload = response.data.data;
        if (payload.role !== selectedRole.value) {
            errorMessage.value = selectedRole.value === 'teacher' ? '当前账号不是教师账号' : '当前账号不是管理员账号';
            return;
        }
        authStore.setAuth({
            token: payload.token,
            role: payload.role,
            profile: payload.user,
        });
        await router.push(payload.role === 'admin' ? '/admin' : '/teacher');
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '登录失败，请检查账号或密码';
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
    heroEyebrow: "TEACHER PREP PORTAL",
    heroTitle: "在线教师备课系统",
    heroDescription: "围绕课程、资料与视频的统一备课平台，教师登录后即可进入今日备课工作台。",
    panelTitle: "系统公告",
    stats: (__VLS_ctx.stats),
    notes: (__VLS_ctx.notes),
}));
const __VLS_1 = __VLS_0({
    heroEyebrow: "TEACHER PREP PORTAL",
    heroTitle: "在线教师备课系统",
    heroDescription: "围绕课程、资料与视频的统一备课平台，教师登录后即可进入今日备课工作台。",
    panelTitle: "系统公告",
    stats: (__VLS_ctx.stats),
    notes: (__VLS_ctx.notes),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
var __VLS_3 = {};
__VLS_2.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-actions auth-actions--tabs" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.selectedRole = 'teacher';
        } },
    ...{ class: (['auth-btn--secondary', 'auth-role-btn', __VLS_ctx.selectedRole === 'teacher' ? 'is-active' : '']) },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.selectedRole = 'admin';
        } },
    ...{ class: (['auth-btn--secondary', 'auth-role-btn', __VLS_ctx.selectedRole === 'admin' ? 'is-active' : '']) },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
(__VLS_ctx.selectedRole === 'teacher' ? '教师登录' : '管理员登录');
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "auth-card__sub" },
});
(__VLS_ctx.selectedRole === 'teacher' ? '请输入教师账号和密码，进入今日备课工作台' : '请输入管理员账号和密码，进入后台管理中心');
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.handleSubmit) },
    ...{ class: "auth-form" },
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
    placeholder: (__VLS_ctx.selectedRole === 'teacher' ? '请输入教师账号' : '请输入管理员账号'),
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
    placeholder: (__VLS_ctx.selectedRole === 'teacher' ? '请输入教师登录密码' : '请输入管理员登录密码'),
});
(__VLS_ctx.form.password);
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "feedback-text feedback-text--error" },
    });
    (__VLS_ctx.errorMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ class: "auth-btn" },
    type: "submit",
    disabled: (__VLS_ctx.loading),
});
(__VLS_ctx.loading ? '登录中...' : __VLS_ctx.selectedRole === 'teacher' ? '教师登录' : '管理员登录');
if (__VLS_ctx.selectedRole === 'teacher') {
    const __VLS_4 = {}.RouterLink;
    /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.RouterLink, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        ...{ class: "auth-inline-link" },
        to: "/register",
    }));
    const __VLS_6 = __VLS_5({
        ...{ class: "auth-inline-link" },
        to: "/register",
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
    __VLS_7.slots.default;
    var __VLS_7;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ref: "tipRef",
    ...{ class: "auth-tip" },
});
/** @type {typeof __VLS_ctx.tipRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-tip__title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['auth-card']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-actions--tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-card__sub']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-form']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-field']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-field']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text--error']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-inline-link']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-tip']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-tip__title']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            RouterLink: RouterLink,
            AuthLayout: AuthLayout,
            loading: loading,
            errorMessage: errorMessage,
            selectedRole: selectedRole,
            form: form,
            stats: stats,
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
