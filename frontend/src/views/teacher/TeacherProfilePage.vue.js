import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getTeacherProfile, updateTeacherProfile, } from '@/services/teacher';
import { useAuthStore } from '@/stores/auth';
const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const saving = ref(false);
const showEditor = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const collegeOptions = ref([]);
const genderOptions = ref([]);
const originalProfile = ref(null);
const editForm = reactive({
    username: '',
    teacherName: '',
    gender: '',
    email: '',
    collegeId: '',
    profile: '',
});
const headerText = computed(() => {
    const name = originalProfile.value?.teacherName || authStore.profile?.name || authStore.profile?.username || '教师用户';
    return `${name}，你可以在这里查看当前资料，并通过弹窗更新教师账户的基础信息。`;
});
const selectedCollegeName = computed(() => {
    const collegeId = originalProfile.value?.collegeId;
    const college = collegeOptions.value.find((item) => String(item.id) === String(collegeId));
    return college?.name || originalProfile.value?.collegeName || '未选择';
});
const profileText = computed(() => originalProfile.value?.profile?.trim() || '暂未填写个人简介');
const previewItems = computed(() => [
    { label: '当前用户名', value: originalProfile.value?.username || '未填写' },
    { label: '教师姓名', value: originalProfile.value?.teacherName || '未填写' },
    { label: '性别', value: originalProfile.value?.gender || '未填写' },
    { label: '联系邮箱', value: originalProfile.value?.email || '未填写' },
]);
function fillEditForm(profile) {
    editForm.username = profile.username || '';
    editForm.teacherName = profile.teacherName || '';
    editForm.gender = profile.gender || '';
    editForm.email = profile.email || '';
    editForm.collegeId = profile.collegeId ? String(profile.collegeId) : '';
    editForm.profile = profile.profile || '';
}
function openEditor() {
    if (originalProfile.value) {
        fillEditForm(originalProfile.value);
    }
    errorMessage.value = '';
    successMessage.value = '';
    showEditor.value = true;
}
function closeEditor() {
    showEditor.value = false;
}
async function loadProfile() {
    loading.value = true;
    errorMessage.value = '';
    try {
        const result = await getTeacherProfile();
        originalProfile.value = result.profile;
        collegeOptions.value = result.options.colleges;
        genderOptions.value = result.options.genders;
        fillEditForm(result.profile);
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
    if (!editForm.username || !editForm.teacherName || !editForm.gender || !editForm.collegeId) {
        errorMessage.value = '请完整填写基础信息';
        return;
    }
    saving.value = true;
    try {
        const result = await updateTeacherProfile({
            username: editForm.username,
            teacherName: editForm.teacherName,
            gender: editForm.gender,
            email: editForm.email,
            collegeId: editForm.collegeId,
            profile: editForm.profile,
        });
        originalProfile.value = result;
        fillEditForm(result);
        authStore.updateProfile({
            id: result.id,
            username: result.username,
            name: result.teacherName,
        });
        showEditor.value = false;
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
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher/materials');
        } },
    type: "button",
    ...{ class: "teacher-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/teacher/resources');
        } },
    type: "button",
    ...{ class: "teacher-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "button",
    ...{ class: "teacher-dashboard-nav__item is-active" },
});
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
(__VLS_ctx.headerText);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-head__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.openEditor) },
    type: "button",
    ...{ class: "auth-btn" },
    disabled: (__VLS_ctx.loading || __VLS_ctx.saving),
});
(__VLS_ctx.saving ? '保存中...' : '编辑资料');
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "teacher-profile-panel__status" },
});
(__VLS_ctx.selectedCollegeName);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-summary teacher-profile-summary--wide" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.previewItems))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "teacher-profile-summary__item" },
        key: (item.label),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (item.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (item.value);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-summary__item teacher-profile-summary__item--full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.profileText);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "teacher-profile-note teacher-profile-note--full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
if (__VLS_ctx.showEditor) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.closeEditor) },
        ...{ class: "teacher-profile-editor-mask" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "teacher-profile-editor" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "teacher-profile-editor__head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "teacher-profile-panel__eyebrow" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.closeEditor) },
        type: "button",
        ...{ class: "course-chip course-chip--soft" },
        disabled: (__VLS_ctx.saving),
    });
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
        value: (__VLS_ctx.editForm.username),
        type: "text",
        maxlength: "50",
        placeholder: "请输入用户名",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "teacher-profile-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.editForm.teacherName),
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
        value: (__VLS_ctx.editForm.gender),
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
        value: (__VLS_ctx.editForm.collegeId),
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
    (__VLS_ctx.editForm.email);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "teacher-profile-form__row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "teacher-profile-field teacher-profile-field--full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.editForm.profile),
        rows: "7",
        maxlength: "2000",
        placeholder: "请输入个人简介，可为空",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "teacher-profile-editor__actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.closeEditor) },
        type: "button",
        ...{ class: "auth-btn auth-btn--secondary" },
        disabled: (__VLS_ctx.saving),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        type: "submit",
        ...{ class: "auth-btn" },
        disabled: (__VLS_ctx.saving),
    });
    (__VLS_ctx.saving ? '保存中...' : '保存资料');
}
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-page']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-sidebar__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['is-active']} */ ;
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
/** @type {__VLS_StyleScopedClasses['teacher-profile-panel__status']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-summary--wide']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-summary__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-summary__item']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-summary__item--full']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-note']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-note--full']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-editor-mask']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-editor']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-editor__head']} */ ;
/** @type {__VLS_StyleScopedClasses['teacher-profile-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
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
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            loading: loading,
            saving: saving,
            showEditor: showEditor,
            errorMessage: errorMessage,
            successMessage: successMessage,
            collegeOptions: collegeOptions,
            genderOptions: genderOptions,
            editForm: editForm,
            headerText: headerText,
            selectedCollegeName: selectedCollegeName,
            profileText: profileText,
            previewItems: previewItems,
            openEditor: openEditor,
            closeEditor: closeEditor,
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
