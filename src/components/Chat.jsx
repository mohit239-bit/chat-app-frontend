import React, { useEffect, useState, useRef, useCallback } from 'react'
import { MdAttachFile, MdSend, MdAutoAwesome, MdCheck, MdClose, MdRefresh } from 'react-icons/md'
import avatar from '../components/avatar.png'
import { useNavigate } from 'react-router-dom'
import useChatContext from '../context/ChatContext'
import SockJS from 'sockjs-client';
import { baseURL } from '../config/AxiosHelper'
import { Client } from '@stomp/stompjs';
import { toast } from 'react-toastify';
import { getMessages } from '../config/AxiosHelper';
import { timeAgo } from '../config/helper'
import { processDraftMessage, getReplySuggestions } from '../Service/AiService';

const Chat = () => {
    const { roomId, currentUser, connected, setRoomId, setCurrentUser, setConnected } = useChatContext();
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    
    // AI States
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [aiPreview, setAiPreview] = useState(null);
    const [isProcessingDraft, setIsProcessingDraft] = useState(false);

    const chatBoxRef = useRef(null);
    const stompClientRef = useRef(null);
    const draftAbortRef = useRef(null);
    const suggestionAbortRef = useRef(null);

    useEffect(() => {
        if (!connected) {
            navigate('/');
        }
    }, [connected, roomId, currentUser, navigate]);

    useEffect(() => {
        async function loadMessages() {
            try {
                const messagesData = await getMessages(roomId);
                setMessages(messagesData);
            } catch (e) {
                console.error("Error loading messages", e);
            }
        }
        if (connected && roomId) {
            loadMessages();
            fetchSuggestions();
        }
    }, [roomId, connected]);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scroll({
                top: chatBoxRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [messages]);

    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS(`${baseURL}/chat`),
            reconnectDelay: 5000,
        });

        client.onConnect = () => {
            console.log("Connected");
            toast.success("Connected");
            stompClientRef.current = client;

            client.subscribe(`/topic/room/${roomId}`, (message) => {
                const newMessage = JSON.parse(message.body);
                setMessages((prev) => [...prev, newMessage]);
            });
        };

        client.onStompError = (frame) => {
            console.error("Broker error:", frame);
            toast.error("Connection error");
        };

        client.activate();

        return () => {
            client.deactivate();
        };
    }, [roomId]);

    // Fetch reply suggestions
    const fetchSuggestions = useCallback(async () => {
        if (!roomId) return;
        
        if (suggestionAbortRef.current) {
            suggestionAbortRef.current.abort();
        }
        suggestionAbortRef.current = new AbortController();

        setLoadingSuggestions(true);
        try {
            const res = await getReplySuggestions(roomId, currentUser, suggestionAbortRef.current.signal);
            if (res && res.suggestions) {
                setSuggestions(res.suggestions);
            }
        } catch (err) {
            if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
                console.error("Failed to fetch reply suggestions", err);
            }
        } finally {
            setLoadingSuggestions(false);
        }
    }, [roomId, currentUser]);

    // Debounced Draft AI Processing (Translation / Grammar)
    useEffect(() => {
        const trimmed = input.trim();
        if (!trimmed || trimmed.length < 3) {
            setAiPreview(null);
            return;
        }

        if (draftAbortRef.current) {
            draftAbortRef.current.abort();
        }

        const timer = setTimeout(async () => {
            draftAbortRef.current = new AbortController();
            setIsProcessingDraft(true);
            try {
                const res = await processDraftMessage(trimmed, currentUser, draftAbortRef.current.signal);
                if (res && res.changed) {
                    setAiPreview(res);
                } else {
                    setAiPreview(null);
                }
            } catch (err) {
                if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
                    console.error("Draft processing error", err);
                }
            } finally {
                setIsProcessingDraft(false);
            }
        }, 800);

        return () => {
            clearTimeout(timer);
        };
    }, [input, currentUser]);

    const sendMessage = async () => {
        if (stompClientRef.current && connected && input.trim()) {
            const message = {
                sender: currentUser,
                content: input.trim(),
                roomId: roomId
            };

            stompClientRef.current.publish({
                destination: `/app/sendMessage/${roomId}`,
                body: JSON.stringify(message),
            });
            setInput('');
            setAiPreview(null);
        }
    };

    function handleLogout() {
        if (stompClientRef.current) {
            stompClientRef.current.deactivate();
        }
        setConnected(false);
        setRoomId('');
        setCurrentUser('');
        navigate('/');
    }

    const applySuggestion = (suggestionText) => {
        setInput(suggestionText);
    };

    const acceptAiPreview = () => {
        if (aiPreview && aiPreview.processedText) {
            setInput(aiPreview.processedText);
            setAiPreview(null);
        }
    };

    const rejectAiPreview = () => {
        setAiPreview(null);
    };

    return (
        <div className='flex flex-col h-screen dark:bg-gray-950 dark:text-gray-100'>
            {/* Header */}
            <header className='dark:border-gray-800 border-b w-full py-4 px-8 shadow flex justify-between items-center dark:bg-gray-900 z-10'>
                <div className='flex items-center gap-6'>
                    <h1 className='text-xl font-semibold'>Room: <span className='text-blue-400'>{roomId}</span></h1>
                    <h1 className='text-xl font-semibold'>User: <span className='text-green-400'>{currentUser}</span></h1>
                </div>
                <div className='flex items-center gap-3'>
                    <button 
                        onClick={fetchSuggestions} 
                        disabled={loadingSuggestions}
                        className='flex items-center gap-2 dark:bg-indigo-600 hover:dark:bg-indigo-700 px-4 py-2 rounded-full cursor-pointer text-sm font-medium transition disabled:opacity-50'
                    >
                        <MdAutoAwesome className={loadingSuggestions ? "animate-spin" : ""} />
                        {loadingSuggestions ? "Loading..." : "Suggest replies"}
                    </button>
                    <button 
                        onClick={handleLogout} 
                        className='dark:bg-red-600 hover:dark:bg-red-700 px-4 py-2 rounded-full cursor-pointer text-sm font-medium transition'
                    >
                        Leave Room
                    </button>
                </div>
            </header>

            {/* Chat Box */}
            <main
                ref={chatBoxRef}
                className="flex-1 py-6 px-10 w-full max-w-4xl mx-auto overflow-y-auto space-y-4"
            >
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${message.sender === currentUser ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`p-3 max-w-sm md:max-w-md rounded-2xl shadow ${
                                message.sender === currentUser 
                                    ? "bg-green-700 text-white rounded-br-none" 
                                    : "bg-gray-800 text-gray-100 rounded-bl-none"
                            }`}
                        >
                            <div className="flex flex-row gap-3 items-start">
                                <img
                                    className="h-8 w-8 rounded-full border border-gray-600 mt-1"
                                    src={avatar}
                                    alt="User avatar"
                                />
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs font-bold text-gray-300">{message.sender}</p>
                                    <p className="text-sm break-words">{message.content}</p>
                                    <p className="text-[10px] text-gray-400 text-right mt-1">{timeAgo(message.timeStamp)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </main>

            {/* Footer Container */}
            <div className='w-full max-w-4xl mx-auto pb-4 px-4 flex flex-col gap-2'>
                {/* AI Suggestions Pills */}
                {suggestions.length > 0 && (
                    <div className='flex flex-wrap items-center gap-2 px-2 py-1 bg-gray-900/80 border border-gray-800 rounded-xl'>
                        <span className='text-xs font-semibold text-indigo-400 flex items-center gap-1 px-1'>
                            <MdAutoAwesome /> AI Suggestions:
                        </span>
                        {suggestions.map((sug, i) => (
                            <button
                                key={i}
                                onClick={() => applySuggestion(sug)}
                                className='text-xs dark:bg-gray-800 hover:dark:bg-indigo-900/60 dark:border-gray-700 border text-gray-200 px-3 py-1.5 rounded-full transition text-left cursor-pointer'
                            >
                                {sug}
                            </button>
                        ))}
                    </div>
                )}

                {/* AI Preview Card for Draft Message */}
                {aiPreview && (
                    <div className='flex items-center justify-between p-3 dark:bg-slate-900 border dark:border-indigo-500/50 rounded-xl shadow-lg animate-fade-in'>
                        <div className='flex flex-col text-xs gap-1'>
                            <span className='font-semibold text-indigo-400 flex items-center gap-1'>
                                <MdAutoAwesome /> AI Enhancement ({aiPreview.action}):
                            </span>
                            <div className='text-gray-300'>
                                <span className='line-through text-gray-500 mr-2'>{aiPreview.originalText}</span>
                                <span className='text-green-400 font-medium'>{aiPreview.processedText}</span>
                            </div>
                        </div>
                        <div className='flex items-center gap-2 ml-4'>
                            <button
                                onClick={acceptAiPreview}
                                className='flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition font-medium cursor-pointer'
                            >
                                <MdCheck /> Use suggestion
                            </button>
                            <button
                                onClick={rejectAiPreview}
                                className='flex items-center gap-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1.5 rounded-lg transition cursor-pointer'
                            >
                                <MdClose /> Keep original
                            </button>
                        </div>
                    </div>
                )}

                {/* Input Bar */}
                <div className='h-14 flex items-center justify-between rounded-full w-full bg-gray-900 border border-gray-800 px-3 gap-3 shadow-lg'>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                sendMessage();
                            }
                        }}
                        type='text' 
                        placeholder={isProcessingDraft ? "AI checking draft..." : "Type your message here..."}
                        className='w-full bg-transparent px-4 text-sm text-gray-100 placeholder-gray-500 focus:outline-none'
                    />
                    <div className='flex gap-2 items-center'>
                        <button 
                            className='dark:bg-gray-800 hover:dark:bg-gray-700 text-gray-300 rounded-full cursor-pointer flex justify-center items-center h-9 w-9 transition'>
                            <MdAttachFile size={18} />
                        </button>
                        <button 
                            onClick={sendMessage}
                            disabled={!input.trim()}
                            className='dark:bg-green-600 hover:dark:bg-green-500 disabled:opacity-50 text-white rounded-full cursor-pointer flex justify-center items-center h-9 w-9 transition'>
                            <MdSend size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;