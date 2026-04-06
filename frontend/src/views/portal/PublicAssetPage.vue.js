import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getPortalPublicAssets } from '@/services/portal';
const router = useRouter();
const route = useRoute();
const loading = ref(false);
const errorMessage = ref('');
const assetList = ref([]);
const stats = reactive({
    total: 0,
    imageCount: 0,
    mediaCount: 0,
    contentCount: 0,
});
const filters = reactive({
    keyword: '',
    type: 'all',
});
const pagination = reactive({
    page: 1,
    pageSize: 8,
    total: 0,
    totalPages: 0,
});
const assetTypeOptions = [
    { value: 'image', label: '图片' },
    { value: 'audio', label: '音频' },
    { value: 'video', label: '视频' },
    { value: 'text', label: '文本' },
    { value: 'question', label: '题目' },
    { value: 'template', label: '模板' },
];
const pageNumbers = computed(() => {
    const totalPages = pagination.totalPages || 1;
    return Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1);
});
function normalizePage(value) {
    const page = Number(value);
    return Number.isInteger(page) && page > 0 ? page : 1;
}
function assetTypeLabel(type) {
    return assetTypeOptions.find((item) => item.value === type)?.label || type;
}
function formatFileSize(size) {
    if (size >= 1024 * 1024) {
        return `${(size / 1024 / 1024).toFixed(2)} MB`;
    }
    return `${(size / 1024).toFixed(2)} KB`;
}
function previewAsset(path) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    window.open(`${baseUrl}${path}`, '_blank', 'noopener,noreferrer');
}
function downloadAsset(assetId) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    window.open(`${baseUrl}/portal/assets/${assetId}/download`, '_blank', 'noopener,noreferrer');
}
function syncFiltersWithRoute() {
    filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : '';
    filters.type = typeof route.query.type === 'string' && route.query.type !== '' ? route.query.type : 'all';
}
function updateRoute(page = 1) {
    void router.push({
        path: '/assets',
        query: {
            page: String(page),
            ...(filters.keyword ? { keyword: filters.keyword } : {}),
            ...(filters.type !== 'all' ? { type: filters.type } : {}),
        },
    });
}
function applySearch() {
    updateRoute(1);
}
function resetFilters() {
    filters.keyword = '';
    filters.type = 'all';
    updateRoute(1);
}
function changePage(page) {
    updateRoute(page);
}
async function loadAssets() {
    loading.value = true;
    errorMessage.value = '';
    syncFiltersWithRoute();
    try {
        const data = await getPortalPublicAssets({
            page: normalizePage(route.query.page),
            pageSize: 8,
            keyword: filters.keyword,
            type: filters.type,
        });
        assetList.value = data.list;
        stats.total = data.stats.total;
        stats.imageCount = data.stats.imageCount;
        stats.mediaCount = data.stats.mediaCount;
        stats.contentCount = data.stats.contentCount;
        pagination.page = data.pagination.page;
        pagination.pageSize = data.pagination.pageSize;
        pagination.total = data.pagination.total;
        pagination.totalPages = data.pagination.totalPages;
    }
    catch (error) {
        assetList.value = [];
        stats.total = 0;
        stats.imageCount = 0;
        stats.mediaCount = 0;
        stats.contentCount = 0;
        pagination.page = 1;
        pagination.pageSize = 8;
        pagination.total = 0;
        pagination.totalPages = 0;
        errorMessage.value = error?.response?.data?.message || '公共素材加载失败';
    }
    finally {
        loading.value = false;
    }
}
watch(() => route.fullPath, () => {
    loadAssets();
}, { immediate: true });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "portal-home public-asset-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "portal-hero public-asset-hero" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "public-asset-hero__content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "portal-hero__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "public-asset-hero__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/');
        } },
    type: "button",
    ...{ class: "auth-btn auth-btn--secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/courses');
        } },
    type: "button",
    ...{ class: "auth-btn" },
});
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "portal-feedback" },
    });
    (__VLS_ctx.errorMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "public-asset-stats" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "public-asset-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.total);
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "public-asset-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.imageCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "public-asset-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.mediaCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "public-asset-stat-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.stats.contentCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "portal-panel public-asset-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "portal-section-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "portal-section-head__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.applySearch) },
    ...{ class: "public-asset-filter" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.filters.keyword),
    type: "text",
    maxlength: "200",
    placeholder: "搜索标题、说明、内容或教师姓名",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.filters.type),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "all",
});
for (const [option] of __VLS_getVForSourceType((__VLS_ctx.assetTypeOptions))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (option.value),
        value: (option.value),
    });
    (option.label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "public-asset-filter__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.resetFilters) },
    type: "button",
    ...{ class: "auth-btn auth-btn--secondary" },
    disabled: (__VLS_ctx.loading),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
    ...{ class: "auth-btn" },
    disabled: (__VLS_ctx.loading),
});
(__VLS_ctx.loading ? '加载中...' : '应用筛选');
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "portal-panel public-asset-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "portal-section-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "portal-section-head__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "public-asset-panel__meta" },
});
(__VLS_ctx.pagination.total);
if (__VLS_ctx.assetList.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "public-asset-list" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.assetList))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (item.id),
            ...{ class: "public-asset-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "public-asset-item__head" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (item.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.assetTypeLabel(item.type));
        (item.teacherName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.uploadTime);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "public-asset-item__desc" },
        });
        (item.description || item.content || '暂无素材说明');
        if (item.fileName) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "public-asset-item__meta" },
            });
            (item.fileName);
            if (item.fileSize) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.formatFileSize(item.fileSize));
            }
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "public-asset-item__actions" },
        });
        if (item.previewUrl) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.assetList.length))
                            return;
                        if (!(item.previewUrl))
                            return;
                        __VLS_ctx.previewAsset(item.previewUrl);
                    } },
                type: "button",
                ...{ class: "course-chip course-chip--soft" },
            });
        }
        if (item.fileName) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.assetList.length))
                            return;
                        if (!(item.fileName))
                            return;
                        __VLS_ctx.downloadAsset(item.id);
                    } },
                type: "button",
                ...{ class: "course-chip" },
            });
        }
    }
}
else if (!__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-detail-empty" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "course-pagination my-resources-pagination" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-pagination__desc" },
});
(__VLS_ctx.pagination.page);
(Math.max(__VLS_ctx.pagination.totalPages, 1));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-pagination__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.changePage(__VLS_ctx.pagination.page - 1);
        } },
    type: "button",
    ...{ class: "course-chip" },
    disabled: (__VLS_ctx.pagination.page <= 1 || __VLS_ctx.loading),
});
for (const [pageNumber] of __VLS_getVForSourceType((__VLS_ctx.pageNumbers))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.changePage(pageNumber);
            } },
        key: (pageNumber),
        type: "button",
        ...{ class: (['course-page-btn', pageNumber === __VLS_ctx.pagination.page ? 'is-active' : '']) },
        disabled: (__VLS_ctx.loading),
    });
    (pageNumber);
}
/** @type {__VLS_StyleScopedClasses['portal-home']} */ ;
/** @type {__VLS_StyleScopedClasses['public-asset-page']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-hero']} */ ;
/** @type {__VLS_StyleScopedClasses['public-asset-hero']} */ ;
/** @type {__VLS_StyleScopedClasses['public-asset-hero__content']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-hero__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['public-asset-hero__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['public-asset-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['public-asset-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['public-asset-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['public-asset-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['public-asset-stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['public-asset-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-section-head']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-section-head__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['public-asset-filter']} */ ;
/** @type {__VLS_StyleScopedClasses['public-asset-filter__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['public-asset-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-section-head']} */ ;
/** @type {__VLS_StyleScopedClasses['portal-section-head__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['public-asset-panel__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['public-asset-list']} */ ;
/** @type {__VLS_StyleScopedClasses['public-asset-item']} */ ;
/** @type {__VLS_StyleScopedClasses['public-asset-item__head']} */ ;
/** @type {__VLS_StyleScopedClasses['public-asset-item__desc']} */ ;
/** @type {__VLS_StyleScopedClasses['public-asset-item__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['public-asset-item__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip--soft']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['course-detail-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['my-resources-pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination__desc']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            loading: loading,
            errorMessage: errorMessage,
            assetList: assetList,
            stats: stats,
            filters: filters,
            pagination: pagination,
            assetTypeOptions: assetTypeOptions,
            pageNumbers: pageNumbers,
            assetTypeLabel: assetTypeLabel,
            formatFileSize: formatFileSize,
            previewAsset: previewAsset,
            downloadAsset: downloadAsset,
            applySearch: applySearch,
            resetFilters: resetFilters,
            changePage: changePage,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
