import axios from 'axios';
export const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const httpClient = axios.create({
    baseURL: baseURL,
    withCredentials: true,
});

let unauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
    unauthorizedHandler = handler;
};

httpClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) unauthorizedHandler?.();
        return Promise.reject(error);
    }
);

export const joinChatApi = async (roomId) => {
    const response = await httpClient.get(`/api/v1/rooms/${roomId}`);
    return response.data;
}

export const getMessages = async (roomId,size=50,page=0 ) => {
    const response = await httpClient.get(
        `/api/v1/rooms/${roomId}/messages?size=${size}&page=${page}`
    );
    return response.data;
}
