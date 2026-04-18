import { computed, onMounted, reactive, ref } from 'vue';
import TeacherSidebarNav from '@/components/navigation/TeacherSidebarNav.vue';
import TeacherWorkspaceDialog from '@/components/TeacherWorkspaceDialog.vue';
import { getTeacherProfile, updateTeacherProfile } from '@/services/teacher';
import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
const loading = ref(false);
const saving = ref(false);
const showEditorDialog = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const collegeOptions = ref([]);
const genderOptions = ref([]);
const form = reactive({
    username: '',
    teacherName: '',
    gender: '',
    email: '',
    collegeId: '',
    profile: '',
});
const selectedCollegeName = computed(() => {
    const college = collegeOptions.value.find((item) => String(item.id) === form.collegeId);
    return college?.name || '未选择学院';
});
const profileStatusText = computed(() => {
    const fields = [form.username, form.teacherName, form.gender, form.collegeId, form.email, form.profile];
    const completed = fields.filter((item) => String(item || '').trim()).length;
    return completed >= 6 ? '资料完整' : completed >= 4 ? '资料待完善' : '资料较少';
});
function fillForm(profile) {
    form.username = profile.username || '';
    form.teacherName = profile.teacherName || '';
    form.gender = profile.gender || '';
    form.email = profile.email || '';
    form.collegeId = profile.collegeId ? String(profile.collegeId) : '';
    form.profile = profile.profile || '';
}
function openEditorDialog() {
    errorMessage.value = '';
    showEditorDialog.value = true;
}
function closeEditorDialog() {
    if (saving.value) {
        return;
    }
    showEditorDialog.value = false;
    errorMessage.value = '';
}
async function loadProfile() {
    loading.value = true;
    errorMessage.value = '';
    successMessage.value = '';
    try {
        const result = await getTeacherProfile();
        collegeOptions.value = result.options.colleges;
        genderOptions.value = result.options.genders;
        fillForm(result.profile);
    }
    catch (error) {
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
        errorMessage.value = '请完整填写必填信息';
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
        fillForm(result);
        authStore.updateProfile({
            id: result.id,
            username: result.username,
            name: result.teacherName,
        });
        showEditorDialog.value = false;
        successMessage.value = '个人资料已更新';
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '个人资料保存失败';
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
/** @type {[typeof TeacherSidebarNav, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(TeacherSidebarNav, new TeacherSidebarNav({
    active: "profile",
}));
const __VLS_1 = __VLS_0({
    active: "profile",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "teacher-dashboard-main teacher-profile-main" },
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-head__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.openEditorDialog) },
    type: "button",
    ...{ class: "auth-btn" },
    disabled: (__VLS_ctx.loading),
});
if (__VLS_ctx.errorMessage && !__VLS_ctx.showEditorDialog) {
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "teacher-profile-panel teacher-profile-panel--preview" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-panel__head teacher-profile-panel__head--preview" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-head__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "teacher-profile-panel__status" },
});
(__VLS_ctx.selectedCollegeName);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-summary teacher-profile-summary--wide" },
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
(__VLS_ctx.form.gender || '未填写');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-summary__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.form.email || '未填写');
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
(__VLS_ctx.profileStatusText);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-summary__item teacher-profile-summary__item--full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.form.profile || '暂未填写个人简介');
/** @type {[typeof TeacherWorkspaceDialog, typeof TeacherWorkspaceDialog, ]} */ ;
// @ts-ignore
const __VLS_3 = __VLS_asFunctionalComponent(TeacherWorkspaceDialog, new TeacherWorkspaceDialog({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showEditorDialog),
    eyebrow: "PROFILE EDITOR",
    title: "编辑资料",
    description: "在弹窗中维护教师基础信息，保存后将自动同步当前登录资料。",
    size: "wide",
    disabled: (__VLS_ctx.saving),
}));
const __VLS_4 = __VLS_3({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showEditorDialog),
    eyebrow: "PROFILE EDITOR",
    title: "编辑资料",
    description: "在弹窗中维护教师基础信息，保存后将自动同步当前登录资料。",
    size: "wide",
    disabled: (__VLS_ctx.saving),
}, ...__VLS_functionalComponentArgsRest(__VLS_3));
let __VLS_6;
let __VLS_7;
let __VLS_8;
const __VLS_9 = {
    onClose: (__VLS_ctx.closeEditorDialog)
};
__VLS_5.slots.default;
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "course-feedback teacher-workspace-dialog__feedback" },
    });
    (__VLS_ctx.errorMessage);
}
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-editor__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.loadProfile) },
    type: "button",
    ...{ class: "auth-btn auth-btn--secondary" },
    disabled: (__VLS_ctx.loading || __VLS_ctx.saving),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.closeEditorDialog) },
    type: "button",
    ...{ class: "auth-btn auth-btn--secondary" },
    disabled: (__VLS_ctx.saving),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
    ...{ class: "auth-btn" },
    disabled: (__VLS_ctx.loading || __VLS_ctx.saving),
});
(__VLS_ctx.saving ? '保存中...' : '保存资料');
var __VLS_5;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-page']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-sidebar__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-main']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-main']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-head']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-head__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-head__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['course-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text--success']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-panel--preview']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-panel__head--preview']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-head__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-panel__status']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-summary--wide']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-summary__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-summary__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-summary__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-summary__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-summary__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-summary__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-summary__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-summary__item--full']} */ ;
/** @type {__VLS_StyleScopedClasses['course-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-workspace-dialog__feedback']} */ ;
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
/** @type {__VLS_StyleScopedClasses['teacher-profile-editor__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            TeacherSidebarNav: TeacherSidebarNav,
            TeacherWorkspaceDialog: TeacherWorkspaceDialog,
            loading: loading,
            saving: saving,
            showEditorDialog: showEditorDialog,
            errorMessage: errorMessage,
            successMessage: successMessage,
            collegeOptions: collegeOptions,
            genderOptions: genderOptions,
            form: form,
            selectedCollegeName: selectedCollegeName,
            profileStatusText: profileStatusText,
            openEditorDialog: openEditorDialog,
            closeEditorDialog: closeEditorDialog,
            loadProfile: loadProfile,
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
