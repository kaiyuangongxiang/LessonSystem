import http from './http';
export async function getAdminDashboard() {
    const response = await http.get('/admin/dashboard');
    return response.data.data;
}
export async function getAdminSystemManage() {
    const response = await http.get('/admin/system');
    return response.data.data;
}
export async function updateAdminSystemProfile(payload) {
    const response = await http.put('/admin/system/profile', payload);
    return response.data.data;
}
export async function createAdminNotice(payload) {
    const response = await http.post('/admin/system/notices', payload);
    return response.data.data;
}
export async function updateAdminNotice(noticeId, payload) {
    const response = await http.put(`/admin/system/notices/${noticeId}`, payload);
    return response.data.data;
}
export async function deleteAdminNotice(noticeId) {
    const response = await http.delete(`/admin/system/notices/${noticeId}`);
    return response.data.data;
}
export async function getAdminAccountList(params) {
    const response = await http.get('/admin/admins', {
        params,
    });
    return response.data.data;
}
export async function createAdminAccount(payload) {
    const response = await http.post('/admin/admins', payload);
    return response.data.data;
}
export async function updateAdminAccount(adminId, payload) {
    const response = await http.put(`/admin/admins/${adminId}`, payload);
    return response.data.data;
}
export async function deleteAdminAccount(adminId) {
    const response = await http.delete(`/admin/admins/${adminId}`);
    return response.data.data;
}
export async function getAdminTeacherUserList(params) {
    const response = await http.get('/admin/teachers', {
        params,
    });
    return response.data.data;
}
export async function getAdminStudentUserList(params) {
    const response = await http.get('/admin/students', {
        params,
    });
    return response.data.data;
}
export async function createAdminTeacherUser(payload) {
    const response = await http.post('/admin/teachers', payload);
    return response.data.data;
}
export async function createAdminStudentUser(payload) {
    const response = await http.post('/admin/students', payload);
    return response.data.data;
}
export async function updateAdminTeacherUser(teacherId, payload) {
    const response = await http.put(`/admin/teachers/${teacherId}`, payload);
    return response.data.data;
}
export async function updateAdminStudentUser(studentId, payload) {
    const response = await http.put(`/admin/students/${studentId}`, payload);
    return response.data.data;
}
export async function deleteAdminTeacherUser(teacherId) {
    const response = await http.delete(`/admin/teachers/${teacherId}`);
    return response.data.data;
}
export async function deleteAdminStudentUser(studentId) {
    const response = await http.delete(`/admin/students/${studentId}`);
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
export async function getAdminAssetList(params) {
    const response = await http.get('/admin/assets', {
        params,
    });
    return response.data.data;
}
export async function deleteAdminAsset(assetId) {
    const response = await http.delete(`/admin/assets/${assetId}`);
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
export async function createAdminMessage(payload) {
    const response = await http.post('/admin/messages', payload);
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
export async function deleteAdminMessageReply(messageId, replyId) {
    const response = await http.delete(`/admin/messages/${messageId}/replies/${replyId}`);
    return response.data.data;
}
