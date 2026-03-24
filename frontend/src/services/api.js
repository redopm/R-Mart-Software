import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
});

// Add a request interceptor to inject the Firebase token
api.interceptors.request.use(
    async (config) => {
        const user = auth.currentUser;
        if (user) {
            try {
                // getIdToken(false) = use cached token, only refresh if expired
                const token = await user.getIdToken(false);
                config.headers.Authorization = `Bearer ${token}`;
            } catch (tokenError) {
                console.error("Failed to get Firebase ID token:", tokenError);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// NO auto-logout on 401. Let the calling component handle the error message.
export default api;
