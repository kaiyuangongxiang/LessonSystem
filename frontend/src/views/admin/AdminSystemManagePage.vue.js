import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createAdminNotice, deleteAdminNotice, getAdminSystemManage, updateAdminNotice, updateAdminSystemProfile, } from '@/services/admin';
import { useAuthStore } from '@/stores/auth';
const DEFAULT_SYSTEM_HERO_TITLE = '让课程、资料与视频在一个入口里协同';
const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const savingProfile = ref(false);
const savingNotice = ref(false);
const deletingNoticeId = ref(null);
const togglingNoticeId = ref(null);
const editorVisible = ref(false);
const editingNoticeId = ref(null);
const errorMessage = ref('');
const successMessage = ref('');
const systemProfile = reactive({
    id: null,
    systemName: '',
    heroTitle: DEFAULT_SYSTEM_HERO_TITLE,
    systemIntro: '',
    updateTime: '',
    updateAdminName: '',
});
const stats = reactive({
    noticeCount: 0,
    publishedNoticeCount: 0,
    disabledNoticeCount: 0,
});
const profileForm = reactive({
    systemName: '',
    heroTitle: DEFAULT_SYSTEM_HERO_TITLE,
    systemIntro: '',
});
const noticeForm = reactive({
    title: '',
    content: '',
    status: 1,
});
const noticeList = ref([]);
const headerText = computed(() => {
    const name = authStore.profile?.name || authStore.profile?.username || '管理员';
    return `${name}，这里用于维护前台首页的系统介绍和滚动公告内容。`;
});
const reminderTexts = computed(() => [
    stats.publishedNoticeCount > 0 ? `当前已有 ${stats.publishedNoticeCount} 条公告正在前台展示。` : '当前前台还没有已发布公告。',
    systemProfile.updateTime ? `系统介绍最近一次更新于 ${systemProfile.updateTime}。` : '系统介绍仍可继续完善，以便前台首页展示更完整。',
]);
function clearMessages() {
    errorMessage.value = '';
    successMessage.value = '';
}
function applySystemData(data) {
    systemProfile.id = data.profile.id;
    systemProfile.systemName = data.profile.systemName;
    systemProfile.heroTitle = data.profile.heroTitle || DEFAULT_SYSTEM_HERO_TITLE;
    systemProfile.systemIntro = data.profile.systemIntro;
    systemProfile.updateTime = data.profile.updateTime;
    systemProfile.updateAdminName = data.profile.updateAdminName;
    profileForm.systemName = data.profile.systemName;
    profileForm.heroTitle = data.profile.heroTitle || DEFAULT_SYSTEM_HERO_TITLE;
    profileForm.systemIntro = data.profile.systemIntro;
    stats.noticeCount = data.stats.noticeCount;
    stats.publishedNoticeCount = data.stats.publishedNoticeCount;
    stats.disabledNoticeCount = data.stats.disabledNoticeCount;
    noticeList.value = data.notices;
}
async function loadSystemData() {
    loading.value = true;
    errorMessage.value = '';
    try {
        const data = await getAdminSystemManage();
        applySystemData(data);
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '系统管理数据加载失败';
    }
    finally {
        loading.value = false;
    }
}
async function submitProfile() {
    clearMessages();
    savingProfile.value = true;
    try {
        const profile = await updateAdminSystemProfile({
            systemName: profileForm.systemName,
            heroTitle: profileForm.heroTitle || DEFAULT_SYSTEM_HERO_TITLE,
            systemIntro: profileForm.systemIntro,
        });
        systemProfile.id = profile.id;
        systemProfile.systemName = profile.systemName;
        systemProfile.heroTitle = profile.heroTitle || DEFAULT_SYSTEM_HERO_TITLE;
        systemProfile.systemIntro = profile.systemIntro;
        systemProfile.updateTime = profile.updateTime;
        systemProfile.updateAdminName = profile.updateAdminName;
        successMessage.value = '系统介绍已更新';
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '系统介绍保存失败';
    }
    finally {
        savingProfile.value = false;
    }
}
function resetNoticeForm() {
    noticeForm.title = '';
    noticeForm.content = '';
    noticeForm.status = 1;
}
function openCreateNotice() {
    clearMessages();
    editingNoticeId.value = null;
    resetNoticeForm();
    editorVisible.value = true;
}
function openEditNotice(item) {
    clearMessages();
    editingNoticeId.value = item.id;
    noticeForm.title = item.title;
    noticeForm.content = item.content;
    noticeForm.status = item.status;
    editorVisible.value = true;
}
function closeEditor() {
    if (savingNotice.value) {
        return;
    }
    editorVisible.value = false;
    editingNoticeId.value = null;
    resetNoticeForm();
}
async function submitNotice() {
    clearMessages();
    savingNotice.value = true;
    try {
        if (editingNoticeId.value) {
            await updateAdminNotice(editingNoticeId.value, {
                title: noticeForm.title,
                content: noticeForm.content,
                status: noticeForm.status,
            });
            successMessage.value = '公告已更新';
        }
        else {
            await createAdminNotice({
                title: noticeForm.title,
                content: noticeForm.content,
                status: noticeForm.status,
            });
            successMessage.value = '公告已创建';
        }
        closeEditor();
        await loadSystemData();
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '公告保存失败';
    }
    finally {
        savingNotice.value = false;
    }
}
async function toggleNoticeStatus(item) {
    clearMessages();
    togglingNoticeId.value = item.id;
    try {
        await updateAdminNotice(item.id, {
            title: item.title,
            content: item.content,
            status: item.status === 1 ? 0 : 1,
        });
        successMessage.value = item.status === 1 ? '公告已停用' : '公告已发布';
        await loadSystemData();
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '公告状态更新失败';
    }
    finally {
        togglingNoticeId.value = null;
    }
}
async function removeNotice(item) {
    clearMessages();
    if (!window.confirm(`确认删除公告《${item.title}》吗？`)) {
        return;
    }
    deletingNoticeId.value = item.id;
    try {
        await deleteAdminNotice(item.id);
        successMessage.value = `公告《${item.title}》已删除`;
        await loadSystemData();
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.message || '公告删除失败';
    }
    finally {
        deletingNoticeId.value = null;
    }
}
onMounted(() => {
    loadSystemData();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "admin-manage-page admin-system-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "admin-dashboard-sidebar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-dashboard-sidebar__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "admin-dashboard-nav" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin');
        } },
    type: "button",
    ...{ class: "admin-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin/teachers');
        } },
    type: "button",
    ...{ class: "admin-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin/accounts');
        } },
    type: "button",
    ...{ class: "admin-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin/colleges');
        } },
    type: "button",
    ...{ class: "admin-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin/courses');
        } },
    type: "button",
    ...{ class: "admin-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin/assets');
        } },
    type: "button",
    ...{ class: "admin-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin/materials');
        } },
    type: "button",
    ...{ class: "admin-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "button",
    ...{ class: "admin-dashboard-nav__item admin-dashboard-nav__item--system is-active" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin/messages');
        } },
    type: "button",
    ...{ class: "admin-dashboard-nav__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "admin-dashboard-reminder-card admin-dashboard-reminder-card--manage" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-dashboard-reminder-card__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
(__VLS_ctx.reminderTexts[0]);
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
(__VLS_ctx.reminderTexts[1]);
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "admin-manage-main" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "admin-manage-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-head__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.headerText);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-head__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "course-chip course-chip--soft" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin');
        } },
    type: "button",
    ...{ class: "auth-btn auth-btn--secondary" },
});
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "course-feedback" },
    });
    (__VLS_ctx.errorMessage);
}
if (__VLS_ctx.successMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "feedback-text feedback-text--success admin-manage-feedback" },
    });
    (__VLS_ctx.successMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "admin-manage-stats" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "admin-manage-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.noticeCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "admin-manage-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.publishedNoticeCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "admin-manage-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.disabledNoticeCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "admin-manage-stat-card is-highlight" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.systemProfile.updateTime || '未配置');
__VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
(__VLS_ctx.systemProfile.updateAdminName || '等待管理员维护系统信息');
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "admin-system-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "admin-manage-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-panel__meta" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.submitProfile) },
    ...{ class: "admin-system-profile-form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "admin-manage-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.profileForm.systemName),
    type: "text",
    maxlength: "100",
    placeholder: "请输入前台显示的系统名称",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "admin-manage-field admin-manage-field--full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.profileForm.heroTitle),
    type: "text",
    maxlength: "120",
    placeholder: "请输入首页大标题内容",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "admin-manage-field admin-manage-field--full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.profileForm.systemIntro),
    maxlength: "5000",
    rows: "8",
    placeholder: "请输入首页展示的系统介绍内容",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-course-editor__footer" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-course-editor__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
    ...{ class: "auth-btn" },
    disabled: (__VLS_ctx.savingProfile),
});
(__VLS_ctx.savingProfile ? '保存中...' : '保存系统介绍');
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "admin-manage-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-panel__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-manage-head__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "admin-manage-panel__meta" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.openCreateNotice) },
    type: "button",
    ...{ class: "auth-btn" },
});
if (__VLS_ctx.noticeList.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-course-crud-list admin-system-notice-list" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.noticeList))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (item.id),
            ...{ class: "admin-course-crud-item admin-system-notice-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-course-crud-item__main" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-course-crud-item__head" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (item.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (item.content);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-course-crud-item__status" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: (['admin-course-status-badge', item.status === 1 ? 'is-success' : 'is-warning']) },
        });
        (item.statusLabel);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-course-crud-item__meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.publishTime);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.updateTime);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.publisherName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-course-crud-item__actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.noticeList.length))
                        return;
                    __VLS_ctx.openEditNotice(item);
                } },
            type: "button",
            ...{ class: "course-chip course-chip--soft" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.noticeList.length))
                        return;
                    __VLS_ctx.toggleNoticeStatus(item);
                } },
            type: "button",
            ...{ class: "course-chip" },
            disabled: (__VLS_ctx.togglingNoticeId === item.id),
        });
        (__VLS_ctx.togglingNoticeId === item.id ? '处理中...' : item.status === 1 ? '停用' : '发布');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.noticeList.length))
                        return;
                    __VLS_ctx.removeNotice(item);
                } },
            type: "button",
            ...{ class: "course-chip admin-manage-delete-btn" },
            disabled: (__VLS_ctx.deletingNoticeId === item.id),
        });
        (__VLS_ctx.deletingNoticeId === item.id ? '删除中...' : '删除');
    }
}
else if (!__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty" },
    });
}
if (__VLS_ctx.editorVisible) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.closeEditor) },
        ...{ class: "admin-course-editor-mask" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "admin-course-editor" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-course-editor__head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-manage-panel__eyebrow" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    (__VLS_ctx.editingNoticeId ? '修改公告' : '新增公告');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.closeEditor) },
        type: "button",
        ...{ class: "course-chip course-chip--soft" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
        ...{ onSubmit: (__VLS_ctx.submitNotice) },
        ...{ class: "admin-course-editor__form" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "admin-manage-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.noticeForm.title),
        type: "text",
        maxlength: "200",
        placeholder: "请输入公告标题",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "admin-manage-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.noticeForm.status),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: (1),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: (0),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "admin-manage-field admin-manage-field--full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.noticeForm.content),
        maxlength: "5000",
        rows: "8",
        placeholder: "请输入前台首页展示的公告内容",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-course-editor__footer" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-course-editor__actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.closeEditor) },
        type: "button",
        ...{ class: "auth-btn auth-btn--secondary" },
        disabled: (__VLS_ctx.savingNotice),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        type: "submit",
        ...{ class: "auth-btn" },
        disabled: (__VLS_ctx.savingNotice),
    });
    (__VLS_ctx.savingNotice ? '保存中...' : '保存公告');
}
/** @type {__VLS_StyleScopedClasses['admin-manage-page']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-system-page']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-sidebar__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item--system']} */ ;
/** @type {__VLS_StyleScopedClasses['is-active']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-nav__item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-reminder-card']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-reminder-card--manage']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-dashboard-reminder-card__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-main']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-head__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-head__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['course-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text--success']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['is-highlight']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-system-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-system-profile-form']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor__footer']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-head__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-crud-list']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-system-notice-list']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-crud-item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-system-notice-item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-crud-item__main']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-crud-item__head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-crud-item__status']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-crud-item__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-crud-item__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor-mask']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor__head']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor__form']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-manage-field--full']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor__footer']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-course-editor__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            loading: loading,
            savingProfile: savingProfile,
            savingNotice: savingNotice,
            deletingNoticeId: deletingNoticeId,
            togglingNoticeId: togglingNoticeId,
            editorVisible: editorVisible,
            editingNoticeId: editingNoticeId,
            errorMessage: errorMessage,
            successMessage: successMessage,
            systemProfile: systemProfile,
            stats: stats,
            profileForm: profileForm,
            noticeForm: noticeForm,
            noticeList: noticeList,
            headerText: headerText,
            reminderTexts: reminderTexts,
            submitProfile: submitProfile,
            openCreateNotice: openCreateNotice,
            openEditNotice: openEditNotice,
            closeEditor: closeEditor,
            submitNotice: submitNotice,
            toggleNoticeStatus: toggleNoticeStatus,
            removeNotice: removeNotice,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
