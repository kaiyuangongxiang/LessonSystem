import { useRouter } from 'vue-router';
const __VLS_props = defineProps();
const router = useRouter();
const menuItems = [
    { key: 'home', label: '总览首页', path: '/teacher' },
    { key: 'materials', label: '资源上传', path: '/teacher/materials' },
    { key: 'assets', label: '素材库', path: '/teacher/assets' },
    { key: 'preps', label: '备课单管理', path: '/teacher/preps' },
    { key: 'resources', label: '我的资源', path: '/teacher/resources' },
    { key: 'messages', label: '教学交流', path: '/teacher/messages' },
    { key: 'profile', label: '个人资料', path: '/teacher/profile' },
];
function handleNavigate(path) {
    void router.push(path);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "teacher-dashboard-nav" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.menuItems))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleNavigate(item.path);
            } },
        key: (item.key),
        type: "button",
        ...{ class: (['teacher-dashboard-nav__item', item.key === __VLS_ctx.active ? 'is-active' : '']) },
    });
    (item.label);
}
/** @type {__VLS_StyleScopedClasses['teacher-dashboard-nav']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            menuItems: menuItems,
            handleNavigate: handleNavigate,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
