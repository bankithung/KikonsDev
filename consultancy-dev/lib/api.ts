import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('auth-token');
        if (token && config.headers) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest?._retry) {
            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refresh-token');

            if (!refreshToken) {
                // No refresh token, logout user
                localStorage.removeItem('auth-token');
                localStorage.removeItem('refresh-token');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                // Attempt to refresh the token
                const response = await axios.post(`${API_URL}token/refresh/`, {
                    refresh: refreshToken
                });

                const { access } = response.data;
                localStorage.setItem('auth-token', access);

                // Update the authorization header
                if (originalRequest.headers) {
                    originalRequest.headers['Authorization'] = `Bearer ${access}`;

                    // Fix for multipart/form-data: remove Content-Type header to let browser/axios generate it with correct boundary
                    // If we reuse the old header, it might have an incorrect boundary
                    if (originalRequest.headers['Content-Type']?.toString().includes('multipart/form-data')) {
                        delete originalRequest.headers['Content-Type'];
                    }
                }

                processQueue(null);
                isRefreshing = false;

                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                isRefreshing = false;

                // Refresh failed, logout user
                localStorage.removeItem('auth-token');
                localStorage.removeItem('refresh-token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);
