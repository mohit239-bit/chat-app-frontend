import { httpClient } from '../config/AxiosHelper';

export const createRoomApi = async (room) => {
    const response = await httpClient.post('/api/v1/rooms', room);
    return response.data;
};
