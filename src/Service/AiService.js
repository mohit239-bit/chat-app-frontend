import { httpClient } from '../config/AxiosHelper';

export const processDraftMessage = async (message, signal) => {
    const response = await httpClient.post(
        '/api/v1/ai/process-message',
        { message },
        {
            signal
        }
    );
    return response.data;
};

export const getReplySuggestions = async (roomId, signal) => {
    const response = await httpClient.get(
        `/api/v1/ai/rooms/${roomId}/suggestions`,
        {
            signal
        }
    );
    return response.data;
};
