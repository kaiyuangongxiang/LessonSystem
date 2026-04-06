import http from './http';
export async function getPortalHome() {
    const response = await http.get('/portal/home');
    return response.data.data;
}
export async function getPortalPublicAssets(params) {
    const response = await http.get('/portal/assets', {
        params,
    });
    return response.data.data;
}
