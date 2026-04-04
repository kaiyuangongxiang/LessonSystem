import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import http from '@/services/http';
const router = useRouter();
const route = useRoute();
const loading = ref(false);
const errorMessage = ref('');
const filters = reactive({
    keyword: '',
});
const courses = ref([]);
const pagination = reactive({
    page: 1,
    pageSize: 6,
    total: 0,
    totalPages: 0,
});
const colleges = ref([]);
const routeKeyword = computed(() => (typeof route.query.keyword === 'string' ? route.query.keyword : ''));
const routeSort = computed(() => (route.query.sort === 'video-rich' ? 'video-rich' : 'latest'));
const selectedCollegeId = computed(() => {
    const raw = route.query.collegeId;
    return typeof raw === 'string' && raw ? raw : 'all';
});
const collegeOptions = computed(() => [{ id: 'all', name: '全部学院' }, ...colleges.value]);
const selectedCollegeName = computed(() => {
    const current = collegeOptions.value.find((item) => String(item.id) === String(selectedCollegeId.value));
    return current?.name || '全部学院';
});
const hasActiveFilters = computed(() => Boolean(routeKeyword.value || selectedCollegeId.value !== 'all' || routeSort.value !== 'latest'));
const filterSummary = computed(() => {
    const parts = [selectedCollegeName.value];
    if (routeKeyword.value) {
        parts.push(`关键词：${routeKeyword.value}`);
    }
    parts.push(routeSort.value === 'video-rich' ? '视频资源优先' : '最近更新');
    return parts.join(' · ');
});
const visibleCourses = computed(() => {
    if (courses.value.length) {
        return courses.value;
    }
    return [
        {
            id: 0,
            name: '课程内容待接入',
            summary: '后续将展示课程简介、资料数量与视频数量。',
            collegeName: '系统预留',
            teacherName: '系统预留',
            videoCount: 0,
            materialCount: 0,
            updateDate: '待更新',
        },
        {
            id: 1,
            name: '课程案例待更新',
            summary: '课程列表接口接通后，这里会展示真实课程筛选结果。',
            collegeName: '系统预留',
            teacherName: '系统预留',
            videoCount: 0,
            materialCount: 0,
            updateDate: '待更新',
        },
        {
            id: 2,
            name: '课程详情入口待开放',
            summary: '点击课程卡片即可进入课程详情页查看关联资料与视频。',
            collegeName: '系统预留',
            teacherName: '系统预留',
            videoCount: 0,
            materialCount: 0,
            updateDate: '待更新',
        },
    ];
});
const pageNumbers = computed(() => {
    const totalPages = pagination.totalPages || 1;
    return Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5);
});
function normalizePage(value) {
    const page = Number(value);
    return Number.isInteger(page) && page > 0 ? page : 1;
}
function updateRoute(next) {
    router.push({
        path: '/courses',
        query: {
            keyword: (next.keyword ?? routeKeyword.value) || undefined,
            collegeId: next.collegeId ?? (selectedCollegeId.value === 'all' ? undefined : selectedCollegeId.value),
            sort: next.sort ?? routeSort.value,
            page: String(next.page ?? normalizePage(route.query.page)),
        },
    });
}
function submitSearch() {
    updateRoute({ keyword: filters.keyword || undefined, page: 1 });
}
function handleCollegeChange(collegeId) {
    updateRoute({ collegeId: collegeId === 'all' ? undefined : collegeId, page: 1 });
}
function changePage(page) {
    updateRoute({ page });
}
function resetFilters() {
    filters.keyword = '';
    updateRoute({ keyword: undefined, collegeId: undefined, sort: 'latest', page: 1 });
}
function goCourseDetail(courseId) {
    if (!courseId) {
        return;
    }
    router.push(`/courses/${courseId}`);
}
async function loadCourses() {
    loading.value = true;
    errorMessage.value = '';
    filters.keyword = routeKeyword.value;
    try {
        const response = await http.get('/portal/courses', {
            params: {
                keyword: routeKeyword.value || undefined,
                collegeId: selectedCollegeId.value === 'all' ? undefined : selectedCollegeId.value,
                sort: routeSort.value,
                page: normalizePage(route.query.page),
                pageSize: 6,
            },
        });
        const data = response.data.data;
        courses.value = data.list;
        pagination.page = data.pagination.page;
        pagination.pageSize = data.pagination.pageSize;
        pagination.total = data.pagination.total;
        pagination.totalPages = data.pagination.totalPages;
        colleges.value = data.filters.colleges;
    }
    catch (error) {
        courses.value = [];
        pagination.page = 1;
        pagination.pageSize = 6;
        pagination.total = 0;
        pagination.totalPages = 0;
        colleges.value = [];
        errorMessage.value = error?.response?.data?.message || '课程列表加载失败，当前展示默认内容';
    }
    finally {
        loading.value = false;
    }
}
watch(() => route.fullPath, () => {
    loadCourses();
}, { immediate: true });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "course-list-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "course-list-nav" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-list-nav__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-list-toolbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.submitSearch) },
    ...{ class: "course-list-search" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.filters.keyword),
    type: "text",
    placeholder: "搜索课程名称、学院、教师",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/');
        } },
    ...{ class: "course-list-home-btn" },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "course-list-summary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-list-summary__intro" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-list-summary__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-list-filter-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-list-filter-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-list-filter-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-list-chips" },
});
for (const [college] of __VLS_getVForSourceType((__VLS_ctx.collegeOptions))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleCollegeChange(college.id);
            } },
        key: (college.id),
        type: "button",
        ...{ class: (['course-chip', String(__VLS_ctx.selectedCollegeId) === String(college.id) ? 'is-active' : '']) },
    });
    (college.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-list-filter-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-list-filter-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-list-sort" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.updateRoute({ sort: 'latest', page: 1 });
        } },
    type: "button",
    ...{ class: (['course-chip', 'course-chip--sort', __VLS_ctx.routeSort === 'latest' ? 'is-active' : '']) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.updateRoute({ sort: 'video-rich', page: 1 });
        } },
    type: "button",
    ...{ class: (['course-chip', 'course-chip--sort', __VLS_ctx.routeSort === 'video-rich' ? 'is-active' : '']) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-list-filter-meta" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-list-filter-state" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.filterSummary);
if (__VLS_ctx.hasActiveFilters) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.resetFilters) },
        type: "button",
        ...{ class: "course-list-reset-btn" },
    });
}
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "course-feedback" },
    });
    (__VLS_ctx.errorMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "course-list-grid" },
});
for (const [course] of __VLS_getVForSourceType((__VLS_ctx.visibleCourses))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        key: (course.id),
        ...{ class: "course-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-card__meta" },
    });
    (course.collegeName);
    (course.teacherName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    (course.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (course.summary);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-card__footer" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "course-card__stats" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (course.materialCount);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (course.videoCount);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.goCourseDetail(course.id);
            } },
        type: "button",
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "course-pagination" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-pagination__desc" },
});
(__VLS_ctx.pagination.total);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "course-pagination__actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.changePage(__VLS_ctx.pagination.page - 1);
        } },
    type: "button",
    ...{ class: "course-chip" },
    disabled: (__VLS_ctx.pagination.page <= 1),
});
for (const [pageNumber] of __VLS_getVForSourceType((__VLS_ctx.pageNumbers))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.changePage(pageNumber);
            } },
        key: (pageNumber),
        type: "button",
        ...{ class: (['course-page-btn', pageNumber === __VLS_ctx.pagination.page ? 'is-active' : '']) },
    });
    (pageNumber);
}
/** @type {__VLS_StyleScopedClasses['course-list-page']} */ ;
/** @type {__VLS_StyleScopedClasses['course-list-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['course-list-nav__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-list-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['course-list-search']} */ ;
/** @type {__VLS_StyleScopedClasses['course-list-home-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['course-list-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['course-list-summary__intro']} */ ;
/** @type {__VLS_StyleScopedClasses['course-list-summary__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['course-list-filter-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['course-list-filter-row']} */ ;
/** @type {__VLS_StyleScopedClasses['course-list-filter-label']} */ ;
/** @type {__VLS_StyleScopedClasses['course-list-chips']} */ ;
/** @type {__VLS_StyleScopedClasses['course-list-filter-row']} */ ;
/** @type {__VLS_StyleScopedClasses['course-list-filter-label']} */ ;
/** @type {__VLS_StyleScopedClasses['course-list-sort']} */ ;
/** @type {__VLS_StyleScopedClasses['course-list-filter-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['course-list-filter-state']} */ ;
/** @type {__VLS_StyleScopedClasses['course-list-reset-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['course-feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['course-list-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['course-card']} */ ;
/** @type {__VLS_StyleScopedClasses['course-card__meta']} */ ;
/** @type {__VLS_StyleScopedClasses['course-card__footer']} */ ;
/** @type {__VLS_StyleScopedClasses['course-card__stats']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination__desc']} */ ;
/** @type {__VLS_StyleScopedClasses['course-pagination__actions']} */ ;
/** @type {__VLS_StyleScopedClasses['course-chip']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            errorMessage: errorMessage,
            filters: filters,
            pagination: pagination,
            routeSort: routeSort,
            selectedCollegeId: selectedCollegeId,
            collegeOptions: collegeOptions,
            hasActiveFilters: hasActiveFilters,
            filterSummary: filterSummary,
            visibleCourses: visibleCourses,
            pageNumbers: pageNumbers,
            updateRoute: updateRoute,
            submitSearch: submitSearch,
            handleCollegeChange: handleCollegeChange,
            changePage: changePage,
            resetFilters: resetFilters,
            goCourseDetail: goCourseDetail,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
