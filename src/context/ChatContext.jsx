import { createContext, useContext } from "react";
import { useState } from "react";

const ChatContext = createContext();
const ACTIVE_ROOM_STORAGE_KEY = 'talkhub.activeRoomId';

const getSavedRoomId = () => {
    try {
        return window.localStorage.getItem(ACTIVE_ROOM_STORAGE_KEY) || '';
    } catch {
        return '';
    }
};

export const ChatProvider = ({children}) => {

    const[roomId, setRoomIdState] = useState(getSavedRoomId);
    const[currentUser, setCurrentUser] = useState('');
    const[connected, setConnected] = useState(() => Boolean(getSavedRoomId()));
    const[connectionStatus, setConnectionStatus] = useState(() => getSavedRoomId() ? 'connecting' : 'disconnected');

    const setRoomId = (nextRoomId) => {
        setRoomIdState(nextRoomId);
        try {
            if (nextRoomId) {
                window.localStorage.setItem(ACTIVE_ROOM_STORAGE_KEY, nextRoomId);
            } else {
                window.localStorage.removeItem(ACTIVE_ROOM_STORAGE_KEY);
            }
        } catch {
            // Room persistence is optional when browser storage is unavailable.
        }
    };

    return(
        <ChatContext.Provider 
            value = {{
                roomId,
                setRoomId,
                currentUser,
                setCurrentUser,
                connected,
                setConnected,
                connectionStatus,
                setConnectionStatus
            }}
        >
            {children}
        </ChatContext.Provider>
    )

};

const useChatContext = () => useContext(ChatContext);
// eslint-disable-next-line react-refresh/only-export-components
export default useChatContext;

    
