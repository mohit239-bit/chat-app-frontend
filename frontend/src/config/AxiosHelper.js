import axios from 'axios';
export const baseURL = 'https://chatappbackend-07aq.onrender.com';
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