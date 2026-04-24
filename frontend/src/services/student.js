import http from './http';
export async function getStudentMessageList(params) {
    const response = await http.get('/student/messages', {
        params,
    });
    return response.data.data;
}
export async function createStudentMessage(payload) {
    const response = await http.post('/student/messages', payload);
    return response.data.data;
}
export async function getStudentMessageDetail(messageId) {
    const response = await http.get(`/student/messages/${messageId}`);
    return response.data.data;
}
export async function createStudentMessageReply(messageId, payload) {
    const response = await http.post(`/student/messages/${messageId}/replies`, payload);
    return response.data.data;
}
export async function deleteStudentMessage(messageId) {
    const response = await http.delete(`/student/messages/${messageId}`);
    return response.data.data;
}
export async function deleteStudentMessageReply(messageId, replyId) {
    const response = await http.delete(`/student/messages/${messageId}/replies/${replyId}`);
    return response.data.data;
}
