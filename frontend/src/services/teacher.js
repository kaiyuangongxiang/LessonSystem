import http from './http';
export async function getTeacherDashboard() {
    const response = await http.get('/teacher/dashboard');
    return response.data.data;
}
export async function getTeacherCourseOptions() {
    const response = await http.get('/teacher/courses/options');
    return response.data.data;
}
export async function uploadTeacherMaterial(payload) {
    const formData = new FormData();
    formData.append('courseId', payload.courseId);
    formData.append('materialName', payload.materialName);
    formData.append('description', payload.description);
    formData.append('file', payload.file);
    const response = await http.post('/teacher/materials', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data.data;
}
export async function getTeacherResources(params) {
    const response = await http.get('/teacher/resources', {
        params,
    });
    return response.data.data;
}
export async function getTeacherResourceDetail(type, resourceId) {
    const response = await http.get(`/teacher/resources/${type}/${resourceId}`);
    return response.data.data;
}
export async function updateTeacherResource(type, resourceId, payload) {
    const response = await http.put(`/teacher/resources/${type}/${resourceId}`, payload);
    return response.data.data;
}
export async function deleteTeacherResource(type, resourceId) {
    const response = await http.delete(`/teacher/resources/${type}/${resourceId}`);
    return response.data.data;
}
export async function uploadTeacherVideo(payload) {
    const formData = new FormData();
    formData.append('courseId', payload.courseId);
    formData.append('videoTitle', payload.videoTitle);
    formData.append('description', payload.description);
    if (payload.duration !== undefined && payload.duration !== null) {
        formData.append('duration', String(payload.duration));
    }
    formData.append('video', payload.video);
    if (payload.cover) {
        formData.append('cover', payload.cover);
    }
    const response = await http.post('/teacher/videos', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        timeout: 30 * 60 * 1000,
    });
    return response.data.data;
}
