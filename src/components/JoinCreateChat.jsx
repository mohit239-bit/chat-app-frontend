import { useState } from 'react';
import { MdArrowForward, MdChatBubbleOutline, MdTag, MdAdd } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { createRoomApi } from '../Service/RoomService';
import { joinChatApi } from '../config/AxiosHelper';
import useChatContext from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

const FloatingOrbs = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
    <div className="animate-float-slow absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)' }} />
    <div className="animate-float-slow absolute -top-20 -right-24 h-[350px] w-[350px] rounded-full opacity-25 blur-3xl" style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)', animationDelay: '-7s' }} />
    <div className="animate-float-slow absolute -bottom-40 -left-20 h-[380px] w-[380px] rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #c084fc 0%, transparent 70%)', animationDelay: '-13s' }} />
    <div className="animate-float-slow absolute top-1/2 -right-40 h-[280px] w-[280px] rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', animationDelay: '-4s' }} />
  </div>
);

const InputField = ({ label, name, icon, value, onChange, placeholder, error, disabled }) => (
  <div className="space-y-1.5">
    <label htmlFor={name} className="block text-sm font-semibold tracking-wide text-text-primary">{label}</label>
    <div className="relative">
      <span className={`pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 ${error ? 'text-red-500' : 'text-text-muted'}`}>{icon}</span>
      <input
        id={name}
        name={name}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className={`focus-ring w-full rounded-xl border bg-white/80 py-3.5 pl-11 pr-4 text-sm font-medium text-text-primary transition-all placeholder:text-text-muted/60 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-red-400' : 'border-primary-100 hover:border-primary-300 focus:border-primary-400'}`}
      />
    </div>
    {error && <p className="text-xs font-medium text-red-500">{error}</p>}
  </div>
);

const JoinCreateChat = () => {
  const [detail, setDetail] = useState({ roomId: '' });
  const [errors, setErrors] = useState({});
  const [loadingAction, setLoadingAction] = useState(null);
  const navigate = useNavigate();
  const { setRoomId, setCurrentUser, setConnected } = useChatContext();
  const { user } = useAuth();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setDetail((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!detail.roomId.trim()) nextErrors.roomId = 'Please enter a room ID.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const completeConnection = (room) => {
    setCurrentUser(user.name);
    setRoomId(room.roomId);
    setConnected(true);
    navigate('/chat');
  };

  const joinChat = async () => {
    if (!validate()) return;
    setLoadingAction('join');
    try {
      const room = await joinChatApi(detail.roomId.trim());
      toast.success('Joined room successfully');
      completeConnection(room);
    } catch (error) {
      toast.error(error.response?.status === 400 ? error.response.data : 'Error joining room');
    } finally {
      setLoadingAction(null);
    }
  };

  const createRoom = async () => {
    if (!validate()) return;
    setLoadingAction('create');
    try {
      const room = await createRoomApi({ roomId: detail.roomId.trim() });
      toast.success('Room created successfully');
      completeConnection(room);
    } catch (error) {
      toast.error(error.response?.status === 400 ? 'Room already exists' : 'Error creating room');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-primary-50/40 to-accent-400/10 px-4 sm:px-6">
      <FloatingOrbs />
      <main className="relative z-10 flex w-full max-w-lg flex-col items-center py-12">
        <div className="mb-2 text-center animate-fade-in-up">
          <h1 className="text-5xl font-black tracking-tight sm:text-6xl"><span className="bg-gradient-to-r from-primary-700 via-primary-500 to-accent-500 bg-clip-text text-transparent">TALK</span><span className="text-text-primary">HUB</span></h1>
        </div>
        <p className="mb-10 max-w-sm text-center text-base font-medium leading-relaxed text-text-secondary/80 animate-fade-in-up delay-200 sm:text-lg">Connect instantly. Create rooms. Chat seamlessly.</p>
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center animate-fade-in-up delay-300"><MdChatBubbleOutline className="animate-float h-16 w-16 text-primary-500 drop-shadow-lg" /></div>
          <section className="glass-card rounded-2xl p-8 transition-transform duration-500 ease-out hover:scale-[1.015] animate-fade-in-up delay-400 sm:p-10" aria-label="Create or join a chat room">
            <div className="space-y-5">
              <InputField label="Room ID" name="roomId" icon={<MdTag size={19} />} value={detail.roomId} onChange={handleChange} placeholder="Enter Room ID" error={errors.roomId} disabled={loadingAction !== null} />
            </div>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button type="button" onClick={createRoom} disabled={loadingAction !== null} className="focus-ring inline-flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 px-6 py-3.5 text-sm font-semibold tracking-wide text-white shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:pointer-events-none disabled:opacity-50">
                <MdAdd size={18} />{loadingAction === 'create' ? 'Creating...' : 'Create Room'}
              </button>
              <button type="button" onClick={joinChat} disabled={loadingAction !== null} className="focus-ring inline-flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border-2 border-primary-200 bg-white px-6 py-3.5 text-sm font-semibold tracking-wide text-text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md disabled:pointer-events-none disabled:opacity-50">
                <MdArrowForward size={18} />{loadingAction === 'join' ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          </section>
        </div>
        <footer className="mt-12 pb-8 text-center animate-fade-in-up delay-700"><p className="text-sm font-medium tracking-wide text-text-muted/70">Built for seamless conversations.</p></footer>
      </main>
    </div>
  );
};

export default JoinCreateChat;
