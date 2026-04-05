import http from './http';
export async function getAdminDashboard() {
    const response = await http.get('/admin/dashboard');
    return response.data.data;
}
export async function getAdminCollegeList(params) {
    const response = await http.get('/admin/colleges', {
        params,
    });
    return response.data.data;
}
export async function createAdminCollege(payload) {
    const response = await http.post('/admin/colleges', payload);
    return response.data.data;
}
export async function updateAdminCollege(collegeId, payload) {
    const response = await http.put(`/admin/colleges/${collegeId}`, payload);
    return response.data.data;
}
export async function deleteAdminCollege(collegeId) {
    const response = await http.delete(`/admin/colleges/${collegeId}`);
    return response.data.data;
}
export async function getAdminCourseList(params) {
    const response = await http.get('/admin/courses', {
        params,
    });
    return response.data.data;
}
export async function createAdminCourse(payload) {
    const response = await http.post('/admin/courses', payload);
    return response.data.data;
}
export async function updateAdminCourse(courseId, payload) {
    const response = await http.put(`/admin/courses/${courseId}`, payload);
    return response.data.data;
}
export async function deleteAdminCourse(courseId) {
    const response = await http.delete(`/admin/courses/${courseId}`);
    return response.data.data;
}
export async function getAdminMaterialList(params) {
    const response = await http.get('/admin/materials', {
        params,
    });
    return response.data.data;
}
export async function deleteAdminMaterial(resourceId) {
    const response = await http.delete(`/admin/materials/${resourceId}`);
    return response.data.data;
}
export async function getAdminVideoList(params) {
    const response = await http.get('/admin/videos', {
        params,
    });
    return response.data.data;
}
export async function deleteAdminVideo(resourceId) {
    const response = await http.delete(`/admin/videos/${resourceId}`);
    return response.data.data;
}
export async function getAdminMessageList(params) {
    const response = await http.get('/admin/messages', {
        params,
    });
    return response.data.data;
}
export async function getAdminMessageDetail(messageId) {
    const response = await http.get(`/admin/messages/${messageId}`);
    return response.data.data;
}
export async function createAdminMessageReply(messageId, payload) {
    const response = await http.post(`/admin/messages/${messageId}/replies`, payload);
    return response.data.data;
}
export async function deleteAdminMessage(messageId) {
    const response = await http.delete(`/admin/messages/${messageId}`);
    return response.data.data;
}
