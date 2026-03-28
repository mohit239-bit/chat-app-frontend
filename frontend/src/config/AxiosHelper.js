import axios from 'axios';
export const baseURL = 'http://localhost:8080';
export const httpClient = axios.create({
    baseURL: baseURL
});

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