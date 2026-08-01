import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MdAttachFile,
  MdAutoAwesome,
  MdCheck,
  MdCheckCircle,
  MdClose,
  MdDelete,
  MdEdit,
  MdExitToApp,
  MdInsertEmoticon,
  MdLogout,
  MdMenu,
  MdMic,
  MdMoreVert,
  MdSearch,
  MdSend,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { toast } from 'react-toastify';
import useChatContext from '../context/ChatContext';
import { baseURL, getMessages } from '../config/AxiosHelper';
import { timeAgo } from '../config/helper';
import { getReplySuggestions, processDraftMessage } from '../Service/AiService';
import { useAuth } from '../context/AuthContext';

const Chat = () => {
  const { roomId, connected, connectionStatus, setRoomId, setCurrentUser, setConnected, setConnectionStatus } = useChatContext();
  const { user, logout, getWebSocketToken } = useAuth();
  const currentUser = user?.name || '';
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [isProcessingDraft, setIsProcessingDraft] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const chatBoxRef = useRef(null);
  const stompClientRef = useRef(null);
  const draftAbortRef = useRef(null);
  const suggestionAbortRef = useRef(null);

  const fetchSuggestions = useCallback(async () => {
    if (!roomId) return;
    suggestionAbortRef.current?.abort();
    suggestionAbortRef.current = new AbortController();
    setLoadingSuggestions(true);
    try {
      const response = await getReplySuggestions(roomId, suggestionAbortRef.current.signal);
      setSuggestions(response?.suggestions || []);
    } catch (error) {
      if (error.name !== 'CanceledError' && error.name !== 'AbortError') console.error('Failed to fetch reply suggestions', error);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (!connected || !roomId) navigate('/');
  }, [connected, navigate, roomId]);

  useEffect(() => {
    if (!connected || !roomId) return undefined;
    const loadMessages = async () => {
      try {
        setMessages(await getMessages(roomId));
      } catch (error) {
        console.error('Error loading messages', error);
      }
    };
    loadMessages();
    fetchSuggestions();
    return undefined;
  }, [roomId, connected, fetchSuggestions]);

  useEffect(() => {
    if (!connected || !roomId) return undefined;
    let active = true;
    setConnectionStatus('connecting');
    const client = new Client({
      webSocketFactory: () => new SockJS(`${baseURL}/chat`),
      reconnectDelay: 5000,
      beforeConnect: async () => {
        const token = await getWebSocketToken();
        client.connectHeaders = { Authorization: `Bearer ${token}` };
      },
    });
    client.onConnect = () => {
      if (!active) return;
      stompClientRef.current = client;
      setConnectionStatus('connected');
      client.subscribe(`/topic/room/${roomId}`, (message) => setMessages((current) => [...current, JSON.parse(message.body)]));
      client.subscribe(`/topic/room/${roomId}/events`, (event) => {
        const change = JSON.parse(event.body);
        if (change.type === 'UPDATED' && change.message) {
          setMessages((current) => current.map((message) => message.id === change.messageId ? change.message : message));
        }
        if (change.type === 'DELETED') {
          setMessages((current) => current.filter((message) => message.id !== change.messageId));
          setEditingMessageId((current) => current === change.messageId ? null : current);
        }
      });
    };
    client.onStompError = (frame) => {
      console.error('Broker error:', frame);
      if (active) setConnectionStatus('reconnecting');
      toast.error('Connection error');
    };
    client.onWebSocketClose = () => {
      if (active) setConnectionStatus('reconnecting');
    };
    client.activate();
    return () => {
      active = false;
      client.deactivate();
    };
  }, [roomId, connected, getWebSocketToken, setConnectionStatus]);

  useEffect(() => {
    chatBoxRef.current?.scrollTo({ top: chatBoxRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const trimmed = input.trim();
    if (trimmed.length < 3) {
      setAiPreview(null);
      return undefined;
    }
    draftAbortRef.current?.abort();
    const timer = setTimeout(async () => {
      draftAbortRef.current = new AbortController();
      setIsProcessingDraft(true);
      try {
        const response = await processDraftMessage(trimmed, draftAbortRef.current.signal);
        setAiPreview(response?.changed ? response : null);
      } catch (error) {
        if (error.name !== 'CanceledError' && error.name !== 'AbortError') console.error('Draft processing error', error);
      } finally {
        setIsProcessingDraft(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [input]);

  const sendMessage = () => {
    if (!stompClientRef.current || !connected || connectionStatus !== 'connected' || !input.trim()) return;
    stompClientRef.current.publish({
      destination: `/app/sendMessage/${roomId}`,
      body: JSON.stringify({ content: input.trim(), roomId }),
    });
    setInput('');
    setAiPreview(null);
  };

  const startEditing = (message) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const saveEdit = (messageId) => {
    const content = editingContent.trim();
    if (!stompClientRef.current || connectionStatus !== 'connected' || !content) return;
    stompClientRef.current.publish({
      destination: `/app/editMessage/${roomId}/${messageId}`,
      body: JSON.stringify({ content }),
    });
    cancelEditing();
  };

  const deleteMessage = (messageId) => {
    if (!stompClientRef.current || connectionStatus !== 'connected' || !window.confirm('Delete this message for everyone?')) return;
    stompClientRef.current.publish({
      destination: `/app/deleteMessage/${roomId}/${messageId}`,
      body: '',
    });
  };

  const disconnectFromRoom = () => {
    stompClientRef.current?.deactivate();
    setConnected(false);
    setConnectionStatus('disconnected');
    setRoomId('');
    setCurrentUser('');
  };

  const handleLeave = () => {
    disconnectFromRoom();
    navigate('/');
  };

  const handleLogout = async () => {
    disconnectFromRoom();
    await logout();
    navigate('/login');
  };

  const initials = currentUser?.slice(0, 2).toUpperCase() || 'ME';
  const statusCopy = {
    connecting: 'Connecting…',
    connected: 'Connected',
    reconnecting: 'Reconnecting…',
    disconnected: 'Offline',
  }[connectionStatus] || 'Offline';
  const statusColor = connectionStatus === 'connected' ? 'bg-emerald-500' : connectionStatus === 'disconnected' ? 'bg-slate-400' : 'bg-amber-400';

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-indigo-100 via-slate-50 to-violet-100 p-0 text-slate-900 md:p-4">
      {isSidebarOpen && <button type="button" aria-label="Close menu" onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm md:hidden" />}

      <aside className={`fixed inset-y-0 left-0 z-50 m-0 flex w-72 flex-col rounded-r-2xl border border-white/40 bg-white/80 shadow-xl backdrop-blur-xl transition-transform duration-300 md:static md:m-0 md:mr-2 md:translate-x-0 md:rounded-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-slate-200/70 p-4">
          <div className="flex items-center gap-2 text-blue-500">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20"><MdAutoAwesome size={18} /></div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">ChatSync</h1>
          </div>
          <button type="button" onClick={() => setIsSidebarOpen(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 md:hidden"><MdClose size={19} /></button>
        </div>

        <div className="p-4 pb-2">
          <div className="group relative">
            <MdSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={17} />
            <input type="text" placeholder="Search chats..." className="w-full rounded-xl border border-slate-200/70 bg-slate-100/70 py-2 pl-9 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-blue-400/40" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="flex cursor-default items-center gap-3 rounded-xl bg-slate-100 p-3 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500 text-lg font-semibold text-white">#</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2"><h2 className="truncate font-medium text-slate-900">{roomId || 'General'}</h2><span className="text-xs font-medium text-blue-500">Active</span></div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><span className={`h-2 w-2 rounded-full ${statusColor} ${connectionStatus !== 'connected' && connectionStatus !== 'disconnected' ? 'animate-pulse' : ''}`} />{statusCopy}</p>
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-slate-200/70 p-4">
          <div className="flex min-w-0 items-center gap-3">
            {user?.profilePicture ? <img src={user.profilePicture} alt="Your profile" className="h-9 w-9 shrink-0 rounded-full border border-white object-cover shadow-sm" /> : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 text-xs font-bold text-white">{initials}</div>}
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{currentUser || 'My Profile'}</p><p className={`text-xs font-medium ${connectionStatus === 'connected' ? 'text-emerald-500' : 'text-slate-500'}`}>{statusCopy}</p></div>
          </div>
          <button type="button" onClick={handleLogout} title="Log out" className="rounded-full p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"><MdLogout size={19} /></button>
        </div>
      </aside>

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden border border-slate-200/70 bg-slate-50/70 shadow-2xl shadow-slate-200/30 backdrop-blur-sm md:rounded-2xl">
        <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/75 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsSidebarOpen(true)} className="-ml-2 rounded-full p-2 text-slate-500 hover:bg-slate-100 md:hidden"><MdMenu size={21} /></button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-lg font-bold text-white shadow-sm">#</div>
            <div><h2 className="font-semibold text-slate-900">Room: {roomId || 'General'}</h2><div className="flex items-center gap-1.5 text-xs text-slate-500"><span className={`h-2 w-2 rounded-full ${statusColor} ${connectionStatus !== 'disconnected' ? 'animate-pulse' : ''}`} />{statusCopy}</div></div>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={fetchSuggestions} disabled={loadingSuggestions} title="Suggest replies" className="rounded-full p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-500 disabled:opacity-50"><MdAutoAwesome className={loadingSuggestions ? 'animate-spin' : ''} size={20} /></button>
            <button type="button" onClick={handleLeave} title="Leave room" className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><MdExitToApp size={20} /></button>
            <button type="button" title="Search" className="hidden rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 sm:block"><MdSearch size={20} /></button>
            <button type="button" title="More options" className="hidden rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 sm:block"><MdMoreVert size={20} /></button>
          </div>
        </header>

        <section ref={chatBoxRef} className="no-scrollbar flex-1 overflow-y-auto p-4 pb-2 sm:p-6">
          <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-end">
            {messages.map((message, index) => {
              const isMine = message.senderId ? message.senderId === user?.id : message.sender === currentUser;
              const canManage = message.senderId === user?.id && Boolean(message.id);
              const isEditing = editingMessageId === message.id;
              return <article key={message.id || index} className={`mb-4 flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] gap-2 md:max-w-[70%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMine && <div className="mt-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-white shadow-sm">{message.sender?.[0]?.toUpperCase() || 'U'}</div>}
                  <div className="flex flex-col">
                    {!isMine && <span className="mb-1 ml-2 text-xs text-slate-500">{message.sender}</span>}
                    <div className={`relative rounded-2xl px-4 py-2.5 shadow-sm ${isMine ? 'rounded-br-sm bg-blue-500 text-white' : 'rounded-bl-sm border border-slate-100 bg-white text-slate-900'}`}>
                      {canManage && !isEditing && <div className={`absolute -top-9 flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-md ${isMine ? 'right-0' : 'left-0'}`}><button type="button" onClick={() => startEditing(message)} title="Edit message" className="rounded p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600"><MdEdit size={15} /></button><button type="button" onClick={() => deleteMessage(message.id)} title="Delete message" className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"><MdDelete size={15} /></button></div>}
                      {isEditing ? <div className="min-w-52"><textarea autoFocus value={editingContent} onChange={(event) => setEditingContent(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') cancelEditing(); if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); saveEdit(message.id); } }} maxLength={1000} className="w-full resize-none rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300" rows={2} /><div className="mt-2 flex justify-end gap-2"><button type="button" onClick={cancelEditing} className="rounded-md bg-blue-400 px-2 py-1 text-xs font-medium text-white hover:bg-blue-500">Cancel</button><button type="button" onClick={() => saveEdit(message.id)} disabled={!editingContent.trim()} className="rounded-md bg-white px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50">Save</button></div></div> : <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{message.content}</p>}
                      <div className={`mt-1 flex items-center gap-1 text-[10px] ${isMine ? 'justify-end text-blue-100' : 'text-slate-400'}`}><span>{timeAgo(message.timeStamp)}</span>{message.updatedAt && <span>Edited</span>}{isMine && <MdCheckCircle size={13} className="text-blue-100" />}</div>
                    </div>
                  </div>
                </div>
              </article>;
            })}
          </div>
        </section>

        <div className="shrink-0 p-4 pt-2">
          <div className="mx-auto flex max-w-4xl flex-col gap-2">
            {suggestions.length > 0 && <div className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-white/80 p-2 shadow-sm"><span className="flex items-center gap-1 px-1 text-xs font-semibold text-blue-500"><MdAutoAwesome />AI suggestions</span>{suggestions.map((suggestion, index) => <button key={`${suggestion}-${index}`} type="button" onClick={() => setInput(suggestion)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-left text-xs text-slate-600 transition hover:border-blue-200 hover:bg-blue-50">{suggestion}</button>)}</div>}
            {aiPreview && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200/70 bg-indigo-50/80 p-3 text-xs shadow-sm"><div><span className="flex items-center gap-1 font-semibold text-blue-600"><MdAutoAwesome />AI enhancement ({aiPreview.action})</span><p className="mt-1 text-slate-600"><span className="mr-2 text-slate-400 line-through">{aiPreview.originalText}</span><span className="font-medium text-emerald-600">{aiPreview.processedText}</span></p></div><div className="flex gap-2"><button type="button" onClick={() => { setInput(aiPreview.processedText); setAiPreview(null); }} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 font-medium text-white"><MdCheck />Use</button><button type="button" onClick={() => setAiPreview(null)} className="inline-flex items-center gap-1 rounded-lg bg-slate-200 px-3 py-1.5 font-medium text-slate-600"><MdClose />Keep</button></div></div>}
            <div className="flex items-end gap-2 rounded-3xl border border-slate-200/80 bg-white/85 p-1.5 shadow-sm transition focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-300/30">
              <div className="flex shrink-0 gap-1 pb-1.5 pl-2"><button type="button" title="Emoji" className="rounded-full p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-500"><MdInsertEmoticon size={20} /></button><button type="button" title="Attach file" className="hidden rounded-full p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-500 sm:block"><MdAttachFile size={20} /></button></div>
              <input value={input} disabled={connectionStatus !== 'connected'} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); sendMessage(); } }} placeholder={connectionStatus !== 'connected' ? statusCopy : isProcessingDraft ? 'AI checking draft...' : 'Type a message...'} className="min-h-10 flex-1 bg-transparent px-2 py-2.5 text-[15px] text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60" />
              <div className="flex shrink-0 gap-1 pb-1.5 pr-1.5">{input.trim() ? <button type="button" disabled={connectionStatus !== 'connected'} onClick={sendMessage} className="rounded-full bg-blue-500 p-3 text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"><MdSend size={18} /></button> : <button type="button" title="Voice message" className="rounded-full p-3 text-slate-400 transition hover:bg-blue-50 hover:text-blue-500"><MdMic size={20} /></button>}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;
