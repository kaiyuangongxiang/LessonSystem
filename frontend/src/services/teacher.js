import http from './http';
export async function getTeacherDashboard() {
    const response = await http.get('/teacher/dashboard');
    return response.data.data;
}
