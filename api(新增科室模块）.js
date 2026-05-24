const API_BASE = '/api';

async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        ...options,
    };

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, message: '网络请求失败' };
    }
}

const api = {
    auth: {
        register: (data) => request('/auth/register', { method: 'POST', body: data }),
        login: (data) => request('/auth/login', { method: 'POST', body: data }),
        logout: () => request('/auth/logout', { method: 'POST' }),
        currentUser: () => request('/auth/current-user'),
        updateProfile: (data) => request('/auth/update-profile', { method: 'POST', body: data }),
    },
    departments: {
        list: () => request('/departments'),
        create: (data) => request('/departments', { method: 'POST', body: data }),
        update: (id, data) => request(`/departments/${id}`, { method: 'PUT', body: data }),
        delete: (id) => request(`/departments/${id}`, { method: 'DELETE' }),
    }
};