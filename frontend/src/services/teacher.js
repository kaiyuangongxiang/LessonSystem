import http from './http';
export async function getTeacherDashboard() {
    const response = await http.get('/teacher/dashboard');
    return response.data.data;
}
export async function getTeacherCourseOptions() {
    const response = await http.get('/teacher/courses/options');
    return response.data.data;
}
export async function getTeacherPreps(params) {
    const response = await http.get('/teacher/preps', {
        params,
    });
    return response.data.data;
}
export async function createTeacherPrep(payload) {
    const response = await http.post('/teacher/preps', payload);
    return response.data.data;
}
export async function updateTeacherPrep(prepId, payload) {
    const response = await http.put(`/teacher/preps/${prepId}`, payload);
    return response.data.data;
}
export async function deleteTeacherPrep(prepId) {
    const response = await http.delete(`/teacher/preps/${prepId}`);
    return response.data.data;
}
export async function addTeacherPrepAssetAttachments(prepId, assetIds) {
    const response = await http.post(`/teacher/preps/${prepId}/attachments/assets`, { assetIds });
    return response.data.data;
}
export async function uploadTeacherPrepAttachments(prepId, files) {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append('files', file);
    });
    const response = await http.post(`/teacher/preps/${prepId}/attachments/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data.data;
}
export async function deleteTeacherPrepAttachment(prepId, attachmentId) {
    const response = await http.delete(`/teacher/preps/${prepId}/attachments/${attachmentId}`);
    return response.data.data;
}
export async function getTeacherCoursewares(params) {
    const response = await http.get('/teacher/coursewares', {
        params,
    });
    return response.data.data;
}
export async function createTeacherCourseware(payload) {
    const response = await http.post('/teacher/coursewares', payload);
    return response.data.data;
}
export async function getTeacherCoursewareDetail(coursewareId) {
    const response = await http.get(`/teacher/coursewares/${coursewareId}`);
    return response.data.data;
}
export async function updateTeacherCourseware(coursewareId, payload) {
    const response = await http.put(`/teacher/coursewares/${coursewareId}`, payload);
    return response.data.data;
}
export async function deleteTeacherCourseware(coursewareId) {
    const response = await http.delete(`/teacher/coursewares/${coursewareId}`);
    return response.data.data;
}
export async function publishTeacherCourseware(coursewareId) {
    const response = await http.post(`/teacher/coursewares/${coursewareId}/publish`);
    return response.data.data;
}
export async function getTeacherAssets(params) {
    const response = await http.get('/teacher/assets', {
        params,
    });
    return response.data.data;
}
export async function createTeacherAsset(payload) {
    const formData = new FormData();
    formData.append('type', payload.type);
    formData.append('visibility', payload.visibility);
    if (payload.courseId) {
        formData.append('courseId', payload.courseId);
    }
    formData.append('title', payload.title);
    formData.append('description', payload.description);
    formData.append('content', payload.content);
    if (payload.file) {
        formData.append('file', payload.file);
    }
    const response = await http.post('/teacher/assets', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data.data;
}
export async function getTeacherAssetDetail(assetId) {
    const response = await http.get(`/teacher/assets/${assetId}`);
    return response.data.data;
}
export async function updateTeacherAssetDetail(assetId, payload) {
    const response = await http.put(`/teacher/assets/${assetId}`, payload);
    return response.data.data;
}
export async function deleteTeacherAssetDetail(assetId) {
    const response = await http.delete(`/teacher/assets/${assetId}`);
    return response.data.data;
}
export async function getTeacherProfile() {
    const response = await http.get('/teacher/profile');
    return response.data.data;
}
export async function updateTeacherProfile(payload) {
    const response = await http.put('/teacher/profile', payload);
    return response.data.data;
}
export async function uploadTeacherResourceBundle(payload) {
    const formData = new FormData();
    formData.append('courseId', payload.courseId);
    formData.append('title', payload.title);
    formData.append('description', payload.description);
    if (payload.material) {
        formData.append('material', payload.material);
    }
    if (payload.video) {
        formData.append('video', payload.video);
    }
    if (payload.cover) {
        formData.append('cover', payload.cover);
    }
    if (payload.duration !== undefined && payload.duration !== null) {
        formData.append('duration', String(payload.duration));
    }
    const response = await http.post('/teacher/resources/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        timeout: 30 * 60 * 1000,
    });
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
export async function getTeacherMessageList(params) {
    const response = await http.get('/teacher/messages', {
        params,
    });
    return response.data.data;
}
export async function createTeacherMessage(payload) {
    const response = await http.post('/teacher/messages', payload);
    return response.data.data;
}
export async function getTeacherMessageDetail(messageId) {
    const response = await http.get(`/teacher/messages/${messageId}`);
    return response.data.data;
}
export async function createTeacherMessageReply(messageId, payload) {
    const response = await http.post(`/teacher/messages/${messageId}/replies`, payload);
    return response.data.data;
}
export async function deleteTeacherMessage(messageId) {
    const response = await http.delete(`/teacher/messages/${messageId}`);
    return response.data.data;
}
export async function deleteTeacherMessageReply(messageId, replyId) {
    const response = await http.delete(`/teacher/messages/${messageId}/replies/${replyId}`);
    return response.data.data;
}
