import { computed, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import AuthLayout from '@/layouts/AuthLayout.vue';
import http from '@/services/http';
import { useAuthStore } from '@/stores/auth';
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const errorMessage = ref('');
const selectedRole = ref('teacher');
const form = reactive({
    username: '',
    password: '',
});
const stats = [
    { label: '课程总量', value: '128' },
    { label: '资料总量', value: '2860' },
    { label: '交流主题', value: '96' },
];
const notes = ['教师、学生、管理员统一入口', '教学资源与交流逐步联通', '支持多角色登录跳转'];
const roleTitle = computed(() => {
    if (selectedRole.value === 'student') {
        return '学生登录';
    }
    if (selectedRole.value === 'admin') {
        return '管理员登录';
    }
    return '教师登录';
});
const roleDescription = computed(() => {
    if (selectedRole.value === 'student') {
        return '请输入学生账号和密码，进入学生中心。';
    }
    if (selectedRole.value === 'admin') {
        return '请输入管理员账号和密码，进入后台管理中心。';
    }
    return '请输入教师账号和密码，进入教师工作台。';
});
const rolePlaceholder = computed(() => {
    if (selectedRole.value === 'student') {
        return {
            username: '请输入学生账号',
            password: '请输入学生登录密码',
        };
    }
    if (selectedRole.value === 'admin') {
        return {
            username: '请输入管理员账号',
            password: '请输入管理员登录密码',
        };
    }
    return {
        username: '请输入教师账号',
        password: '请输入教师登录密码',
    };
});
function resolveRole(value) {
    if (value === 'student') {
        return 'student';
    }
    if (value === 'admin') {
        return 'admin';
    }
    return 'teacher';
}
watch(() => route.query.role, (role) => {
    selectedRole.value = resolveRole(role);
}, { immediate: true });
async function handleSubmit() {
    if (!form.username || !form.password) {
        errorMessage.value = '请输入用户名和密码';
        return;
    }
    loading.value = true;
    errorMessage.value = '';
    try {
        const response = await http.post('/auth/login', {
            ...form,
            role: selectedRole.value,
        });
        const payload = response.data.data;
        if (payload.role !== selectedRole.value) {
            errorMessage.value = `当前账号不是${roleTitle.value.replace('登录', '')}账号`;
            return;
        }
        authStore.setAuth({
            token: payload.token,
            role: payload.role,
            profile: payload.user,
        });
        if (payload.role === 'admin') {
            await router.push('/admin');
        }
        else if (payload.role === 'student') {
            await router.push('/student');
        }
        else {
            await router.push('/teacher');
        }
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
    heroEyebrow: "LESSON PREP PORTAL",
    heroTitle: "在线教师备课系统",
    heroDescription: "围绕课程、资料、视频与教学交流的统一入口，教师、学生和管理员都可从这里进入各自工作台。",
    panelTitle: "系统公告",
    stats: (__VLS_ctx.stats),
    notes: (__VLS_ctx.notes),
}));
const __VLS_1 = __VLS_0({
    heroEyebrow: "LESSON PREP PORTAL",
    heroTitle: "在线教师备课系统",
    heroDescription: "围绕课程、资料、视频与教学交流的统一入口，教师、学生和管理员都可从这里进入各自工作台。",
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
            __VLS_ctx.selectedRole = 'student';
        } },
    ...{ class: (['auth-btn--secondary', 'auth-role-btn', __VLS_ctx.selectedRole === 'student' ? 'is-active' : '']) },
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
(__VLS_ctx.roleTitle);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "auth-card__sub" },
});
(__VLS_ctx.roleDescription);
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
    placeholder: (__VLS_ctx.rolePlaceholder.username),
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
    placeholder: (__VLS_ctx.rolePlaceholder.password),
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
(__VLS_ctx.loading ? '登录中...' : __VLS_ctx.roleTitle);
if (__VLS_ctx.selectedRole !== 'admin') {
    const __VLS_4 = {}.RouterLink;
    /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.RouterLink, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        ...{ class: "auth-inline-link" },
        to: (`/register?role=${__VLS_ctx.selectedRole}`),
    }));
    const __VLS_6 = __VLS_5({
        ...{ class: "auth-inline-link" },
        to: (`/register?role=${__VLS_ctx.selectedRole}`),
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
    __VLS_7.slots.default;
    var __VLS_7;
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "auth-inline-link auth-inline-link--placeholder" },
        'aria-hidden': "true",
    });
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
/** @type {__VLS_StyleScopedClasses['auth-inline-link']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-inline-link--placeholder']} */ ;
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
            roleTitle: roleTitle,
            roleDescription: roleDescription,
            rolePlaceholder: rolePlaceholder,
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
