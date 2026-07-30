import { httpClient } from '../config/AxiosHelper';

export const processDraftMessage = async (message, userName, signal) => {
    const response = await httpClient.post(
        '/api/v1/ai/process-message',
        { message },
        {
            headers: {
                'X-Current-User': userName || 'Anonymous'
            },
            signal
        }
    );
    return response.data;
};

export const getReplySuggestions = async (roomId, userName, signal) => {
    const response = await httpClient.get(
        `/api/v1/ai/rooms/${roomId}/suggestions`,
        {
            headers: {
                'X-Current-User': userName || 'Anonymous'
            },
            signal
        }
    );
    return response.data;
};
