import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getTeacherProfile, updateTeacherProfile, } from '@/services/teacher';
import { useAuthStore } from '@/stores/auth';
const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const collegeOptions = ref([]);
const genderOptions = ref([]);
const originalProfile = ref(null);
const form = reactive({
    username: '',
    teacherName: '',
    gender: '',
    email: '',
    collegeId: '',
    profile: '',
});
const headerText = computed(() => {
    const name = originalProfile.value?.teacherName || authStore.profile?.name || authStore.profile?.username || '教师用户';
    return `${name}，你可以在这里维护教师账号的基础信息。`;
});
const selectedCollegeName = computed(() => {
    const college = collegeOptions.value.find((item) => String(item.id) === form.collegeId);
    return college?.name || '未选择';
});
function fillForm(profile) {
    form.username = profile.username || '';
    form.teacherName = profile.teacherName || '';
    form.gender = profile.gender || '';
    form.email = profile.email || '';
    form.collegeId = profile.collegeId ? String(profile.collegeId) : '';
    form.profile = profile.profile || '';
}
function resetForm() {
    if (!originalProfile.value) {
        return;
    }
    fillForm(originalProfile.value);
    errorMessage.value = '';
    successMessage.value = '';
}
async function loadProfile() {
    loading.value = true;
    errorMessage.value = '';
    try {
        const result = await getTeacherProfile();
        originalProfile.value = result.profile;
        collegeOptions.value = result.options.colleges;
        genderOptions.value = result.options.genders;
        fillForm(result.profile);
    }
    catch (error) {
        originalProfile.value = null;
        collegeOptions.value = [];
        genderOptions.value = ['男', '女', '未知'];
        errorMessage.value = error?.response?.data?.message || '教师资料加载失败';
    }
    finally {
        loading.value = false;
    }
}
async function submitProfile() {
    errorMessage.value = '';
    successMessage.value = '';
    if (!form.username || !form.teacherName || !form.gender || !form.collegeId) {
        errorMessage.value = '请完整填写基础信息';
        return;
    }
    saving.value = true;
    try {
        const result = await updateTeacherProfile({
            username: form.username,
            teacherName: form.teacherName,
            gender: form.gender,
            email: form.email,
            collegeId: form.collegeId,
            profile: form.profile,
        });
        originalProfile.value = result;
        fillForm(result);
        authStore.updateProfile({
            id: result.id,
            username: result.username,
            name: result.teacherName,
        });
        successMessage.value = '教师个人资料已更新';
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '教师资料保存失败';
    }
    finally {
        saving.value = false;
    }
}
onMounted(() => {
    loadProfile();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "teacher-profile-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "teacher-profile-sidebar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-sidebar__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "teacher-profile-nav" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher');
        } },
    type: "button",
    ...{ class: "teacher-profile-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher/messages');
        } },
    type: "button",
    ...{ class: "teacher-profile-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher/materials');
        } },
    type: "button",
    ...{ class: "teacher-profile-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher/videos');
        } },
    type: "button",
    ...{ class: "teacher-profile-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher/resources');
        } },
    type: "button",
    ...{ class: "teacher-profile-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "button",
    ...{ class: "teacher-profile-nav__item is-active" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "teacher-profile-side-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-side-card__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "teacher-profile-main" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "teacher-profile-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-head__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.headerText);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-head__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.resetForm) },
    type: "button",
    ...{ class: "auth-btn auth-btn--secondary" },
    disabled: (__VLS_ctx.saving),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.submitProfile) },
    type: "button",
    ...{ class: "auth-btn" },
    disabled: (__VLS_ctx.saving),
});
(__VLS_ctx.saving ? '保存中...' : '保存资料');
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "course-feedback" },
    });
    (__VLS_ctx.errorMessage);
}
if (__VLS_ctx.successMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "feedback-text feedback-text--success teacher-profile-feedback" },
    });
    (__VLS_ctx.successMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "teacher-profile-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "teacher-profile-panel teacher-profile-panel--form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.submitProfile) },
    ...{ class: "teacher-profile-form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-form__row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "teacher-profile-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.form.username),
    type: "text",
    maxlength: "50",
    placeholder: "请输入用户名",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "teacher-profile-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.form.teacherName),
    type: "text",
    maxlength: "50",
    placeholder: "请输入教师姓名",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-form__row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "teacher-profile-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.form.gender),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.genderOptions))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (item),
        value: (item),
    });
    (item);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "teacher-profile-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.form.collegeId),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
for (const [college] of __VLS_getVForSourceType((__VLS_ctx.collegeOptions))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (college.id),
        value: (String(college.id)),
    });
    (college.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-form__row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "teacher-profile-field teacher-profile-field--full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "email",
    maxlength: "100",
    placeholder: "请输入邮箱，可为空",
});
(__VLS_ctx.form.email);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-form__row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "teacher-profile-field teacher-profile-field--full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.form.profile),
    rows: "7",
    maxlength: "2000",
    placeholder: "请输入个人简介，可为空",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "teacher-profile-panel teacher-profile-panel--summary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-summary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-summary__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.form.username || '未填写');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-summary__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.form.teacherName || '未填写');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-summary__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.selectedCollegeName);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-summary__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.form.email || '未填写');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-note" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
/** @type {__VLS_StyleScopedClasses['teacher-profile-page']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-sidebar__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['is-active']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-side-card']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-side-card__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-main']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-head']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-head__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-head__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['course-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text--success']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-panel--form']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-form']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-form__row']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-field']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-field']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-form__row']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-field']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-field']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-form__row']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-field']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-form__row']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-field']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-panel--summary']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-summary__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-summary__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-summary__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-summary__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-note']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            saving: saving,
            errorMessage: errorMessage,
            successMessage: successMessage,
            collegeOptions: collegeOptions,
            genderOptions: genderOptions,
            form: form,
            headerText: headerText,
            selectedCollegeName: selectedCollegeName,
            resetForm: resetForm,
            submitProfile: submitProfile,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
