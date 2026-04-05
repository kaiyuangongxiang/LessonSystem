import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AuthLayout from '@/layouts/AuthLayout.vue';
import http from '@/services/http';
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const feedback = reactive({
    type: 'error',
    message: '',
});
const form = reactive({
    displayName: '',
    username: '',
    password: '',
    confirmPassword: '',
    gender: '',
    collegeId: '',
    email: '',
    profile: '',
});
const selectedRole = ref('teacher');
const defaultGenders = ['男', '女', '未知'];
const registerOptions = reactive({
    colleges: [],
    genders: [...defaultGenders],
});
const notes = ['教师、学生都支持自助注册', '注册成功后跳回对应登录页', '学院与性别选项来自系统配置'];
function resolveRole(value) {
    return value === 'student' ? 'student' : 'teacher';
}
function changeRole(role) {
    selectedRole.value = role;
    router.replace({ path: '/register', query: { role } });
}
function goLogin() {
    router.push({ path: '/login', query: { role: selectedRole.value } });
}
async function loadRegisterOptions() {
    try {
        const response = await http.get('/auth/register-options');
        registerOptions.colleges = response.data.data.colleges || [];
        registerOptions.genders = response.data.data.genders?.length ? response.data.data.genders : [...defaultGenders];
    }
    catch {
        registerOptions.colleges = [];
        registerOptions.genders = [...defaultGenders];
    }
}
async function handleSubmit() {
    if (!form.displayName || !form.username || !form.gender || !form.collegeId || !form.password || !form.confirmPassword) {
        feedback.type = 'error';
        feedback.message = '请完整填写必填信息';
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
            role: selectedRole.value,
            username: form.username,
            password: form.password,
            gender: form.gender,
            collegeId: form.collegeId || undefined,
            email: form.email,
            profile: form.profile,
            ...(selectedRole.value === 'student' ? { studentName: form.displayName } : { teacherName: form.displayName }),
        });
        feedback.type = 'success';
        feedback.message = `注册成功，正在返回${selectedRole.value === 'student' ? '学生' : '教师'}登录页`;
        setTimeout(() => {
            goLogin();
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
watch(() => route.query.role, (role) => {
    selectedRole.value = resolveRole(role);
}, { immediate: true });
onMounted(() => {
    loadRegisterOptions();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {[typeof AuthLayout, typeof AuthLayout, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(AuthLayout, new AuthLayout({
    heroEyebrow: "ACCOUNT REGISTER",
    heroTitle: (__VLS_ctx.selectedRole === 'student' ? '创建学生账号' : '创建教师账号'),
    heroDescription: "完成基础信息登记后即可进入对应工作台。邮箱和个人简介为选填，其他信息为必填。",
    panelTitle: "注册说明",
    notes: (__VLS_ctx.notes),
}));
const __VLS_1 = __VLS_0({
    heroEyebrow: "ACCOUNT REGISTER",
    heroTitle: (__VLS_ctx.selectedRole === 'student' ? '创建学生账号' : '创建教师账号'),
    heroDescription: "完成基础信息登记后即可进入对应工作台。邮箱和个人简介为选填，其他信息为必填。",
    panelTitle: "注册说明",
    notes: (__VLS_ctx.notes),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
var __VLS_3 = {};
__VLS_2.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-card auth-card--register auth-card--register-compact" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-actions auth-actions--tabs" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.changeRole('teacher');
        } },
    ...{ class: (['auth-btn--secondary', 'auth-role-btn', __VLS_ctx.selectedRole === 'teacher' ? 'is-active' : '']) },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.changeRole('student');
        } },
    ...{ class: (['auth-btn--secondary', 'auth-role-btn', __VLS_ctx.selectedRole === 'student' ? 'is-active' : '']) },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
(__VLS_ctx.selectedRole === 'student' ? '学生快速注册' : '教师快速注册');
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "auth-card__sub" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.handleSubmit) },
    ...{ class: "auth-form auth-form--register auth-form--register-compact" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-form__row auth-form__row--register" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    for: "displayName",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "auth-required" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "displayName",
    value: (__VLS_ctx.form.displayName),
    type: "text",
    maxlength: "50",
    placeholder: (__VLS_ctx.selectedRole === 'student' ? '请输入学生真实姓名' : '请输入教师真实姓名'),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    for: "username",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "auth-required" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "username",
    value: (__VLS_ctx.form.username),
    type: "text",
    maxlength: "50",
    placeholder: "请输入唯一用户名",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-form__row auth-form__row--register" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    for: "gender",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "auth-required" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    id: "gender",
    value: (__VLS_ctx.form.gender),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.registerOptions.genders))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (item),
        value: (item),
    });
    (item);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    for: "collegeId",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "auth-required" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    id: "collegeId",
    value: (__VLS_ctx.form.collegeId),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
for (const [college] of __VLS_getVForSourceType((__VLS_ctx.registerOptions.colleges))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (college.id),
        value: (String(college.id)),
    });
    (college.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-form__row auth-form__row--register" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    for: "password",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "auth-required" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "password",
    type: "password",
    maxlength: "50",
    placeholder: "至少 6 位，建议包含数字和字母",
});
(__VLS_ctx.form.password);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    for: "confirmPassword",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "auth-required" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "confirmPassword",
    type: "password",
    maxlength: "50",
    placeholder: "请再次输入密码",
});
(__VLS_ctx.form.confirmPassword);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-form__row auth-form__row--register" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    for: "email",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "email",
    type: "email",
    maxlength: "100",
    placeholder: "请输入常用邮箱，可为空",
});
(__VLS_ctx.form.email);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "auth-field auth-field--register-wide" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    for: "profile",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
    id: "profile",
    value: (__VLS_ctx.form.profile),
    maxlength: "2000",
    placeholder: "可填写研究方向、学习方向或个人简介",
});
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
    ...{ onClick: (__VLS_ctx.goLogin) },
    ...{ class: "auth-btn--secondary" },
    type: "button",
});
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['auth-card']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-card--register']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-card--register-compact']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-actions--tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-card__sub']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-form']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-form--register']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-form--register-compact']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-form__row']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-form__row--register']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-field']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-required']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-field']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-required']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-form__row']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-form__row--register']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-field']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-required']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-field']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-required']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-form__row']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-form__row--register']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-field']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-required']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-field']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-required']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-form__row']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-form__row--register']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-field']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-field']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-field--register-wide']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AuthLayout: AuthLayout,
            loading: loading,
            feedback: feedback,
            form: form,
            selectedRole: selectedRole,
            registerOptions: registerOptions,
            notes: notes,
            changeRole: changeRole,
            goLogin: goLogin,
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
